# StackMap Directory Cleanup Plan

## Files to KEEP:

### Core Application Files:
- `index.html` - Main app entry point
- `src/` directory - All app code
  - `src/stackmap.js`
  - `src/stackmap.css`
  - `src/CelebrationManager.js`
- `sw.js` - Service worker
- `manifest.json` - PWA manifest
- `.htaccess` - Server configuration

### Icons:
- `icon-*.png` - All icon sizes for PWA

### Documentation:
- `README.md`
- `LICENSE`
- `docs/` directory (with new migration docs)

### Version Control:
- `.git/` directory
- `.gitignore`
- `.github/` directory

### Deployment:
- `.cpanel.yml` - cPanel deployment config
- `DEPLOY.sh` - Deployment script
- `ROLLBACK.sh` - Rollback script

### Mobile Apps:
- `android/` - Android app
- `ios/` - iOS app
- `capacitor.config.json`

## Files to REMOVE:

### Old Architecture Files:
- `components.js`
- `state.js`
- `renderer.js`
- `drive-sync.js`
- `env-loader.js`
- All files in root that are JS/component files

### Directories:
- `components/` - Old component structure
- `config/` - Old config
- `data/` - Old data files
- `demo/` - Demo files
- `js/` - Old JS structure
- `styles/` - Old modular styles
- `utils/` - Old utilities
- `timer/` - Timer app
- `www/` - Old www directory
- `mobile-first/` - Old mobile-first attempt

### Development/Testing:
- `test-*.html` files
- `backup-creator.html`
- `sqlite-*.md` files
- Various development scripts and configs

### Documentation to Archive:
- Various MD files that are development notes
- Old implementation plans

## Migration Steps:

1. Create a backup of current state
2. Remove unnecessary files
3. Update paths in remaining files if needed
4. Test that app still works
5. Commit cleaned structure