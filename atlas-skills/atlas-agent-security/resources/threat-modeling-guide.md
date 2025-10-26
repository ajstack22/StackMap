# Threat Modeling Guide

## Overview

Threat modeling is a structured approach to identifying security threats before they become vulnerabilities. Use this guide during the Adversarial Review phase or when designing security-critical features.

---

## What is Threat Modeling?

**Definition**: A process for identifying, quantifying, and addressing security threats to an application.

**Goals**:
1. Identify potential threats before implementation
2. Understand attack vectors and attack surface
3. Prioritize security efforts based on risk
4. Design security controls proactively

**When to use**:
- Full workflow: Adversarial Review phase
- New feature design (especially security-critical)
- Architecture changes
- Third-party integration planning
- Post-incident analysis

---

## The STRIDE Methodology

STRIDE is a mnemonic for six threat categories developed by Microsoft.

### S - Spoofing Identity

**Definition**: Attacker pretends to be someone else

**Questions to ask**:
- How does the system verify user identity?
- Can an attacker impersonate another user?
- Are authentication credentials secure?
- Can session tokens be stolen?

**Examples in StackMap context**:
- Attacker guesses recovery phrase
- Attacker steals recovery phrase from user's notes
- Attacker intercepts sync ID from network traffic
- Attacker uses another user's exported data

**Mitigations**:
- Strong recovery phrase (32 hex chars, 128 bits entropy)
- Recovery phrase generated with crypto.getRandomValues
- Sync ID derived securely (100k iterations)
- No session tokens (zero-knowledge architecture)
- HTTPS enforced (prevents network interception)

---

### T - Tampering with Data

**Definition**: Attacker modifies data in transit or at rest

**Questions to ask**:
- Is data integrity verified?
- Can an attacker modify data without detection?
- Are there integrity checks on storage?
- Can network traffic be modified (MitM)?

**Examples in StackMap context**:
- Attacker modifies sync data in transit
- Attacker modifies AsyncStorage data on device
- Attacker tampers with encrypted payload
- Attacker replays old sync messages

**Mitigations**:
- NaCl secretbox (authenticated encryption, includes HMAC)
- HTTPS (prevents MitM modification)
- Verify message authentication on decryption
- Nonce prevents replay attacks (if implemented correctly)
- AsyncStorage on mobile is app-private (OS protection)

---

### R - Repudiation

**Definition**: User denies performing an action

**Questions to ask**:
- Are actions logged with timestamps?
- Can the system prove who did what?
- Is there an audit trail?
- Can users deny legitimate actions?

**Examples in StackMap context**:
- User claims they didn't delete activity (but they did)
- User claims their data was modified (but it wasn't)
- Attacker performs action, user blamed

**Mitigations**:
- Limited concern for StackMap (single-user, zero-knowledge)
- No server-side audit trail (privacy by design)
- Local logging for debugging (but not security audit trail)
- Consider: Timestamp activities/modifications (already done)

**Trade-off**: Privacy vs. auditability
- StackMap prioritizes privacy (zero-knowledge)
- Accept: Limited audit trail

---

### I - Information Disclosure

**Definition**: Attacker accesses information they shouldn't

**Questions to ask**:
- What sensitive data exists?
- Where is it stored?
- How is it protected?
- Can an attacker access it without authorization?

**Examples in StackMap context**:
- Recovery phrase leaked in logs
- Plaintext user data in AsyncStorage
- Encrypted data decrypted by attacker
- User data visible in network traffic
- Error messages reveal system details

**Mitigations**:
- Never log recovery phrases (even in __DEV__)
- Encrypt data before AsyncStorage/localStorage
- Strong encryption (NaCl secretbox, 100k key derivation)
- HTTPS (encrypts network traffic)
- Error messages don't expose internals
- No sensitive data in URLs

**Critical concern**: Recovery phrase exposure
- If leaked, all user data compromised
- Must never be logged, stored plaintext, or transmitted

---

### D - Denial of Service

**Definition**: Attacker makes the system unavailable

**Questions to ask**:
- Can an attacker exhaust resources?
- Are there rate limits?
- Can unbounded data cause crashes?
- Are there infinite loops or recursion?

**Examples in StackMap context**:
- Rapid sync requests overwhelm server
- Extremely long activity name causes memory exhaustion
- AsyncStorage write storm freezes iOS (20+ seconds)
- Large activity list crashes UI
- Offline queue grows unbounded

**Mitigations**:
- Rate limiting on sync endpoints (server-side)
- Input length validation (activities, user names)
- AsyncStorage writes debounced (StackMap already does this)
- Pagination or virtualization for large lists
- Queue size limits (max 100 items?)
- Timeout mechanisms

**StackMap-specific risks**:
- iOS AsyncStorage freeze (already mitigated with debouncing)
- Large activity lists (consider virtualization if >100 activities)

---

### E - Elevation of Privilege

**Definition**: Attacker gains higher privileges

**Questions to ask**:
- Are there different privilege levels?
- Can users escalate privileges?
- Are authorization checks consistent?
- Can attackers bypass access controls?

**Examples in StackMap context**:
- Limited concern (single-user app)
- Platform permissions over-requested (camera, location, etc.)
- Attacker gains root/jailbreak access on device

**Mitigations**:
- Minimal platform permissions (only necessary)
- No admin/user distinction (single-user)
- iOS sandbox protects app data
- Android app-private storage
- No server-side privilege escalation (zero-knowledge)

**Note**: Mostly not applicable to StackMap (single-user, zero-knowledge)

---

## Threat Modeling Process

### Step 1: Decompose the Application (20 minutes)

**Objective**: Understand the architecture, data flows, and trust boundaries

#### 1.1 Identify Entry Points

**Where can data enter the system?**
- User input fields (activity names, user names, settings)
- Recovery phrase input
- Network API responses (sync data)
- Deep links / URL schemes
- Push notifications (if applicable)
- File imports (if applicable)

#### 1.2 Identify Assets

**What needs protection?**
- Recovery phrase (CRITICAL)
- Encryption keys (CRITICAL)
- User activity data (HIGH)
- User profiles (MEDIUM)
- Settings (LOW)
- Sync ID (derived, MEDIUM)

#### 1.3 Identify Trust Boundaries

**Where does trust level change?**
- User device (trusted) ↔ Network (untrusted)
- App code (trusted) ↔ User input (untrusted)
- AsyncStorage (semi-trusted) ↔ External backup (untrusted)
- Main app (trusted) ↔ Third-party libraries (semi-trusted)

#### 1.4 Map Data Flows

**How does data move through the system?**

**Example: Sync Flow**
```
[User enters recovery phrase] (Entry point)
  ↓ (Trust boundary: User input → App)
[Derive encryption key via PBKDF2] (Processing)
  ↓
[Encrypt user data with NaCl] (Processing)
  ↓ (Trust boundary: App → Network)
[Send encrypted data to server via HTTPS] (Exit point)
  ↓
[Server stores encrypted blob] (Storage, zero-knowledge)
```

**Assets involved**: Recovery phrase, encryption key, user data
**Trust boundaries crossed**: User input → App, App → Network

#### 1.5 Identify External Dependencies

**What third-party code/services are used?**
- tweetnacl (encryption)
- React Native (framework)
- AsyncStorage (storage)
- Sync server (stackmap.app/api)
- Apple/Google stores (app distribution)

---

### Step 2: Apply STRIDE (30 minutes)

**For each component, apply STRIDE categories**

#### Example: Sync Service Component

**Component**: /src/services/sync/syncService.js

**S - Spoofing**:
- Threat: Attacker guesses recovery phrase
- Likelihood: Low (128 bits entropy)
- Impact: High (full data access)
- Mitigation: Strong phrase generation

**T - Tampering**:
- Threat: Attacker modifies encrypted sync data
- Likelihood: Medium (network MitM possible)
- Impact: High (data corruption)
- Mitigation: Authenticated encryption (NaCl secretbox)

**R - Repudiation**:
- Threat: User denies syncing data
- Likelihood: Low
- Impact: Low (single-user app)
- Mitigation: Not applicable (no audit trail by design)

**I - Information Disclosure**:
- Threat: Recovery phrase logged to console
- Likelihood: High (if not careful)
- Impact: Critical (full data compromise)
- Mitigation: Never log phrases, grep for console.log

**D - Denial of Service**:
- Threat: Rapid sync requests overwhelm server
- Likelihood: Medium
- Impact: Medium (service disruption)
- Mitigation: Rate limiting (10 req/min)

**E - Elevation of Privilege**:
- Threat: Attacker accesses another user's sync data
- Likelihood: Low (zero-knowledge, sync ID unique)
- Impact: High (data breach)
- Mitigation: Sync ID authentication

---

### Step 3: Rank Threats by Risk (20 minutes)

**Risk = Likelihood × Impact**

#### Risk Matrix

|            | Low Impact | Medium Impact | High Impact |
|------------|-----------|---------------|-------------|
| **High Likelihood** | Medium | High | Critical |
| **Med Likelihood**  | Low    | Medium | High |
| **Low Likelihood**  | Low    | Low    | Medium |

#### Example Threat Ranking

| Threat | Component | Likelihood | Impact | Risk |
|--------|-----------|-----------|--------|------|
| Recovery phrase logged | syncService.js | High | High | **CRITICAL** |
| Weak key derivation | encryption.js | High | High | **CRITICAL** |
| No rate limiting | API | High | Medium | **HIGH** |
| AsyncStorage readable | iOS/Android | Medium | High | **HIGH** |
| Outdated tweetnacl | package.json | Low | High | **MEDIUM** |
| Long activity name DoS | ActivityInput.js | Medium | Low | **LOW** |

---

### Step 4: Identify Mitigations (20 minutes)

**For each high/critical risk, design mitigation**

#### Mitigation Strategies

**1. Eliminate the threat**
- Remove unnecessary features
- Don't store recovery phrase (user responsibility)

**2. Reduce likelihood**
- Input validation (prevents injection)
- Rate limiting (prevents DoS)
- Strong crypto (prevents decryption)

**3. Reduce impact**
- Encrypt data at rest (limits breach impact)
- Fail closed (deny access on error)
- Least privilege (limit damage if compromised)

**4. Transfer the risk**
- Use third-party auth (NOT applicable to StackMap)
- Use platform security (Keychain, EncryptedSharedPreferences)

**5. Accept the risk**
- Document why (e.g., "Low likelihood, low impact")
- Monitor for changes (if likelihood increases, re-evaluate)

#### Example Mitigations

**Threat**: Recovery phrase logged
- **Mitigation**: Remove all console.log statements
- **Implementation**: grep -r "console.log.*phrase" src/
- **Verification**: Code review + automated check in deployment

**Threat**: Weak key derivation
- **Mitigation**: Use PBKDF2 with 100k iterations
- **Implementation**: Replace sha256 with pbkdf2
- **Verification**: Unit test verifies iteration count

**Threat**: No rate limiting
- **Mitigation**: Server-side rate limit (10 req/min per sync ID)
- **Implementation**: Add express-rate-limit middleware
- **Verification**: Test with rapid requests, verify 429 status

---

## Threat Modeling Template

Use this template to document threat modeling sessions:

```markdown
# Threat Model: [Feature/Component Name]

**Date**: YYYY-MM-DD
**Participants**: [Names]
**Scope**: [What was analyzed]

## 1. Assets

| Asset | Sensitivity | Description |
|-------|------------|-------------|
| Recovery phrase | CRITICAL | User's master secret |
| Encryption keys | CRITICAL | Derived from phrase |
| User data | HIGH | Activities, users, settings |

## 2. Entry Points

| Entry Point | Description | Trust Level |
|------------|-------------|-------------|
| Activity input field | User-provided text | Untrusted |
| Recovery phrase input | User-provided secret | Untrusted |
| Sync API | Network responses | Untrusted |

## 3. Trust Boundaries

| From | To | Boundary Type |
|------|----|--------------|
| User | App | Input validation |
| App | Network | HTTPS encryption |
| App | Storage | Encryption at rest |

## 4. STRIDE Analysis

### Component: [Component Name]

**S - Spoofing**:
- Threat: [Description]
- Likelihood: [High/Med/Low]
- Impact: [High/Med/Low]
- Risk: [Critical/High/Med/Low]
- Mitigation: [How to address]

**T - Tampering**:
[Same format]

**R - Repudiation**:
[Same format]

**I - Information Disclosure**:
[Same format]

**D - Denial of Service**:
[Same format]

**E - Elevation of Privilege**:
[Same format]

## 5. Threat Summary

| # | Threat | Component | Risk | Status |
|---|--------|-----------|------|--------|
| 1 | Recovery phrase logged | syncService.js | CRITICAL | Mitigated |
| 2 | Weak key derivation | encryption.js | CRITICAL | Open |
| 3 | No rate limiting | API | HIGH | Planned |

## 6. Mitigations

### Threat 1: Recovery phrase logged

**Risk**: CRITICAL
**Mitigation**: Remove console.log statements
**Implementation**:
- grep -r "console.log.*phrase" src/
- Remove all matches
- Add automated check to deployment script

**Verification**:
- [ ] Code search shows no matches
- [ ] Manual code review
- [ ] Automated check in CI/CD

**Status**: ✅ Mitigated

### Threat 2: [Additional threats...]

## 7. Residual Risks

| Threat | Risk | Justification |
|--------|------|---------------|
| AsyncStorage accessible via device backup | LOW | User device security responsibility |
| Brute force recovery phrase | LOW | 128-bit entropy infeasible |

## 8. Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## 9. Next Review Date

**Scheduled**: [Date]
**Trigger**: [e.g., "Before beta deployment" or "If architecture changes"]
```

---

## StackMap-Specific Threat Scenarios

### Scenario 1: Recovery Phrase Compromise

**Asset**: Recovery phrase (CRITICAL)

**Threat vectors**:
1. User writes phrase on sticky note (physical access)
2. User saves phrase in iCloud Notes (cloud compromise)
3. User screenshots phrase (photo backup leaks)
4. Phrase logged in console (developer access)
5. Phrase stored in AsyncStorage (device compromise)
6. Shoulder surfing when user views phrase
7. Clipboard hijacking after copy

**Mitigations**:
1. User education (don't write down, keep secure)
2. Warn against cloud storage
3. Clear clipboard after timeout
4. Never log phrases (code review)
5. Never store phrases (already not stored)
6. UI warning when displaying phrase
7. Clear clipboard after 60 seconds (consider implementing)

**Residual risk**: User responsibility (can't prevent physical compromise)

---

### Scenario 2: Encryption Key Extraction

**Asset**: Encryption keys (CRITICAL)

**Threat vectors**:
1. Memory dump while key is in use (rooted/jailbroken device)
2. Debugger attached to running app (developer mode)
3. Key logged in console
4. Key stored in AsyncStorage (plaintext)
5. Weak key derivation (brute force)

**Mitigations**:
1. Clear keys from memory when done (consider implementing)
2. Disable debugging in production builds (already done)
3. Never log keys (code review)
4. Never store raw keys (derive on-demand)
5. Strong KDF (PBKDF2, 100k iterations)

**Residual risk**: Rooted/jailbroken device (device security responsibility)

---

### Scenario 3: Sync Data Interception

**Asset**: User activity data (HIGH)

**Threat vectors**:
1. HTTP downgrade attack (MitM forces HTTP)
2. TLS strip attack (MitM removes encryption)
3. Certificate pinning bypass
4. Network traffic logging (ISP, corporate network)
5. Compromised WiFi (coffee shop)

**Mitigations**:
1. Enforce HTTPS (no HTTP fallback)
2. Use HSTS header (server-side)
3. Certificate validation enabled (default in React Native)
4. Data encrypted before network (defense in depth)
5. Encrypted data unreadable even if intercepted

**Residual risk**: Low (multiple layers of protection)

---

### Scenario 4: Malicious Input Injection

**Asset**: App stability, data integrity (MEDIUM)

**Threat vectors**:
1. Extremely long activity name (DoS)
2. SQL injection (if using SQL)
3. XSS via activity name (web)
4. Command injection in deployment scripts
5. Code injection via eval() (if used)

**Mitigations**:
1. Length validation (500 char limit)
2. No SQL (using AsyncStorage/localStorage)
3. React automatic escaping (no dangerouslySetInnerHTML)
4. Parameterized commands in scripts
5. No eval() or Function() on user input

**Residual risk**: Low (multiple validations)

---

## Attack Trees

Attack trees visualize how attackers might achieve a goal.

### Example: Attacker Goal: Decrypt User's Activity Data

```
[Root: Decrypt User's Activity Data]
    |
    +-- [AND] Obtain encrypted data + Obtain decryption key
        |
        +-- [OR] Obtain encrypted data
        |   |
        |   +-- Intercept network traffic (HTTPS makes this hard)
        |   +-- Access AsyncStorage (requires device access)
        |   +-- Server breach (zero-knowledge, still encrypted)
        |
        +-- [OR] Obtain decryption key
            |
            +-- [OR] Obtain recovery phrase
            |   |
            |   +-- Phishing user (social engineering)
            |   +-- Shoulder surfing (physical)
            |   +-- Access user's notes (if they wrote it down)
            |   +-- Console logs (if we log it - MUST PREVENT)
            |   +-- Brute force (infeasible, 128-bit)
            |
            +-- Extract key from memory (requires rooted device + expertise)
            +-- Weak key derivation (MUST USE 100k iterations)
```

**Critical paths** (easiest attacks):
1. Recovery phrase from console logs → **Mitigation: Never log phrases**
2. Weak key derivation → **Mitigation: 100k iterations PBKDF2**
3. User writes phrase on sticky note → **Mitigation: User education**

---

## Continuous Threat Modeling

Threat modeling is not a one-time activity.

### When to Update Threat Model

**Triggers for review**:
- New feature added (especially security-critical)
- Architecture change (e.g., adding authentication)
- Third-party integration added
- Security incident occurred
- Regulatory requirements changed
- Quarterly review (scheduled)

### Living Document

Threat model should be:
- **Version controlled** (in git)
- **Updated regularly** (not just at start)
- **Referenced during code review** (check against threat model)
- **Input to security audits** (use as checklist)

---

## Resources

### Books
- "Threat Modeling: Designing for Security" by Adam Shostack
- "The Art of Software Security Assessment" by Dowd, McDonald, Schuh

### Tools
- Microsoft Threat Modeling Tool (free)
- OWASP Threat Dragon (open source)
- Draw.io (for data flow diagrams)

### References
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [Microsoft STRIDE](https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
- [NIST SP 800-154 Guide to Data-Centric Threat Modeling](https://csrc.nist.gov/publications/detail/sp/800-154/draft)

---

## Summary

Threat modeling helps you think like an attacker to design better defenses.

**Key takeaways**:
1. Use STRIDE to systematically identify threats
2. Rank threats by risk (Likelihood × Impact)
3. Design mitigations for high/critical risks
4. Document residual risks with justifications
5. Update threat model regularly (living document)

**Remember**: It's easier to design security in than bolt it on later.

---

**Version**: 1.0.0
**Last Updated**: 2025-01-17
**Maintained By**: StackMap Security Team
