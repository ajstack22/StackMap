# Pending Changes

## Title: Fix iOS sync decryption error

### Changes Made:
- Fixed incorrect UTF8 encoding/decoding function mappings in encryptionService.ts
- encodeUTF8 and decodeUTF8 wrapper functions had reversed parameters causing "Malformed decodeURI input" errors on iOS
- Corrected all usages to properly convert between strings and Uint8Arrays

