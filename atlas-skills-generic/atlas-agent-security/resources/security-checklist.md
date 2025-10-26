# Security Audit Checklist

## Overview

This checklist provides a systematic approach to security audits. Use it during Adversarial Review phase (Full workflow) or when reviewing security-critical changes.

**Customization**: This is a generic OWASP-based checklist. Create `.atlas/security-checklist.md` in your project for stack-specific checks.

---

## Pre-Audit Preparation

- [ ] Identify scope (files, features, data flows)
- [ ] Understand sensitive data involved
- [ ] Review threat model (if exists)
- [ ] Check for previous security findings
- [ ] Set up testing environment

---

## 1. Authentication & Authorization

### Authentication Security
- [ ] Strong authentication mechanism implemented
- [ ] Passwords hashed with strong algorithm (bcrypt, Argon2, scrypt)
- [ ] Minimum 10k+ iterations for password hashing
- [ ] No plaintext passwords stored
- [ ] Password reset mechanism secure (no predictable tokens)
- [ ] Session tokens cryptographically random
- [ ] Multi-factor authentication available (for sensitive apps)

### Credential Management
- [ ] No credentials in source code
- [ ] No credentials in environment files (use secrets manager)
- [ ] Credentials never logged
- [ ] API keys have appropriate permissions (scoped)
- [ ] Tokens expire (reasonable timeout)

### Access Control
- [ ] Users can only access their own data
- [ ] Authorization checked on all protected operations
- [ ] No bypass mechanisms in code
- [ ] Failed authentication handled securely (no info leakage)
- [ ] No predictable session tokens/IDs
- [ ] Horizontal privilege escalation prevented (user A can't access user B's data)
- [ ] Vertical privilege escalation prevented (user can't become admin)

---

## 2. Cryptography & Encryption

### Encryption Implementation
- [ ] Using modern authenticated encryption (AES-GCM, ChaCha20-Poly1305)
- [ ] NOT using weak algorithms (MD5, SHA1, DES, AES-ECB)
- [ ] Nonce/IV is random and unique per encryption
- [ ] Nonce/IV stored with ciphertext for decryption
- [ ] No nonce/IV reuse (test: same plaintext → different ciphertext)
- [ ] Message authentication verified on decryption

### Key Derivation
- [ ] Keys derived securely (not directly from password)
- [ ] Using strong KDF (PBKDF2, scrypt, Argon2)
- [ ] Minimum 100,000 iterations for PBKDF2 (or equivalent for others)
- [ ] Salt used (random per user, stored with hash)
- [ ] No hardcoded keys in source code
- [ ] Keys never logged to console
- [ ] Keys use sufficient length (256 bits for symmetric)

### Key Management
- [ ] Keys stored securely (platform keystore or encrypted)
- [ ] Keys cleared from memory when no longer needed
- [ ] No keys in URL parameters
- [ ] No keys in error messages
- [ ] Key rotation supported (if long-lived keys)

---

## 3. Data Protection

### Data at Rest
- [ ] Sensitive data encrypted before storage
- [ ] Appropriate storage mechanism used (secure storage APIs)
- [ ] No plaintext passwords/secrets in storage
- [ ] Database encrypted (if applicable)
- [ ] File system permissions appropriate
- [ ] Backups encrypted

### Data in Transit
- [ ] HTTPS/TLS enforced (no HTTP fallback)
- [ ] No sensitive data in URLs (use POST body)
- [ ] TLS version >= 1.2 (prefer 1.3)
- [ ] Certificate validation enabled (no pinning bypass in production)
- [ ] Encrypted payload (if additional encryption layer needed)

### Data in Memory
- [ ] Sensitive data not retained longer than necessary
- [ ] Clear sensitive data on logout/reset
- [ ] No sensitive data in error boundaries
- [ ] Memory cleared after cryptographic operations

---

## 4. Input Validation

### User Input
- [ ] Length limits enforced (reasonable maximums)
- [ ] Empty input rejected or handled
- [ ] Whitespace-only input rejected or trimmed
- [ ] Special characters handled safely
- [ ] Type validation (numbers, emails, dates, etc.)
- [ ] No SQL injection risk (parameterized queries)
- [ ] No XSS risk (output encoding)
- [ ] No command injection risk (sanitized or parameterized)

### File Uploads (if applicable)
- [ ] File type validation (whitelist)
- [ ] File size limits enforced
- [ ] File content validated (not just extension)
- [ ] Files stored outside web root
- [ ] Uploaded files scanned for malware (if high-risk)
- [ ] Filename sanitized (no directory traversal)

### API Input
- [ ] Content-Type validated
- [ ] Request size limited
- [ ] JSON schema validation (if applicable)
- [ ] No deserialization of untrusted data without validation

---

## 5. API Security

### Endpoint Security
- [ ] HTTPS enforced (no HTTP)
- [ ] Authentication required on protected endpoints
- [ ] Authorization checked (user can only access own resources)
- [ ] Rate limiting enabled (prevent brute force and DoS)
- [ ] Input validation on all endpoints
- [ ] Error messages don't reveal system details

### Request/Response Security
- [ ] No sensitive data in query parameters
- [ ] POST/PUT/DELETE used for state-changing operations (not GET)
- [ ] CORS configured correctly (not `*` for credentials)
- [ ] Content-Type headers validated
- [ ] Response doesn't leak stack traces
- [ ] No API keys/tokens in client code
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options, etc.)

### API Keys/Tokens
- [ ] No hardcoded API keys
- [ ] Tokens expire (reasonable timeout)
- [ ] Tokens scoped to minimum permissions
- [ ] Tokens revocable
- [ ] Token refresh mechanism secure

---

## 6. Web-Specific Security

### XSS Prevention
- [ ] Output encoding/escaping (framework default or explicit)
- [ ] No innerHTML or equivalent without sanitization
- [ ] No eval() or Function() on user input
- [ ] No inline event handlers (onclick, etc.)
- [ ] Content Security Policy configured
- [ ] User-provided HTML sanitized (DOMPurify or equivalent)

### CSRF Prevention
- [ ] No state-changing GET requests
- [ ] Anti-CSRF tokens for session-based auth
- [ ] SameSite cookie attribute set
- [ ] Origin/Referer headers verified (if applicable)

### Storage Security
- [ ] localStorage only stores non-sensitive or encrypted data
- [ ] sessionStorage only stores non-sensitive data
- [ ] Cookies have Secure flag (HTTPS only)
- [ ] Cookies have HttpOnly flag (no JavaScript access)
- [ ] Cookies have SameSite attribute

### Clickjacking Prevention
- [ ] X-Frame-Options header configured
- [ ] CSP frame-ancestors configured
- [ ] No sensitive operations in iframeable pages

---

## 7. Mobile Platform Security

### iOS-Specific
- [ ] No sensitive data in NSUserDefaults (use Keychain)
- [ ] App Transport Security (ATS) enforced
- [ ] Minimum iOS version enforced (for security patches)
- [ ] Info.plist permissions minimized (only necessary)
- [ ] No certificate pinning bypass in production
- [ ] Face ID/Touch ID for sensitive operations (if applicable)
- [ ] Keychain items have appropriate access control

### Android-Specific
- [ ] No sensitive data in SharedPreferences (use EncryptedSharedPreferences)
- [ ] Manifest permissions minimized (only necessary)
- [ ] ProGuard/R8 enabled (code obfuscation)
- [ ] android:debuggable=false in production builds
- [ ] Network security config enforces HTTPS
- [ ] Minimum SDK version enforced (for security patches)
- [ ] Certificate pinning implemented (if applicable)

### Cross-Platform (React Native, Flutter, etc.)
- [ ] Platform-specific secure storage used
- [ ] No JavaScript debugging enabled in production
- [ ] Bundle is minified and obfuscated
- [ ] Third-party SDKs vetted for security

---

## 8. Logging & Monitoring

### Logging Security
- [ ] No passwords logged (NEVER)
- [ ] No encryption keys logged (NEVER)
- [ ] No tokens/credentials logged
- [ ] No PII logged (unless required and protected)
- [ ] Debug logs disabled in production
- [ ] Error messages don't expose system details
- [ ] Stack traces not shown to users

### Security Events
- [ ] Failed authentication attempts logged
- [ ] Suspicious activity logged (if detectable)
- [ ] Security errors logged (without sensitive data)
- [ ] Audit trail for critical operations
- [ ] Logs protected from tampering
- [ ] Log retention policy defined

### Monitoring
- [ ] Security event monitoring configured
- [ ] Alerting on suspicious patterns
- [ ] Regular log review process
- [ ] Incident response plan exists

---

## 9. Dependency Security

### Dependency Audit
- [ ] npm audit (or equivalent) shows no critical vulnerabilities
- [ ] No high-severity vulnerabilities (or accepted with justification)
- [ ] All dependencies reasonably up-to-date (<2 years old)
- [ ] No unmaintained packages (abandoned projects)

### Supply Chain Security
- [ ] package-lock.json (or equivalent) committed (reproducible builds)
- [ ] No suspicious dependencies (typosquatting)
- [ ] Dependencies from trusted registries (npm, PyPI, etc.)
- [ ] Dependency signatures verified (if supported)
- [ ] Software Bill of Materials (SBOM) maintained (for enterprise)

### Critical Dependencies
- [ ] Security-critical libraries up-to-date (crypto, auth, etc.)
- [ ] Known vulnerabilities addressed
- [ ] Security advisories monitored
- [ ] Update process defined

---

## 10. Error Handling

### Secure Error Handling
- [ ] Errors fail closed (deny access, don't grant)
- [ ] Error messages user-friendly (no stack traces)
- [ ] Errors logged server-side (for monitoring)
- [ ] No sensitive data in error messages
- [ ] Try-catch blocks around security-critical code
- [ ] Exceptions don't bypass security checks

### Example Patterns
```javascript
// ✅ CORRECT: Fail closed
try {
  return validateUser(user)
} catch (error) {
  logger.error('Validation failed:', error.message)  // Log, no sensitive data
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

## 11. Deployment & Build Security

### Build Configuration
- [ ] Production builds have debugging disabled
- [ ] Source maps not included in production (or protected)
- [ ] Environment variables not exposed to client
- [ ] No secrets in environment files (use secrets manager)
- [ ] Build process reproducible (lockfiles committed)

### Deployment Process
- [ ] Deploy scripts don't log secrets
- [ ] Credentials not in git history
- [ ] HTTPS enforced on production servers
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Deployment requires authentication/authorization
- [ ] Rollback capability exists

### Infrastructure Security
- [ ] Servers hardened (unnecessary services disabled)
- [ ] Firewall configured (minimum necessary ports open)
- [ ] OS and dependencies patched regularly
- [ ] Access logs enabled and monitored
- [ ] Intrusion detection configured (if applicable)

---

## 12. Testing

### Security Testing
- [ ] Unit tests for authentication/authorization
- [ ] Unit tests for input validation
- [ ] Unit tests for cryptographic functions
- [ ] Integration tests for security flows
- [ ] Manual testing: Try to bypass authentication
- [ ] Manual testing: Try injection attacks
- [ ] Manual testing: Try to access unauthorized data

### Penetration Testing Scenarios
- [ ] Attempt SQL injection (if using SQL)
- [ ] Attempt XSS (if web application)
- [ ] Attempt CSRF (if using sessions)
- [ ] Attempt to decrypt data without key
- [ ] Attempt to brute force credentials (verify rate limiting)
- [ ] Attempt to DoS via rapid requests (verify rate limiting)
- [ ] Attempt privilege escalation

---

## 13. Privacy & Compliance

### Data Minimization
- [ ] Only collect necessary data
- [ ] Data retention policy defined
- [ ] User can delete their data
- [ ] No unnecessary data sent to third parties

### Privacy by Design
- [ ] Privacy considered from design phase
- [ ] Data anonymization where possible
- [ ] User consent for data collection (where required)
- [ ] Privacy policy provided
- [ ] Terms of service provided

### GDPR/Privacy Regulations (if applicable)
- [ ] User consent mechanism
- [ ] Right to access data
- [ ] Right to delete data (right to be forgotten)
- [ ] Right to data portability
- [ ] Data breach notification plan
- [ ] Data Processing Agreement with third parties
- [ ] Privacy impact assessment completed

### Other Compliance (customize for your domain)
- [ ] PCI-DSS (if handling payment cards)
- [ ] HIPAA (if handling health information)
- [ ] SOC 2 (if enterprise SaaS)
- [ ] Industry-specific regulations

---

## Quick Command Reference

### Security Scans
```bash
# Check for secrets (customize patterns)
grep -r "password\|key\|secret\|token" --exclude-dir=node_modules src/

# Check for hardcoded credentials
grep -r "api_key\|apiKey\|API_KEY" --exclude-dir=node_modules src/

# Check for console.log statements (if not allowed in prod)
grep -r "console.log" src/ | grep -v "development"

# Dependency vulnerabilities
npm audit
npm audit --production

# Check specific dependency
npm audit <package-name>

# Outdated packages
npm outdated
```

### Code Quality
```bash
# Type checking (if TypeScript)
npm run typecheck

# Linting
npm run lint

# Tests
npm test

# Security-focused linting (if eslint-plugin-security installed)
npm run lint:security
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

[Brief overview of findings - 2-3 sentences]

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
- Password/credential exposure
- Encryption key leakage
- Hardcoded secrets
- Broken cryptography (weak algorithms, nonce reuse)
- SQL/Command injection
- Authentication bypass

**Action**: Fix immediately, block deployment

### High
- Missing input validation
- No rate limiting
- HTTP instead of HTTPS
- XSS vulnerabilities
- Insecure data storage
- Broken access control

**Action**: Fix this sprint/release

### Medium
- Outdated dependencies (non-critical CVEs)
- Missing error handling
- Excessive logging
- Weak permissions
- Missing security headers

**Action**: Fix next release

### Low
- Code quality issues
- Minor optimizations
- Documentation gaps
- Low-severity CVEs (no known exploits)
- Cosmetic issues

**Action**: Fix when convenient

---

## Customization Guide

This is a generic checklist. Customize it for your project:

### 1. Create `.atlas/security-checklist.md`

Add stack-specific checks:
```markdown
# Project-Specific Security Checklist

## Database Security (PostgreSQL)
- [ ] Row-level security policies defined
- [ ] SSL connections enforced
- [ ] Backup encryption enabled

## Authentication (Auth0)
- [ ] MFA enforced for admins
- [ ] Token expiration configured
- [ ] Refresh token rotation enabled

## Cloud Provider (AWS)
- [ ] IAM policies follow least privilege
- [ ] S3 buckets not publicly accessible
- [ ] Security groups restrict access
- [ ] CloudTrail logging enabled
```

### 2. Create `.atlas/security-standards.md`

Define your security standards:
```markdown
# Security Standards

## Cryptography
- Encryption: AES-256-GCM
- Key Derivation: Argon2id (preferred) or PBKDF2 (100k+ iterations)
- Password Hashing: bcrypt (12+ rounds)
- TLS: Version 1.3 preferred, 1.2 minimum

## Authentication
- Password: 12+ characters, complexity required
- MFA: Required for admin accounts
- Session: 30-minute timeout
- Token: JWT with 15-minute expiration
```

### 3. Update Audit Process

Reference project-specific checklists:
1. Complete this generic OWASP checklist
2. Complete `.atlas/security-checklist.md` (project-specific)
3. Apply `.atlas/security-standards.md` (your standards)

---

## Final Notes

- **Complete this checklist for every security audit**
- **Document exceptions with justifications**
- **Re-audit after critical fixes**
- **Keep checklist updated with new threats**
- **When in doubt, escalate to security expert**
- **Customize for your stack and domain**

---

**Version**: 1.0.0
**Last Updated**: 2025-01-17
