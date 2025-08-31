# Pending Changes

## Title: Fix iOS URL Construction with Manual String Concatenation

### Changes Made:
- Replaced template literals with manual string concatenation for iOS compatibility
- Wrapped all URL parameters with String() to ensure no undefined values
- Applied fix to both pullData() and joinSync() URL construction
- This approach worked for Android and should fix iOS "Malformed decodeURI" error

