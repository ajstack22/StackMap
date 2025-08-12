# StackMap Universal Testing Checklist

## 🚀 Quick Start
```bash
# 1. Make scripts executable
chmod +x scripts/launch-all-devices.sh
chmod +x scripts/capture-screenshots.sh

# 2. Start everything
npx react-native start                    # Terminal 1
npm run web                               # Terminal 2
./scripts/launch-all-devices.sh          # Terminal 3
./scripts/capture-screenshots.sh         # Terminal 4
```

## 📱 Device Configuration Matrix

| Platform | Device | Resolution | Columns | Key Tests |
|----------|--------|------------|---------|-----------|
| Web Desktop | Brave/Safari | 1920x1080 | 3 | Responsive grid, hover states |
| Web Mobile | Brave DevTools/Safari Responsive | 393x852 | 1 | Touch targets, PWA install |
| iOS Phone | iPhone 16 Pro Max | 1290x2796 | 1 (2 landscape) | Swipe gestures, haptics |
| iOS Tablet | iPad Air 11" M3 | 1640x2360 | 2 (3 landscape) | Split view, multitasking |
| Android Phone | Pixel 9 | 1080x2424 | 1 (2 landscape) | Back button, material design |
| Android Tablet | Pixel Tablet | 2560x1600 | 2 (3 landscape) | Large screens |

## ✅ Core Functionality Tests

### 1. Welcome & Setup
- [ ] **All**: Logo and fonts load correctly
- [ ] **All**: User creation modal works
- [ ] **All**: PIN setup validates (4-8 digits)
- [ ] **All**: Theme color applies immediately
- [ ] **Mobile**: Keyboard doesn't cover inputs
- [ ] **Web**: Tab navigation works

### 2. Activity Management
- [ ] **All**: Add activity with emoji picker
- [ ] **All**: Card numbering is sequential (1, 2, 3...)
- [ ] **All**: Delete shows undo toast
- [ ] **All**: Complete/uncomplete animations work
- [ ] **Mobile**: Drag and drop reordering
- [ ] **Tablets**: 2-column grid layout
- [ ] **Desktop**: 3-column grid layout

### 3. Modal Navigation
- [ ] **All**: Modal opens smoothly
- [ ] **All**: Close button (X) works
- [ ] **Mobile**: Tab swipe gestures work
- [ ] **Web**: Tab click navigation
- [ ] **All**: Scroll doesn't trigger dismiss
- [ ] **All**: Swipe down from top dismisses
- [ ] **iOS**: Alert.alert for confirmations
- [ ] **Android/Web**: ConfirmModal component

### 4. Library & Templates
- [ ] **All**: Search filters correctly
- [ ] **All**: Categories expand/collapse
- [ ] **All**: Add from library works
- [ ] **All**: Save to My Templates
- [ ] **Mobile**: Scroll performance smooth
- [ ] **All**: "Add All" adds multiple items

### 5. Multi-User & Security
- [ ] **All**: User switching maintains state
- [ ] **All**: PIN validation on switch
- [ ] **All**: Each user has separate data
- [ ] **All**: Remove PIN confirmation works
- [ ] **Web**: LocalStorage persistence
- [ ] **Mobile**: AsyncStorage persistence

### 6. Sync System
- [ ] **All**: Generate recovery phrase
- [ ] **All**: Join with recovery phrase
- [ ] **All**: Sync indicator shows status
- [ ] **All**: Data merges correctly
- [ ] **All**: Conflicts auto-resolve
- [ ] **Web**: Works offline (PWA)

### 7. Data Management
- [ ] **All**: Export to JSON works
- [ ] **All**: Import from JSON works
- [ ] **All**: Copy to clipboard works
- [ ] **Mobile**: Share sheet appears
- [ ] **Web**: Download file works

## 🎯 Platform-Specific Critical Tests

### iOS Specific
- [ ] Safe area insets respected
- [ ] Notch/Dynamic Island avoided
- [ ] Haptic feedback on actions
- [ ] Swipe gestures feel native
- [ ] No panel expansion bugs

### Android Specific
- [ ] Back button closes modals
- [ ] Status bar colored correctly
- [ ] Material Design shadows
- [ ] Lower swipe thresholds work
- [ ] Predictive back gesture (Android 14+)

### Web Specific
- [ ] PWA installable
- [ ] Offline mode works
- [ ] Service worker caches assets
- [ ] Keyboard shortcuts (Esc, arrows)
- [ ] Browser back/forward works

## 📸 Screenshot Checklist

### Required App Store Shots
- [ ] 01_hero: Main screen with activities
- [ ] 02_add: Adding new activity
- [ ] 03_library: Template library
- [ ] 04_themes: Theme customization
- [ ] 05_users: Multi-user support
- [ ] 06_sync: Sync capabilities

### Documentation Shots
- [ ] Empty state
- [ ] Single activity
- [ ] Full grid
- [ ] Edit mode
- [ ] All modals
- [ ] All themes

## 🐛 Issue Tracking

### Severity Levels
- **🔴 Critical**: App crashes, data loss, can't use core features
- **🟡 Major**: Feature broken, bad UX, inconsistent behavior
- **🟢 Minor**: Visual glitch, nice-to-have, edge case

### Issue Template
```markdown
**Device**: [Configuration]
**Screen**: [Where it happened]
**Steps**: [How to reproduce]
**Expected**: [What should happen]
**Actual**: [What happened]
**Screenshot**: [Link/name]
**Severity**: Critical/Major/Minor
```

## 📊 Performance Benchmarks

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| App Launch | <2s | <3s | >3s |
| Modal Open | <200ms | <500ms | >500ms |
| Activity Add | <100ms | <300ms | >300ms |
| Sync Time | <2s | <5s | >5s |
| Scroll FPS | 60fps | 30fps | <30fps |

## 🔄 Testing Workflow

### Before Testing
1. [ ] Pull latest code
2. [ ] Clean build folders
3. [ ] Clear device storage
4. [ ] Reset to fresh state

### During Testing
1. [ ] Follow checklist systematically
2. [ ] Capture screenshots at each step
3. [ ] Note any deviations
4. [ ] Test edge cases

### After Testing
1. [ ] Organize screenshots
2. [ ] Document all issues
3. [ ] Create fix priorities
4. [ ] Update test results

## 🎯 Sign-off Criteria

### Ready for Production When:
- [ ] All core functionality tests pass
- [ ] No critical issues remain
- [ ] Performance meets targets
- [ ] Screenshots captured for all platforms
- [ ] Accessibility verified
- [ ] Offline mode confirmed
- [ ] Sync tested with multiple devices
- [ ] Theme changes work correctly

## 📝 Test Session Log

### Session: [DATE] [VERSION]
**Tester**: [Name]
**Duration**: [Time]

#### Configuration Results
- Web Desktop: ✅/⚠️/❌ [Notes]
- Web Mobile: ✅/⚠️/❌ [Notes]
- iOS Phone: ✅/⚠️/❌ [Notes]
- iOS Tablet: ✅/⚠️/❌ [Notes]
- Android Phone: ✅/⚠️/❌ [Notes]
- Android Tablet: ✅/⚠️/❌ [Notes]

#### Issues Found
1. [Issue description]
2. [Issue description]

#### Screenshots Captured
- Total: [Number]
- Location: [Path]

#### Next Steps
1. [Action item]
2. [Action item]

---

**Testing Complete**: ☐
**Approved for Release**: ☐
**Sign-off By**: _______________
**Date**: _______________