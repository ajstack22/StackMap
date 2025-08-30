# Pending Changes

## Title: Revert recovery phrase format changes and keep enhanced debugging

### Changes Made:
- Reverted KEY_ prefix and dashed format for recovery phrases
- Kept enhanced logging in minimalSyncService to debug data flow
- Added encryption/decryption test before pushing to verify data integrity
- Added detailed logging in syncStoreIntegration to track what data is captured

