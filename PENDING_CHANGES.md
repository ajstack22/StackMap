# Pending Changes

## Title: Fix sync ID mismatch issue - recovery phrase being overwritten

### Changes Made:
- Fixed critical sync ID mismatch where displayed recovery phrase didn't match network sync ID
- Root cause: DataModal was calling checkSyncStatus() after create(), which overwrote the correct recovery phrase
- Removed the checkSyncStatus() call after successful sync creation - the result from create() is the source of truth
- Updated syncServiceV2.create() to detect and clear orphaned sync IDs automatically
- Improved DataModal to handle missing recovery phrases by showing sync as disabled
- Enhanced error handling in DataModal to clear all sync state on failure
- Created comprehensive investigation documentation in docs/sync/SYNC_ID_MISMATCH_INVESTIGATION.md

