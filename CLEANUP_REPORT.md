# StackMap Codebase Cleanup Report

Generated: 2025-06-16

## Executive Summary

This report identifies obsolete files, outdated references, and areas requiring cleanup in the StackMap codebase. The analysis reveals several categories of issues that should be addressed to improve code maintainability and reduce confusion.

## 1. Obsolete JavaScript Files

### Files to Remove
- **None identified** - All JavaScript files currently in the codebase appear to be in use

### Files with Outdated References
1. **sw.js (Service Worker)**
   - Line 22: References `/app/PreferencesManager.js` which no longer exists
   - This file was replaced by HybridPanelManager.js but the service worker still tries to cache it

2. **config/index.js**
   - This file is purely documentation and not actually loaded
   - Contains references to removed managers: PreferencesManager, ValidationManager, FocusManager, WelcomeManager
   - Should be updated or removed if not needed

## 2. Obsolete CSS Files

### CSS Files Not Directly Loaded in index.html
These files are imported via index.css, which is fine, but some may contain obsolete content:

1. **styles/data-panel.css** and **styles/data-panel-animations.css**
   - These appear to be for an older panel system
   - Current system uses hybrid-panels.css
   - Should verify if these are still needed

2. **styles/forms.css**
   - Contains a comment referencing PreferencesManager at the top
   - The styles are still used but the comment should be updated

## 3. Debug and Test Files in Production

### Files that should not be deployed to production:
1. **debug-menu-test.html** - Debug tool for menu system
2. **drive-sync-debug.html** - Debug tool for Google Drive sync
3. **timer/index.html** - Appears to be a separate timer application, unclear if it's part of main app

## 4. Outdated Test Files

1. **tests/uat-edit-mode.js**
   - Marked as DEPRECATED in the file itself
   - Tests old UI that no longer exists
   - Should be removed in favor of uat-edit-mode-updated.js

## 5. Outdated References Throughout Codebase

### PreferencesManager References
Found in 11 files, including:
- Documentation files (README.md, component-inventory.md, architecture.md)
- Service worker (sw.js)
- Comments in various files

### TODO Comments
1. **app/StackMapApp.js**
   - Line 3268: `// TODO: Implement user creation form`
   - This appears to be implemented, so the TODO should be removed

## 6. Console.log Statements

### Production console.logs to review:
1. **app/StackMapApp.js** - Contains 20+ console.log statements
   - Some are commented out but should be removed
   - Others might be useful for debugging but should use a debug flag

2. **Multiple other files** contain console statements that should be:
   - Removed if not needed
   - Wrapped in a debug flag check
   - Converted to a proper logging system

## 7. Unused/Obsolete Documentation

### Context files with outdated information:
1. **context/component-inventory.md** - References removed managers
2. **context/architecture.md** - Contains outdated architecture information
3. **context/javascript-components.md** - May reference old components

## Recommendations

### Immediate Actions (High Priority):
1. Update **sw.js** to remove reference to PreferencesManager.js
2. Remove **tests/uat-edit-mode.js** (deprecated test file)
3. Remove or update the TODO comment in StackMapApp.js
4. Update **styles/forms.css** to remove PreferencesManager comment

### Short-term Actions (Medium Priority):
1. Review and potentially remove **styles/data-panel.css** and **styles/data-panel-animations.css**
2. Move debug files to a separate directory or remove from production builds:
   - debug-menu-test.html
   - drive-sync-debug.html
3. Implement a debug flag system for console.log statements
4. Update or remove **config/index.js** if it's just documentation

### Long-term Actions (Low Priority):
1. Update all documentation files to reflect current architecture
2. Consider if **timer/index.html** should be part of the main application
3. Implement a proper logging system to replace console.log usage
4. Create a build process that excludes test and debug files from production

## Summary Statistics

- **Obsolete file references found**: 11 instances of PreferencesManager
- **Debug/test files in production**: 3 files
- **Files with console.log statements**: 25 files
- **Deprecated test files**: 1 file
- **CSS files potentially obsolete**: 2 files
- **TODO comments found**: 1 instance

## Next Steps

1. Review this report with the development team
2. Create tickets for each category of cleanup
3. Prioritize based on impact to production and developer experience
4. Implement changes incrementally to avoid breaking functionality