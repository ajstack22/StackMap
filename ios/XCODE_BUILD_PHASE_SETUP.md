# iOS Production Build Setup

## Add Build Phase for NODE_ENV=production

To ensure console.logs are stripped from iOS production builds, you need to add a build phase in Xcode:

### Steps:

1. Open `ios/StackMapNative.xcworkspace` in Xcode
2. Select the StackMapNative target (in the left sidebar)
3. Go to Build Phases tab (at the top of the main panel)
4. Click the "+" button and choose "New Run Script Phase"
5. Name it "Set Production Environment" (double-click on "Run Script" to rename)
6. **IMPORTANT**: Drag this new script phase to run EARLY in the build process - ideally right after "Start Packager" or at the very top of the list. It MUST run before the Metro bundler starts bundling your JavaScript.
7. Expand the new script phase and add this script:

```bash
# Set NODE_ENV for production builds
if [ "${CONFIGURATION}" == "Release" ]; then
    export NODE_ENV=production
    echo "NODE_ENV set to production"
else
    export NODE_ENV=development  
    echo "NODE_ENV set to development"
fi

# Export to Metro bundler
echo "export NODE_ENV=${NODE_ENV}" > "${SRCROOT}/../node_modules/react-native/scripts/.packager.env"
```

8. Make sure "Run script only when installing" is UNCHECKED
9. Shell should be `/bin/sh`

### Alternative: Environment Variable in Scheme

You can also set it in the scheme:
1. Edit Scheme → Archive → Pre-actions
2. Add Run Script with:
   ```
   echo "NODE_ENV=production" > "${PROJECT_DIR}/../.env"
   ```

This ensures all Release/Archive builds have NODE_ENV=production set.