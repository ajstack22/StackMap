# StackMap Development Backlog

## Priority System
- **P0 (Critical)**: System broken, data loss risk, security vulnerability - Fix immediately
- **P1 (High)**: Major feature broken, severe performance issue - Next sprint
- **P2 (Medium)**: Important improvements, moderate issues - Within month
- **P3 (Low)**: Nice to have, minor issues - As capacity allows

## Active Work In Progress
*Maximum 2 stories in progress at once*

None currently in progress.

---

## P0 - Critical Priority (Fix Immediately)

### [S-DEBT-001: Test Coverage for Sync System](backlog/S-DEBT-001-test-coverage-sync-system.md)
**Category**: Technical Debt / Security  
**Effort**: L (1 week)  
**Risk**: Data loss, sync corruption  
**Status**: READY FOR DEV

The sync system has ZERO test coverage despite handling critical user data encryption, conflict resolution, and cross-device synchronization. Any change risks breaking data sync for all users.

**Acceptance Criteria**:
- 90%+ test coverage for sync modules
- 50+ test cases covering all scenarios
- Security and encryption tests
- Performance benchmarks included

---

## P1 - High Priority (Next Sprint)

### [S-DEBT-002: Refactor God Objects](backlog/S-DEBT-002-refactor-god-objects.md)
**Category**: Technical Debt / Architecture  
**Effort**: XL (2 weeks)  
**Impact**: Development velocity, maintainability  
**Status**: READY FOR DEV

DataModal.js (2672 lines) and ActivityLibrary.js (2212 lines) are unmaintainable god objects causing slow development and high regression risk.

**Acceptance Criteria**:
- No files > 500 lines
- 20%+ performance improvement
- Each module individually testable
- Clear separation of concerns

### [S-DEBT-003: React Performance Optimizations](backlog/S-DEBT-003-react-performance-optimization.md)
**Category**: Technical Debt / Performance  
**Effort**: L (1 week)  
**Impact**: User experience, battery life  
**Status**: READY FOR DEV

Missing React.memo/useCallback/useMemo causing massive unnecessary re-renders and 20 FPS scrolling on lists.

**Acceptance Criteria**:
- 70%+ reduction in re-renders
- 60 FPS scrolling achieved
- 40%+ CPU usage reduction
- All lists optimized

### [S-DEBT-005: iOS AsyncStorage Freeze Fix](backlog/S-DEBT-005-ios-asyncstorage-freeze-fix.md)
**Category**: Platform Bug / Performance  
**Effort**: M (3 days)  
**Impact**: iOS users experience 20+ second freezes  
**Status**: READY FOR DEV

iOS users experience complete UI freezes during storage operations, causing force-quits and data loss. #1 iOS complaint.

**Acceptance Criteria**:
- Zero freezes > 100ms
- Storage writes < 50ms
- Consider MMKV migration
- Performance metrics added

---

## P2 - Medium Priority (This Quarter)

### [S-DEBT-004: Remove Console.logs from Production](backlog/S-DEBT-004-remove-debug-console-logs.md)
**Category**: Technical Debt / Security  
**Effort**: M (3 days)  
**Impact**: Security, bundle size, professionalism  
**Status**: READY FOR DEV

570+ console.log statements shipping to production, exposing internal state and user data.

**Acceptance Criteria**:
- Zero console output in production
- 5-10% bundle size reduction
- Logging service implemented
- ESLint rule preventing future issues

### S-PLATFORM-001: Web Bundle Optimization
**Category**: Performance  
**Effort**: L (1 week)  
**Impact**: Load time, bandwidth  
**Status**: NEEDS STORY CREATION

Implement code splitting, lazy loading, and tree shaking to reduce initial bundle size.

### S-PLATFORM-002: Android Font System Cleanup
**Category**: Platform  
**Effort**: M (3 days)  
**Impact**: Consistency, maintainability  
**Status**: NEEDS STORY CREATION

Properly abstract Android font variant system to prevent fontWeight usage mistakes.

---

## P3 - Low Priority (As Capacity)

### E-TS-001: TypeScript Migration Epic
**Category**: Code Quality  
**Effort**: XXL (Ongoing)  
**Impact**: Type safety, developer experience  
**Status**: NEEDS EPIC CREATION

Gradual migration to TypeScript with @ts-check as intermediate step.

### S-CLEANUP-001: Deep Import Path Cleanup
**Category**: Code Quality  
**Effort**: S (1 day)  
**Impact**: Maintainability  
**Status**: NEEDS STORY CREATION

Replace ../../../ imports with proper module aliases.

### S-CLEANUP-002: Remove Commented Code
**Category**: Code Quality  
**Effort**: S (1 day)  
**Impact**: Readability  
**Status**: NEEDS STORY CREATION

Remove all commented-out code blocks that are no longer needed.

---

## Completed Stories
*Move here when done, archive monthly*

None completed yet in new framework.

---

## Story Assignment Guidelines

### For New Developers
Start with:
- P3 cleanup tasks
- P2 isolated improvements
- Well-defined bug fixes

### For Experienced Developers
Focus on:
- P0 critical fixes
- P1 architectural improvements
- Complex platform issues

### For Platform Specialists
Prioritize:
- Platform-specific bugs
- Performance optimizations
- Native module work

---

## Metrics Dashboard

### Current Stats
- **Total Stories**: 8
- **P0 Critical**: 1
- **P1 High**: 3
- **P2 Medium**: 3
- **P3 Low**: 3
- **In Progress**: 0
- **Blocked**: 0

### Velocity Tracking
- **Average Story Completion**: TBD
- **P0 Response Time**: < 24 hours target
- **Sprint Velocity**: TBD

### Tech Debt Metrics
- **Debt Discovery Rate**: ~5 items/week
- **Debt Resolution Rate**: TBD
- **Oldest Unresolved Debt**: Sync test coverage
- **Total Console.logs**: 570+
- **Files > 500 lines**: 4

---

## Process Notes

1. **Story Creation**: Use `./scripts/create-story.sh "Title" P[0-3]`
2. **Bug Reports**: Use `./scripts/create-bug.sh "Title" P[0-3]`
3. **Review Process**: All stories follow ADVERSARIAL_REVIEW_PROCESS
4. **Acceptance**: Must have Peer Reviewer approval
5. **Deployment**: Only via `./scripts/qual_deploy.sh`

---

*Backlog Last Updated: 2025-01-13*
*Next Review: Weekly on Mondays*