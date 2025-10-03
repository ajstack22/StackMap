# Testing Strategy - StackMap

## Overview

StackMap uses a **tiered testing approach** that separates critical tests (must pass) from non-critical tests (can be flaky). This enables safer production deployments while maintaining code quality.

**Goal:** Deploy confidently when critical paths work, even if some UI tests are flaky.

---

## Test Execution Tiers

### Quick Reference

| Tier | Purpose | Pass Rate | Blocks Deploy? | Run Time |
|------|---------|-----------|----------------|----------|
| **Smoke** | Sanity check | 100% | ✅ Yes | ~10s |
| **Critical** | Security, data | 100% | ✅ Yes | ~30s |
| **Important** | Core features | 95%+ | ⚠️ Warning | ~2min |
| **UI** | Rendering, UX | Best effort | ❌ No | ~3min |

---

## Commands

### Development Workflow

```bash
# Quick sanity check before commit (10s)
npm run test:smoke

# Watch critical tests while coding security features
npm run test:watch:critical

# Watch important tests while coding features
npm run test:watch:important

# Run all tests locally (full suite)
npm test
```

### CI/Deployment Workflow

The deployment script (`./scripts/qual_deploy.sh`) automatically runs:

1. **Smoke Test** (10s) - Fast sanity check
2. **Critical Test** (30s) - Must pass 100% or deployment blocks
3. **Important Test** (2min) - Warns if below 95% pass rate
4. **UI Test** (3min) - Informational only, failures don't block

### Manual Health Check

```bash
# Get test suite health report
./scripts/test-health-report.sh

# Get detailed breakdown of failures
./scripts/test-health-report.sh --verbose
```

### Coverage Analysis

```bash
# Check critical code coverage (80% threshold)
npm run test:coverage:critical

# Check all code coverage
npm run test:coverage
```

---

## When to Use Each Tier

### Use `test:smoke` when:
- Quick sanity check before commit
- Pre-deployment fast validation
- Post-merge verification
- Debugging if basic functionality works

**What it tests:** Core encryption, secure storage, and basic sync operations

### Use `test:critical` when:
- Before opening PR
- In deployment pipeline (blocks on failure)
- After fixing security issues
- When changing encryption or sync logic

**What it tests:** All security-critical code (encryption, secure storage, sync, conflict resolution, recovery)

### Use `test:important` when:
- Running full test suite locally
- Weekly test health check
- Investigating coverage gaps
- When changing stores or data processing

**What it tests:** State management, data normalization, import/export, API logic

### Use `test:ui` when:
- Working on UI components
- Debugging test failures
- Improving test coverage
- When changing component rendering

**What it tests:** Component rendering, integration tests, workflows, constants

---

## Test Categories

### Tier 0: Smoke (Ultra-Fast Sanity)
**Pattern:** `(encryptionService|secureStorage|minimalSync)` with test names containing `(encrypt|decrypt|sync)`

- Basic encryption/decryption
- Secure storage availability
- Minimal sync operations

**Total:** ~1-5 tests, <10 seconds

---

### Tier 1: Critical (Must Pass 100%)
**Pattern:** `(encryption|secureStorage|secureId|minimalSync|conflictResolver|syncDeterministic|syncDataTransformation|recoveryPhrase)`

**Security & Encryption:**
- ✅ `services/sync/__tests__/encryptionService.test.js`
- ✅ `services/sync/__tests__/encryptionService.integration.test.js`
- ✅ `utils/__tests__/secureStorage.test.js`
- ✅ `utils/__tests__/secureId.test.js`

**Sync & Data Integrity:**
- ✅ `services/sync/__tests__/minimalSyncService.test.js`
- ✅ `services/sync/__tests__/conflictResolver.test.js`
- ✅ `services/sync/__tests__/syncDeterministicLogic.test.js`
- ✅ `services/sync/__tests__/syncDataTransformation.test.js`

**Recovery:**
- ✅ `utils/__tests__/recoveryPhraseUtils.test.js`
- ✅ `components/Modals/DataModal/__tests__/RecoveryPhrase.test.js`

**Total:** ~10-12 test suites (~294 tests), ~30-60 seconds

---

### Tier 2: Important (95%+ Pass Rate)
**Pattern:** `(stores/__tests__|dataNormalizer|importExportValidation|fileProcessingUtils|activityCrudLogic|fieldAccessors|syncQueue|syncOperation|services/api/dev/tests/unit|rateLimit)`

**State Management:**
- ⚠️ `stores/__tests__/useAppStore.test.js`
- ⚠️ `stores/__tests__/useLibraryStore.test.js`
- ⚠️ `stores/__tests__/useSettingsStore.test.js`
- ⚠️ `stores/__tests__/useUserStore.test.js`
- ⚠️ `stores/__tests__/store.integration.test.js`
- ⚠️ `stores/__tests__/integration.test.js`

**Data Processing:**
- ⚠️ `utils/__tests__/dataNormalizer.test.js`
- ⚠️ `utils/__tests__/importExportValidation.test.js`
- ⚠️ `utils/__tests__/fileProcessingUtils.test.js`
- ⚠️ `utils/__tests__/activityCrudLogic.test.js`
- ⚠️ `utils/__tests__/fieldAccessors.test.js`

**Sync Operations:**
- ⚠️ `services/sync/__tests__/syncQueueManagement.test.js`
- ⚠️ `utils/__tests__/syncOperationUtils.test.js`

**API Unit Tests:**
- ⚠️ `services/api/dev/tests/unit/auth.test.js`
- ⚠️ `services/api/dev/tests/unit/healthController.test.js`
- ⚠️ `services/api/dev/middleware/__tests__/rateLimit.test.js`

**Total:** ~15-20 test suites (~581 tests), ~2-5 minutes

---

### Tier 3: UI/Integration (Flaky Allowed)
**Pattern:** `(components/.*/__tests__|__tests__/workflows|services/api/dev/tests/integration|constants/__tests__)`

**Components:**
- ℹ️ ActivityLibrary (16 test files)
- ℹ️ EditModeList, EditModeToolbar
- ℹ️ EmojiPicker, FAB, Logo, Typography
- ℹ️ Modals (DataExport, DataImport, SyncManagement)

**Integration:**
- ℹ️ `__tests__/workflows/helperFlow.regression.test.js`
- ℹ️ `__tests__/workflows/userJourneys.integration.test.js`
- ℹ️ `services/api/dev/tests/integration/*.test.js`

**Constants:**
- ℹ️ `constants/__tests__/*.test.js` (animations, colors, layout, spacing, theme, zIndex)

**Total:** ~45-50 test suites (~949 tests), ~2-3 minutes

---

## Adding New Tests

### Decision Tree

**1. Does it test encryption, secure storage, or sync core logic?**
→ **Tier 1 (Critical)** - Add to critical pattern, must pass 100%

**2. Does it test state management, data normalization, or core CRUD?**
→ **Tier 2 (Important)** - Add to important pattern, should pass 95%+

**3. Does it test UI components, workflows, or integration?**
→ **Tier 3 (UI)** - Add to UI pattern, best effort

### Example: Adding a New Critical Test

```javascript
// File: services/sync/__tests__/newEncryptionAlgorithm.test.js
// Automatically included in test:critical via pattern match

describe('New Encryption Algorithm', () => {
  test('should encrypt with new algorithm', () => {
    // This will be required to pass for deployment
  });
});
```

The test is automatically included because the file path matches the pattern `encryption`.

### Example: Adding a New UI Test

```javascript
// File: components/NewFeature/__tests__/NewFeature.test.js
// Automatically included in test:ui via pattern match

describe('NewFeature Component', () => {
  test('should render correctly', () => {
    // Failures won't block deployment
  });
});
```

---

## Deployment Behavior

### What Blocks Deployment?

**Only Tier 0 (Smoke) and Tier 1 (Critical) failures block deployment.**

If critical tests fail:
```
❌ CRITICAL TESTS FAILED!
Critical tests must pass 100%. Fix immediately: npm run test:critical
[Deployment stops]
```

### What Shows Warnings?

**Tier 2 (Important) shows warnings if pass rate < 95%, but doesn't block.**

Example:
```
⚠️  Important test pass rate: 92% (below 95% threshold)
   550 passed, 31 failed
   Consider fixing before next deployment
[Deployment continues]
```

### What's Informational?

**Tier 3 (UI) failures are logged but don't affect deployment.**

Example:
```
⚠️  UI tests: 949 passed, 1 failed (non-blocking)
[Deployment continues]
```

---

## Test Health Monitoring

### Weekly Health Check

Run the health report to see overall test status:

```bash
./scripts/test-health-report.sh
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║         StackMap Test Suite Health Report                 ║
╟────────────────────────────────────────────────────────────╢
║ Tier 0 (Smoke Test):                                      ║
║   ✅ 1 passed, 0 failed (100%)                            ║
║                                                            ║
║ Tier 1 (Critical - Security & Data):                      ║
║   ✅ 294 passed, 0 failed (100%)                          ║
║                                                            ║
║ Tier 2 (Important - Core Features):                       ║
║   ✅ 581/581 passed (100%)                                ║
║                                                            ║
║ Tier 3 (UI/Integration):                                  ║
║   ℹ️  949 passed, 1 failed (informational)                ║
╟────────────────────────────────────────────────────────────╢
║ Overall Status:                                            ║
║   ✅ HEALTHY - Safe to deploy                             ║
╚════════════════════════════════════════════════════════════╝
```

### Fixing Degraded Tests

**If Tier 1 (Critical) fails:**
1. Stop all work immediately
2. Fix the critical test
3. Verify with `npm run test:critical`
4. Do NOT deploy until 100% pass rate

**If Tier 2 (Important) drops below 95%:**
1. Investigate failures with `npm run test:important`
2. Prioritize fixes in next sprint
3. Can still deploy if critical tests pass

**If Tier 3 (UI) has failures:**
1. Review if it's a real bug or test environment issue
2. Fix when convenient
3. No urgency unless many tests fail

---

## Coverage Goals

| Tier | Coverage Goal | Enforcement |
|------|---------------|-------------|
| Critical | 80%+ | Enforced by `test:coverage:critical` |
| Important | 70%+ | Recommended |
| UI | 50%+ | Best effort |
| Overall | 40%+ | Tracked |

---

## Troubleshooting

### "Smoke test failed but critical tests pass"

The smoke test is a **subset** of critical tests. If smoke fails, critical will also fail. Check:
```bash
npm run test:smoke -- --verbose
```

### "Important tests pass locally but fail in CI"

Likely a timing or environment issue. Check:
1. Are you using the same Node version?
2. Are there any race conditions?
3. Run with `--maxWorkers=1` to see if it's parallelization

### "UI tests are very flaky"

This is expected! UI tests may fail due to:
- Test environment limitations
- Timing issues
- Animation/rendering differences

Solution: Review if it's a real bug. If it's a test environment issue, the failure won't block deployment.

### "All tests pass locally but deployment fails"

Check the deployment logs:
```bash
cat /tmp/test-smoke.txt
cat /tmp/test-critical.txt
cat /tmp/test-important.txt
```

---

## Migration from Old System

### Old System (100% Pass Required)
- **Problem:** Flaky UI tests blocked valid deployments
- **Result:** 39 test suites skipped (32.5%), poor visibility

### New System (Tiered)
- **Smoke:** 1 test suite, <10s
- **Critical:** 10 test suites, 100% required
- **Important:** 15 test suites, 95%+ recommended
- **UI:** 45 test suites, failures allowed

**Result:** Deploy safely with confidence in critical paths, while acknowledging test environment limitations.

---

## Quick Commands Cheat Sheet

```bash
# Development
npm run test:smoke                  # 10s sanity check
npm run test:critical               # 30s critical tests
npm run test:important              # 2min important tests
npm run test:ui                     # 3min UI tests
npm test                            # Full suite

# Watch mode
npm run test:watch:critical         # Watch critical tests
npm run test:watch:important        # Watch important tests

# Coverage
npm run test:coverage:critical      # Critical code coverage (80% threshold)
npm run test:coverage               # All code coverage

# Health check
./scripts/test-health-report.sh     # Test suite health report
./scripts/test-health-report.sh -v  # Verbose with failure details

# Deployment (automatic tiered testing)
./scripts/qual_deploy.sh            # Runs all tiers, blocks on critical failures
```

---

## Related Documentation

- [Test Tier Categories](./TEST_TIERS.md) - Detailed test categorization
- [Deployment Guide](./deployment/README.md) - Full deployment process
- [Simple Testing Guide](./testing/simple-testing-guide.md) - Testing basics

---

*Last Updated: 2025-10-02*
*StackMap-specific testing strategy*
