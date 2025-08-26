# Pending Changes

## Title: Fix V2 sync service Promise compatibility

### Changes Made:
- Fixed requestSync() to return a Promise (was returning undefined)
- Prevents "Cannot read property 'catch' of undefined" errors
- Maintains backward compatibility with hooks expecting Promise returns

