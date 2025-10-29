# QR Scanner React Hooks Violation Fix

## Problem
The SyncQRScanner component had **conditional hook calls** which violates React's Rules of Hooks, causing crashes on iOS:

```javascript
// WRONG: Conditional hook calls
const device = useCameraDevice ? useCameraDevice('back') : null;
const permission = useCameraPermission ? useCameraPermission() : { hasPermission: false };
```

### React's Rules of Hooks
1. Only call hooks at the top level (not inside conditionals, loops, or nested functions)
2. The same hooks must be called in the same order on every render
3. Conditional execution of hooks causes React to throw errors

## Solution
Split the component into **platform-specific implementations** that properly call hooks unconditionally:

### New Architecture

```
SyncQRScanner.js (wrapper)
├── MobileQRScanner.js (iOS & Android)
│   └── Calls react-native-vision-camera hooks unconditionally
└── WebQRScanner.js (Web)
    └── Uses html5-qrcode (no hooks issues)
```

### Files Created/Modified

1. **MobileQRScanner.js** (NEW)
   - Always calls `useCameraDevice()`, `useCameraPermission()`, and `useCodeScanner()` unconditionally
   - Handles permissions, device availability, and scanning
   - Proper error states with helpful messages
   - Clean camera overlay UI with scan frame

2. **WebQRScanner.js** (NEW)
   - Web-specific implementation using html5-qrcode
   - No React hooks violations (doesn't use vision-camera)
   - Maintains existing web functionality

3. **SyncQRScanner.js** (REFACTORED)
   - Now a simple platform-aware wrapper
   - Routes to platform-specific components
   - Preserves `parseSyncKey()` function and export
   - Maintains same API for parent components

## Key Changes

### Before (Incorrect)
```javascript
// Module-level conditional imports
let useCameraDevice = null;
if (Platform.OS !== 'web') {
  const VisionCamera = require('react-native-vision-camera');
  useCameraDevice = VisionCamera.useCameraDevice;
}

// Component with conditional hook calls
const device = useCameraDevice ? useCameraDevice('back') : null; // ❌ WRONG
```

### After (Correct)
```javascript
// MobileQRScanner.js - Always imports and calls hooks
import { useCameraDevice } from 'react-native-vision-camera';

const MobileQRScanner = () => {
  // Always call hooks unconditionally ✅
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const codeScanner = useCodeScanner({ ... });

  // Conditional rendering AFTER hooks
  if (!hasPermission) return <PermissionError />;
  if (!device) return <NoDeviceError />;

  return <Camera device={device} codeScanner={codeScanner} />;
};
```

## Testing Checklist

### iOS Testing
- [ ] Open SyncQRScanner modal
- [ ] Verify no crash on mount
- [ ] Grant camera permission when prompted
- [ ] Scan a valid StackMap QR code
- [ ] Verify sync key is parsed correctly
- [ ] Test error handling (invalid QR code)
- [ ] Test cancel button

### Android Testing
- [ ] Open SyncQRScanner modal
- [ ] Grant camera permission when prompted
- [ ] Scan a valid StackMap QR code
- [ ] Verify sync key is parsed correctly
- [ ] Test error handling
- [ ] Test cancel button

### Web Testing
- [ ] Open SyncQRScanner modal in browser
- [ ] Allow camera access
- [ ] Scan a valid StackMap QR code
- [ ] Verify sync key is parsed correctly
- [ ] Test error handling
- [ ] Test cancel button

### Test QR Codes
Generate test QR codes with:
```javascript
// Full URL format
https://stackmap.app/?sync=a1b2c3d4e5f6789012345678901234ab

// Beta URL format
https://stackmap.app/beta/?sync=a1b2c3d4e5f6789012345678901234ab

// Direct key format (32 hex chars)
a1b2c3d4e5f6789012345678901234ab
```

## What Was Preserved
- `parseSyncKey()` function logic (unchanged)
- All existing tests (25 tests, all passing)
- Component API (same props: `visible`, `onClose`, `onScanSuccess`, `theme`)
- Error handling and user messaging
- Platform-specific behavior (web vs mobile)

## Why This Fix Works

1. **No Conditional Hooks**: Each platform-specific component calls its hooks unconditionally at the top level
2. **Proper Hook Order**: Hooks are always called in the same order on every render
3. **Clean Separation**: Platform concerns are isolated, making code easier to maintain
4. **React Compliant**: Follows React's official guidance for hooks

## Related Documentation
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [react-native-vision-camera docs](https://react-native-vision-camera.com/docs/guides)
- [Field Conventions](../features/field-conventions.md)

## Deployment Notes
- No breaking changes to component API
- No database or sync changes required
- Test on all platforms before production deployment
- Monitor crash reports after deployment to verify fix

## Date
January 29, 2025
