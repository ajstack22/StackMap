# StackMap Refactor - Potentially Stale Code Report

**Generated**: December 2024  
**Purpose**: Identify potentially stale code in the refactor directory for developer review  
**Status**: For Analysis Only - These findings require developer verification

---

## Executive Summary

This report identifies potentially stale code patterns, unused functions, outdated comments, and technical debt in the StackMap refactor directory. Each finding should be reviewed to determine if the code is truly orphaned or still in use.

---

## Critical Findings

### 1. Duplicate/Overlapping Functionality

#### **messaging.js vs rsd-safe-init.js**
- Both files transform error messages for RSD (Rejection Sensitive Dysphoria) users
- Significant code duplication in transformation logic
- Integration between modules is fragile (messaging.js lines 314-322)
- Recommendation: Consolidate into single error transformation module

#### **Data Import/Export Duplication**
- `data-export.js` and `data-import.js` contain duplicate sanitization logic
- Both have identical HTML escaping functions
- Validation patterns are repeated
- Recommendation: Extract shared utilities

### 2. Unused Schema/Configuration

#### **db-schema.js**
- Contains Dexie IndexedDB schema (lines 253-263) but app uses SQLite
- Migration checkpoint structure defined but never implemented
- Placeholder validation logic not integrated with storage
- Status: Possibly intended for future use or legacy from previous iteration

#### **feature-flags.js**
- Experimental features permanently disabled:
  - `taskCardPool` (line 32)
  - `timerManagement` (line 36)
  - `aggressiveCleanup` (line 40)
- Telemetry code that doesn't send data anywhere (lines 261-292)
- Rollout percentage system not actively used

### 3. Console.log Statements (Should be removed for production)

Found in multiple files:
- `task-timer.js`: lines 459, 492, 551, 571
- `activity-library.js`: lines 32, 50, 63
- `app.js`: lines 277, 329, 1121, 1264
- `attachment-manager.js`: line 65
- `backup-manager.js`: lines 40, 105
- `celebration.js`: logging in init
- `data-export.js`: multiple debug logs
- `demo-mode.js`: extensive console logging
- `drag-drop-reorder.js`: debug logs
- `migration-manager.js`: progress logs
- `storage-adapter.js`: operation logs

### 4. Empty/Placeholder Functions

#### **grownup-mode.js**
```javascript
init: function() {
    // Initialize grown-up mode
}
```
- Empty init function (lines 10-12)
- No actual initialization code

#### **demo-mode.js**
- Event listener tracking array initialized but never properly used
- `eventListeners: []` (line 13) - listeners added but never removed

### 5. Over-Engineered Systems

#### **default-activities.js**
- 693 lines with massive hardcoded activity arrays
- Progressive loading system (ActivityLoader) seems excessive for current usage
- Could be simplified to JSON file loading
- Duplicate activity validation between methods

#### **blob-manager.js**
- Complex reference counting system that may be overkill
- Safari-specific quota monitoring that might not be necessary
- Memory tracking that duplicates browser capabilities

### 6. Legacy/Fallback Code

#### **localStorage Fallbacks**
Found in multiple files despite SQLite being primary storage:
- `storage-adapter.js`: Extensive localStorage code
- `default-activities.js`: localStorage initialization
- `task-sqlite.js`: localStorage migration code
- Question: Are these fallbacks still needed?

#### **Android 5 Compatibility**
- Extensive polyfills in `app.js` (lines 24-56)
- ES5 syntax requirements throughout
- Question: Is Android 5 support still required?

### 7. Commented Out Code Blocks

#### **edit-mode.js**
- Large block of commented validation logic (around task validation)
- Old event handler code commented but not removed

#### **task-display.js**
- Commented virtual scrolling implementation
- Old render methods kept as comments

### 8. Duplicate Utility Functions

#### **Mobile Detection**
Implemented separately in:
- `app.js`
- `drag-drop-reorder.js`
- `task-timer.js`
- `keyboard-nav.js`

#### **HTML Escaping**
Implemented separately in:
- `activity-library.js`
- `data-export.js`
- `data-import.js`
- `data-io-ui.js`
- `messaging.js`

### 9. Unused Variables/Parameters

#### **data-import.js**
- `promises` array declared but never used (line 523)

#### **task-sqlite.js**
- Several prepared statements defined but not used
- Migration status variables that don't affect flow

### 10. Development-Only Code

#### **URL Parameter Overrides**
- `feature-flags.js`: URL parameter override system (security risk in production)
- `app.js`: Safe mode URL parameters should be reviewed

#### **Test Data**
- `demo-mode.js`: Hardcoded demo task IDs
- Test user data embedded in code

---

## File-by-File Analysis

### Core Application Files

#### **app.js** (2441 lines)
- Safe mode constants defined but some never used
- Transaction ID overflow handling seems over-engineered (line 668)
- Memory monitor might duplicate browser DevTools
- Platform detection could be simplified
- Focus management cache might be premature optimization

#### **task-display.js**
- Virtual scrolling code commented out but not removed
- Card pool management disabled but code remains
- Legacy render methods kept as comments
- Some event handlers appear duplicated

#### **edit-mode.js**
- Validation logic partially commented out
- Draft system references but not fully implemented
- Some keyboard shortcuts defined but not hooked up

### Storage Layer

#### **storage-adapter.js**
- Extensive localStorage code despite SQLite being primary
- Migration code that may have already run for all users
- Backup detection logic that might be obsolete

#### **task-sqlite.js**
- Multiple prepared statements defined but unused
- Migration checkpoint system not implemented
- Legacy compatibility code for older DB versions

#### **sqlite-attachment-schema.js**
- Voice memo schema defined but implementation incomplete
- Sync fields present but sync not implemented
- Metadata fields that aren't populated

### UI Components

#### **photo-attachment-ui.js**
- Placeholder loading states that aren't styled
- Error retry logic that might not trigger
- Gallery view code that's disabled

#### **theme-manager.js**
- Custom theme validation that's never called
- Theme migration code for versions that might not exist
- Preview functionality that's not exposed

#### **settings-ui.js**
- Advanced settings panel that's hidden
- Export format options that aren't implemented
- Sync settings UI with no sync backend

### Utility Modules

#### **offline-queue.js**
- Complex queueing system but no clear consumers
- Retry logic that might conflict with service worker
- Priority system that's not utilized

#### **component-error-handler.js**
- Recovery scheduling that might not work as intended
- Error storage in sessionStorage that's never read
- Fallback UI that might not match current design

#### **keyboard-nav.js**
- TV navigation code in mobile-first app
- Complex spatial navigation that's not tested
- Gamepad support stubs that aren't implemented

---

## Recommendations

### Immediate Actions
1. **Remove all console.log statements** or wrap in debug flag
2. **Delete clearly unused code** (empty functions, commented blocks)
3. **Consolidate duplicate utilities** into shared modules
4. **Remove or implement feature flags** properly

### Short Term
1. **Audit localStorage fallbacks** - remove if SQLite is stable
2. **Simplify over-engineered systems** (blob manager, default activities)
3. **Extract hardcoded data** to separate JSON files
4. **Review Android 5 support** requirement

### Long Term
1. **Refactor duplicate error handling** (messaging.js vs rsd-safe-init.js)
2. **Implement or remove** placeholder features (sync, advanced settings)
3. **Modernize code** if Android 5 support can be dropped
4. **Add proper code documentation** instead of inline comments

---

## Metrics

- **Total JS Files Analyzed**: 49
- **Files with Console Logs**: 23 (47%)
- **Files with Duplicate Code**: 12 (24%)
- **Files with Commented Code**: 8 (16%)
- **Potentially Unused Files**: 3-5 (6-10%)

---

## Risk Assessment

### High Risk (Address Immediately)
- Console.log statements in production
- URL parameter overrides in feature flags
- Duplicate error transformation logic

### Medium Risk (Address Soon)
- Over-engineered systems consuming memory
- Untested fallback code paths
- Incomplete error recovery logic

### Low Risk (Technical Debt)
- Code comments and documentation
- Unused schema definitions
- Legacy compatibility code

---

## Conclusion

The refactor directory contains functional code but has accumulated technical debt through iterations. While most code serves a purpose, there are clear opportunities for cleanup and consolidation. Priority should be given to removing debug code, consolidating duplicates, and clarifying whether legacy fallbacks are still needed.

This report is based on static analysis and pattern recognition. Each identified item should be verified against current application behavior and future roadmap before removal.