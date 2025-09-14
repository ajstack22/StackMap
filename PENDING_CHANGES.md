## Title: Fix undefined sync API endpoint issue in share functions

### Changes Made:
- Fixed sync API endpoint configuration in syncStoreIntegration.js
- Share functions now use the same API_BASE as minimalSync service for consistency
- This ensures the correct API URL is used in all environments (local, qual, production)

### Deployment Date: TBD
