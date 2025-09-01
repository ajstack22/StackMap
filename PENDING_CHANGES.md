# Pending Changes

## Title: Fix Pixel Tablet Sync - Force QUAL URL for All Mobile Builds

### Changes Made:
- Applied temporary fix to force QUAL API URL for all Android/iOS builds
- Updated syncStoreIntegration.js to match minimalSyncService.js behavior
- This ensures Pixel Tablet emulator uses QUAL environment instead of production
- Fixes sync issues where Pixel Tablet was incorrectly using production API

