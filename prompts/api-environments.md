# API Environments Documentation

## Overview
StackMap uses environment-specific API endpoints for sync and sharing features to ensure proper separation between development/testing (qual) and production environments.

## URL Structure

### Production
- **Web App**: `https://stackmap.app/`
- **Sync API**: `https://stackmap.app/api/sync/`
- **Share API**: `https://stackmap.app/api/sync/`

### Qual (Testing/Development)
- **Web App**: `https://stackmap.app/qual/`
- **Sync API**: `https://stackmap.app/qual/api/sync/`
- **Share API**: `https://stackmap.app/qual/api/sync/`

## Environment Detection Logic

The API URL is automatically determined based on the current environment:

### Web Platform
```javascript
// Check if in qual environment
if (window.location.pathname.startsWith('/qual')) {
  return 'https://stackmap.app/qual/api/sync';
}
// Otherwise use production
return 'https://stackmap.app/api/sync';
```

### Mobile Development
```javascript
// iOS/Android development builds use qual
if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
  return 'https://stackmap.app/qual/api/sync';
}
```

### Local Development
```javascript
// Localhost always uses production API (for safety)
if (window.location.hostname === 'localhost') {
  return 'https://stackmap.app/api/sync';
}
```

## API Endpoints

Both environments provide identical endpoints:

### Sync Endpoints
- `POST /create.php` - Create new sync
- `GET /pull.php` - Fetch sync data
- `POST /push.php` - Update sync data
- `GET /health.php` - Check API status
- `GET /cleanup.php` - Trigger cleanup (cron)

### Share Endpoints
- `POST /share.php` - Create share link
- `GET /share-preview.php` - Preview shared data
- `POST /share-import.php` - Import shared data

## Data Isolation

- **Qual and Production data are completely isolated**
- Sync IDs created in qual cannot be accessed in production
- Share links are environment-specific
- No cross-environment data access is possible

## Testing Workflow

1. **Development**: Local development uses production API
2. **Qual Testing**: Deploy to `/qual/` for testing with qual API
3. **Production**: Deploy to root `/` for production with production API

## Important Notes

1. **Sync Recovery Phrases**: A sync phrase created in qual will only work in qual environment
2. **Share Links**: Share links include the environment path (e.g., `/qual/` for qual shares)
3. **Data Cleanup**: Both environments have independent 30-day cleanup cycles
4. **API Health**: Check `/health.php` endpoint to verify API status

## Deployment

### Deploying to Qual
```bash
./scripts/deploy-web.sh qual
# Files go to: https://stackmap.app/qual/
# API: https://stackmap.app/qual/api/sync/
```

### Deploying to Production
```bash
./scripts/deploy-web.sh prod
# Files go to: https://stackmap.app/
# API: https://stackmap.app/api/sync/
```

## Troubleshooting

### Wrong Environment Issues
- **Symptom**: Sync not working after deployment
- **Cause**: App pointing to wrong API environment
- **Fix**: Check `window.location.pathname` and ensure correct API URL

### Cross-Environment Sync
- **Symptom**: "Sync not found" error
- **Cause**: Trying to use qual sync phrase in production or vice versa
- **Fix**: Create new sync in correct environment

### Share Link Not Working
- **Symptom**: Share preview shows 404
- **Cause**: Share created in different environment
- **Fix**: Ensure share link includes correct path (`/qual/` or `/`)

## Implementation Files

The environment detection logic is implemented in:
- `/src/services/sync/syncService.js` - Lines 17-60
- Functions: `getApiBaseUrl()` and `getShareApiUrl()`

## Security Considerations

1. **Qual is PUBLIC**: The qual environment is accessible to anyone
2. **No sensitive data**: Never use real user data in qual
3. **Testing only**: Qual should only be used for testing
4. **Production isolation**: Production API never accepts qual tokens

Last Updated: 2025-01-14