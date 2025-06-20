# iOS App Store Submission Checklist

## Pre-Submission Requirements

### App Configuration
- [ ] Bundle ID is set to `com.stackmap.app`
- [ ] App version number is updated (e.g., 1.3.0)
- [ ] Build number is incremented from last submission
- [ ] Display name is set to "StackMap"
- [ ] Deployment target is iOS 13.0 or later

### App Icons
- [ ] All app icon sizes are included (run `./scripts/generate-ios-icons.sh`)
- [ ] App Store icon (1024x1024) is included
- [ ] Icons display correctly in Xcode

### Launch Screen
- [ ] Launch screen images are generated (run `./scripts/generate-ios-launch-screens.sh`)
- [ ] Launch screen displays correctly on all device sizes

### Privacy & Permissions
- [ ] Camera usage description is included in Info.plist
- [ ] Photo library usage description is included in Info.plist
- [ ] Photo library add usage description is included in Info.plist
- [ ] ITSAppUsesNonExemptEncryption is set to NO

### Build Settings
- [ ] Archive scheme is set to Release
- [ ] Code signing is configured correctly
- [ ] Provisioning profiles are valid
- [ ] Capabilities match app requirements

## App Store Connect Setup

### App Information
- [ ] App name: StackMap
- [ ] Subtitle: Visual Daily Activity Tracker
- [ ] Primary category: Productivity
- [ ] Secondary category: Lifestyle

### App Description
- [ ] Short description (promotional text) is provided
- [ ] Full description is comprehensive and accurate
- [ ] Keywords are optimized for search

### Screenshots
Required sizes:
- [ ] iPhone 6.5" (1284 x 2778 px) - at least 3
- [ ] iPhone 5.5" (1242 x 2208 px) - optional
- [ ] iPad Pro 12.9" (2048 x 2732 px) - at least 3

### App Review Information
- [ ] Demo account: Not required (note this in review notes)
- [ ] Contact information is accurate
- [ ] Review notes explain offline-first functionality

### Legal
- [ ] Privacy policy URL: https://stackmap.app/privacy.html
- [ ] Terms of use URL: https://stackmap.app/terms.html
- [ ] Support URL: https://stackmap.app/support.html

## Testing Checklist

### Functionality
- [ ] App launches without crashing
- [ ] All core features work (add cards, timers, edit mode)
- [ ] Offline functionality works correctly
- [ ] Data persists between app launches
- [ ] No console errors in Safari developer tools

### Device Testing
- [ ] Test on iPhone (latest iOS)
- [ ] Test on iPhone (minimum supported iOS)
- [ ] Test on iPad
- [ ] Test different orientations
- [ ] Test with different text sizes (accessibility)

### Performance
- [ ] App loads quickly
- [ ] Animations are smooth
- [ ] Memory usage is reasonable
- [ ] No memory leaks

## Submission Process

1. **Archive the App**
   ```bash
   # In Xcode:
   # 1. Select "Any iOS Device" as destination
   # 2. Product → Archive
   ```

2. **Validate the Archive**
   - In Organizer, click "Validate App"
   - Fix any validation errors

3. **Upload to App Store Connect**
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Upload with symbols

4. **Complete App Store Connect**
   - Add build to version
   - Submit for review

## Post-Submission

- [ ] Monitor email for App Review updates
- [ ] Respond promptly to any review questions
- [ ] Prepare release notes for users
- [ ] Plan announcement for app launch

## Common Rejection Reasons to Avoid

1. **Crashes and bugs** - Thoroughly test before submission
2. **Broken links** - Verify all URLs work
3. **Placeholder content** - Ensure all content is final
4. **Misleading app description** - Be accurate about features
5. **Missing privacy policy** - Required for apps that collect any data
6. **Inadequate testing** - Test on real devices, not just simulator

## Emergency Contacts

- App Review: Use Resolution Center in App Store Connect
- Technical Support: https://developer.apple.com/support/
- App Store Connect Help: https://help.apple.com/app-store-connect/