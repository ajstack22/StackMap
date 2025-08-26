# Pending Changes

## Title: Remove old sync services to prevent conflicts

### Changes Made:
- Removed imports of old syncService.js and simpleSyncService.js from index.js
- Fixed "Decryption failed" errors caused by old sync service running in parallel with V2
- Old sync service was auto-initializing and subscribing to store changes even when not in use
- V2 CRDT sync is now the only implementation running

