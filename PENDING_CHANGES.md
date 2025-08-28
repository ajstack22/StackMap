# Pending Changes

## Title: Fix invalid device_id format validation for existing users

### Changes Made:

1. **Added validation check for existing device IDs**
   - Checks if stored device_id matches required format: `/^[a-f0-9]{32}$/`
   - Automatically removes invalid device IDs from storage
   - Generates new compliant device ID when invalid one detected

### Technical Details:
- Issue: Users with existing device IDs from before the fix still had base64 format IDs
- Solution: Validate existing IDs on load and regenerate if format is incorrect
- This ensures all users get a valid hex format device ID

### Testing:
- Users with old device IDs will have them automatically replaced
- New sync operations should work without 400 errors
- Check console for "[Encryption] Clearing invalid device_id format" message