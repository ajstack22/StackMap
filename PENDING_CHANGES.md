# Pending Changes

## Title: Fix Card Reverting Issue (Complex Sync Overwriting Local Changes)

### Changes Made:

1. **Increased sync debounce delay** - Changed from 5 seconds to 30 seconds to give users more time to complete edits

2. **Added protection for recent local changes** - restoreData() now skips overwriting if local changes are within 3 seconds

3. **Restored complex sync service** - Switched back from simple sync (USE_SIMPLE_SYNC = false) as simple sync was incomplete

