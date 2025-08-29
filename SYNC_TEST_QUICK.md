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
5. Wait for "Sync protection active for 10 seconds" message

### Test Data Sync

**On Browser B:**
1. Click "Add New User"
2. Enter name: "Test User B"
3. Click Save

**Wait 30 seconds** (you'll see "⏰ [time] - 30-second sync check" in console)

**On Browser A:**
- Verify "Test User B" appears automatically

### Test Bidirectional

**On Browser A:**
1. Add user "Test User A"

**Wait 30 seconds**

**On Browser B:**
- Verify "Test User A" appears

## What to Look For in Console

✅ Good signs:
- `[SyncTS] 🔄 [time] - Performing sync`
- `[SyncTS] ⏰ [time] - 30-second sync check`
- `[SyncTS] Sync protection active for 10 seconds`
- `[ConflictResolver] 🔀 Starting merge`

❌ Bad signs:
- "T.reduce is not a function"
- "60 second" messages
- No 30-second check messages

## Success Criteria
- Data syncs both ways
- No JavaScript errors
- 30-second automatic syncs visible in console
- Data persists after page refresh