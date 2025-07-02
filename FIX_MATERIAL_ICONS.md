# Fix Material Icons in React Native iOS

The Material Icons are showing as "?" because the font files need to be properly linked in the iOS project. Here's how to fix it:

## Automatic Fix (Try First)

Run this in Terminal:
```bash
cd /Users/adamstack/Desktop/StackMapNative/ios
pod install
```

If that doesn't work, proceed to manual fix:

## Manual Fix in Xcode

1. **Open the project in Xcode**:
   ```bash
   open /Users/adamstack/Desktop/StackMapNative/ios/StackMapNative.xcworkspace
   ```

2. **Add the font file to your project**:
   - In Xcode, right-click on the `StackMapNative` folder (not the top-level project)
   - Select "Add Files to 'StackMapNative'..."
   - Navigate to: `/Users/adamstack/Desktop/StackMapNative/node_modules/react-native-vector-icons/Fonts`
   - Select `MaterialIcons.ttf`
   - Make sure these options are checked:
     - ✅ Copy items if needed
     - ✅ Add to targets: StackMapNative
   - Click "Add"

3. **Update Info.plist**:
   - In Xcode, find and click on `Info.plist`
   - Right-click on the list and select "Add Row"
   - Type `UIAppFonts` (it will auto-complete to "Fonts provided by application")
   - Click the arrow to expand it
   - Click the + button to add an item
   - Type: `MaterialIcons.ttf`

   Or add this directly to Info.plist:
   ```xml
   <key>UIAppFonts</key>
   <array>
       <string>MaterialIcons.ttf</string>
   </array>
   ```

4. **Clean and rebuild**:
   - In Xcode: Product → Clean Build Folder (Cmd+Shift+K)
   - Then build and run again (Cmd+R)

## What's Fixed

✅ Material Icons will now display correctly instead of showing "?"
✅ The emoji picker now works inline within the add activity modal
✅ No more modal conflicts when selecting emojis

## Emojis Now Use Fallback

Since Material Icons might take a moment to set up, I've also updated the code to use text emojis as fallbacks for the edit/delete buttons when in edit mode. This ensures the app is always functional even if the icons aren't loaded yet.