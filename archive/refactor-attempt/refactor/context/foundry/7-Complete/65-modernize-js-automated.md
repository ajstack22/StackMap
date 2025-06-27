# Story #65.1: Automated ES6 Conversion - Safe Transforms

## Summary
Use automated tools to convert basic ES5 patterns to ES6 syntax. This covers the "safe" transforms that don't change behavior.

## Background
Android 5 is no longer supported by Google Play. We can now use ES6+ features (Android 6+, iOS 10+).

## Acceptance Criteria
- [ ] All `var` declarations converted to `const`/`let`
- [ ] Template literals replace string concatenation
- [ ] Default parameters replace `|| false` patterns
- [ ] Array.includes() replaces indexOf() !== -1
- [ ] All changes pass existing tests
- [ ] No behavioral changes

## Technical Approach

### 1. Setup
```bash
# Install conversion tool
npm install -g lebab

# Create backup
cp -r js js-backup-es5
```

### 2. Run Automated Conversions
```bash
# Safe transforms that won't break anything
for file in js/*.js; do
    lebab "$file" -o "$file" --transform let,template,default-param,includes
done
```

### 3. Manual Review Required
After running lebab, manually review for:
- `const` used for values that never change
- `let` used for values that get reassigned
- Template literals make sense (not for simple strings)
- Default parameters don't break existing calls

### 4. Specific Patterns to Convert

#### String Concatenation → Template Literals
```javascript
// Before
var message = 'You have ' + count + ' tasks for ' + day;

// After
const message = `You have ${count} tasks for ${day}`;
```

#### Default Parameters
```javascript
// Before
function createTask(text, completed) {
    completed = completed || false;
}

// After
function createTask(text, completed = false) {
}
```

#### Array.includes()
```javascript
// Before
if (allowedTypes.indexOf(type) !== -1) { }

// After
if (allowedTypes.includes(type)) { }
```

## Files to Process (Priority Order)
1. `js/app.js` - Main application file
2. `js/storage-adapter.js` - Storage layer
3. `js/task-display.js` - UI components
4. `js/theme-manager.js` - Theme system
5. `js/data-export.js` - Export functionality
6. `js/data-import.js` - Import functionality
7. All other JS files

## Testing
1. Run existing test suite
2. Manual smoke test:
   - Create a task
   - Complete a task
   - Switch themes
   - Import/export data
3. Verify no console errors
4. Check on Chrome 51+ (minimum supported)

## Definition of Done
- All safe ES5 patterns converted to ES6
- No behavioral changes
- All tests pass
- Code reviewed for const vs let usage
- No console errors in Chrome 51+

## Time Estimate
2-3 hours including testing

## Notes
- This is the safest first step
- Commit after each file or group of files
- If unsure about a conversion, skip it for Story #65.2
- Focus on patterns that lebab can handle automatically