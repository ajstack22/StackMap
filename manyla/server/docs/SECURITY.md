# Sync Security Implementation Guide

## Overview

This guide provides detailed implementation instructions for building a zero-knowledge sync system similar to StackMap's architecture. It covers security considerations, implementation details, and code examples.

## Implementation Checklist

### Phase 1: Foundation
- [ ] Set up TweetNaCl.js for encryption
- [ ] Implement PBKDF2 key derivation
- [ ] Create recovery phrase generation
- [ ] Build basic encryption/decryption
- [ ] Set up secure storage for keys

### Phase 2: Server Infrastructure
- [ ] Create database schema
- [ ] Build REST API endpoints
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Set up HTTPS/TLS

### Phase 3: Client Implementation
- [ ] Build sync service layer
- [ ] Implement state management
- [ ] Create offline queue
- [ ] Add network monitoring
- [ ] Build UI components

### Phase 4: Advanced Features
- [ ] Implement conflict resolution
- [ ] Add incremental sync
- [ ] Build compression layer
- [ ] Create sync throttling
- [ ] Add performance monitoring

## Detailed Implementation

### 1. Encryption Service

```javascript
// encryptionService.js
import nacl from 'tweetnacl';
import { pbkdf2 } from 'pbkdf2';
import { randomBytes } from 'crypto';

class EncryptionService {
  constructor() {
    this.masterKey = null;
    this.syncId = null;
  }

  // Generate cryptographically secure recovery phrase
  generateRecoveryPhrase() {
    const wordlist = require('./wordlist.json'); // BIP39 wordlist
    const entropy = randomBytes(16); // 128 bits
    const words = [];
    
    for (let i = 0; i < 12; i++) {
      const index = (entropy[i] + (entropy[i + 1] || 0)) % wordlist.length;
      words.push(wordlist[index]);
    }
    
    return words.join(' ');
  }

  // Derive encryption key from recovery phrase
  async deriveKeyFromPhrase(recoveryPhrase, salt) {
    return new Promise((resolve, reject) => {
      const encoder = new TextEncoder();
      const phraseBuffer = encoder.encode(recoveryPhrase);
      const saltBuffer = nacl.util.decodeBase64(salt);
      
      pbkdf2(phraseBuffer, saltBuffer, 100000, 32, 'sha256', (err, key) => {
        if (err) reject(err);
        else resolve({ key: new Uint8Array(key), salt });
      });
    });
  }

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

  // Decrypt data with authentication verification
  decryptData(encryptedData) {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }
    
    const combined = nacl.util.decodeBase64(encryptedData);
    
    // Extract nonce and ciphertext
    const nonce = combined.slice(0, nacl.secretbox.nonceLength);
    const ciphertext = combined.slice(nacl.secretbox.nonceLength);
    
    // Decrypt and verify authentication
    const decrypted = nacl.secretbox.open(ciphertext, nonce, this.masterKey);
    
    if (!decrypted) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    const jsonString = nacl.util.encodeUTF8(decrypted);
    return JSON.parse(jsonString);
  }
}
```

### 2. Secure Storage

```javascript
// secureStorage.js
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SecureStorage {
  // Store sensitive data in device keychain
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

  // Retrieve sensitive data
  async getSecureData(key) {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      const credentials = await Keychain.getInternetCredentials('stackmap.sync');
      return credentials ? credentials.password : null;
    } else {
      const encrypted = await AsyncStorage.getItem(`@secure_${key}`);
      return encrypted ? await this.decryptFromStorage(encrypted) : null;
    }
  }

  // Additional web encryption layer
  async encryptForStorage(data) {
    // Use Web Crypto API for additional protection
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(data));
    
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
      key: await crypto.subtle.exportKey('jwk', key)
    };
  }
}
```

### 3. Server API Security

```php
// api/sync/base.php
<?php
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Rate limiting
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

// CORS headers for web clients
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed_origins = ['https://stackmap.app', 'https://www.stackmap.app'];
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type");
        header("Access-Control-Max-Age: 86400");
    }
}
```

### 4. Conflict Resolution

```javascript
// conflictResolver.js
class ConflictResolver {
  // Detect conflicts using three-way merge
  detectConflicts(localState, remoteState, lastSyncTime) {
    const conflicts = [];
    const visited = new Set();
    
    // Check all keys in both states
    const allKeys = new Set([
      ...Object.keys(localState),
      ...Object.keys(remoteState)
    ]);
    
    for (const key of allKeys) {
      if (visited.has(key)) continue;
      visited.add(key);
      
      const localValue = localState[key];
      const remoteValue = remoteState[key];
      
      // Skip if values are identical
      if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
        continue;
      }
      
      // Detect conflict based on timestamps
      const localModified = this.getModificationTime(localState, key);
      const remoteModified = this.getModificationTime(remoteState, key);
      
      if (localModified > lastSyncTime && remoteModified > lastSyncTime) {
        conflicts.push({
          key,
          localValue,
          remoteValue,
          localModified,
          remoteModified,
          type: this.determineConflictType(key)
        });
      }
    }
    
    return conflicts;
  }

  // Automatic resolution strategies
  async resolveConflicts(conflicts) {
    const resolved = [];
    const pending = [];
    
    for (const conflict of conflicts) {
      const strategy = this.getResolutionStrategy(conflict.type);
      
      if (strategy === 'auto') {
        resolved.push({
          ...conflict,
          resolution: this.autoResolve(conflict)
        });
      } else {
        pending.push(conflict);
      }
    }
    
    return { resolved, pending };
  }

  // Auto-resolution for simple conflicts
  autoResolve(conflict) {
    switch (conflict.type) {
      case 'array_append':
        // Merge arrays by combining unique items
        return [...new Set([
          ...conflict.localValue,
          ...conflict.remoteValue
        ])];
        
      case 'numeric_increment':
        // Sum increments from both sides
        const baseValue = this.getBaseValue(conflict.key);
        const localDelta = conflict.localValue - baseValue;
        const remoteDelta = conflict.remoteValue - baseValue;
        return baseValue + localDelta + remoteDelta;
        
      case 'timestamp':
        // Use most recent timestamp
        return Math.max(conflict.localValue, conflict.remoteValue);
        
      default:
        // Require user intervention
        return null;
    }
  }
}
```

### 5. Network Resilience

```javascript
// networkMonitor.js
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

  handleNetworkChange(isOnline) {
    const wasOnline = this.isOnline;
    this.isOnline = isOnline;
    
    if (wasOnline !== isOnline) {
      this.notifyListeners({ isOnline, wasOnline });
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }
}
```

### 6. Performance Optimization

```javascript
// syncThrottle.js
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
    
    // Immediate sync for high priority
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

  async executeSync(syncFunction) {
    if (this.syncInProgress) {
      return this.pendingSync;
    }
    
    this.syncInProgress = true;
    this.lastSyncTime = Date.now();
    
    try {
      const result = await syncFunction();
      this.pendingSync = null;
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }
}
```

## Security Best Practices

### 1. Key Management
- Never store master keys in plaintext
- Use platform-specific secure storage
- Implement key rotation capabilities
- Clear keys from memory after use

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
- Implement data retention policies
- Provide data export capabilities
- Enable complete data deletion

## Testing Strategies

### 1. Security Testing
```javascript
describe('Encryption Service', () => {
  test('should generate unique recovery phrases', () => {
    const phrase1 = encryptionService.generateRecoveryPhrase();
    const phrase2 = encryptionService.generateRecoveryPhrase();
    expect(phrase1).not.toBe(phrase2);
    expect(phrase1.split(' ')).toHaveLength(12);
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

### 2. Conflict Resolution Testing
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

## Conclusion

Building a zero-knowledge sync system requires careful attention to security, privacy, and user experience. This guide provides the foundation for implementing such a system, but always conduct thorough security audits and testing before deployment.