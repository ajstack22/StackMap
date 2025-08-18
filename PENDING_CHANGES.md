# Pending Changes

## Title: Debug AsyncStorage Promise Resolution Issue

### Changes Made:

#### 1. Added setTimeout to AsyncStorage.web getItem
**Problem:** Even with explicit Promise returns, AsyncStorage.web getItem was not resolving properly, causing sync initialization to hang.

**Solution:** Wrapped the Promise resolution in setTimeout with 0 delay to ensure truly async behavior and prevent potential synchronous execution issues.

**Files Modified:**
- src/utils/AsyncStorage.web.js (lines 4-20): Added setTimeout wrapper and debug logging

**Technical Details:**
- Added `setTimeout(() => { ... resolve(value) }, 0)` to force async execution
- Added debug log: `[AsyncStorage.web] Resolving promise for ${key}`
- This ensures the Promise resolution happens in the next tick of the event loop

**Expected Output:** Should now see "Resolving promise for @sync_enabled" followed by the sync service receiving the value.