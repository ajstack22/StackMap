# Pending Changes

## Title: Fix sync join when group has no data yet

### Changes Made:
- Fixed onboarding to check for pullResult.data instead of encrypted_blob
- Data is already decrypted by minimalSync, no need to decrypt again
- Added better error message when sync group exists but has no data
- Distinguishes between "sync doesn't exist" and "sync exists but no data pushed yet"

