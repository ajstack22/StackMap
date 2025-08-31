# Pending Changes

## Title: Comprehensive iOS Debugging for Malformed URI

### Changes Made:
- Added debugging at the start of fetchSyncPreview to isolate when error occurs
- Added character code logging to detect invisible characters in recovery phrase
- Added constructor debugging to see if error happens during module initialization
- Added detailed window.location access logging to catch where URI decode happens
- This will pinpoint exactly where iOS differs from Android

