# Emergency Hotfix Issues - Full Context

## 1. Service Worker 404 Error

### Error
```
TypeError: Failed to register a ServiceWorker for scope ('http://127.0.0.1:5502/js/') 
with script ('http://127.0.0.1:5502/js/service-worker.js'): 
A bad HTTP response code (404) was received when fetching the script.
```

### Root Cause
- **Location**: `/refactor/js/app.js:2258`
- **Problem**: Using absolute path `/js/service-worker.js` instead of relative path
- **Actual file location**: `/refactor/js/service-worker.js`

### Fix
```javascript
// In app.js line 2258, change:
navigator.serviceWorker.register('/js/service-worker.js')
// To:
navigator.serviceWorker.register('./service-worker.js')
// Or temporarily comment out:
// navigator.serviceWorker.register('/js/service-worker.js')
```

---

## 2. EditMode.isEnabled Error

### Error
```
TypeError: window.EditMode.isEnabled is not a function
```

### Root Cause
- **Locations**: 
  - `/refactor/js/today-tomorrow.js:629`
  - `/refactor/js/today-tomorrow.js:965`
- **Problem**: Calling `isEnabled()` but EditMode exposes `isActive()` method
- **EditMode API**: The public method is `isActive()` (see edit-mode.js:559)

### Fix
```javascript
// In today-tomorrow.js line 629, change:
if (window.EditMode && window.EditMode.isEnabled()) {
// To:
if (window.EditMode && window.EditMode.isActive()) {

// In today-tomorrow.js line 965, change:
if (!window.EditMode || !window.EditMode.isEnabled()) return;
// To:
if (!window.EditMode || !window.EditMode.isActive()) return;
```

---

## 3. Photo Storage Error

### Error
```
TypeError: Cannot set property message of which has only a getter
```

### Root Cause
- **Location**: `/refactor/js/photo-attachment-storage.js`
- **Problem**: Trying to access/stringify DOMException objects with read-only properties
- **Specific lines**: 121 and 311-319

### Fix
```javascript
// Line 121, change:
var error = new Error('Failed to open photo database: ' + (event.target.error || 'Unknown error'));
// To:
var errorMsg = event.target.error ? String(event.target.error.message || event.target.error) : 'Unknown error';
var error = new Error('Failed to open photo database: ' + errorMsg);

// Lines 311-319, change error handling to:
var error = event.target.error;
var errorName = error && error.name ? String(error.name) : '';
var errorMessage = 'Failed to store photo';

if (errorName === 'QuotaExceededError') {
    errorMessage = 'Storage quota exceeded. Please free up space.';
} else if (errorName) {
    errorMessage = 'Storage error: ' + errorName;
}
```

---

## GitHub Issue Template

### Title: Emergency Hotfixes for Critical Runtime Errors

### Description:
The app is currently unusable due to three critical runtime errors that occur on startup. These need immediate hotfixes to restore basic functionality.

### Errors:
1. **Service Worker 404**: Registration path mismatch
2. **EditMode Method Error**: Calling wrong method name
3. **Photo Storage Error**: Attempting to modify read-only error properties

### Impact:
- App completely unusable
- Affects all users
- Blocking all functionality

### Priority: 🚨 CRITICAL - P0

### Estimated Time: 1-2 hours for all three fixes

### Testing:
After fixes, verify:
- [ ] App loads without console errors
- [ ] Service worker registers successfully (or is safely disabled)
- [ ] Edit mode toggles work correctly
- [ ] Photo attachments can be added without crashes