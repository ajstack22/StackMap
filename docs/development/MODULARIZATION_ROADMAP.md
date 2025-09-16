# Modularization Roadmap - APR Execution Plan

## Executive Summary
Transform 3 monolithic components (7,143 total lines) into 30+ focused modules to improve maintainability, testability, and performance.

### Current State
- **DataModal.js**: 2,678 lines (largest file)
- **ActivityLibrary.js**: 2,576 lines
- **EmojiPicker.js**: 1,889 lines
- **Impact**: Poor maintainability, hard to test, large bundle size

### Target State
- **30+ focused modules** (<300 lines each)
- **Improved test coverage** (25%+)
- **40% bundle size reduction** via code splitting
- **Zero functional regressions**

---

## Phase 1: DataModal Decomposition (Sprint 1)
**Timeline**: 3-4 days
**Target**: Split 2,678 lines into 8 modules

### Story 1.1: Export Module Extraction
**Status**: ✅ Started (DataExport.js created)
**Remaining Work**:
- Complete DataExport.js integration
- Add comprehensive tests
- Verify no regressions

**Success Metrics**:
```bash
# Module size under 300 lines
wc -l src/components/Modals/DataModal/DataExport.js
# Tests pass
npm test -- DataExport.test.js
# No console errors
npm run build:web
```

### Story 1.2: Import Module Extraction
**Files to Create**:
- `DataImport.js` - File selection and parsing
- `ImportPreview.js` - Data preview component
- `ImportConfirmation.js` - Confirmation dialog

**Requirements**:
- [ ] Extract handleSelectFile and related logic
- [ ] Extract import state management
- [ ] Maintain file picker compatibility
- [ ] Preserve data validation

**Test Scenarios**:
- Import valid JSON file
- Handle invalid JSON gracefully
- Test merge vs fresh import
- Verify data normalization

### Story 1.3: Sync Management Module
**Files to Create**:
- `SyncManagement.js` - Main sync operations
- `SyncStatus.js` - Status display component
- `RecoveryPhrase.js` - Recovery phrase handling
- `SyncQRCode.js` - QR code generation

**Requirements**:
- [ ] Extract all sync-related functions
- [ ] Separate sync state management
- [ ] Maintain syncService integration
- [ ] Preserve error handling

**Test Scenarios**:
- Enable/disable sync
- Recovery phrase generation
- Manual sync trigger
- Network error handling

### Story 1.4: Data Settings Module
**Files to Create**:
- `DataSettings.js` - Reset and maintenance
- `DataReset.js` - Reset confirmation
- `ShareManagement.js` - Share functionality

**Requirements**:
- [ ] Extract reset functionality
- [ ] Move share management logic
- [ ] Maintain confirmation modals
- [ ] Preserve data integrity checks

### Story 1.5: Integration & Cleanup
**Requirements**:
- [ ] Update DataModal.js to use new modules
- [ ] Remove extracted code from original
- [ ] Verify all functionality works
- [ ] Update imports across codebase

**Success Metrics**:
- DataModal.js < 500 lines
- All features functional
- No performance regression
- Tests pass

---

## Phase 2: ActivityLibrary Decomposition (Sprint 2)
**Timeline**: 3-4 days
**Target**: Split 2,576 lines into 10 modules

### Story 2.1: Header Component Extraction
**Files to Create**:
- `LibraryHeader.js` - Top navigation
- `TabSelector.js` - Tab switching logic
- `LibraryActions.js` - Action buttons

**Requirements**:
- [ ] Extract header rendering
- [ ] Separate tab management
- [ ] Maintain theme support

### Story 2.2: Search & Filter Module
**Files to Create**:
- `SearchBar.js` - Search input component
- `FilterControls.js` - Filter options
- `SortControls.js` - Sorting logic

**Requirements**:
- [ ] Extract search functionality
- [ ] Separate filter state
- [ ] Maintain performance

### Story 2.3: Activity Grid Module
**Files to Create**:
- `ActivityGrid.js` - Main grid display
- `ActivityCard.js` - Individual cards
- `EmptyState.js` - Empty state display

**Requirements**:
- [ ] Extract grid rendering
- [ ] Separate card logic
- [ ] Maintain drag-drop support

### Story 2.4: Category Management
**Files to Create**:
- `CategoryList.js` - Category display
- `CategoryEditor.js` - Edit functionality
- `CategoryActions.js` - CRUD operations

**Requirements**:
- [ ] Extract category logic
- [ ] Separate state management
- [ ] Preserve animations

### Story 2.5: Integration
**Requirements**:
- [ ] Update ActivityLibrary.js
- [ ] Verify all features
- [ ] Performance testing

---

## Phase 3: EmojiPicker Decomposition (Sprint 3)
**Timeline**: 2-3 days
**Target**: Split 1,889 lines into 8 modules

### Story 3.1: Search Module
**Files to Create**:
- `EmojiSearch.js` - Search bar
- `SearchResults.js` - Results display

### Story 3.2: Category Module
**Files to Create**:
- `EmojiCategories.js` - Category tabs
- `CategoryContent.js` - Category grids

### Story 3.3: Grid Display
**Files to Create**:
- `EmojiGrid.js` - Main grid
- `EmojiItem.js` - Individual emoji

### Story 3.4: Recent & Favorites
**Files to Create**:
- `RecentEmojis.js` - Recently used
- `FavoriteEmojis.js` - Favorites

### Story 3.5: Integration
- Update EmojiPicker.js
- Test all functionality

---

## Phase 4: Performance Optimization (Sprint 4)
**Timeline**: 2-3 days

### Story 4.1: Code Splitting Implementation
**Requirements**:
- [ ] Lazy load heavy components
- [ ] Implement React.lazy for modals
- [ ] Add loading states

**Success Metrics**:
```bash
# Bundle size reduction
ls -lh web/build/static/js/*.js
# Should show 40% reduction
```

### Story 4.2: Dynamic Imports
**Requirements**:
- [ ] Dynamic import for EmojiPicker
- [ ] Lazy load sync services
- [ ] Defer non-critical modules

### Story 4.3: Asset Optimization
**Requirements**:
- [ ] Optimize images
- [ ] Tree-shake dependencies
- [ ] Remove unused code

---

## APR Process for Each Story

### Developer Requirements
1. Create module with < 300 lines
2. Maintain exact functionality
3. Add comprehensive tests
4. Document all changes
5. Verify no regressions

### Success Metrics
```bash
# Size check
find src -name "*.js" -exec wc -l {} \; | sort -rn | head -5
# All should be < 500 lines

# Test coverage
npm test -- --coverage
# Should reach 25%

# Build verification
npm run build:web
# Bundle < 3.5MB

# Performance
# Load time < 2s
```

### Peer Review Checklist
- [ ] Module size < 300 lines
- [ ] All tests pass
- [ ] No functionality lost
- [ ] No performance regression
- [ ] Clean code principles followed
- [ ] Proper error handling

---

## Risk Mitigation

### High Risk Areas
1. **State Management**: Modules share state
   - Solution: Use context or props carefully

2. **Import Cycles**: Circular dependencies
   - Solution: Clear module boundaries

3. **Performance**: Too many small files
   - Solution: Smart bundling strategy

### Rollback Strategy
- Each phase in separate branch
- Feature flags for gradual rollout
- Comprehensive test suite before merge

---

## Success Criteria

### Phase Completion
- [ ] All files < 500 lines
- [ ] Test coverage > 25%
- [ ] Bundle size < 3.5MB
- [ ] Load time < 2s
- [ ] Zero regressions

### Overall Project Success
- [ ] 30+ focused modules created
- [ ] 40% bundle size reduction
- [ ] 2x improvement in test coverage
- [ ] Improved maintainability score

---

## Execution Schedule

**Week 1**: Phase 1 - DataModal (5 stories)
**Week 2**: Phase 2 - ActivityLibrary (5 stories)
**Week 3**: Phase 3 - EmojiPicker (5 stories) + Phase 4 Performance
**Week 4**: Testing, optimization, and deployment

Total: **20 APR stories** over 4 weeks

---

## Notes for APR Process

Each story should be:
1. **Assigned individually** to a developer
2. **Peer reviewed adversarially** before merge
3. **Tested on all platforms** (Web, iOS, Android)
4. **Performance measured** before/after

Maximum 3 review iterations before escalation.

---

*Roadmap Version: 1.0*
*Created: 2025-01-15*
*Aligned with: APR Process v1.0*