# StackMap Sync Architecture
*Claude-readable technical specification - Last updated: 2025-08-14*

## Sync System Overview
**Type**: Zero-knowledge end-to-end encrypted sync
**Architecture**: Client-side encryption with dumb server storage
**Protocol**: HTTPS REST API with JSON payloads
**Server**: PHP backend at stackmap.app/sync/api/

## Core Components

### Service Modules
```
src/services/sync/
├── syncService.js         # Main orchestrator
├── encryptionService.js   # Crypto operations
├── dataValidator.js       # Data integrity
├── conflictResolver.js    # Merge strategies
├── changeTracker.js       # Change detection
├── networkMonitor.js      # Connection management
├── syncQueue.js          # Operation queue
├── syncThrottle.js       # Rate limiting
└── syncHistory.js        # Event logging
```

## Encryption Architecture

### Key Derivation
```javascript
// CRITICAL: Never change these parameters
PBKDF2_ITERATIONS = 100000  // Security standard
SALT_LENGTH = 16            // Bytes
KEY_LENGTH = 32             // 256-bit key

// Key generation from recovery phrase
deriveKey(recoveryPhrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return crypto.subtle.derivePbkdf2(
    recoveryPhrase,
    salt,
    100000,  // NEVER CHANGE
    'SHA-256'
  );
}
```

### Encryption Process
```javascript
// AES-256-GCM encryption
encrypt(data, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data))
  );
  
  return {
    iv: base64(iv),
    data: base64(encrypted),
    tag: base64(authTag)
  };
}
```

### Recovery Phrase Format
- **Length**: 32 hexadecimal characters
- **Format**: Lowercase, no spaces
- **Example**: `a1b2c3d4e5f6789012345678901234567`
- **Generation**: Cryptographically secure random
- **Storage**: Never on server, only client

## Sync Protocol

### API Endpoints
```
POST /sync/api/sync.php       # Upload/download sync data
GET  /sync/api/health.php     # Service health check
POST /sync/api/delete.php     # Delete sync data
POST /sync/api/cleanup.php    # Remove old data
```

### Request Format
```javascript
// Upload request
{
  syncKey: string,      // Hashed recovery phrase
  encryptedData: {
    iv: string,         // Base64 initialization vector
    data: string,       // Base64 encrypted payload
    tag: string         // Base64 auth tag
  },
  timestamp: ISO8601,
  checksum: string,     // SHA-256 of plaintext
  version: 3           // Data format version
}

// Download request
{
  syncKey: string      // Hashed recovery phrase
}
```

### Response Format
```javascript
// Success response
{
  success: true,
  data: {
    encryptedData: {...},
    timestamp: ISO8601,
    checksum: string
  }
}

// Error response
{
  success: false,
  error: string,
  code: number
}
```

## Data Synchronization Flow

### Initial Sync Setup
```javascript
1. Generate recovery phrase (32 hex chars)
2. Derive encryption key (PBKDF2)
3. Hash recovery phrase for server ID
4. Store recovery phrase locally
5. Enable sync in app state
```

### Upload Process
```javascript
async uploadSync() {
  // 1. Validate local state
  const isValid = await dataValidator.validate(localState);
  if (!isValid) throw new Error('Invalid state');
  
  // 2. Track changes
  const changes = changeTracker.getChanges();
  if (!changes.hasChanges) return;
  
  // 3. Prepare sync data
  const syncData = {
    users: state.users,
    currentUser: state.currentUser,
    library: state.library,
    settings: state.settings,
    timestamp: new Date().toISOString()
  };
  
  // 4. Encrypt data
  const encrypted = await encryptionService.encrypt(syncData, key);
  
  // 5. Upload to server
  const response = await fetch('/sync/api/sync.php', {
    method: 'POST',
    body: JSON.stringify({
      syncKey: hashedPhrase,
      encryptedData: encrypted,
      timestamp: syncData.timestamp,
      checksum: sha256(syncData)
    })
  });
  
  // 6. Update sync state
  updateLastSyncTime(syncData.timestamp);
  clearChangeTracker();
}
```

### Download Process
```javascript
async downloadSync() {
  // 1. Fetch from server
  const response = await fetch('/sync/api/sync.php', {
    method: 'GET',
    body: JSON.stringify({ syncKey: hashedPhrase })
  });
  
  // 2. Decrypt data
  const decrypted = await encryptionService.decrypt(
    response.data.encryptedData,
    key
  );
  
  // 3. Validate data
  const isValid = await dataValidator.validate(decrypted);
  if (!isValid) throw new Error('Corrupted sync data');
  
  // 4. Check for conflicts
  const conflicts = conflictResolver.detectConflicts(localState, decrypted);
  
  // 5. Resolve conflicts
  const merged = conflictResolver.resolve(
    localState,
    decrypted,
    'lastWriteWins'  // Strategy
  );
  
  // 6. Update local state
  setState(merged);
  
  // 7. Update sync metadata
  updateLastSyncTime(decrypted.timestamp);
}
```

## Conflict Resolution

### Detection Strategy
```javascript
detectConflicts(local, remote) {
  const conflicts = [];
  
  // Check timestamp divergence
  if (local.timestamp !== remote.timestamp) {
    // Compare individual entities
    for (const userId in local.users) {
      const localUser = local.users[userId];
      const remoteUser = remote.users[userId];
      
      if (localUser.lastModified !== remoteUser.lastModified) {
        conflicts.push({
          type: 'user',
          id: userId,
          local: localUser,
          remote: remoteUser
        });
      }
    }
  }
  
  return conflicts;
}
```

### Resolution Strategies
```javascript
// Last Write Wins (default)
lastWriteWins(local, remote) {
  return local.lastModified > remote.lastModified ? local : remote;
}

// Merge (combine both)
merge(local, remote) {
  return {
    ...remote,
    ...local,
    activities: [...new Set([...local.activities, ...remote.activities])],
    lastModified: Math.max(local.lastModified, remote.lastModified)
  };
}

// Local Priority
localPriority(local, remote) {
  return local;
}

// Remote Priority
remotePriority(local, remote) {
  return remote;
}
```

## Change Tracking

### Change Detection
```javascript
class ChangeTracker {
  constructor() {
    this.baseline = null;
    this.changes = new Set();
  }
  
  setBaseline(state) {
    this.baseline = JSON.stringify(state);
  }
  
  detectChanges(currentState) {
    const current = JSON.stringify(currentState);
    if (current !== this.baseline) {
      // Deep diff to find specific changes
      const diff = deepDiff(this.baseline, current);
      diff.forEach(change => this.changes.add(change.path));
    }
    return this.changes.size > 0;
  }
  
  getChangedPaths() {
    return Array.from(this.changes);
  }
  
  clear() {
    this.changes.clear();
    this.baseline = null;
  }
}
```

## Sync Queue Management

### Queue Operations
```javascript
class SyncQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.retryCount = {};
  }
  
  async add(operation) {
    this.queue.push({
      id: generateId(),
      operation,
      timestamp: Date.now(),
      attempts: 0
    });
    
    if (!this.processing) {
      await this.process();
    }
  }
  
  async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      
      try {
        await item.operation();
        delete this.retryCount[item.id];
      } catch (error) {
        item.attempts++;
        
        if (item.attempts < MAX_RETRIES) {
          // Exponential backoff
          const delay = Math.pow(2, item.attempts) * 1000;
          setTimeout(() => this.queue.push(item), delay);
        } else {
          console.error('Max retries reached:', error);
        }
      }
    }
    
    this.processing = false;
  }
}
```

## Throttling & Rate Limiting

### Client-Side Throttling
```javascript
class SyncThrottle {
  constructor() {
    this.lastSync = 0;
    this.minInterval = 5000;  // 5 seconds minimum
    this.maxBurst = 3;        // Max rapid syncs
    this.burstCount = 0;
    this.burstReset = null;
  }
  
  canSync() {
    const now = Date.now();
    
    // Check minimum interval
    if (now - this.lastSync < this.minInterval) {
      return false;
    }
    
    // Check burst limit
    if (this.burstCount >= this.maxBurst) {
      if (!this.burstReset || now < this.burstReset) {
        return false;
      }
      // Reset burst counter
      this.burstCount = 0;
      this.burstReset = null;
    }
    
    return true;
  }
  
  recordSync() {
    const now = Date.now();
    this.lastSync = now;
    this.burstCount++;
    
    if (!this.burstReset) {
      this.burstReset = now + 60000;  // Reset after 1 minute
    }
  }
}
```

## Network Monitoring

### Connection Management
```javascript
class NetworkMonitor {
  constructor() {
    this.isOnline = true;
    this.listeners = new Set();
    this.setupListeners();
  }
  
  setupListeners() {
    // Web platform
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnline(true));
      window.addEventListener('offline', () => this.setOnline(false));
    }
    
    // React Native (disabled on iOS due to freezing)
    if (Platform.OS === 'android') {
      NetInfo.addEventListener(state => {
        this.setOnline(state.isConnected);
      });
    }
  }
  
  setOnline(status) {
    this.isOnline = status;
    this.notifyListeners(status);
    
    if (status) {
      // Trigger sync on reconnection
      syncService.syncIfNeeded();
    }
  }
}
```

## Data Validation

### Validation Rules
```javascript
const validationSchema = {
  users: {
    required: true,
    type: 'object',
    properties: {
      id: { type: 'string', pattern: /^user_\d+_\d+$/ },
      name: { type: 'string', minLength: 1 },
      icon: { type: 'string', minLength: 1 },
      days: {
        type: 'object',
        properties: {
          today: { type: 'object' },
          tomorrow: { type: 'object' }
        }
      }
    }
  },
  currentUser: {
    required: true,
    type: 'string'
  },
  version: {
    required: true,
    type: 'number',
    minimum: 3
  }
};

// Auto-repair function
function autoRepair(data) {
  // Fix missing currentUser
  if (!data.currentUser && data.users) {
    data.currentUser = Object.keys(data.users)[0];
  }
  
  // Fix missing user fields
  Object.values(data.users).forEach(user => {
    if (!user.days) user.days = { today: { activities: [] }, tomorrow: { activities: [] } };
    if (!user.settings) user.settings = {};
    if (!user.icon) user.icon = '👤';
  });
  
  return data;
}
```

## Error Handling

### Error Categories
```javascript
const ErrorTypes = {
  NETWORK_ERROR: 'Network connection failed',
  ENCRYPTION_ERROR: 'Encryption/decryption failed',
  VALIDATION_ERROR: 'Data validation failed',
  CONFLICT_ERROR: 'Sync conflict detected',
  SERVER_ERROR: 'Server returned error',
  QUOTA_ERROR: 'Storage quota exceeded',
  AUTH_ERROR: 'Invalid sync key'
};

// Error recovery strategies
const errorRecovery = {
  NETWORK_ERROR: () => {
    // Queue for retry when online
    syncQueue.add(currentOperation);
  },
  
  ENCRYPTION_ERROR: () => {
    // Disable sync, notify user
    disableSync();
    showError('Sync encryption failed. Please check your recovery phrase.');
  },
  
  VALIDATION_ERROR: (data) => {
    // Attempt auto-repair
    const repaired = autoRepair(data);
    if (validate(repaired)) {
      return repaired;
    }
    throw new Error('Data corruption beyond repair');
  }
};
```

## Performance Optimization

### Sync Optimization Strategies
1. **Incremental Sync**: Only sync changed data (planned)
2. **Compression**: Gzip before encryption (reduces ~70%)
3. **Batching**: Group rapid changes into single sync
4. **Caching**: Store encrypted blob for quick comparison
5. **Background Sync**: Use service worker on web

### Current Performance Metrics
- **Sync payload size**: ~4KB average (compressed)
- **Encryption time**: <100ms for typical data
- **Network request**: <1s on good connection
- **Total sync time**: <3s typical
- **Sync frequency**: Max 1 per 5 seconds

## Security Considerations

### Security Measures
1. **Zero-knowledge**: Server never sees plaintext
2. **PBKDF2**: 100,000 iterations (industry standard)
3. **AES-256-GCM**: Military-grade encryption
4. **HTTPS only**: TLS 1.2+ required
5. **No metadata**: Server stores only encrypted blob

### Security Best Practices
- Never log recovery phrases
- Clear sensitive data from memory
- Use crypto.getRandomValues() for randomness
- Validate all decrypted data
- Implement rate limiting
- Regular security audits

## Testing Sync System

### Test Scenarios
- [ ] Initial sync setup
- [ ] Upload with no remote data
- [ ] Download with no local data
- [ ] Conflict resolution (all strategies)
- [ ] Network interruption recovery
- [ ] Corrupted data handling
- [ ] Large dataset sync
- [ ] Rapid change sync
- [ ] Multi-device sync
- [ ] Recovery phrase validation

### Test Data Sets
```javascript
// Minimal test data
const minimalData = {
  users: { user_1: minimalUser },
  currentUser: 'user_1',
  version: 3
};

// Large test data (stress test)
const largeData = {
  users: generate100Users(),
  currentUser: 'user_1',
  library: generateLargeLibrary(),
  version: 3
};

// Corrupted test data
const corruptedData = {
  users: null,  // Missing required field
  version: 2    // Old version
};
```

## Known Issues & Limitations

### Current Limitations
1. **Full sync only**: No incremental sync yet
2. **Single device conflict**: No multi-device merge
3. **No offline queue**: Changes lost if sync fails
4. **No sync history UI**: Limited visibility
5. **No selective sync**: All or nothing

### Platform-Specific Issues
- **iOS**: NetInfo disabled due to freezing
- **Android**: Background sync limited by OS
- **Web**: Service worker not implemented

## Future Enhancements

### Planned Features
1. **Incremental sync** using diff patches
2. **Multi-device presence** awareness
3. **Sync history viewer** in UI
4. **Selective sync** for specific data
5. **Offline sync queue** with persistence
6. **Compression** before encryption
7. **WebSocket** for real-time sync
8. **Backup/restore** separate from sync

### Under Consideration
- End-to-end encrypted backup service
- Peer-to-peer sync option
- Sync analytics (privacy-preserving)
- Automatic conflict resolution UI
- Sync performance monitoring