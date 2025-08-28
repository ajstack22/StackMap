# Pending Changes

## Title: Fix Rate Limiting and Sync State Application

### Problems Found from HAR Analysis:
1. **Device A getting rate limited (429 errors)** - Too frequent sync attempts
2. **Device B receives data but doesn't apply it** - State merge not detecting changes
3. **Push count 0 on Device B** - Not pushing its changes back

### Changes Made:

#### 1. **Increased Sync Interval**
- Changed from 30 seconds to 60 seconds to reduce rate limiting
- Added rate limit backoff mechanism

#### 2. **Implemented Exponential Backoff for 429 Errors**
- When rate limited, backs off for specified time
- Stops and restarts sync timer with delay
- Prevents hammering the server

#### 3. **Added Comprehensive Sync Logging**
- Logs pull response details including device info
- Shows record timestamps being processed
- Tracks state comparison results
- Logs merge operation details

#### 4. **Fixed Sync Timestamp Tracking**
- Only updates lastSyncTimestamp if push succeeds
- Prevents skipping records on failed pushes
- Properly saves timestamp after processing

#### 5. **Previous Fixes Still Included**
- CRDT field-level merging
- Recovery phrase storage
- Protection period handling

### Testing Instructions:
1. Refresh both devices to get new code
2. Wait for rate limit to clear (60+ seconds)
3. Watch console for detailed sync logs
4. Look for:
   - `[SyncTS] Pull response:` showing records
   - `[SyncTS] State comparison:` showing if changes detected
   - `[SyncTS] Merging activities:` showing CRDT merge

### Debugging:
The HAR files show Device B IS receiving encrypted data from Device A.
Check console to see if:
- State comparison detects changes
- CRDT merger is called
- Activities are being merged properly