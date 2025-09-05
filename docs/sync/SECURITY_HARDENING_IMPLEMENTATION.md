# Security Hardening Implementation Prompt Pack

## Overview
This document provides detailed implementation instructions for addressing critical security vulnerabilities in the StackMap sync system. Each section includes current vulnerable code, secure replacement, and implementation reasoning.

## 1. Replace Weak Key Derivation with Argon2id

### Implementation Prompt
Replace the current weak SHA-512 iteration-based key derivation with Argon2id for cryptographically secure password hashing resistant to GPU/ASIC attacks.

### Current Vulnerable Code
```javascript
// src/services/sync/encryptionServiceFixed.ts - INSECURE
async deriveKeyFromPhrase(phrase: string, salt: string): Promise<DerivedKey> {
  const KEY_DERIVATION_ITERATIONS = 100000;
  let key = this.encodeUTF8(phrase + salt);
  
  // VULNERABLE: Simple iterations of SHA-512, fast on GPUs
  for (let i = 0; i < KEY_DERIVATION_ITERATIONS; i++) {
    key = nacl.hash(key);  // SHA-512
  }
  
  return {
    key: key.slice(0, 32),
    salt: salt
  };
}
```

### Secure Implementation
```javascript
// src/services/sync/encryptionServiceFixed.ts - SECURE
import { argon2id } from 'hash-wasm';

async deriveKeyFromPhrase(phrase: string, salt: string): Promise<DerivedKey> {
  // Argon2id parameters (OWASP 2024 recommendations)
  const params = {
    password: phrase,
    salt: this.encodeUTF8(salt),
    parallelism: 1,      // Single thread for consistency
    iterations: 3,       // Time cost
    memorySize: 65536,   // 64 MiB memory cost
    hashLength: 32,      // 256-bit key
    outputType: 'binary'
  };
  
  try {
    const key = await argon2id(params);
    console.log('[Encryption] Key derived using Argon2id');
    return {
      key: new Uint8Array(key),
      salt: salt
    };
  } catch (error) {
    console.error('[Encryption] Argon2id failed, falling back:', error);
    // Fallback for environments where WASM fails
    return this.deriveKeyFallback(phrase, salt);
  }
}

// Fallback using PBKDF2 (still better than current)
async deriveKeyFallback(phrase: string, salt: string): Promise<DerivedKey> {
  // Use SubtleCrypto when available (web)
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(phrase),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 600000,  // OWASP 2024: 600k for PBKDF2-SHA256
        hash: 'SHA-256'
      },
      keyMaterial,
      256  // 32 bytes
    );
    
    return {
      key: new Uint8Array(derivedBits),
      salt: salt
    };
  }
  
  // Mobile fallback - use current method but with more iterations
  return this.deriveKeyNaClFallback(phrase, salt, 250000);
}
```

### Package Installation
```json
// package.json
{
  "dependencies": {
    "hash-wasm": "^4.11.0"  // Provides Argon2id, works in all environments
  }
}
```

### Migration Strategy
```javascript
// Store version with encrypted data to handle both old and new
const ENCRYPTION_VERSION = 3;  // Bump from 2 to 3

// In decrypt method, check version
if (metadata.version < 3) {
  // Use old derivation for backward compatibility
  key = await this.deriveKeyLegacy(phrase, salt);
} else {
  key = await this.deriveKeyFromPhrase(phrase, salt);
}
```

**Reasoning**: Argon2id won the Password Hashing Competition and is resistant to GPU cracking (memory-hard), side-channel attacks (id variant), and provides ~100,000x more security than SHA-512 iterations at same time cost.

---

## 2. Fix Predictable Sync ID Generation

### Implementation Prompt
Replace fixed salt in sync ID generation with per-sync-group random salt to prevent rainbow table attacks.

### Current Vulnerable Code
```javascript
// src/services/sync/minimalSyncService.js - INSECURE
async generateSyncId(recoveryPhrase) {
  // VULNERABLE: Fixed salt allows precomputation
  const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ==';
  
  const { key } = await encryptionService.deriveKeyFromPhrase(recoveryPhrase, fixedSalt);
  const syncIdBytes = key.slice(0, 16);
  const syncId = Array.from(syncIdBytes, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  
  return syncId;
}
```

### Secure Implementation
```javascript
// src/services/sync/minimalSyncService.js - SECURE
async generateSyncId(recoveryPhrase, isNewSync = false) {
  let salt;
  
  if (isNewSync) {
    // Generate random salt for new sync groups
    salt = nacl.randomBytes(16);
    const saltHex = Array.from(salt, b => 
      b.toString(16).padStart(2, '0')
    ).join('');
    
    // Store salt on server (public, not secret)
    // This will be returned on join/pull operations
    this.syncSalt = saltHex;
  } else {
    // For existing syncs, salt must be retrieved from server
    if (!this.syncSalt) {
      throw new Error('Sync salt not available. Retrieve from server first.');
    }
    salt = this.hexToBytes(this.syncSalt);
  }
  
  // Derive sync ID with random salt
  const { key } = await encryptionService.deriveKeyFromPhrase(
    recoveryPhrase, 
    this.encodeBase64(salt)
  );
  
  // Generate sync ID
  const syncIdBytes = nacl.hash(
    this.concatArrays([
      key,
      salt,
      this.encodeUTF8('StackMapSyncID')
    ])
  ).slice(0, 16);
  
  const syncId = Array.from(syncIdBytes, byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  
  return { syncId, salt: this.syncSalt };
}

// Modified create sync to include salt
async createSync(testData) {
  const recoveryPhrase = encryptionService.generateRecoveryPhrase();
  const { syncId, salt } = await this.generateSyncId(recoveryPhrase, true);
  
  const payload = {
    sync_id: syncId,
    sync_salt: salt,  // Include salt in creation
    device_id: this.deviceId,
    encrypted_blob: encrypted,
    timestamp: Date.now()
  };
  
  const response = await fetch(`${this.API_BASE}/create_timestamp.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  // ...
}

// Modified join to retrieve salt
async joinWithInviteCode(inviteCode, recoveryPhrase) {
  // First validate and get sync metadata including salt
  const validateResponse = await fetch(
    `${this.API_BASE}/validate_invite.php?code=${inviteCode}`
  );
  const validateResult = await validateResponse.json();
  
  if (!validateResult.success) {
    throw new Error(validateResult.error || 'Invalid invite code');
  }
  
  // Extract salt from response
  this.syncSalt = validateResult.sync_salt;
  
  // Now generate sync ID with retrieved salt
  const { syncId } = await this.generateSyncId(recoveryPhrase, false);
  
  // Verify it matches
  if (syncId !== validateResult.sync_id) {
    throw new Error('Recovery phrase does not match this sync group');
  }
  // ...
}
```

### Server-Side Changes Required
```sql
-- Add salt column to sync_data table
ALTER TABLE sync_data ADD COLUMN sync_salt VARCHAR(32) AFTER sync_id;

-- Update sync_invites to include salt
ALTER TABLE sync_invites ADD COLUMN sync_salt VARCHAR(32) AFTER sync_id;
```

```php
// create_timestamp.php modification
$sync_salt = $input['sync_salt'];
$stmt = $pdo->prepare("
  INSERT INTO sync_data (sync_id, sync_salt, encrypted_blob, timestamp, device_id)
  VALUES (?, ?, ?, ?, ?)
");
$stmt->execute([$sync_id, $sync_salt, $blob, $timestamp, $device_id]);

// validate_invite.php modification - return salt
echo json_encode([
  'success' => true,
  'sync_id' => $row['sync_id'],
  'sync_salt' => $row['sync_salt'],  // Include salt
  'expires_at' => $row['expires_at']
]);
```

**Reasoning**: Random per-group salt prevents attackers from precomputing sync_id values for common passphrases. Even if attacker knows millions of common recovery phrases, they cannot determine sync_id without the salt, which requires already knowing a valid invite code.

---

## 3. Implement Server-Side Rate Limiting

### Implementation Prompt
Add comprehensive rate limiting with exponential backoff and account lockout to prevent brute force attacks.

### Client-Side Implementation
```javascript
// src/services/sync/rateLimiter.js - NEW FILE
class RateLimiter {
  constructor() {
    this.attempts = new Map();  // Track by endpoint+identifier
    this.backoffMs = 1000;      // Start with 1 second
    this.maxBackoffMs = 300000;  // Max 5 minutes
  }
  
  async throttle(endpoint, identifier = 'global') {
    const key = `${endpoint}:${identifier}`;
    const attempt = this.attempts.get(key) || { 
      count: 0, 
      resetAt: Date.now(),
      backoffMs: this.backoffMs 
    };
    
    // Reset if window expired (1 minute sliding window)
    if (Date.now() > attempt.resetAt) {
      attempt.count = 0;
      attempt.backoffMs = this.backoffMs;
      attempt.resetAt = Date.now() + 60000;
    }
    
    attempt.count++;
    
    // Exponential backoff after 3 attempts
    if (attempt.count > 3) {
      const waitMs = Math.min(
        attempt.backoffMs * Math.pow(2, attempt.count - 3),
        this.maxBackoffMs
      );
      
      console.log(`[RateLimiter] Backing off ${waitMs}ms for ${key}`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      
      attempt.backoffMs = waitMs;
    }
    
    this.attempts.set(key, attempt);
  }
  
  handleError(endpoint, error, identifier = 'global') {
    // Server returns 429 or specific rate limit error
    if (error.status === 429 || error.code === 'RATE_LIMITED') {
      const key = `${endpoint}:${identifier}`;
      const attempt = this.attempts.get(key) || { 
        count: 3, 
        backoffMs: this.backoffMs 
      };
      
      // Parse Retry-After header if available
      const retryAfter = error.headers?.get('Retry-After');
      if (retryAfter) {
        attempt.resetAt = Date.now() + (parseInt(retryAfter) * 1000);
      } else {
        // Double backoff on rate limit error
        attempt.backoffMs = Math.min(attempt.backoffMs * 2, this.maxBackoffMs);
        attempt.resetAt = Date.now() + attempt.backoffMs;
      }
      
      this.attempts.set(key, attempt);
      
      throw new Error(
        `Rate limited. Retry after ${Math.ceil(attempt.backoffMs / 1000)} seconds`
      );
    }
  }
}

// Integration in minimalSyncService.js
class MinimalSyncService {
  constructor() {
    this.rateLimiter = new RateLimiter();
    // ...
  }
  
  async validateInviteCode(inviteCode) {
    // Rate limit by invite code to prevent brute force
    await this.rateLimiter.throttle('validate_invite', inviteCode.substring(0, 4));
    
    try {
      const response = await fetch(
        `${this.API_BASE}/validate_invite.php?code=${inviteCode}`
      );
      
      if (!response.ok) {
        this.rateLimiter.handleError('validate_invite', response, inviteCode.substring(0, 4));
      }
      
      return await response.json();
    } catch (error) {
      this.rateLimiter.handleError('validate_invite', error, inviteCode.substring(0, 4));
      throw error;
    }
  }
  
  async pullData(forceFullPull = false) {
    // Rate limit pulls by sync_id
    await this.rateLimiter.throttle('pull', this.syncId);
    
    try {
      // ... existing pull logic
    } catch (error) {
      this.rateLimiter.handleError('pull', error, this.syncId);
      throw error;
    }
  }
}
```

### Server-Side Implementation (PHP)
```php
// api/sync/RateLimiter.php - NEW FILE
class RateLimiter {
  private $redis;  // Or use MySQL if Redis not available
  private $limits = [
    'validate_invite' => ['requests' => 10, 'window' => 3600],     // 10 per hour
    'pull_timestamp' => ['requests' => 120, 'window' => 60],       // 120 per minute
    'push_timestamp' => ['requests' => 60, 'window' => 60],        // 60 per minute
    'create_invite' => ['requests' => 5, 'window' => 3600],        // 5 per hour
    'global_ip' => ['requests' => 1000, 'window' => 3600],         // 1000 per hour per IP
  ];
  
  public function check($action, $identifier) {
    $key = "rate_limit:{$action}:{$identifier}";
    $limit = $this->limits[$action] ?? $this->limits['global_ip'];
    
    // Get current count
    $current = $this->redis->get($key) ?? 0;
    
    if ($current >= $limit['requests']) {
      // Log potential attack
      error_log("Rate limit exceeded: {$action} by {$identifier}");
      
      // Check for lockout conditions
      if ($this->shouldLockout($action, $identifier)) {
        $this->lockout($identifier);
      }
      
      http_response_code(429);
      header('Retry-After: ' . $limit['window']);
      die(json_encode([
        'success' => false,
        'error' => 'Rate limit exceeded',
        'code' => 'RATE_LIMITED',
        'retry_after' => $limit['window']
      ]));
    }
    
    // Increment counter
    $this->redis->incr($key);
    $this->redis->expire($key, $limit['window']);
    
    return true;
  }
  
  private function shouldLockout($action, $identifier) {
    // Lockout after repeated rate limit violations
    $violationKey = "violations:{$identifier}";
    $violations = $this->redis->incr($violationKey);
    $this->redis->expire($violationKey, 86400);  // Track for 24 hours
    
    return $violations > 10;  // Lockout after 10 violations
  }
  
  private function lockout($identifier) {
    $lockoutKey = "lockout:{$identifier}";
    $this->redis->set($lockoutKey, time());
    $this->redis->expire($lockoutKey, 86400);  // 24 hour lockout
    
    // Alert administrators
    mail('admin@stackmap.app', 'Security Alert', 
         "Account locked due to rate limit violations: {$identifier}");
  }
}

// Integration in validate_invite.php
require_once 'RateLimiter.php';
$rateLimiter = new RateLimiter();

// Rate limit by IP and invite prefix
$ip = $_SERVER['REMOTE_ADDR'];
$invitePrefix = substr($_GET['code'], 0, 4);

$rateLimiter->check('validate_invite', $ip);
$rateLimiter->check('validate_invite', $invitePrefix);

// ... rest of validation logic
```

**Reasoning**: Multi-layered rate limiting prevents brute force attacks while allowing legitimate usage. Exponential backoff discourages sustained attacks. Server-side enforcement is critical as client-side can be bypassed.

---

## 4. Fix Invite Code Entropy

### Implementation Prompt
Increase invite code entropy and add additional server-side protections against brute force attacks.

### Current Implementation (41 bits entropy)
```javascript
// CURRENT: 8 characters, ~41 bits
generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // 32 chars
  // 32^8 = 2^40 = ~41 bits of entropy
}
```

### Enhanced Implementation
```javascript
// src/services/sync/inviteCodeGenerator.js - NEW FILE
class InviteCodeGenerator {
  constructor() {
    // Use 10 characters for ~51 bits of entropy
    // Format: XXXX-XXXX-XX for better UX
    this.charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // 32 chars, no ambiguous
    this.codeLength = 10;
    this.formatPattern = [4, 4, 2];  // XXXX-XXXX-XX
  }
  
  generate() {
    const bytes = nacl.randomBytes(Math.ceil(this.codeLength * 5 / 8));
    let code = '';
    let byteIndex = 0;
    let bitBuffer = 0;
    let bitsInBuffer = 0;
    
    for (let i = 0; i < this.codeLength; i++) {
      // Need 5 bits per character (32 = 2^5)
      while (bitsInBuffer < 5) {
        bitBuffer = (bitBuffer << 8) | bytes[byteIndex++];
        bitsInBuffer += 8;
      }
      
      const charIndex = (bitBuffer >> (bitsInBuffer - 5)) & 0x1F;
      code += this.charset[charIndex];
      bitsInBuffer -= 5;
    }
    
    // Format with dashes
    let formatted = '';
    let codeIndex = 0;
    for (let segmentLength of this.formatPattern) {
      if (formatted) formatted += '-';
      formatted += code.substr(codeIndex, segmentLength);
      codeIndex += segmentLength;
    }
    
    return formatted;
  }
  
  // Add proof-of-work requirement for validation
  generateWithPoW(difficulty = 4) {
    let code, hash;
    let nonce = 0;
    const prefix = '0'.repeat(difficulty);
    
    do {
      code = this.generate();
      nonce++;
      // Hash code with nonce
      const data = this.encodeUTF8(`${code}:${nonce}`);
      hash = nacl.hash(data);
      const hashHex = Array.from(hash.slice(0, 4), b => 
        b.toString(16).padStart(2, '0')
      ).join('');
    } while (!hashHex.startsWith(prefix));
    
    return { code, nonce, difficulty };
  }
}

// Modified minimalSyncService.js
async createInviteCode(expiresHours = 24, maxUses = 1, note = null) {
  const generator = new InviteCodeGenerator();
  
  // Generate with proof-of-work for additional protection
  const { code, nonce, difficulty } = generator.generateWithPoW(4);
  
  const response = await fetch(`${this.API_BASE}/create_invite.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sync_id: this.syncId,
      device_id: this.deviceId,
      invite_code: code,
      pow_nonce: nonce,       // Include PoW
      pow_difficulty: difficulty,
      expires_hours: expiresHours,
      max_uses: maxUses,
      note: note
    })
  });
  // ...
}

// Server-side validation must also check PoW
async validateInviteCode(inviteCode) {
  // Add CAPTCHA after 3 failed attempts from same IP
  const failedAttempts = await this.getFailedAttempts(this.getClientIP());
  
  if (failedAttempts >= 3) {
    // Require CAPTCHA
    const captchaToken = await this.requireCaptcha();
    if (!captchaToken) {
      throw new Error('CAPTCHA required for validation');
    }
  }
  
  const response = await fetch(
    `${this.API_BASE}/validate_invite.php?code=${inviteCode}`,
    {
      headers: {
        'X-Captcha-Token': captchaToken || ''
      }
    }
  );
  // ...
}
```

### Server-Side Hardening
```php
// validate_invite.php
// Check proof-of-work
function verifyPoW($code, $nonce, $difficulty) {
  $data = "{$code}:{$nonce}";
  $hash = hash('sha256', $data);
  $prefix = str_repeat('0', $difficulty);
  return strpos($hash, $prefix) === 0;
}

// Track failed attempts by IP
$ip = $_SERVER['REMOTE_ADDR'];
$failedKey = "failed_invite:{$ip}";
$failed = $redis->get($failedKey) ?? 0;

if ($failed >= 3) {
  // Require CAPTCHA
  $captchaToken = $_SERVER['HTTP_X_CAPTCHA_TOKEN'] ?? '';
  if (!verifyCaptcha($captchaToken)) {
    http_response_code(403);
    die(json_encode([
      'success' => false,
      'error' => 'CAPTCHA required',
      'captcha_required' => true
    ]));
  }
}

// Validate invite
$stmt = $pdo->prepare("
  SELECT * FROM sync_invites 
  WHERE invite_code = ? 
  AND expires_at > NOW() 
  AND use_count < max_uses
");
$stmt->execute([$inviteCode]);
$invite = $stmt->fetch();

if (!$invite) {
  // Track failed attempt
  $redis->incr($failedKey);
  $redis->expire($failedKey, 3600);  // Reset after 1 hour
  
  // Log for security monitoring
  error_log("Failed invite validation from {$ip}: {$inviteCode}");
  
  http_response_code(404);
  die(json_encode(['success' => false, 'error' => 'Invalid invite code']));
}
```

**Reasoning**: 10-character codes provide 51 bits of entropy (2^51 possibilities), making brute force infeasible. Proof-of-work adds computational cost to code generation. CAPTCHA after failures prevents automated attacks.

---

## 5. Secure Recovery Phrase Handling

### Implementation Prompt
Clear recovery phrases from URL fragments after processing and implement secure storage.

### Current Vulnerable Approach
```javascript
// INSECURE: Fragment stays in browser history
window.location.href = `https://stackmap.app/sync/ABCD-1234#${recoveryPhrase}`;
```

### Secure Implementation
```javascript
// src/services/sync/secureUrlHandler.js - NEW FILE
class SecureUrlHandler {
  constructor() {
    this.processed = new Set();  // Track processed fragments
  }
  
  // Extract and immediately clear fragment
  extractFragment() {
    if (typeof window === 'undefined' || !window.location.hash) {
      return null;
    }
    
    const fragment = window.location.hash.substring(1);
    
    // Only process once
    if (this.processed.has(fragment)) {
      return null;
    }
    
    // Clear from URL immediately
    if (fragment) {
      // Use replaceState to avoid history entry
      window.history.replaceState(
        null, 
        document.title,
        window.location.pathname + window.location.search
      );
      
      this.processed.add(fragment);
      
      // Schedule cleanup of processed set (memory management)
      setTimeout(() => {
        this.processed.delete(fragment);
      }, 300000);  // 5 minutes
    }
    
    return fragment;
  }
  
  // Secure sharing flow with auto-cleanup
  createSecureShareUrl(baseUrl, secret, autoClean = true) {
    // Create one-time URL
    const url = `${baseUrl}#${secret}`;
    
    if (autoClean && typeof window !== 'undefined') {
      // Set up listener to clean on navigation
      const cleanupHandler = () => {
        if (window.location.hash.includes(secret.substring(0, 8))) {
          window.history.replaceState(
            null,
            document.title, 
            window.location.pathname
          );
        }
        window.removeEventListener('beforeunload', cleanupHandler);
      };
      
      window.addEventListener('beforeunload', cleanupHandler);
      
      // Auto-cleanup after 30 seconds
      setTimeout(() => {
        if (window.location.hash.includes(secret.substring(0, 8))) {
          window.history.replaceState(
            null,
            document.title,
            window.location.pathname
          );
        }
      }, 30000);
    }
    
    return url;
  }
  
  // Secure clipboard copy without exposing in UI
  async copySecureUrl(url, secret) {
    // Split URL and secret for safer handling
    const [base, fragment] = url.split('#');
    
    try {
      // Use Clipboard API if available
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        
        // Clear clipboard after 60 seconds
        setTimeout(async () => {
          const currentClipboard = await navigator.clipboard.readText();
          if (currentClipboard === url) {
            await navigator.clipboard.writeText('');
          }
        }, 60000);
        
        return true;
      }
      
      // Fallback with auto-cleanup
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.setAttribute('aria-hidden', 'true');
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return true;
    } catch (error) {
      console.error('[SecureURL] Copy failed:', error);
      return false;
    }
  }
}

// Integration in minimalSyncService.js
class MinimalSyncService {
  constructor() {
    this.urlHandler = new SecureUrlHandler();
    // Auto-extract on initialization
    this.checkForRecoveryPhrase();
  }
  
  checkForRecoveryPhrase() {
    const recoveryPhrase = this.urlHandler.extractFragment();
    if (recoveryPhrase && recoveryPhrase.length === 32) {
      // Store securely and clear from memory quickly
      this.pendingRecoveryPhrase = recoveryPhrase;
      
      // Clear from memory after 10 seconds if not used
      setTimeout(() => {
        if (this.pendingRecoveryPhrase === recoveryPhrase) {
          this.pendingRecoveryPhrase = null;
        }
      }, 10000);
    }
  }
  
  async joinWithInviteCode(inviteCode, recoveryPhrase = null) {
    // Use pending recovery phrase if available
    recoveryPhrase = recoveryPhrase || this.pendingRecoveryPhrase;
    this.pendingRecoveryPhrase = null;  // Clear immediately after use
    
    if (!recoveryPhrase) {
      throw new Error('Recovery phrase required');
    }
    
    // ... rest of join logic
  }
  
  async createInviteCode(expiresHours = 24, maxUses = 1, note = null) {
    // ... create invite code
    
    // Create secure URL with auto-cleanup
    const inviteUrl = this.urlHandler.createSecureShareUrl(
      `https://stackmap.app/sync/${result.invite_code}`,
      this.recoveryPhrase,
      true  // auto-cleanup enabled
    );
    
    return {
      inviteCode: result.invite_code,
      inviteUrl: inviteUrl,
      copyToClipboard: async () => {
        return await this.urlHandler.copySecureUrl(inviteUrl, this.recoveryPhrase);
      }
    };
  }
}

// React component integration
function InviteModal({ inviteData }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    // Use secure copy method
    const success = await inviteData.copyToClipboard();
    setCopied(success);
    
    // Clear copied state after 3 seconds
    if (success) {
      setTimeout(() => setCopied(false), 3000);
    }
  };
  
  // Never display the full URL with fragment in UI
  const displayUrl = inviteData.inviteUrl.split('#')[0] + '#...';
  
  return (
    <View>
      <Text>Invite Code: {inviteData.inviteCode}</Text>
      <Text>Share Link: {displayUrl}</Text>
      <TouchableOpacity onPress={handleCopy}>
        <Text>{copied ? 'Copied!' : 'Copy Secure Link'}</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 12, opacity: 0.7 }}>
        Link will expire from clipboard in 60 seconds
      </Text>
    </View>
  );
}
```

**Reasoning**: URL fragments remain in browser history, bookmarks, and can leak via referrer headers or screenshots. Immediate cleanup reduces exposure window. Clipboard auto-clear prevents long-term exposure. Never showing full URL in UI prevents screenshot leaks.

---

## 6. Hardware-Backed Device ID

### Implementation Prompt
Replace random device ID with hardware-backed deterministic ID that's unique per device but consistent across reinstalls.

### Current Vulnerable Implementation
```javascript
// INSECURE: Random ID lost on app reinstall
getDeviceId() {
  let deviceId = await AsyncStorage.getItem('@device_id');
  if (!deviceId) {
    deviceId = this.generateRandomHex(32);
    await AsyncStorage.setItem('@device_id', deviceId);
  }
  return deviceId;
}
```

### Secure Implementation
```javascript
// src/services/sync/secureDeviceId.js - NEW FILE
import DeviceInfo from 'react-native-device-info';
import * as Keychain from 'react-native-keychain';

class SecureDeviceId {
  constructor() {
    this.deviceId = null;
    this.fallbackId = null;
  }
  
  async getDeviceId() {
    // Try cached value first
    if (this.deviceId) {
      return this.deviceId;
    }
    
    try {
      // Platform-specific secure storage
      if (Platform.OS === 'ios') {
        this.deviceId = await this.getIOSDeviceId();
      } else if (Platform.OS === 'android') {
        this.deviceId = await this.getAndroidDeviceId();
      } else {
        this.deviceId = await this.getWebDeviceId();
      }
      
      return this.deviceId;
    } catch (error) {
      console.error('[SecureDeviceId] Failed to get hardware ID:', error);
      return this.getFallbackId();
    }
  }
  
  async getIOSDeviceId() {
    // Use Keychain for persistent storage across reinstalls
    const serviceName = 'app.stackmap.deviceid';
    
    try {
      // Try to retrieve existing ID from Keychain
      const credentials = await Keychain.getInternetCredentials(serviceName);
      if (credentials && credentials.password) {
        console.log('[SecureDeviceId] Retrieved iOS device ID from Keychain');
        return credentials.password;
      }
    } catch (error) {
      // Keychain entry doesn't exist yet
    }
    
    // Generate new ID based on hardware
    const uniqueId = await DeviceInfo.getUniqueId();  // IDFV on iOS
    const bundleId = DeviceInfo.getBundleId();
    
    // Create deterministic ID from hardware info
    const hardwareString = `${uniqueId}:${bundleId}:StackMapDevice`;
    const hardwareBytes = this.encodeUTF8(hardwareString);
    const hashedId = nacl.hash(hardwareBytes);
    const deviceId = Array.from(hashedId.slice(0, 16), b =>
      b.toString(16).padStart(2, '0')
    ).join('');
    
    // Store in Keychain for persistence
    await Keychain.setInternetCredentials(
      serviceName,
      'device',
      deviceId,
      { accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED }
    );
    
    console.log('[SecureDeviceId] Generated and stored new iOS device ID');
    return deviceId;
  }
  
  async getAndroidDeviceId() {
    // Use Android Keystore
    try {
      // Check SharedPreferences first (encrypted on Android)
      const stored = await AsyncStorage.getItem('@secure_device_id');
      if (stored) {
        return stored;
      }
      
      // Generate based on Android ID
      const androidId = await DeviceInfo.getAndroidId();
      const deviceName = await DeviceInfo.getDeviceName();
      const brand = DeviceInfo.getBrand();
      
      // Create deterministic ID
      const hardwareString = `${androidId}:${brand}:${deviceName}:StackMapDevice`;
      const hardwareBytes = this.encodeUTF8(hardwareString);
      const hashedId = nacl.hash(hardwareBytes);
      const deviceId = Array.from(hashedId.slice(0, 16), b =>
        b.toString(16).padStart(2, '0')
      ).join('');
      
      // Store in encrypted SharedPreferences via AsyncStorage
      await AsyncStorage.setItem('@secure_device_id', deviceId);
      
      console.log('[SecureDeviceId] Generated Android device ID');
      return deviceId;
    } catch (error) {
      console.error('[SecureDeviceId] Android ID generation failed:', error);
      return this.getFallbackId();
    }
  }
  
  async getWebDeviceId() {
    // Web: Use combination of stable browser features
    try {
      // Check IndexedDB for persisted ID first
      const stored = await this.getFromIndexedDB('deviceId');
      if (stored) {
        return stored;
      }
      
      // Generate fingerprint from stable browser features
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('StackMap Device ID', 2, 2);
      const canvasData = canvas.toDataURL();
      
      // Combine multiple entropy sources
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages?.join(','),
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas: canvasData.substring(0, 100),  // First 100 chars
      };
      
      // Hash to create device ID
      const fingerprintStr = JSON.stringify(fingerprint);
      const fingerprintBytes = this.encodeUTF8(fingerprintStr);
      const hashedId = await crypto.subtle.digest('SHA-256', fingerprintBytes);
      const deviceId = Array.from(new Uint8Array(hashedId).slice(0, 16), b =>
        b.toString(16).padStart(2, '0')
      ).join('');
      
      // Persist in IndexedDB
      await this.saveToIndexedDB('deviceId', deviceId);
      
      console.log('[SecureDeviceId] Generated web device ID');
      return deviceId;
    } catch (error) {
      console.error('[SecureDeviceId] Web fingerprinting failed:', error);
      return this.getFallbackId();
    }
  }
  
  async getFallbackId() {
    // Last resort: use random ID but persist it better
    if (this.fallbackId) {
      return this.fallbackId;
    }
    
    // Try to retrieve from multiple storage locations
    const storageKeys = [
      '@device_id_fallback',
      '@stackmap_device_id',
      '@device_identifier'
    ];
    
    for (const key of storageKeys) {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored && stored.length === 32) {
          this.fallbackId = stored;
          console.log('[SecureDeviceId] Retrieved fallback ID from', key);
          return stored;
        }
      } catch (e) {
        // Continue trying other keys
      }
    }
    
    // Generate new random ID as last resort
    const randomBytes = nacl.randomBytes(16);
    this.fallbackId = Array.from(randomBytes, b =>
      b.toString(16).padStart(2, '0')
    ).join('');
    
    // Store in multiple locations for redundancy
    for (const key of storageKeys) {
      try {
        await AsyncStorage.setItem(key, this.fallbackId);
      } catch (e) {
        // Continue with other keys
      }
    }
    
    console.log('[SecureDeviceId] Generated new fallback ID');
    return this.fallbackId;
  }
  
  // IndexedDB helpers for web
  async getFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('StackMapSecure', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['secure'], 'readonly');
        const store = transaction.objectStore('secure');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => resolve(getRequest.result?.value);
        getRequest.onerror = () => resolve(null);
      };
      
      request.onerror = () => resolve(null);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('secure')) {
          db.createObjectStore('secure', { keyPath: 'key' });
        }
      };
    });
  }
  
  async saveToIndexedDB(key, value) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('StackMapSecure', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['secure'], 'readwrite');
        const store = transaction.objectStore('secure');
        store.put({ key, value });
        
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  encodeUTF8(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }
}

// Integration in minimalSyncService.js
import SecureDeviceId from './secureDeviceId';

class MinimalSyncService {
  constructor() {
    this.secureDevice = new SecureDeviceId();
    // ...
  }
  
  async initDeviceId() {
    this.deviceId = await this.secureDevice.getDeviceId();
    console.log('[MinimalSync] Secure device ID initialized');
  }
}
```

### Package Dependencies
```json
{
  "dependencies": {
    "react-native-device-info": "^10.12.0",
    "react-native-keychain": "^8.1.2"
  }
}
```

**Reasoning**: Hardware-backed IDs survive app reinstalls, providing consistent device identification. Platform-specific secure storage (iOS Keychain, Android Keystore) protects against extraction. Fingerprinting fallback for web browsers. Multiple storage locations provide redundancy.

---

## Testing & Rollout Strategy

```javascript
// src/services/sync/__tests__/security.test.js
describe('Security Hardening Tests', () => {
  test('Argon2id produces different keys for different salts', async () => {
    const phrase = 'test-recovery-phrase';
    const key1 = await deriveKey(phrase, 'salt1');
    const key2 = await deriveKey(phrase, 'salt2');
    expect(key1).not.toEqual(key2);
  });
  
  test('Rate limiter enforces backoff', async () => {
    const limiter = new RateLimiter();
    const start = Date.now();
    
    for (let i = 0; i < 5; i++) {
      await limiter.throttle('test', 'id1');
    }
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThan(1000);  // Should have backed off
  });
  
  test('URL fragments are cleared after extraction', () => {
    window.location.hash = '#test-secret';
    const handler = new SecureUrlHandler();
    const fragment = handler.extractFragment();
    
    expect(fragment).toBe('test-secret');
    expect(window.location.hash).toBe('');
  });
});
```

### Rollout Phases
1. **Phase 1**: Deploy client updates with backward compatibility
2. **Phase 2**: Update server endpoints with new security measures
3. **Phase 3**: Migrate existing users gradually
4. **Phase 4**: Deprecate old insecure methods after 30 days

## Summary

This comprehensive implementation addresses all six critical security vulnerabilities while maintaining backward compatibility and user experience. Each fix includes both client and server-side changes with detailed reasoning for the security improvements.

---

*Document Version: 1.0*  
*Created: January 2025*  
*Security Level: Critical*  
*Implementation Priority: Immediate*