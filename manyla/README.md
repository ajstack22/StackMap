# StackMap Complete Sync Implementation

This folder contains everything needed to replicate StackMap's zero-knowledge sync functionality, including both client-side (React Native) and server-side (PHP) implementations.

## Overview

StackMap's sync feature provides:
- **Zero-knowledge encryption** - Server never sees unencrypted data
- **No user accounts** - Authentication via recovery phrases only
- **Cross-device sync** - Works on iOS, Android, and Web
- **Offline support** - Queue syncs when offline
- **Automatic conflict resolution** - Smart merging of changes
- **Privacy-first** - 6-month automatic data deletion

## Directory Structure

```
manyla/
├── README.md                    # This file
├── server/                      # Server-side PHP implementation
│   ├── api/                    # PHP API endpoints
│   ├── database/               # MySQL database schema
│   └── docs/                   # Server documentation
├── client/                      # Client-side React Native implementation
│   ├── services/sync/          # Sync service modules
│   ├── components/             # UI components
│   ├── hooks/                  # React hooks
│   └── docs/                   # Client documentation
└── tests/                      # Test suites for both client and server
```

## Quick Start

### 1. Server Setup
1. Set up MySQL database using `server/database/setup.sql`
2. Configure PHP API with `server/api/config/config.example.php`
3. Upload API files to your web server
4. Test with `tests/server/test-api.php`

### 2. Client Setup
1. Install dependencies: `npm install tweetnacl tweetnacl-util pbkdf2 pako`
2. Copy all files from `client/services/sync/` to your project
3. Copy UI components from `client/components/`
4. Initialize sync service in your app
5. Test with `tests/client/test-sync.js`

### 3. Integration
1. Update your app's state management to use sync hooks
2. Add sync UI components to your settings
3. Configure API endpoint in sync service
4. Test end-to-end sync functionality

## Key Features

### Security
- End-to-end encryption using TweetNaCl.js
- PBKDF2 key derivation (100,000 iterations)
- Recovery phrase authentication (12 words, 128-bit entropy)
- No metadata exposure to server

### Performance
- Incremental sync (only send changes)
- Data compression before encryption
- Sync throttling and debouncing
- Offline queue with retry logic

### Reliability
- Automatic conflict detection and resolution
- Network monitoring and error handling
- Exponential backoff for retries
- Sync history tracking

### User Experience
- Automatic background sync every 30 seconds
- Visual sync status indicators
- Conflict resolution UI
- One-tap sync setup

## Architecture

### Client-Side
- **syncService.js** - Main orchestration and coordination
- **encryptionService.js** - Handles all cryptographic operations
- **changeTracker.js** - Tracks local state changes
- **conflictResolver.js** - Resolves sync conflicts
- **syncQueue.js** - Manages offline sync queue
- **networkMonitor.js** - Monitors network connectivity
- **syncThrottle.js** - Prevents excessive sync requests
- **syncHistory.js** - Maintains sync audit trail

### Server-Side
- **create.php** - Creates new sync group
- **push.php** - Receives encrypted updates
- **pull.php** - Sends latest encrypted data
- **delete.php** - Deletes all sync data
- **health.php** - API health check
- **cleanup.php** - Removes old data (6+ months)

## Implementation Timeline

1. **Week 1**: Database setup and basic API
2. **Week 2**: Client encryption and sync service
3. **Week 3**: UI components and integration
4. **Week 4**: Testing and optimization

## Support

For detailed implementation instructions, see:
- Server setup: `server/docs/DEPLOYMENT.md`
- Client integration: `client/docs/INTEGRATION.md`
- API reference: `server/docs/API_REFERENCE.md`
- Security guide: `server/docs/SECURITY.md`

## Testing

Comprehensive test suites are provided:
- Server tests: `tests/server/test-api.php`
- Client tests: `tests/client/test-sync.js`
- Integration tests: `tests/integration/`

## License

This implementation follows StackMap's zero-knowledge architecture principles. Please ensure you maintain the privacy and security standards when deploying.