# Pending Changes

## Title: Fix iOS Share Version Compatibility

### Changes Made:
- Fixed window.location undefined errors on iOS with proper platform checks
- Set share_version to 2 for mobile platforms (iOS/Android) for server compatibility
- Keep share_version 3 for web platform
- Handle different URL formats based on share version
- V2 shares use query parameter format for mobile
- V3 shares use hash fragment format for web

