# StackMap Codebase Cleanup Report
Generated: 2025-06-18

## Executive Summary
The StackMap codebase shows signs of evolution and course changes, with remnants of removed features and some organizational issues. This report identifies specific cleanup actions to improve code quality, maintainability, and performance.

## 1. Orphaned Files to Remove

### Backup Files
- [ ] `components.js.bak` - Backup file that should be removed

### Test/Development Files  
- [ ] `test-pin-functionality.js` - Appears to be a one-off test file
- [ ] `deploy-log-2025-06-10-192244.txt` - Old deployment log
- [ ] `deploy-checklist.txt` - Should be in docs if needed

### Old Documentation
- [ ] Multiple cleanup reports that are outdated:
  - `CLEANUP_REPORT.md`
  - `CLEANUP_SUMMARY_2025-06-16.md`
  - `DEPENDENCY_ANALYSIS.md`
  - `UAT_TEST_UPDATE_REPORT.md`

## 2. Dead Code Within Files

### StackMapApp.js
- [ ] Remove commented references to removed components (lines 25-31):
  - PreferencesManager comments
  - DataManagementPanel comments
  - Edit FAB comments
- [ ] Remove TODO comment (needs investigation)

### CSS Files
- [ ] `fab.css` - Entire file can be removed (FAB functionality was removed)
- [ ] Clean up CSS references to:
  - `.fab` classes
  - `.floating-action-button` classes
  - `.preferences-manager` classes
  - `.data-management-panel` classes

## 3. Console Statements to Remove
Found in 23 files - need systematic removal of console.log statements except for:
- Error handling logs
- Service worker logs
- Test files

Priority files with most console.logs:
- [ ] app/StackMapApp.js
- [ ] drive-sync.js
- [ ] state.js
- [ ] renderer.js
- [ ] js/HybridPanelManager.js

## 4. File Organization Improvements

### Suggested New Structure:
```
/StackMap
├── /src
│   ├── /app           # Main application files
│   ├── /components    # UI components
│   ├── /services      # Business logic (drive-sync, state)
│   ├── /utils         # Utility functions
│   └── /config        # Configuration files
├── /styles            # All CSS files
├── /assets            # Icons, images
├── /tests             # Test files
├── /docs              # Documentation
├── /scripts           # Build/deploy scripts
└── /public            # Static files (index.html, manifest.json)
```

### Files to Move:
- [ ] Move `drive-sync.js` → `/src/services/drive-sync.js`
- [ ] Move `state.js` → `/src/services/state.js`
- [ ] Move `renderer.js` → `/src/services/renderer.js`
- [ ] Move `components.js` → `/src/components/legacy-components.js`
- [ ] Move all icon files → `/assets/icons/`
- [ ] Move `env-loader.js` → `/src/config/env-loader.js`
- [ ] Move `dev-tools.js` → `/src/utils/dev-tools.js`

## 5. Code Quality Issues

### Naming Conventions
- [ ] Inconsistent file naming (kebab-case vs camelCase)
- [ ] Standardize on one convention (recommend kebab-case for files)

### Component Architecture
- [ ] Components.js is a monolithic file with multiple components
- [ ] Split into individual component files
- [ ] Convert to ES6 modules with proper imports/exports

### Error Handling
- [ ] Add try-catch blocks to async operations
- [ ] Standardize error logging approach
- [ ] Remove generic catch blocks that swallow errors

## 6. Security Concerns

### Hardcoded Values
- [ ] Google Drive API credentials appear to be hardcoded
- [ ] Move to environment variables or secure configuration

### Content Security Policy
- [ ] Review and tighten CSP headers
- [ ] Remove 'unsafe-inline' where possible

## 7. Performance Optimizations

### CSS Optimization
- [ ] Combine related CSS files
- [ ] Remove duplicate rules
- [ ] Minimize CSS specificity

### JavaScript Loading
- [ ] Consider bundling with webpack/rollup
- [ ] Implement code splitting
- [ ] Lazy load non-critical components

### Bundle Size
- [ ] Puppeteer (21MB) is only used for testing - ensure it's not in production
- [ ] Review if both puppeteer and playwright are needed

## 8. Test Organization

### Current Issues:
- [ ] Test files mixed with different approaches (puppeteer vs playwright)
- [ ] No clear test structure or naming convention
- [ ] UAT tests could be better organized

### Recommendations:
- [ ] Standardize on one testing framework
- [ ] Create test categories: unit/, integration/, e2e/
- [ ] Add test documentation

## 9. Documentation Cleanup

### To Consolidate:
- [ ] Multiple deployment guides should be merged
- [ ] Create single source of truth for each topic
- [ ] Remove outdated documentation

### To Create:
- [ ] Architecture overview document
- [ ] Component interaction diagram
- [ ] State management flow chart

## 10. Immediate Priority Actions

1. **Remove orphaned files** (Low risk, high impact)
2. **Remove console.log statements** (Low risk, improves production quality)
3. **Delete fab.css and related styles** (Low risk, reduces CSS size)
4. **Clean up commented code** (Low risk, improves readability)
5. **Organize test files** (Medium risk, improves maintainability)

## 11. Medium-term Improvements

1. **Reorganize file structure** (Medium risk, high long-term value)
2. **Split components.js** (Medium risk, improves modularity)
3. **Implement proper build process** (Higher risk, significant benefits)
4. **Standardize coding conventions** (Low risk, improves consistency)

## 12. Preventing Future Issues

### Recommended Practices:
1. **Code Review Process**
   - Enforce removal of console.logs
   - Check for unused code
   - Verify proper file organization

2. **Automated Checks**
   - ESLint rules for console statements
   - CSS linting for unused styles
   - Pre-commit hooks for code quality

3. **Documentation Standards**
   - Require updates when features change
   - Regular documentation reviews
   - Clear deprecation process

4. **Feature Flag System**
   - Instead of commenting code, use feature flags
   - Clean removal process for deprecated features

## Next Steps

1. Review this report and prioritize actions
2. Create execution plan with timelines
3. Set up automation to prevent regression
4. Schedule regular codebase health checks

## Metrics to Track

- Number of files
- Lines of code
- Bundle size
- Test coverage
- Documentation coverage
- Technical debt score

---

Once this report is approved, we can create an execution script to perform all agreed-upon actions systematically.