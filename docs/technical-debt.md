# Technical Debt Report

**Last Updated:** 2025-11-26
**Analysis Scope:** Full codebase review

---

## Executive Summary

StackMap has **moderate technical debt** with a few critical items requiring attention. The codebase is generally well-maintained with modern React patterns, but has accumulated complexity in key areas.

| Priority | Items | Estimated Effort |
|----------|-------|------------------|
| P0 - Critical | 2 | 2-4 weeks |
| P1 - High | 4 | 2-3 weeks |
| P2 - Medium | 5 | 1-2 weeks |
| P3 - Low | 4 | 1 week |

**Atlas Stories:**
- Phase 1 (Stability): `.claude/stories/STORY-DEBT-PHASE1-stability.md`
- Phase 2 (Deployment): `.claude/stories/STORY-DEBT-PHASE2-deployment.md`

---

## P0 - Critical Issues

### 1. App.js Monolith (6,886 lines)

**Impact:** Maintainability, testability, developer velocity
**Risk:** High - Single point of failure for entire app

The main `App.js` file has grown to 6,886 lines, handling:
- Global state management
- All modal rendering
- Routing logic
- Event handlers
- Platform-specific code

**Recommended Action:** Extract into modular components (max 500 lines each)
- Extract modal container components
- Create separate route handlers
- Move platform-specific code to utilities

**Effort:** 1-2 weeks

---

### 2. Webpack Cache Invalidation Failure (2025-08-28)

**Impact:** Deployment reliability
**Risk:** Critical - Bug fixes may not deploy despite successful builds

**Issue**: Webpack filesystem cache can silently fail to invalidate when source files change, causing old code to be bundled in production builds.

**Discovery**: During sync data loss fix, changes to `syncServiceV2.js` were not being included in production bundle despite successful builds.

**Current Mitigation**:
1. Webpack cache temporarily disabled during critical fixes
2. Added verification step: `grep -c "_justJoinedSync" web/build/bundle.*.js`
3. Clean build environment before critical deployments
4. Re-enabled cache with explicit version bumping

**Permanent Solution Needed**:
- Implement automated build verification
- Add content hash verification for critical files
- Consider switching to more reliable bundler

**Effort:** 3-5 days

**Related Files:**
- `webpack.config.js`
- `scripts/qual_deploy.sh`
- `scripts/prod_deploy.sh`

---

## P1 - High Priority

### 3. TypeScript Errors (294 errors)

**Impact:** Type safety, IDE support, refactoring confidence
**Documented:** `/docs/TYPESCRIPT_ANALYSIS.md`

| Error Type | Count | Description |
|------------|-------|-------------|
| TS2322 | 212 | Type assignment mismatch (Text component props) |
| TS2339 | 24 | Property doesn't exist |
| TS2345 | 20 | Argument type mismatch |
| TS2739/TS2741 | 27 | Missing required properties |

**Quick Wins Available:**
- File input events
- parseInt conversions
- Alert.alert style property

**Effort:** 1 week (incremental)

---

### 4. Skipped Tests (86 tests across 4 suites)

**Impact:** Test reliability, CI confidence
**Documented:** `/docs/development/backlog/S-DEBT-004.md`

**Affected Areas:**
- API authentication middleware
- API integration tests
- API validation tests
- Version utilities (hardcoded dates)

**Root Causes:**
- Infrastructure dependencies (database/redis)
- Brittle assertions
- Complex mock configuration

**Effort:** 7-11 hours

---

### 5. SonarCloud Quality Gates Failing

**Impact:** Code quality metrics, security posture
**Documented:** `/docs/development/backlog/S-DEBT-005.md`

| Rating | Current | Target |
|--------|---------|--------|
| Reliability | C | B or better |
| Security Hotspot Review | E (<30%) | C (>50%) |

**Dashboard:** https://sonarcloud.io/project/overview?id=ajstack22_stackmap

**Effort:** 3-5 days

---

### 6. Production Console.log Statements

**Impact:** Performance, log noise, potential data leaks
**Status:** Partially addressed (S-DEBT-003)

**Remaining Locations:**

| File | Count | Severity |
|------|-------|----------|
| minimalSyncService.js | 9 | HIGH |
| OnboardingUserCentered.js | 12+ | HIGH |
| useUserStore.js | 8 | HIGH |
| buildConfig.js | 7 | MEDIUM |

**Effort:** 2-3 hours

---

## P2 - Medium Priority

### 7. Large Modal Components

**Impact:** Maintainability, code reuse

| File | Lines | Issue |
|------|-------|-------|
| DataModal.js | 1,233 | Multiple features in single file |
| SettingsModal.js | 783 | Could be split |
| EditModeToolbar.js | 641 | Complex visibility logic |

**Recommended Action:** Extract sub-components

**Effort:** 3-5 days

---

### 8. Sync Service Complexity

**Impact:** Debugging difficulty, error handling

| File | Lines | Issue |
|------|-------|-------|
| syncStoreIntegration.js | 1,291 | Heavy try-catch blocks (35+) |
| minimalSyncService.js | 1,031 | Duplicated fetch patterns |
| conflictResolver.js | 730 | Complex merge algorithms |

**Recommended Action:**
- Create `fetchUtils.js` to eliminate try-catch duplication
- Create `mergeUtils.js` for conflict resolution logic

**Effort:** 1 week

---

### 9. SonarCloud Critical Complexity Issues (5 remaining)

**Documented:** `/docs/development/backlog/sonarcloud-critical-issues-batch-2.md`

| File | Line | Complexity | Limit |
|------|------|------------|-------|
| DataImport.js | 89 | 24 | 15 |
| fileProcessingUtils.js | 305 | 18 | 15 |
| syncOperationUtils.js | 415 | 17 | 15 |
| ImportConfirmation.js | 42 | 17 | 15 |
| CategoryActions.js | 221 | >4 nesting | 4 |

**Effort:** 2-3 days

---

### 10. Test Coverage Gaps

**Impact:** Regression risk, refactoring confidence

**Major Components WITHOUT Tests (12):**
1. ActivityCard - Core UI component
2. Onboarding - Critical user flow
3. TimePicker - Date/time feature
4. Toast - Notifications
5. CelebrationManager
6. Header
7. SyncBlockingIndicator
8. SyncProgress
9. SyncStatusIndicator
10. ShareView
11. TabbedModal
12. ModalUtilities

**Coverage Threshold:** Currently 50% (industry-low)

**Effort:** 1-2 weeks (incremental)

---

### 11. No E2E Testing Framework

**Impact:** Cross-platform regression risk

**Current State:** No Cypress, Playwright, or Detox configured
**Risk:** UI regressions not caught automatically

**Effort:** 1 week to set up basic framework

---

## P3 - Low Priority

### 12. Legacy Z-Index Constants

**File:** `/src/constants/zIndex.js:90`
**Status:** Deprecated, backward compatibility layer exists

**Action:** Remove `LEGACY_Z_INDEX` when legacy code migrated

**Effort:** 1-2 hours

---

### 13. TODO Comments (15 total)

**Documented:** `/docs/development/backlog/S-DEBT-001.md`
**Notable:** Play Store Developer ID placeholder in `scripts/deploy/app-config.sh`

**Effort:** 2-3 hours

---

### 14. ESLint Disable Comments (17 total)

**Status:** All justified with inline explanations
**Categories:** Security regex patterns (7), secret detection (5)

**Action:** Periodic review to ensure still needed

**Effort:** 1 hour

---

### 15. Duplicate Code Patterns

**Areas:**
- Try-catch error handling in sync services
- Storage/AsyncStorage access patterns
- URL construction patterns

**Recommended Action:** Extract to utilities when touching these files

**Effort:** Opportunistic

---

## Positive Findings

The codebase has several strengths:

- **Modern Architecture:** All functional components with hooks (no class components except error boundaries)
- **Good Documentation:** Comprehensive JSDoc with @ts-check annotations
- **Justified Disables:** All ESLint disables have explanations
- **Service Separation:** Clean separation between sync, API, and stores
- **Optimization:** Good use of React.memo
- **No Deprecated Patterns:** No componentWillMount or UNSAFE_ lifecycle methods

---

## Recommended Prioritization Roadmap

**Focus: Stability First**

### Phase 1: Critical Stability (Immediate)
1. **Fix Webpack cache invalidation** - Deployment reliability
2. **Remove production console.logs** - Performance and security
3. **Fix skipped tests (quick wins)** - CI reliability
   - Start with version.test.js (hardcoded dates)
   - Then API mock setup issues

### Phase 2: Deployment Confidence
4. **Address SonarCloud quality gates** - Unblock deployments
5. **Fix TypeScript quick wins** - File input, parseInt, Alert.alert
6. **Add tests for ActivityCard** - Core component coverage

### Phase 3: Maintainability
7. **Begin App.js extraction** - Start with modal containers
8. **Extract DataModal sub-components** - Reduce complexity
9. **Continue TypeScript migration** - Incremental approach

### Phase 4: Long-term Quality
10. Set up basic E2E framework
11. Increase coverage threshold to 75%
12. Address remaining complexity issues

---

## Reference Documentation

| Document | Path |
|----------|------|
| TypeScript Analysis | `/docs/TYPESCRIPT_ANALYSIS.md` |
| Troubleshooting | `/TROUBLESHOOTING.md` |
| Store Architecture | `/docs/STORE_ARCHITECTURE.md` |
| Debt Backlog | `/docs/development/backlog/S-DEBT-*.md` |
| SonarCloud Issues | `/docs/development/backlog/sonarcloud-critical-issues-batch-2.md` |

---

## Resolution Template

When resolving technical debt, update the entry with:
- **Resolved Date**: YYYY-MM-DD
- **Solution**: Brief description of the fix
- **PR/Commit**: Link to the pull request or commit hash
