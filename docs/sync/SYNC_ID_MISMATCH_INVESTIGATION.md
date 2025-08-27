# Sync ID Mismatch Investigation - August 27, 2025

## Core Problem
The recovery phrase displayed to users does not generate the sync ID being used for network operations. This means users cannot restore their sync with the displayed phrase.

## Key Understanding
- **Recovery Phrase**: 32-char hex string generated from `nacl.randomBytes(16)` (e.g., `8c04ac9d4fa0fcfa1162cd4a6bb39253`)
- **Sync ID**: DIFFERENT 32-char hex derived FROM recovery phrase using 100k iterations of NaCl hash
- They should NEVER match - sync ID is deterministically generated from recovery phrase
- **Critical**: The displayed recovery phrase MUST generate the network sync ID when run through `generateSyncId()`

## Observed Behavior (STILL OCCURRING IN v11)

### Production Examples
- **v7 Displayed**: `c70921f0f188c06aa8a67238121ef6e4` 
- **v7 Network sync ID**: `166598ac28d396cbc24aa33aa5c6e6e9`
- **Test Result**: Displayed phrase generates `d9ac...` - WRONG!

### Qual Examples  
- **v11 Displayed**: `8c04ac9d4fa0fcfa1162cd4a6bb39253`
- **v11 Network sync ID**: `773e4ebfd4cb81584653f967f365f1cf`
- **Test Result**: Displayed phrase generates `ceba1afaf150c47b9caba40dba6a1c98` - WRONG!

## Root Cause Analysis (UNRESOLVED)

### Two Different Issues Identified

#### Issue 1: Orphaned Sync IDs (Partially Fixed)
1. User has sync ID stored in `@sync_id` AsyncStorage
2. But recovery phrase for that ID is missing from `@sync_phrase_[syncId]`
3. User clicks "Create New Sync"
4. Fixed in v11: `create()` now detects orphaned IDs and clears them via `disable()`

#### Issue 2: Value Mismatch (NOT FIXED - STILL OCCURRING)
Even in fresh incognito sessions with NO stored data:
1. `create()` generates recovery phrase via `encryptionService.generateRecoveryPhrase()`
2. `create()` derives sync ID via `generateSyncId(recoveryPhrase)` 
3. Both values are frozen in result object
4. DataModal receives and displays these values
5. **BUT**: The displayed recovery phrase does NOT generate the network sync ID
6. This suggests values are being swapped or modified SOMEWHERE

## Code Paths

### Sync ID Generation (`syncServiceV2.js`)
```javascript
// In create():
const recoveryPhrase = encryptionService.generateRecoveryPhrase(); // Random 16 bytes -> hex
const syncId = await this.generateSyncId(recoveryPhrase);          // PBKDF2-like derivation

// In generateSyncId():
const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ==';  // Different from encryption salt!
const { key } = await encryptionService.deriveKeyFromPhrase(recoveryPhrase, fixedSalt);
// 100,000 iterations of NaCl.hash
const syncId = key.slice(0, 16).toHex();
```

### DataModal Flow (`DataModal.js`)
```javascript
// When user clicks "Create New Sync":
const result = await syncService.create();
setSyncId(result.syncId);
setSyncRecoveryPhrase(result.recoveryPhrase);  // This is what gets displayed

// Display:
<Text>{syncRecoveryPhrase || 'Loading...'}</Text>
```

## Critical Files
- `/src/services/sync/syncServiceV2.js` - Main sync service
- `/src/components/Modals/DataModal/DataModal.js` - UI that displays phrase
- `/src/services/sync/encryptionService.js` - Stores/retrieves phrases

## Attempted Fixes (As of v11)

### ✅ Partially Successful
1. Added orphaned sync ID detection in `create()`
2. Auto-clear orphaned data via `disable()`
3. Removed `checkSyncStatus()` call after sync creation
4. Used `Object.freeze()` to make result immutable
5. Error handling clears sync state on failure

### ❌ Still Not Working
- Fresh incognito sessions still show mismatch
- Displayed recovery phrase does NOT generate the network sync ID
- Values appear to be swapped or incorrectly assigned somewhere

## Technical Details

### Sync ID Derivation Algorithm
```javascript
// Fixed salt for sync ID (different from encryption salt)
const SYNC_ID_SALT = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ==';
const ENCRYPTION_SALT = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';

// 100,000 iterations of NaCl.hash
KEY_DERIVATION_ITERATIONS = 100000;
```

### Production Build Constraints
- `babel.config.js` has `transform-remove-console` in production
- ALL console.log statements are stripped from bundles
- Cannot debug with console output in production/qual
- Must use other methods (alerts, visible UI elements) for debugging

## Current Status (v11)
**ISSUE REMAINS UNRESOLVED** - The displayed recovery phrase and network sync ID do not match, even with:
- Frozen immutable result objects
- Orphaned sync detection
- Direct value assignment
- Removed async race conditions

## Next Investigation Steps
1. Check if webpack is aliasing or transforming modules differently in production
2. Verify `nacl.randomBytes()` behavior in web builds
3. Check if there's a caching issue in the key derivation
4. Investigate if values are being swapped at the UI layer
5. Test if the issue occurs in development builds vs production only

## Test Cases

### Test 1: Fresh Incognito Session (FAILS)
1. Open incognito browser
2. Navigate to StackMap
3. Open Data modal
4. Click "Create New Sync"
5. Copy displayed recovery phrase
6. Check network tab for sync_id in API calls
7. Run: `generateSyncId(displayed_phrase)`
8. **Expected**: Generated ID matches network sync_id
9. **Actual**: They don't match

### Test 2: Verify Sync ID Generation
```javascript
// Node.js test to verify algorithm
const crypto = require('crypto');
function generateSyncId(recoveryPhrase) {
  const fixedSalt = Buffer.from('U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ==', 'base64');
  const iterations = 100000;
  const key = crypto.pbkdf2Sync(recoveryPhrase, fixedSalt, iterations, 32, 'sha256');
  return Array.from(key.slice(0, 16), byte => byte.toString(16).padStart(2, '0')).join('');
}

// Test with actual values from v11
const displayed = '8c04ac9d4fa0fcfa1162cd4a6bb39253';
const network = '773e4ebfd4cb81584653f967f365f1cf';
console.log('Generated:', generateSyncId(displayed));
console.log('Expected:', network);
// Result: They DON'T match
```

## For New Context
**This is a critical production issue** where the recovery phrase shown to users cannot restore their sync. The issue occurs even in fresh sessions with no stored data, suggesting a fundamental problem in how values are being generated, stored, or displayed. Despite multiple attempted fixes including immutable objects and removing race conditions, the issue persists in v11.