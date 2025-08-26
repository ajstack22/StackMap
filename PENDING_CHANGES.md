# Pending Changes

## Title: Fix activity reordering and sync initialization issues

### Changes Made:
- Fixed mergeActivityArrays to preserve local activity order during sync
- Changed from using Map.values() which lost order to maintaining ordered array
- Process local activities first to preserve user's arrangement
- Append new remote activities at the end instead of inserting randomly
- Prevents cards from jumping to wrong positions after sync
- Added initialize(recoveryPhrase) method to syncServiceV2 for onboarding compatibility
- Method sets up encryption and syncId without fully enabling sync (matching original behavior)
- Renamed internal startup initialization to _initializeOnStartup()
- Fixed "Sync group is still being set up" error by properly handling onboarding flow
- Ensures encryption is properly initialized before attempting to pull sync data

