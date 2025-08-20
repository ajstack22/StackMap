# 📚 StackMap Documentation Index

> **Last Updated**: 2025-08-14  
> **Purpose**: Central index for all active documentation to prevent confusion and ensure easy discovery

---

## 🚨 Critical Documentation (Start Here!)

### 📊 Data Specifications (CANONICAL - Updated 2025-08-14)
- **[/docs/data/data-dictionary.md](./data/data-dictionary.md)** - 🔴 Canonical data structures & field definitions
- **[/docs/data/data-overview.md](./data/data-overview.md)** - Architecture overview & compliance checklist
- **[/docs/sync/data-sync-service.md](./sync/data-sync-service.md)** - Zero-knowledge sync implementation
- **[/docs/data/data-import-service.md](./data/data-import-service.md)** - Import procedures & normalization
- **[/docs/data/data-export-service.md](./data/data-export-service.md)** - Export formats & sanitization
- **[/docs/data/data-reset-service.md](./data/data-reset-service.md)** - Reset operations & recovery

### Deployment & Infrastructure
- **[CLAUDE.md](./CLAUDE.md)** - 🔴 THE deployment truth - read this first!
- **[/prompts/deployment.md](/prompts/deployment.md)** - Comprehensive deployment guide

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
- **[STORE_ARCHITECTURE.md](./STORE_ARCHITECTURE.md)** - Store system architecture
- **[architecture/SYSTEM_ARCHITECTURE.md](./architecture/SYSTEM_ARCHITECTURE.md)** - Overall system design

### Component Systems
- **[docs/CARD_LIBRARY_SYSTEM.md](./docs/CARD_LIBRARY_SYSTEM.md)** - Activity card system
- **[docs/COMPONENT_INTERACTION_DIAGRAMS.md](./docs/COMPONENT_INTERACTION_DIAGRAMS.md)** - Component relationships

---

## 📱 Platform-Specific Guides

### Consolidated Platform Documentation (Updated 2025-08-20)
- **[platform/README.md](./platform/README.md)** - 🔴 Platform documentation index
- **[platform/CROSS_PLATFORM_GUIDE.md](./platform/CROSS_PLATFORM_GUIDE.md)** - Cross-platform development patterns
- **[platform/ios/README.md](./platform/ios/README.md)** - Complete iOS development guide
- **[platform/android/README.md](./platform/android/README.md)** - Complete Android development guide
- **[platform/web/README.md](./platform/web/README.md)** - Complete Web/PWA development guide

### Legacy Platform Files (Still Active)
- **[android/SECURE_SIGNING_SETUP.md](./android/SECURE_SIGNING_SETUP.md)** - Signing configuration
- **[android/CREATE_KEYSTORE.md](./android/CREATE_KEYSTORE.md)** - Keystore creation

---

## 🔄 Sync & API Documentation

- **[api/sync/README.md](./api/sync/README.md)** - Sync system overview
- **[docs/sync/README.md](./sync/README.md)** - Comprehensive sync system documentation
- **[docs/sync/SYNC_API_REFERENCE.md](./sync/SYNC_API_REFERENCE.md)** - API endpoints
- **[docs/sync/ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md](./sync/ZERO_KNOWLEDGE_SYNC_ARCHITECTURE.md)** - Security architecture

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
- **[docs/sync/SYNC_SECURITY_IMPLEMENTATION_GUIDE.md](./sync/SYNC_SECURITY_IMPLEMENTATION_GUIDE.md)** - Sync security implementation

---

## 📋 Quick Links by Task

### "I need to deploy"
1. Start with [CLAUDE.md](./CLAUDE.md)
2. Follow [/prompts/deployment.md](/prompts/deployment.md)
3. Use `./scripts/deploy-all.sh` for automated deployment

### "I need to add a feature"
1. Check canonical data docs in [/docs/data/](./data/)
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