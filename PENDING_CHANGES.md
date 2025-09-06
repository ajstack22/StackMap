# Pending Changes

## Title: Fix sync URL auto-registration with duplicate recovery phrase fragments

### Changes Made:
- Fixed DataModal.js to not append recovery phrase twice when generating sync URLs
- Added defensive parsing in App.js to handle malformed URLs with duplicate hash fragments
- Updated sync documentation to clarify that inviteUrl already includes the recovery phrase

