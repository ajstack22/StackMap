# Fix Xcode Project File Error

## Quick Fix

1. **Close Xcode completely** (Cmd+Q)

2. **Re-open the workspace** (not the .xcodeproj):
   ```bash
   open /Users/adamstack/Desktop/StackMapNative/ios/StackMapNative.xcworkspace
   ```

3. **Try adding the font file again**

## If That Doesn't Work

1. **Close Xcode**

2. **Clean the build**:
   ```bash
   cd /Users/adamstack/Desktop/StackMapNative
   cd ios
   rm -rf build/
   rm -rf ~/Library/Developer/Xcode/DerivedData/StackMapNative-*
   ```

3. **Reinstall pods**:
   ```bash
   pod deintegrate
   pod install
   ```

4. **Open the workspace again**:
   ```bash
   open StackMapNative.xcworkspace
   ```

## Alternative: Edit Info.plist Directly

Instead of using Xcode's UI, you can edit the Info.plist file directly:

```bash
cd /Users/adamstack/Desktop/StackMapNative/ios/StackMapNative
```

Then edit `Info.plist` and add this before the closing `</dict>`:

```xml
<key>UIAppFonts</key>
<array>
    <string>MaterialIcons.ttf</string>
</array>
```

## Important Note

Always use the `.xcworkspace` file, not the `.xcodeproj` file when you have CocoaPods installed. The workspace includes both your project and the Pods.