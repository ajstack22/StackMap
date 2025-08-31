# Pending Changes

## Title: Fix iOS Sync by Using Manual UTF-8 Implementation

### Changes Made:
- Always use manual UTF-8 encoding/decoding on ALL platforms
- tweetnacl-util is broken on iOS (returns strings instead of Uint8Arrays)
- Manual implementation works correctly on all platforms
- This finally fixes the iOS sync decryption errors

