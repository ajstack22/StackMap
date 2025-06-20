# StackMap iOS App

This directory contains the iOS application for StackMap built with Capacitor.

## Prerequisites

1. **macOS**: iOS development requires macOS
2. **Xcode**: Install from the Mac App Store (version 14.0 or later)
3. **CocoaPods**: Install using `sudo gem install cocoapods`
4. **Node.js**: Already installed if you can run npm commands

## Building the App

### 1. Build the web assets
```bash
npm run build:capacitor
# or manually:
./scripts/build-capacitor.sh
```

### 2. Sync the iOS project
```bash
npx cap sync ios
```

### 3. Install iOS dependencies
```bash
cd ios/App
pod install
cd ../..
```

### 4. Open in Xcode
```bash
npx cap open ios
```

## Configuration

### App Settings
- **Bundle ID**: com.stackmap.app
- **Display Name**: StackMap
- **Version**: Set in Xcode project settings
- **Build Number**: Increment for each App Store submission

### Privacy Permissions
The following permissions are configured in Info.plist:
- **Camera**: For taking photos of activities
- **Photo Library**: For choosing and saving images
- **Photo Library Add**: For saving screenshots

### App Store Requirements
- **App Icons**: Generated using `./scripts/generate-ios-icons.sh`
- **Launch Screens**: Generated using `./scripts/generate-ios-launch-screens.sh`
- **Encryption**: ITSAppUsesNonExemptEncryption is set to NO

## Testing

### Simulator Testing
1. Open the project in Xcode
2. Select a simulator device
3. Click the Run button or press Cmd+R

### Device Testing
1. Connect your iOS device
2. Trust the computer on your device
3. Select your device in Xcode
4. Ensure you have a valid development certificate
5. Click Run

## Building for Release

### 1. Update Version Numbers
In Xcode:
- Select the project
- Go to General tab
- Update Version and Build numbers

### 2. Archive the App
1. Select "Any iOS Device" as the destination
2. Product → Archive
3. Wait for the archive to complete

### 3. Upload to App Store Connect
1. In the Organizer window, select your archive
2. Click "Distribute App"
3. Choose "App Store Connect"
4. Follow the upload wizard

## Troubleshooting

### CocoaPods Issues
If you get pod-related errors:
```bash
cd ios/App
pod deintegrate
pod install
```

### Build Errors
1. Clean build folder: Cmd+Shift+K in Xcode
2. Delete derived data: ~/Library/Developer/Xcode/DerivedData
3. Restart Xcode

### Capacitor Sync Issues
```bash
# Remove and re-add iOS platform
rm -rf ios
npx cap add ios
npx cap sync ios
```

## Useful Commands

```bash
# Build and sync
npm run build:capacitor && npx cap sync ios

# Open in Xcode
npx cap open ios

# Run on specific simulator
npx cap run ios --target="iPhone 15"

# List available targets
xcrun simctl list devices
```