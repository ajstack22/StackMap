# Pending Changes

## Title: Fix Activity Completion Reverting Due to Sync Protection

### Changes Made:
1. **Added skipProtection parameter to restoreData()** - Allows bypassing the 3-second recent changes check when we've already done proper timestamp-based conflict resolution
2. **Updated conflict resolution calls** - Pass `skipProtection: true` when applying conflict-resolved data that has already been validated via field-level timestamps
3. **Updated incremental sync calls** - Skip protection for incremental updates since they contain pre-validated, timestamp-checked changes
4. **Updated merge operations** - Skip protection during deliberate merge operations where we're combining local and remote state

### Problem Fixed:
- Activities were reverting after being checked because the 3-second protection in `restoreData()` was blocking properly conflict-resolved data
- The conflict resolver correctly compared `completedAt` timestamps on each activity but the protection check prevented applying the correct result
- With 15-second sync debounce, changes were always older than 3 seconds when sync happened, causing valid merges to be rejected

### How It Works Now:
- When conflicts are resolved using field-level timestamps (completedAt/uncompletedAt), we trust that resolution
- The skipProtection flag bypasses the redundant time check for already-validated data
- Direct restores without conflict resolution keep the 3-second protection
- Your activity completion states will be preserved based on actual timestamps, not arbitrary time windows

