# Pending Changes

## Title: Fix iOS UTF-8 Encoding with Native TextEncoder

### Changes Made:
- Created encryptionServiceFixed.ts that uses native TextEncoder/TextDecoder for UTF-8
- Works around tweetnacl-util UTF-8 bug on iOS that returns all zeros
- Uses manual byte packing for metadata length (avoids DataView issues)
- Updated minimalSyncService and syncStoreIntegration to use fixed service
- This should resolve all iOS sync decryption errors

