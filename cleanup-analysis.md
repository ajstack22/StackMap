# StackMap Directory Cleanup Analysis

## Directories/Files to REMOVE:

### 1. iOS Build Artifacts (taking up lots of space)
- `ios/StackMapNative 2025-07-04 12-03-01/` - Old build
- `ios/StackMapNative 2025-07-04 12-22-55/` - Old build
- `ios/StackMapNative 2025-07-04 12-24-52/` - Old build
- `ios/StackMapNative 2025-07-04 12-27-55/` - Old build
- `ios/StackMapNative 2025-07-04 12-39-31/` - Old build
- `ios/StackMapNative 2025-07-04 19-14-43/` - Old build
- `ios/StackMapNative 2025-07-04 20-55-59/` - Old build
- `ios/StackMapNative 2025-07-04 21-04-29/` - Old build
- `ios/StackMapNative 2025-07-04 21-12-13/` - Old build
- `ios/StackMapNative 2025-07-04 21-12-47/` - Old build
- `ios/StackMapNative 2025-07-04 21-13-09/` - Old build
- `ios/StackMapNative 2025-07-04 21-38-10/` - Old build
- `ios/StackMapNative 2025-07-06 10-34-12/` - Old build
- `ios/Build StackMapNative_2025-07-04T13-55-42.txt` - Build log

### 2. Android Build Artifacts
- `android/app/build/` - Build directory
- `android/build/` - Build directory

### 3. Archive/Old Code
- `archive/` - Contains old mobile apps and web app versions
- `backups/` - Old backup files

### 4. Test Reports (hundreds of JSON files)
- `tests/reports/` - Contains 100+ test report JSON files
- `test-results/` - More test results

### 5. Old API/Sync Directories
- `sync/` - Old sync implementation (replaced by api/sync/)
- `manyla/` - Old sync solution research

### 6. Deployment Scripts We Don't Use
- `scripts/archive/` - Old deployment scripts
- Various one-off scripts in root

### 7. Test Files
- `snap.js` - Unknown test file
- `privacy.html` - Static page (should be served differently)
- `support.html` - Static page (should be served differently)

### 8. Build Logs
- `logs/` - Build logs

### 9. Temporary/Generated
- `vendor/` - If empty or unused
- `image_library/` - If empty
- `emulator-downloads/` - Test data

### 10. Documentation That Could Be Consolidated
- Many docs in `docs/archive/`
- Duplicate or outdated guides

## Directories/Files to KEEP:

### Core Application
- `src/` - Source code
- `App.js`, `index.js`, `index.web.js` - Entry points
- `package.json`, `package-lock.json` - Dependencies
- Configuration files (webpack, babel, metro, etc.)

### Assets
- `assets/` - Images and fonts
- `web/public/` - Web assets

### Mobile
- `ios/` (except build artifacts)
- `android/` (except build artifacts)

### API
- `api/` - Current API implementation

### Documentation
- Core docs in `docs/`
- README files
- CLAUDE.md

### Scripts
- Active deployment scripts in `scripts/`
- `cleanup-root.sh` - Useful utility

## Space Savings Estimate:
- iOS builds: ~200MB+
- Android builds: ~100MB+
- Test reports: ~10MB
- Archive: ~50MB
- Total: ~360MB+ could be freed