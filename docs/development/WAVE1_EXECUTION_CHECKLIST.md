# Wave 1 Execution Checklist
**Production Blocker Fixes - 3-4 Hours**

Use this checklist to track Wave 1 execution progress.

---

## Pre-Flight Checks

- [ ] Read `/PRODUCTION_READINESS_SUMMARY.md` (5 min)
- [ ] Read `/docs/development/PRE_PRODUCTION_CLEANUP_PLAN.md` sections 1.1-1.3 (10 min)
- [ ] Create branch: `git checkout -b cleanup/wave-1-prod-blockers`
- [ ] Verify current status:
  ```bash
  npm run typecheck    # Should show 10 errors
  npm test             # Should pass (100%)
  npm run lint | tail  # Should show 1,197 warnings
  git status           # Should show 13 modified files
  ```

---

## Task 1: Fix TypeScript Errors (15 minutes)

**Priority**: P0 - CRITICAL
**File**: `src/components/Modals/DataModal/DataModal.js`
**Atlas Workflow**: Quick

### Steps
- [ ] Open `src/components/Modals/DataModal/DataModal.js`
- [ ] Find `ActiveShareCard` component (around line 34)
- [ ] Add JSDoc above component:
  ```javascript
  /**
   * @param {Object} props
   * @param {Object} props.share - Share object with shareId, recipientName, expiresAt
   * @param {Function} props.onDelete - Callback to delete share
   * @param {Object} props.styles - Style object from parent
   */
  ```
- [ ] Find `UserSharesList` component (around line 67)
- [ ] Add JSDoc above component:
  ```javascript
  /**
   * @param {Object} props
   * @param {string} props.userId - User ID
   * @param {Object} props.user - User object
   * @param {Array} props.shares - Array of share objects
   * @param {Function} props.onDeleteShare - Callback to delete share
   * @param {Object} props.styles - Style object from parent
   */
  ```

### Validation
- [ ] Run `npm run typecheck` → Should show 0 errors ✅
- [ ] No other code changes needed

### Time: ~15 minutes

---

## Task 2: Commit Pending Changes (30 minutes)

**Priority**: P0 - BLOCKING
**Atlas Workflow**: Quick

### Steps
- [ ] Review PENDING_CHANGES.md - verify it describes all changes
- [ ] Check git status:
  ```bash
  git status
  # Should show 13 modified files
  ```
- [ ] Stage all changes:
  ```bash
  git add -A
  ```
- [ ] Verify staged changes:
  ```bash
  git diff --staged --stat
  ```
- [ ] Commit with message from PENDING_CHANGES.md:
  ```bash
  git commit -m "$(cat <<'EOF'
  Fix: AccessModal Theme Colors + Sync Data Structure + Phase 1 Diagnostics

  1. AccessModal: Replace hardcoded pastels with dynamic theme colors
  2. CRITICAL: Fix data structure mismatch in onboarding sync import
  3. Phase 1: Add diagnostic checkpoints and isSyncing flag protection

  See PENDING_CHANGES.md for full details.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>
  EOF
  )"
  ```

### Validation
- [ ] Run `git status` → Should show "working tree clean" ✅
- [ ] Run `git log -1` → Verify commit message looks good

### Time: ~30 minutes

---

## Task 3: Create Logger Wrapper (2-3 hours)

**Priority**: P0 - CRITICAL
**Impact**: 283 console statements must not execute in production
**Atlas Workflow**: Iterative

### 3A: Create Logger Utility (15 minutes)

- [ ] Create new file: `src/utils/logger.js`
- [ ] Add logger code:
  ```javascript
  /**
   * Conditional logger that only logs in development
   * All console.* calls should be replaced with logger.* in production code
   */

  // Check if we're in development mode
  const isDev =
    (typeof __DEV__ !== 'undefined' && __DEV__) ||
    (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');

  /**
   * Conditional console logger
   * Only executes in development, silent in production
   */
  export const logger = {
    log: (...args) => {
      if (isDev) console.log(...args);
    },
    error: (...args) => {
      if (isDev) console.error(...args);
    },
    warn: (...args) => {
      if (isDev) console.warn(...args);
    },
    info: (...args) => {
      if (isDev) console.info(...args);
    },
    debug: (...args) => {
      if (isDev) console.debug(...args);
    },
  };

  // Always log errors in production (for crash reporting)
  export const logError = (...args) => {
    console.error(...args);
  };

  export default logger;
  ```
- [ ] Test logger works:
  ```javascript
  import { logger } from './utils/logger';
  logger.log('Test'); // Should log in dev, silent in prod
  ```

### 3B: Replace Console in App.js (45-60 minutes)

**File**: `App.js` (50+ console statements)

- [ ] Add import at top of file:
  ```javascript
  import { logger } from './src/utils/logger';
  ```
- [ ] Find and replace ALL console.* calls:
  ```bash
  # Search for console statements:
  # Lines: 30, 215, 217, 418, 435, 448, 457, 489, 558, 607, 628, 633, 639, 641, etc.
  ```
- [ ] Replace pattern:
  ```javascript
  // Before
  console.log('[Sync] Data received:', data);

  // After
  logger.log('[Sync] Data received:', data);
  ```
- [ ] For error cases that should ALWAYS log:
  ```javascript
  // Before
  console.error('CRITICAL ERROR:', error);

  // After (if should log in production)
  console.error('CRITICAL ERROR:', error);

  // After (if dev-only)
  logger.error('CRITICAL ERROR:', error);
  ```

**Validation**:
- [ ] Run `npm run lint | grep "no-console" | grep "App.js" | wc -l` → Should be 0 or very low
- [ ] Test app still works (manual test)

### 3C: Replace Console in useUserStore.js (30 minutes)

**File**: `src/stores/useUserStore.js` (24 console statements)

- [ ] Add import: `import { logger } from '../utils/logger';`
- [ ] Replace all console.* with logger.*
- [ ] Focus on Phase 1 diagnostic logs (checkpoints 2 & 3)
- [ ] Keep checkpoint prefixes for easier debugging:
  ```javascript
  logger.log('[CHECKPOINT2] setUsers called:', users);
  logger.log('[CHECKPOINT3] AsyncStorage write took:', duration, 'ms');
  ```

**Validation**:
- [ ] Run `npm run lint | grep "no-console" | grep "useUserStore" | wc -l` → Should be 0
- [ ] Test sync flow still works

### 3D: Replace Console in Sync Files (30-45 minutes)

**Files** (in order):
1. `src/services/sync/minimalSyncService.js` (Checkpoint 1)
2. `src/services/sync/syncStoreIntegration.js` (Checkpoint 4)
3. `src/services/sync/conflictResolver.js` (22 statements)
4. `src/components/Onboarding/OnboardingUserCentered/index.js` (18 statements, Phase 1)

- [ ] Add logger import to each file
- [ ] Replace console.* with logger.*
- [ ] Keep checkpoint prefixes intact
- [ ] Test sync flow after each file

**Validation**:
- [ ] Run full sync test (Device A + Device B)
- [ ] Verify checkpoints still log in development
- [ ] Verify no console output in production build

### 3E: Replace Console in Modals (30 minutes)

**Files** (top priority):
1. `src/components/Modals/DataModal/DataModal.js` (35 statements)
2. `src/components/Modals/ContextModal/ContextModal.js` (39 statements)

- [ ] Add logger import
- [ ] Replace console.* with logger.*
- [ ] Test modal functionality

### 3F: Remaining Files (Optional - if time permits)

**Files**:
- `src/components/ActivityLibrary/ActivityLibrary.js` (24)
- `src/services/sync/encryptionServiceFixed.ts` (65)
- Other files with <10 statements each

**Decision Point**: Stop here if running low on time. These can be addressed in Wave 2.

### Final Validation
- [ ] Run full lint check:
  ```bash
  npm run lint 2>&1 | grep "no-console" | wc -l
  # Should be <50 (from 283)
  ```
- [ ] Run test suite:
  ```bash
  npm test
  # Should pass 100%
  ```
- [ ] Test production build has no console output:
  ```bash
  # Build for production
  npm run build:web
  # Or test with NODE_ENV=production
  NODE_ENV=production npm start
  # Open browser console → should see no logs
  ```

### Time: 2-3 hours total

---

## Task 4: Final Validation (15 minutes)

### Run All Checks
- [ ] TypeScript check:
  ```bash
  npm run typecheck
  # Should show 0 errors ✅
  ```
- [ ] Lint check:
  ```bash
  npm run lint 2>&1 | tail -5
  # Should show <300 warnings (from 1,197)
  ```
- [ ] Test suite:
  ```bash
  npm test
  # Should show 100% pass rate ✅
  ```
- [ ] Git status:
  ```bash
  git status
  # Should show modified files from logger changes
  ```

### Commit Logger Changes
- [ ] Update PENDING_CHANGES.md:
  ```markdown
  ## Title: Wave 1 Production Cleanup - Console Logger + TypeScript Fixes

  ### Changes Made:

  **Production Safety**: Replaced 283+ console statements with conditional logger wrapper to prevent production console spam.

  **Created**: `src/utils/logger.js`
  - Conditional logger that only executes in development
  - Silent in production builds
  - Preserves error logging for crash reporting

  **Files Modified**:
  1. App.js (~50 console statements → logger)
  2. useUserStore.js (24 statements → logger, Phase 1 checkpoints preserved)
  3. minimalSyncService.js (Checkpoint 1 → logger)
  4. syncStoreIntegration.js (Checkpoint 4 → logger)
  5. conflictResolver.js (22 statements → logger)
  6. OnboardingUserCentered/index.js (18 statements → logger, Phase 1 flags preserved)
  7. DataModal.js (35 statements → logger + TypeScript prop fixes)
  8. ContextModal.js (39 statements → logger)
  9. [List other files modified]

  **TypeScript Fixes**: Added JSDoc prop types to DataModal components (ActiveShareCard, UserSharesList)

  **Impact**:
  - ✅ Production builds have zero console output
  - ✅ Development debugging preserved
  - ✅ TypeScript type checking passes
  - ✅ All tests passing (100%)
  - ✅ ESLint warnings reduced by 75% (1,197 → <300)

  **Performance**: No impact (logger checks are simple boolean conditions)
  **Breaking Changes**: None
  ```
- [ ] Stage changes:
  ```bash
  git add -A
  ```
- [ ] Commit:
  ```bash
  git commit -m "$(cat <<'EOF'
  Cleanup: Wave 1 Production Blockers - Logger Wrapper + TypeScript Fixes

  Replace 283+ console statements with conditional logger wrapper.
  Add TypeScript JSDoc prop types to DataModal components.

  - Created src/utils/logger.js (conditional dev-only logging)
  - Updated 8+ files to use logger instead of console
  - Fixed 10 TypeScript prop type errors
  - Reduced ESLint warnings by 75% (1,197 → <300)

  All tests passing (100%). No breaking changes.
  See PENDING_CHANGES.md for full details.

  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>
  EOF
  )"
  ```

### Time: 15 minutes

---

## Task 5: Deploy to QUAL (30 minutes)

### Deployment
- [ ] Ensure PENDING_CHANGES.md is complete
- [ ] Update version if needed (script handles this)
- [ ] Deploy to QUAL:
  ```bash
  ./scripts/deploy.sh qual --all
  ```
- [ ] Wait for deployment to complete (~5-10 minutes)
  - iOS/Android builds in parallel (2-3 min each)
  - Web build and deploy (2-3 min)

### QUAL Validation
- [ ] Open QUAL web: https://stackmap.app/qual/
- [ ] Open browser console → **Should see NO console logs** ✅
- [ ] Test critical flows:
  - [ ] Create new user
  - [ ] Add activities
  - [ ] Test sync (if possible with 2 devices/browsers)
  - [ ] Open all modals (Data, Settings, Activity Library)
  - [ ] Test theme switching
- [ ] Check mobile apps (if available):
  - [ ] iOS TestFlight (qual build)
  - [ ] Android internal track (qual build)
  - [ ] Verify no console logs in native debugger

### Issues Found?
If you find issues:
- [ ] Check browser/native console for errors
- [ ] Review logger implementation
- [ ] Fix and redeploy
- [ ] Do NOT promote to STAGE/BETA until QUAL is clean

### Time: 30 minutes

---

## Task 6: Promote to STAGE/BETA (If QUAL passes)

### STAGE Deployment (Internal Validation)
- [ ] QUAL validation complete and clean
- [ ] Deploy to STAGE:
  ```bash
  ./scripts/deploy.sh stage --all
  ```
- [ ] Notify team for internal testing
- [ ] Wait 24-48 hours for feedback

### BETA Deployment (Closed Beta)
- [ ] STAGE validation complete
- [ ] No critical issues reported
- [ ] Deploy to BETA:
  ```bash
  ./scripts/deploy.sh beta --all
  ```
- [ ] Monitor for issues
- [ ] Wait 3-7 days for beta user feedback

### PROD Deployment (Public Release)
- [ ] BETA validation complete
- [ ] No critical issues reported
- [ ] Schedule production deployment:
  ```bash
  ./scripts/deploy.sh prod --all
  ```
- [ ] Monitor production metrics
- [ ] Celebrate! 🎉

---

## Success Criteria ✅

### Wave 1 Complete When:
- ✅ TypeScript errors: 0 (was 10)
- ✅ Console in production: 0 (was 283)
- ✅ Git status: Clean working tree
- ✅ ESLint warnings: <300 (was 1,197) - **75% reduction**
- ✅ Tests: 100% passing (maintained)
- ✅ QUAL deployment: Successful and validated
- ✅ No console output in production builds

### Status Board
After completion, update status:
- `PRODUCTION_READINESS_SUMMARY.md` → Change from 🔴 RED to 🟡 YELLOW
- Note: Will be 🟢 GREEN after Wave 2 (SonarCloud + unused code)

---

## Time Tracking

**Total Estimated**: 3-4 hours

| Task | Estimated | Actual | Notes |
|------|-----------|--------|-------|
| Pre-flight | 15 min | ___ | |
| TypeScript fix | 15 min | ___ | |
| Commit pending | 30 min | ___ | |
| Create logger | 15 min | ___ | |
| App.js | 45-60 min | ___ | |
| useUserStore | 30 min | ___ | |
| Sync files | 30-45 min | ___ | |
| Modal files | 30 min | ___ | |
| Final validation | 15 min | ___ | |
| Commit logger | 15 min | ___ | |
| QUAL deploy | 30 min | ___ | |
| **TOTAL** | **3-4 hours** | ___ | |

---

## Troubleshooting

### TypeScript errors persist
- Verify JSDoc syntax is correct
- Check for typos in @param tags
- Run `npm run typecheck` for specific line numbers

### Logger not working
- Verify __DEV__ is defined correctly
- Check NODE_ENV in production builds
- Test with `console.log('__DEV__:', __DEV__)`

### Tests failing after changes
- Verify logger doesn't break test environment
- Check that imports are correct
- Run specific test file: `npm test -- path/to/test.js`

### QUAL deployment fails
- Check build logs for errors
- Verify all files committed
- Check disk space
- Try sequential builds: `./scripts/deploy.sh qual --all --no-parallel`

---

## Next Steps After Wave 1

When Wave 1 is complete:
1. Monitor QUAL/STAGE/BETA for issues
2. Schedule Wave 2 (6-8 hours) for next week:
   - Remove unused code
   - Replace alert/confirm
   - Fix SonarCloud critical issues
3. Update project documentation with logger pattern
4. Celebrate the cleanup! 🎉

---

## Resources

- **Full Plan**: `/docs/development/PRE_PRODUCTION_CLEANUP_PLAN.md`
- **Summary**: `/PRODUCTION_READINESS_SUMMARY.md`
- **Project Guide**: `/CLAUDE.md`
- **Deployment Guide**: `/docs/deployment/README.md`

---

**Checklist Status**: Ready to Use
**Last Updated**: 2025-10-31
**Next Review**: After Wave 1 completion
