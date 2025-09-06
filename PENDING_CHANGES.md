# Pending Changes

## Title: Add visible debug info to sync join screen

### Changes Made:
- Added visible debug panel showing syncInviteData contents in the UI
- Added useEffect to update recovery phrase when syncInviteData is available
- Shows invite code, recovery phrase (truncated), and current text field value
- This helps diagnose why the recovery phrase isn't populating correctly

