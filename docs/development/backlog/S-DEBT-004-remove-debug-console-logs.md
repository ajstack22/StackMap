# Story: Remove All Console.logs and Debug Code from Production
## ID: S-DEBT-004
## Priority: P2
## Category: Technical Debt / Security
## Estimated Effort: M (3 days)

## Problem Statement
570+ console.log statements across 31 files are shipping to production, exposing internal state, user data, and system information. This creates security risks, increases bundle size, degrades performance, and looks unprofessional. Debug infrastructure files like debugSync.js and ArchivedOnboardingDebug.js are included in production builds.

## Requirements
### Functional Requirements
- [ ] Remove all console.log, console.warn, console.error statements
- [ ] Remove or conditionally compile debug components
- [ ] Implement proper logging service for production
- [ ] Preserve useful debug capabilities for development
- [ ] Add ESLint rule to prevent future console statements
- [ ] Clean up debug-only files from production bundle

### Non-Functional Requirements
- [ ] Zero console output in production build
- [ ] Bundle size reduction of 5-10%
- [ ] No loss of error tracking capability
- [ ] Development debugging unchanged
- [ ] Automated prevention of future issues

## Success Criteria
### Verification Commands
```bash
# No console statements in production build
npm run build:web
grep -r "console\." web/build/ | wc -l
# Should return 0

# Bundle size reduced
ls -lh web/build/static/js/*.js
# Should show 5-10% reduction

# ESLint catches console statements
echo "console.log('test');" > test.js
npx eslint test.js
# Should show error
rm test.js

# Development still works
npm start
# Console logs should work in dev

# No debug files in production
find web/build -name "*debug*" -o -name "*Debug*"
# Should return empty
```

### Acceptance Criteria
- [ ] All 570+ console statements removed/wrapped
- [ ] Debug files excluded from production
- [ ] Logging service implemented for errors
- [ ] ESLint rule active and enforced
- [ ] Bundle size measurably reduced
- [ ] No sensitive data leakage possible

## Implementation Notes
### Current Console.log Distribution
```
src/services/syncService.js: 89 occurrences
src/components/DataModal.js: 67 occurrences  
src/stores/useAppStore.js: 45 occurrences
src/components/ActivityLibrary.js: 43 occurrences
src/utils/: 38 occurrences
src/components/StackView.js: 31 occurrences
... 25 more files
```

### Implementation Strategy
```javascript
// Step 1: Create logging service
// src/services/logger.js
const logger = {
  debug: (...args) => {
    if (__DEV__) console.log(...args);
  },
  info: (...args) => {
    if (__DEV__) console.info(...args);
  },
  warn: (...args) => {
    if (__DEV__) console.warn(...args);
    // In production, send to error tracking
  },
  error: (...args) => {
    console.error(...args); // Keep errors in production
    // Send to error tracking service
  }
};

// Step 2: Replace all console.* with logger.*
// BEFORE:
console.log('[Sync] Starting sync', data);

// AFTER:
logger.debug('[Sync] Starting sync', data);

// Step 3: Remove debug components in production
// Use webpack DefinePlugin or conditional imports
if (__DEV__) {
  require('./debugSync');
}
```

### Files to Remove/Conditionally Include
```
src/services/debugSync.js - Development only
src/components/ArchivedOnboardingDebug.js - Remove entirely
src/utils/debugHelpers.js - Development only
```

### ESLint Configuration
```json
{
  "rules": {
    "no-console": ["error", {
      "allow": ["error"]
    }]
  },
  "overrides": [{
    "files": ["*.dev.js", "*.debug.js"],
    "rules": {
      "no-console": "off"
    }
  }]
}
```

## Testing Plan
### Verification Tests
- [ ] Build production bundle
- [ ] Search for console in build output
- [ ] Check bundle size reduction
- [ ] Verify no sensitive data exposed
- [ ] Test error reporting still works

### Platform Tests
- [ ] Web: Check browser console is clean
- [ ] iOS: Check Xcode console output
- [ ] Android: Check adb logcat output

### Development Tests
- [ ] Verify dev logging still works
- [ ] Hot reload not affected
- [ ] Debug tools functional

## Rollback Plan
### Risk Level: Low
### Rollback Steps:
1. Git revert the commit
2. Rebuild and deploy
3. No data changes needed

## Documentation Updates
- [ ] Add logging guidelines to CONTRIBUTING.md
- [ ] Update CLAUDE.md with no-console rule
- [ ] Document logger service usage
- [ ] Add to code review checklist

## Review Checklist
### For Developer
- [ ] All console.* replaced with logger.*
- [ ] Debug files removed from production
- [ ] ESLint rule configured and passing
- [ ] Bundle size reduced
- [ ] Development experience preserved

### For Peer Reviewer
- [ ] Grep build output for console
- [ ] Verify bundle size reduction
- [ ] Check error handling preserved
- [ ] Test development mode
- [ ] Validate no data leakage

## Security Considerations
Current console.logs expose:
- User personal data (names, activities)
- Sync tokens and keys (hashed but still sensitive)
- Internal state structure
- API endpoints and parameters
- Error stack traces with paths

## Search and Replace Commands
```bash
# Find all console.log occurrences
grep -r "console\.log" src/ --include="*.js" --include="*.jsx"

# Count by file
grep -r "console\." src/ --include="*.js" | cut -d: -f1 | uniq -c | sort -rn

# Auto-replace (careful review needed)
find src -name "*.js" -exec sed -i '' 's/console\.log/logger.debug/g' {} \;
find src -name "*.js" -exec sed -i '' 's/console\.warn/logger.warn/g' {} \;
```

## Notes
This is a security and professionalism issue:
1. Users can see internal debugging information
2. Sensitive data might be exposed
3. Bundle size unnecessarily large
4. Performance impact from string formatting
5. Makes the app look unfinished

Should be completed before any major release.

---
*Story created: 2025-01-13*
*Based on tech debt analysis*