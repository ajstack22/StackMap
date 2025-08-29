# Phase 1: Minimal Sync Test Instructions

## What We're Testing
A brand new, extremely simple sync service that just proves data can be exchanged between two browser tabs and **persists after refresh**.

## Setup

### 1. Start Two Instances of the App
```bash
# Terminal 1
npm run web
# Opens on http://localhost:3000

# Terminal 2  
PORT=3001 npm run web
# Opens on http://localhost:3001
```

### 2. Open Browser Console on Both Tabs
- Chrome: Cmd+Option+J
- Safari: Cmd+Option+C
- Firefox: Cmd+Option+K

## Test Sequence

### Step 1: Create Sync (Tab A - Port 3000)

Open console and run:
```javascript
// Import the minimal sync service
const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;

// Create test data
const testData = {
  activities: ['Activity 1', 'Activity 2', 'Activity 3'],
  timestamp: Date.now(),
  source: 'Tab A'
};

// Create sync
const result = await minimalSync.createSync(testData);
console.log('Sync ID:', result.syncId);
```

**Expected Output:**
```
[MinimalSync] 📤 createSync called with: {activities: Array(3), ...}
[MinimalSync] 💾 Storing locally first...
[MinimalSync] ✅ Local storage verified: SUCCESS
[MinimalSync] 🌐 Sending to server...
[MinimalSync] 📡 Server response: {success: true, ...}
[MinimalSync] ✅ Sync created successfully!
Sync ID: [32-character-hex-string]
```

**Copy the Sync ID!**

### Step 2: Join Sync (Tab B - Port 3001)

Open console and run:
```javascript
// Import the service
const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;

// Join with the sync ID from Tab A
const result = await minimalSync.joinSync('paste-sync-id-here');
console.log('Received:', result.data);
```

**Expected Output:**
```
[MinimalSync] 📥 joinSync called with: [sync-id]
[MinimalSync] 🌐 Fetching from server...
[MinimalSync] 📡 Server response: {success: true, latest_record: {...}}
[MinimalSync] 📦 Decoded data: {activities: Array(3), ...}
[MinimalSync] 💾 Storing to AsyncStorage...
[MinimalSync] ✅ Storage verification: {stored: true, syncIdMatches: true, hasData: true}
Received: {activities: Array(3), timestamp: ..., source: "Tab A"}
```

### Step 3: THE CRITICAL TEST - Refresh Tab B

1. **Refresh Tab B** (Cmd+R or F5)
2. After page reloads, open console and run:

```javascript
// Import the service again
const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;

// Check if data persisted
const currentData = await minimalSync.getCurrentData();
console.log('Persisted?', currentData ? 'YES ✅' : 'NO ❌');
console.log('Data:', currentData);
```

**Expected Output:**
```
[MinimalSync] 📖 getCurrentData called
[MinimalSync] 📦 Found stored data: {syncId: "...", timestamp: ..., data: {...}}
Persisted? YES ✅
Data: {syncId: "...", timestamp: ..., data: {activities: Array(3), ...}}
```

## Success Criteria

✅ **PASS** if after refresh:
- `currentData` is not null
- Activities array has 3 items
- Data matches what was sent from Tab A

❌ **FAIL** if after refresh:
- `currentData` is null
- Activities are missing
- Console shows "No stored data found"

## Additional Tests

### Test 4: Add Activity and Push (Either Tab)
```javascript
const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;

// Add a new activity
const currentData = await minimalSync.getCurrentData();
const updatedData = {
  ...currentData.data,
  activities: [...currentData.data.activities, 'New Activity 4'],
  timestamp: Date.now()
};

await minimalSync.pushData(updatedData);
```

### Test 5: Pull Latest Data (Other Tab)
```javascript
const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;

const result = await minimalSync.pullData();
console.log('Updated activities:', result.data?.activities);
```

## Debugging

### Check What's in Storage
```javascript
// Check AsyncStorage (what the app uses)
const stored = await AsyncStorage.getItem('@minimal_sync_data');
console.log('AsyncStorage:', stored);

// Check localStorage (browser's storage)
console.log('LocalStorage:', localStorage.getItem('@minimal_sync_data'));
```

### Clear Everything
```javascript
const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;
await minimalSync.clearAll();
```

## Common Issues

### "Failed to fetch" Error
- Make sure you're running through `npm run web`, not opening HTML directly
- Check that the API URL is correct in console logs

### Data doesn't persist
- Check if AsyncStorage is working: `await AsyncStorage.setItem('test', 'value')`
- Look for debounce timers that might delay writes
- Check browser storage quota

### Can't import minimalSync
- Make sure the file exists at `/src/services/sync/minimalSyncService.js`
- Try refreshing the page and importing again

## What This Proves

If this Phase 1 test passes, we've proven:
1. ✅ Two tabs can exchange data through the API
2. ✅ Data persists in AsyncStorage/localStorage
3. ✅ Data survives page refresh
4. ✅ The basic sync infrastructure works

Once this works reliably, we can move to Phase 2: connecting to Zustand stores.