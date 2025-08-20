# Pending Changes

## Title: Fix React Native Web Fetch Absolute URL Requirements

### Changes Made:
- Updated all fetch calls in simpleSyncService.js to ensure absolute URLs
- Added baseUrl calculation that guarantees URLs start with https://
- Fixed sync(), pushState(), pullData(), and create.php fetch calls
- Added safeguards in API_URL getter to catch and correct relative URLs

### Technical Details:
- React Native (including React Native Web) requires absolute URLs for fetch()
- Browser DevTools may show relative paths in network errors but the actual issue is the URL format
- Solution ensures all API calls use full https://stackmap.app URLs
- Based on 2025 best practices for React Native Web with webpack

