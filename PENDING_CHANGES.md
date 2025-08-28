# Pending Changes

## Title: Debug sync test + fixed device ID validation

### Changes Made:
- Created debugSync.js minimal test to verify basic sync works
- Fixed device ID to be exactly 32 hex chars (was 33)
- Added error text logging to see server responses
- Verified server API is working correctly
- Server returns records where timestamp > since parameter
- Issue confirmed: Device B pulls data but never saves timestamp

