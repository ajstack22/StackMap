# Google Drive Sync Notification Fix

## Changes Made

### 1. **Increased Debounce Time** (app/StackMapApp.js)
- Changed debounce time from 5 seconds to 30 seconds
- Added silent flag to auto-sync calls
- Prevents frequent sync notifications during active use

### 2. **Added Silent Mode Support** (drive-sync.js)
- Updated `autoSync()` to accept a `silent` parameter
- Updated `uploadData()` to accept a `silent` parameter
- Modified notification methods to check silent flag before showing messages

### 3. **Reduced Remote Check Frequency** (drive-sync.js)
- Changed remote change check interval from 10 seconds to 30 seconds
- Removed toast notification from `handleRemoteUpdate()`
- Now only logs to console for debugging

### 4. **Silent Background Syncs** (app/StackMapApp.js)
- Updated `setupAutoSyncInterval()` to pass `silent=true` flag
- Background syncs now happen without notifications

### 5. **Manual Sync Notifications Preserved**
- Manual sync button still shows progress/success/error notifications
- User-initiated syncs provide feedback as expected

## Summary

The sync system now works as follows:

**Silent Operations:**
- Auto-sync after changes (30-second debounce)
- Periodic background sync (every 5 minutes)
- Remote change detection (every 30 seconds)
- Automatic remote updates applied silently

**With Notifications:**
- Manual "Sync Now" button clicks
- Sign-in/sign-out operations
- Sync errors that require user attention
- Conflict resolution dialogs

This provides a much less intrusive sync experience while still keeping users informed of important sync events.