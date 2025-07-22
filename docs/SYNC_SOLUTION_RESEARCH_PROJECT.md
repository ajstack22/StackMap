# StackMap Cross-Device Sync Solution Research Project

## Project Overview
StackMap is a visual task management app built with React Native that currently runs on iOS, Android, and Web platforms. We need to implement a cross-device synchronization solution that allows users to sync their data across all their devices without requiring account creation.

## Current Technical Context

### Data Structure
StackMap stores user data in the following JSON structure:
```json
{
  "version": 3,
  "currentDay": "today",
  "users": {
    "userId": {
      "name": "User Name",
      "icon": "🙂",
      "days": {
        "today": {
          "activities": [
            {
              "id": "unique-id",
              "text": "Activity text",
              "completed": false,
              "icon": "📝",
              "category": "work",
              "isPinned": false
            }
          ]
        },
        "tomorrow": { "activities": [...] }
      },
      "settings": {
        "theme": "indigo",
        "celebration": "confetti",
        "displayMode": "numbers"
      }
    }
  },
  "globalSettings": {
    "currentTheme": "indigo",
    "bannerPosition": "top",
    "defaultView": "normal",
    "displayMode": "numbers",
    "enableDayManagement": true,
    "pinEnabled": false
  },
  "templates": [],
  "exportDate": "2024-12-28T10:30:00.000Z"
}
```

### Current Import/Export Implementation
- **Export**: Creates a JSON file with timestamp (e.g., `stackmap-export-2024-12-28-10-30-00.json`)
- **Storage**: 
  - iOS/Android: Uses AsyncStorage (React Native)
  - Web: Uses localStorage
- **File Handling**:
  - Android: Saves to Downloads folder using react-native-fs
  - iOS: Uses share sheet
  - Web: Downloads via browser
- **Security**: Currently has PIN protection for app access (using react-native-keychain)

### Tech Stack
- React Native 0.76.6
- State Management: Zustand with persistence
- Storage: AsyncStorage (mobile), localStorage (web)
- Current dependencies that might be relevant:
  - react-native-keychain (for secure storage)
  - @react-native-async-storage/async-storage
  - react-native-fs (file system access)

### Hosting Environment
- **Provider**: Namecheap with cPanel
- **Current Deployment**: Static web app at https://stackmap.app
- **Available Technologies**:
  - PHP 7.x/8.x
  - MySQL databases
  - Node.js (limited - check version availability)
  - .htaccess for routing
  - SSL/HTTPS enabled
  - File storage (with size limits)
  - Cron jobs
  - Email services

## Business Requirements

### Must Have
1. **No Account Creation Required**
   - Users should be able to sync without email/password
   - Should work with anonymous identifiers
   - No personal data collection

2. **End-to-End Encryption**
   - Data must be encrypted client-side before transmission
   - StackMap hosting should have zero knowledge of content
   - Encryption keys should never leave the user's devices

3. **Cross-Platform Sync**
   - Seamless sync between iOS, Android, and Web
   - Handle offline scenarios gracefully
   - Conflict resolution for simultaneous edits

4. **Data Privacy**
   - No readable data on servers
   - Comply with privacy regulations (GDPR, etc.)
   - User can delete all data at any time

### Nice to Have
1. **Sharing Capabilities**
   - Share read-only views with teachers/parents
   - Temporary sharing links
   - Granular sharing (specific users or days)

2. **Backup Features**
   - Automatic backups
   - Version history
   - Recovery options

## Research Objectives

### 1. Sync Architecture Options
Research and compare different approaches:

**A. Sync Token/Code Based Systems**
- User generates a unique sync code on first device
- Other devices use this code to join sync group
- Examples: Firefox Sync, Obsidian Sync
- Evaluate: Security, UX, implementation complexity

**B. QR Code Pairing**
- Display QR code on one device
- Scan with other devices to establish sync
- Evaluate: Cross-platform QR scanning capabilities

**C. URL-Based Sync**
- Generate unique sync URL with embedded keys
- Share URL to other devices
- Evaluate: Security implications, URL length limits

**D. WebRTC/P2P Options**
- Direct device-to-device sync when on same network
- Fallback to server relay when remote
- Evaluate: Complexity, reliability, battery impact

### 2. Encryption Solutions
Research client-side encryption libraries that work across all platforms:

**Requirements:**
- Works in React Native (iOS/Android) and browser
- Strong encryption (AES-256 or similar)
- Key derivation from user-friendly codes
- Small library size

**Options to evaluate:**
- Stanford JavaScript Crypto Library (SJCL)
- TweetNaCl.js
- Crypto-JS
- Native crypto APIs (Web Crypto API, React Native crypto)
- End-to-end encryption protocols (Signal Protocol adaptations)

### 3. Storage Backend Options (Given Namecheap/cPanel constraints)

**A. PHP + MySQL Solution**
- REST API in PHP
- Encrypted blob storage in MySQL
- Evaluate: Performance, scalability, implementation effort

**B. File-Based Storage**
- PHP API with file system storage
- JSON files for each sync group
- Evaluate: Concurrent access, file locking, performance

**C. Third-Party Services (Compatibility with current hosting)**
- Services with JavaScript SDKs that work from browser
- Free tier considerations
- Examples: Firebase, Supabase, PocketBase
- Evaluate: Can these work alongside Namecheap hosting?

**D. Hybrid Approach**
- Use Namecheap for web hosting
- External service for sync only
- Evaluate: Cost, complexity, user experience

### 4. Conflict Resolution Strategies
Research approaches for handling sync conflicts:

**Options:**
- Last-write-wins
- Three-way merge
- Operational Transformation (OT)
- Conflict-free Replicated Data Types (CRDTs)
- Manual conflict resolution UI

**Considerations:**
- StackMap's data structure (activities, completion states)
- User expectations
- Implementation complexity

### 5. Security & Privacy Analysis

**Research needed:**
- Key management strategies without accounts
- Secure key exchange between devices
- Password/passphrase requirements vs usability
- Data retention policies
- GDPR compliance for anonymous users
- Security audit considerations

### 6. Implementation Considerations

**Performance:**
- Sync frequency strategies
- Delta sync vs full sync
- Bandwidth optimization
- Battery usage on mobile

**Offline Support:**
- Queue changes when offline
- Sync on reconnection
- Handle long offline periods

**Migration:**
- Upgrade path for existing users
- Backward compatibility
- Data migration strategy

## Deliverables

Please provide:

1. **Recommended Architecture**
   - Detailed sync flow diagram
   - Technology stack recommendation
   - Security architecture

2. **Implementation Plan**
   - Phased approach
   - Time estimates
   - Risk assessment

3. **Proof of Concept**
   - Sample code for key components
   - Encryption/decryption examples
   - Basic sync protocol

4. **Cost Analysis**
   - Infrastructure costs
   - Third-party service costs (if any)
   - Scaling considerations

5. **Alternative Solutions**
   - At least 2-3 different approaches
   - Pros/cons comparison
   - Decision matrix

## Constraints & Considerations

1. **Technical Constraints**
   - Must work within Namecheap/cPanel limitations
   - React Native compatibility required
   - Minimal external dependencies preferred
   - Solution should work with existing codebase

2. **User Experience**
   - Setup should take < 2 minutes
   - No technical knowledge required
   - Clear error messages
   - Intuitive UI/UX

3. **Scalability**
   - Handle 10,000+ users initially
   - Plan for 100,000+ users
   - Consider storage costs
   - Performance at scale

4. **Maintenance**
   - Minimal server maintenance
   - Easy troubleshooting
   - Monitoring capabilities
   - Backup strategies

## Questions to Answer

1. What's the simplest secure sync solution that meets all requirements?
2. How do we handle device limits (e.g., max 5 devices per sync group)?
3. What happens when a user loses their sync code/key?
4. How do we prevent abuse while maintaining anonymity?
5. What's the best way to implement sharing features later?
6. How do we handle data migration if we change the sync protocol?
7. What metrics should we track while respecting privacy?
8. How do we implement this incrementally without breaking existing functionality?

## Additional Resources

- Current codebase structure: React Native + Web
- Existing state management: Zustand
- Current data persistence: AsyncStorage/localStorage
- File handling: react-native-fs
- Security: react-native-keychain

Please research these options thoroughly and provide recommendations that balance security, usability, and implementation complexity within our technical constraints.