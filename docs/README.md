# StackMap Documentation

Welcome to the StackMap documentation. This guide will help you navigate our comprehensive documentation structure.

## 🚀 Quick Start

**For new developers:** Start with [Onboarding → New Developer Guide](./onboarding/new-developer-guide.md)

**For deployment:** See [Deployment Guide](./deployment/README.md) or just run:
```bash
./scripts/qual_deploy.sh or prod_deploy.sh
```

## 📦 Family Rebuild Handoff (Aug 2026)

**Planning the native Android rebuild?** Start with the [Handoff Package](./handoff/README.md) — a verified-against-code blueprint for rebuilding StackMap as a Kotlin/Compose, Android-only, family-focused app with local backup (no sync, no store). It supersedes the rest of this tree for that effort.

## 📚 Documentation Structure

### Core Documentation

#### [🚢 Deployment](./deployment/)
Everything you need to deploy StackMap to all platforms.
- **Start here:** [Deployment Guide](./deployment/README.md)
- Quick command: `./scripts/qual_deploy.sh or prod_deploy.sh`

#### [🔄 Sync System](./sync/)
Complete documentation for the zero-knowledge sync system.
- **Start here:** [Sync Overview](./sync/README.md)
- [API Reference](./sync/SYNC_API_REFERENCE.md)
- [Troubleshooting](./sync/troubleshooting.md)

#### [📱 Platform Guides](./platform/)
Platform-specific development guides and gotchas.
- **Start here:** [Platform Overview](./platform/README.md)
- [iOS Guide](./platform/ios/README.md)
- [Android Guide](./platform/android/README.md)
- [Web/PWA Guide](./platform/web/README.md)
- [Cross-Platform Guide](./platform/CROSS_PLATFORM_GUIDE.md)

#### [✨ Features](./features/)
Implementation guides for StackMap features.
- **Start here:** [Features Overview](./features/README.md)
- **CRITICAL:** [Field Conventions](./features/field-conventions.md)
- [Edit Mode](./features/edit-mode-refactor.md)
- [Activity Library](./features/activity-library-system.md)
- [Import/Export](./features/import-export-system.md)

#### [🧪 Testing](./testing/)
Testing guides and protocols.
- **Start here:** [Testing Overview](./testing/README.md)
- [Simple Testing Philosophy](./testing/simple-testing-guide.md)
- [Cross-Platform Testing](./testing/cross-platform-testing.md)

#### [🎓 Onboarding](./onboarding/)
Documentation for developers and users.
- **Start here:** [Onboarding Overview](./onboarding/README.md)
- [New Developer Guide](./onboarding/new-developer-guide.md)
- [User Onboarding System](./onboarding/user-onboarding-system.md)

### Architecture & Data

- [📊 Data Structure](./DATA_STRUCTURE.md) - Complete data model documentation
- [🏗️ Store Architecture](./STORE_ARCHITECTURE.md) - State management with Zustand
- [🔧 API Documentation](./API.md) - Backend API reference
- [🏛️ Overall Architecture](./ARCHITECTURE.md) - System architecture overview

### Development Guides

- [💻 Development Guide](./DEVELOPMENT.md) - Local development setup
- [🔍 Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [📝 TypeScript Analysis](./TYPESCRIPT_ANALYSIS.md) - Migration status

## ⚠️ Critical Information

### Field Naming Standards (CRITICAL)
- **Activities:** Use `text` (not name/title), `icon` (not emoji)
- **Users:** Use `icon` (not emoji), `name` as string only
- **See:** [Field Conventions](./features/field-conventions.md)

### Platform Gotchas
- **iOS:** AsyncStorage causes freezes (debounced), NetInfo disabled
- **Android:** Must use font variants (not fontWeight), Java 17 required
- **Web:** Alert.alert not supported (use ConfirmModal)
- **See:** [Platform Guides](./platform/)

### Store Updates
Always use store-specific methods:
- `useUserStore.getState().setUsers()`
- `useSettingsStore.getState().updateSettings()`
- Never use generic `setState()`

## 🔍 Finding Information

### By Task
- **Deploying:** [Deployment Guide](./deployment/README.md)
- **Debugging Sync:** [Sync Troubleshooting](./sync/troubleshooting.md)
- **Platform Issue:** [Platform Guides](./platform/)
- **Adding Feature:** [Features Guide](./features/)
- **Testing:** [Testing Guide](./testing/)

### By Platform
- **iOS Issues:** [iOS Guide](./platform/ios/README.md)
- **Android Issues:** [Android Guide](./platform/android/README.md)
- **Web Issues:** [Web Guide](./platform/web/README.md)

### Quick Commands
```bash
# Deploy everything
./scripts/qual_deploy.sh or prod_deploy.sh

# Run tests
npm run test:simple

# Type check
npm run typecheck

# Start development
npm start  # Mobile
npm run web  # Web
```

## 📋 Documentation Index
For a complete list of all documentation files, see [MD_FILES_INDEX.md](./MD_FILES_INDEX.md)

---

**Last Updated:** January 2025

**Remember:** When in doubt, check [CLAUDE.md](../CLAUDE.md) for essential development guidelines.