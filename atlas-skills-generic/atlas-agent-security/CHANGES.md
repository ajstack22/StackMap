# Changes from StackMap-Specific to Generic Security Agent

## Overview

This document summarizes the changes made to convert the StackMap-specific security agent to a generic, portable version.

## File Structure

```
atlas-agent-security/
├── SKILL.md                          # Main agent definition (28 KB)
├── README.md                         # Customization guide (16 KB)
├── CHANGES.md                        # This file
└── resources/
    ├── security-checklist.md         # Generic OWASP checklist (16 KB)
    └── threat-modeling-guide.md      # STRIDE methodology (20 KB)

Total: ~80 KB of documentation
```

---

## What Was Kept (Core Methodology)

### ✅ Retained Without Changes

1. **7-Phase Security Audit Protocol**
   - Phase 1: Reconnaissance (10 min)
   - Phase 2: Threat Modeling (15 min)
   - Phase 3: Vulnerability Analysis (20 min)
   - Phase 4: Platform-Specific Review (15 min)
   - Phase 5: Code Review (20 min)
   - Phase 6: Risk Assessment (10 min)
   - Phase 7: Remediation Recommendations (15 min)

2. **STRIDE Threat Modeling**
   - Spoofing Identity
   - Tampering with Data
   - Repudiation
   - Information Disclosure
   - Denial of Service
   - Elevation of Privilege

3. **OWASP Top 10 Application**
   - A01: Broken Access Control
   - A02: Cryptographic Failures
   - A03: Injection
   - A04: Insecure Design
   - A05: Security Misconfiguration
   - A06: Vulnerable and Outdated Components
   - A07: Identification and Authentication Failures
   - A08: Software and Data Integrity Failures
   - A09: Security Logging and Monitoring Failures
   - A10: Server-Side Request Forgery (SSRF)

4. **Core Security Principles**
   - Zero Trust
   - Defense in Depth
   - Least Privilege
   - Fail Secure

5. **Risk Assessment Framework**
   - Risk Matrix (Likelihood × Impact)
   - Severity Definitions (Critical/High/Medium/Low)
   - Remediation Priorities

6. **Security Verdict Format**
   - 🔴 REJECTED: Critical Issues Found
   - ⚠️ CONDITIONAL PASS: Non-Critical Issues Found
   - ✅ PASS: No Security Issues

7. **Agent Interaction Guidelines**
   - When invoked by main Claude
   - Working with other agents (developer, peer-reviewer, devops)

---

## What Was Removed (StackMap-Specific)

### ❌ Removed Content

#### 1. Recovery Phrase Security
**Before** (StackMap-specific):
```markdown
### Recovery Phrase Security
- [ ] Generated with crypto.getRandomValues (not Math.random)
- [ ] 32 hex characters (128 bits entropy minimum)
- [ ] Never logged to console (even in __DEV__)
- [ ] Never stored in plaintext (AsyncStorage, localStorage)
- [ ] Never sent to server (zero-knowledge architecture)
- [ ] Only displayed when user explicitly requests
- [ ] Clipboard cleared after copy (if applicable)
```

**After** (Generic):
```markdown
### Credential Management
- [ ] No credentials in source code
- [ ] No credentials in environment files (use secrets manager)
- [ ] Credentials never logged
- [ ] API keys have appropriate permissions (scoped)
- [ ] Tokens expire (reasonable timeout)
```

#### 2. NaCl Encryption Details
**Before** (StackMap-specific):
```markdown
### Sync Encryption Security
**Verify**:
- Using nacl.secretbox (authenticated encryption)
- Nonce is random and unique per message
- Key derived from recovery phrase + salt
- Key derivation uses >= 100k iterations
- Salt is fixed for sync ID (deterministic), random for encryption
```

**After** (Generic):
```markdown
### Encryption Implementation
- [ ] Using modern authenticated encryption (AES-GCM, ChaCha20-Poly1305)
- [ ] NOT using weak algorithms (MD5, SHA1, DES, AES-ECB)
- [ ] Nonce/IV is random and unique per encryption
- [ ] Nonce/IV stored with ciphertext for decryption
```

#### 3. AsyncStorage Security (React Native)
**Before** (StackMap-specific):
```markdown
### AsyncStorage Security (iOS/Android)
- iOS: Data in app sandbox (encrypted by OS if device encrypted)
- Android: Data in app-private directory (encrypted if device encrypted)
- No sensitive data in plaintext
- Recovery phrase never stored (user must remember/save it)
- Clear storage on logout/reset
```

**After** (Generic):
```markdown
### Data at Rest
- [ ] Sensitive data encrypted before storage
- [ ] Appropriate storage mechanism used (secure storage APIs)
- [ ] No plaintext passwords/secrets in storage
- [ ] Database encrypted (if applicable)
```

#### 4. Platform-Specific Gotchas
**Before** (StackMap-specific):
```markdown
### Platform-Specific Gotchas (StackMap)

**Android**:
- FlexWrap uses percentage widths (not calculateCardWidth)
- Typography component handles font variants

**iOS**:
- AsyncStorage writes debounced (avoid 20+ second freeze)
- NetInfo.fetch() disabled (causes freezes)

**Web**:
- 3-column layout uses percentage widths (31%, 48%, 100%)
- VectorIcons.web.js uses span, not Text
```

**After** (Generic):
```markdown
### Cross-Platform (React Native, Flutter, etc.)
- [ ] Platform-specific secure storage used
- [ ] No JavaScript debugging enabled in production
- [ ] Bundle is minified and obfuscated
- [ ] Third-party SDKs vetted for security
```

#### 5. Sync System Security
**Before** (StackMap-specific):
```markdown
## Sync-Specific Security

### Sync Encryption
- [ ] Data encrypted before sync (never plaintext to server)
- [ ] Nonce included with each sync message
- [ ] Sync ID deterministic (same phrase → same ID)
- [ ] Sync ID uses sufficient key derivation (100k+ iterations)
- [ ] Server stores only encrypted data (zero-knowledge)

### Conflict Resolution
- [ ] Conflicts resolved securely (no data loss)
- [ ] Sensitive fields preserved during merge (e.g., icon fields)
```

**After** (Generic):
```markdown
(Removed entirely - not applicable to all applications)
```

#### 6. Specific Threat Scenarios
**Before** (StackMap-specific):
```markdown
### Scenario 1: Recovery Phrase Compromise
**Asset**: Recovery phrase (CRITICAL)
**Threat vectors**:
1. User writes phrase on sticky note
2. User saves phrase in iCloud Notes
3. Phrase logged in console
4. Phrase stored in AsyncStorage
```

**After** (Generic):
```markdown
### Scenario 1: Credential Compromise
**Asset**: User passwords (CRITICAL)
**Threat vectors**:
1. Weak password policy
2. Password reuse
3. Phishing
4. Database breach (plaintext storage)
5. Brute force attack
```

---

## What Was Added (Generic Content)

### ✅ New Generic Content

#### 1. Generic Password Security
```markdown
### Authentication Security
- [ ] Strong authentication mechanism implemented
- [ ] Passwords hashed with strong algorithm (bcrypt, Argon2, scrypt)
- [ ] Minimum 10k+ iterations for password hashing
- [ ] No plaintext passwords stored
- [ ] Multi-factor authentication available (for sensitive apps)
```

#### 2. Generic Encryption Best Practices
```markdown
### Encryption Implementation
- [ ] Using modern authenticated encryption (AES-GCM, ChaCha20-Poly1305)
- [ ] NOT using weak algorithms (MD5, SHA1, DES, AES-ECB)
- [ ] Nonce/IV is random and unique per encryption

### Key Derivation
- [ ] Keys derived securely (not directly from password)
- [ ] Using strong KDF (PBKDF2, scrypt, Argon2)
- [ ] Minimum 100,000 iterations for PBKDF2
- [ ] Salt used (random per user, stored with hash)
```

#### 3. Generic API Security
```markdown
### API Security

#### Endpoint Security
- [ ] HTTPS enforced (no HTTP)
- [ ] Authentication required on protected endpoints
- [ ] Rate limiting enabled (prevent brute force and DoS)

#### Request/Response Security
- [ ] No sensitive data in query parameters
- [ ] POST/PUT/DELETE used for state-changing operations
- [ ] CORS configured correctly
```

#### 4. Customization Guide (New README.md)
- Complete guide on customizing for your project
- Example `.atlas/security-checklist.md` template
- Example `.atlas/threat-scenarios.md` template
- Example `.atlas/security-standards.md` template
- E-commerce application full example

#### 5. Generic Threat Scenarios
```markdown
### Scenario 1: Credential Compromise
### Scenario 2: Encryption Key Extraction
### Scenario 3: API Data Interception
### Scenario 4: Malicious Input Injection
```

---

## Comparison: Key Examples

### Example 1: Code Review Focus Areas

**Before** (StackMap-specific):
```markdown
**1. Encryption/Cryptography Code**
// File: /src/services/sync/encryption.js (example)
// Check:
// ✅ Using nacl.secretbox (authenticated encryption)
// ✅ Nonce is random (nacl.randomBytes)
// ✅ Key derivation secure (PBKDF2 or scrypt with 100k+ iterations)
```

**After** (Generic):
```markdown
**1. Encryption/Cryptography Code**
// Check:
// ✅ Using modern authenticated encryption
// ✅ Random nonces/IVs (not reused)
// ✅ Key derivation secure (strong KDF with high iterations)
```

### Example 2: Critical Security Issues

**Before** (StackMap-specific):
```markdown
### Critical
- Recovery phrase exposure
- Encryption key leakage
- Hardcoded secrets
- Weak key derivation (<10k iterations)
- Nonce reuse in NaCl
```

**After** (Generic):
```markdown
### Critical
- Password/credential exposure
- Encryption key leakage
- Hardcoded secrets
- Broken cryptography (weak algorithms, nonce reuse)
- SQL/Command injection
- Authentication bypass
```

### Example 3: Security Checklist

**Before** (StackMap-specific):
```markdown
## 11. Sync-Specific Security

### Sync Encryption
- [ ] Data encrypted before sync (never plaintext to server)
- [ ] Nonce included with each sync message
- [ ] Sync ID deterministic (same phrase → same ID)
- [ ] Server stores only encrypted data (zero-knowledge)
```

**After** (Generic):
```markdown
(Section removed - replaced with generic API security and data protection sections)
```

---

## Customization Model

### Generic Skill Provides
1. **OWASP Top 10 methodology** (applies to all web/mobile apps)
2. **STRIDE threat modeling** (applies to all applications)
3. **7-phase audit protocol** (systematic security review)
4. **Risk assessment framework** (Likelihood × Impact)
5. **Generic code examples** (JavaScript/pseudo-code)

### Your Project Adds
1. **Stack-specific checks** (`.atlas/security-checklist.md`)
   - Your database (PostgreSQL, MongoDB, etc.)
   - Your authentication (JWT, OAuth, sessions)
   - Your framework (Express, Django, Spring, etc.)

2. **Domain-specific threats** (`.atlas/threat-scenarios.md`)
   - E-commerce: Payment fraud, inventory manipulation
   - Healthcare: HIPAA compliance, PHI protection
   - Fintech: PCI-DSS, transaction security

3. **Your security standards** (`.atlas/security-standards.md`)
   - Your crypto algorithms (AES-256-GCM vs ChaCha20-Poly1305)
   - Your password policy (length, complexity, MFA)
   - Your rate limiting (requests/minute)
   - Your logging policy (what to log, retention)

### Result
**Generic methodology + Your customization = Complete security audit**

---

## Benefits of Generic Approach

### 1. Portability
- Works for any application (not just StackMap)
- Any tech stack (Node.js, Python, Java, Go, etc.)
- Any platform (web, mobile, backend, desktop)
- Any domain (e-commerce, healthcare, fintech, etc.)

### 2. Maintainability
- **Update generic skill**: When OWASP updates Top 10
- **Update your customization**: When your stack/requirements change
- **Separation of concerns**: Generic methodology vs project-specific

### 3. Standardization
- Consistent audit methodology across projects
- Industry-standard frameworks (OWASP, STRIDE)
- Shared understanding across team

### 4. Flexibility
- Customize for your stack (without modifying skill)
- Add domain-specific threats (healthcare, fintech, etc.)
- Enforce your standards (your crypto, your policies)

---

## Migration Guide: StackMap → Generic + Customization

If you're migrating from StackMap-specific version:

### Step 1: Adopt Generic Skill
- Use generic `atlas-agent-security` skill
- Core methodology is identical (7-phase, STRIDE, OWASP)

### Step 2: Create StackMap Customization
Create `.atlas/security-checklist.md`:
```markdown
# StackMap-Specific Security Checklist

## Zero-Knowledge Sync System

### Recovery Phrase Security
- [ ] Generated with crypto.getRandomValues (not Math.random)
- [ ] 32 hex characters (128 bits entropy)
- [ ] Never logged (not even in __DEV__)
- [ ] Never stored (user responsibility)
- [ ] Never sent to server

### Sync Encryption (NaCl)
- [ ] Using nacl.secretbox (authenticated encryption)
- [ ] Nonce random and unique per encryption
- [ ] Key derived with 100k+ iterations
- [ ] Server stores only encrypted data

### AsyncStorage Security
- [ ] Encrypted sync data only
- [ ] AsyncStorage writes debounced (iOS freeze mitigation)
- [ ] No recovery phrase stored
- [ ] Clear storage on logout
```

### Step 3: Create Threat Scenarios
Create `.atlas/threat-scenarios.md`:
```markdown
# StackMap Threat Scenarios

## Scenario: Recovery Phrase Compromise
**Asset**: Recovery phrase (CRITICAL)
**Threat vectors**:
1. User writes phrase on sticky note
2. Phrase logged in console
3. Clipboard hijacking after copy

**Mitigations**:
- User education (secure storage)
- Never log phrases (code review)
- Clear clipboard after 60 seconds
```

### Step 4: Define Security Standards
Create `.atlas/security-standards.md`:
```markdown
# StackMap Security Standards

## Cryptography
- **Encryption**: NaCl secretbox (XSalsa20 + Poly1305)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Recovery Phrase**: 32 hex characters (128 bits entropy)
- **Sync ID**: First 16 bytes of key derivation (deterministic)

## Zero-Knowledge Architecture
- Server never sees plaintext data
- Server never sees recovery phrase
- Client-side encryption only
- No password reset (by design)
```

### Result
- **Generic skill** provides OWASP/STRIDE methodology
- **Your customization** adds StackMap-specific checks
- **Same thorough audit** as before, but now portable

---

## File Size Comparison

### StackMap-Specific Version
```
SKILL.md:                    42 KB  (includes StackMap examples)
resources/security-checklist.md:  14 KB  (includes sync-specific checks)
resources/threat-modeling-guide.md: 19 KB  (includes StackMap scenarios)
Total:                       75 KB
```

### Generic Version
```
SKILL.md:                    28 KB  (generic OWASP/STRIDE)
README.md:                   16 KB  (customization guide)
CHANGES.md:                   8 KB  (this file)
resources/security-checklist.md:  16 KB  (generic + customization guide)
resources/threat-modeling-guide.md: 20 KB  (generic STRIDE)
Total:                       88 KB  (+13 KB for customization documentation)
```

**Note**: Generic version is slightly larger due to comprehensive customization guide and examples.

---

## Summary

### Core Changes
1. **Removed**: StackMap-specific security concerns (recovery phrase, NaCl, AsyncStorage, sync)
2. **Kept**: OWASP Top 10, STRIDE, 7-phase audit, risk assessment
3. **Added**: Generic credential/encryption/API security
4. **Added**: Comprehensive customization guide with examples

### Key Benefits
- **Portable**: Works for any application
- **Customizable**: Add your stack/domain specifics
- **Standardized**: Industry-standard methodology
- **Maintainable**: Separate generic skill from project customization

### How to Use
1. Use generic `atlas-agent-security` skill
2. Create `.atlas/security-checklist.md` (your stack)
3. Create `.atlas/threat-scenarios.md` (your domain)
4. Create `.atlas/security-standards.md` (your policies)
5. Invoke security agent → Gets OWASP + STRIDE + your customization

---

**Version**: 1.0.0
**Last Updated**: 2025-01-17
