# Pending Changes

## Title: Fix iOS DataView Buffer Compatibility Issue in Sync Encryption

### Changes Made:
- Fixed iOS-specific issue where DataView couldn't properly access Uint8Array.buffer
- Changed encryption to create ArrayBuffer directly before using DataView
- Fixed decryption to copy bytes to new ArrayBuffer for DataView access
- This resolves the metadata encoding issue causing sync failures on iOS

