# Pending Changes

## Title: Fixed Sync ID Generation - Recovery Phrase Now Works Correctly

### Changes Made:

#### 🔄 Sync Service Simplification (67% code reduction)
- **Removed periodic 30-second sync timer** - Better battery life
- **Removed network monitoring** - Assumes always online, simpler
- **Removed complex initialization timers** - Fixes initialization issues
- **Removed sync queue & transaction tracking** - Unnecessary complexity

#### ✅ New Simple Sync Triggers
- **App visibility/focus** - Syncs when app becomes active
- **Data changes** - Debounced 10-second sync after changes
- **Manual sync** - Direct API for user-triggered sync

#### 🐛 Critical Bug Fixes
- **Fixed sync ID generation** - Now uses deriveKeyFromPhrase with fixed salt (was using simple hash)
- **Fixed pull.php API call** - Changed from POST to GET with query parameters
- **Fixed push.php payload** - Added required `device_id`, `device_name`, `sync_type` fields
- **Fixed createSyncGroup** - Includes encrypted initial data and device info
- **Added missing methods** - `addStatusListener`, `syncWithQueue`, `generateSyncId` for compatibility
- **Fixed method binding** - Explicitly bound all methods to make them accessible
- **Fixed all lint errors** - Used underscore prefix for unused parameters

#### 📦 Implementation Details
- Created new `syncServiceSimple.ts` (~650 lines vs 1800+)
- Updated all imports to use simplified service
- Added compatibility methods for existing code
- Fixed all TypeScript and ESLint errors (0 errors)
- Sync ID generation now matches original implementation exactly

#### 🎯 Benefits
- No more timer initialization problems
- No more "methods not accessible" errors  
- Recovery phrases work correctly across devices
- More predictable sync behavior
- Easier to debug and maintain
- Better battery life on mobile devices

### API Compatibility:
- **No API changes** - Same endpoints, same encryption, same data format
- Backend fully compatible with simplified client
- Fixed request formats to match API expectations exactly
- Sync IDs are generated consistently with original algorithm

### Testing:
- Web build compiles successfully
- All lint checks pass (0 errors)
- API calls use correct format (GET for pull, proper POST for push)
- Sync creation works correctly
- Recovery phrase generates correct sync ID
- Cross-device sync should now work properly