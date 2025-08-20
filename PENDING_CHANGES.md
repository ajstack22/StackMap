# Pending Changes

## Title: Fix Sync API for Qual Environment

### Changes Made:

#### 1. Fixed API URL Resolution in Simple Sync Service
- **Issue**: Simple sync was hardcoding production URL, causing failures in qual environment
- **Solution**: Used same pattern as complex sync service (`getApiBaseUrl()`)
- **Changes in `src/services/sync/simpleSyncService.js`**:
  - Added `getInitialApiUrl()` method that determines correct API URL based on environment
  - For web in `/qual` path → uses `https://stackmap.app/qual/api/sync`
  - For production → uses `https://stackmap.app/api/sync`
  - For mobile dev builds → uses qual API

#### 2. Copied API Files to Correct Directory
- **Issue**: API files were in `/qual/api/sync/` but need to be in `/api/sync/` for deployment
- **Solution**: Copied all PHP API files from `qual/api/sync/` to `api/sync/`
- **Note**: The `/api` directory gets deployed to server where PHP files are executed

#### 3. Previously Fixed Issues
- Fixed sync configuration persistence with correct AsyncStorage keys
- Added recovery phrase storage in simple sync service  
- Fixed API workflow to handle create.php before push.php

