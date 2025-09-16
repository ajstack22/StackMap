# STORY: Achieve Security Rating A & 50% Test Coverage

## Epic Classification
**Type**: Technical Debt & Quality Assurance
**Priority**: P1 - High (Next Sprint)
**Estimated Effort**: XL (1-2 weeks)
**Risk Level**: Medium

## Success Criteria (Must be Measurable)

### Primary Goals
1. **SonarQube Security Rating: A**
   - Target: 0 security hotspots remaining
   - Current: 15 security hotspots resolved with NOSONAR directives
   - Verification: `sonar-scanner` analysis shows Security Rating A
   - Acceptance: No new security vulnerabilities introduced

2. **Test Coverage: 50% minimum**
   - Target: ≥50% line coverage across all tested files
   - Current: 25.47% overall coverage
   - Gap: Need 24.53% improvement
   - Verification: `npm test -- --coverage` shows ≥50%

### Performance Requirements
- Build time increase: <10% (currently ~2 minutes)
- Test execution time: <5 minutes for full suite
- No performance regression in application runtime

## Current State Analysis

### Security Status
✅ **Completed**: 15 security hotspots resolved with NOSONAR directives
- 3 hotspots in `/src/components/CelebrationManager/` (Math.random for animations)
- 2 hotspots in `/src/components/ShareView/` (window.open with nullified opener)
- 1 hotspot in `/src/services/api/dev/config/redis.js` (MD5 for cache keys)
- 1 hotspot in `/src/services/api/dev/utils/database.js` (password sanitization)

### Test Coverage Breakdown
**Current**: 25.47% overall coverage
**Target**: 50% minimum

**High Coverage Areas** (>80%):
- `/src/utils/dataNormalizer.js`: 100% coverage ✅
- `/src/utils/modalHelpers.js`: 100% coverage ✅
- `/src/components/ActivityLibrary/LibraryHeader.js`: 100% coverage ✅
- `/src/components/ActivityLibrary/SearchBar.js`: 100% coverage ✅

**Critical Coverage Gaps** (<50%):
- `/src/components/ActivityLibrary/CategoryActions.js`: 11.11%
- `/src/components/ActivityLibrary/CategoryList.js`: 0%
- `/src/utils/secureStorage.js`: 54.16%
- `/src/utils/version.js`: 50%
- All web polyfills: 0% (excluded from coverage requirements)

### Test Infrastructure Status
- **Total Test Suites**: 48 (1 currently failing)
- **Total Tests**: 816
- **Failing Tests**: Multiple integration tests failing due to store refactoring
- **Test Framework**: Jest + React Native Testing Library

## Story Breakdown

### Story 1: Fix Failing Tests (Foundation)
**Priority**: P0 - Critical
**Size**: M (1-3 days)
**Dependencies**: None

**Requirements**:
- Fix all failing tests in test suite
- Ensure 100% test pass rate
- Update tests for new store architecture

**Acceptance Criteria**:
- `npm test` returns 0 exit code
- All 816 tests pass
- No skipped tests due to errors
- CI/CD pipeline passes test stage

**Files to Fix**:
- `src/stores/__tests__/useAppStore.test.js` (4 failing tests)
- `src/components/ActivityLibrary/__tests__/ActivityLibrary.integration.test.js`
- `src/components/EditModeList/__tests__/EditModeList.integration.test.js`
- `src/components/ConflictResolutionModal/__tests__/ConflictResolutionModal.test.js`
- `src/components/Modals/DataModal/__tests__/*` (multiple files)

### Story 2: Increase Core Component Coverage
**Priority**: P1 - High
**Size**: L (3-5 days)
**Dependencies**: Story 1

**Requirements**:
- Bring critical components to ≥70% coverage
- Focus on high-impact, low-coverage files
- Add integration tests for key workflows

**Target Files** (ordered by impact):
1. `CategoryActions.js`: 11.11% → 70% (+58.89%)
2. `CategoryList.js`: 0% → 70% (+70%)
3. `secureStorage.js`: 54.16% → 70% (+15.84%)
4. `CategoryDropdownMenu.js`: 18.18% → 70% (+51.82%)
5. `LibraryActivityCard.js`: 41.93% → 70% (+28.07%)

**Coverage Impact Calculation**:
- Estimated coverage gain: ~15-20% overall
- Combined with Story 1: Target >45% coverage

### Story 3: Add Missing Test Cases
**Priority**: P1 - High
**Size**: M (1-3 days)
**Dependencies**: Story 2

**Requirements**:
- Add edge case testing
- Improve error handling coverage
- Add platform-specific test coverage

**Focus Areas**:
- Sync service error scenarios
- Data corruption recovery
- Network failure handling
- Platform compatibility edge cases

**Expected Coverage Gain**: 5-10% overall

### Story 4: Security Verification & Documentation
**Priority**: P1 - High
**Size**: S (<1 day)
**Dependencies**: Stories 1-3

**Requirements**:
- Verify all NOSONAR directives are justified
- Document security decisions
- Run final SonarQube analysis
- Create security review checklist

**Deliverables**:
- Security justification document
- Updated SECURITY.md (if exists)
- Clean SonarQube report
- Security review checklist for future PRs

## Platform Testing Requirements

### All Platforms
- [ ] Core functionality tests pass
- [ ] Security scans show no new vulnerabilities
- [ ] Performance benchmarks maintained

### iOS Specific
- [ ] AsyncStorage debouncing tests
- [ ] Modal constraint tests
- [ ] NetInfo.fetch() disabled verification

### Android Specific
- [ ] FlexWrap card layout tests
- [ ] Font weight variant tests
- [ ] Percentage width calculations

### Web Specific
- [ ] 3-column layout responsive tests
- [ ] VectorIcons span element tests
- [ ] Alert.alert replacement tests

## Verification Commands

### Test Coverage Verification
```bash
# Full coverage report
npm test -- --coverage --passWithNoTests

# Coverage threshold check (50% minimum)
npm test -- --coverage --coverageThreshold='{"global":{"lines":50}}'

# Specific file coverage
npm test -- --coverage --collectCoverageFrom="src/**/*.js" --collectCoverageFrom="!src/**/*.test.js"
```

### Security Verification
```bash
# Run SonarQube analysis
./scripts/sonar-analysis.sh

# Check for security hotspots
sonar-scanner -Dsonar.verbose=true

# Verify NOSONAR directives
grep -r "NOSONAR" src/ --include="*.js"
```

### Platform Testing
```bash
# All platforms
npm test

# iOS build verification
cd ios && pod install && cd .. && npm run ios

# Android build verification
cd android && ./gradlew clean && cd .. && npm run android

# Web build verification
npm run web:build
```

## Rollback Plan

### Immediate Rollback Triggers
- Test coverage drops below current 25.47%
- Any new security vulnerabilities introduced
- Build failures on any platform
- Performance regression >10%

### Rollback Procedure
1. **Revert Changes**: `git revert <commit-range>`
2. **Restore Tests**: Ensure all original tests still pass
3. **Verify Security**: Confirm NOSONAR directives still valid
4. **Document Issues**: Update story with lessons learned

### Recovery Steps
1. Identify root cause of failure
2. Create hotfix branch from last good commit
3. Apply minimal fix
4. Re-run verification suite
5. Deploy hotfix to production

## Risk Assessment & Mitigation

### High Risks
**Risk**: Test changes break existing functionality
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Incremental testing approach
- Maintain test isolation
- Comprehensive platform testing

**Risk**: Coverage targets not achievable within timeline
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Prioritize high-impact files first
- Accept 45% coverage as minimum viable
- Document areas needing future coverage

### Medium Risks
**Risk**: NOSONAR directives mask real security issues
**Probability**: Low
**Impact**: High
**Mitigation**:
- Manual security review of all NOSONAR usage
- Document justification for each directive
- Periodic re-evaluation of suppressions

## Timeline & Dependencies

### Week 1: Foundation (Story 1)
- **Days 1-2**: Fix failing store tests
- **Day 3**: Fix integration test failures
- **Day 4**: Verify all tests pass across platforms
- **Day 5**: Buffer for unexpected issues

### Week 2: Coverage & Security (Stories 2-4)
- **Days 1-3**: Increase component coverage (Story 2)
- **Day 4**: Add missing test cases (Story 3)
- **Day 5**: Security verification & documentation (Story 4)

### Dependencies
- **External**: None
- **Internal**: Must complete Story 1 before others
- **Platform**: iOS/Android build environments available
- **Tools**: SonarQube access, Jest configuration

## Resource Requirements

### Developer Resources
- **Primary**: 1 senior developer (full-time)
- **Secondary**: 1 reviewer (part-time)
- **Estimated Effort**: 8-10 developer days

### Infrastructure
- SonarQube/SonarCloud access
- CI/CD pipeline with test execution
- Platform build environments (iOS, Android, Web)

### Tools & Dependencies
- Jest testing framework (current)
- React Native Testing Library (current)
- SonarQube scanner (current)
- Coverage reporting tools (current)

## Success Metrics & Monitoring

### Primary Metrics
1. **Security Rating**: A (verified by SonarQube)
2. **Test Coverage**: ≥50% (verified by Jest)
3. **Test Pass Rate**: 100% (all 816 tests)

### Secondary Metrics
1. **Build Performance**: <10% increase
2. **Test Execution Time**: <5 minutes
3. **Platform Parity**: All platforms pass tests

### Monitoring
- Daily: Test pass rate monitoring
- Weekly: Coverage trend analysis
- Monthly: Security hotspot review

## Definition of Done

### Security Requirements ✅
- [ ] SonarQube Security Rating: A
- [ ] All NOSONAR directives documented and justified
- [ ] No new security vulnerabilities introduced
- [ ] Security review checklist created

### Coverage Requirements ✅
- [ ] Overall test coverage ≥50%
- [ ] All critical components ≥70% coverage
- [ ] All tests passing (100% pass rate)
- [ ] Coverage report generated and documented

### Quality Gates ✅
- [ ] All platforms build successfully
- [ ] Performance benchmarks maintained
- [ ] No regressions in core functionality
- [ ] Documentation updated

### Deployment Readiness ✅
- [ ] Rollback plan tested and documented
- [ ] Verification commands validated
- [ ] Risk mitigation strategies implemented
- [ ] Success metrics baselined

---

**Story Created**: 2025-09-16
**Last Updated**: 2025-09-16
**Assigned To**: TBD
**Epic**: Technical Debt & Quality Assurance
**Sprint**: TBD

**Approvals Required**:
- [ ] PM/Lead: Strategy and priority alignment
- [ ] Tech Lead: Architecture and approach
- [ ] Security Lead: NOSONAR directive review
- [ ] QA Lead: Test strategy validation