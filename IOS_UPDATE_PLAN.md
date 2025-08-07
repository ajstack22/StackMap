# iOS Update Plan - December 2024
## Bringing iOS to Feature Parity with Web

### 📅 Timeline Overview
**Last iOS Build**: July 30, 2024  
**Current iOS Version**: 1.0.3 (Build 2007)  
**Target Update Version**: 1.1.0 (Build 3000)  
**Estimated Completion**: 4-6 days

---

## 🎯 Executive Summary

The iOS app is currently 5+ months behind the web version with over 100 commits of changes. The most critical updates involve a complete sync system overhaul with zero-knowledge encryption, a major modal UI/UX refactor to panel-based design, and numerous iOS-specific bug fixes that have been implemented but not deployed.

### Critical Risk Areas
1. **Sync System**: Complete architectural change from token-based to URL-based sync
2. **Modal System**: All modals converted from footer-button to panel-based design
3. **Data Migration**: Users may have local data that needs careful handling
4. **Version Mismatch**: iOS version (1.0.3) vs package.json (0.1.0) needs alignment

---

## 📊 Current State Analysis

### Version Information
```
iOS Project Version: 1.0.3
iOS Build Number: 2007
Package.json Version: 0.1.0
React Native Version: 0.80.1
Last Pod Install: July 30, 2024
```

### Dependency Status
- **React Native**: 0.80.1 (current)
- **Key Dependencies**:
  - @react-native-async-storage/async-storage: ^2.0.0
  - @react-native-clipboard/clipboard: ^1.14.3
  - react-native-gesture-handler: ~2.20.2
  - react-native-qrcode-svg: ^6.3.3
  - react-native-safe-area-context: 4.14.0

---

## 🔄 Major Changes Since Last iOS Build

### 1. Sync System Overhaul (August 2024)
**Files Changed**: 50+ files  
**Impact**: CRITICAL

#### What Changed:
- **Old System**: Token-based sync with simple phrase
- **New System**: URL-based sync with zero-knowledge encryption
- **Key Components**:
  - New `SyncPreviewModal` for joining sync groups
  - Enhanced `DataModal` with sync/share tabs
  - Sync conflict resolution system
  - Auto-update capability for shares

#### iOS-Specific Concerns:
- URL parameter handling (`?sync=` parameter)
- QR code scanning integration
- Keychain storage for sync keys
- Background sync capability

### 2. Modal Architecture Refactor (August-September 2024)
**Files Changed**: 30+ modal components  
**Impact**: HIGH

#### What Changed:
- **Old Design**: Footer buttons, inconsistent widths
- **New Design**: Panel-based, standardized 600px width
- **Key Updates**:
  - All modals use `TabbedModal` for multi-section content
  - No more footer buttons (actions in panels)
  - Consistent header with close button
  - iOS-specific constraints for panel expansion

#### iOS-Specific Concerns:
- Modal presentation styles
- Swipe gestures for tab navigation
- iOS modal stacking issues (z-index)
- Panel expansion constraints

### 3. UI/UX Improvements (September-December 2024)
**Files Changed**: 100+ files  
**Impact**: MEDIUM

#### What Changed:
- Drag-and-drop functionality updates
- Toast notification system
- Activity card direct delete in edit mode
- "Add All" batch operations
- Mobile layout optimizations

#### iOS-Specific Concerns:
- iOS drag gesture handlers
- Haptic feedback integration
- iOS-specific font weights
- Safe area handling

---

## 📋 Pre-Build Checklist

### Phase 1: Environment Preparation (Day 1)

#### 1.1 Version Alignment
```bash
# Update iOS version in Xcode project
# ios/StackMap.xcodeproj/project.pbxproj
MARKETING_VERSION = 1.1.0
CURRENT_PROJECT_VERSION = 3000

# Update package.json
"version": "1.1.0"

# Update app.json
"version": "1.1.0"
```

#### 1.2 Clean Build Environment
```bash
# Clean all caches
cd ios
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf Pods
rm Podfile.lock

# Clean React Native caches
cd ..
npx react-native clean
npm cache clean --force
watchman watch-del-all
```

#### 1.3 Dependency Updates
```bash
# Update npm dependencies
npm update

# Reinstall iOS dependencies
cd ios
pod install --repo-update
```

### Phase 2: Code Integration (Day 1-2)

#### 2.1 Sync System Integration Checklist
- [ ] Test `SyncPreviewModal` rendering on iOS
- [ ] Verify URL parameter extraction works
- [ ] Test QR code generation with proper sizing
- [ ] Validate sync key display (mobile layout fix)
- [ ] Test copy/link buttons positioning
- [ ] Verify sync conflict resolution UI
- [ ] Test auto-update shares functionality

#### 2.2 Modal System Updates Checklist
- [ ] Test all 20+ modals for panel-based design
- [ ] Verify `TabbedModal` swipe gestures
- [ ] Test `DataModal` sync/share tabs
- [ ] Validate modal width (600px max)
- [ ] Test modal stacking (multiple modals)
- [ ] Verify iOS-specific constraints work
- [ ] Test close button functionality

#### 2.3 iOS-Specific Fixes Checklist
- [ ] PIN modal z-index issue resolved
- [ ] Complete Day modal spacing
- [ ] Activity card drag-and-drop
- [ ] Toast notifications positioning
- [ ] Keyboard handling in modals
- [ ] Safe area insets respected

### Phase 3: Build & Test (Day 2-3)

#### 3.1 Initial Build
```bash
# Development build
npx react-native run-ios --configuration Debug

# Test on multiple simulators
npx react-native run-ios --simulator="iPhone 15 Pro"
npx react-native run-ios --simulator="iPhone SE (3rd generation)"
npx react-native run-ios --simulator="iPad Pro (12.9-inch)"
```

#### 3.2 Feature Testing Matrix

| Feature | iPhone SE | iPhone 15 Pro | iPad | Notes |
|---------|-----------|---------------|------|-------|
| Sync Creation | ⬜ | ⬜ | ⬜ | Test URL generation |
| Sync Join via URL | ⬜ | ⬜ | ⬜ | Test parameter parsing |
| QR Code Scan | ⬜ | ⬜ | ⬜ | Camera permissions |
| Modal Navigation | ⬜ | ⬜ | ⬜ | Test all modals |
| Drag & Drop | ⬜ | ⬜ | ⬜ | Long press gesture |
| Share Links | ⬜ | ⬜ | ⬜ | Universal links |
| Data Import/Export | ⬜ | ⬜ | ⬜ | File handling |
| PIN Security | ⬜ | ⬜ | ⬜ | Keychain storage |

#### 3.3 Performance Testing
- [ ] App launch time < 2 seconds
- [ ] Modal open/close smooth (60 fps)
- [ ] Drag animations smooth
- [ ] Memory usage stable
- [ ] No memory leaks in Instruments

### Phase 4: Production Build (Day 3-4)

#### 4.1 Release Configuration
```bash
# Update build configuration
cd ios
open StackMap.xcworkspace

# In Xcode:
# 1. Select StackMap target
# 2. Build Settings > Swift Compiler > Optimization Level = -O
# 3. Build Settings > Debug Information Format = DWARF with dSYM
# 4. Update signing certificates
```

#### 4.2 Archive Build
```bash
# Clean build folder
xcodebuild clean -workspace StackMap.xcworkspace -scheme StackMap

# Create archive
xcodebuild archive \
  -workspace StackMap.xcworkspace \
  -scheme StackMap \
  -configuration Release \
  -archivePath ./build/StackMap.xcarchive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath ./build/StackMap.xcarchive \
  -exportPath ./build \
  -exportOptionsPlist ExportOptions.plist
```

### Phase 5: TestFlight Deployment (Day 4)

#### 5.1 Pre-Submission Checklist
- [ ] Update App Store Connect metadata
- [ ] Prepare release notes
- [ ] Update screenshots if UI changed
- [ ] Test universal links configuration
- [ ] Verify push notification certificates

#### 5.2 TestFlight Submission
```bash
# Use existing deployment script
./scripts/deploy-testflight.sh

# Or manual upload via Xcode
# 1. Window > Organizer
# 2. Select archive
# 3. Distribute App > App Store Connect
# 4. Upload
```

#### 5.3 TestFlight Testing Plan
**Internal Testing (Day 4-5)**:
- 5 internal testers
- Test critical paths
- 24-hour testing period

**Beta Testing (Day 5-6)**:
- 20-50 beta testers
- Gradual rollout
- Monitor crash reports
- Collect feedback via TestFlight

---

## 🐛 Known Issues & Mitigations

### Critical Issues to Test

#### 1. Sync Data Migration
**Risk**: Users with existing local data may lose data  
**Mitigation**: 
- Implement data backup before sync
- Add migration warning dialog
- Test with various data states

#### 2. Modal Memory Leaks
**Risk**: Panel-based modals may not cleanup properly  
**Mitigation**:
- Test with Instruments
- Verify cleanup in componentWillUnmount
- Monitor memory usage

#### 3. iOS 17+ Compatibility
**Risk**: New iOS versions may have breaking changes  
**Mitigation**:
- Test on iOS 17.x and 18.x
- Review Apple's compatibility notes
- Test gesture recognizers

### Platform-Specific Code Review

Files with iOS-specific code requiring extra attention:
```
src/components/Modals/DataModal/styles.js (15 instances)
src/components/ActivityCard/ActivityCard.js (8 instances)
src/components/TabbedModal/TabbedModal.js (6 instances)
src/components/DraggableList/DraggableList.js (12 instances)
App.js (25 instances)
```

---

## 📊 Success Metrics

### Launch Criteria
- [ ] All critical features working
- [ ] No crash rate > 0.1%
- [ ] Performance metrics met
- [ ] TestFlight feedback positive
- [ ] No data loss reports

### Post-Launch Monitoring (Day 6+)
- Monitor Crashlytics for 48 hours
- Track user feedback
- Monitor sync success rates
- Check App Store reviews
- Prepare hotfix if needed

---

## 🚀 Deployment Schedule

### Week 1 Schedule
**Monday (Day 1)**:
- Morning: Environment setup, version updates
- Afternoon: Dependency updates, initial build

**Tuesday (Day 2)**:
- Morning: Feature integration testing
- Afternoon: Bug fixes, iOS-specific issues

**Wednesday (Day 3)**:
- Morning: Complete testing matrix
- Afternoon: Production build preparation

**Thursday (Day 4)**:
- Morning: Final build & archive
- Afternoon: TestFlight submission

**Friday (Day 5)**:
- Morning: Internal testing
- Afternoon: Beta rollout

**Monday (Day 6)**:
- Morning: Beta feedback review
- Afternoon: App Store submission (if ready)

---

## 📝 Release Notes Draft

### StackMap 1.1.0 - Major Sync Update

**What's New:**
- 🔄 All-new sync system with enhanced security
- 🎨 Redesigned modal interfaces for better usability
- 📱 Improved mobile layouts and gestures
- 🔗 Share activities with customizable links
- 🐛 Numerous bug fixes and performance improvements

**Sync System Improvements:**
- Zero-knowledge encryption for your data
- Easy sync setup with QR codes
- Automatic conflict resolution
- Share individual user activities

**UI Enhancements:**
- Cleaner, more consistent modal designs
- Better mobile keyboard handling
- Improved drag-and-drop functionality
- New batch operations for activities

**Bug Fixes:**
- Fixed PIN modal display issues
- Resolved activity card numbering gaps
- Fixed "Add All" only adding one item
- Improved Complete Day modal spacing

---

## 🔧 Rollback Plan

If critical issues discovered post-deployment:

### Immediate Actions (< 1 hour)
1. Remove build from TestFlight
2. Notify beta testers via email
3. Document issue in incident report

### Rollback Procedure
```bash
# Revert to previous build
git checkout tags/v1.0.3
cd ios
pod install
# Rebuild and submit previous version
```

### Communication Plan
- Email beta testers about rollback
- Update TestFlight release notes
- Post update in Discord/Slack
- Prepare fix timeline

---

## 📚 Resources & References

### Documentation
- [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/guidelines/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)

### Internal Docs
- CLAUDE.md - iOS-specific constraints
- MD_FILES_INDEX.md - Documentation index
- TROUBLESHOOTING.md - Known issues

### Support Channels
- Internal Slack: #ios-deployment
- Apple Developer Forums
- React Native Discord

---

## ✅ Final Checklist Before Release

### Must-Have
- [ ] All sync features working
- [ ] No data loss scenarios
- [ ] Modal system stable
- [ ] Performance acceptable
- [ ] TestFlight feedback addressed

### Nice-to-Have
- [ ] Haptic feedback polished
- [ ] Animations smooth
- [ ] iPad layout optimized
- [ ] Dark mode perfect
- [ ] Accessibility tested

### Sign-offs Required
- [ ] Development team approval
- [ ] QA testing complete
- [ ] Product owner approval
- [ ] Release notes reviewed
- [ ] Support team briefed

---

*Last Updated: December 2024*  
*Next Review: Post-deployment retrospective*