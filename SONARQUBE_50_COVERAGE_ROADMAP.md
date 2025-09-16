# 🎯 StackMap SonarQube A Rating & 50% Test Coverage Roadmap

**Started**: 2025-09-16
**Target Completion**: 2-3 weeks
**Current Status**: APR Process Started, Major Issues Identified

## 📊 Current Metrics (2025-09-16)
- **Test Coverage**: 26.12% statements, 22.23% branches, 24.31% functions, 26.12% lines
- **SonarQube Rating**: Security hotspots addressed with NOSONAR (needs verification)
- **Failing Tests**: 158 tests failing (819 total)
- **Test Suites**: 24 failed, 24 passed (48 total)
- **Critical Issue**: Missing `Animated.parallel` mock causing 133+ failures

## 🎯 Target Metrics
- **Test Coverage**: 50% across all metrics
- **SonarQube Rating**: A (all ratings)
- **All Tests**: 100% passing
- **Timeline**: 10-12 APR sessions over 2-3 weeks

---

## 📋 APR SESSION TRACKER

### ✅ COMPLETED SESSIONS
- [x] **Pre-Session**: Security Hotspots Resolution (COMPLETED - commits 838c6945, 4b991d7f, a5758b07)
- [x] **APR Session 0**: Initial Implementation Attempt (REJECTED - only 26% coverage achieved)

### 🔴 PHASE 1: CRITICAL TEST INFRASTRUCTURE (Day 1)
- [ ] **Session 1**: Fix Animated.parallel Mock (P0 - CRITICAL)
  - Add missing `Animated.parallel` to jest.setup.js
  - Fix ~133 test failures from this single issue
  - Verify EditModeList tests run properly
  - Expected: 158 → ~25 test failures
  - Status: NOT STARTED

### 🟠 PHASE 2: REMAINING TEST FAILURES (Days 2-3)
- [ ] **Session 2**: Fix minimalSyncService Test Issues (P0)
  - Fix URL fragment test (Platform.OS and recovery phrase format)
  - Fix timeout issues in retry tests
  - Clean up global mocks properly
  - Expected: ~10 test failures fixed
  - Status: NOT STARTED

- [ ] **Session 3**: Fix Store Integration Tests (P0)
  - Fix useAppStore activities getter reactivity
  - Fix theme validation (stackGreen → emerald)
  - Fix ActivityLibrary integration tests
  - Expected: ~15 test failures fixed
  - Status: NOT STARTED

### 🟡 PHASE 3: HIGH-IMPACT COVERAGE IMPROVEMENTS (Days 4-7)
- [ ] **Session 4**: CategoryActions Coverage (P1)
  - Current: 11.11% → Target: 70%
  - Implement comprehensive function tests
  - Use renderHook for real testing (not mocks)
  - Expected coverage gain: +8-10%
  - Status: NOT STARTED

- [ ] **Session 5**: CategoryList & DraggableList Coverage (P1)
  - CategoryList: 0% → 70%
  - DraggableList.web.js: 0% → 60%
  - Focus on component lifecycle and interactions
  - Expected coverage gain: +6-8%
  - Status: NOT STARTED

- [ ] **Session 6**: Sync Services Coverage (P1)
  - minimalSyncService: improve edge case coverage
  - conflictResolver: add comprehensive merge tests
  - encryptionServiceFixed: test error scenarios
  - Expected coverage gain: +5-7%
  - Status: NOT STARTED

- [ ] **Session 7**: EditModeList Complete Testing (P1)
  - Verify all 76 integration tests pass
  - Add unit tests for utils and styles
  - Test platform-specific behaviors
  - Expected coverage gain: +4-5%
  - Status: NOT STARTED

### 🟢 PHASE 4: COMPONENT TESTING EXPANSION (Days 8-10)
- [ ] **Session 8**: ActivityLibrary Components (P1)
  - CategoryEditor: 65.67% → 85%
  - CategorySectionComponent: 51.16% → 75%
  - FilterControls: 98.21% → 100%
  - Expected coverage gain: +4-5%
  - Status: NOT STARTED

- [ ] **Session 9**: Modal Components Testing (P1)
  - DataModal: improve coverage
  - SyncPreviewModal: add comprehensive tests
  - ConfirmModal: test all scenarios
  - Expected coverage gain: +3-4%
  - Status: NOT STARTED

- [ ] **Session 10**: Store Architecture Testing (P1)
  - useUserStore: comprehensive state management
  - useSettingsStore: all settings scenarios
  - useLibraryStore: template operations
  - useSyncStore: sync state transitions
  - Expected coverage gain: +3-4%
  - Status: NOT STARTED

### 🔵 PHASE 5: FINAL PUSH & VALIDATION (Days 11-12)
- [ ] **Session 11**: Security & SonarQube Validation (P0)
  - Review all 16 NOSONAR directives
  - Run full SonarQube analysis
  - Address any remaining hotspots
  - Document security decisions
  - Status: NOT STARTED

- [ ] **Session 12**: Coverage Gap Analysis & Cleanup (P1)
  - Target remaining low-coverage files
  - Clean up all console.log statements
  - Final test suite optimization
  - Achieve 50% threshold
  - Status: NOT STARTED

---

## 📈 PROGRESS TRACKING

### Coverage Progress
```
Start:    25.50% █████░░░░░░░░░░░░░░░
Current:  26.12% █████░░░░░░░░░░░░░░░
Target:   50.00% ██████████░░░░░░░░░░
```

### Test Success Rate
```
Start:    79.4% (650/819 passing)
Current:  80.7% (661/819 passing)
Target:   100%  (819/819 passing)
```

### Session Completion
```
Completed: 0/12 sessions
Progress:  0% ░░░░░░░░░░░░░░░░░░░░
```

---

## 🔍 CRITICAL ISSUES TO RESOLVE

### Immediate Blockers (P0)
1. **Animated.parallel Mock** - Causing 133+ test failures
   ```javascript
   // Add to jest.setup.js:
   parallel: jest.fn((animations) => ({
     start: jest.fn((callback) => {
       animations.forEach(anim => anim.start?.());
       callback?.();
     })
   }))
   ```

2. **Platform-Specific Test Issues**
   - iOS: AsyncStorage debouncing
   - Android: FlexWrap percentage widths
   - Web: Alert.alert → ConfirmModal

3. **Field Naming Consistency**
   - Activities: `text` (not name/title), `icon` (not emoji)
   - Users: `icon` (not emoji), `name` as string only

### NOSONAR Directives to Validate
- `CelebrationManager.js`: Math.random() for animations (12 instances)
- `ShareView.js`: window.open with opener=null (2 instances)
- `database.js`: MD5 for cache keys (1 instance)
- `redis.js`: Password sanitization regex (1 instance)

---

## 🚀 HOW TO USE THIS ROADMAP

### For Each APR Session:
1. **Start**: `"Implement Session X from SONARQUBE_50_COVERAGE_ROADMAP.md using APR process"`
2. **Execute**: Follow the Adversarial Peer Review process from `/processes/ADVERSARIAL_REVIEW_PROCESS.md`
3. **Verify**: Run tests and coverage before claiming completion
4. **Update**: Mark session complete, update metrics in this file

### Verification Commands:
```bash
# Run all tests
npm test

# Check coverage with threshold
npm test -- --coverage --coverageThreshold='{"global":{"lines":50}}'

# Check for console.logs
grep -r "console\." src/ --exclude-dir=__tests__

# Platform-specific testing
npm run ios
npm run android
npm run web:build
```

### Daily Workflow:
1. Pick next session from roadmap
2. Implement using APR process (Developer → Peer Review → Fix → Repeat)
3. Update metrics in this file
4. Commit with session reference
5. Move to next session

---

## 📊 SUCCESS CRITERIA

### Phase Gates:
- **Phase 1 Complete**: Animated.parallel fixed, <30 test failures
- **Phase 2 Complete**: All tests passing (0 failures)
- **Phase 3 Complete**: ~35% coverage achieved
- **Phase 4 Complete**: ~45% coverage achieved
- **Phase 5 Complete**: 50%+ coverage, SonarQube A rating

### Final Delivery Requirements:
- [ ] 50% test coverage (all metrics)
- [ ] 0 test failures (819/819 passing)
- [ ] SonarQube A rating (all categories)
- [ ] All NOSONAR directives justified
- [ ] No console.log statements in production
- [ ] All platforms tested (iOS/Android/Web)
- [ ] Performance benchmarks maintained

---

## 📝 NOTES & LEARNINGS

### APR Process Results:
- **Session 0**: Initial attempt achieved only 26% coverage, 158 tests still failing
- **Key Finding**: Missing Animated.parallel mock is root cause of 133+ failures
- **Lesson**: Fix infrastructure before claiming test improvements

### Technical Decisions:
- Using Jest + React Testing Library
- Real function testing preferred over mocks
- Platform-specific code handled via Platform.select()
- No .native.js or .web.js files (unified codebase)
- NOSONAR directives used for non-security Math.random() and MD5 cache keys

### Known Issues:
- EditModeList tests can't validate functionality until Animated mock fixed
- Some ActivityLibrary tests have rendering issues (act() warnings)
- Store reactivity issues with activities getter

### StackMap-Specific Considerations:
- Sync system must maintain data integrity (test thoroughly)
- Field normalization critical (text/icon naming)
- Platform gotchas documented in CLAUDE.md must be tested
- Bundle size must stay under 50MB
- Load time must stay under 3 seconds

---

## 🔗 QUICK REFERENCES

### Key Files:
- `/jest.setup.js` - Test infrastructure configuration
- `/src/stores/useAppStore.js` - Main store with reactivity issues
- `/src/components/EditModeList/` - Component with comprehensive tests
- `/src/services/sync/__tests__/` - Sync service test suite
- `/CLAUDE.md` - Project conventions and gotchas

### Related Documentation:
- `/docs/development/roles/` - APR role definitions
- `/processes/ADVERSARIAL_REVIEW_PROCESS.md` - APR process guide
- `/docs/testing/simple-testing-guide.md` - Testing approach
- `/docs/deployment/README.md` - Deployment procedures

---

**Last Updated**: 2025-09-16
**Next Session**: Session 1 - Fix Animated.parallel Mock (CRITICAL)
**Command to Start**: `"Implement Session 1 from SONARQUBE_50_COVERAGE_ROADMAP.md - Fix Animated.parallel mock in jest.setup.js"`