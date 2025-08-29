# Quick Sync Test Guide

## How to Test the Minimal Sync

### 1. Start the App
```bash
npm run web
```

### 2. Access the Test
Look for the **red "SYNC TEST" button** floating on the right side of the screen (dev mode only).

Click it to open the sync test interface.

### 3. Run the Test Sequence

#### In Browser Tab A:
1. Click **"1. Create New Sync"**
2. Copy the Sync ID from the alert
3. You'll see 3 test activities appear

#### In Browser Tab B (open in incognito or different browser):
1. Enter the Sync ID from Tab A
2. Click **"2. Join Existing Sync"**
3. You should see the same 3 activities
4. Click **"3. REFRESH PAGE"** (or press Cmd+R)
5. Click **"4. Check if Data Persisted"**

### ✅ SUCCESS if:
- Activities survive the refresh
- Alert shows "Data persisted after refresh!"
- Logs show data was loaded from storage

### ❌ FAILURE if:
- Activities disappear after refresh
- Alert shows "Data did not persist"
- Logs show "No data in storage"

## What This Tests

This minimal sync service tests the absolute basics:
- Can we send data to the server?
- Can another device receive it?
- Does it persist in AsyncStorage/localStorage?
- Does it survive a page refresh?

## Additional Tests

- **Add Activity**: Adds a new activity and pushes to server
- **Pull Data**: Pulls latest changes from other devices
- **Clear All**: Resets everything for a fresh test

## Debugging

Check the logs section at the bottom of the test interface. Look for:
- Green ✅ messages = good
- Red ❌ messages = problems
- Timestamps show when each operation happened

## Next Steps

Once this basic test passes consistently, we can:
1. Connect to actual Zustand stores
2. Add proper conflict resolution
3. Add encryption
4. Production hardening