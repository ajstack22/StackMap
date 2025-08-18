# Pending Changes

## Title: Simplified Sync Service - Fixed API compatibility

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

#### 📦 Implementation Details
- Created new `syncServiceSimple.ts` (~600 lines vs 1800+)
- Updated all imports to use simplified service
- Added compatibility methods for existing code
- Fixed TypeScript errors in sync-related files
- Fixed all ESLint errors

#### 🐛 Bug Fix
- **Fixed 400 Bad Request error** when creating sync groups
- API expects `encrypted_blob`, `recovery_salt`, and `device_id` fields
- Updated `createSyncGroup()` to match API requirements

#### 🎯 Benefits
- No more timer initialization problems
- No more "methods not accessible" errors  
- More predictable sync behavior
- Easier to debug and maintain
- Better battery life on mobile devices

### API Compatibility:
- **No API changes** - Same endpoints, same encryption, same data format
- Backend fully compatible with simplified client
- Fixed request payload to match API expectations

### Testing:
- Web build compiles successfully
- TypeScript and ESLint checks pass (all errors fixed)
- Sync creation works correctly (400 error fixed)
- Sync triggers work as expected (visibility, changes, manual)