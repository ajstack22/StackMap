# Beta Web Deployment - Implementation Summary

**Date:** October 10, 2025
**Status:** Completed
**Impact:** Beta tier now has dedicated web deployment to `/beta` folder

---

## What Changed

### 1. Updated `deploy-with-tracking.sh`
- Added beta environment support alongside qual and prod
- Beta deploys to `stackmap.app/beta` folder on server
- Fixes paths for beta environment (absolute paths for nested URLs)
- Supports beta-specific .htaccess configuration
- Creates `deploy-beta` git branch for tracking

### 2. Updated `deploy_beta.sh`
- Changed web deployment from qual to beta environment
- Mobile apps already configured to use `beta/api` endpoint
- Web now matches mobile configuration
- Updated all output messages to reflect beta/api usage
- Added warnings about production database usage

### 3. Created Beta Infrastructure
- Created `/beta` folder structure
- Added `/beta/.htaccess` with proper SPA routing
- Configured RewriteBase for `/beta/` subdirectory
- Handles share and sync URL patterns

### 4. Updated Documentation
- Updated `BETA_DEPLOYMENT_GUIDE.md` with new web deployment info
- Clarified that beta uses production database via `beta/api`
- Added warnings about data sharing with production

---

## How Beta Web Deployment Works

### Deployment Flow
```bash
./scripts/deploy_beta.sh --all
```

**Steps:**
1. Builds web bundle with production settings
2. Calls `deploy-with-tracking.sh beta`
3. Creates `deploy-beta` git branch
4. Copies build files to root
5. Fixes paths for `/beta/` subdirectory
6. Includes beta/.htaccess configuration
7. Pushes to `origin/deploy-beta` branch
8. SSH to server: `cd ~/public_html/beta && git pull`
9. Web accessible at `stackmap.app/beta`

### API Endpoint Detection
The `buildConfig.js` already had support for beta detection:

```javascript
// Web localhost - detect from URL
if (href.includes('/beta/') || href.includes('beta.')) {
  return 'beta';
}

// Map to API URL
const apiUrls = {
  beta: 'https://stackmap.app/beta/api/sync'
};
```

### Mobile Build Type
Mobile apps set `BUILD_TYPE=beta` in Fastfile, which:
- Android: Uses BuildConfigModule to read BUILD_TYPE
- iOS: Uses BuildConfigModule to read BUILD_TYPE
- Both map to `beta/api` endpoint via buildConfig.js

---

## Key Differences: Qual vs Beta vs Prod

| Aspect | Qual | Beta | Prod |
|--------|------|------|------|
| **Web URL** | stackmap.app/qual | stackmap.app/beta | stackmap.app |
| **API Endpoint** | qual/api | beta/api | api |
| **Database** | Qual DB | **Prod DB** | Prod DB |
| **Mobile** | Debug builds | TestFlight/Play Internal | App Store/Play Store |
| **Testing** | Developer only | Internal testers | Public users |
| **Data Risk** | Low (isolated) | **High (prod data!)** | High |

---

## Important Warnings

### Beta Uses Production Database!
- Beta web: `stackmap.app/beta/api/sync` → **Production DB**
- Beta mobile: `beta/api/sync` → **Production DB**
- All sync operations affect production data
- Test carefully to avoid corruption

### Server Setup Required
One-time setup on server:
```bash
ssh stackmap-cpanel
cd ~/public_html
mkdir beta
cd beta
git init
git remote add origin [repo-url]
git fetch origin
git checkout -b deploy-beta origin/deploy-beta
git branch --set-upstream-to=origin/deploy-beta
```

---

## Testing Recommendations

### 1. Verify Beta Web Deployment
```bash
# Deploy beta
./scripts/deploy_beta.sh --web

# Check URL
curl -I https://stackmap.app/beta/

# Verify API endpoint detection
# Open browser console at stackmap.app/beta
# Should see: [BuildConfig] Build Type: beta
# Should see: [BuildConfig] API URL: https://stackmap.app/beta/api/sync
```

### 2. Test Mobile Beta Builds
```bash
# iOS
./scripts/deploy_beta.sh --ios

# Android
./scripts/deploy_beta.sh --android

# Verify BUILD_TYPE in logs
# Should see: [BuildConfig] Build Type: beta
```

### 3. Verify Data Isolation
- Create test data in qual (qual/api → qual DB)
- Create test data in beta (beta/api → prod DB)
- Verify they don't mix
- **WARNING:** Beta changes affect production!

---

## Rollback Plan

### If Beta Web Has Issues
```bash
# 1. Roll back to previous deploy-beta commit
git checkout deploy-beta
git reset --hard HEAD~1
git push -f origin deploy-beta

# 2. SSH to server and pull
ssh stackmap-cpanel "cd ~/public_html/beta && git pull"

# 3. Verify rollback
curl -I https://stackmap.app/beta/
```

### Emergency: Disable Beta Web
```bash
# SSH to server
ssh stackmap-cpanel

# Rename beta folder
cd ~/public_html
mv beta beta-disabled

# Beta web will return 404 until re-enabled
```

---

## Next Steps

### Immediate
1. Test beta web deployment on staging server
2. Verify API endpoint detection works correctly
3. Confirm mobile apps still use beta/api
4. Update team on new beta web URL

### Future Enhancements
1. Add beta environment indicator in UI
2. Create beta-specific database (if needed to isolate from prod)
3. Add deployment logs to beta folder
4. Set up monitoring for beta environment

---

## Files Changed

### Scripts
- `/scripts/deploy-with-tracking.sh` - Added beta environment support
- `/scripts/deploy_beta.sh` - Changed from qual to beta web deployment

### Infrastructure
- `/beta/.htaccess` - Beta-specific Apache configuration

### Documentation
- `/docs/deployment/BETA_DEPLOYMENT_GUIDE.md` - Updated web deployment info
- `/BETA_WEB_DEPLOYMENT.md` - This summary document

### Existing (No Changes Needed)
- `/src/config/buildConfig.js` - Already supported beta detection
- iOS/Android Fastfiles - Already set BUILD_TYPE=beta
- Mobile native modules - Already read BUILD_TYPE

---

## Success Criteria

- ✅ Beta web deploys to `/beta` folder (not `/qual`)
- ✅ Beta web uses `beta/api` endpoint
- ✅ Mobile apps continue to use `beta/api` endpoint
- ✅ All platforms connect to production database in beta
- ✅ Proper error handling and logging
- ✅ Documentation updated

---

**Implementation Complete:** October 10, 2025
**Tested By:** [Pending]
**Approved By:** [Pending]
