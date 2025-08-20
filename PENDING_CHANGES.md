# Pending Changes

## Title: Enhanced Fix for Sync Race Condition

### Changes Made:

1. **Fixed Multi-Device Sync Race Condition** (`src/services/sync/syncService.js`)
   - Increased post-push protection window from 2s to 5s
   - Changed behavior: skip entire sync (no pull or push) if we just pushed
   - This prevents the pull-push-pull cycle that was causing overwrites
   
2. **Increased Debounce Time**
   - Changed from 10s to 15s after changes before syncing
   - Gives more time to batch changes and reduces conflict frequency
   
3. **Added Push Time Tracking**
   - Track `lastPushTime` to know when we last sent data
   - Use this to make smarter sync decisions
   
4. **Improved Conflict Resolution**
   - When we've pushed recently (within 30s), prefer local changes
   - Prevents other devices from overwriting recent local changes

### Root Cause Analysis:
The HAR file revealed that multiple devices were syncing simultaneously:
- Device A pushes version 354
- Device B pushes version 355 at nearly the same time
- Device A pulls and gets version 355, overwriting its own changes
- This creates a "ping-pong" effect where devices keep overwriting each other

### Solution:
- After pushing, skip syncing for 5 seconds
- This gives the push time to propagate and prevents immediate overwrites
- Longer debounce (15s) reduces sync frequency and conflicts
- Better conflict resolution when syncs do collide

### Testing:
1. Make a change (theme, settings, etc.)
2. Wait 15 seconds for auto-sync
3. Change should persist and not revert
4. Other devices will receive the change after their next sync