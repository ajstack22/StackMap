# Pending Changes

## Title: Add iOS Encryption Test Component for Debugging

### Changes Made:
- Created simplified encryption service (encryptionServiceSimple.ts) with manual byte packing
- Avoids DataView issues on iOS by using bitwise operations for length encoding
- Added TestEncryption component to run comprehensive encryption tests
- Added long-press on palette FAB to trigger test modal on iOS in dev mode
- Tests Base64, UTF-8, metadata encoding, and full encrypt/decrypt cycle

