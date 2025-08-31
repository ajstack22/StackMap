# Pending Changes

## Title: Handle Legacy Sync Data from UTF-8 Encoding Bug

### Changes Made:
- Added temporary recovery code for sync data encrypted with buggy encodeUTF8 (pre-v2025.08.31.24)
- Detects legacy data by checking for all-zero metadata bytes
- Recovers compressed data that follows the broken metadata
- Logs warnings to encourage re-syncing with properly formatted data
- This migration code can be removed once all old sync data is cleared

