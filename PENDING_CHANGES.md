# Pending Changes

## Title: Fix initial sync to ignore timestamps and pull all data

### Changes Made:
- Added forceFullPull parameter to pullData() for initial sync scenarios
- Initial sync (onboarding/DataModal import) now pulls everything from timestamp 0
- No merge logic during initial sync - just replaces with remote data
- Fixed issue where stored timestamp from previous attempts blocked fresh imports

