# Pending Changes

## Title: Fix onboarding import to handle decrypted data format

### Changes Made:
- Fixed onboarding preview and import to use pullResult.data (already decrypted)
- Removed redundant decryption call since minimalSync already decrypts
- Better error messages for empty sync vs failed connection

