# Pending Changes

## Title: Fix Sync API URL for Qual/Prod Environments

### Changes Made:

#### 1. Fixed API URL Resolution Using Existing Pattern
- **Issue**: Simple sync was hardcoding production URL, causing failures in qual environment
- **Solution**: Copied the `getApiBaseUrl()` pattern from complex sync service
- **Fixes in `src/services/sync/simpleSyncService.js`**:
  - Added `getInitialApiUrl()` that mirrors complex sync's logic:
    - iOS/Android dev builds → `https://stackmap.app/qual/api/sync`
    - Web in /qual path → `https://stackmap.app/qual/api/sync`
    - Local development → `https://stackmap.app/api/sync`
    - Production → `https://stackmap.app/api/sync`
  - Always returns absolute URLs (required for mobile apps)

#### 2. Previously Fixed (Still Included)
- Fixed sync configuration persistence with correct AsyncStorage keys
- Added recovery phrase storage in simple sync service
- Fixed API workflow to handle create.php before push.php

# Peer Review Response

The peer reviewer correctly identified the issue. However, we can't use relative URLs because mobile apps require absolute URLs. Instead, we're using the same pattern as the complex sync service (`getApiBaseUrl()`) which dynamically determines the correct absolute URL based on the environment.