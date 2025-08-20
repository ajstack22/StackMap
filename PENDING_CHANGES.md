# Pending Changes

## Title: Fix Sync API URL Resolution Issues

### Changes Made:
- Added additional logging to track exact URL being passed to fetch
- Added safeguard in API_URL getter to ensure absolute URLs are always returned
- Added warning if API URL somehow becomes relative

