# Pending Changes

## Title: Fix sync validation and add wake/focus detection

### Changes Made:

1. **Sync Data Validation** (`src/services/sync/dataValidator.ts`)
   - Fixed deleted activity filtering during repair process
   - Activities with `deleted: true` are now properly excluded
   - Fixed theme validation to accept hex color codes (#RRGGBB format)

2. **Wake/Focus Detection** (`src/services/sync/syncService.ts`)
   - Added automatic sync trigger on browser tab visibility change
   - Added sync trigger on window focus event
   - Added sync trigger when network connection is restored
   - Ensures sync resumes immediately after computer wake/sleep

3. **Passive Event Listeners** (`web/passiveEvents.js`)
   - Fixed Chrome warnings about non-passive wheel event listeners
   - Improved scroll performance by making wheel/touch events passive
   - Only affects web platform

4. **Deployment Workflow** (`scripts/deploy-all.sh`, `PENDING_CHANGES.md`, `CLAUDE_WORKFLOW.md`)
   - Implemented descriptive commit messages from PENDING_CHANGES.md
   - Replaced generic timestamps with meaningful commit descriptions
   - Added workflow documentation for consistent change tracking

5. **Testing Improvements** (`scripts/test-sync-fast.sh`, `scripts/sync-test-automated.js`)
   - Created automated sync API testing script
   - Reduced testing time from 7 manual steps to 30-second automated test
   - Added quick testing guide with multiple verification options

### Impact:
- Fixes sync validation errors with deleted activities
- Improves sync reliability when computers wake from sleep
- Eliminates Chrome performance warnings
- Provides meaningful git history for better debugging
- Significantly reduces sync testing time