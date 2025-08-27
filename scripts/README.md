# StackMap Scripts Directory

## Primary Deployment Scripts

### 🚀 Production Deployment (`prod_deploy.sh`)
```bash
./prod_deploy.sh all     # Full deploy: web + Android AAB + iOS archive
./prod_deploy.sh web     # Deploy web only to production
./prod_deploy.sh android # Build Android AAB for Play Store
./prod_deploy.sh ios     # Build iOS archive for App Store
./prod_deploy.sh rollback # Rollback web production
./prod_deploy.sh         # Interactive menu
```

### 🧪 Staging (Qual) Deployment (`qual_deploy.sh`)
```bash
./qual_deploy.sh         # Deploy to qual/staging environment
./qual_deploy.sh --skip-tests  # Emergency deploy without tests
./qual_deploy.sh --web   # Web only
./qual_deploy.sh --android --ios  # Mobile only
```

### 🔧 Development Setup
```bash
./setup-git-hooks.sh     # Install git hooks for the project
```

## Directory Organization

### 📁 Core Directories

- **react-native/** - Native mobile build and run scripts for React Native
- **cleanup/** - Server and local cleanup utilities
- **testing/** - Sync and integration test scripts
- **utilities/** - Code analysis, validation, and helper scripts
- **devices/** - Device management, screenshots, and Metro scripts
- **icons/** - Icon and launch screen generation scripts
- **archived-scripts/** - Old/deprecated scripts (reference only)

## Quick Start Guide

### Deploy to Production
1. Update `PENDING_CHANGES.md` with your changes
2. Deploy to qual: `./qual_deploy.sh`
3. Test at: https://stackmap.app/qual/
4. Deploy to production: `./prod_deploy.sh all`

### Build Mobile Apps
- **Android**: `./prod_deploy.sh android` → Creates `.aab` file
- **iOS**: `./prod_deploy.sh ios` → Creates `.xcarchive`

### Version Management
- Format: `YYYY.MM.DD.BUILD`
- Automatically incremented by deployment scripts
- Unified across all platforms

## API Configuration

| Environment | API URL |
|------------|---------|
| Production | `https://stackmap.app/api/sync` |
| Development/Qual | `https://stackmap.app/qual/api/sync` |

## Important Notes

1. **Always update PENDING_CHANGES.md** before deploying for meaningful commit messages
2. **API URLs are verified** before each build
3. **Version increments automatically** - no manual updates needed
4. **Production builds use production API** - verified in the build process
5. **Git hooks** prevent accidental bad pushes to main

## Troubleshooting

### Permission Issues
```bash
chmod +x scripts/*.sh
```

### Git Hook Not Running
```bash
./setup-git-hooks.sh
```

### Emergency Bypass (not recommended)
```bash
git push --no-verify
```

## Script Categories

### Recently Cleaned (Aug 2025)
Moved 30+ outdated scripts to `archived-scripts/` to maintain clarity.

### Active Scripts
- **prod_deploy.sh** - Production deployment orchestrator
- **qual_deploy.sh** - Staging deployment with tests
- **setup-git-hooks.sh** - Development environment setup

### Subdirectory Scripts
- **react-native/** - 20+ scripts for native builds
- **testing/** - Sync and integration tests
- **utilities/** - Code quality and validation
- **devices/** - Device and screenshot management
- **icons/** - Asset generation
- **cleanup/** - Maintenance utilities

## Best Practices

1. Run tests before deploying
2. Use staging (qual) before production
3. Document changes in PENDING_CHANGES.md
4. Keep scripts executable: `chmod +x`
5. Review archived scripts before creating new ones