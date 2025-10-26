# Atlas Agent: Security (Generic)

## Overview

This is a **generic, portable** security agent skill for the Atlas workflow framework. It provides OWASP Top 10 and STRIDE-based security audit methodology that can be applied to any application.

## What This Skill Provides

### Core Security Audit Protocol
- **7-phase security audit** (Reconnaissance → Threat Modeling → Vulnerability Analysis → Platform Review → Code Review → Risk Assessment → Remediation)
- **STRIDE threat modeling** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- **OWASP Top 10 application** (with code examples and checklists)
- **Risk assessment framework** (Likelihood × Impact matrix)
- **Remediation recommendations** (with specific fixes and verification steps)

### Resources
- **security-checklist.md**: Comprehensive OWASP-based audit checklist
- **threat-modeling-guide.md**: STRIDE methodology guide with examples

### Model
- **Sonnet**: Balanced security analysis (thorough but efficient)

---

## What Was Removed (StackMap-Specific)

The generic version removes StackMap-specific content:

### Removed Examples
- Recovery phrase security (32-character hexadecimal, zero-knowledge sync)
- NaCl encryption implementation details
- AsyncStorage security specifics (iOS 20-second freeze mitigation)
- Sync ID derivation (PBKDF2 with 100k iterations)
- Platform-specific gotchas (Android font weights, iOS modal constraints)

### Replaced With Generic Content
- **Generic credential management** (passwords, API keys, tokens)
- **Generic encryption best practices** (authenticated encryption, strong KDF)
- **Generic storage security** (platform secure storage APIs)
- **Generic authentication** (session tokens, password hashing, MFA)

---

## Customization for Your Project

This skill is **intentionally generic**. Customize it for your stack:

### 1. Create `.atlas/security-checklist.md`

Add stack-specific security checks:

```markdown
# Project-Specific Security Checklist

## Stack: Node.js + PostgreSQL + React

### Database Security (PostgreSQL)
- [ ] Row-level security (RLS) policies defined
- [ ] SSL connections enforced
- [ ] Connection pooling configured securely
- [ ] Backup encryption enabled

### Authentication (Passport.js)
- [ ] Session secret is cryptographically random
- [ ] Session store is Redis (not in-memory)
- [ ] Cookie settings: httpOnly, secure, sameSite

### React Frontend
- [ ] No dangerouslySetInnerHTML without DOMPurify
- [ ] API calls use axios with CSRF token
- [ ] Environment variables not exposed to client
```

### 2. Create `.atlas/threat-scenarios.md`

Add domain-specific threat scenarios:

```markdown
# Domain-Specific Threat Scenarios

## E-commerce Application

### Scenario: Payment Data Compromise
**Asset**: Credit card information (CRITICAL)

**Threat vectors**:
1. PCI-DSS non-compliance
2. Man-in-the-middle attacks
3. Insecure storage of payment tokens

**Mitigations**:
- Use Stripe/PayPal (don't store cards directly)
- PCI-DSS SAQ-A compliance
- TLS 1.2+ enforced

### Scenario: Inventory Manipulation
**Asset**: Product pricing and inventory (HIGH)

**Threat vectors**:
1. Price tampering in checkout request
2. Race condition in inventory decrement
3. Admin API access without authorization

**Mitigations**:
- Server-side price verification
- Database transaction isolation
- Admin endpoints require elevated auth
```

### 3. Create `.atlas/security-standards.md`

Define your security standards:

```markdown
# Project Security Standards

## Cryptography Standards
- **Encryption**: AES-256-GCM (symmetric), RSA-4096 (asymmetric)
- **Key Derivation**: Argon2id (preferred) or PBKDF2 (100k+ iterations)
- **Password Hashing**: bcrypt (12 rounds minimum)
- **TLS**: Version 1.3 preferred, 1.2 minimum
- **JWT**: HS256 or RS256, 15-minute expiration

## Authentication Requirements
- **Passwords**: 12+ characters, complexity required (uppercase, lowercase, number, symbol)
- **MFA**: Required for admin accounts, optional for users
- **Sessions**: 30-minute inactivity timeout, absolute 8-hour timeout
- **Rate Limiting**: 5 failed login attempts → 15-minute lockout

## Authorization Patterns
- **RBAC**: Role-based access control (user, moderator, admin)
- **Principle**: Least privilege (deny by default)
- **Enforcement**: Server-side only (never client-side only)
- **Audit**: Log all authorization failures

## API Security
- **Authentication**: JWT in Authorization header (Bearer token)
- **Rate Limiting**: 100 requests/minute per user, 1000/minute per IP
- **CORS**: Whitelist specific origins (not `*`)
- **Input Validation**: JSON schema validation on all endpoints

## Logging Requirements
- **Never Log**: Passwords, API keys, tokens, credit cards, SSN
- **Always Log**: Authentication events, authorization failures, data modifications
- **Retention**: 90 days minimum for audit logs
- **Protection**: Logs stored in separate system, immutable
```

---

## How the Security Agent Uses Customization

When you invoke the security agent, it will:

1. **Apply generic OWASP/STRIDE methodology** (from SKILL.md)
2. **Apply your security checklist** (from `.atlas/security-checklist.md`)
3. **Consider your threat scenarios** (from `.atlas/threat-scenarios.md`)
4. **Enforce your security standards** (from `.atlas/security-standards.md`)

**Example invocation**:
```
"Review my authentication implementation for security vulnerabilities. Use security agent."
```

The agent will:
- Run 7-phase audit (SKILL.md protocol)
- Check OWASP Top 10 (generic)
- Check your authentication standards (`.atlas/security-standards.md`)
- Check your stack-specific checklist (`.atlas/security-checklist.md`)
- Consider your threat scenarios (`.atlas/threat-scenarios.md`)

---

## File Structure

```
atlas-agent-security/
├── SKILL.md                          # Main skill definition (generic OWASP/STRIDE)
├── README.md                         # This file (customization guide)
└── resources/
    ├── security-checklist.md         # Generic OWASP checklist
    └── threat-modeling-guide.md      # STRIDE methodology guide
```

**Your project** (create these):
```
.atlas/
├── security-checklist.md             # Your stack-specific checks
├── threat-scenarios.md               # Your domain-specific threats
└── security-standards.md             # Your security standards
```

---

## Example: Web Application Security Customization

Here's a complete example for a Node.js + PostgreSQL + React web application:

### `.atlas/security-checklist.md`

```markdown
# Security Checklist: E-Commerce Web App

## Stack
- **Backend**: Node.js 18 + Express + PostgreSQL
- **Frontend**: React 18 + TypeScript
- **Auth**: Passport.js + JWT
- **Payments**: Stripe

## Backend Security

### Node.js/Express
- [ ] Helmet.js configured (security headers)
- [ ] express-rate-limit on all routes
- [ ] CORS configured (whitelist only)
- [ ] express-validator for input validation
- [ ] No sensitive data in error responses (production)

### PostgreSQL
- [ ] SSL connections enforced (rejectUnauthorized: true)
- [ ] Row-level security (RLS) for multi-tenant data
- [ ] Parameterized queries only (no string concatenation)
- [ ] Database user has minimum privileges
- [ ] Backup encryption enabled

### Authentication
- [ ] Passport.js strategies configured securely
- [ ] JWT secret is 256-bit random (not hardcoded)
- [ ] Refresh token rotation implemented
- [ ] Session store is Redis (not in-memory)
- [ ] bcrypt rounds >= 12

## Frontend Security

### React
- [ ] No dangerouslySetInnerHTML (or use DOMPurify)
- [ ] API calls include CSRF token
- [ ] Environment variables not exposed (.env.local)
- [ ] Content Security Policy configured

### Build/Deploy
- [ ] Source maps not included in production
- [ ] Dependencies scanned (npm audit)
- [ ] HTTPS enforced (HSTS header)

## Payment Security

### Stripe Integration
- [ ] Stripe.js loaded from Stripe CDN (not bundled)
- [ ] Stripe public key used (not secret key)
- [ ] Payment intent created server-side
- [ ] Webhook signature verification
- [ ] PCI-DSS SAQ-A compliance
```

### `.atlas/threat-scenarios.md`

```markdown
# Threat Scenarios: E-Commerce Application

## Scenario 1: Payment Fraud

**Asset**: Customer payment information (CRITICAL)

**Threat Actors**:
- External attacker (opportunistic)
- Organized crime (targeted)

**Threat Vectors**:
1. Stolen credit card testing (carding)
2. Account takeover (credential stuffing)
3. Man-in-the-middle (public WiFi)
4. Malicious JavaScript injection (XSS)

**Mitigations**:
1. Stripe Radar (fraud detection)
2. Rate limiting on payment attempts
3. HTTPS enforced, HSTS header
4. Content Security Policy (CSP)
5. 3D Secure (SCA compliance)

**Monitoring**:
- Alert on multiple failed payments
- Alert on unusual transaction patterns
- Monitor Stripe dashboard for fraud alerts

## Scenario 2: Inventory Manipulation

**Asset**: Product inventory and pricing (HIGH)

**Threat Actors**:
- Malicious customer (looking for discounts)
- Competitor (disrupting business)

**Threat Vectors**:
1. Price tampering in checkout request
2. Inventory race condition (overselling)
3. Discount code brute forcing
4. API parameter manipulation

**Mitigations**:
1. Server-side price verification (never trust client)
2. Database transactions with proper isolation
3. Rate limiting on discount code attempts
4. Input validation on all API parameters
5. Optimistic locking for inventory updates

**Monitoring**:
- Alert on price mismatches (client vs server)
- Monitor for overselling incidents
- Log all discount code attempts

## Scenario 3: Customer Data Breach

**Asset**: Customer PII (name, email, address) (HIGH)

**Threat Actors**:
- External attacker (data harvesting)
- Insider threat (employee)

**Threat Vectors**:
1. SQL injection (database access)
2. Broken access control (IDOR)
3. Admin panel compromise
4. Database backup exposure (S3 misconfiguration)
5. CSV export privilege escalation

**Mitigations**:
1. Parameterized queries (no SQL injection)
2. Authorization checks on all API endpoints
3. Admin panel requires MFA + IP whitelist
4. S3 buckets private, backup encryption enabled
5. CSV exports audit-logged, role-restricted

**Incident Response**:
- Breach notification plan (GDPR 72-hour)
- Customer notification templates
- Data forensics procedure
```

### `.atlas/security-standards.md`

```markdown
# Security Standards: E-Commerce Application

## Cryptography

### Passwords
- **Hashing**: bcrypt with 12 rounds (cost factor)
- **Minimum Length**: 12 characters
- **Complexity**: Uppercase + lowercase + number + symbol
- **No Common Passwords**: Check against Have I Been Pwned API

### Tokens
- **JWT**: HS256 algorithm, 256-bit secret
- **Access Token**: 15-minute expiration
- **Refresh Token**: 7-day expiration, rotation on use
- **API Keys**: 256-bit random, scoped permissions

### Encryption
- **Data at Rest**: AES-256-GCM
- **Data in Transit**: TLS 1.3 (prefer) or TLS 1.2 (minimum)
- **PII Fields**: Encrypted in database (name, address, phone)

## Authentication

### Password Policy
- Minimum 12 characters
- At least 1 uppercase, 1 lowercase, 1 number, 1 symbol
- No common passwords (zxcvbn score >= 3)
- Password reset requires email verification

### Multi-Factor Authentication
- **Required**: Admin accounts
- **Optional**: Customer accounts (encouraged)
- **Methods**: TOTP (preferred), SMS (fallback)

### Session Management
- **Timeout**: 30 minutes inactivity, 8 hours absolute
- **Storage**: Redis with TTL
- **Cookies**: httpOnly, secure, sameSite=strict

## Authorization

### Role-Based Access Control
- **Roles**: customer, support, admin, super_admin
- **customer**: Can view/edit own orders and profile
- **support**: Can view customer orders (read-only)
- **admin**: Can manage products, view all orders
- **super_admin**: Full access including user management

### Enforcement
- Server-side only (never client-side only)
- Authorization middleware on all protected routes
- Deny by default (whitelist approach)

## API Security

### Rate Limiting
- **General**: 100 requests/minute per user
- **Login**: 5 attempts per 15 minutes per IP
- **Payment**: 10 attempts per hour per user
- **Search**: 30 requests/minute per IP

### Input Validation
- All endpoints use express-validator
- JSON schema validation for complex payloads
- Length limits enforced (e.g., max 1000 chars for review text)
- No HTML tags in user input (strip or reject)

### CORS
- Whitelist specific origins (not `*`)
- Allowed origins: https://example.com, https://www.example.com
- Credentials: true (for cookies)

## Logging & Monitoring

### What to Log
- **Always**: Authentication events, authorization failures, payment attempts, admin actions
- **Never**: Passwords, credit cards, API keys, JWT secrets

### Log Retention
- **Audit Logs**: 2 years (compliance requirement)
- **Access Logs**: 90 days
- **Error Logs**: 30 days

### Alerting
- Failed login attempts (>5 in 5 minutes)
- Authorization failures (pattern detection)
- Payment fraud indicators (Stripe Radar)
- Database connection errors
- API rate limit violations (per user)

## Compliance

### PCI-DSS
- SAQ-A compliance (using Stripe, not storing cards)
- Quarterly network scans
- Annual self-assessment

### GDPR
- Privacy policy published
- Cookie consent banner
- Data deletion capability
- Data export capability (JSON format)
- Breach notification procedure (72 hours)

### Data Retention
- Customer data: Retained until account deletion
- Order history: 7 years (tax compliance)
- Logs: See "Log Retention" above
```

---

## Usage Example

**User**: "Review the checkout API endpoint for security vulnerabilities. Use security agent."

**Security Agent Process**:

1. **Apply generic OWASP Top 10 checks** (SKILL.md):
   - A01: Broken Access Control
   - A02: Cryptographic Failures
   - A03: Injection
   - ... (all 10)

2. **Apply STRIDE threat modeling** (SKILL.md):
   - Spoofing: Can attacker place order as another user?
   - Tampering: Can attacker modify prices in checkout request?
   - ... (all 6)

3. **Check stack-specific security** (.atlas/security-checklist.md):
   - Express rate limiting configured?
   - Parameterized queries used?
   - Stripe integration secure?

4. **Consider domain threats** (.atlas/threat-scenarios.md):
   - Payment fraud scenario
   - Inventory manipulation scenario
   - Price tampering vectors

5. **Enforce security standards** (.atlas/security-standards.md):
   - JWT expiration 15 minutes?
   - bcrypt rounds >= 12?
   - Rate limiting: 10 payment attempts/hour?

6. **Provide verdict**: REJECTED / CONDITIONAL PASS / PASS

---

## Benefits of Generic Approach

### Portability
- **Works for any application** (web, mobile, backend)
- **Any tech stack** (Node.js, Python, Java, etc.)
- **Any domain** (e-commerce, healthcare, fintech, etc.)

### Standardization
- **OWASP Top 10** (industry-standard web security)
- **STRIDE** (industry-standard threat modeling)
- **Consistent audit methodology** (7-phase protocol)

### Customization
- **Stack-specific checks** (your database, auth, framework)
- **Domain-specific threats** (your industry, compliance requirements)
- **Your security standards** (your crypto algorithms, policies)

### Maintainability
- **Update generic skill** (OWASP releases new Top 10)
- **Update your customization** (new threats, new stack)
- **Separate concerns** (generic methodology vs. project-specific)

---

## Migration from StackMap-Specific Version

If you're migrating from the StackMap-specific version:

1. **Keep the 7-phase audit protocol** (same structure)
2. **Keep STRIDE methodology** (same framework)
3. **Keep OWASP Top 10 checks** (same vulnerability categories)
4. **Replace StackMap examples** with your application examples:
   - Recovery phrase → Your authentication mechanism
   - NaCl encryption → Your encryption library
   - AsyncStorage → Your storage mechanism
   - Sync system → Your data synchronization (if applicable)

5. **Create project customization**:
   - `.atlas/security-checklist.md` → Your stack-specific checks
   - `.atlas/threat-scenarios.md` → Your domain-specific threats
   - `.atlas/security-standards.md` → Your security standards

---

## Version History

### 1.0.0 (2025-01-17)
- Initial generic version
- Based on StackMap-specific security agent v1.0.0
- Removed StackMap-specific content (recovery phrase, NaCl, AsyncStorage)
- Added generic OWASP/STRIDE methodology
- Added customization guide and examples
- Added comprehensive web application example

---

## License

This skill is part of the Atlas framework and follows the same license.

---

**Model**: Sonnet
**Maintained By**: Atlas Framework Team
**Last Updated**: 2025-01-17
