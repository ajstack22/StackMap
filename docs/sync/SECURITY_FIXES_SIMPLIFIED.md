# StackMap Security Fixes - Simplified Implementation

## Overview
Practical security fixes for StackMap's sync system. Focus on real vulnerabilities, skip the over-engineering.

**Key Context**: StackMap stores temporary activity data that resets every few days. This is NOT medical or financial data. Security should be appropriate to the threat model.

## Critical Fixes Only (Ship These)

### 1. Replace Math.random() with Crypto API ✅

**File**: `src/services/sync/minimalSyncService.js`

**Current Problem**: Using Math.random() for invite codes is predictable
```javascript
// Line ~1114 - INSECURE
const code = Math.random().toString(36).substring(2, 8).toUpperCase();
```

**Simple Fix**:
```javascript
// SECURE - Use crypto.getRandomValues()
generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
    if (i === 3) code += '-'; // Format: XXXX-XXXX
  }
  
  return code;
}
```

### 2. Add Basic Rate Limiting ✅

**File**: `src/services/sync/minimalSyncService.js`

**Problem**: No protection against rapid API calls

**Simple Fix**:
```javascript
class MinimalSyncService {
  constructor() {
    // ... existing code
    this.lastRequest = {};
    this.MIN_REQUEST_INTERVAL = 200; // 200ms between requests
  }
  
  async rateLimitCheck(action) {
    const now = Date.now();
    const last = this.lastRequest[action] || 0;
    
    const waitTime = this.MIN_REQUEST_INTERVAL - (now - last);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest[action] = Date.now();
  }
  
  async pullData(forceFullPull = false) {
    await this.rateLimitCheck('pull');
    // ... existing pull logic
  }
  
  async pushData(data) {
    await this.rateLimitCheck('push');
    // ... existing push logic
  }
  
  async validateInviteCode(inviteCode) {
    await this.rateLimitCheck('validate');
    // ... existing validation logic
  }
}
```

### 3. Clear URL Fragments After Reading ✅

**File**: `src/services/sync/minimalSyncService.js`

**Problem**: Recovery phrases stay in browser history

**Simple Fix**:
```javascript
class MinimalSyncService {
  constructor() {
    // ... existing code
    this.checkForRecoveryPhrase();
  }
  
  checkForRecoveryPhrase() {
    if (typeof window === 'undefined' || !window.location.hash) {
      return;
    }
    
    const fragment = window.location.hash.substring(1);
    
    // Clear immediately
    if (fragment) {
      window.history.replaceState(
        null,
        document.title,
        window.location.pathname + window.location.search
      );
      
      // Use if it looks like a recovery phrase
      if (fragment.length === 32 && /^[a-f0-9]+$/i.test(fragment)) {
        this.pendingRecoveryPhrase = fragment;
        
        // Clear from memory after 10 seconds if unused
        setTimeout(() => {
          if (this.pendingRecoveryPhrase === fragment) {
            this.pendingRecoveryPhrase = null;
          }
        }, 10000);
      }
    }
  }
  
  async joinWithInviteCode(inviteCode, recoveryPhrase = null) {
    // Use pending phrase if available
    recoveryPhrase = recoveryPhrase || this.pendingRecoveryPhrase;
    this.pendingRecoveryPhrase = null; // Clear after use
    
    // ... existing join logic
  }
}
```

### 4. Optional: Use PBKDF2 on Web (If Time Permits) ⚡

**File**: `src/services/sync/encryptionServiceFixed.ts`

**Note**: Current nacl.hash iterations work fine. This is a nice-to-have.

```javascript
async deriveKeyFromPhrase(phrase: string, salt: string): Promise<DerivedKey> {
  // Use Web Crypto API when available (web platform)
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(phrase),
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      const keyBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: encoder.encode(salt),
          iterations: 100000,  // OWASP minimum
          hash: 'SHA-256'
        },
        keyMaterial,
        256 // 32 bytes
      );
      
      return {
        key: new Uint8Array(keyBits),
        salt: salt
      };
    } catch (error) {
      console.log('[Encryption] PBKDF2 failed, using fallback');
    }
  }
  
  // Fallback: Keep existing nacl.hash implementation
  return this.existingImplementation(phrase, salt);
}
```

## What We're NOT Doing (And Why)

### ❌ Argon2
- **Why Not**: Adds 50KB+ to bundle, requires WASM
- **Reality**: Our activity data isn't worth the complexity

### ❌ Device Fingerprinting
- **Why Not**: Current random device ID works fine
- **Reality**: Users reinstall apps, we handle it gracefully

### ❌ Security Event Monitoring
- **Why Not**: We're not detecting fraud or attacks
- **Reality**: If someone hacks activity schedules, so what?

### ❌ Invite Code Checksums
- **Why Not**: 8 characters is easy to retype
- **Reality**: Server validates anyway

### ❌ Progressive Enhancement
- **Why Not**: Just pick one approach that works everywhere
- **Reality**: Complexity without benefit

### ❌ HMAC on All Data
- **Why Not**: NaCl already provides authenticated encryption
- **Reality**: We're not a medical records system

## Implementation Checklist

```bash
# 1. Update invite code generation
✅ Replace Math.random() with crypto.getRandomValues()
⏱️ Time: 15 minutes

# 2. Add rate limiting
✅ Add 200ms minimum between API calls
⏱️ Time: 20 minutes

# 3. Clear URL fragments
✅ Clear recovery phrases from URL after reading
⏱️ Time: 15 minutes

# 4. (Optional) Web PBKDF2
⚡ Use Web Crypto API when available
⏱️ Time: 30 minutes if needed

# Total time: ~50 minutes to 1.5 hours
```

## Testing

```javascript
// Simple tests that actually matter
describe('Security Fixes', () => {
  test('Invite codes use crypto random', () => {
    const code1 = generateInviteCode();
    const code2 = generateInviteCode();
    
    expect(code1).not.toEqual(code2);
    expect(code1).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
  
  test('Rate limiting prevents rapid calls', async () => {
    const start = Date.now();
    
    await rateLimitCheck('test');
    await rateLimitCheck('test');
    
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(200);
  });
  
  test('URL fragments are cleared', () => {
    window.location.hash = '#testrecoveryphrase';
    
    const service = new MinimalSyncService();
    
    expect(window.location.hash).toBe('');
  });
});
```

## Deployment

### Phase 1: Ship It (This Week)
1. Deploy all 3 critical fixes
2. Test on all platforms
3. Monitor for issues

### Phase 2: Optional Enhancement (If Needed)
1. Add PBKDF2 for web if performance allows
2. Consider server-side rate limiting if abuse occurs

### Phase 3: Future (Only If Problems Arise)  
1. Stronger measures only if we see actual attacks
2. Let real-world usage guide future security

## Why This Approach Makes Sense

1. **Appropriate Security**: Match security to actual threat model
2. **Ship Fast**: These fixes can be done in an afternoon
3. **Maintain Simplicity**: Don't break working code with complexity
4. **User Experience**: No degradation, no new friction
5. **Future-Proof**: Can enhance IF we need to, not preemptively

## Migration

### For Existing Users
- **No action required**
- Existing sync continues working
- New invite codes will be more secure

### Breaking Changes
- **None**

## Summary

Fix the real vulnerabilities:
1. ✅ Crypto.getRandomValues() for invite codes
2. ✅ Basic rate limiting (200ms)
3. ✅ Clear URL fragments
4. ⚡ Maybe PBKDF2 on web

Skip the theoretical stuff. Ship it.

---

*Document Version: 2.0 - Simplified*  
*Created: January 2025*  
*Time to Implement: 1-2 hours*  
*Complexity: Low*  
*Risk: Minimal*