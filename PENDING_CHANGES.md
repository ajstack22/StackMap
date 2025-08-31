# Pending Changes

## Title: Fix iOS Sync Decryption Empty Metadata Handling

### Changes Made:
- Added workaround for sync records with empty/corrupted metadata sections
- When metadata bytes are all zeros, skip to data section directly
- Try both uncompressed and compressed formats when metadata is empty
- Improved error logging while removing debug alerts
- This fixes the initial sync error while still allowing successful connection

