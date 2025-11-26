# Test Tier Categorization - StackMap

## Test Execution Tiers

### Quick Reference

| Tier | Purpose | Pass Rate | Blocks Deploy? | Run Time |
|------|---------|-----------|----------------|----------|
| **Smoke** | Sanity check | 100% | ✅ Yes | ~10s |
| **Critical** | Security, data, sync | 100% | ✅ Yes | ~30s |
| **Important** | Core features, stores | 95%+ | ⚠️ Warning | ~2min |
| **UI** | Components, integration | Best effort | ❌ No | ~3min |

---

## Tier 1: Critical (Must Pass 100%)
**Deployment blocks if ANY test fails**

### Security & Encryption (Most Critical)
- ✅ `services/sync/__tests__/encryptionService.test.js`
- ✅ `services/sync/__tests__/encryptionService.integration.test.js`
- ✅ `utils/__tests__/secureStorage.test.js`
- ✅ `utils/__tests__/secureId.test.js`

### Sync & Data Integrity
- ✅ `services/sync/__tests__/minimalSyncService.test.js`
- ✅ `services/sync/__tests__/conflictResolver.test.js`
- ✅ `services/sync/__tests__/syncDeterministicLogic.test.js`
- ✅ `services/sync/__tests__/syncDataTransformation.test.js`

### Recovery & Backup
- ✅ `utils/__tests__/recoveryPhraseUtils.test.js`
- ✅ `components/Modals/DataModal/__tests__/RecoveryPhrase.test.js`

**Total Critical Tests:** ~10-12 test suites (~30-50 individual tests)

---

## Tier 2: Important (95%+ Pass Rate)
**Warning if below threshold, but doesn't block**

### State Management
- ⚠️ `stores/__tests__/useAppStore.test.js`
- ⚠️ `stores/__tests__/useLibraryStore.test.js`
- ⚠️ `stores/__tests__/useSettingsStore.test.js`
- ⚠️ `stores/__tests__/useUserStore.test.js`
- ⚠️ `stores/__tests__/store.integration.test.js`
- ⚠️ `stores/__tests__/integration.test.js`

### Data Processing & Validation
- ⚠️ `utils/__tests__/dataNormalizer.test.js`
- ⚠️ `utils/__tests__/importExportValidation.test.js`
- ⚠️ `utils/__tests__/fileProcessingUtils.test.js`
- ⚠️ `utils/__tests__/activityCrudLogic.test.js`
- ⚠️ `utils/__tests__/fieldAccessors.test.js`

### Sync Queue & Operations
- ⚠️ `services/sync/__tests__/syncQueueManagement.test.js`
- ⚠️ `utils/__tests__/syncOperationUtils.test.js`

### API Unit Tests
- ⚠️ `services/api/dev/tests/unit/auth.test.js`
- ⚠️ `services/api/dev/tests/unit/healthController.test.js`
- ⚠️ `services/api/dev/middleware/__tests__/rateLimit.test.js`

**Total Important Tests:** ~15-20 test suites

---

## Tier 3: UI/Integration (Flaky Allowed)
**Failures logged but don't block deployment**

### Component Tests
- ℹ️ `components/EditModeList/__tests__/*.test.js`
- ℹ️ `components/EditModeToolbar/__tests__/EditModeToolbar.test.js`
- ℹ️ `components/EmojiPicker/__tests__/*.test.js`
- ℹ️ `components/Modals/DataModal/__tests__/DataExport.test.js`
- ℹ️ `components/Modals/DataModal/__tests__/DataImport.test.js`
- ℹ️ `components/Modals/DataModal/__tests__/SyncManagement.test.js`
- ℹ️ `components/Typography/__tests__/Typography.test.js`
- ℹ️ `components/FAB/__tests__/FAB.test.js`
- ℹ️ `components/Logo/__tests__/Logo.test.js`

### Integration & Workflow Tests
- ℹ️ `__tests__/workflows/helperFlow.regression.test.js`
- ℹ️ `__tests__/workflows/userJourneys.integration.test.js`
- ℹ️ `services/api/dev/tests/integration/*.test.js` (5 files)

### Constants & Theme Tests
- ℹ️ `constants/__tests__/*.test.js` (7 files)

**Total UI/Integration Tests:** ~45-50 test suites

---

## Pattern Matching for Jest

### Critical Pattern
```
(encryption|secureStorage|secureId|minimalSync|conflictResolver|syncDeterministic|syncDataTransformation|recoveryPhrase)
```

### Important Pattern
```
(stores/__tests__|dataNormalizer|importExportValidation|fileProcessingUtils|activityCrudLogic|fieldAccessors|syncQueue|syncOperation|services/api/dev/tests/unit|rateLimit)
```

### UI Pattern
```
(components/.*/__tests__|__tests__/workflows|services/api/dev/tests/integration|constants/__tests__)
```

---

## Adding New Tests

**Decision Tree:**

1. **Does it test encryption, secure storage, or sync core logic?**
   → **Tier 1 (Critical)** - Must pass 100%

2. **Does it test state management, data normalization, or core CRUD operations?**
   → **Tier 2 (Important)** - Should pass 95%+

3. **Does it test UI components, workflows, or integration scenarios?**
   → **Tier 3 (UI)** - Best effort

**Example:**
```javascript
// NEW: Critical test (encryption)
// File: services/sync/__tests__/newEncryption.test.js
// Automatically included in test:critical via pattern match

describe('New Encryption Feature', () => {
  test('should encrypt with new algorithm', () => {
    // This will be required to pass for deployment
  });
});
```

---

## Current Status

**Total Test Files:** 77
- **Critical:** ~12 files (16%)
- **Important:** ~15 files (19%)
- **UI/Integration:** ~50 files (65%)

**Coverage Distribution:**
- Critical code should aim for 80%+ coverage
- Important code should aim for 70%+ coverage
- UI code at 50%+ is acceptable

---

*Last Updated: 2025-10-02*
*StackMap-specific test tier configuration*
