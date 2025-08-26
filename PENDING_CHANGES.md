# Pending Changes

## Title: Fix CRDT sync store import errors

### Changes Made:
- Fixed "Pull failed: 400" error by handling both 404 and 400 status codes as "sync doesn't exist"
- Fixed "Cannot read properties of undefined (reading 'getState')" by correcting store imports
- Updated pull() method to properly handle server responses when creating new sync
- Fixed getCurrentState() and applyState() to import stores from correct path
- All stores now imported from '../../stores' index file instead of individual files

