# Story: Refactor God Objects (DataModal and ActivityLibrary)
## ID: S-DEBT-002
## Priority: P1
## Category: Technical Debt / Architecture
## Estimated Effort: XL (2 weeks)

## Problem Statement
DataModal.js (2672 lines) and ActivityLibrary.js (2212 lines) are massive god objects that violate every principle of maintainable code. These files handle multiple responsibilities, are impossible to test in isolation, cause slow development velocity, and create high risk for regression bugs. Any change requires understanding thousands of lines of intertwined logic.

## Requirements
### Functional Requirements
- [ ] Break DataModal into focused components (< 300 lines each)
- [ ] Split ActivityLibrary into logical modules
- [ ] Maintain 100% backward compatibility
- [ ] Preserve all current functionality
- [ ] Improve load time performance by 20%+
- [ ] Enable tree-shaking for unused code
- [ ] Create clear module boundaries

### Non-Functional Requirements
- [ ] No user-visible changes
- [ ] No data migration required
- [ ] Components individually testable
- [ ] Follow single responsibility principle
- [ ] Reduce cognitive complexity score by 50%

## Success Criteria
### Verification Commands
```bash
# File size validation
find src/components -name "*.js" -exec wc -l {} \; | awk '$1 > 500 {print $2 " has " $1 " lines"}'
# Should return empty (no files > 500 lines)

# Complexity analysis
npx complexity-report src/components/DataModal/
# Cyclomatic complexity should be < 10 per function

# Bundle size improvement
ls -lh web/build/static/js/*.js
# Should show 20%+ reduction

# All functionality preserved
npm test
npm run build:web
./scripts/qual_deploy.sh --skip-tests
```

### Acceptance Criteria
- [ ] DataModal split into 8-10 focused components
- [ ] ActivityLibrary split into 5-7 modules
- [ ] Each file < 500 lines
- [ ] Clear separation of concerns
- [ ] Improved import/export structure
- [ ] Unit tests for each module

## Implementation Notes
### DataModal Refactoring Plan
```
DataModal.js (2672 lines) → Split into:
├── DataModal.container.js (150 lines) - Main container
├── UserDataSection.js (300 lines) - User management
├── ActivityDataSection.js (300 lines) - Activity management
├── SyncDataSection.js (250 lines) - Sync functionality
├── ImportExportSection.js (200 lines) - Import/export
├── DataVisualization.js (200 lines) - Charts/stats
├── ValidationHelpers.js (150 lines) - Data validation
├── ModalLayout.js (100 lines) - Layout wrapper
└── useDataModal.js (200 lines) - Shared hook logic
```

### ActivityLibrary Refactoring Plan
```
ActivityLibrary.js (2212 lines) → Split into:
├── ActivityLibrary.container.js (200 lines) - Main container
├── CategoryManager.js (300 lines) - Category CRUD
├── ActivityManager.js (300 lines) - Activity CRUD
├── LibrarySearch.js (200 lines) - Search/filter
├── TemplateManager.js (250 lines) - Template handling
├── ActivityCard.js (150 lines) - Card component
├── useActivityLibrary.js (200 lines) - Shared logic
└── libraryConstants.js (100 lines) - Constants
```

### Migration Strategy
1. Create new file structure without removing old files
2. Gradually move logic to new components
3. Update imports incrementally
4. Test extensively at each step
5. Remove old files only after full validation

## Testing Plan
### Unit Tests
- [ ] Test each new component in isolation
- [ ] Mock dependencies properly
- [ ] Verify state management
- [ ] Test event handlers
- [ ] Validate prop types

### Integration Tests
- [ ] Full user flow through DataModal
- [ ] Library management operations
- [ ] Sync functionality preserved
- [ ] Import/export working
- [ ] Platform compatibility

### Performance Tests
- [ ] Initial load time improved
- [ ] Re-render performance better
- [ ] Memory usage reduced
- [ ] Bundle size decreased

## Rollback Plan
### Risk Level: Medium
### Rollback Steps:
1. Keep old files during refactoring
2. Use feature flag to toggle new/old
3. If issues found, revert imports
4. Full git revert if critical issues

## Documentation Updates
- [ ] Update component documentation
- [ ] Create architecture diagram
- [ ] Document new file structure
- [ ] Update import guidelines in CLAUDE.md

## Review Checklist
### For Developer
- [ ] All functionality preserved
- [ ] No files > 500 lines
- [ ] Clear module boundaries
- [ ] Tests for each module
- [ ] Performance improved

### For Peer Reviewer
- [ ] Verify no regression
- [ ] Check separation of concerns
- [ ] Validate performance gains
- [ ] Review test coverage
- [ ] Confirm backward compatibility

## Platform Considerations
- **Web**: Ensure code splitting works
- **iOS**: Test modal performance
- **Android**: Verify FlexWrap behavior maintained

## Notes
These god objects are causing:
1. 5x longer development time for features
2. High risk of regression bugs
3. Impossible to unit test
4. Poor performance due to unnecessary re-renders
5. New developer onboarding difficulty

Breaking them up is essential for maintainability and will immediately improve development velocity.

---
*Story created: 2025-01-13*
*Based on tech debt analysis*