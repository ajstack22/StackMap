# Pending Changes

## Title: Fix sync invite validation property mismatch

### Changes Made:
- Fixed property name mismatch in validateInviteCode return value
- Changed from 'valid' to 'success' to match what OnboardingUserCentered expects
- Kept 'valid' property for backward compatibility
- This fixes the "Invalid or expired invite code" error when using valid codes

