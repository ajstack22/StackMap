# StackMap Project Structure

## Root Directory

### Core Application Files
- `index.html` - Main application entry point
- `manifest.json` - PWA manifest configuration
- `sw.js` - Service worker for offline functionality
- `.htaccess` - Apache server configuration

### Source Code
- `src/` - Application source code
  - `stackmap.js` - Main application logic
  - `stackmap.css` - Application styles
  - `CelebrationManager.js` - Celebration animations

### Icons
- `icon-72.png`, `icon-96.png`, `icon-128.png`, `icon-144.png`
- `icon-152.png`, `icon-192.png`, `icon-384.png`, `icon-512.png`

### Mobile Apps
- `android/` - Android application
- `ios/` - iOS application
- `capacitor.config.json` - Capacitor configuration

### Documentation
- `README.md` - Project readme
- `LICENSE` - MIT license
- `CLAUDE.md` - Claude AI assistant instructions
- `docs/` - Documentation directory
  - Migration guides
  - Cache prevention strategy
  - Setup guides

### Build & Dependencies
- `package.json` - NPM dependencies
- `package-lock.json` - NPM lock file
- `node_modules/` - NPM packages (gitignored)

### Deployment
- `DEPLOY.sh` - Deploy to production
- `ROLLBACK.sh` - Rollback deployment
- `DEPLOYMENT_SIMPLE.md` - Deployment instructions
- `.cpanel.yml` - cPanel deployment configuration
- `scripts/` - Deployment and build scripts

### Development
- `.gitignore` - Git ignore configuration
- `.github/` - GitHub workflows and templates
- `.githooks/` - Git hooks
- `.vscode/` - VSCode settings
- `tests/` - Test files

## Clean Architecture

The project now follows a simple, maintainable structure:
- Single HTML entry point
- All JavaScript in one file (stackmap.js)
- All CSS in one file (stackmap.css)
- Service worker for PWA functionality
- Icons for various platforms
- Mobile apps via Capacitor

This streamlined structure makes the codebase:
- Easy to understand
- Quick to deploy
- Simple to maintain
- Fast to load