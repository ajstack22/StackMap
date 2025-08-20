# StackMap Testing Documentation

This directory contains comprehensive testing documentation, guides, and protocols for StackMap development.

## Contents

### Testing Guides
- [**simple-testing-guide.md**](./simple-testing-guide.md) - Philosophy and approach to testing in StackMap
- [**import-export-qa-guide.md**](./import-export-qa-guide.md) - Step-by-step QA testing for import/export features
- [**uat-testing-guide.md**](./uat-testing-guide.md) - User acceptance testing procedures

### Testing Protocols
- [**testing-checklist.md**](./testing-checklist.md) - Pre-deployment testing checklist
- [**cross-platform-testing.md**](./cross-platform-testing.md) - Platform-specific testing requirements

## Quick Reference

### For Developers
- **New to testing?** Start with [simple-testing-guide.md](./simple-testing-guide.md)
- **Testing import/export?** See [import-export-qa-guide.md](./import-export-qa-guide.md)
- **Pre-deployment?** Use [testing-checklist.md](./testing-checklist.md)

### Testing Philosophy
StackMap follows a "test what actually breaks" philosophy:
- **Smoke tests** for critical functionality
- **Manual testing** for user flows
- **Automated tests** for deployment blockers
- **Performance testing** for large datasets

## Platform Testing Matrix

| Feature | iOS Phone | iOS Tablet | Android Phone | Android Tablet | Web Desktop | Web Mobile |
|---------|-----------|------------|---------------|----------------|-------------|------------|
| Core App | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Mode | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sync | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Import/Export | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Onboarding | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Automated Testing

### Running Tests
```bash
# All tests
npm test

# Specific test suites
npm test -- --testNamePattern="sync"
npm test -- --testNamePattern="import"

# With coverage
npm test -- --coverage
```

### Test Scripts
```bash
# Quick smoke tests
./scripts/test-sync-fast.sh

# Full mobile test suite
./scripts/run-mobile-tests.sh
```

## Manual Testing Priorities

### P1 - Critical (Must Test)
- App launches successfully
- User can complete activities
- Sync works between devices
- Import/export preserves data
- Edit mode doesn't break data

### P2 - Important (Should Test)
- All themes work correctly
- Onboarding flows complete
- Library system functions
- Performance with 100+ activities

### P3 - Nice to Have (Can Test)
- Edge cases and error states
- Accessibility compliance
- Advanced features
- Visual polish

## Testing Environment Setup

### Prerequisites
- iOS Simulator (Xcode)
- Android Emulator (Android Studio)
- Modern web browsers (Chrome, Firefox, Safari)
- Test data files
- Multiple devices for sync testing

### Test Data
- Sample activity files
- Legacy import files
- Large datasets (100+ activities)
- Corrupted data files for error testing

## Deployment Testing

All deployments automatically run:
```bash
./scripts/deploy-all.sh  # Includes automated tests
```

To skip tests in emergency:
```bash
./scripts/deploy-all.sh --skip-tests
```

## Performance Testing

### Benchmarks
- App launch: < 3 seconds
- Activity completion: < 100ms
- Sync operation: < 10 seconds
- Large list rendering: < 2 seconds
- Edit mode loading: < 1 second

### Test with Large Datasets
- 100+ activities
- 10+ users
- Complex nested data
- Long activity descriptions
- Many library items

## Accessibility Testing

### Requirements
- Screen reader compatibility
- High contrast support
- Large text support
- Keyboard navigation (web)
- Minimum touch targets (44px)

### Tools
- iOS VoiceOver
- Android TalkBack
- Web screen readers
- Color contrast analyzers
- Accessibility audits

## Related Documentation
- [Simple Testing Guide](./simple-testing-guide.md)
- [Deployment Guide](../deployment/README.md)
- [Platform Testing](../platform/README.md)