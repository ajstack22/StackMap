# 📚 StackMap Documentation Index

> **Last Updated**: 2025-08-14  
> **Purpose**: Central index for all active documentation to prevent confusion and ensure easy discovery

---

## 🚨 Critical Documentation (Start Here!)

### 📊 Data Specifications (CANONICAL - Updated 2025-08-14)
- **[/docs/data/data-dictionary.md](./data/data-dictionary.md)** - 🔴 Canonical data structures & field definitions
- **[/docs/data/data-overview.md](./data/data-overview.md)** - Architecture overview & compliance checklist
- **[/docs/data/data-sync-service.md](./data/data-sync-service.md)** - Zero-knowledge sync implementation
- **[/docs/data/data-import-service.md](./data/data-import-service.md)** - Import procedures & normalization
- **[/docs/data/data-export-service.md](./data/data-export-service.md)** - Export formats & sanitization
- **[/docs/data/data-reset-service.md](./data/data-reset-service.md)** - Reset operations & recovery
- **[/docs/LEGACY_DOCUMENTATION_NOTICE.md](./LEGACY_DOCUMENTATION_NOTICE.md)** - ⚠️ Which docs are outdated

### Deployment & Infrastructure
- **[CLAUDE.md](./CLAUDE.md)** - 🔴 THE deployment truth - read this first!
- **[README_DEPLOYMENT.md](./README_DEPLOYMENT.md)** - Step-by-step deployment guide
- **[DO_NOT_IGNORE_BUILD_FILES.md](./DO_NOT_IGNORE_BUILD_FILES.md)** - Prevents 403 errors

### Quick References
- **[QUICK_TEST_CHECKLIST.md](./QUICK_TEST_CHECKLIST.md)** - Test before deploying
- **[MD_FILES_AUDIT_REPORT.md](./MD_FILES_AUDIT_REPORT.md)** - Which docs to trust

---

## 🏗️ Development Documentation

### Feature Implementation
- **[COMPLETE_DAY_MODAL_PROMPT.md](./COMPLETE_DAY_MODAL_PROMPT.md)** - Complete Day modal spec
- **[EDIT_MODE_MENU_STRATEGY.md](./EDIT_MODE_MENU_STRATEGY.md)** - Toolbar overflow logic
- **[MODAL_PATTERNS.md](./MODAL_PATTERNS.md)** - Standard modal implementation patterns

### System Architecture
- **[docs/STACKMAP_COMPREHENSIVE_DOCUMENTATION.md](./docs/STACKMAP_COMPREHENSIVE_DOCUMENTATION.md)** - Full system documentation
- **[docs/CROSS_PLATFORM_DEVELOPMENT.md](./docs/CROSS_PLATFORM_DEVELOPMENT.md)** - Platform differences

### Component Systems
- **[docs/CARD_LIBRARY_SYSTEM.md](./docs/CARD_LIBRARY_SYSTEM.md)** - Activity card system
- **[docs/COMPONENT_INTERACTION_DIAGRAMS.md](./docs/COMPONENT_INTERACTION_DIAGRAMS.md)** - Component relationships

---

## 📱 Platform-Specific Guides

### Android
- **[android/SECURE_SIGNING_SETUP.md](./android/SECURE_SIGNING_SETUP.md)** - Signing configuration
- **[android/CREATE_KEYSTORE.md](./android/CREATE_KEYSTORE.md)** - Keystore creation
- **[docs/android/GOOGLE_PLAY_SETUP_GUIDE.md](./docs/android/GOOGLE_PLAY_SETUP_GUIDE.md)** - Play Store setup
- **[docs/android/ANDROID_BUILD_SETUP.md](./docs/android/ANDROID_BUILD_SETUP.md)** - Build configuration

### iOS
- **[docs/ios/XCODE_FIX.md](./docs/ios/XCODE_FIX.md)** - Common Xcode issues
- **[docs/ios/APP_NAMING_FIX.md](./docs/ios/APP_NAMING_FIX.md)** - App name configuration

### Web/PWA
- **[docs/PWA_SETUP.md](./docs/PWA_SETUP.md)** - PWA configuration
- **[docs/WEB_PLATFORM_DIFFERENCES.md](./docs/WEB_PLATFORM_DIFFERENCES.md)** - Web-specific issues

---

## 🔄 Sync & API Documentation

- **[api/sync/README.md](./api/sync/README.md)** - Sync system overview
- **[docs/SYNC_API_REFERENCE.md](./docs/SYNC_API_REFERENCE.md)** - API endpoints
- **[docs/SYNC_IMPLEMENTATION_PLAN.md](./docs/SYNC_IMPLEMENTATION_PLAN.md)** - Implementation details
- **[docs/ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md](./docs/ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md)** - Security architecture

---

## 🧪 Testing Documentation

- **[tests/TESTING_FRAMEWORK.md](./tests/TESTING_FRAMEWORK.md)** - Test framework setup
- **[tests/STORY_TESTING_GUIDE.md](./tests/STORY_TESTING_GUIDE.md)** - Story-based testing
- **[docs/UAT_TESTING_GUIDE.md](./docs/UAT_TESTING_GUIDE.md)** - User acceptance testing

---

## 🔧 Development Tools & Scripts

- **[scripts/README.md](./scripts/README.md)** - Available scripts
- **[docs/development/SCRIPTS_README.md](./docs/development/SCRIPTS_README.md)** - Script documentation
- **[docs/GITHUB_CLI_SETUP.md](./docs/GITHUB_CLI_SETUP.md)** - GitHub CLI configuration

---

## 🔐 Security & Privacy

- **[STACKMAP_PRIVACY_SECURITY_WHITEPAPER.md](./STACKMAP_PRIVACY_SECURITY_WHITEPAPER.md)** - Security overview
- **[docs/SYNC_SECURITY_IMPLEMENTATION_GUIDE.md](./docs/SYNC_SECURITY_IMPLEMENTATION_GUIDE.md)** - Sync security

---

## 📋 Quick Links by Task

### "I need to deploy"
1. Start with [CLAUDE.md](./CLAUDE.md)
2. Follow [README_DEPLOYMENT.md](./README_DEPLOYMENT.md)
3. Check [DO_NOT_IGNORE_BUILD_FILES.md](./DO_NOT_IGNORE_BUILD_FILES.md)

### "I need to add a feature"
1. Check [docs/STACKMAP_COMPREHENSIVE_DOCUMENTATION.md](./docs/STACKMAP_COMPREHENSIVE_DOCUMENTATION.md)
2. Review similar features (e.g., [COMPLETE_DAY_MODAL_PROMPT.md](./COMPLETE_DAY_MODAL_PROMPT.md))
3. Follow platform guidelines in platform-specific guides

### "I need to fix a bug"
1. Check platform-specific guides for known issues
2. Review [QUICK_TEST_CHECKLIST.md](./QUICK_TEST_CHECKLIST.md)
3. Test on all platforms using [docs/CROSS_PLATFORM_DEVELOPMENT.md](./docs/CROSS_PLATFORM_DEVELOPMENT.md)

### "I need to understand the architecture"
1. Start with [docs/STACKMAP_COMPREHENSIVE_DOCUMENTATION.md](./docs/STACKMAP_COMPREHENSIVE_DOCUMENTATION.md)
2. Review [EDIT_MODE_MENU_STRATEGY.md](./EDIT_MODE_MENU_STRATEGY.md) for UI patterns
3. Check component relationships in [docs/COMPONENT_INTERACTION_DIAGRAMS.md](./docs/COMPONENT_INTERACTION_DIAGRAMS.md)

---

## ⚠️ Documentation Rules

1. **Check this index first** before creating new documentation
2. **Update this index** when adding new MD files
3. **One source of truth** - don't duplicate information
4. **Delete outdated docs** - see [MD_FILES_AUDIT_REPORT.md](./MD_FILES_AUDIT_REPORT.md)
5. **Add "Last Updated"** dates to critical docs

---

## 🗑️ Deprecated/Outdated Docs
See [MD_FILES_AUDIT_REPORT.md](./MD_FILES_AUDIT_REPORT.md) for the full list of files to ignore or delete.