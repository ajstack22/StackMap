# StackMap Features Documentation

This directory contains comprehensive documentation for StackMap's features, including implementation details, design specifications, and developer guidance.

## Contents

### Core Features
- [**field-conventions.md**](./field-conventions.md) - CRITICAL field naming standards for data consistency
- [**activity-library-system.md**](./activity-library-system.md) - Library system for saving and reusing activities
- [**import-export-system.md**](./import-export-system.md) - Data import/export functionality
- [**starter-cards.md**](./starter-cards.md) - Onboarding and discovery card system

### User Interface Features
- [**edit-mode-refactor.md**](./edit-mode-refactor.md) - New unified edit mode implementation
- [**typography-system.md**](./typography-system.md) - Typography and font system

### Integration Features
- [**sync-system.md**](../sync/README.md) - Cross-device synchronization (see /docs/sync/)

## Quick Reference

### For Developers
- **Working with data?** Start with [field-conventions.md](./field-conventions.md)
- **Implementing edit mode?** See [edit-mode-refactor.md](./edit-mode-refactor.md)
- **Adding import/export?** Check [import-export-system.md](./import-export-system.md)

### Key Design Principles
1. **Consistent field naming** - Always use `text` and `icon` for activities
2. **Cross-platform compatibility** - Features must work on iOS, Android, and Web
3. **Accessibility first** - High contrast, large touch targets, screen reader support
4. **Progressive disclosure** - Complex features available but not overwhelming

## Testing Requirements

All features must be tested across:
- [ ] iOS (phone and tablet)
- [ ] Android (phone and tablet)
- [ ] Web (desktop and mobile)
- [ ] Sync scenarios (if applicable)
- [ ] Import/export compatibility
- [ ] Accessibility compliance