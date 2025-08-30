# Pending Changes

## Title: Fix onboarding import to use new data format

### Changes Made:
- Fixed import flow to use pullResult.data instead of pullResult.encrypted_blob
- Data is already decrypted by minimalSync, no need to decrypt again in import
- Consistent with preview flow changes

