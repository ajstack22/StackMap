# Technical Debt Backlog - StackMap

## TD001 - Replace iOS AsyncStorage to Fix Performance Freezes (P1)
**Status**: Not Started
**Type**: Frontend/Performance
**Effort**: Large

### Context
iOS AsyncStorage causes 20+ second freezes on app startup and during saves. Current 5-second debounce workaround delays data persistence and doesn't fully solve the problem.

### Implementation
1. Check existing: `src/stores/*.js` for all AsyncStorage usage, `App.js:513-535` for debounce workaround
2. Implement: MMKV storage solution with same API surface, data migration for existing users
3. Test: iOS startup time < 2 seconds, save operations < 100ms, no UI freezes

### Files to Modify
- `src/stores/useAppStore.js` - Replace AsyncStorage with MMKV
- `src/stores/useUserStore.js` - Replace AsyncStorage with MMKV
- `src/stores/useSettingsStore.js` - Replace AsyncStorage with MMKV
- `src/stores/useLibraryStore.js` - Replace AsyncStorage with MMKV
- `App.js` - Remove debounce workaround, update startup loading

### Success Criteria
- [ ] iOS startup time < 2 seconds
- [ ] Save operations complete in < 100ms
- [ ] No UI freezes during storage operations
- [ ] Existing user data migrated successfully
- [ ] Sync functionality maintained

### Roles
- Lead: MMKV implementation and migration
- Senior: Performance testing on real devices
- Architect: Data migration strategy

---

## TD002 - Fix NetInfo iOS Freeze Issue (P1)
**Status**: Not Started
**Type**: Frontend/Bug
**Effort**: Medium

### Context
NetInfo.fetch() causes iOS app to freeze, so it's disabled. iOS cannot detect network status and assumes always online, breaking offline sync capabilities.

### Implementation
1. Check existing: `src/services/sync/networkMonitor.js` for disabled NetInfo code
2. Implement: Native iOS Reachability module or alternative network detection
3. Test: No UI freezes, accurate online/offline detection, offline queue works

### Files to Modify
- `src/services/sync/networkMonitor.js` - Implement alternative network detection
- `src/services/sync/minimalSyncService.js` - Update network status handling
- `ios/StackMap/NetworkModule.m` - Create native module if needed

### Success Criteria
- [ ] Network detection works without freezing
- [ ] Offline queue processes when online
- [ ] Airplane mode transitions detected
- [ ] WiFi to cellular transitions handled
- [ ] Sync works in poor connectivity

### Roles
- Lead: Alternative implementation
- Senior: Native iOS module if needed
- Architect: Cross-platform compatibility

---

## TD003 - Fix Store Architecture Violations (P1)
**Status**: Not Started
**Type**: Frontend/Architecture
**Effort**: Medium

### Context
Direct setState calls violate the new store architecture and can cause sync issues. Must use store-specific methods instead.

### Implementation
1. Check existing: Search for all `setState` calls, especially `useAppStore.js:172-216`
2. Implement: Replace with store-specific methods like `useUserStore.getState().setUsers()`
3. Test: All store updates work, sync pushes/pulls correct data, no state corruption

### Files to Modify
- `src/stores/useAppStore.js:172-216` - Replace setState with proper methods
- `src/services/sync/minimalSyncService.js` - Update store access patterns
- `src/components/*` - Fix any component using direct setState

### Success Criteria
- [ ] Zero direct setState calls found
- [ ] All store updates use proper methods
- [ ] Sync works correctly
- [ ] State persistence maintained
- [ ] No data corruption

### Roles
- Lead: Refactor setState calls
- Senior: Review store patterns
- Architect: Verify architecture compliance

---

## TD004 - Remove Console Statements and Implement Logging (P2)
**Status**: Not Started
**Type**: Full-Stack
**Effort**: Medium

### Context
50+ console statements in production code impact performance and potentially expose sensitive data. Need proper logging system with environment-based levels.

### Implementation
1. Check existing: `src/services/sync/minimalSyncService.js` (50+ statements), search all files for console.*
2. Implement: Centralized logger with DEBUG/INFO/WARN/ERROR levels, environment detection
3. Test: No console output in production, debug logs work in development

### Files to Modify
- `src/utils/logger.js` - Create new logging utility
- `src/services/sync/minimalSyncService.js` - Replace 50+ console statements
- `App.js` - Replace debug console statements
- All service/component files with console usage

### Success Criteria
- [ ] Zero console statements in production build
- [ ] Debug logging available in development
- [ ] No sensitive data in logs
- [ ] Performance improvement measurable
- [ ] Error tracking functional

### Roles
- Lead: Logger implementation
- Senior: Security review for sensitive data
- Architect: Logging architecture decision

---

## TD005 - Optimize Bundle Size (P2)
**Status**: Not Started
**Type**: Frontend/Performance
**Effort**: Medium

### Context
2MB+ bundle size impacts initial load times. No code splitting implemented, loading all features upfront.

### Implementation
1. Check existing: Run webpack-bundle-analyzer, check `bundle.*.js` size
2. Implement: Dynamic imports, lazy loading, code splitting, dependency optimization
3. Test: Lighthouse score > 90, load time < 3 seconds on 3G

### Files to Modify
- `webpack.config.js` - Configure code splitting
- `src/App.js` - Implement lazy loading for heavy components
- `package.json` - Remove/replace heavy dependencies
- Component imports - Convert to dynamic imports

### Success Criteria
- [ ] Initial bundle < 1MB
- [ ] Load time < 3 seconds on 3G
- [ ] Lighthouse performance > 90
- [ ] All features still functional
- [ ] No visual regressions

### Roles
- Lead: Webpack configuration and splitting
- Senior: Performance testing
- Architect: Bundle strategy

---

## TD006 - Complete TypeScript Migration (P2)
**Status**: Not Started
**Type**: Frontend
**Effort**: Large

### Context
Mixed .js and .ts files create type safety gaps. Need complete migration for better maintainability and fewer runtime errors.

### Implementation
1. Check existing: Identify all .js files in src/, current tsconfig.json settings
2. Implement: Convert files to .ts, add type definitions, enable strict mode
3. Test: npm run typecheck passes, all tests pass, no runtime errors

### Files to Modify
- `src/services/sync/*.js` - Convert to TypeScript
- `src/stores/*.js` - Convert to TypeScript
- `src/components/**/*.js` - Convert to TypeScript
- `src/utils/*.js` - Convert to TypeScript
- `tsconfig.json` - Enable strict mode

### Success Criteria
- [ ] 100% TypeScript coverage
- [ ] Strict mode enabled
- [ ] Type checking passes
- [ ] No 'any' types without justification
- [ ] Build succeeds

### Roles
- Lead: File conversion
- Senior: Type definition quality
- Architect: Migration strategy

---

## TD007 - Improve Test Coverage (P2)
**Status**: Not Started
**Type**: Full-Stack/Testing
**Effort**: Large

### Context
28% test coverage (46 test files for 161 source files) risks regressions. Missing integration tests for critical paths like sync.

### Implementation
1. Check existing: Current test coverage with npm test --coverage
2. Implement: Unit tests for stores, integration tests for sync, E2E tests for critical paths
3. Test: Coverage > 50%, all tests pass, CI/CD integration working

### Files to Modify
- `src/stores/__tests__/*` - Add store tests
- `src/services/sync/__tests__/*` - Add sync integration tests
- `src/components/__tests__/*` - Add component tests
- `jest.config.js` - Configure coverage reporting
- `.github/workflows/*` - Add test pipeline

### Success Criteria
- [ ] 50% code coverage achieved
- [ ] Critical paths have integration tests
- [ ] E2E tests for user journeys
- [ ] Tests run in CI/CD
- [ ] Coverage reports generated

### Roles
- Lead: Test implementation
- Senior: Test strategy and quality
- Architect: Testing framework decisions

---

## TD008 - Abstract Platform Workarounds (P3)
**Status**: Not Started
**Type**: Frontend/Architecture
**Effort**: Small

### Context
Platform-specific workarounds scattered throughout codebase. Need centralized abstraction for better maintainability.

### Implementation
1. Check existing: Search for Platform.OS checks, hardcoded 48% widths, font workarounds
2. Implement: Create platformUtils.js with centralized platform helpers
3. Test: All platforms render correctly, no visual regressions

### Files to Modify
- `src/utils/platformUtils.js` - Create new platform abstraction
- Components with Platform.select - Use new abstractions
- Style definitions - Replace inline platform checks

### Success Criteria
- [ ] All platform checks centralized
- [ ] No inline platform workarounds
- [ ] Consistent platform API
- [ ] All platforms work correctly
- [ ] Code complexity reduced

### Roles
- Lead: Abstraction implementation
- Senior: Platform testing
- Architect: API design

---

## TD009 - Remove Temporary Code and Debug Features (P3)
**Status**: Not Started
**Type**: Frontend/Cleanup
**Effort**: Small

### Context
Multiple "TEMPORARILY" marked code sections and debug features left in production create confusion and potential issues.

### Implementation
1. Check existing: Search for TEMPORARILY, TEMP, TODO, FIXME, DEBUG, commented blocks
2. Implement: Remove or properly implement temporary code, clean up debug features
3. Test: All features work, no debug output in production

### Files to Modify
- `App.js:69` - Remove "TEMPORARILY ENABLED FOR DEBUGGING"
- `App.js:6223` - Remove "TEMPORARILY DISABLED TO TEST"
- All files with commented code blocks - Clean up or remove

### Success Criteria
- [ ] Zero temporary markers in code
- [ ] No large commented blocks
- [ ] No debug features in production
- [ ] All functionality maintained
- [ ] Clean code audit passes

### Roles
- Lead: Code cleanup
- Senior: Review for needed features
- Architect: Verify nothing critical removed

---

## TD010 - Implement Comprehensive Error Handling (P2)
**Status**: Not Started
**Type**: Full-Stack
**Effort**: Medium

### Context
Inconsistent error handling causes silent failures and poor user experience. Need comprehensive error boundaries and tracking.

### Implementation
1. Check existing: Error handling patterns, unhandled rejections, current error messages
2. Implement: React error boundaries, async error handlers, user-friendly messages, Sentry integration
3. Test: Errors caught and logged, recovery mechanisms work, helpful user messages

### Files to Modify
- `src/components/ErrorBoundary.js` - Create error boundary component
- `src/utils/errorHandler.js` - Create error handling utilities
- `src/services/sync/*` - Add proper error handling
- `App.js` - Wrap with error boundary
- All async operations - Add try-catch blocks

### Success Criteria
- [ ] All errors caught and handled
- [ ] User-friendly error messages
- [ ] Error tracking service integrated
- [ ] Recovery mechanisms work
- [ ] 90% reduction in crashes

### Roles
- Lead: Error handling implementation
- Senior: Error message quality
- Architect: Error tracking strategy

---

## Summary
- **Total Stories**: 10
- **P1 (Critical)**: 3 stories - iOS performance issues and architecture violations
- **P2 (Important)**: 5 stories - Quality and maintainability improvements
- **P3 (Nice to have)**: 2 stories - Code cleanup and abstractions
- **Total Effort**: 12-16 developer weeks

## Priority Sequence
1. **Sprint 1**: TD001 (iOS AsyncStorage), TD003 (Store violations)
2. **Sprint 2**: TD002 (NetInfo), TD004 (Console statements)
3. **Sprint 3**: TD010 (Error handling), TD005 (Bundle size)
4. **Sprint 4**: TD006 (TypeScript) - ongoing
5. **Sprint 5**: TD007 (Test coverage) - ongoing
6. **Maintenance**: TD008, TD009 (as time permits)