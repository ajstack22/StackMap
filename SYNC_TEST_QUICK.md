# Quick Sync Test Instructions

## Setup (2 browsers)
1. Open https://stackmap.app/qual/ in Browser A (Chrome)
2. Open https://stackmap.app/qual/ in Browser B (Firefox/Safari)

## Test Steps

### Browser A - Create Sync
1. Click "🧪 Sync Testing" button
2. Click "Create New Sync"
3. Copy the sync ID that appears

### Browser B - Join Sync  
1. Click "🧪 Sync Testing" button
2. Click "Join Existing Sync"
3. Paste the sync ID from Browser A
4. Click "Join Sync"

### Test Data Sync

**On Browser B:**
1. Click "Add New User"
2. Enter name: "Test User B"
3. Click Save
4. See message: "Change detected. Will push after 5 second debounce"

**Wait 30 seconds** (you'll see "⏰ [time] - 30-second sync check" in console)

**On Browser A:**
- Verify "Test User B" appears automatically

### Test Bidirectional

**On Browser A:**
1. Add user "Test User A"
2. See message: "Change detected. Will push after 5 second debounce"

**Wait 30 seconds**

**On Browser B:**
- Verify "Test User A" appears

## What to Look For in Console

✅ Good signs:
- `[MinimalSync] ⏰ [time] - 30-second sync check` (every 30 seconds)
- `[MinimalSync] 🔄 Performing pull from server`
- `[ConflictResolver] 🔀 Starting merge`
- "Change detected. Will push after 5 second debounce"

❌ Bad signs:
- "60 second" or "10 second protection" messages
- "T.reduce is not a function"
- No 30-second check messages

## Success Criteria
- Data syncs both ways
- No JavaScript errors
- 30-second automatic syncs visible in console
- Changes push after 5-second debounce
- Data persists after page refresh