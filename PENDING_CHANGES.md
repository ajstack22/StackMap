# Pending Changes

## Title: Add debug sync to test if basic sync mechanism works at all

### Changes Made:
- Created minimal debugSync.js that bypasses all complexity
- Just pulls data from server and stores it
- Exposes window.testDebugSync() for testing
- Will show if the fundamental sync/storage mechanism works
- If this works, we know the issue is in the complex sync logic
- If this fails, we know it's a platform/storage issue

