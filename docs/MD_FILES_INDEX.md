# 📚 StackMap Documentation Index

> **Last Updated**: 2025-08-23  
> **Purpose**: Central index for all active documentation to prevent confusion and ensure easy discovery

---

## 🚨 Critical Documentation (Start Here!)

### 📊 Data Specifications (CANONICAL - Updated 2025-08-23)
- **[/docs/DATA_STRUCTURE.md](./DATA_STRUCTURE.md)** - 🔴 Canonical data structures & field definitions
- **[/docs/sync/data-sync-service.md](./sync/data-sync-service.md)** - Zero-knowledge sync implementation
- **[/docs/features/import-export-system.md](./features/import-export-system.md)** - Import/export functionality

### Deployment & Infrastructure
- **[CLAUDE.md](../CLAUDE.md)** - 🔴 THE deployment truth - read this first!
- **[/docs/deployment/README.md](./deployment/README.md)** - Comprehensive deployment guide

### Quick References
- **[/docs/testing/testing-checklist.md](./testing/testing-checklist.md)** - Test before deploying
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🏗️ Development Documentation

### Feature Implementation
- **[/docs/features/edit-mode-refactor.md](./features/edit-mode-refactor.md)** - Edit mode implementation
- **[/docs/architecture/MODAL_PATTERNS.md](./architecture/MODAL_PATTERNS.md)** - Standard modal implementation patterns

### System Architecture
- **[STORE_ARCHITECTURE.md](./STORE_ARCHITECTURE.md)** - Store system architecture
- **[architecture/SYSTEM_ARCHITECTURE.md](./architecture/SYSTEM_ARCHITECTURE.md)** - Overall system design

### Component Systems
- **[/docs/features/activity-library-system.md](./features/activity-library-system.md)** - Activity card system

---

## 📱 Platform-Specific Guides

### Consolidated Platform Documentation (Updated 2025-08-20)
- **[platform/README.md](./platform/README.md)** - 🔴 Platform documentation index
- **[platform/CROSS_PLATFORM_GUIDE.md](./platform/CROSS_PLATFORM_GUIDE.md)** - Cross-platform development patterns
- **[platform/ios/README.md](./platform/ios/README.md)** - Complete iOS development guide
- **[platform/android/README.md](./platform/android/README.md)** - Complete Android development guide
- **[platform/web/README.md](./platform/web/README.md)** - Complete Web/PWA development guide

### Platform Documentation
- **[/docs/platform/android/README.md](./platform/android/README.md)** - Android development guide
- **[/docs/platform/ios/README.md](./platform/ios/README.md)** - iOS development guide

---

## 🔄 Sync & API Documentation

- **[/docs/sync/README.md](./sync/README.md)** - Comprehensive sync system documentation
- **[/docs/sync/SYNC_API_REFERENCE.md](./sync/SYNC_API_REFERENCE.md)** - API endpoints
- **[/docs/sync/security-architecture.md](./sync/security-architecture.md)** - Security architecture
- **[/docs/API.md](./API.md)** - Backend API reference

---

## 🧪 Testing Documentation

- **[/docs/testing/README.md](./testing/README.md)** - Testing overview
- **[/docs/testing/simple-testing-guide.md](./testing/simple-testing-guide.md)** - Testing philosophy
- **[/docs/testing/uat-testing-guide.md](./testing/uat-testing-guide.md)** - User acceptance testing

---

## 🔧 Development Tools & Scripts

- **[/scripts/README.md](../scripts/README.md)** - Available scripts
- **[/docs/setup/GITHUB_CLI_SETUP.md](./setup/GITHUB_CLI_SETUP.md)** - GitHub CLI configuration

---

## 🔐 Security & Privacy

- **[/docs/sync/security-architecture.md](./sync/security-architecture.md)** - Security architecture and implementation

---

## 📋 Quick Links by Task

### "I need to deploy"
1. Start with [CLAUDE.md](../CLAUDE.md)
2. Follow [/docs/deployment/README.md](./deployment/README.md)
3. Use `./scripts/qual_deploy.sh or prod_deploy.sh` for automated deployment

### "I need to add a feature"
1. Check [DATA_STRUCTURE.md](./DATA_STRUCTURE.md) for data model
2. Review [features/field-conventions.md](./features/field-conventions.md) for naming standards
2. Review similar features (e.g., [COMPLETE_DAY_MODAL_PROMPT.md](./COMPLETE_DAY_MODAL_PROMPT.md))
3. Follow platform guidelines in platform-specific guides

### "I need to fix a bug"
1. Check [platform/README.md](./platform/README.md) for known platform issues
2. Review [QUICK_TEST_CHECKLIST.md](./QUICK_TEST_CHECKLIST.md)
3. Test on all platforms using [platform/CROSS_PLATFORM_GUIDE.md](./platform/CROSS_PLATFORM_GUIDE.md)

### "I need to understand the architecture"
1. Start with [/docs/data/data-overview.md](./data/data-overview.md) for data architecture
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