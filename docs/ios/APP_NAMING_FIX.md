# App Naming Fix Documentation

## Problem
When changing the app name from "StackMapNative" to "StackMap", the JavaScript registration must match the native platform expectations.

## Files That Need to Be Updated

### 1. JavaScript Side
- `app.json` - Set `"name": "StackMap"` ✅
- `package.json` - Set `"name": "StackMap"` ✅
- `index.js` - Uses `import { name as appName } from './app.json'` (automatic) ✅

### 2. Android Side
- `/android/app/src/main/res/values/strings.xml` - Set `app_name` to "StackMap" ✅
- `/android/app/src/main/java/com/stackmapnative/MainActivity.kt` - Change `getMainComponentName()` to return "StackMap" ✅

### 3. iOS Side
- `/ios/StackMapNative/Info.plist` - Set `CFBundleDisplayName` to "StackMap" ✅
- `/ios/StackMapNative/AppDelegate.swift` - Change `withModuleName` parameter to "StackMap" ✅

## Error Message
If these don't match, you'll see:
```
"StackMapNative" has not been registered. This can happen if:
* Metro (the local dev server) is run from the wrong folder...
```

## Important Notes
- The app will display as "StackMap" to users
- The project folders and package names still contain "StackMapNative" but this doesn't affect the display name
- After making these changes, rebuild both Android and iOS apps

## Commands
```bash
# Android
./run-android.sh

# iOS
cd ios && pod install && cd ..
npm run ios
```