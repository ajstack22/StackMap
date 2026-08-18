# StackMap Scripts Directory

## 🎯 Quick Start

### Deploy to Any Environment
```bash
./deploy.sh qual [--all|--web|--ios|--android]   # Development testing (multiple/day)
./deploy.sh stage [--ios|--android]              # Internal validation (mobile-only)
./deploy.sh beta [--all|--web|--ios|--android]   # Closed beta testing (1-2/week)
./deploy.sh prod [--all|--web|--ios|--android]   # Public release (weekly/bi-weekly)
```

**Note:** `deploy.sh` is a wrapper that forwards to `deploy/deploy.sh` (master deployment script)

---

## 📁 Directory Organization

### **deploy/** - Deployment System
Complete four-tier deployment system:
- `deploy.sh` - Master deployment orchestrator
- `qual_deploy.sh` - Qual tier (development testing)
- `deploy_stage.sh` - Stage tier (internal validation)
- `deploy_beta.sh` - Beta tier (closed beta testing)
- `prod_deploy.sh` - Production tier (public release)
- `app-config.sh` - Centralized app configuration
- `version-increment.sh` - Version management utilities
- `lib/` - Shared deployment libraries (validation, reporting, rollback)
- **Documentation:**
  - `QUICK_REFERENCE.md` - Deployment quick reference
  - `PORTABILITY_GUIDE.md` - Porting to other apps
  - `STATUS_DASHBOARD.md` - Status page documentation

### **testing/** - Test Scripts
- `test-deployment-fixes.sh` - Deployment system validation
- `test-status-page.sh` - Status page generation tests
- `test-sync-fast.sh` - Quick sync testing workflow
- `mock-sync-server.js` - Local sync server for testing
- `test-sync-locally.sh` - Local sync testing guide
- Other sync and integration test scripts

### **utilities/** - Development Utilities
- `check-methods.js` - Store/service method validation
- `manage-backlog.sh` - Technical debt story automation
- `setup-git-hooks.sh` - Git hooks installation
- `sonar-analysis.sh` - SonarCloud code quality analysis
- `verify-coppa-compliance.sh` - COPPA compliance checks
- `version-increment.sh` - Legacy version management
- Other code quality and validation tools

### **react-native/** - React Native Scripts (26 scripts)
- Android build scripts with various configurations
- iOS icon and launch screen generation
- Device setup and management scripts
- Metro bundler troubleshooting

### **cleanup/** - Maintenance Scripts
- Server and local cleanup utilities
- Safe cleanup options for production
- Deep cleanup for development

### **devices/** - Device Management
- Screenshot capture for all platforms
- App store screenshot generation
- Device verification and management
- Metro connection troubleshooting

### **icons/** - Asset Generation
- iOS icon generation
- Launch screen generation
- Icon troubleshooting

---

## 🚀 Four-Tier Deployment System

### Architecture
```
QUAL → STAGE → BETA → PROD
```

| Tier | Database | Platforms | Frequency | Purpose |
|------|----------|-----------|-----------|---------|
| **QUAL** | qual-api | Web + Mobile | Multiple/day | Development testing |
| **STAGE** | stage-api (shares Qual DB) | Mobile only | Before beta | Internal validation |
| **BETA** | beta-api (Prod DB) | Web + Mobile | 1-2/week | Closed beta testing |
| **PROD** | prod-api | Web + Mobile | Weekly/bi-weekly | Public release |

### Deployment Flow
1. Update `PENDING_CHANGES.md` with your changes
2. Deploy to QUAL: `./deploy.sh qual --all`
3. Test at https://stackmap.app/qual/
4. Deploy to STAGE: `./deploy.sh stage --android --ios` (internal testing)
5. Deploy to BETA: `./deploy.sh beta --all`
6. Test with beta users at https://stackmap.app/beta/
7. Deploy to PROD: `./deploy.sh prod --all`

### Platform-Specific Deployment
```bash
# Web only
./deploy.sh qual --web

# iOS only
./deploy.sh qual --ios

# Android only
./deploy.sh qual --android

# All platforms (default)
./deploy.sh qual --all
```

---

## 🔧 Development Setup

```bash
# Install git hooks
./utilities/setup-git-hooks.sh

# Run code quality analysis
./utilities/sonar-analysis.sh

# Validate method usage
node ./utilities/check-methods.js

# Manage technical debt backlog
./utilities/manage-backlog.sh list
```

---

## 📊 Version Management

- **Format:** `YYYY.MM.DD.BUILD`
- **Auto-increment:** Deployment scripts handle versioning
- **Unified:** Same version across all platforms
- **Beta Suffix:** Beta tier adds `-beta.X` suffix

---

## 🔗 API Endpoints

| Environment | API URL |
|------------|---------|
| **Production** | `https://stackmap.app/api/sync` |
| **Beta** | `https://stackmap.app/beta/api/sync` |
| **Qual** | `https://stackmap.app/qual/api/sync` |
| **Stage** | `https://stackmap.app/stage/api/sync` |

---

## ⚠️ Important Notes

1. **Master Script:** Always use `./deploy.sh` (not direct execution of tier scripts)
2. **Update PENDING_CHANGES.md:** Before each deployment for meaningful commit messages
3. **Stage Tier:** Mobile-only (no web deployment)
4. **Beta Tier:** Uses production database (be careful!)
5. **Git Hooks:** Prevent accidental bad pushes to main
6. **Backward Compatibility:** `deploy.sh` wrapper maintains compatibility with old paths

---

## 🛠️ Troubleshooting

### Permission Issues
```bash
chmod +x scripts/**/*.sh
```

### Git Hooks Not Running
```bash
./utilities/setup-git-hooks.sh
```

### Deployment Lock Issues
```bash
rm /tmp/stackmap-deployment.lock
```

### Emergency Bypass (not recommended)
```bash
git push --no-verify
```

---

## 📝 Best Practices

1. **Test First:** Always deploy to QUAL before higher tiers
2. **Stage for Teams:** Use STAGE for internal team validation
3. **Beta Before Prod:** Test with beta users before public release
4. **Document Changes:** Update PENDING_CHANGES.md before deploying
5. **Platform Testing:** Test on all platforms for cross-platform changes
6. **Incremental Deployment:** Use platform-specific flags when appropriate

---

## 📚 Additional Documentation

- **Deployment Guide:** `/docs/deployment/README.md`
- **Quick Reference:** `/scripts/deploy/QUICK_REFERENCE.md`
- **Portability Guide:** `/scripts/deploy/PORTABILITY_GUIDE.md`
- **Status Dashboard:** `/scripts/deploy/STATUS_DASHBOARD.md`
- **Testing Guide:** `/docs/testing/simple-testing-guide.md`

---

**Last Updated:** October 2025
**Organization:** Cleaned and reorganized into logical subdirectories
