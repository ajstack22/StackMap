# StackMap Zero-Knowledge Sync Security Architecture

**Last Updated: January 2025**

## Overview

This document details StackMap's privacy-first, zero-knowledge synchronization system that allows users to sync data across devices without creating accounts or exposing data to the server. This architecture serves as a reference implementation for building secure, privacy-focused sync systems.

## Production Status

✅ **Implemented and Working:**
- Zero-knowledge encryption with TweetNaCl.js
- PBKDF2 key derivation (100,000 iterations)
- Recovery phrase generation (32-char hex format)
- Sync URL sharing (?sync=recovery_phrase)
- Automatic data validation and repair
- Device ID tracking (hex encoding)
- Version conflict detection
- 6-month data cleanup policy
- Auto-repair for missing user fields
- Theme fallback handling
- Streamlined onboarding for sync URLs

🚧 **Security Enhancements Needed:**
- Rate limiting improvements
- Enhanced conflict resolution UI
- Better error recovery mechanisms

---

## Core Security Principles

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

### 3. Threat Model Protection
1. **Server compromise**: Attacker gains access to server database
   - **Mitigation**: All data encrypted, no keys stored server-side
   
2. **Network interception**: MITM attacks on sync traffic
   - **Mitigation**: HTTPS + additional encryption layer
   
3. **Device compromise**: Attacker gains device access
   - **Mitigation**: Recovery phrase in secure storage, PIN protection

4. **Brute force**: Attempting to guess recovery phrases
   - **Mitigation**: High-entropy phrases, PBKDF2 key stretching

---

## Encryption Implementation

### Key Derivation
```javascript
// Recovery phrase → Master key derivation
// Uses PBKDF2 with 100,000 iterations
async deriveKeyFromPhrase(recoveryPhrase, salt) {
  const encoder = new TextEncoder();
  const phraseBuffer = encoder.encode(recoveryPhrase);
  const saltBuffer = nacl.util.decodeBase64(salt);
  
  // PBKDF2 derivation - NEVER CHANGE ITERATION COUNT
  const iterations = 100000;
  const keyLength = 32; // 256 bits
  
  return new Promise((resolve, reject) => {
    pbkdf2(phraseBuffer, saltBuffer, iterations, keyLength, 'sha256', (err, key) => {
      if (err) reject(err);
      else resolve({ key: new Uint8Array(key), salt });
    });
  });
}
```

### Sync ID Generation
- **Deterministic sync ID** derived from recovery phrase
- **Fixed salt**: `U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=` for consistency across devices
- **First 16 bytes** of derived key used as sync ID (32-char hex)

### Encryption Process
1. **Symmetric encryption**: TweetNaCl.js secretbox (XSalsa20-Poly1305)
2. **Random nonce**: Generated for each encryption operation
3. **Data structure**: `nonce + ciphertext` concatenated
4. **Compression**: Applied before encryption when beneficial

```javascript
// Encrypt data with authenticated encryption
encryptData(data) {
  if (!this.masterKey) {
    throw new Error('Encryption not initialized');
  }
  
  const jsonString = JSON.stringify(data);
  const messageBytes = nacl.util.decodeUTF8(jsonString);
  
  // Generate random nonce
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  
  // Encrypt with authenticated encryption
  const encrypted = nacl.secretbox(messageBytes, nonce, this.masterKey);
  
  // Combine nonce and ciphertext
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  
  return nacl.util.encodeBase64(combined);
}
```

### Recovery Phrase Security
- **Generation**: Cryptographically secure random selection
- **Format**: 32 hex characters (128 bits entropy)
- **Storage**: Device secure storage only
- **Display**: Show once during creation, user must save
- **URL Format**: `stackmap.app/?sync=<32-char-hex>`

---

## Data Flow Architecture

### Initial Setup
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

### Sync Process
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

### Sync URL Flow
```
User A (Sharer)                Server                 User B (Joiner)
    |                            |                          |
    |-- Create sync group ------>|                          |
    |-- Generate share URL       |                          |
    |   stackmap.app/?sync=xyz   |                          |
    |                            |                          |
    |-- Share URL -------------->|---------------------->   |
    |                            |                          |
    |                            |<-- GET /pull.php -----   |
    |                            |-- Return encrypted ---    |
    |                            |                          |
    |                            |                       Decrypt
    |                            |                    Show preview
    |                            |                   Import data
```

---

## Server Security Implementation

### Database Schema
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

### API Security
```php
// Rate limiting implementation
function checkRateLimit($ip, $endpoint) {
    $redis = new Redis();
    $redis->connect('localhost', 6379);
    
    $key = "rate_limit:$ip:$endpoint";
    $count = $redis->incr($key);
    
    if ($count === 1) {
        $redis->expire($key, 60); // 1 minute window
    }
    
    if ($count > 30) { // 30 requests per minute
        http_response_code(429);
        die(json_encode(['error' => 'Rate limit exceeded']));
    }
}

// Input validation
function validateSyncId($syncId) {
    if (!preg_match('/^[a-f0-9]{32}$/', $syncId)) {
        http_response_code(400);
        die(json_encode(['error' => 'Invalid sync ID format']));
    }
}

// Sanitize encrypted blob
function validateEncryptedBlob($blob) {
    // Base64 validation
    if (!preg_match('/^[A-Za-z0-9+\/]+=*$/', $blob)) {
        http_response_code(400);
        die(json_encode(['error' => 'Invalid encrypted data format']));
    }
    
    // Size limit (5MB)
    if (strlen($blob) > 5 * 1024 * 1024) {
        http_response_code(413);
        die(json_encode(['error' => 'Payload too large']));
    }
}
```

### Security Headers
```php
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
```

---

## Client Architecture

### Service Layer Structure
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

### Secure Storage Implementation
```javascript
// Platform-specific secure storage
class SecureStorage {
  async storeSecureData(key, value) {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Use device keychain for mobile
      await Keychain.setInternetCredentials(
        'stackmap.sync',
        key,
        value
      );
    } else {
      // Use encrypted storage for web
      const encrypted = await this.encryptForStorage(value);
      await AsyncStorage.setItem(`@secure_${key}`, encrypted);
    }
  }

  async getSecureData(key) {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const credentials = await Keychain.getInternetCredentials('stackmap.sync');
      return credentials ? credentials.password : null;
    } else {
      const encrypted = await AsyncStorage.getItem(`@secure_${key}`);
      return encrypted ? await this.decryptFromStorage(encrypted) : null;
    }
  }
}
```

---

## Conflict Resolution Security

### Three-Way Merge
```javascript
// Secure conflict detection
detectConflicts(localState, remoteState, baseState) {
  const conflicts = [];
  
  // Compare each field securely
  for (const key in localState) {
    if (localState[key] !== remoteState[key] &&
        localState[key] !== baseState[key] &&
        remoteState[key] !== baseState[key]) {
      conflicts.push({
        field: key,
        local: localState[key],
        remote: remoteState[key],
        base: baseState[key],
        timestamp: Date.now()
      });
    }
  }
  
  return conflicts;
}
```

### Automatic Resolution Strategies
```javascript
// Safe auto-resolution for simple conflicts
autoResolve(conflict) {
  switch (conflict.type) {
    case 'array_append':
      // Merge arrays by combining unique items
      return [...new Set([
        ...conflict.localValue,
        ...conflict.remoteValue
      ])];
      
    case 'timestamp':
      // Use most recent timestamp
      return Math.max(conflict.localValue, conflict.remoteValue);
      
    default:
      // Require user intervention for complex conflicts
      return null;
  }
}
```

---

## Network Security & Resilience

### Connection Monitoring
```javascript
class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Set();
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
    
    // Periodic connectivity check
    setInterval(() => this.checkConnectivity(), 30000);
  }

  async checkConnectivity() {
    try {
      const response = await fetch('/api/sync/health.php', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      this.handleNetworkChange(response.ok);
    } catch (error) {
      this.handleNetworkChange(false);
    }
  }
}
```

### Retry Logic with Exponential Backoff
```javascript
// Network resilience for sync operations
async retryWithBackoff(operation, attempt = 1) {
  try {
    return await operation();
  } catch (error) {
    // Handle network suspension errors
    if (error.message.includes('ERR_NETWORK_IO_SUSPENDED') || 
        error.message.includes('ERR_SOCKS_CONNECTION_FAILED')) {
      
      const maxRetries = 3;
      if (attempt <= maxRetries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.retryWithBackoff(operation, attempt + 1);
      }
    }
    throw error;
  }
}
```

---

## Performance & Security Optimizations

### Sync Throttling
```javascript
class SyncThrottle {
  constructor() {
    this.pendingSync = null;
    this.syncTimeout = null;
    this.lastSyncTime = 0;
    this.minInterval = 5000; // 5 seconds
    this.maxDelay = 30000; // 30 seconds
  }

  async requestSync(syncFunction, options = {}) {
    const { priority = 'normal', immediate = false } = options;
    
    // Clear existing timeout
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    
    // Immediate sync for high priority or security-critical operations
    if (immediate || priority === 'high') {
      return this.executeSync(syncFunction);
    }
    
    // Calculate delay based on activity
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    const delay = Math.min(
      Math.max(this.minInterval - timeSinceLastSync, 0),
      this.maxDelay
    );
    
    // Schedule sync
    this.pendingSync = syncFunction;
    this.syncTimeout = setTimeout(() => {
      this.executeSync(syncFunction);
    }, delay);
  }
}
```

### Data Compression
- **Compress before encryption** when beneficial
- **Typical 50-70% reduction** for JSON data
- **Skip compression** for small payloads (<1KB)
- **Validate compressed data** before transmission

---

## Security Best Practices

### 1. Key Management
- Never store master keys in plaintext
- Use platform-specific secure storage
- Clear keys from memory after use
- Implement key rotation capabilities

### 2. Error Handling
- Never expose internal errors to users
- Log security events for monitoring
- Implement proper error recovery
- Use timing-safe comparisons

### 3. Input Validation
- Validate all inputs server-side
- Use parameterized queries
- Implement size limits
- Sanitize user-generated content

### 4. Network Security
- Always use HTTPS/TLS
- Implement certificate pinning
- Use secure headers
- Enable HSTS

### 5. Privacy Protection
- Minimize data collection
- Implement data retention policies (6-month cleanup)
- Provide data export capabilities
- Enable complete data deletion

---

## Security Testing Strategies

### Encryption Testing
```javascript
describe('Encryption Service', () => {
  test('should generate unique recovery phrases', () => {
    const phrase1 = encryptionService.generateRecoveryPhrase();
    const phrase2 = encryptionService.generateRecoveryPhrase();
    expect(phrase1).not.toBe(phrase2);
    expect(phrase1).toHaveLength(32); // 32 hex chars
    expect(phrase1).toMatch(/^[a-f0-9]{32}$/); // Valid hex
  });

  test('should derive consistent keys', async () => {
    const phrase = 'test phrase for key derivation';
    const salt = 'fixedSalt';
    
    const key1 = await encryptionService.deriveKeyFromPhrase(phrase, salt);
    const key2 = await encryptionService.deriveKeyFromPhrase(phrase, salt);
    
    expect(key1.key).toEqual(key2.key);
  });

  test('should fail decryption with wrong key', () => {
    const data = { test: 'data' };
    const encrypted = encryptionService.encryptData(data);
    
    // Change key
    encryptionService.masterKey = new Uint8Array(32);
    
    expect(() => encryptionService.decryptData(encrypted)).toThrow();
  });
});
```

### Conflict Resolution Testing
```javascript
describe('Conflict Resolution', () => {
  test('should detect simultaneous edits', () => {
    const local = { task: 'Local edit', modified: 1000 };
    const remote = { task: 'Remote edit', modified: 1001 };
    const lastSync = 999;
    
    const conflicts = resolver.detectConflicts(local, remote, lastSync);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].key).toBe('task');
  });
});
```

---

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

---

## Implementation Checklist

### Phase 1: Foundation
- [x] Set up TweetNaCl.js for encryption
- [x] Implement PBKDF2 key derivation
- [x] Create recovery phrase generation
- [x] Build basic encryption/decryption
- [x] Set up secure storage for keys

### Phase 2: Server Infrastructure
- [x] Create database schema
- [x] Build REST API endpoints
- [x] Implement rate limiting
- [x] Add input validation
- [x] Set up HTTPS/TLS

### Phase 3: Client Implementation
- [x] Build sync service layer
- [x] Implement state management
- [x] Create offline queue
- [x] Add network monitoring
- [x] Build UI components

### Phase 4: Advanced Features
- [x] Implement conflict resolution
- [x] Add incremental sync
- [x] Build compression layer
- [x] Create sync throttling
- [x] Add performance monitoring

---

## Deployment Considerations

### 1. Infrastructure
- Use HTTPS with strong TLS configuration
- Implement DDoS protection
- Set up monitoring and alerting
- Enable automatic backups

### 2. Compliance
- Document data handling procedures
- Implement GDPR compliance features
- Provide transparency reports
- Enable audit logging

### 3. Scalability
- Design for horizontal scaling
- Implement caching strategies
- Use CDN for static assets
- Monitor performance metrics

---

## References

### Libraries Used
- **TweetNaCl.js**: High-security cryptographic library
- **PBKDF2**: Key derivation function (100,000 iterations)
- **pako**: Compression library

### Standards Followed
- **RFC 8018**: PKCS #5 v2.1 (PBKDF2)
- **RFC 7539**: ChaCha20-Poly1305
- **BIP39**: Mnemonic recovery phrases (concept)

### Additional Resources
- [TweetNaCl.js Documentation](https://github.com/dchest/tweetnacl-js)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Zero-Knowledge Architecture Patterns](https://www.zeroknowledge.fm/)

---

## Conclusion

StackMap's zero-knowledge sync architecture demonstrates that it's possible to build secure, privacy-first synchronization without compromising user experience. The system provides end-to-end encryption, eliminates the need for user accounts, and ensures complete user control over their data.

This architecture serves as a reference implementation for other applications seeking to implement similar privacy-focused sync capabilities while maintaining security, performance, and usability.