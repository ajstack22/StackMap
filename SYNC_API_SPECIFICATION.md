# StackMap Sync API Specification

## Overview

The StackMap Sync API provides end-to-end encrypted synchronization of user data across devices. The server acts as a simple encrypted blob storage system with no knowledge of the actual data content.

## Core Principles

1. **End-to-End Encryption**: All data is encrypted on the client before transmission. The server never has access to:
   - Unencrypted user data
   - Encryption keys
   - Recovery phrases
   - User identities

2. **Client Authority**: The client is the source of truth for:
   - Data encryption/decryption
   - Key generation and management
   - Sync ID generation from recovery phrases
   - Data validation

3. **Server Simplicity**: The server only handles:
   - Storing encrypted blobs
   - Basic version tracking
   - Timestamp management
   - Device tracking for sync coordination

## Data Flow

### 1. Creating a New Sync Group

```
Client                                          Server
  |                                               |
  |-- Generate recovery phrase (hex, 32 chars) -->|
  |-- Derive sync_id from phrase              -->|
  |-- Encrypt current state                   -->|
  |                                               |
  |-- POST /api/sync/create.php               -->|
  |   {sync_id, encrypted_blob}                   |
  |                                               |
  |<-- 200 OK {success: true}                 ---|
```

### 2. Joining an Existing Sync Group

```
Client                                          Server
  |                                               |
  |-- User enters recovery phrase              -->|
  |-- Derive sync_id from phrase              -->|
  |                                               |
  |-- GET /api/sync/pull.php?sync_id=...      -->|
  |                                               |
  |<-- 200 OK {encrypted_blob, version, ...}  ---|
  |                                               |
  |-- Decrypt blob with derived key           -->|
  |-- Restore local state                     -->|
```

### 3. Syncing Updates

```
Client                                          Server
  |                                               |
  |-- Detect local changes                    -->|
  |-- Encrypt full state                      -->|
  |                                               |
  |-- POST /api/sync/push.php                 -->|
  |   {sync_id, encrypted_blob, device_id,       |
  |    previous_version}                          |
  |                                               |
  |<-- 200 OK {success: true, version: 2}     ---|
```

## API Endpoints

### POST /api/sync/create.php

Creates a new sync group.

**Request Body:**
```json
{
  "sync_id": "a1b2c3d4e5f6789012345678901234567",
  "encrypted_blob": "base64_encrypted_data"
}
```

**Response:**
```json
{
  "success": true
}
```

**Error Responses:**
- `409 Conflict`: Sync ID already exists
- `400 Bad Request`: Missing required fields

### GET /api/sync/pull.php

Retrieves the latest encrypted data for a sync group.

**Query Parameters:**
- `sync_id` (required): The sync group identifier
- `device_id` (required): Unique device identifier

**Response:**
```json
{
  "encrypted_blob": "base64_encrypted_data",
  "version": 1,
  "updated_at": "2024-01-15 10:30:00"
}
```

**Error Responses:**
- `404 Not Found`: Sync group doesn't exist
- `400 Bad Request`: Missing parameters

### POST /api/sync/push.php

Updates the encrypted data for a sync group.

**Request Body:**
```json
{
  "sync_id": "a1b2c3d4e5f6789012345678901234567",
  "encrypted_blob": "base64_encrypted_data",
  "device_id": "device_unique_id",
  "previous_version": 1
}
```

**Response:**
```json
{
  "success": true,
  "version": 2
}
```

**Error Responses:**
- `409 Conflict`: Version mismatch (concurrent update)
- `404 Not Found`: Sync group doesn't exist
- `400 Bad Request`: Missing required fields

### POST /api/sync/delete.php

Deletes a sync group and all associated data.

**Request Body:**
```json
{
  "sync_id": "a1b2c3d4e5f6789012345678901234567",
  "device_id": "device_unique_id"
}
```

**Response:**
```json
{
  "success": true
}
```

## Database Schema

### sync_data table
```sql
CREATE TABLE sync_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sync_id VARCHAR(64) UNIQUE NOT NULL,
  encrypted_blob LONGTEXT NOT NULL,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sync_id (sync_id)
);
```

### sync_devices table (optional, for tracking)
```sql
CREATE TABLE sync_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sync_id VARCHAR(64) NOT NULL,
  device_id VARCHAR(128) NOT NULL,
  last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_sync_device (sync_id, device_id),
  FOREIGN KEY (sync_id) REFERENCES sync_data(sync_id) ON DELETE CASCADE
);
```

## Client Implementation Details

### Recovery Phrase Generation
```javascript
// Generate 128-bit random seed, convert to hex
const seedBytes = nacl.randomBytes(16);
const recoveryPhrase = Array.from(seedBytes, byte => 
  byte.toString(16).padStart(2, '0')
).join('');
// Result: 32 character hex string, no padding
```

### Sync ID Generation
```javascript
// Deterministic generation from recovery phrase
const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ==';
const key = deriveKeyFromPhrase(recoveryPhrase, fixedSalt);
const syncIdBytes = key.slice(0, 16);
const syncId = Array.from(syncIdBytes, byte => 
  byte.toString(16).padStart(2, '0')
).join('');
```

### Encryption Process
```javascript
// 1. Generate or derive encryption key
const key = deriveKeyFromPhrase(recoveryPhrase, salt);

// 2. Serialize data to JSON
const jsonData = JSON.stringify(userData);

// 3. Compress if beneficial (optional)
const compressed = pako.deflate(jsonData);

// 4. Encrypt with nacl
const nonce = nacl.randomBytes(24);
const encrypted = nacl.secretbox(compressed, nonce, key);

// 5. Combine nonce + encrypted data
const combined = new Uint8Array(nonce.length + encrypted.length);
combined.set(nonce);
combined.set(encrypted, nonce.length);

// 6. Convert to base64 for transmission
const encryptedBlob = util.encodeBase64(combined);
```

## URL Structure

Sync URLs follow this pattern:
```
https://stackmap.app/qual/?sync=a1b2c3d4e5f6789012345678901234567
```

- No special characters in the sync parameter
- No URL encoding needed (hex is URL-safe)
- No padding characters

## Security Considerations

1. **Key Derivation**: Uses 100,000 iterations for PBKDF2-like key stretching
2. **Fixed Salts**: Used for deterministic sync ID generation
3. **Device IDs**: Generated locally, never tied to user identity
4. **Version Control**: Prevents data loss from concurrent updates
5. **HTTPS Only**: All API communication must use HTTPS

## Error Handling

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

## Implementation Contract

### What the Client Guarantees:
1. Will generate cryptographically secure recovery phrases
2. Will properly encrypt all data before transmission
3. Will handle version conflicts gracefully
4. Will validate decrypted data before use
5. Will never send unencrypted user data

### What the Server Guarantees:
1. Will store encrypted blobs without modification
2. Will return the exact blob that was stored
3. Will properly track versions to prevent conflicts
4. Will return consistent JSON responses
5. Will never attempt to decrypt or analyze blob contents

## Testing Sync Functionality

### 1. Create New Sync
```bash
# Client generates recovery phrase
phrase="a1b2c3d4e5f6789012345678901234567"

# Client derives sync_id and creates sync
curl -X POST https://stackmap.app/api/sync/create.php \
  -H "Content-Type: application/json" \
  -d '{
    "sync_id": "derived_sync_id_here",
    "encrypted_blob": "encrypted_data_here"
  }'
```

### 2. Join Existing Sync
```bash
# User on new device enters recovery phrase
# Client derives same sync_id and pulls data
curl "https://stackmap.app/api/sync/pull.php?sync_id=derived_sync_id_here&device_id=new_device_id"
```

### 3. Push Updates
```bash
# Client encrypts new state and pushes
curl -X POST https://stackmap.app/api/sync/push.php \
  -H "Content-Type: application/json" \
  -d '{
    "sync_id": "derived_sync_id_here",
    "encrypted_blob": "new_encrypted_data",
    "device_id": "device_id",
    "previous_version": 1
  }'
```

## Common Issues and Solutions

### Issue: URL Encoding Problems
**Solution**: Use hex encoding for recovery phrases (no special characters)

### Issue: Version Conflicts
**Solution**: Client should pull latest before push, merge conflicts locally

### Issue: Large Data Sizes
**Solution**: Client implements compression before encryption

### Issue: Sync Not Found
**Solution**: Check sync_id derivation is deterministic and consistent

## Future Considerations

1. **Incremental Sync**: Currently uses full state sync. Could implement delta sync for efficiency.
2. **Multi-Device Presence**: Could track active devices per sync group.
3. **Backup Recovery**: Could implement encrypted backup endpoints.
4. **Sync History**: Could maintain version history for recovery purposes.

---

This specification defines the complete contract between client and server. Both sides can develop independently as long as they adhere to these interfaces and guarantees.