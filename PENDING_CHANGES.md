# Pending Changes

## Title: Fix sync URL routing and paths in QUAL environment

### Changes Made:
- Added .htaccess file to /qual/ directory to handle sync URL rewrite rules
- Configured RewriteBase for QUAL subdirectory context  
- Updated deploy-with-tracking.sh to convert relative paths to absolute paths for QUAL
- Added automatic inclusion of .htaccess file in QUAL deployments
- Fixed bundle.js and asset loading from nested sync URLs

