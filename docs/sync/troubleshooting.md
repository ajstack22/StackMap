# StackMap Sync Troubleshooting Guide

*Last Updated: August 2025*

## Overview

This comprehensive guide covers troubleshooting for StackMap's complex sync architecture (v2025.08.18+). The current sync system uses a sophisticated JavaScript service with last-write-wins conflict resolution and field-level merging.

**Current Architecture**: Complex JavaScript implementation with 9 supporting modules  
**Strategy**: Last-write-wins with intelligent conflict resolution  
**Note**: The simplified sync was reverted in August 2025 due to AsyncStorage issues

---

## 📁 Critical File Locations

### Main Sync Components
- `/src/services/sync/syncService.js` - Main orchestration (~2200 lines)
- `/src/services/sync/conflictResolver.js` - Conflict resolution logic
- `/src/services/sync/encryptionService.js` - Encryption/decryption
- `/src/services/sync/syncQueue.js` - Offline queue management
- `/src/services/sync/networkMonitor.js` - Network state monitoring
- `/src/services/sync/syncThrottle.js` - Rate limiting and throttling
- `/src/services/sync/dataValidator.js` - Data validation
- `/src/utils/dataNormalizer.js` - Field normalization

### Store Architecture
- `/src/stores/userStore.js` - Users and activities
- `/src/stores/libraryStore.js` - Templates and library
- `/src/stores/settingsStore.js` - Global settings
- `/src/stores/index.js` - App state (currentUser, currentDay)

---

## 🎯 Common Issues & Solutions

### Issue 1: Activities Not Syncing Between Devices

#### Symptoms
- Users sync correctly but activities show as empty
- Default welcome cards appear instead of synced activities
- Logs show "0 activities" on receiving device

#### Root Causes & Solutions

**A. Field Naming Mismatch** ⚠️ CRITICAL
- **Problem**: Activities using `name`/`title` instead of `text`, or `emoji` instead of `icon`
- **Solution**: Always use correct field names:
  ```javascript
  // CORRECT
  activity = { text: "Brush teeth", icon: "🦷", completed: false }
  
  // WRONG 
  activity = { name: "Brush teeth", emoji: "🦷", completed: false }
  ```
- **Check**: `/src/utils/dataNormalizer.js` handles field conversion
- **Verification**: Look for fallbacks like `activity.text || activity.name || activity.title`

**B. Store Update Method Issues**
- **Problem**: Using `useAppStore.setState()` instead of store-specific methods
- **Solution**: Use proper store methods:
  ```javascript
  // WRONG
  useAppStore.setState({ users });
  
  // CORRECT
  useUserStore.getState().setUsers(users);
  ```

**C. Validation/Repair Breaking Data**
- **Problem**: Data validator removes activities during sync
- **Solution**: Check validation rules in `/src/services/sync/dataValidator.js`
- **Debug**: Add logging before/after validation steps

---

### Issue 2: Sync Reversion (Changes Disappear)

#### Symptoms
- Make changes on device, but after sync old data reappears
- Client shows changes briefly, then reverts

#### Root Causes & Solutions

**A. Version Conflict (Most Common)**
- **Problem**: Server has newer version than client's changes
- **Debug**:
  ```javascript
  // Check version numbers in console
  syncService.lastSyncVersion  // Client version
  // Compare with server response in Network tab
  ```
- **Solution**: Check conflict resolution in `/src/services/sync/conflictResolver.js`

**B. Timing Issues During Sync**
- **Problem**: Changes made during active sync get lost
- **Solution**: Increase debounce delay or add sync locking
- **Key timings**:
  - Debounce: 5 seconds after change
  - Periodic sync: Every 30 seconds
  - Network retry: 2 second delay

**C. Store Update Race Conditions**
- **Problem**: Multiple state updates interfering
- **Solution**: Ensure atomic updates and proper store methods

---

### Issue 3: User Icons Missing During Sync

#### Symptoms
- Error: "User user-atlas missing icon or emoji"
- Icons present locally but missing after sync
- Icons disappear during conflict resolution

#### Root Cause & Solution
- **Problem**: Using wrong store update methods that don't preserve all fields
- **Solution**: Fixed in v2025.08.16.21:
  ```javascript
  // WRONG - doesn't update underlying stores properly
  useAppStore.setState({ users });
  
  // CORRECT - updates the specialized user store
  const userStore = require('../../stores/useUserStore.js').default;
  userStore.getState().setUsers(users);
  ```
- **Prevention**: Always use store-specific methods for updates

---

### Issue 4: Network Suspension After Computer Sleep

#### Symptoms
- `net::ERR_NETWORK_IO_SUSPENDED` errors in console
- `net::ERR_SOCKS_CONNECTION_FAILED` errors  
- Sync fails after computer wakes from sleep
- Need manual refresh to resume syncing

#### Solution (v2025.08.17)
Automatic retry with exponential backoff and wake detection:

```javascript
// Retry logic for network errors
if (error.message.includes('ERR_NETWORK_IO_SUSPENDED') || 
    error.message.includes('ERR_SOCKS_CONNECTION_FAILED')) {
  const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 8000);
  await new Promise(resolve => setTimeout(resolve, backoffDelay));
  return this.pullData(retryCount + 1);
}
```

**Wake Detection**:
- Tab visibility changes trigger network state reset
- Window focus events restart sync
- Automatic retry with delays: 1s, 2s, 4s (max 8s)

**Manual Recovery** (if automatic fails):
1. Wait 10-15 seconds after wake
2. Make small change to trigger sync
3. Refresh page if needed (Ctrl+R or Cmd+R)

---

### Issue 5: Initialization Issues

#### Symptoms
- Sync service constructor runs but methods not accessible
- `restoreState()` never called
- Periodic sync never starts
- Timer callbacks not firing

#### Debug Steps
```javascript
// Check sync state in console
localStorage.getItem('@sync_enabled')  // Should be 'true'
localStorage.getItem('@sync_id')       // Should be 32-char hex

// Check service state
syncService.syncEnabled    // Should be true
syncService.initialized    // Should be true
syncService.syncId         // Should have value

// Force manual initialization
syncService.restoreState();
```

#### Solutions
1. **Method Binding Issues**: Explicitly bind class methods
2. **Timer Problems**: Move initialization out of constructor
3. **Webpack Issues**: Check TypeScript transpilation

---

### Issue 6: Validation Failures and Infinite Loops

#### Symptoms
```
sync: State validation failed after incremental update
sync: Repair failed, state still invalid
Sync failed: Error: Data validation failed
Conflict resolution failed validation (infinite loop)
```

#### Root Causes & Solutions
- **Missing required fields** in synced data
- **Wrong field types** (string instead of boolean)
- **Conflict resolution errors** causing retry loops

**Solutions Applied (v2025.08.15)**:
- Added try-catch around conflict resolution
- Conflict resolver falls back to local state instead of throwing
- Better error logging for specific validation failures
- Skip validation for deleted users

---

### Issue 7: Target Icon (🎯) Appearing Incorrectly

#### Symptoms
- Correct icon shows initially
- Target icon appears when editing
- Icon reverts after save

#### Root Cause & Solution
- **Problem**: Components using `emoji` field instead of `icon`
- **Solution**: Always use `icon` field with proper fallback:
  ```javascript
  // Fixed in v2025.08.14.17
  setEditEmoji(activity.icon || activity.emoji || '');
  ```
- **Prevention**: Never hardcode target emoji as default

---

### Issue 8: 404 Errors on Sync API

#### Symptoms
```
GET https://stackmap.app/qual/api/sync/pull.php 404 (Not Found)
```

#### Root Cause & Solution
- **Problem**: API files not deployed to qual environment
- **Solution**: Ensure `/qual/api/sync/` directory contains all PHP files

---

## 🐛 Debugging Commands & Techniques

### Enable Verbose Logging
Add to `/src/services/sync/syncService.js`:
```javascript
console.log('[SYNC DEBUG] Before sync state:', this.getCurrentState());
console.log('[SYNC DEBUG] Version before:', this.lastSyncVersion);
// ... existing sync code ...
console.log('[SYNC DEBUG] After sync state:', this.getCurrentState());
console.log('[SYNC DEBUG] Version after:', this.lastSyncVersion);
```

### Monitor Network Requests
1. Open DevTools → Network tab
2. Filter by "sync"
3. Check:
   - `/push.php` requests and payload
   - `/pull.php` responses and version numbers
   - Any 409 Conflict responses

### Check Sync Status
```javascript
// In browser console
syncService.syncEnabled        // Should be true
syncService.syncId            // Should be 32-char hex
syncService.syncStatus        // Should be 'idle' or 'syncing'
syncService.syncError         // Check for errors
syncService.pendingConflicts  // Should be empty array
```

### Validate Data Structure
```javascript
// Check if data matches expected format
const state = syncService.getCurrentState();
console.log('Data structure valid?', 
  state.users && 
  state.library && 
  state.globalSettings &&
  Object.values(state.users).every(u => 
    u.days && u.days.today && u.icon && u.name
  )
);
```

### Force Fresh Pull
```javascript
// See what's on server
async function debugPull() {
  const data = await syncService.pullData();
  const decrypted = syncService.encryptionService.decryptData(data.encrypted_blob);
  console.log('Server data:', decrypted);
  console.log('Server version:', data.version);
  console.log('Local version:', syncService.lastSyncVersion);
}
debugPull();
```

### Track Activities Through Sync Flow
```javascript
// Add logging at each step:
// 1. After import: log full user object with activities
// 2. In getCurrentState: log activities being sent
// 3. After encryption: verify data size
// 4. After pull: log decrypted data
// 5. In restoreData: log activities before/after setState
// 6. In App.js useEffect: log activities from users object
```

---

## 🔧 Quick Fixes

### Activities Show Empty After Sync
```bash
# Check if normalization is applied
grep -n "normalizeSyncData" src/services/sync/syncService.js
```

### Find Components Using Wrong Field Names
```bash
# Find components using emoji field
grep -r "activity\.emoji" src/
# Update to use: activity.icon || activity.emoji

# Find components using name/title
grep -r "activity\.name\|activity\.title" src/
# Update to use: activity.text || activity.name || activity.title
```

### Force Local Data to Server
```javascript
// Force push local state
async function forcePush() {
  syncService.lastSyncVersion = 0;  // Reset version
  await syncService.syncWithQueue();
}
forcePush();
```

### Reset Sync Completely
```javascript
// Clear sync and start fresh
async function resetSync() {
  await syncService.disable();
  // Make changes
  await syncService.enable();  // Creates new sync with current data
}
resetSync();
```

---

## 🧪 Testing Sync Functionality

### Manual Test Procedure
1. **Setup Device A**:
   - Clear all data
   - Import `data/demo-data-kids.json`
   - Enable sync, copy recovery phrase

2. **Setup Device B**:
   - Clear all data
   - Join sync with recovery phrase
   - Wait for sync completion

3. **Verify**:
   - [ ] All users appear with correct names/icons
   - [ ] Each user has their activities
   - [ ] Icons display correctly everywhere
   - [ ] Edit mode shows correct icons
   - [ ] Changes sync bidirectionally

### Automated Checks
```javascript
// Check sync status
const sync = syncService;
console.log('Sync enabled:', sync.syncEnabled);
console.log('Sync ID:', sync.syncId);
console.log('Last success:', new Date(sync.lastSyncSuccess));

// Check data structure
const state = useAppStore.getState();
Object.entries(state.users).forEach(([id, user]) => {
  const activities = user.days?.today?.activities || [];
  console.log(`User ${user.name}: ${activities.length} activities`);
  activities.forEach(a => {
    if (!a.text) console.warn('Missing text field:', a);
    if (!a.icon && !a.emoji) console.warn('Missing icon:', a);
  });
});
```

---

## 🚨 Emergency Recovery

### If Sync is Completely Broken
1. **Export data from working device**:
   - Settings → Data → Export
   - Save the JSON file

2. **Reset sync on all devices**:
   - Settings → Sync → Delete Sync
   - Clear app data if needed

3. **Import data on primary device**:
   - Settings → Data → Import
   - Select saved JSON file

4. **Re-enable sync**:
   - Create new sync group
   - Share new recovery phrase

---

## 🏗️ Architecture Context

### Current Sync Flow (Complex v2025.08.18+)
```
Data Change
    ↓
Debounce (5 seconds)
    ↓
getCurrentState() [gathers from all stores]
    ↓
Encrypt with TweetNaCl [~4KB]
    ↓
Push to Server with version check
    ↓
Other Device Periodic Pull (30s)
    ↓
Decrypt Data
    ↓
Conflict Resolution [field-level merging]
    ↓
Data Validation & Repair
    ↓
restoreData() [updates all stores properly]
```

### Key Functions
- `getCurrentState()` - Gathers data from all stores
- `conflictResolver.detectConflicts()` - Field-level conflict detection
- `conflictResolver.resolveConflicts()` - Smart merging with user preferences
- `restoreData()` - Updates stores using proper methods
- `syncQueue.enqueue()` - Handles offline changes

### Why Complex Architecture Was Restored
- **Simple sync issues**: AsyncStorage performance problems on iOS
- **Conflict resolution**: Users needed better merge capabilities  
- **Offline support**: Queue system for reliable offline-to-online sync
- **Field-level sync**: Preserve individual field changes vs full replacement

---

## 📚 Related Documentation

- [Sync API Reference](./SYNC_API_REFERENCE.md) - Complete technical details
- [Security Architecture](./security-architecture.md) - Encryption and privacy
- [Field Conventions](../../prompts/field-conventions.md) - Required field names
- [Store Architecture](../STORE_ARCHITECTURE.md) - Store update methods

---

## 💡 Remember

- **Current users are neurodivergent**: Reliability is critical for daily routines
- **Zero-knowledge encryption**: Must be maintained at all costs
- **Cross-platform compatibility**: Changes must work on iOS, Android, and Web
- **Minimal fixes**: Focus on specific issues, avoid large refactors
- **Field naming**: Always use `text` and `icon` for activities, `name` and `icon` for users
- **Store methods**: Always use store-specific update methods, never direct `setState`