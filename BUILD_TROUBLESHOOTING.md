# React Native iOS Build Troubleshooting

## Common Build Failures and Fixes

### 1. Check the Error in Xcode
Look at the left panel in Xcode - there should be a red error icon. Click on it to see the specific error message.

### 2. Most Common Fixes

#### Missing Dependencies
```bash
cd /Users/adamstack/Desktop/StackMapNative
npm install
cd ios
pod install
```

#### Clean Everything
```bash
cd /Users/adamstack/Desktop/StackMapNative

# Clean watchman
watchman watch-del-all

# Clean Metro
rm -rf node_modules
npm install

# Clean iOS
cd ios
rm -rf Pods
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData/StackMapNative-*
pod install
```

#### Reset Metro
```bash
cd /Users/adamstack/Desktop/StackMapNative
npx react-native start --reset-cache
```

### 3. Common Specific Errors

#### "No bundle URL present"
- Make sure Metro is running: `npm start` in the project directory
- Then build again in Xcode

#### "Library not found for -lPods-StackMapNative"
```bash
cd ios
pod deintegrate
pod install
```

#### "react-native-vector-icons" errors
- The font file might not be properly linked
- Try the manual method in FIX_MATERIAL_ICONS.md

### 4. Nuclear Option - Fresh Start
If nothing works:
```bash
cd /Users/adamstack/Desktop/StackMapNative
rm -rf ios/Pods ios/build node_modules
npm install
cd ios
pod install
```

Then in Xcode:
- Product → Clean Build Folder (Cmd+Shift+K)
- Product → Build (Cmd+B)

## What's the Error?
Can you tell me what specific error message Xcode is showing? Common ones are:
- Build input file cannot be found
- Module not found
- Linker errors
- Code signing errors

The exact error will help me provide a more specific fix.