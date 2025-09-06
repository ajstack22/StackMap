# Pending Changes

## Title: Fix sync URL detection for /qual/sync/ paths

### Changes Made:
- Fixed regex pattern to properly detect both /sync/ and /qual/sync/ URL paths
- Added debug logging to trace URL parsing and sync invite detection
- The regex now uses (?:\/qual)? to optionally match the /qual prefix

