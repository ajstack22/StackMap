# StackMap Sync Infrastructure

## Overview
This directory contains the sync system implementation for StackMap, enabling cross-device synchronization without user accounts.

## Current Status: Phase 1 Complete ✅
- Database schema deployed
- PHP API endpoints live
- Security implemented
- All endpoints tested

## Directory Structure
```
sync/
├── test-api-endpoints.sh    # Comprehensive API testing
├── test-api.sh             # Quick API test
├── database/               # Database schema reference
│   ├── setup.sql          # Complete schema
│   ├── setup-without-use.sql  # Schema without USE statement
│   └── test-data.sql      # Sample test data
└── archive/               # Archived setup scripts
    └── setup-scripts/     # One-time deployment scripts
```

## API Endpoints
Base URL: `https://stackmap.app/api/sync/`

- `POST /create.php` - Create new sync group
- `POST /push.php` - Push encrypted updates  
- `GET /pull.php` - Pull latest data
- `GET /test.php` - Test connection

## Testing
Run the comprehensive test:
```bash
./test-api-endpoints.sh
```

Quick connection test:
```bash
./test-api.sh
```

## Next Phase: Encryption
See `/docs/SYNC_IMPLEMENTATION_PLAN.md` for Phase 2-4 details.