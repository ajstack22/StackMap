# StackMap iOS Wrapper

This is the iOS native wrapper for StackMap, enabling distribution through the Apple App Store.

## Features

- 🌐 Full-featured WKWebView wrapper
- 📱 Universal app (iPhone & iPad support)
- 🔗 Universal Links support
- 📡 Offline functionality
- 🎯 Native iOS features:
  - Share sheet integration
  - Haptic feedback
  - Pull-to-refresh
  - Safe area handling
  - Status bar theming

## Requirements

- macOS 12.0 or later
- Xcode 14.0 or later
- iOS 14.0+ deployment target
- Apple Developer account (for distribution)

## Project Structure

```
ios-wrapper/
├── StackMap/
│   ├── StackMap/
│   │   ├── AppDelegate.swift          # App lifecycle management
│   │   ├── SceneDelegate.swift        # Scene lifecycle & URL handling
│   │   ├── WebViewController.swift    # Main WebView controller
│   │   ├── ShareManager.swift         # Native sharing functionality
│   │   ├── HapticManager.swift        # Haptic feedback manager
│   │   ├── OfflineCacheManager.swift  # Offline cache handling
│   │   ├── Assets.xcassets/           # App icons & colors
│   │   ├── Info.plist                 # App configuration
│   │   └── StackMap.entitlements      # App capabilities
│   └── StackMap.xcodeproj/            # Xcode project file
├── apple-app-site-association         # Universal Links config
├── build.sh                           # Build script
├── upload-to-appstore.sh              # Upload script
└── README.md                          # This file
```

## Setup Instructions

### 1. Configure Developer Account

1. Open `StackMap.xcodeproj` in Xcode
2. Select the project in the navigator
3. Under "Signing & Capabilities":
   - Select your Team
   - Ensure "Automatically manage signing" is checked
   - Bundle Identifier: `com.stackmap.app`

### 2. Add App Icons

The app requires various icon sizes. Add them to `Assets.xcassets/AppIcon.appiconset/`:

- iPhone: 60x60@2x, 60x60@3x
- iPad: 76x76@1x, 76x76@2x, 83.5x83.5@2x
- App Store: 1024x1024@1x

Use the existing StackMap icon design with:
- Background: Purple gradient (#667eea to #5a67d8)
- Foreground: Three white horizontal bars

### 3. Configure Universal Links

1. Replace `TEAMID` in `apple-app-site-association` with your Apple Developer Team ID
2. Host the file at `https://stackmap.app/.well-known/apple-app-site-association`
3. Ensure HTTPS with valid SSL certificate

### 4. Update WebView URL

In `WebViewController.swift`, update the URL if needed:
```swift
private let stackMapURL = "https://stackmap.app"
```

## Building the App

### Development Build

1. Open Xcode
2. Select your device or simulator
3. Press Cmd+R to run

### Production Build

```bash
# Run the build script
./build.sh

# This creates an archive at build/StackMap.xcarchive
```

### Manual Archive Process

1. In Xcode: Product → Archive
2. Wait for archive to complete
3. In Organizer: Distribute App
4. Choose "App Store Connect"
5. Follow the upload wizard

## Testing Checklist

Before submitting to App Store:

- [ ] Test on real devices (various sizes)
- [ ] Verify offline functionality
- [ ] Test Universal Links
- [ ] Check share functionality
- [ ] Verify haptic feedback
- [ ] Test on slow network
- [ ] Validate memory usage
- [ ] Check orientation changes
- [ ] Test with Dynamic Type
- [ ] Verify safe area handling

## App Store Submission

### Prerequisites

1. App Store Connect account
2. App created in App Store Connect
3. Certificates & provisioning profiles
4. App Store assets ready

### Submission Process

1. Build and archive the app
2. Upload using Xcode or `upload-to-appstore.sh`
3. In App Store Connect:
   - Add app information
   - Upload screenshots
   - Set pricing (Free)
   - Add privacy policy URL
   - Submit for review

### App Store Review Tips

- Emphasize offline functionality
- Highlight native features (not just web wrapper)
- Provide demo account if needed
- Explain special needs focus in review notes
- Be ready to respond to review feedback quickly

## Troubleshooting

### Common Issues

**White screen on launch**
- Check network connection
- Verify URL is correct
- Check console for JavaScript errors

**Universal Links not working**
- Verify apple-app-site-association file
- Check entitlements configuration
- Ensure proper Team ID

**App crashes on launch**
- Check Info.plist configuration
- Verify minimum iOS version
- Check for missing assets

**Upload failures**
- Verify certificates are valid
- Check provisioning profiles
- Ensure version/build numbers are unique

## Native Bridge API

The app exposes native functionality to the web app:

```javascript
// Check if running in iOS app
if (window.isStackMapiOS) {
    // Native features available
}

// Trigger haptic feedback
window.webkit.messageHandlers.stackMapiOS.postMessage({
    action: 'haptic',
    type: 'success' // or 'warning', 'error', 'light', 'medium', 'heavy'
});

// Native share
window.webkit.messageHandlers.stackMapiOS.postMessage({
    action: 'share',
    text: 'Share text here'
});
```

## Maintenance

### Updating the Web App

No app update needed when web app changes - updates are immediate.

### Updating Native Features

1. Make changes in Xcode
2. Increment build number
3. Archive and upload new version
4. Submit for review

### Certificate Renewal

- Development certificates: Annually
- Distribution certificates: Every 3 years
- Push notification certificates: Annually

## Support

For issues or questions:
- GitHub Issues: https://github.com/ajstack22/StackMap/issues
- Developer docs: https://developer.apple.com

## License

Same as StackMap main project.