# StackMap Sync Data Loss Issue - Complete Technical Documentation

## Executive Summary
**CRITICAL BUG**: When two browsers sync, the browser that created the sync (Device A) loses all its data after the second browser (Device B) joins. This is a complete data wipeout affecting production users.

## Current Status (as of 2025-08-27, v2025.08.27.24)
- **Severity**: CRITICAL - Complete data loss for users
- **Affected versions**: All versions through v2025.08.27.23
- **Partial mitigation**: Server-side protection added in v2025.08.27.24
- **Root cause**: Multiple interrelated issues (see below)

## Reproduction Steps (100% reproducible)
1. Open StackMap in incognito browser (Browser A) at stackmap.app/qual
2. Delete all starter cards
3. Add activities from library (e.g., morning routine)
4. Rename and reorder some cards
5. Open Data modal → Sync tab → "Create New Sync"
6. Copy the 32-character recovery phrase
7. Open another incognito browser (Browser B)
8. From onboarding wizard, choose "Join existing sync"
9. Enter the recovery phrase from step 6
10. **OBSERVED**: Browser B initially shows correct data from Browser A
11. Switch back to Browser A
12. **BUG**: All data is gone in Browser A (complete wipeout)
13. **ADDITIONAL BUG**: Changes in either browser don't sync to the other

## Technical Architecture

### Sync System Overview
- **Service**: `/src/services/sync/syncServiceV2.js` (CRDT-based, ~1700 lines)
- **Encryption**: TweetNaCl.js with 100,000 iterations SHA-512 hash
- **Strategy**: Last-write-wins with timestamp-based conflict resolution  
- **API Endpoints**:
  - `stackmap.app/qual/api/sync/pull.php` - Pull data from server
  - `stackmap.app/qual/api/sync/push.php` - Push data to server
- **Sync Interval**: 30 seconds periodic + 5 seconds debounce after changes
- **Version Tracking**: Incremental version numbers on server

### Data Flow
1. **Push**: Stores → Normalize → Encrypt → Server (zero-knowledge)
2. **Pull**: Server → Decrypt → Validate → CRDT Merge → Apply to Stores
3. **Key Generation**: First 16 bytes of NaCl hash of recovery phrase + fixed salt

### Database Schema
```sql
-- sync_data table
sync_id VARCHAR(32) PRIMARY KEY
encrypted_blob TEXT
version INT
salt VARCHAR(255)
updated_at TIMESTAMP

-- sync_devices table  
device_id VARCHAR(64)
sync_id VARCHAR(32)
device_name VARCHAR(255)
created_at TIMESTAMP
last_seen TIMESTAMP
```

## Root Cause Analysis

### Issue #1: Webpack Build Cache Problem
**Description**: Protection code added to syncServiceV2.js is not being included in production bundles due to aggressive webpack caching.

**Evidence**:
- Source file has 8-13 occurrences of `_justJoinedSync` protection flag
- Built bundle only has 1 occurrence (from original code)
- Version numbers in App.js update correctly, proving some files build while others don't

**Attempted Fixes**:
- Cleared node_modules/.cache, .babel-cache, web/build
- Used BABEL_DISABLE_CACHE=1
- Added force rebuild markers
- Result: Bundle hash doesn't change, protection code never deploys

**Current Status**: UNRESOLVED - Webpack continues using cached version of sync service

### Issue #2: Device B Pushes Immediately After Joining
**Description**: When Device B joins an existing sync, it should only pull data, not push. However, it pushes within seconds of joining, overwriting the server data.

**Evidence from HAR files**:
```
Device B Timeline:
22:27:29 - First PULL (joins sync)
22:28:01 - PUSH (32 seconds later, corrupts data)

Device A Timeline:
22:28:06 - PULL (gets corrupted version)
22:28:07 - PUSH (cascade continues)
```

**Why Device B pushes**:
1. Store change listeners in `useSyncOnChange` hook trigger when data is applied
2. Protection flags (`_justJoinedSync`) not working due to webpack issue
3. Even setting syncEnabled=false doesn't prevent it

### Issue #3: Version Number Corruption
**Description**: Device A sends wrong version numbers in push requests.

**Evidence**:
- Device A at version 3
- Pulls version 4 from Device B
- Pushes with version 31 (should be 5)
- Server correctly returns version 5, ignoring client's bad version

**Root cause**: When safety checks return early from push(), they return `this.lastVersion` but performSync() still updates the version, causing desynchronization.

### Issue #4: CRDT Merger Issues
**Description**: The CRDT merger doesn't properly handle the case where one device has starter/empty data and the other has real data.

**Location**: `/src/services/sync/crdtMerger.js`

**Problem**: When Browser B joins with starter cards and Browser A has custom data, the merge produces corrupted results that delete Browser A's data.

### Issue #5: Server-Side Protection Gaps
**Initial problem**: No server-side protection against devices pushing immediately after joining.

**v23 attempt**: Added protection but devices weren't being tracked properly
- pull.php only updated existing devices, didn't create records
- push.php check failed because device record didn't exist

**v24 fix**: 
- pull.php now creates device record on first pull
- push.php blocks any device without a record
- Extended protection to 60 seconds (30 was too close)

## Attempted Solutions History

### Client-Side Attempts (v18-v22) - ALL FAILED
1. **v18**: Added `_justJoinedSync` flag and 10-second cooldown
2. **v19**: Extended to 15 seconds, added `_applyingRemoteState` flag
3. **v20**: Added debug logging and strengthened safety checks
4. **v21**: Attempted to force webpack rebuild with cache clearing
5. **v22**: Added global window flags to bypass module boundaries

**Why all failed**: Webpack build process doesn't include the updated sync service code

### Server-Side Attempts (v23-v24) - PARTIALLY SUCCESSFUL
1. **v23**: Added 30-second block in push.php
   - Failed because devices weren't tracked on pull
   
2. **v24**: Fixed device tracking
   - pull.php creates device records
   - push.php blocks all new devices for 60 seconds
   - Currently deployed and should work

## Current Codebase State

### Files Modified (with issues)
1. **src/services/sync/syncServiceV2.js**
   - Has protection code that doesn't deploy
   - Contains global window flags (v22)
   - Multiple safety checks that never execute

2. **src/hooks/useSyncOnChange.js**
   - Checks for `_justJoinedSync` flag
   - Checks for `_applyingRemoteState` flag
   - But flags are never set due to build issue

3. **src/services/sync/crdtMerger.js**
   - Has logging to debug merges
   - Logic to handle empty local state
   - But may still have edge cases

4. **qual/api/sync/push.php**
   - Blocks devices for 60 seconds after first pull
   - Validates version numbers
   - Returns HTTP 429 for blocked attempts

5. **qual/api/sync/pull.php**
   - Creates device record on first pull
   - Tracks when device joined

### Console Debugging
Since console.log is stripped in production, added:
- Alert messages for critical events
- Debug info in DataModal UI
- But these also don't appear (build cache issue)

## Network Analysis (HAR Files)

### What HAR files reveal:
1. Device push/pull timing
2. Version numbers in requests vs responses  
3. Encrypted blob sizes
4. Exact sequence of operations

### Key findings from HAR analysis:
- Device B pushes 32 seconds after joining (just past 30-second protection)
- Device A sends wrong version in push request
- Server correctly increments versions but clients get confused
- Data corruption happens on first push after join

### HAR files location:
- `/docs/stackmap.appA.har` - Device A network traffic
- `/docs/stackmap.appB.har` - Device B network traffic

## Testing Instructions

### To Test Current Protection (v24):
1. Clear all browser data (use incognito)
2. Create sync on Device A with custom data
3. Join on Device B within 60 seconds
4. Device B should get HTTP 429 error if it tries to push
5. After 60 seconds, sync should work normally

### To Verify Build Issues:
```bash
# Check protection in source
grep -c "_justJoinedSync" src/services/sync/syncServiceV2.js
# Should show 8+

# Check protection in bundle
grep -c "_justJoinedSync" web/build/bundle.*.js  
# Shows only 1 (broken)

# Check bundle hash after changes
# Edit syncServiceV2.js, rebuild, check if hash changes
# Currently it doesn't change (cache issue)
```

## Required Permanent Fix

### Option 1: Fix Webpack Build (Preferred)
1. Identify why webpack caches syncServiceV2.js
2. Possible causes:
   - Babel loader cache
   - Webpack persistent cache
   - Module resolution issue
   - Tree shaking removing "dead" code
3. May need to:
   - Update webpack config
   - Clear all caches completely
   - Check for duplicate/conflicting modules

### Option 2: Strengthen Server Protection
1. Current 60-second block should work
2. Could add:
   - Checksum validation of data
   - Reject pushes that delete all activities
   - Rate limiting per device
   - Version sequence validation

### Option 3: Rewrite Sync Initialization
1. When joining existing sync:
   - Completely disable all sync operations
   - Clear local state entirely
   - Apply remote state
   - Wait before re-enabling
2. Make this atomic and foolproof

## Environment Details
- **Platform**: Web (qual environment)
- **URL**: stackmap.app/qual
- **Build System**: Webpack 5.99.9, Babel 10.0.0
- **Deployment**: Using qual_deploy.sh script
- **Testing**: Use incognito browsers to avoid localStorage conflicts

## Success Criteria
1. ✅ Browser A creates sync with custom data
2. ✅ Browser B joins and receives Browser A's data  
3. ❌ Browser A KEEPS their data (no wipeout)
4. ❌ Changes in either browser sync to the other
5. ❌ Both browsers stay synchronized ongoing

Currently only criteria 1-2 work reliably.

## Critical Questions Requiring Investigation

1. **Why doesn't webpack rebuild syncServiceV2.js?**
   - Is there a persistent cache we're missing?
   - Is the module being pulled from elsewhere?
   - Is tree shaking removing our protection code?

2. **Why does Device B push immediately?**
   - Even with syncEnabled=false
   - Store listeners seem to bypass all checks
   - Is there another code path triggering sync?

3. **Why do version numbers get corrupted?**
   - The jump from 3 to 31 is bizarre
   - Where is this calculation happening?
   - Is AsyncStorage involved?

4. **Can we trust the CRDT merger?**
   - It's complex and may have edge cases
   - The merge of empty + full data is problematic
   - Should we skip merge entirely on join?

## Appendix: Code Locations

### Critical Files
- `/src/services/sync/syncServiceV2.js` - Main sync service
- `/src/services/sync/crdtMerger.js` - CRDT merge logic  
- `/src/services/sync/encryptionService.js` - Encryption/decryption
- `/src/components/Modals/DataModal/DataModal.js` - Sync UI
- `/src/hooks/useSyncOnChange.js` - Triggers sync on data changes
- `/src/stores/useUserStore.js` - User/activity data store
- `/src/utils/dataNormalizer.js` - Field normalization
- `/App.js` - Lines 2116-2130, 5606-5620 for activity creation

### Server Files
- `/qual/api/sync/push.php` - Push endpoint with protection
- `/qual/api/sync/pull.php` - Pull endpoint with device tracking
- `/qual/api/sync/config.php` - Database configuration
- `/qual/api/sync/sync_schema.sql` - Database schema

### Build/Deploy Files
- `/webpack.config.js` - Webpack configuration
- `/babel.config.js` - Babel configuration  
- `/scripts/qual_deploy.sh` - Deployment script
- `/scripts/deploy-with-tracking.sh` - Alternative deployment

## Contact for Questions
This is a critical production issue affecting user data. The sync system is fundamentally broken, causing data loss. The protection attempts have been thwarted by build system issues that prevent code deployment.

---
**Document created**: 2025-08-27
**Last updated**: 2025-08-27
**Versions affected**: All through v2025.08.27.24
**Priority**: CRITICAL - Data Loss