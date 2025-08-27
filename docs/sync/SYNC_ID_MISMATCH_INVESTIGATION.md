# Sync ID Mismatch Investigation - August 27, 2025

## Core Problem
Users see a different recovery phrase displayed than what's actually being used for sync operations.

## Key Understanding
- **Recovery Phrase**: 32-char hex string (e.g., `c70921f0f188c06aa8a67238121ef6e4`)
- **Sync ID**: DIFFERENT 32-char hex derived FROM recovery phrase using PBKDF2
- They should NEVER match - sync ID is deterministically generated from recovery phrase

## Observed Behavior

### Production (v7)
- **Displayed**: `c70921f0f188c06aa8a67238121ef6e4` (recovery phrase)
- **Network uses sync ID**: `166598ac28d396cbc24aa33aa5c6e6e9`
- When tested, displayed phrase generates DIFFERENT sync ID, proving it's wrong

### Qual (v8) 
- **Displayed**: `1912869f8288ad50fcad2f82e2715a4c` (recovery phrase)
- **Network uses sync ID**: `5f2e3c8a8c17d8756595c74903fda223`
- Displayed phrase generates sync ID `ad532ed923119bae6b0568ff9c3f5a47` (WRONG!)

## Root Cause Analysis

### The Sequence
1. User has sync ID stored in `@sync_id` AsyncStorage
2. But recovery phrase for that ID is missing from `@sync_phrase_[syncId]`
3. User clicks "Create New Sync"
4. Service tries to get existing recovery phrase - NOT FOUND
5. Something generates/displays a NEW recovery phrase
6. But sync continues using OLD sync ID from AsyncStorage

### Why Production Only?
- Qual: Fresh testing, clean state
- Production: Accumulated state, orphaned sync IDs from old deployments

## Code Paths

### DataModal Flow
```javascript
// When modal opens
checkSyncStatus() -> 
  syncService.getRecoveryPhrase() -> 
    if null, sets to empty string

// When user clicks "Create New Sync"  
handleEnableSync() ->
  syncService.create() ->
    if error thrown, catch block doesn't clear displayed phrase
```

### Service Issues (v8)
- `getSyncId()` made async but returns wrong value initially
- `getRecoveryPhrase()` validates but returns null on mismatch
- `create()` throws error if phrase missing/wrong
- BUT: Error is caught in DataModal, old wrong phrase stays displayed

## Critical Files
- `/src/services/sync/syncServiceV2.js` - Main sync service
- `/src/components/Modals/DataModal/DataModal.js` - UI that displays phrase
- `/src/services/sync/encryptionService.js` - Stores/retrieves phrases

## Attempted Fixes
1. ✅ Added validation to detect wrong recovery phrases
2. ✅ Made AsyncStorage the source of truth for sync ID
3. ✅ Added error throwing when phrase is missing
4. ❌ BUT: UI doesn't clear wrong phrase when error occurs

## Production Build Issue
- `babel.config.js` has `transform-remove-console` in production
- ALL console.log statements are stripped from bundles
- Can't see debug output in production/qual

## The Real Fix Implemented (Aug 27, 2025)

### Root Cause Identified
The issue was in DataModal's `handleEnableSync()`:
1. After successfully calling `syncService.create()` and getting correct recovery phrase
2. DataModal called `checkSyncStatus()` to "ensure consistency"  
3. `checkSyncStatus()` calls `syncService.getRecoveryPhrase()` which retrieves stored phrase from AsyncStorage
4. The stored phrase might be different/null due to async timing or encryption issues
5. This overwrote the correct recovery phrase that was just returned from `create()`

### Solution
- Removed the `checkSyncStatus()` call after successful sync creation
- The result from `create()` is the authoritative source for both sync ID and recovery phrase
- They come from the same place: `create()` generates phrase → derives sync ID → returns both

### Additional Improvements
When `create()` detects an orphaned sync ID (ID exists but recovery phrase is missing/wrong):
1. Automatically clears the orphaned sync data via `disable()`
2. Creates a new sync with fresh recovery phrase
3. Returns the new sync info to DataModal

DataModal improvements:
1. If `getRecoveryPhrase()` returns null, shows sync as disabled
2. Error handling clears all sync state on failure

## Test Case
To reproduce:
1. Have sync enabled with ID in AsyncStorage
2. Delete recovery phrase from AsyncStorage (or have wrong one)
3. Open DataModal - sees empty/wrong phrase
4. Click "Create New Sync" - error thrown but wrong phrase stays visible