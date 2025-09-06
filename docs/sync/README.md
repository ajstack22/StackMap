# StackMap Sync System - Complete Technical Documentation

## Quick Start for LLM Developers

### What This System Does
StackMap implements a **zero-knowledge, encrypted sync system** that enables real-time data synchronization across devices without server access to user data. Think of it as a privacy-first alternative to Firebase/iCloud sync.

### Core Concepts in 30 Seconds
- **Zero-Knowledge**: Server stores encrypted blobs only - never sees plaintext
- **Recovery Phrase**: 32-char hex string generates all crypto keys client-side  
- **Invite Codes**: Temporary 8-char codes (XXXX-XXXX) for secure sharing
- **Unified Format**: `ABCD-1234#recoveryPhrase` for both sync and share
- **Conflict Resolution**: Last-write-wins at field level with 3-second merge window
- **Real-time Sync**: Push on change, 30-second periodic pull
- **No User Accounts**: Authentication via cryptographic proof only

## Architecture Overview

### System Components
```
Frontend (React Native/Web)
├── minimalSyncService.js - Simplified sync orchestrator
├── encryptionServiceFixed.ts - TweetNaCl crypto (iOS-fixed UTF-8)  
├── syncStoreIntegration.js - Zustand store bridge
├── conflictResolver.js - Field-level merge logic
└── debugSync.js - Debug utilities

Backend (PHP/MySQL - Zero Knowledge)
├── create_timestamp.php - Initialize sync group
├── push_timestamp.php - Store encrypted blob with timestamps
├── pull_timestamp.php - Retrieve encrypted blob since timestamp
├── join_timestamp.php - Join existing sync group
├── create_invite.php - Generate temporary invite codes
├── validate_invite.php - Check invite code validity
├── use_invite.php - Mark invite as used after join
├── create_share.php - Create time-limited share links (V3)
├── access_share.php - Access shared data (V3)
└── MySQL: sync_data + sync_invites tables
```

### Data Flow

#### Push Flow (Device → Server)
```javascript
1. User action → Zustand store update
2. Store observer triggers sync
3. Gather data from 4 stores (users, library, settings, app)
4. Normalize fields: {text, icon} not {name/title, emoji}
5. Derive key using nacl.hash iterations (not PBKDF2)
6. Encrypt: nacl.secretbox(data, nonce, key)
7. POST to server: {sync_id, encrypted_blob, timestamp}
8. Server stores blob (knows nothing about contents)
```

#### Pull Flow (Server → Device)
```javascript
1. 30-second periodic pull OR manual trigger
2. Server returns encrypted blob + metadata
3. Decrypt: nacl.secretbox.open(blob, nonce, key)
4. Validate & repair data structure
5. Resolve conflicts (field timestamps, 3-sec window)
6. Update Zustand stores via specific methods
7. UI re-renders from store changes
```

## Implementation Guide

### 1. Setting Up Sync (Frontend)

```javascript
// Initialize sync with recovery phrase
import minimalSyncService from './services/sync/minimalSyncService';

// Generate or use existing recovery phrase
const recoveryPhrase = generateRecoveryPhrase(); // 32 hex chars

// Create new sync with invite code
await minimalSyncService.enable(recoveryPhrase);
const invite = await minimalSyncService.createInviteCode(24, 5); // 24h, 5 uses
console.log(`Share this: ${invite.inviteCode}#${recoveryPhrase}`);

// Join existing sync with invite code
const inviteString = 'ABCD-1234#recoveryPhrase';
const [inviteCode, phrase] = inviteString.split('#');
await minimalSyncService.joinWithInviteCode(inviteCode, phrase);
```

### 2. Encryption Implementation

```javascript
// Key derivation using nacl.hash (NOT PBKDF2)
import nacl from 'tweetnacl';

class EncryptionServiceFixed {
  KEY_DERIVATION_ITERATIONS = 100000;
  
  async deriveKeyFromPhrase(phrase, salt) {
    // Use fixed salt for sync ID generation
    const fixedSalt = 'U3RhY2tNYXBTeW5jU2FsdDIwMjQ=';
    let key = this.encodeUTF8(phrase + salt);
    
    // Simple iteration using nacl.hash
    for (let i = 0; i < this.KEY_DERIVATION_ITERATIONS; i++) {
      key = nacl.hash(key);
    }
    
    return key.slice(0, 32); // Use first 32 bytes
  }
  
  encrypt(data, key) {
    const nonce = nacl.randomBytes(24);
    const message = this.encodeUTF8(JSON.stringify(data));
    const encrypted = nacl.secretbox(message, nonce, key);
    
    // Combine nonce + ciphertext
    return this.encodeBase64(
      new Uint8Array([...nonce, ...encrypted])
    );
  }
  
  // Manual UTF-8 implementation for iOS compatibility
  encodeUTF8(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      if (char < 0x80) {
        bytes.push(char);
      } else if (char < 0x800) {
        bytes.push(0xc0 | (char >> 6));
        bytes.push(0x80 | (char & 0x3f));
      }
      // ... handle multi-byte chars
    }
    return new Uint8Array(bytes);
  }
}
```

### 3. Conflict Resolution

```javascript
// Field-level last-write-wins with merge window
class ConflictResolver {
  MERGE_WINDOW = 3000; // 3 seconds
  
  mergeData(local, remote) {
    // Compare field timestamps
    const localTime = local.fieldTimestamps?.users || 0;
    const remoteTime = remote.fieldTimestamps?.users || 0;
    
    // Within merge window: merge arrays
    if (Math.abs(localTime - remoteTime) < this.MERGE_WINDOW) {
      return this.mergeArrays(local.users, remote.users);
    }
    
    // Outside window: take newer
    return localTime > remoteTime ? local : remote;
  }
  
  mergeArrays(local, remote) {
    // Combine and deduplicate by ID
    const combined = [...local, ...remote];
    return Array.from(
      new Map(combined.map(item => [item.id, item])).values()
    );
  }
}
```

### 4. Backend API (PHP Example)

```php
// push_timestamp.php - Zero-knowledge storage with timestamps
<?php
header('Content-Type: application/json');

// Get encrypted data (server never decrypts)
$input = json_decode(file_get_contents('php://input'), true);

$sync_id = $input['sync_id'];  // Hash of recovery phrase
$blob = $input['encrypted_blob'];  // Base64 encrypted data
$timestamp = $input['timestamp'];  // Unix timestamp in ms

// Store encrypted blob with timestamp
$stmt = $pdo->prepare("
  INSERT INTO sync_data (sync_id, encrypted_blob, timestamp, device_id)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE 
    encrypted_blob = VALUES(encrypted_blob),
    timestamp = VALUES(timestamp)
");

$stmt->execute([$sync_id, $blob, $timestamp, $input['device_id']]);

echo json_encode(['success' => true, 'timestamp' => $timestamp]);
?>
```

## Critical Implementation Details

### Field Normalization (MUST FOLLOW)
```javascript
// Activities MUST use these field names
activity = {
  id: 'unique-id',
  text: 'Activity Name',  // NOT name, NOT title
  icon: '🎮',            // NOT emoji
  completed: false,
  // ... other fields
}

// Users MUST use these field names  
user = {
  id: 'unique-id',
  name: 'User Name',     // String only
  icon: '👤',           // NOT emoji
  // ... other fields
}
```

### Store Update Pattern (CRITICAL)
```javascript
// CORRECT - Use store-specific methods
useUserStore.getState().setUsers(users);
useSettingsStore.getState().updateSettings(settings);

// WRONG - Never use generic setState
useAppStore.setState({ users });  // Will break sync
```

### Sync Triggers
- **Periodic**: Every 30 seconds (fixed interval)
- **Manual**: User-initiated sync button
- **Data Changes**: Through store integration
- **Visibility**: App foreground/background transitions

### Security Considerations
1. **Recovery Phrase**: Never sent to server, only its hash
2. **Sync ID**: Generated using nacl.hash iterations
3. **Master Key**: Derived separately for encryption
4. **Nonce**: Random 24 bytes per encryption
5. **Iterations**: 100,000 nacl.hash iterations
6. **UTF-8**: Manual implementation for iOS compatibility

## API Endpoints (Actual Implementation)

### Sync Endpoints
- `POST /create_timestamp.php` - Create new sync group
- `POST /join_timestamp.php` - Join existing sync group  
- `POST /push_timestamp.php` - Push encrypted data
- `GET /pull_timestamp.php` - Pull data since timestamp

### Share Endpoints  
- `POST /create_share.php` - Create share link (V3 with XXXX-XXXX format)
- `GET /access_share.php` - Access shared data (V3)

### Invite Code Endpoints (New - Jan 2025)
- `POST /create_invite.php` - Generate invite code (XXXX-XXXX)
- `POST /validate_invite.php` - Check if invite is valid
- `POST /use_invite.php` - Mark invite as used after successful join

## Unified Invite Code System (Jan 2025)

### Overview
Both sync and share features now use identical invite code formats for consistency and security.

### Unified Format
Both features use the same `XXXX-XXXX#key` pattern:

- **Share URL**: `https://stackmap.app/share/WXYZ-5678#accessToken`
- **Sync URL**: `https://stackmap.app/sync/ABCD-1234#recoveryPhrase`
- **Sync URL (QUAL)**: `https://stackmap.app/qual/sync/ABCD-1234#recoveryPhrase`
- **Manual Entry**: `XXXX-XXXX#encryptionKey`
- **Invite Code**: 8 characters (XXXX-XXXX), no ambiguous chars (0/O, 1/I/L)
- **Fragment (#)**: Encryption key after # never reaches server (browser security)

### URL Auto-Registration (Sep 2025)
When a user visits a sync URL with both invite code and recovery phrase:
1. App detects `/sync/[invite-code]` in pathname
2. Extracts recovery phrase from URL fragment (after #)
3. Stores data in `window.syncInviteData`
4. Onboarding auto-triggers sync preview if both parts present
5. Auto-imports data after successful preview
6. URL fragment is immediately cleared for security

### Security Properties
1. **Zero-Knowledge Maintained**: Server only sees invite code, never the recovery phrase
2. **Temporary Access**: Invite codes expire (1-168 hours configurable)
3. **Usage Limits**: 1-10 uses per invite code
4. **No Logs**: Recovery phrases stay in URL fragments, invisible to server logs

### Creating an Invite
```javascript
// Generate invite code (expires in 24h, max 5 uses)
const result = await syncService.createInviteCode(24, 5, 'Family invite');
// result.inviteUrl already includes the recovery phrase as a fragment
// Example: https://stackmap.app/sync/ABCD-1234#GVcxCuLm9Q6lKczLWBt1PX17q94XY79XI20-FDiaeI
const shareableUrl = result.inviteUrl;

// For manual entry, extract the code and phrase:
const inviteString = `${result.inviteCode}#${recoveryPhrase}`;
// Example: ABCD-1234#GVcxCuLm9Q6lKczLWBt1PX17q94XY79XI20-FDiaeI
```

### Using an Invite
```javascript
// Parse the combined format
const input = 'ABCD-1234#GVcxCuLm9Q6lKczLWBt1PX17q94XY79XI20-FDiaeI';
const [inviteCode, recoveryPhrase] = input.split('#');

// Join with invite code
await syncService.joinWithInviteCode(inviteCode, recoveryPhrase);
```

### Database Schema
```sql
CREATE TABLE sync_invites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invite_code VARCHAR(9) UNIQUE NOT NULL,  -- Format: XXXX-XXXX
  sync_id VARCHAR(32) NOT NULL,           -- Hash of recovery phrase
  expires_at TIMESTAMP NOT NULL,          -- Default 24h from creation
  max_uses INT DEFAULT 1,                 -- How many times usable
  use_count INT DEFAULT 0,                -- Current usage count
  created_by_device VARCHAR(64),          -- Device that created invite
  note VARCHAR(255)                       -- Optional note
);
```

## Troubleshooting Common Issues

### "Data doesn't sync to Device B"
```javascript
// Check sync is enabled
console.log('[MinimalSync] Sync enabled:', minimalSyncService.isEnabled);

// Verify same recovery phrase
console.log('[MinimalSync] Sync ID:', minimalSyncService.syncId);

// Force manual pull
await minimalSyncService.pullData(true); // forceFullPull

// Check console for [MinimalSync] prefixed logs
```

### "Changes don't persist after refresh"
```javascript
// Ensure AsyncStorage is working (mobile)
import AsyncStorage from '@react-native-async-storage/async-storage';
const test = await AsyncStorage.setItem('test', 'value');
const retrieved = await AsyncStorage.getItem('test');

// Check store persistence
const state = useAppStore.getState();
console.log('Persisted state:', state);
```

### "iOS UTF-8 Issues"
The implementation uses a manual UTF-8 encoder/decoder because tweetnacl-util returns strings instead of Uint8Arrays on iOS. This is handled in `encryptionServiceFixed.ts`.

## Production Deployment Checklist

### Frontend
- [ ] Environment detection for API URLs (qual vs prod)
- [ ] 100,000 nacl.hash iterations
- [ ] Manual UTF-8 implementation for iOS
- [ ] 30-second pull interval
- [ ] Field normalization in place

### Backend  
- [ ] HTTPS only (no HTTP)
- [ ] Rate limiting on API endpoints
- [ ] Database indexes on sync_id, timestamp
- [ ] Automated backup of encrypted blobs
- [ ] 6-month data retention policy

### Monitoring
- [ ] Check [MinimalSync] console logs
- [ ] Monitor encryption/decryption errors
- [ ] API response time monitoring
- [ ] Storage usage alerts

## Minimal Sync Service Methods

```javascript
// Core operations
minimalSyncService.enableSync(recoveryPhrase, isNewSync)
minimalSyncService.disableSync()
minimalSyncService.pushData(data)
minimalSyncService.pullData(forceFullPull)
minimalSyncService.getSyncId()

// Data operations  
minimalSyncService.setDataCallback(callback)
minimalSyncService.testSyncConnection()

// Internal
minimalSyncService.startPullInterval()
minimalSyncService.stopPullInterval()
```

### Data Callback
```javascript
// Set callback for when data is received
minimalSyncService.setDataCallback((data) => {
  console.log('New data received:', data);
  // Update stores with received data
});
```

## Key Differences from Original Documentation

1. **Service Name**: Uses `minimalSyncService.js` not `syncService.js`
2. **API Endpoints**: Uses `*_timestamp.php` variants not simple names
3. **Key Derivation**: Uses nacl.hash iterations, NOT PBKDF2
4. **UTF-8 Handling**: Manual implementation for iOS compatibility
5. **Pull Interval**: Fixed 30 seconds, not configurable
6. **API**: Simplified - no events, just data callbacks
7. **Encryption**: Uses `encryptionServiceFixed.ts` for iOS issues
8. **Invite URLs**: `createInviteCode()` returns `inviteUrl` with recovery phrase already appended as fragment (Sep 2025)

## License & Usage

This documentation describes StackMap's actual sync implementation as of January 2025. The concepts and architecture patterns are available for learning and adaptation in other projects. When implementing similar systems:

1. Always prioritize user privacy (zero-knowledge)
2. Use established crypto libraries (don't roll your own)
3. Handle platform-specific issues (iOS UTF-8)
4. Plan for conflict resolution early
5. Test with real-world network conditions

---

*Last Updated: January 2025*
*StackMap Version: Minimal Sync Implementation*
*Note: This reflects the ACTUAL implementation, not the idealized architecture*