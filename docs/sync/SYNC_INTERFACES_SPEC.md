# StackMap Sync System Interface Specification

## Overview
This document provides a comprehensive mapping of all interfaces, data flows, and integration points in the StackMap sync system. It serves as the technical reference for understanding how data moves through the system from client to server and back.

## 1. CLIENT-TO-API COMMUNICATION (JavaScript ↔ PHP)

### API Endpoints

#### create_timestamp.php
Creates a new sync group with initial data.

**Request:**
```json
{
  "sync_id": "32-character-hex-string",
  "encrypted_blob": "base64-encoded-encrypted-data",
  "device_id": "32-character-hex-device-id",
  "timestamp": 1234567890000
}
```

**Response (Success):**
```json
{
  "success": true,
  "sync_id": "32-character-hex-string",
  "device_id": "32-character-hex-device-id",
  "record_id": 123,
  "server_time": 1234567890
}
```

**Error Codes:**
- `409`: Sync group already exists
- `400`: Invalid request data
- `500`: Server error

#### join_timestamp.php
Join an existing sync group and retrieve latest data.

**Request:**
```json
{
  "sync_id": "32-character-hex-string",
  "device_id": "32-character-hex-device-id"
}
```

**Response (Success):**
```json
{
  "success": true,
  "sync_id": "32-character-hex-string",
  "device_id": "32-character-hex-device-id",
  "latest_record": {
    "id": 123,
    "device_id": "sender-device-id",
    "timestamp": 1234567890000,
    "encrypted_blob": "base64-encrypted-data"
  },
  "server_time": 1234567890,
  "protection_seconds": 60
}
```

**Error Codes:**
- `404`: Sync group not found
- `500`: Server error

#### push_timestamp.php
Push local changes to the sync group.

**Request:**
```json
{
  "sync_id": "32-character-hex-string",
  "device_id": "32-character-hex-device-id",
  "encrypted_blob": "base64-encoded-encrypted-data",
  "timestamp": 1234567890000
}
```

**Response (Success):**
```json
{
  "success": true,
  "record_id": 124,
  "server_time": 1234567890
}
```

**Error Codes:**
- `429`: Rate limited (too many requests)
- `404`: Sync group not found
- `400`: Invalid data or protection period active

#### pull_timestamp.php
Pull remote changes from the sync group.

**Request (GET):**
```
?sync_id=32-char-hex&device_id=32-char-hex&since=1234567890000
```

**Response (Success):**
```json
{
  "success": true,
  "sync_id": "32-character-hex-string",
  "records": [
    {
      "id": 124,
      "device_id": "other-device-id",
      "timestamp": 1234567890001,
      "server_timestamp": 1234567890002,
      "encrypted_blob": "base64-encrypted-data"
    }
  ],
  "server_time": 1234567890,
  "device_info": {
    "device_count": 2,
    "last_activity": 1234567890
  }
}
```

**Error Codes:**
- `404`: Sync group not found
- `400`: Invalid parameters
- `500`: Server error

## 2. API-TO-DATABASE INTERACTIONS (PHP ↔ MySQL)

### Database Schema

#### sync_groups Table
Tracks all sync groups in the system.
```sql
CREATE TABLE sync_groups (
  sync_id VARCHAR(64) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  device_count INT DEFAULT 1
);
```

#### sync_devices Table
Tracks devices participating in each sync group.
```sql
CREATE TABLE sync_devices (
  sync_id VARCHAR(64),
  device_id VARCHAR(64),
  first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  push_count INT DEFAULT 0,
  PRIMARY KEY (sync_id, device_id),
  FOREIGN KEY (sync_id) REFERENCES sync_groups(sync_id)
);
```

#### sync_records Table
Stores all sync data records.
```sql
CREATE TABLE sync_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_id VARCHAR(64),
  device_id VARCHAR(64),
  client_timestamp BIGINT,
  server_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  encrypted_blob TEXT,
  INDEX idx_sync_timestamp (sync_id, client_timestamp),
  FOREIGN KEY (sync_id) REFERENCES sync_groups(sync_id)
);
```

### Key Database Operations

#### Create Operation
1. Begin transaction
2. INSERT into sync_groups
3. INSERT into sync_devices (register creator)
4. INSERT into sync_records (initial data)
5. Commit transaction

#### Join Operation
1. SELECT latest record from sync_records
2. INSERT/UPDATE sync_devices (register joiner)
3. Return latest data with protection period

#### Push Operation
1. Check device protection period (60s for new devices)
2. INSERT into sync_records
3. UPDATE sync_devices.push_count
4. UPDATE sync_groups.last_activity

#### Pull Operation
1. SELECT records WHERE client_timestamp > since
2. Register device if new (INSERT IGNORE)
3. Return all newer records from other devices

### Protection Logic
- New devices must wait 60 seconds before first push
- Prevents race conditions during initial sync
- Enforced at database query level

## 3. CLIENT STORAGE INTERFACES (JavaScript ↔ AsyncStorage)

### Sync Service Storage Keys

#### Core Sync Configuration
```javascript
'@sync_enabled': 'true' | 'false'          // Sync feature toggle
'@sync_id': '32-char-hex'                  // Current sync group ID
'@sync_timestamp': '1234567890000'         // Last successful sync
'@sync_join_timestamp': '1234567890000'    // Protection period end
'@sync_phrase_${sync_id}': '32-char-hex'   // Recovery phrase cache
'device_id': '32-char-hex'                 // Unique device identifier
```

### Zustand Store Persistence

#### Store Storage Keys
```javascript
'stackmap-user-storage': {
  state: {
    users: [],
    currentUser: 0,
    currentDay: 0,
    activities: {}  // Keyed by userId-dayIndex
  },
  version: 0
}

'stackmap-settings-storage': {
  state: {
    themeColor: '#4A90E2',
    fontSize: 'medium',
    soundEnabled: true,
    showOnboarding: true
  },
  version: 0
}

'stackmap-library-storage': {
  state: {
    activityLibrary: [],
    categories: {}
  },
  version: 0
}
```

### AsyncStorage Wrapper Features

#### Write Optimization
- Debounced writes (500ms mobile, 1000ms iOS)
- Pending write cache for immediate reads
- Batch operations support

#### Error Handling
```javascript
try {
  await AsyncStorage.setItem(key, value);
} catch (error) {
  console.warn('[Storage] Write failed:', error);
  // Graceful degradation - continue with in-memory state
}
```

#### JSON Serialization
- Automatic JSON.stringify on write
- JSON.parse with error recovery on read
- Corruption detection and fallback to defaults

## 4. ENCRYPTION/DECRYPTION BOUNDARIES

### Key Derivation Process

#### Input
```javascript
recoveryPhrase: '32-character-hexadecimal-string'
salt: 'stackmap_sync_salt_2024'  // Fixed application salt
```

#### Process
```javascript
// 100,000 PBKDF2-like iterations using NaCl
for (let i = 0; i < 100000; i++) {
  hash = nacl.hash(hash + salt);
}
masterKey = hash.slice(0, 32);  // 256-bit key
```

### Encryption Flow

#### 1. Data Preparation
```javascript
plainObject → JSON.stringify() → UTF8 bytes
```

#### 2. Optional Compression
```javascript
if (dataSize > threshold) {
  compressedData = gzip(utf8Bytes);
  metadata.compressed = true;
}
```

#### 3. Metadata Prepending
```javascript
metadata = {
  version: 1,
  compressed: boolean,
  timestamp: Date.now()
}
finalData = [metadata, data];
```

#### 4. Encryption
```javascript
nonce = nacl.randomBytes(24);
encrypted = nacl.secretbox(finalData, nonce, masterKey);
output = base64([nonce, encrypted]);
```

### Decryption Flow

#### 1. Base64 Decode
```javascript
encrypted = base64Decode(blob);
nonce = encrypted.slice(0, 24);
ciphertext = encrypted.slice(24);
```

#### 2. Decryption
```javascript
decrypted = nacl.secretbox.open(ciphertext, nonce, masterKey);
if (!decrypted) throw new Error('Decryption failed');
```

#### 3. Metadata Extraction
```javascript
metadata = extractMetadata(decrypted);
data = extractData(decrypted);
```

#### 4. Decompression (if needed)
```javascript
if (metadata.compressed) {
  data = gunzip(data);
}
```

#### 5. Parse to Object
```javascript
utf8String = decoder.decode(data);
plainObject = JSON.parse(utf8String);
```

### Error Conditions
- Invalid recovery phrase → Key derivation fails
- Wrong key → nacl.secretbox.open returns null
- Corrupted data → JSON.parse throws
- Compression errors → Fallback to uncompressed

## 5. STATE MANAGEMENT INTERFACES (Zustand Stores)

### Store Architecture

#### useUserStore
```javascript
{
  users: User[],
  currentUser: number,
  currentDay: number,
  activities: {
    [key: `${userId}-${dayIndex}`]: Activity[]
  },
  
  // Methods
  setUsers: (users) => set({ users }),
  setCurrentUser: (index) => set({ currentUser: index }),
  setActivities: (userId, dayIndex, activities) => set(...)
}
```

#### useSettingsStore
```javascript
{
  themeColor: string,
  fontSize: 'small' | 'medium' | 'large',
  soundEnabled: boolean,
  showOnboarding: boolean,
  
  // Methods
  updateSettings: (updates) => set((state) => ({ ...state, ...updates }))
}
```

#### useLibraryStore
```javascript
{
  activityLibrary: ActivityTemplate[],
  categories: {
    [key: string]: Category
  },
  
  // Methods
  setLibrary: (library) => set({ activityLibrary: library }),
  addCategory: (category) => set(...)
}
```

#### useSyncStore
```javascript
{
  syncEnabled: boolean,
  syncStatus: 'idle' | 'syncing' | 'error',
  lastSyncTime: number | null,
  errorMessage: string | null,
  
  // Methods
  setSyncStatus: (status) => set({ syncStatus: status }),
  setSyncError: (error) => set({ errorMessage: error })
}
```

### Store Update Rules

#### Critical: Use Store-Specific Methods
```javascript
// CORRECT - Use store methods
useUserStore.getState().setUsers(updatedUsers);
useSettingsStore.getState().updateSettings({ themeColor });

// WRONG - Direct state setting breaks sync
useAppStore.setState({ users: updatedUsers });  // DON'T DO THIS
```

### Data Validation

#### User Sanitization
```javascript
function sanitizeUser(user) {
  return {
    ...user,
    name: typeof user.name === 'string' ? user.name : String(user.name || ''),
    icon: user.icon || user.emoji || '👤'
  };
}
```

#### Field Normalization
```javascript
// Activities: name/title → text, emoji → icon
activity.text = activity.text || activity.name || activity.title;
activity.icon = activity.icon || activity.emoji;

// Users: emoji → icon, name must be string
user.icon = user.icon || user.emoji;
user.name = String(user.name || '');
```

## 6. CRITICAL DATA FLOWS

### Create Sync Flow
```
1. User clicks "Create Sync"
2. syncService.create() called
3. Generate 32-char hex recovery phrase
4. Derive encryption key (100k iterations)
5. Get current state from all stores
6. Normalize data (field names, CRDT format)
7. Encrypt state with NaCl
8. POST to create_timestamp.php
9. Store sync_id, recovery phrase in AsyncStorage
10. Start 30-second periodic sync timer
```

### Join Sync Flow
```
1. User enters recovery phrase
2. Generate sync_id from phrase (deterministic)
3. POST to join_timestamp.php
4. Receive latest encrypted state
5. Decrypt with derived key
6. Validate and normalize data
7. Apply to Zustand stores
8. Set 60-second protection period
9. Start periodic sync after protection expires
```

### Periodic Sync Flow (Every 30s)
```
1. Timer triggers sync
2. Check if sync enabled and not in protection
3. GET pull_timestamp.php?since=lastSync
4. Receive array of encrypted records
5. For each record:
   - Decrypt data
   - Check if newer than local
   - Apply CRDT merge
6. Update local stores with merged state
7. If local changes exist:
   - Encrypt current state
   - POST to push_timestamp.php
8. Update lastSyncTime
```

### Conflict Resolution Flow
```
1. Device A and B modify same activity
2. Each creates CRDT record with:
   - Field-level timestamps
   - Device ID
   - Operation type
3. During merge:
   - Compare timestamps per field
   - Apply Last-Write-Wins
   - Preserve completion state logic
4. Special handling:
   - Completion: Use completedAt/uncompletedAt
   - Order: Use orderChangedAt with sortIndex
   - Deletion: Tombstone with timestamp
```

### Data Transformation Pipeline

#### Outbound (Local → Server)
```
Zustand State
  ↓ getCurrentState()
  ↓ normalizeData() [emoji→icon, name→text]
  ↓ addCRDTMetadata() [timestamps, device ID]
  ↓ JSON.stringify()
  ↓ encrypt() [NaCl + base64]
  ↓ POST to API
```

#### Inbound (Server → Local)
```
API Response
  ↓ base64 decode
  ↓ decrypt() [NaCl]
  ↓ JSON.parse()
  ↓ validateSchema()
  ↓ normalizeData() [field names]
  ↓ mergeCRDT() [conflict resolution]
  ↓ applyToStores() [using store methods]
```

## 7. KEY DEPENDENCIES & CONSTRAINTS

### Network Requirements
- Internet connection required for all sync operations
- Graceful degradation on network failure
- Retry logic with exponential backoff

### Storage Constraints
- AsyncStorage 6MB limit on some platforms
- Debounced writes to prevent I/O bottlenecks
- In-memory cache for pending writes

### Timing Dependencies
- 60-second protection period for new devices
- 30-second periodic sync interval
- 5-second debounce on user changes
- Rate limiting: Max 1 push per 5 seconds

### Security Boundaries
- Zero-knowledge: Server never sees plaintext
- Client-side encryption only
- Recovery phrase never sent to server
- Device ID generated locally

### Platform-Specific Issues
- iOS: AsyncStorage causes 20+ second freezes
- Android: Must use font variants, not fontWeight
- Web: Different storage persistence behavior