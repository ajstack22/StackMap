# Pending Changes

## Title: Fix Sync API Integration for Simple Sync Service

### Changes Made:

#### 1. Fixed Simple Sync Service API Integration
- **Issue**: Simple sync was getting 404/500 errors when calling API endpoints
- **Root Cause**: 
  - Sync group must be created with `create.php` before using `push.php`
  - pull.php returns 404 if sync group doesn't exist
- **Fixes in `src/services/sync/simpleSyncService.js`**:
  - Updated `pushState()` to create sync group if it doesn't exist (calls create.php first)
  - Updated `sync()` to handle 404 response from pull.php
  - Updated `pullData()` to properly handle 404 and check for encrypted_blob
  - Fixed API URL to always be absolute: `https://stackmap.app/api/sync`

#### 2. Previously Fixed Issues (Still Included)
- **AsyncStorage Race Condition**: Fixed in all store adapters
- **Simple Sync Implementation**: Created bulletproof last-write-wins sync
- **API Endpoint Compatibility**: Using existing complex sync endpoints

