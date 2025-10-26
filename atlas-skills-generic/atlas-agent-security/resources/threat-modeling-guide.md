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

**Generic Examples**:
- Attacker guesses weak password
- Attacker steals session token from network traffic
- Attacker uses stolen API key
- Attacker bypasses authentication

**Mitigations**:
- Strong authentication (multi-factor if applicable)
- Cryptographically random session tokens
- Secure token storage (HttpOnly cookies, secure storage)
- HTTPS enforced (prevents network interception)
- Rate limiting on authentication attempts

---

### T - Tampering with Data

**Definition**: Attacker modifies data in transit or at rest

**Questions to ask**:
- Is data integrity verified?
- Can an attacker modify data without detection?
- Are there integrity checks on storage?
- Can network traffic be modified (MitM)?

**Generic Examples**:
- Attacker modifies API request in transit
- Attacker modifies database records
- Attacker tampers with encrypted payload
- Attacker replays old requests

**Mitigations**:
- Authenticated encryption (AES-GCM, ChaCha20-Poly1305)
- HTTPS/TLS (prevents MitM modification)
- Message authentication codes (HMAC)
- Nonce/timestamp prevents replay attacks
- Database integrity constraints
- File integrity monitoring

---

### R - Repudiation

**Definition**: User denies performing an action

**Questions to ask**:
- Are actions logged with timestamps?
- Can the system prove who did what?
- Is there an audit trail?
- Can users deny legitimate actions?

**Generic Examples**:
- User claims they didn't make a purchase (but they did)
- User claims their account was compromised
- Attacker performs action, user blamed
- No proof of who deleted data

**Mitigations**:
- Audit logging with timestamps
- User attribution on all operations
- Signed operations (digital signatures)
- Non-repudiation mechanisms (if required)

**Trade-off**: Privacy vs. auditability
- Some applications prioritize privacy (minimal logging)
- Others require complete audit trails (financial, healthcare)
- Balance based on requirements

---

### I - Information Disclosure

**Definition**: Attacker accesses information they shouldn't

**Questions to ask**:
- What sensitive data exists?
- Where is it stored?
- How is it protected?
- Can an attacker access it without authorization?

**Generic Examples**:
- Passwords leaked in logs
- Plaintext sensitive data in database
- Encrypted data decrypted by attacker
- User data visible in network traffic
- Error messages reveal system details
- Directory listing exposes files

**Mitigations**:
- Never log passwords, keys, or sensitive data
- Encrypt data at rest
- Strong encryption with proper key management
- HTTPS (encrypts network traffic)
- Error messages don't expose internals
- No sensitive data in URLs
- Access control on files and directories
- Disable directory listing

**Critical concern**: Credential exposure
- If leaked, all user accounts compromised
- Must never be logged, stored plaintext, or transmitted unencrypted

---

### D - Denial of Service

**Definition**: Attacker makes the system unavailable

**Questions to ask**:
- Can an attacker exhaust resources?
- Are there rate limits?
- Can unbounded data cause crashes?
- Are there infinite loops or recursion?

**Generic Examples**:
- Rapid API requests overwhelm server
- Extremely long input causes memory exhaustion
- Large file upload consumes disk space
- Uncontrolled recursion causes stack overflow
- Database query without limits causes timeout

**Mitigations**:
- Rate limiting (per IP, per user, per endpoint)
- Input length validation
- Request size limits
- Pagination for large data sets
- Query timeouts
- Resource quotas (disk, memory, CPU)
- Load balancing
- Auto-scaling (if cloud-based)

---

### E - Elevation of Privilege

**Definition**: Attacker gains higher privileges

**Questions to ask**:
- Are there different privilege levels?
- Can users escalate privileges?
- Are authorization checks consistent?
- Can attackers bypass access controls?

**Generic Examples**:
- User manipulates request to access admin endpoint
- SQL injection grants admin access
- Path traversal accesses restricted files
- Insecure direct object reference (IDOR) accesses other user's data

**Mitigations**:
- Authorization checks on all protected operations
- Server-side enforcement (never client-side only)
- Least privilege principle
- Role-based access control (RBAC)
- No admin backdoors
- Security testing for privilege escalation

---

## Threat Modeling Process

### Step 1: Decompose the Application (20 minutes)

**Objective**: Understand the architecture, data flows, and trust boundaries

#### 1.1 Identify Entry Points

**Where can data enter the system?**
- User input fields (forms, text areas, etc.)
- API endpoints (REST, GraphQL, etc.)
- File uploads
- Database queries (if user-influenced)
- Third-party webhooks/callbacks
- Message queues
- Deep links / URL schemes

#### 1.2 Identify Assets

**What needs protection?**
- User credentials (passwords, API keys)
- Personal data (PII)
- Financial data (payment info)
- Sensitive business data
- Intellectual property
- System configuration
- Encryption keys

**Prioritize by sensitivity**:
- CRITICAL: Passwords, encryption keys, financial data
- HIGH: Personal data, business data
- MEDIUM: User preferences, non-sensitive profile data
- LOW: Public data, cached data

#### 1.3 Identify Trust Boundaries

**Where does trust level change?**
- User device (semi-trusted) ↔ Network (untrusted)
- Application code (trusted) ↔ User input (untrusted)
- Application (trusted) ↔ Third-party services (semi-trusted)
- Client (untrusted) ↔ Server (trusted)
- Database (trusted) ↔ Application (trusted)

#### 1.4 Map Data Flows

**How does data move through the system?**

**Example: Authentication Flow**
```
[User enters credentials] (Entry point)
  ↓ (Trust boundary: User input → Application)
[Validate input format] (Input validation)
  ↓
[Query database for user] (Data retrieval)
  ↓
[Compare password hash] (Authentication)
  ↓
[Generate session token] (Session creation)
  ↓ (Trust boundary: Server → Client)
[Return token to client] (Exit point)
```

**Assets involved**: Password, password hash, session token
**Trust boundaries crossed**: User input → Application, Server → Client

#### 1.5 Identify External Dependencies

**What third-party code/services are used?**
- Authentication providers (Auth0, Firebase, etc.)
- Payment processors (Stripe, PayPal)
- Cloud services (AWS, Azure, GCP)
- CDNs (CloudFlare, Fastly)
- Analytics services
- Third-party libraries (npm packages, etc.)
- APIs (external data sources)

---

### Step 2: Apply STRIDE (30 minutes)

**For each component, apply STRIDE categories**

#### Example: User Authentication Component

**Component**: Authentication service

**S - Spoofing**:
- Threat: Attacker guesses user password
- Likelihood: Medium (depends on password policy)
- Impact: High (full account access)
- Mitigation: Strong password policy, rate limiting, MFA

**T - Tampering**:
- Threat: Attacker modifies authentication request (MitM)
- Likelihood: Low (HTTPS protects)
- Impact: High (authentication bypass)
- Mitigation: HTTPS/TLS, certificate validation

**R - Repudiation**:
- Threat: User denies logging in
- Likelihood: Low
- Impact: Low (audit logs can prove login)
- Mitigation: Log authentication events with timestamps

**I - Information Disclosure**:
- Threat: Password logged to console or logs
- Likelihood: High (if not careful)
- Impact: Critical (password exposed)
- Mitigation: Never log passwords, code review

**D - Denial of Service**:
- Threat: Brute force login attempts overwhelm server
- Likelihood: High (common attack)
- Impact: Medium (service disruption)
- Mitigation: Rate limiting, CAPTCHA

**E - Elevation of Privilege**:
- Threat: Attacker bypasses authentication
- Likelihood: Low (if properly implemented)
- Impact: Critical (unauthorized access)
- Mitigation: Secure authentication implementation, testing

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
| Password logged | Auth service | High | High | **CRITICAL** |
| SQL injection | User query | High | High | **CRITICAL** |
| No rate limiting | API | High | Medium | **HIGH** |
| Weak password policy | Auth | Medium | High | **HIGH** |
| Outdated dependency | Dependencies | Low | High | **MEDIUM** |
| Missing input validation | User form | Medium | Low | **LOW** |

---

### Step 4: Identify Mitigations (20 minutes)

**For each high/critical risk, design mitigation**

#### Mitigation Strategies

**1. Eliminate the threat**
- Remove unnecessary features
- Don't store data you don't need
- Minimize attack surface

**2. Reduce likelihood**
- Input validation (prevents injection)
- Rate limiting (prevents brute force and DoS)
- Strong crypto (prevents decryption)
- Authentication (prevents unauthorized access)

**3. Reduce impact**
- Encrypt data at rest (limits breach impact)
- Fail closed (deny access on error)
- Least privilege (limit damage if compromised)
- Data minimization (less data to leak)

**4. Transfer the risk**
- Use third-party auth (OAuth, SAML)
- Use payment processor (don't handle cards)
- Use cloud security features
- Security insurance (for financial risk)

**5. Accept the risk**
- Document why (e.g., "Low likelihood, low impact")
- Monitor for changes (if likelihood increases, re-evaluate)
- Management approval for accepted risks

#### Example Mitigations

**Threat**: Password logged in console
- **Mitigation**: Remove all password logging
- **Implementation**: grep -r "console.log.*password" src/
- **Verification**: Code review + automated check in CI/CD

**Threat**: SQL injection vulnerability
- **Mitigation**: Use parameterized queries
- **Implementation**: Replace string concatenation with prepared statements
- **Verification**: Code review + automated testing (SQLMap)

**Threat**: No rate limiting on API
- **Mitigation**: Server-side rate limit (e.g., 100 requests/minute per IP)
- **Implementation**: Add rate-limiting middleware (express-rate-limit, etc.)
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
| User passwords | CRITICAL | Authentication credentials |
| Payment data | CRITICAL | Credit card information |
| Personal data | HIGH | User profile, contact info |

## 2. Entry Points

| Entry Point | Description | Trust Level |
|------------|-------------|-------------|
| Login form | User-provided credentials | Untrusted |
| API endpoint | External requests | Untrusted |
| Database | Data storage | Trusted |

## 3. Trust Boundaries

| From | To | Boundary Type |
|------|----|--------------|
| User | Application | Input validation |
| Application | Network | TLS encryption |
| Application | Database | Authentication |

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
| 1 | Password logged | Auth service | CRITICAL | Mitigated |
| 2 | SQL injection | User query | CRITICAL | Open |
| 3 | No rate limiting | API | HIGH | Planned |

## 6. Mitigations

### Threat 1: Password Logged

**Risk**: CRITICAL
**Mitigation**: Remove password logging
**Implementation**:
- grep -r "console.log.*password" src/
- Remove all matches
- Add automated check to CI/CD

**Verification**:
- [ ] Code search shows no matches
- [ ] Manual code review
- [ ] Automated check in CI/CD

**Status**: ✅ Mitigated

### Threat 2: [Additional threats...]

## 7. Residual Risks

| Threat | Risk | Justification |
|--------|------|---------------|
| DDoS attack | MEDIUM | Requires infrastructure-level mitigation (CDN, WAF) |
| Physical device theft | LOW | User device security responsibility |

## 8. Recommendations

1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

## 9. Next Review Date

**Scheduled**: [Date]
**Trigger**: [e.g., "Before production deployment" or "If architecture changes"]
```

---

## Generic Threat Scenarios

### Scenario 1: Credential Compromise

**Asset**: User passwords (CRITICAL)

**Threat vectors**:
1. Weak password policy (easy to guess)
2. Password reuse (compromised elsewhere)
3. Phishing (social engineering)
4. Keylogger (malware)
5. Database breach (plaintext storage)
6. Shoulder surfing (physical observation)
7. Brute force attack (no rate limiting)

**Mitigations**:
1. Strong password policy (length, complexity)
2. User education (unique passwords)
3. Anti-phishing training
4. User device security (antivirus)
5. Strong password hashing (bcrypt, Argon2)
6. Multi-factor authentication
7. Rate limiting on login attempts

**Residual risk**: User-side vulnerabilities (phishing, malware)

---

### Scenario 2: Encryption Key Extraction

**Asset**: Encryption keys (CRITICAL)

**Threat vectors**:
1. Keys hardcoded in source code
2. Keys in environment variables (exposed)
3. Keys logged to console
4. Memory dump (attacker with access)
5. Weak key derivation (brute force)
6. Keys in version control history

**Mitigations**:
1. Never hardcode keys
2. Use secrets manager (AWS Secrets Manager, HashiCorp Vault)
3. Never log keys
4. Use platform secure storage (Keychain, etc.)
5. Strong key derivation (100k+ iterations)
6. .gitignore for secrets, git-secrets tool

**Residual risk**: Server compromise (attacker with root access)

---

### Scenario 3: API Data Interception

**Asset**: Sensitive data in transit (HIGH)

**Threat vectors**:
1. HTTP (no encryption)
2. TLS downgrade attack
3. Certificate validation disabled
4. Public WiFi (MitM)
5. Compromised network infrastructure

**Mitigations**:
1. Enforce HTTPS (no HTTP fallback)
2. TLS 1.2+ only, HSTS header
3. Certificate validation enabled
4. Certificate pinning (for high-security apps)
5. Defense in depth (encrypt data before transmission)

**Residual risk**: Low (multiple layers of protection)

---

### Scenario 4: Malicious Input Injection

**Asset**: Application availability, data integrity (MEDIUM-HIGH)

**Threat vectors**:
1. SQL injection (database compromise)
2. XSS (execute malicious scripts)
3. Command injection (execute system commands)
4. Path traversal (access restricted files)
5. XXE (XML external entity injection)

**Mitigations**:
1. Parameterized queries (never concatenate SQL)
2. Output encoding (escape HTML/JavaScript)
3. Parameterized commands (don't use shell)
4. Path validation (whitelist allowed paths)
5. Disable external entities in XML parser

**Residual risk**: Low (if properly implemented)

---

## Attack Trees

Attack trees visualize how attackers might achieve a goal.

### Example: Attacker Goal: Access User's Account

```
[Root: Access User's Account]
    |
    +-- [OR] Bypass Authentication
    |   |
    |   +-- Guess password (brute force)
    |   |   - Mitigation: Rate limiting, strong password policy
    |   +-- SQL injection in login form
    |   |   - Mitigation: Parameterized queries
    |   +-- Steal session token
    |       - Mitigation: HttpOnly cookies, HTTPS
    |
    +-- [OR] Compromise User's Credentials
        |
        +-- Phishing (social engineering)
        |   - Mitigation: User education, 2FA
        +-- Keylogger (malware)
        |   - Mitigation: User device security
        +-- Database breach (plaintext passwords)
            - Mitigation: Strong password hashing
```

**Critical paths** (easiest attacks):
1. SQL injection → **Mitigation: Parameterized queries**
2. Weak password + no rate limiting → **Mitigation: Strong policy + rate limiting**
3. Session token theft (no HTTPS) → **Mitigation: HTTPS enforced**

---

## Continuous Threat Modeling

Threat modeling is not a one-time activity.

### When to Update Threat Model

**Triggers for review**:
- New feature added (especially security-critical)
- Architecture change (e.g., adding third-party service)
- Security incident occurred
- Regulatory requirements changed
- Penetration testing findings
- Quarterly review (scheduled)

### Living Document

Threat model should be:
- **Version controlled** (in git)
- **Updated regularly** (not just at start)
- **Referenced during code review** (check against threat model)
- **Input to security audits** (use as checklist)
- **Training material** (educate team on threats)

---

## Resources

### Books
- "Threat Modeling: Designing for Security" by Adam Shostack
- "The Art of Software Security Assessment" by Dowd, McDonald, Schuh
- "Threat Modeling" by Izar Tarandach and Matthew J. Coles

### Tools
- Microsoft Threat Modeling Tool (free, Windows)
- OWASP Threat Dragon (open source, cross-platform)
- Threagile (open source, YAML-based)
- IriusRisk (commercial, enterprise)
- Draw.io / Lucidchart (for data flow diagrams)

### References
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [Microsoft STRIDE](https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
- [NIST SP 800-154 Guide to Data-Centric Threat Modeling](https://csrc.nist.gov/publications/detail/sp/800-154/draft)
- [MITRE ATT&CK Framework](https://attack.mitre.org/) (threat intelligence)

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

**Process**:
1. Decompose application (identify assets, entry points, trust boundaries)
2. Apply STRIDE (identify threats per component)
3. Rank by risk (likelihood × impact)
4. Design mitigations (eliminate, reduce, transfer, accept)
5. Document and maintain (living document)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-17
