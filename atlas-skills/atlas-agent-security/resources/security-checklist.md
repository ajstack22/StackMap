# Security Audit Checklist

## Overview

This checklist provides a systematic approach to security audits. Use it during Adversarial Review phase (Full workflow) or when reviewing security-critical changes.

---

## Pre-Audit Preparation

- [ ] Identify scope (files, features, data flows)
- [ ] Understand sensitive data involved
- [ ] Review threat model (if exists)
- [ ] Check for previous security findings
- [ ] Set up testing environment

---

## 1. Authentication & Authorization

### Recovery Phrase Security
- [ ] Generated with crypto.getRandomValues (not Math.random)
- [ ] 32 hex characters (128 bits entropy minimum)
- [ ] Never logged to console (even in __DEV__)
- [ ] Never stored in plaintext (AsyncStorage, localStorage)
- [ ] Never sent to server (zero-knowledge architecture)
- [ ] Only displayed when user explicitly requests
- [ ] Clipboard cleared after copy (if applicable)

### Access Control
- [ ] Users can only access their own data
- [ ] Sync ID properly derived from recovery phrase
- [ ] No bypass mechanisms in code
- [ ] Failed authentication handled securely (no info leakage)
- [ ] No predictable session tokens/IDs

---

## 2. Cryptography & Encryption

### Encryption Implementation
- [ ] Using NaCl secretbox (authenticated encryption)
- [ ] NOT using weak algorithms (MD5, SHA1, DES, AES-ECB)
- [ ] Nonce is random and unique per encryption
- [ ] Nonce stored with ciphertext for decryption
- [ ] No nonce reuse (test: same plaintext → different ciphertext)
- [ ] Message authentication verified on decryption

### Key Derivation
- [ ] Key derived from recovery phrase securely
- [ ] Using strong KDF (PBKDF2 or scrypt)
- [ ] Minimum 100,000 iterations for PBKDF2
- [ ] Salt used (fixed for sync ID, random for encryption)
- [ ] No hardcoded keys in source code
- [ ] Keys never logged to console

### Key Management
- [ ] Keys stored securely (encrypted or in Keychain/EncryptedSharedPrefs)
- [ ] Keys cleared from memory when no longer needed
- [ ] No keys in URL parameters
- [ ] No keys in error messages
- [ ] Key rotation supported (if applicable)

---

## 3. Data Protection

### Data at Rest
- [ ] Sensitive data encrypted before AsyncStorage (mobile)
- [ ] Sensitive data encrypted before localStorage (web)
- [ ] Recovery phrase never stored
- [ ] No plaintext passwords/secrets in storage
- [ ] No sensitive data in SharedPreferences (Android)
- [ ] No sensitive data in NSUserDefaults (iOS)
- [ ] Consider Keychain (iOS) or EncryptedSharedPreferences (Android) for keys

### Data in Transit
- [ ] HTTPS enforced (no HTTP fallback)
- [ ] No sensitive data in URLs (use POST body)
- [ ] TLS version >= 1.2
- [ ] Certificate validation enabled (no pinning bypass)
- [ ] Encrypted payload sent to server
- [ ] Recovery phrase never transmitted

### Data in Memory
- [ ] Sensitive data not retained longer than necessary
- [ ] No sensitive data in component state (if avoidable)
- [ ] Clear sensitive data on logout/reset
- [ ] No sensitive data in error boundaries

---

## 4. Input Validation

### Activity Names
- [ ] Length limit enforced (e.g., 500 characters)
- [ ] Empty input rejected
- [ ] Whitespace-only input rejected or trimmed
- [ ] Special characters handled safely
- [ ] Emoji support verified (should work)
- [ ] No SQL injection risk (if using SQL)
- [ ] No XSS risk (React escapes by default, verify no dangerouslySetInnerHTML)

### User Names
- [ ] Length limit enforced
- [ ] Empty input rejected
- [ ] Special characters handled safely

### Recovery Phrase Input
- [ ] Length validated (exactly 32 hex characters)
- [ ] Character set validated (only 0-9, a-f)
- [ ] No leading/trailing whitespace accepted
- [ ] Invalid phrases rejected gracefully

### File Uploads (if applicable)
- [ ] File type validation (whitelist)
- [ ] File size limits enforced
- [ ] File content validated (not just extension)
- [ ] Files stored outside web root

---

## 5. API Security

### Endpoint Security
- [ ] HTTPS enforced (no HTTP)
- [ ] Authentication required (sync ID header)
- [ ] Authorization checked (user can only access own data)
- [ ] Rate limiting enabled (e.g., 10 requests/minute)
- [ ] Input validation on all endpoints
- [ ] Error messages don't reveal system details

### Request/Response Security
- [ ] No sensitive data in query parameters
- [ ] POST used for state-changing operations (not GET)
- [ ] CORS configured correctly
- [ ] Content-Type headers validated
- [ ] Response doesn't leak stack traces
- [ ] No API keys in client code

### API Keys/Tokens
- [ ] No hardcoded API keys
- [ ] Tokens expire (if applicable)
- [ ] Tokens scoped to minimum permissions
- [ ] Tokens revocable

---

## 6. Web-Specific Security

### XSS Prevention
- [ ] No dangerouslySetInnerHTML without sanitization
- [ ] No eval() or Function() on user input
- [ ] No inline event handlers (onclick, etc.)
- [ ] Content Security Policy configured (if applicable)
- [ ] React automatic escaping verified

### CSRF Prevention
- [ ] No state-changing GET requests
- [ ] Anti-CSRF tokens (if using sessions)
- [ ] SameSite cookie attribute (if using cookies)

### Storage Security
- [ ] localStorage only stores encrypted data
- [ ] sessionStorage only stores non-sensitive data
- [ ] No sensitive data in cookies
- [ ] Cookies have Secure and HttpOnly flags (if used)

---

## 7. Mobile Platform Security

### iOS-Specific
- [ ] No sensitive data in NSUserDefaults (use Keychain)
- [ ] App Transport Security (ATS) enforced
- [ ] Minimum iOS version enforced (security patches)
- [ ] Info.plist permissions minimized
- [ ] No certificate pinning bypass in production
- [ ] Face ID/Touch ID used for sensitive actions (if applicable)

### Android-Specific
- [ ] No sensitive data in SharedPreferences (use EncryptedSharedPreferences)
- [ ] Manifest permissions minimized
- [ ] ProGuard/R8 enabled (code obfuscation)
- [ ] android:debuggable=false in production builds
- [ ] Network security config enforces HTTPS
- [ ] Minimum SDK version enforced (security patches)

### Cross-Platform (React Native)
- [ ] AsyncStorage only stores encrypted data
- [ ] NetInfo doesn't leak connection details
- [ ] No JavaScript debugging enabled in production
- [ ] Bundle is minified and obfuscated

---

## 8. Logging & Monitoring

### Logging Security
- [ ] No recovery phrases logged (NEVER)
- [ ] No encryption keys logged (NEVER)
- [ ] No user data logged in production
- [ ] Debug logs wrapped in __DEV__ check
- [ ] Error messages don't expose system details
- [ ] Stack traces not shown to users

### Security Events
- [ ] Failed authentication attempts logged
- [ ] Suspicious activity logged (if detectable)
- [ ] Security errors logged (without sensitive data)
- [ ] Logs don't contain PII

---

## 9. Dependency Security

### Dependency Audit
- [ ] npm audit shows no critical vulnerabilities
- [ ] No high-severity vulnerabilities (or accepted with justification)
- [ ] All dependencies reasonably up-to-date (<2 years old)
- [ ] No unmaintained packages (abandoned projects)

### Critical Dependencies
- [ ] tweetnacl: Latest stable version
- [ ] react-native: Reasonably current (<1 year old)
- [ ] @react-native-async-storage/async-storage: Latest stable
- [ ] All security-critical libraries audited

### Supply Chain Security
- [ ] package-lock.json committed (reproducible builds)
- [ ] No suspicious dependencies (typosquatting)
- [ ] Dependencies from trusted registries (npm, not random URLs)

---

## 10. Error Handling

### Secure Error Handling
- [ ] Errors fail closed (deny access, don't grant)
- [ ] Error messages user-friendly (no stack traces)
- [ ] Errors logged server-side (for monitoring)
- [ ] No sensitive data in error messages
- [ ] Try-catch blocks around security-critical code

### Example Patterns
```javascript
// ✅ CORRECT: Fail closed
try {
  return validateUser(user)
} catch (error) {
  console.error('Validation failed:', error.message)  // Log, no sensitive data
  return false  // Deny access on error
}

// ❌ WRONG: Fail open
try {
  return validateUser(user)
} catch (error) {
  return true  // DANGER: Grants access on error
}
```

---

## 11. Sync-Specific Security

### Sync Encryption
- [ ] Data encrypted before sync (never plaintext to server)
- [ ] Nonce included with each sync message
- [ ] Sync ID deterministic (same phrase → same ID)
- [ ] Sync ID uses sufficient key derivation (100k+ iterations)
- [ ] Server stores only encrypted data (zero-knowledge)

### Conflict Resolution
- [ ] Conflicts resolved securely (no data loss)
- [ ] Sensitive fields preserved during merge (e.g., icon fields)
- [ ] No plaintext data in conflict logs

### Offline Queue
- [ ] Queued data encrypted before storage
- [ ] Queue doesn't grow unbounded (DoS risk)
- [ ] Queue cleared on logout/reset

---

## 12. Deployment & Build Security

### Build Configuration
- [ ] Production builds have debugging disabled
- [ ] Source maps not included in production (or protected)
- [ ] Environment variables not exposed to client
- [ ] No secrets in environment files (use secure secrets management)

### Deployment Process
- [ ] Deploy scripts don't log secrets
- [ ] Credentials not in git history
- [ ] HTTPS enforced on production servers
- [ ] Security headers configured (CSP, HSTS, etc.)

---

## 13. Testing

### Security Testing
- [ ] Unit tests for encryption (nonce uniqueness, deterministic key derivation)
- [ ] Unit tests for input validation (length limits, special chars)
- [ ] Integration tests for authentication flows
- [ ] Manual testing: Try to bypass authentication
- [ ] Manual testing: Try to access another user's data
- [ ] Manual testing: Try to inject malicious input

### Penetration Testing Scenarios
- [ ] Attempt SQL injection (if using SQL)
- [ ] Attempt XSS (if using dangerouslySetInnerHTML)
- [ ] Attempt CSRF (if using state-changing GETs)
- [ ] Attempt to decrypt data without key
- [ ] Attempt to brute force recovery phrase
- [ ] Attempt to DoS via rapid requests

---

## 14. Privacy & Compliance

### Data Minimization
- [ ] Only collect necessary data
- [ ] Data retention policy defined
- [ ] User can delete their data
- [ ] No unnecessary data sent to server

### Privacy by Design
- [ ] Zero-knowledge architecture (server can't read data)
- [ ] No tracking/analytics without consent
- [ ] No third-party data sharing
- [ ] Privacy policy provided (if required)

### GDPR/Privacy Considerations
- [ ] User consent for data collection (if required)
- [ ] Right to access data
- [ ] Right to delete data
- [ ] Right to data portability
- [ ] Data breach notification plan (if applicable)

---

## 15. Platform-Specific Gotchas (StackMap)

### Android
- [ ] FlexWrap uses percentage widths (not calculateCardWidth)
- [ ] Typography component used (handles font variants)
- [ ] No fontWeight property on Text (Android ignores it)

### iOS
- [ ] AsyncStorage writes debounced (avoid 20+ second freeze)
- [ ] NetInfo.fetch() disabled (causes freezes)
- [ ] Modal constraints use specific flex rules

### Web
- [ ] 3-column layout uses percentage widths (31%, 48%, 100%)
- [ ] VectorIcons.web.js uses span, not Text
- [ ] Alert.alert replaced with ConfirmModal
- [ ] Build files in root for qual (not web/build/)

---

## Quick Command Reference

### Security Scans
```bash
# Check for secrets
grep -r "password\|key\|secret\|token" --exclude-dir=node_modules src/

# Check for hardcoded credentials
grep -r "api_key\|apiKey\|API_KEY" --exclude-dir=node_modules src/

# Check for console.log statements
grep -r "console.log" src/ | grep -v "__DEV__"

# Dependency vulnerabilities
npm audit
npm audit --production

# Check specific dependency
npm audit tweetnacl

# Outdated packages
npm outdated
```

### Code Quality
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm test
```

---

## Audit Report Template

```markdown
# Security Audit Report

**Date**: YYYY-MM-DD
**Auditor**: [Name]
**Scope**: [Files/features reviewed]
**Duration**: [Time spent]

## Executive Summary

[Brief overview of findings]

## Critical Findings

### 1. [Vulnerability Name]
- **Location**: [File:line]
- **Risk**: CRITICAL
- **Impact**: [What could happen]
- **Remediation**: [How to fix]
- **Verification**: [How to verify fix]

## High-Priority Findings

[Similar format]

## Medium-Priority Findings

[Similar format]

## Low-Priority Findings

[Similar format]

## Recommendations

[General security improvements]

## Verdict

[REJECTED / CONDITIONAL PASS / PASS]

[Justification]
```

---

## Severity Definitions

### Critical
- Recovery phrase exposure
- Encryption key leakage
- Hardcoded secrets
- Broken cryptography (weak algorithms, nonce reuse)
- SQL/Command injection

**Action**: Fix immediately, block deployment

### High
- Missing input validation
- No rate limiting
- HTTP instead of HTTPS
- XSS vulnerabilities
- Insecure data storage

**Action**: Fix this sprint/release

### Medium
- Outdated dependencies (non-critical CVEs)
- Missing error handling
- Excessive logging
- Weak permissions

**Action**: Fix next release

### Low
- Code quality issues
- Minor optimizations
- Documentation gaps
- Low-severity CVEs (no known exploits)

**Action**: Fix when convenient

---

## Final Notes

- **Complete this checklist for every security audit**
- **Document exceptions with justifications**
- **Re-audit after critical fixes**
- **Keep checklist updated with new threats**
- **When in doubt, escalate to security expert**

---

**Version**: 1.0.0
**Last Updated**: 2025-01-17
**Maintained By**: StackMap Security Team
