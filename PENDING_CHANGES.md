# Pending Changes

## Title: Investigate Sync API 404 Errors in Qual Environment

### Changes Made:
- Investigated sync API 404 errors when creating new sync from onboarding wizard
- Verified API files are correctly deployed to /public_html/qual/api/sync/
- Confirmed sync service is using correct URL: https://stackmap.app/qual/api/sync
- Tested API endpoints - GET requests work, POST requests work with proper JSON Content-Type
- Removed temporary test_sync.php file after investigation

### Findings:
- API files exist and are accessible at correct paths
- config.php is properly configured on server
- GET requests to pull.php work fine
- POST requests to push.php work when Content-Type: application/json is set
- The 404 errors in browser console may be due to preflight/CORS issues or ModSecurity on Namecheap

### Next Steps:
- Monitor if errors persist during actual sync operations
- May need to add better error handling for CORS/preflight requests
- Consider adding more detailed logging to identify exact failure conditions

