# Pending Changes

## Title: Fix iOS Sync Response Handling

### Changes Made:
- Added try-catch around response.text() to catch iOS-specific encoding errors
- Added blob fallback if response.text() fails on iOS
- Added validation to ensure syncId and deviceId exist before constructing URL
- Better error logging to diagnose iOS "Malformed decodeURI input" error

