# Zero-Knowledge Sync Architecture Documentation

## Overview

StackMap implements a zero-knowledge, privacy-first synchronization system that allows users to sync their data across devices without creating accounts or exposing their data to the server. This document details the architecture, security design, and implementation patterns that can be modeled for similar systems.

## Core Principles

### 1. Zero-Knowledge Architecture
- **Server never sees plaintext data**: All data is encrypted client-side before transmission
- **No user accounts**: Authentication based solely on cryptographic proofs
- **No metadata exposure**: Server only stores encrypted blobs with minimal metadata
- **User-controlled**: Complete user control over data lifecycle

### 2. Privacy by Design
- **End-to-end encryption**: Data encrypted at rest and in transit
- **Recovery phrase authentication**: No usernames, emails, or passwords
- **Automatic data expiration**: 6-month cleanup policy for abandoned data
- **No analytics or tracking**: Server doesn't log user behavior

## Technical Architecture

### Encryption Layer

#### Key Derivation
```javascript
// Recovery phrase → Master key derivation
// Uses PBKDF2 with 100,000 iterations
async deriveKeyFromPhrase(recoveryPhrase, salt) {
  const encoder = new TextEncoder();
  const phraseBuffer = encoder.encode(recoveryPhrase);
  const saltBuffer = nacl.util.decodeBase64(salt);
  
  // PBKDF2 derivation
  const iterations = 100000;
  const keyLength = 32; // 256 bits
  const key = pbkdf2(phraseBuffer, saltBuffer, iterations, keyLength);
  
  return { key, salt };
}
```

#### Sync ID Generation
- Deterministic sync ID derived from recovery phrase
- Uses fixed salt for consistency across devices
- First 16 bytes of derived key used as sync ID

#### Encryption Process
1. **Symmetric encryption**: TweetNaCl.js secretbox (XSalsa20-Poly1305)
2. **Random nonce**: Generated for each encryption operation
3. **Data structure**: `nonce + ciphertext` concatenated
4. **Compression**: Applied before encryption if beneficial

### Data Flow

#### Initial Setup
```
User Device                    Server
    |                            |
    |-- Generate recovery phrase |
    |-- Derive sync ID          |
    |-- Encrypt initial data    |
    |                            |
    |-- POST /create.php ------->|
    |   {sync_id, encrypted_blob}|
    |                            |-- Store encrypted blob
    |<-- 200 OK -----------------|
```

#### Sync Process
```
User Device                    Server
    |                            |
    |-- Pull latest data ------->|
    |<-- Encrypted blob ---------|
    |                            |
    |-- Decrypt & merge          |
    |-- Detect conflicts         |
    |-- Resolve conflicts        |
    |-- Encrypt merged data      |
    |                            |
    |-- Push merged data ------->|
    |                            |-- Store new version
    |<-- 200 OK -----------------|
```

### Server Architecture

#### Database Schema
```sql
CREATE TABLE sync_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_id VARCHAR(32) NOT NULL,
  encrypted_blob MEDIUMTEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  device_id VARCHAR(32) NOT NULL,
  device_name VARCHAR(100),
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sync_id (sync_id),
  INDEX idx_last_modified (last_modified)
);
```

#### API Endpoints
- `POST /create.php` - Create new sync group
- `POST /push.php` - Update sync data
- `GET /pull.php` - Retrieve latest data
- `POST /delete.php` - Delete all sync data
- `GET /health.php` - Check server status

### Client Architecture

#### Service Layer Structure
```
/services/sync/
├── syncService.js       # Main orchestration
├── encryptionService.js # Crypto operations
├── changeTracker.js     # Track local changes
├── conflictResolver.js  # Handle merge conflicts
├── syncQueue.js         # Offline queue
├── networkMonitor.js    # Connection status
├── syncThrottle.js      # Rate limiting
└── syncHistory.js       # Audit trail
```

#### State Management
- Zustand store for application state
- AsyncStorage for persistent sync metadata
- Secure storage for recovery phrase (device keychain)

## Security Considerations

### Threat Model
1. **Server compromise**: Attacker gains access to server database
   - **Mitigation**: All data encrypted, no keys stored server-side
   
2. **Network interception**: MITM attacks on sync traffic
   - **Mitigation**: HTTPS + additional encryption layer
   
3. **Device compromise**: Attacker gains device access
   - **Mitigation**: Recovery phrase in secure storage, PIN protection

4. **Brute force**: Attempting to guess recovery phrases
   - **Mitigation**: High-entropy phrases, PBKDF2 key stretching

### Recovery Phrase Security
- **Generation**: Cryptographically secure random selection
- **Entropy**: 12 words from 2048-word list = 128 bits
- **Storage**: Device secure storage only
- **Display**: Show once during creation, user must save

### Data Minimization
- **Server stores**: Only encrypted blobs and sync metadata
- **No user data**: No emails, names, or identifiers
- **Automatic cleanup**: 6-month expiration for inactive data
- **User control**: Delete all data anytime

## Implementation Patterns

### 1. Offline-First Design
```javascript
class SyncQueue {
  async enqueue(operation) {
    // Store in AsyncStorage
    await this.persistQueue();
    
    // Process when online
    if (networkMonitor.isOnline) {
      await this.process();
    }
  }
}
```

### 2. Conflict Resolution
```javascript
// Three-way merge for conflicts
detectConflicts(localState, remoteState, baseState) {
  const conflicts = [];
  
  // Compare each field
  for (const key in localState) {
    if (localState[key] !== remoteState[key] &&
        localState[key] !== baseState[key] &&
        remoteState[key] !== baseState[key]) {
      conflicts.push({
        field: key,
        local: localState[key],
        remote: remoteState[key],
        base: baseState[key]
      });
    }
  }
  
  return conflicts;
}
```

### 3. Incremental Sync
```javascript
// Only sync changes since last successful sync
createIncrementalUpdate(lastSyncTime) {
  const changes = this.trackedChanges.filter(
    change => change.timestamp > lastSyncTime
  );
  
  if (changes.length === 0) return null;
  
  return {
    type: 'incremental',
    patch: this.createPatch(changes),
    baseVersion: this.lastSyncVersion
  };
}
```

### 4. Network Resilience
```javascript
// Exponential backoff for retries
async retryWithBackoff(operation, attempt = 1) {
  try {
    return await operation();
  } catch (error) {
    if (attempt >= MAX_RETRIES) throw error;
    
    const delay = Math.min(
      INITIAL_DELAY * Math.pow(2, attempt - 1),
      MAX_DELAY
    );
    
    await sleep(delay);
    return this.retryWithBackoff(operation, attempt + 1);
  }
}
```

## Privacy Features

### 1. No Account System
- No registration required
- No email verification
- No password resets
- Pure cryptographic authentication

### 2. Data Portability
- Export all data anytime
- Standard JSON format
- Complete data ownership
- No vendor lock-in

### 3. Transparency
- Open source implementation
- Auditable encryption
- No hidden behaviors
- Clear data policies

## Performance Optimizations

### 1. Compression
- Compress data before encryption when beneficial
- Typical 50-70% reduction for JSON data
- Skip compression for small payloads

### 2. Incremental Updates
- Track changes locally
- Send only differences
- Reduce bandwidth usage
- Faster sync operations

### 3. Intelligent Throttling
- Debounce rapid changes
- Batch operations
- Priority-based queue
- Adaptive sync intervals

## Best Practices

### 1. User Experience
- Clear communication about sync status
- Visible conflict resolution
- Offline capability messaging
- Recovery phrase importance

### 2. Error Handling
- Graceful degradation
- Clear error messages
- Automatic retry logic
- User-actionable feedback

### 3. Testing
- End-to-end encryption tests
- Conflict resolution scenarios
- Network failure simulation
- Performance benchmarks

## References

### Libraries Used
- **TweetNaCl.js**: High-security cryptographic library
- **PBKDF2**: Key derivation function
- **pako**: Compression library

### Standards Followed
- **RFC 8018**: PKCS #5 v2.1 (PBKDF2)
- **RFC 7539**: ChaCha20-Poly1305
- **BIP39**: Mnemonic recovery phrases

### Additional Resources
- [TweetNaCl.js Documentation](https://github.com/dchest/tweetnacl-js)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Zero-Knowledge Architecture Patterns](https://www.zeroknowledge.fm/)

## Contact

For questions about this architecture or implementation details, please refer to the StackMap GitHub repository or contact the development team.