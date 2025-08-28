# Pending Changes

## Title: Fix device_id format validation error

### Changes Made:

1. **Fixed device ID generation format**
   - Changed from base64 encoding to 32-character hexadecimal string
   - Now matches server validation regex: `/^[a-f0-9]{32}$/`
   - Ensures compatibility with create_timestamp.php validation

### Technical Details:
- Server expects device_id as 32 hex characters (16 bytes as hex)
- Previous format used base64 which included invalid characters
- Fallback device ID also updated to correct format

### Testing:
- Create new sync should now work without "Invalid device_id format" error
- Existing device IDs will remain unchanged