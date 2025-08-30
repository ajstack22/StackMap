# Pending Changes

## Title: Fix sync data not available - timestamp off-by-one issue

### Changes Made:
- Fixed createSync storing exact timestamp causing first pull to exclude own data
- Browser A now stores timestamp-1 locally to ensure first pull includes the initial record
- This fixes "no data available" error when Browser B tries to join the sync

