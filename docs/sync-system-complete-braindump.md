# StackMap Sync System - Complete Technical Braindump

## The Real Truth About Our Sync System

This document contains EVERYTHING about how sync actually works in StackMap, including all the gotchas, workarounds, and implementation details that aren't obvious from the code.

---

## Part 1: API Endpoints & Authentication

### Base URLs
```javascript
// Production: https://stackmap.app/api/sync/
// QUAL/Dev: https://stackmap.app/qual/api/sync/
// Local: /api/sync/ (proxied through webpack)

// Mobile apps determine URL based on __DEV__ flag
if (__DEV__) {
  API_BASE = 'https://stackmap.app/qual/api/sync';
} else {
  API_BASE = 'https://stackmap.app/api/sync';
}
```

### Complete Endpoint List

#### 1. create_timestamp.php
```javascript
// Creates new sync group
POST {
  recovery_phrase: string,  // 32-char hex
  device_id: string,        // UUID
  encrypted_blob?: string,  // Optional initial data
  timestamp?: number        // Optional initial timestamp
}

Response: {
  success: boolean,
  sync_id: string,         // First 16 bytes of hash
  salt: string,            // Base64 encoded salt
  message?: string
}
```

#### 2. push_timestamp.php
```javascript
// Push encrypted data
POST {
  sync_id: string,          // 16-char hex
  device_id: string,
  encrypted_blob: string,   // Base64 encoded
  timestamp: number         // Unix ms timestamp
}

Response: {
  success: boolean,
  message?: string,
  error?: string
}

// Rate limit: 200ms between requests (429 response if violated)
```

#### 3. pull_timestamp.php
```javascript
// Pull data since timestamp
POST {
  sync_id: string,
  device_id: string,
  since_timestamp: number   // Get changes after this time
}

Response: {
  success: boolean,
  data?: string,           // Encrypted blob
  timestamp?: number,      // When this data was stored
  device_id?: string,      // Which device pushed it
  has_data?: boolean
}
```

#### 4. join_timestamp.php
```javascript
// Join existing sync group
POST {
  invite_code: string,      // XXXX-XXXX format
  recovery_phrase: string,  // 32-char hex
  device_id: string
}

Response: {
  success: boolean,
  sync_id?: string,
  salt?: string,
  message?: string
}
```

#### 5. create_invite.php
```javascript
// Generate invite code
POST {
  sync_id: string,
  device_id: string,
  hours_valid: number,      // 1-168 hours
  max_uses: number          // 1-100
}

Response: {
  success: boolean,
  invite_code?: string,     // XXXX-XXXX format
  expires_at?: string,      // ISO timestamp
  error?: string
}
```

#### 6. validate_invite.php
```javascript
// Check if invite is valid (doesn't consume use)
POST {
  invite_code: string
}

Response: {
  success: boolean,
  valid?: boolean,
  expires_at?: string,
  uses_remaining?: number
}
```

#### 7. use_invite.php
```javascript
// Mark invite as used (called after successful join)
POST {
  invite_code: string,
  device_id: string
}

Response: {
  success: boolean
}
```

#### 8. delete.php
```javascript
// Delete all sync data
POST {
  sync_id: string,
  device_id: string
}

Response: {
  success: boolean,
  deleted_records?: number
}
```

### Authentication Method
**There are NO user accounts or traditional auth**. Authentication is purely cryptographic:

1. **Sync ID** = First 16 bytes of hash(recovery_phrase + fixed_salt)
2. Server can only verify you know the recovery phrase by checking the sync_id
3. All data is encrypted client-side, server never sees plaintext
4. Device IDs are just for tracking/debugging, not authentication

---

## Part 2: Encryption & Key Derivation

### The EXACT Key Derivation Process

```javascript
// 1. Generate recovery phrase (32 hex chars)
const seedBytes = nacl.randomBytes(16);  // 16 bytes = 32 hex chars
const recoveryPhrase = bytesToHex(seedBytes);

// 2. Derive sync ID (for server identification)
const FIXED_SALT = "STACKMAP_SYNC_SALT_V2";  // Hardcoded for sync ID
const syncIdInput = utf8Encode(recoveryPhrase + FIXED_SALT);
let syncIdHash = nacl.hash(syncIdInput);  // SHA-512

// Hash 100,000 times (not PBKDF2!)
for (let i = 0; i < 100000; i++) {
  syncIdHash = nacl.hash(syncIdHash);
}

const syncId = bytesToHex(syncIdHash.slice(0, 16));  // First 16 bytes

// 3. Derive encryption key (for data encryption)
const salt = nacl.randomBytes(16);  // Random salt per sync group
const keyInput = utf8Encode(recoveryPhrase) + salt;
let keyHash = nacl.hash(keyInput);

// Hash 100,000 times
for (let i = 0; i < 100000; i++) {
  keyHash = nacl.hash(keyHash);
  // IMPORTANT: Yield to event loop every 10k iterations on mobile
  if (i % 10000 === 0) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

const encryptionKey = keyHash.slice(0, 32);  // First 32 bytes for nacl.secretbox
```

### Critical UTF-8 Encoding Issue (iOS)
```javascript
// tweetnacl-util is BROKEN on iOS React Native
// It returns strings instead of Uint8Arrays

// DON'T USE THIS:
const util = require('tweetnacl-util');
const bytes = util.decodeUTF8(str);  // Returns string on iOS!

// USE THIS INSTEAD (manual implementation):
function encodeUTF8(str) {
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
```

### Encryption Process
```javascript
// 1. Serialize data
const dataStr = JSON.stringify(data);

// 2. Optionally compress (if > 1024 bytes)
let dataBytes = encodeUTF8(dataStr);
let compressed = false;
if (dataBytes.length > 1024) {
  dataBytes = pako.deflate(dataBytes);
  compressed = true;
}

// 3. Add metadata
const metadata = {
  version: 2,
  compressed: compressed
};
const metadataBytes = encodeUTF8(JSON.stringify(metadata));

// 4. Combine metadata + data
const combined = new Uint8Array(4 + metadataBytes.length + dataBytes.length);
const metaLength = new DataView(new ArrayBuffer(4));
metaLength.setUint32(0, metadataBytes.length, true);
combined.set(new Uint8Array(metaLength.buffer), 0);
combined.set(metadataBytes, 4);
combined.set(dataBytes, 4 + metadataBytes.length);

// 5. Encrypt with nacl.secretbox
const nonce = nacl.randomBytes(24);
const encrypted = nacl.secretbox(combined, nonce, encryptionKey);

// 6. Combine nonce + encrypted + encode
const result = new Uint8Array(nonce.length + encrypted.length);
result.set(nonce, 0);
result.set(encrypted, 24);
return base64Encode(result);
```

---

## Part 3: Conflict Resolution Strategy

### The 3-Second Rule
If two devices modify the same field within 3 seconds, we consider it a "simultaneous edit" and merge more carefully.

### Field-Level Timestamps
```javascript
metadata: {
  lastModified: 1705363200000,  // Overall last change
  deviceId: "device_123",
  fieldTimestamps: {
    users: 1705363200000,       // When users object changed
    activities: 1705363180000,   // When activities changed
    settings: 1705363190000,     // When settings changed
    library: 1705363170000       // When library changed
  }
}
```

### Merge Algorithm
```javascript
// 1. Check field timestamps
if (remoteUserTime > localUserTime + 3000) {
  // Remote is >3 seconds newer, take it entirely
  return remoteUsers;  // This handles deletions properly
}

// 2. Within 3-second window - merge granularly
// For each activity/user, check individual timestamps
// Preserve data from both sides when possible

// 3. Tiebreaker for exact same timestamp
function tiebreaker(deviceId1, deviceId2) {
  // Lexicographic comparison of device IDs
  return deviceId1 > deviceId2 ? 'device1' : 'device2';
}
```

### Special Cases

#### Activity Completion
```javascript
// Both devices mark complete at similar time
if (local.completed && remote.completed) {
  // Take the earlier completion time (first to complete wins)
  if (local.completedAt < remote.completedAt) {
    return local;
  }
}
```

#### Deletion Handling
```javascript
// Deletions set a flag, not actually removed
activity.deleted = true;
activity.deletedAt = Date.now();

// During merge, deleted flag is preserved
if (remote.deleted || local.deleted) {
  merged.deleted = true;
  merged.deletedAt = Math.max(local.deletedAt, remote.deletedAt);
}
```

---

## Part 4: The 6-Character Code System

### How It Works (NOT YET IMPLEMENTED)
```javascript
// This is planned but not built yet!

// User flow:
// 1. Mobile app generates 6-char code: "ABC123"
// 2. TV user enters this code
// 3. Server maps code → full recovery phrase

// Server-side mapping (conceptual):
Database table: temp_codes
- code: VARCHAR(6)
- recovery_phrase: VARCHAR(32)
- sync_id: VARCHAR(16)
- created_at: TIMESTAMP
- expires_at: TIMESTAMP (24 hours later)

// API endpoint (planned):
POST /api/sync/exchange_code.php
{
  code: "ABC123"
}
Response: {
  recovery_phrase: "32charhexstring...",
  sync_id: "16charhex..."
}
```

### Current Workaround
Right now, users must enter the full recovery phrase or use invite codes (XXXX-XXXX format).

---

## Part 5: Network Error Handling

### Rate Limiting
```javascript
// Minimum 200ms between requests
MIN_REQUEST_INTERVAL = 200;

async rateLimitCheck(operation) {
  const now = Date.now();
  const last = this.lastRequest[operation] || 0;
  const waitTime = this.MIN_REQUEST_INTERVAL - (now - last);

  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  this.lastRequest[operation] = Date.now();
}
```

### Retry Logic (SIMPLIFIED - No exponential backoff)
```javascript
// We DON'T use exponential backoff currently
// Just simple rate limiting and user-triggered retries

// If rate limited (429 response):
if (response.status === 429) {
  // Wait and retry ONCE
  await new Promise(resolve => setTimeout(resolve, 1000));
  return fetch(url, options);  // One retry only
}

// For network errors - NO automatic retry
// User must manually trigger sync again
```

### Network Detection
```javascript
// NetInfo is DISABLED on iOS (causes 20+ second freezes)
// We assume always online and handle failures gracefully

// Web uses navigator.onLine
if (Platform.OS === 'web' && !navigator.onLine) {
  return { success: false, error: 'Offline' };
}
```

---

## Part 6: Offline Queue Management

### Current State: NO OFFLINE QUEUE
**Important:** Despite what you might expect, we DON'T have an offline queue!

```javascript
// What we DON'T have:
// - No persistent queue of pending changes
// - No automatic retry when coming online
// - No conflict resolution queue

// What we DO have:
// - Last push attempt is stored locally
// - Manual sync button for users to retry
// - Rate limiting to prevent spam
```

### Why No Queue?
1. **Simplicity** - Less to go wrong
2. **Predictability** - User controls when sync happens
3. **Conflict avoidance** - Real-time sync reduces conflicts
4. **Battery life** - No background sync attempts

### Future Queue Design (If needed)
```javascript
// Conceptual design only - not implemented
class OfflineQueue {
  queue = [];  // Array of pending operations

  async addToQueue(operation) {
    this.queue.push({
      id: generateId(),
      operation: operation,
      timestamp: Date.now(),
      retries: 0
    });
    await this.persistQueue();
  }

  async processQueue() {
    while (this.queue.length > 0) {
      const item = this.queue[0];
      try {
        await this.executeOperation(item);
        this.queue.shift();  // Remove successful
      } catch (error) {
        item.retries++;
        if (item.retries > 3) {
          this.queue.shift();  // Give up after 3 tries
        }
        break;  // Stop processing on error
      }
    }
  }
}
```

---

## Part 7: Data Format & Structure

### Complete Sync Data Structure
```javascript
{
  // User data
  users: {
    "user_id_123": {
      id: "user_id_123",
      name: "Dad",
      icon: "👨",  // NOT emoji!
      createdAt: "2024-01-15T10:00:00Z",
      lastActive: "2024-01-15T10:00:00Z",
      lastModified: 1705363200000,  // For conflict resolution
      deviceId: "device_abc",        // Which device last modified

      days: {
        today: {
          activities: [
            {
              id: "act_123",
              text: "Morning Exercise",  // NOT title or name!
              icon: "🏃",                // NOT emoji!
              completed: false,
              completedAt: null,
              completedBy: null,
              order: 0,
              deleted: false,
              type: "task",              // or "routine"
              description: "30 minutes",
              pinned: false,
              isPersonal: false,
              addedToLibrary: false
            }
          ]
        },
        tomorrow: {
          activities: []
        }
      },

      settings: {
        theme: "stackBlue",
        displayMode: "cards",
        taskCelebration: "confetti",
        routineCelebration: "checkmark"
      }
    }
  },

  // Global settings
  settings: {
    currentUser: "user_id_123",
    currentDay: "today",
    currentTheme: "stackBlue",
    bannerPosition: "top",
    displayMode: "cards",
    dayMode: "single",
    soundEnabled: true,
    hasCompletedOnboarding: true,
    hasPinProtection: false,
    toolbarOrder: ["help", "settings", "data"],
    moreButtonPosition: "left"
  },

  // Library templates
  library: {
    categories: [
      {
        id: "cat_123",
        name: "Morning Routine",
        icon: "🌅",
        order: 0
      }
    ],
    templates: [
      {
        id: "template_123",
        text: "Meditation",
        icon: "🧘",
        categoryId: "cat_123",
        type: "routine",
        description: "5 minutes",
        order: 0,
        isUserAdded: true
      }
    ],
    userAddedActivityIds: ["template_123"]
  },

  // Metadata for conflict resolution
  metadata: {
    lastModified: 1705363200000,
    deviceId: "device_abc",
    fieldTimestamps: {
      users: 1705363200000,
      activities: 1705363180000,
      settings: 1705363190000,
      library: 1705363170000
    }
  }
}
```

### Field Normalization (CRITICAL!)
```javascript
// Always normalize at data boundaries
function normalizeActivity(input) {
  return {
    id: input.id,
    // Try all possible field names
    text: input.text || input.title || input.name || 'Untitled',
    icon: input.icon || input.emoji || '🎯',
    // ... rest of fields
  };
}

// Why? Historical data uses different field names
// - Version 1.x used 'title' and 'emoji'
// - Version 2.x used 'name' and 'emoji'
// - Version 3.x+ uses 'text' and 'icon'
```

---

## Part 8: Android TV Specific Considerations

### Sync Differences for TV

#### Pull-Only Mode
```javascript
// TV doesn't push every change, only completions
class TVSyncService {
  async markComplete(activityId, completed) {
    // Update local immediately
    updateLocalActivity(activityId, completed);

    // Push ONLY this change, not full sync
    const minimalUpdate = {
      users: {
        [currentUserId]: {
          lastModified: Date.now(),
          days: {
            [currentDay]: {
              activities: [
                { id: activityId, completed, completedAt: Date.now() }
              ]
            }
          }
        }
      },
      metadata: {
        lastModified: Date.now(),
        deviceId: this.deviceId,
        fieldTimestamps: {
          users: Date.now()
        }
      }
    };

    await this.pushData(minimalUpdate);
  }
}
```

#### Simplified Auth for TV
```javascript
// Option 1: QR Code (Recommended)
// Mobile generates: stackmap://sync/${recoveryPhrase}
// TV scans and extracts recovery phrase

// Option 2: Companion App Push
// Use mDNS to discover TV on local network
// Push encrypted recovery phrase over local network

// Option 3: Voice Input (Future)
// Use Android TV voice remote
// Speak 6 word mnemonic that maps to recovery phrase
```

#### TV-Specific Sync Optimizations
1. **Larger pull interval** - 60 seconds instead of 30
2. **No background sync** - Only when app is in foreground
3. **Simplified conflict resolution** - Always take remote for non-completion changes
4. **Minimal push** - Only send completion state changes

---

## Part 9: Common Sync Issues & Solutions

### Issue 1: "Sync ID mismatch"
**Cause:** Recovery phrase changed or corrupted
**Solution:** Clear AsyncStorage and re-enter recovery phrase

### Issue 2: Activities disappearing
**Cause:** Field timestamp indicates remote deletion
**Solution:** Check metadata.fieldTimestamps - if remote is >3sec newer, it wins

### Issue 3: iOS 20+ second freeze
**Cause:** AsyncStorage.setItem in sync callbacks
**Solution:** Debounce all AsyncStorage writes to max once per second

### Issue 4: Duplicate activities after sync
**Cause:** Missing or changed activity IDs
**Solution:** Always preserve IDs, use normalizeActivity()

### Issue 5: Rate limiting (429 errors)
**Cause:** Too many requests within 200ms
**Solution:** Use rateLimitCheck() before all API calls

### Issue 6: Completed status not syncing
**Cause:** completedAt timestamp not set
**Solution:** Always set completedAt when toggling completion

---

## Part 10: Testing Sync Locally

### Setup Local Sync Testing
```bash
# 1. Start local PHP server
cd src/services/api
php -S localhost:8080

# 2. Configure webpack proxy (already done)
# webpack.config.js proxies /api/sync to localhost:8080

# 3. Use web app at localhost:3000
# It will automatically use local sync server
```

### Test Scenarios
```javascript
// 1. Test basic sync
const testSync = async () => {
  // Device 1
  await sync.enable(recoveryPhrase);
  await sync.pushData(testData1);

  // Device 2
  await sync.enable(recoveryPhrase);
  const pulled = await sync.pullData();
  assert(pulled.data === testData1);
};

// 2. Test conflict resolution
const testConflict = async () => {
  // Both devices modify within 3 seconds
  // Should merge, not overwrite
};

// 3. Test rate limiting
const testRateLimit = async () => {
  await sync.pushData(data1);
  await sync.pushData(data2);  // Should wait 200ms
};
```

---

## Summary: Key Things to Remember

1. **No PBKDF2** - We use 100k iterations of nacl.hash (SHA-512)
2. **No offline queue** - Manual sync only, no automatic retries
3. **UTF-8 is broken on iOS** - Use manual implementation
4. **3-second merge window** - Prevents accidental overwrites
5. **Field names matter** - Always normalize text/icon
6. **No exponential backoff** - Simple rate limiting only
7. **6-char codes not implemented** - Use full recovery phrase
8. **TV is pull-mostly** - Only pushes completions
9. **Rate limit is 200ms** - Server enforces this strictly
10. **Zero-knowledge** - Server never sees plaintext data

This is how sync ACTUALLY works. Not how we wish it worked, not how it should work, but how it's implemented today in production.