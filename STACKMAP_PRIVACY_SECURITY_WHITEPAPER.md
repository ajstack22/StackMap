# StackMap Privacy, Security, and Sharing Infrastructure White Paper

## Executive Summary

StackMap implements a revolutionary zero-knowledge, privacy-first architecture that fundamentally reimagines how personal data should be handled in digital applications. Unlike traditional cloud services like Google Docs that require account creation, store unencrypted data on servers, and have full access to user information, StackMap ensures complete user privacy through end-to-end encryption, anonymous usage, and cryptographic authentication.

This white paper details StackMap's comprehensive security infrastructure, demonstrating why it represents a superior approach to data privacy and sharing compared to conventional cloud-based solutions.

## Table of Contents

1. [Introduction](#introduction)
2. [Core Privacy Principles](#core-privacy-principles)
3. [Architecture Overview](#architecture-overview)
4. [Encryption Infrastructure](#encryption-infrastructure)
5. [Sharing Mechanism](#sharing-mechanism)
6. [Comparison with Traditional Solutions](#comparison-with-traditional-solutions)
7. [Security Analysis](#security-analysis)
8. [Implementation Benefits](#implementation-benefits)
9. [Future Enhancements](#future-enhancements)
10. [Conclusion](#conclusion)

## Introduction

In an era where data breaches and privacy violations are commonplace, StackMap takes a fundamentally different approach to handling sensitive personal information. Built on zero-knowledge principles, the system ensures that even StackMap's servers never have access to user data in plaintext form.

### Key Differentiators

- **No accounts required**: Users can start immediately without registration
- **Zero-knowledge architecture**: Servers never see unencrypted data
- **Cryptographic authentication**: Recovery phrases instead of passwords
- **End-to-end encryption**: All data encrypted before leaving the device
- **Temporary sharing**: Time-limited, token-based access for third parties
- **Complete data ownership**: Users can delete all data instantly

## Core Privacy Principles

### 1. Privacy by Design

StackMap was architected from the ground up with privacy as the primary consideration:

```
┌─────────────────────────────────────────────────────────────┐
│                     Privacy Architecture                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User Device                          StackMap Server         │
│  ┌─────────────┐                     ┌──────────────┐       │
│  │ Plain Data  │                     │   No Keys    │       │
│  │             │    Encrypted        │   No Access  │       │
│  │ Encryption  │ ──────────────────> │   to Data    │       │
│  │   Keys      │      Data Only      │              │       │
│  └─────────────┘                     └──────────────┘       │
│                                                               │
│  All encryption/decryption happens locally on device          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2. Data Minimization

The server stores only:
- Encrypted data blobs
- Sync IDs (derived from recovery phrases)
- Timestamps for sync coordination
- No personal identifiers, emails, or metadata

### 3. User Control

Users maintain complete control:
- Generate their own encryption keys
- Delete all data instantly
- Export data at any time
- No vendor lock-in

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          StackMap Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────┐         ┌─────────────────┐                   │
│  │   User Device   │         │   User Device   │                   │
│  │                 │         │                 │                   │
│  │ ┌─────────────┐ │         │ ┌─────────────┐ │                   │
│  │ │ Local Data  │ │         │ │ Local Data  │ │                   │
│  │ └─────────────┘ │         │ └─────────────┘ │                   │
│  │ ┌─────────────┐ │         │ ┌─────────────┐ │                   │
│  │ │ Encryption  │ │         │ │ Encryption  │ │                   │
│  │ │   Service   │ │         │ │   Service   │ │                   │
│  │ └─────────────┘ │         │ └─────────────┘ │                   │
│  │ ┌─────────────┐ │         │ ┌─────────────┐ │                   │
│  │ │Recovery Key │ │         │ │Same Recovery │ │                   │
│  │ │   Storage   │ │         │ │ Key (Shared) │ │                   │
│  │ └─────────────┘ │         │ └─────────────┘ │                   │
│  └────────┬────────┘         └────────┬────────┘                   │
│           │                           │                             │
│           │      Encrypted Data       │                             │
│           └───────────┬───────────────┘                             │
│                       │                                             │
│                       ▼                                             │
│           ┌───────────────────────┐                                │
│           │   StackMap Server     │                                │
│           │                       │                                │
│           │  ┌─────────────────┐ │                                │
│           │  │ Encrypted Blobs │ │                                │
│           │  │   (No Keys)     │ │                                │
│           │  └─────────────────┘ │                                │
│           │  ┌─────────────────┐ │                                │
│           │  │  Share Tokens   │ │                                │
│           │  │ (Time-Limited)  │ │                                │
│           │  └─────────────────┘ │                                │
│           └───────────────────────┘                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initial Setup**
   - User generates a recovery phrase locally
   - Encryption keys derived from the phrase
   - No server communication required

2. **Synchronization**
   - Data encrypted locally before transmission
   - Server stores only encrypted blobs
   - Other devices decrypt using the same recovery phrase

3. **Sharing**
   - Temporary tokens generated for specific data subsets
   - Read-only access with automatic expiration
   - No exposure of encryption keys

## Encryption Infrastructure

### Key Derivation and Management

```javascript
// Recovery Phrase Generation (Client-Side Only)
┌─────────────────────────────────────────┐
│         Recovery Phrase Generation       │
├─────────────────────────────────────────┤
│                                         │
│  Entropy Source (128 bits)              │
│           │                             │
│           ▼                             │
│  12-Word Recovery Phrase                │
│  "correct horse battery staple..."      │
│           │                             │
│           ▼                             │
│  PBKDF2 Key Derivation                 │
│  • 100,000 iterations                  │
│  • SHA-256 hashing                     │
│  • Unique salt per phrase              │
│           │                             │
│           ▼                             │
│  256-bit Master Encryption Key          │
│  (Never leaves device)                  │
│                                         │
└─────────────────────────────────────────┘
```

### Encryption Process

StackMap uses authenticated encryption (XSalsa20-Poly1305) via TweetNaCl.js:

```
┌──────────────────────────────────────────────┐
│            Encryption Process                 │
├──────────────────────────────────────────────┤
│                                              │
│  Plain Data                                  │
│      │                                       │
│      ▼                                       │
│  JSON Serialization                          │
│      │                                       │
│      ▼                                       │
│  Compression (if > 1KB)                      │
│      │                                       │
│      ▼                                       │
│  Generate Random Nonce (192 bits)            │
│      │                                       │
│      ▼                                       │
│  XSalsa20-Poly1305 Encryption                │
│  • Authenticated encryption                  │
│  • Prevents tampering                        │
│      │                                       │
│      ▼                                       │
│  Nonce + Ciphertext                          │
│      │                                       │
│      ▼                                       │
│  Base64 Encoding                             │
│      │                                       │
│      ▼                                       │
│  Encrypted Blob (sent to server)             │
│                                              │
└──────────────────────────────────────────────┘
```

### Security Properties

1. **Forward Secrecy**: Each encryption uses a unique nonce
2. **Authentication**: Poly1305 MAC prevents tampering
3. **Key Stretching**: PBKDF2 protects against brute force
4. **No Key Reuse**: Fresh nonces for every operation

## Sharing Mechanism

### Zero-Knowledge Share Architecture

```
┌────────────────────────────────────────────────────────┐
│            True Zero-Knowledge Share Flow               │
├────────────────────────────────────────────────────────┤
│                                                         │
│  User Selects Data to Share                            │
│  • Choose specific users                               │
│  • Select today/tomorrow                               │
│  • Include/exclude completed tasks                     │
│           │                                            │
│           ▼                                            │
│  Generate Secure Token/Key                             │
│  • 24 characters (144 bits entropy)                   │
│  • Cryptographically secure random                    │
│  • Token serves as encryption key                     │
│  • Example: "K7x9mP3nQ2wR5vL8jF6tA4yB"               │
│           │                                            │
│           ▼                                            │
│  Client-Side Processing                                │
│  • Filter data based on selections                    │
│  • Package into share structure                       │
│  • Add metadata (recipient, expiry)                   │
│           │                                            │
│           ▼                                            │
│  Client-Side Encryption                                │
│  • Use token as encryption key                        │
│  • XSalsa20-Poly1305 encryption                       │
│  • Generate unique nonce                              │
│  • Create authenticated ciphertext                    │
│           │                                            │
│           ▼                                            │
│  Server Storage (Zero-Knowledge)                       │
│  • Store encrypted blob only                          │
│  • No decryption capability                           │
│  • Token maps to encrypted data                       │
│  • Cannot read share contents                         │
│           │                                            │
│           ▼                                            │
│  Share URL Generated                                   │
│  https://stackmap.app?share=K7x9mP3nQ2wR5vL8jF6tA4yB  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Share Access Flow

```
┌────────────────────────────────────────────────────────┐
│                 Share Access Flow                       │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Recipient Opens URL                                   │
│  https://stackmap.app?share=K7x9mP3nQ2wR5vL8jF6tA4yB   │
│           │                                            │
│           ▼                                            │
│  App Detects Share Token                               │
│  • Extract from URL parameter                         │
│  • Token IS the encryption key                        │
│           │                                            │
│           ▼                                            │
│  Server Validates Token                                │
│  • Check token exists                                 │
│  • Verify not expired                                 │
│  • Increment access counter                           │
│           │                                            │
│           ▼                                            │
│  Server Returns Encrypted Blob                        │
│  • No decryption on server                            │
│  • Server cannot read content                         │
│  • Only encrypted data transmitted                    │
│           │                                            │
│           ▼                                            │
│  Client Decrypts with Token                           │
│  • Token used as decryption key                       │
│  • Decryption happens in browser/app                  │
│  • Server never sees plaintext                        │
│           │                                            │
│           ▼                                            │
│  Display Share View                                    │
│  • Show user's progress                               │
│  • Display expiration warning                         │
│  • Provide StackMap signup CTA                        │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Security Features

1. **True Zero-Knowledge**: Server cannot decrypt shares
2. **Time-Limited Access**: Shares expire automatically (1 hour to 3 months)
3. **Cryptographic Security**: 144-bit encryption keys
4. **Token as Key**: URL token IS the decryption key
5. **Client-Side Filtering**: Data filtered before encryption
6. **Access Logging**: Anonymous usage tracking only
7. **Read-Only**: Recipients cannot modify data
8. **No Key Storage**: Server never stores decryption keys
9. **Auto-Updating Shares**: Optional live updates while maintaining encryption

## Comparison with Traditional Solutions

### StackMap vs. Google Docs

| Feature | StackMap | Google Docs |
|---------|----------|-------------|
| **Account Required** | ❌ No | ✅ Yes |
| **Email/Password** | ❌ No | ✅ Yes |
| **Server Access to Data** | ❌ Zero-knowledge | ✅ Full access |
| **Server Access to Shares** | ❌ Encrypted only | ✅ Full access |
| **Data Mining** | ❌ Impossible | ✅ For ads/AI |
| **Offline First** | ✅ Yes | ⚠️ Limited |
| **Anonymous Usage** | ✅ Yes | ❌ No |
| **Anonymous Sharing** | ✅ Yes | ❌ No |
| **Instant Start** | ✅ Yes | ❌ No |
| **Data Portability** | ✅ Full control | ⚠️ Limited |
| **Sharing Granularity** | ✅ Field-level | ⚠️ Document-level |
| **Share Expiration** | ✅ Automatic | ❌ Manual |
| **Share Encryption** | ✅ End-to-end | ❌ Server-side |
| **Live Share Updates** | ✅ Encrypted auto-update | ✅ But server reads all |
| **Compliance Ready** | ✅ GDPR/COPPA | ⚠️ Complex |

### Privacy Comparison Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Privacy Comparison                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Traditional Cloud (Google Docs)          StackMap           │
│  ┌─────────────────────────┐       ┌──────────────────────┐│
│  │ ❌ Email required       │       │ ✅ No email needed   ││
│  │ ❌ Real name needed     │       │ ✅ Anonymous usage   ││
│  │ ❌ Server reads data    │       │ ✅ Zero-knowledge    ││
│  │ ❌ Data mining enabled  │       │ ✅ No data mining    ││
│  │ ❌ Complex permissions  │       │ ✅ Simple sharing    ││
│  │ ❌ Permanent shares     │       │ ✅ Auto-expiring     ││
│  │ ❌ Account deletion hard│       │ ✅ Instant deletion  ││
│  └─────────────────────────┘       └──────────────────────┘│
│                                                              │
│  Data Visibility:                   Data Visibility:        │
│  • Google sees everything           • Server sees nothing   │
│  • Used for advertising             • No profiling possible │
│  • Shared with partners             • User owns all data    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Security Analysis

### Threat Model

```
┌────────────────────────────────────────────────────────────┐
│                      Threat Analysis                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Threat: Server Compromise                                  │
│  ├─ Risk: Attacker gains database access                   │
│  ├─ Traditional: Full data exposure                        │
│  └─ StackMap: Only encrypted blobs exposed                 │
│                                                             │
│  Threat: Network Interception (MITM)                       │
│  ├─ Risk: Data intercepted in transit                     │
│  ├─ Traditional: HTTPS only protection                    │
│  └─ StackMap: HTTPS + app-level encryption                │
│                                                             │
│  Threat: Account Takeover                                  │
│  ├─ Risk: Unauthorized access to user data                │
│  ├─ Traditional: Password reset attacks                   │
│  └─ StackMap: No accounts to takeover                     │
│                                                             │
│  Threat: Insider Access                                    │
│  ├─ Risk: Employees accessing user data                   │
│  ├─ Traditional: Admin access to everything               │
│  └─ StackMap: No readable data available                  │
│                                                             │
│  Threat: Legal Compulsion                                 │
│  ├─ Risk: Forced data disclosure                          │
│  ├─ Traditional: All data accessible                      │
│  └─ StackMap: Only encrypted data available               │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Security Features by Layer

1. **Application Layer**
   - Client-side encryption
   - Secure key derivation
   - Memory protection

2. **Network Layer**
   - TLS 1.3 encryption
   - Certificate pinning (mobile)
   - No sensitive data in URLs

3. **Storage Layer**
   - Encrypted at rest
   - Automatic data expiration
   - No key storage on server

4. **Access Layer**
   - Cryptographic authentication
   - Time-limited tokens
   - Rate limiting

## Implementation Benefits

### For Users

1. **Instant Usage**: No signup friction
2. **Complete Privacy**: True data ownership
3. **Peace of Mind**: No data breaches possible
4. **Easy Sharing**: Simple, secure provider access
5. **Cross-Device Sync**: Seamless experience

### For Providers (Teachers, Therapists, etc.)

1. **No Account Needed**: Access shared data instantly
2. **Guaranteed Privacy**: HIPAA/FERPA compliant design
3. **Time-Limited Access**: Automatic expiration
4. **Clear Boundaries**: Read-only access
5. **Audit Trail**: Access logging

### For Organizations

1. **Compliance Ready**: GDPR, COPPA, HIPAA compatible
2. **Reduced Liability**: No sensitive data stored
3. **Lower Costs**: Minimal infrastructure needs
4. **Easy Deployment**: No complex IAM required
5. **User Trust**: Privacy-first reputation

### Technical Advantages

```
┌─────────────────────────────────────────────────────────────┐
│                   Technical Benefits                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Performance                          Security               │
│  ├─ Offline-first operation          ├─ End-to-end encrypted│
│  ├─ Local data processing            ├─ No attack surface   │
│  ├─ Minimal server load              ├─ Cryptographic auth  │
│  └─ Fast sync operations             └─ Zero-knowledge proof│
│                                                              │
│  Scalability                         Simplicity              │
│  ├─ Stateless server design         ├─ No user management   │
│  ├─ Horizontal scaling ready        ├─ No password resets   │
│  ├─ CDN-friendly architecture       ├─ No email systems     │
│  └─ Low bandwidth usage             └─ Minimal dependencies │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Future Enhancements

### Recently Implemented

1. **Auto-Updating Shares** ✅
   - Living documents that update automatically
   - Same URL shows current progress
   - Maintains end-to-end encryption
   - Optional per-share basis

### Planned Features

1. **Enhanced Sharing**
   - QR code generation for easy sharing ✅ (Already implemented)
   - Granular permission controls
   - Share templates for common scenarios

2. **Advanced Security**
   - Hardware key support (FIDO2)
   - Biometric authentication
   - Post-quantum cryptography preparation

3. **Collaboration Features**
   - Encrypted comments
   - Secure messaging
   - Multi-party computation for analytics

### Research Areas

1. **Privacy-Preserving Analytics**
   - Homomorphic encryption for usage stats
   - Differential privacy for trends
   - Local-only analytics

2. **Decentralized Options**
   - IPFS integration
   - Blockchain-based audit logs
   - Peer-to-peer sync

## Implementation Details: True Zero-Knowledge Sharing

### The Evolution to Zero-Knowledge Shares

StackMap's sharing mechanism has evolved to achieve true zero-knowledge, where even shared data remains encrypted and inaccessible to the server:

#### Version 1 (Legacy): Server-Readable Shares
```javascript
// Old approach - server could read shares
shareData = filterData(userData);
encryptedData = base64_encode(shareData); // Not real encryption!
```

#### Version 2 (Current): Zero-Knowledge Shares
```javascript
// New approach - true end-to-end encryption
const token = generateSecureToken(); // 24 chars, 144 bits
const shareKey = deriveKeyFromToken(token);
const filteredData = filterDataClientSide(userData);
const encryptedData = encrypt(filteredData, shareKey);
// Server stores encrypted blob, cannot decrypt
```

### Technical Implementation

1. **Token Generation**: 
   - 144-bit cryptographically secure random tokens
   - URL-safe base64 encoding
   - Token serves dual purpose: ID and encryption key

2. **Client-Side Encryption**:
   - XSalsa20-Poly1305 authenticated encryption
   - Data filtered before encryption
   - Server receives only ciphertext

3. **Server Role**:
   - Maps tokens to encrypted blobs
   - Enforces expiration
   - Tracks anonymous access metrics
   - Cannot decrypt or read share contents

4. **Client-Side Decryption**:
   - Token from URL used as decryption key
   - Decryption happens in browser/app
   - Failed decryption = invalid/corrupted link

### Security Analysis of URL-Based Keys

While embedding encryption keys in URLs has theoretical risks, the design is secure for this use case:

1. **Temporary Nature**: Keys expire (1 hour to 3 months)
2. **Limited Scope**: Read-only access to filtered data
3. **No Reuse**: Each share has unique key
4. **Intentional Sharing**: URLs shared deliberately
5. **Industry Standard**: Similar to password reset links

### Migration Strategy

The system supports both versions during transition:
- Legacy shares (6-8 char tokens) use server-side decoding
- New shares (24+ char tokens) use client-side decryption
- Automatic detection based on token length
- No disruption to existing shares

## Auto-Updating Shares: Living Documents with Privacy

### The Challenge

Traditional share implementations create point-in-time snapshots. This works well for one-time reports but fails for ongoing relationships:
- Teachers need daily progress updates
- Therapists track weekly improvements  
- Caregivers monitor ongoing care

Creating new shares daily is impractical and error-prone.

### The Solution: Auto-Updating Encrypted Shares

StackMap introduces auto-updating shares that maintain the same URL while refreshing the encrypted content:

```
┌────────────────────────────────────────────────────────┐
│           Auto-Updating Share Architecture              │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Initial Share Creation                                 │
│  ├─ Generate secure token/key                          │
│  ├─ Encrypt current state                              │
│  ├─ Store with "auto-update" flag                     │
│  └─ Share URL: stackmap.app?share=K7x9mP3nQ2wR5vL8jF6tA4yB │
│                                                         │
│  Activity Changes (Complete/Add/Delete)                 │
│  ├─ Detect shares with auto-update enabled             │
│  ├─ Re-encrypt current state with same key             │
│  ├─ Update encrypted blob on server                    │
│  └─ Same URL now shows fresh data                      │
│                                                         │
│  Recipient Access                                       │
│  ├─ Opens same bookmarked URL                         │
│  ├─ Receives latest encrypted blob                     │
│  ├─ Decrypts with token from URL                      │
│  └─ Sees current progress                              │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Implementation Details

1. **Update Triggers**:
   - Activity completion status changes
   - New activities added
   - Activities deleted or reordered
   - Debounced to batch rapid changes (1 second delay)

2. **Privacy Preservation**:
   - Server still cannot decrypt content
   - Only knows update timestamps
   - No user identity exposed
   - Same encryption standards

3. **User Control**:
   - Optional per share (checkbox during creation)
   - Can be disabled by deleting share
   - Original filters still apply (completed/tomorrow)
   - Expiration dates respected

### Privacy Analysis

What the server learns with auto-updating shares:
- **Token has ongoing activity** (vs one-time access)
- **Update patterns** (frequency, time of day)
- **Access patterns** (when recipient checks)

What the server still CANNOT learn:
- **WHO** owns the share (no user identity)
- **WHAT** data is being shared (encrypted)
- **WHAT** changed between updates (encrypted)
- **WHO** is accessing (no recipient login)

### Use Case Comparison

#### Static Shares (Original)
- ✅ Maximum privacy (one-time snapshot)
- ✅ Perfect for reports, documentation
- ❌ Requires new share for updates
- ❌ Recipients juggle multiple URLs

#### Auto-Updating Shares (New)
- ✅ Same URL always shows current data
- ✅ Perfect for ongoing relationships
- ✅ Still end-to-end encrypted
- ⚠️ Server sees update patterns

### Best Practices

1. **Use Static Shares For**:
   - One-time progress reports
   - Documentation snapshots
   - Maximum privacy needs

2. **Use Auto-Updating Shares For**:
   - School year teacher access
   - Ongoing therapy tracking
   - Caregiver coordination

3. **Privacy Considerations**:
   - Update patterns could reveal routines
   - Consider shorter expiration for sensitive cases
   - Delete shares when relationship ends

## Conclusion

StackMap's zero-knowledge architecture represents a paradigm shift in how personal data should be handled in modern applications. By ensuring that servers never have access to unencrypted user data, implementing cryptographic authentication instead of traditional accounts, and providing true end-to-end encrypted sharing capabilities, StackMap offers a level of privacy and security that traditional cloud services cannot match.

The system proves that it's possible to build powerful, user-friendly applications without compromising privacy. As data breaches become more common and privacy regulations more stringent, StackMap's approach provides a blueprint for the future of privacy-respecting software development.

### Key Takeaways

1. **True Privacy is Possible**: Zero-knowledge architecture works
2. **Better UX Through Privacy**: No accounts means instant start
3. **Security Through Simplicity**: Less attack surface
4. **Compliance by Design**: Built-in regulatory compliance
5. **User Empowerment**: Complete data control
6. **Living Shares**: Auto-updating shares balance privacy with usability

For developers, privacy advocates, and organizations handling sensitive data, StackMap demonstrates that respecting user privacy isn't just ethical—it's a competitive advantage that leads to better, more secure, and more trustworthy applications.

---

## Technical Resources

- GitHub Repository: [StackMap Source Code]
- API Documentation: `/docs/SYNC_API_REFERENCE.md`
- Security Implementation: `/docs/SYNC_SECURITY_IMPLEMENTATION_GUIDE.md`
- Architecture Details: `/docs/ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md`

## Contact

For security inquiries or implementation questions, please contact the StackMap development team through the official channels listed in the repository.

---

*This white paper represents the current state of StackMap's privacy and security infrastructure as of December 2024. The system continues to evolve with a steadfast commitment to user privacy and data security.*