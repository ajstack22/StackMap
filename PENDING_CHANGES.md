# Pending Changes

## Title: Add support for new sync invite URL format

### Changes Made:
- Added detection for path-based sync invite URLs (/sync/[invite-code])
- Updated App.js to detect and store sync invite data from URL
- Modified OnboardingUserCentered to auto-join when sync invite is detected
- Sync invites now skip full onboarding and show abbreviated join flow
- Auto-triggers sync preview when both invite code and recovery phrase are present

