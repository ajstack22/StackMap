# Phase 1-2 Testing Guide: Bidirectional Sync with Store Integration

## Quick Start Testing

### 1. Deploy to QUAL First
```bash
./scripts/qual_deploy.sh
```

### 2. Open Two Browser Tabs
- **Tab A**: https://stackmap.app/qual/
- **Tab B**: https://stackmap.app/qual/ (incognito/private window recommended)

### 3. Access Sync Test Modal
1. Click the settings/menu icon
2. Find and click "Sync Test" or dev options
3. You should see the **Sync Store Integration Test** interface

---

## Test Scenario 1: Basic Sync Creation & Join

### Tab A (Creator)
1. Click **"Create New Sync"**
2. You'll see test data added:
   - 2 test users
   - 3 test activities in library
3. Copy the Sync ID shown in the alert

### Tab B (Joiner)
1. Paste the Sync ID in the input field
2. Click **"Join Existing Sync"**
3. You should see:
   - ✅ Same users and library items as Tab A
   - ⏰ "Protection Period: 60s remaining" warning
   - Data persists if you refresh the page

### Expected Results
- Tab B receives all data immediately
- Data survives page refresh
- 60-second protection period is active

---

## Test Scenario 2: Bidirectional Sync (After Protection Period)

### Wait 60 Seconds First!
The protection period prevents new devices from pushing immediately. Watch the countdown in the status section.

### Tab B (After 60 seconds)
1. Click **"Add User"**
2. Watch the logs - you'll see:
   - "Change detected. Will push after 5 second debounce"
   - After 5 seconds: Push happens automatically
3. Click **"Add Library Item"** 
   - Same auto-sync behavior

### Tab A (Within 30 seconds)
- New users/items appear automatically (periodic pull)
- Or click **"Manual Push"** to force immediate sync

### Expected Results
- Changes propagate both directions
- Auto-sync on changes (5s debounce)
- Periodic pull every 30 seconds

---

## Test Scenario 3: Persistence & Recovery

### Test Refresh Persistence
1. Make changes on either device
2. Wait for sync to complete (check logs)
3. Refresh the page (Cmd+R or F5)
4. ✅ All data should still be there

### Test Backup Recovery
1. Make changes
2. Immediately refresh (before 1 second debounce)
3. The backup system should restore your data

---

## What to Look For

### ✅ Success Indicators
- "✅ Sync created! ID: xxx" in logs
- "✅ Joined sync successfully!" message
- "📥 New data received" during periodic pulls
- "✅ State pushed successfully" after changes
- Data persists after refresh
- Users show with icons (👤, 👥, etc.)
- Activities show with proper text and icons

### ⚠️ Common Issues & Solutions

**Issue**: "429 Too Many Requests" error
- **Normal**: This is the 60-second protection period
- **Solution**: Wait for countdown to finish

**Issue**: Changes not syncing
- **Check**: Protection period expired?
- **Check**: Look for "State pushed successfully" in logs
- **Solution**: Try "Manual Push" button

**Issue**: Data lost on refresh
- **Check**: Did you see "✅ All stores flushed" in logs?
- **Check**: Is there a backup ("Found backup from...")
- **Solution**: The integration should handle this automatically

**Issue**: Empty stores after joining
- **Check**: Console for errors
- **Solution**: Clear all data and try again

---

## Console Debugging

Open browser console (F12) and look for these prefixes:

```javascript
[MinimalSync]     // Core sync operations
[SyncStore]       // Store integration layer
[SyncStoreTest]   // Test component logs
```

### Key Messages to Watch
```
[MinimalSync] 🔄 Periodic pull triggered
[MinimalSync] 📨 New data received
[SyncStore] 📤 Pushing current state
[SyncStore] ✅ State applied and persisted
[SyncStore] 💾 Flushing stores to storage
```

---

## Advanced Testing

### Test Concurrent Edits
1. **Tab A**: Add a user
2. **Tab B**: Add a different user (within 5 seconds)
3. Both changes should appear on both devices

### Test Offline Recovery
1. Disconnect network (airplane mode)
2. Make changes
3. Reconnect
4. Changes should sync automatically

### Test Large Data Sets
1. Add 10+ users
2. Add 20+ library items
3. Everything should sync within reasonable time

---

## Cleanup Between Tests

To start fresh:
1. Click **"Clear All Data"** button
2. Confirm the alert
3. Both devices should reset
4. You can create a new sync

---

## What's Working in Phase 1-2

✅ **Phase 1 Features**
- Bidirectional data exchange
- 60-second protection period
- Periodic pull (30 seconds)
- Auto-retry after protection period
- Persistence across refreshes

✅ **Phase 2 Features**
- Full Zustand store integration
- Automatic sync on store changes (5s debounce)
- Data normalization (text/icon fields)
- Backup/restore mechanism
- Proper store update methods

❌ **Not Yet Implemented**
- Encryption (Phase 3)
- Advanced conflict resolution (Phase 4)
- Offline queue (Phase 5)
- Performance optimizations (Phase 5)

---

## Quick Troubleshooting Checklist

If sync isn't working:

1. ✓ Are you testing in QUAL environment?
2. ✓ Did you wait 60 seconds after joining?
3. ✓ Do you see the Sync ID in the status section?
4. ✓ Are there any red error messages in logs?
5. ✓ Check browser console for detailed errors
6. ✓ Try "Clear All Data" and start fresh

---

## Expected User Experience

When this replaces the current sync:

1. User creates sync on Device A
2. User joins on Device B with recovery phrase
3. Data appears immediately on Device B
4. After 60 seconds, Device B can make changes
5. All changes sync automatically
6. Data persists through app restarts
7. No data loss scenarios

The 60-second protection period is intentional - it prevents sync conflicts when a device first joins and needs to receive the current state.