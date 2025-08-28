# Pending Changes

## Title: Complete Field-Level Sync Implementation with CRDT Merger

### Changes Made:

#### 1. **Fixed Recovery Phrase Storage on Join**
- Added `encryptionService.storeRecoveryPhrase()` in join flow
- Fixed `initializeForImport()` to properly enable sync with all settings

#### 2. **Implemented CRDT Field-Level Merging**
- Replaced whole-state replacement with proper CRDT merger usage
- Now using `merger.mergeActivityArrays()` for activity merging
- Each field (completed, text, icon) resolved independently by timestamp

#### 3. **Fixed Timestamp Tracking**
- `getLatestLocalTimestamp()` now checks actual activity timestamps
- Returns max of modifiedAt, completedAt, uncompletedAt timestamps
- Allows remote changes to win when newer

#### 4. **Added Comprehensive Logging**
- Logs remote record processing with device IDs
- Shows activity completion states during merge
- Tracks merge results and applied changes

#### 5. **Fixed State Merge Logic**
- Handles undefined users objects properly
- Preserves currentUser and currentDay fields
- Merges all user activities with CRDT logic

### Testing Instructions:
1. Enable logging in browser console
2. Device A: Create activities
3. Device B: Complete activities 1 & 2
4. Device A: Complete activity 3
5. Watch console for merge operations
6. Verify completion states sync both ways

### Technical Notes:
- The CRDT merger was already implemented but not being called
- App.js properly sets completedAt/uncompletedAt timestamps
- Sync now uses those timestamps for conflict resolution
- Each activity field merges independently based on timestamps

### Debugging:
If completions still don't sync, check console for:
- `[SyncTS] Remote activity:` logs showing timestamps
- `[SyncTS] Merging activities:` showing counts
- `[SyncTS] Merge result:` showing completed counts
- `[ACTIVITY_MERGE]` logs from CRDT merger