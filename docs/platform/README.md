# Platform Documentation - StackMap

This directory contains consolidated platform-specific documentation for StackMap development.

## 📁 Directory Structure

```
docs/platform/
├── README.md                    # This index file
├── CROSS_PLATFORM_GUIDE.md     # Cross-platform development patterns
├── ios/
│   └── README.md               # Complete iOS development guide
├── android/
│   └── README.md               # Complete Android development guide
└── web/
    └── README.md               # Complete Web/PWA development guide
```

## 🚀 Quick Start

### Choose Your Platform

- **[iOS Development](./ios/README.md)** - Native iOS app development
- **[Android Development](./android/README.md)** - Native Android app development  
- **[Web Development](./web/README.md)** - Progressive Web App development

### Working Across Platforms

- **[Cross-Platform Guide](./CROSS_PLATFORM_GUIDE.md)** - Essential patterns and testing strategies

## 🎯 Quick Reference

### Essential Commands
```bash
# iOS
npx react-native run-ios --simulator="iPhone 16 Pro Max"

# Android (ALWAYS use scripts for Java 17)
./scripts/react-native/run-android.sh

# Web
npm run web  # Development
NODE_ENV=production npm run build:web  # Production

# Deploy all platforms
./scripts/qual_deploy.sh or prod_deploy.sh
```

### Critical Platform-Specific Rules

#### iOS
- ⚠️ **AsyncStorage**: Causes freezes - debounced in useAppStore.js
- ⚠️ **NetInfo.fetch()**: DISABLED - causes freezes
- 🎯 **Modals**: Use Alert.alert for confirmations
- 🎯 **Swipes**: Use react-native-pager-view in modals

#### Android  
- ⚠️ **Java 17**: REQUIRED - Java 24 breaks builds
- ⚠️ **Font Weights**: Use font variants without fontWeight property
- 🎯 **FlexWrap**: MUST use percentage widths + alignContent: 'flex-start'
- 🎯 **Build**: ALWAYS use provided scripts

#### Web
- ⚠️ **Alert.alert**: Not supported - use ConfirmModal
- ⚠️ **Material Icons**: Use `<span>` not `<Text>` components
- 🎯 **Gestures**: Limited - use button-based interactions
- 🎯 **PWA**: Full offline support with service worker

## 🔧 Development Patterns

### Typography (Cross-Platform)
```javascript
// ✅ CORRECT: Auto-handles platform differences
import { Text } from '../components/Typography';
<Text style={{ fontWeight: 'bold' }}>Content</Text>

// ❌ WRONG: Platform-specific font handling
style={{ fontFamily: 'Comic Relief', fontWeight: 'bold' }}
```

### Platform-Specific Code
```javascript
// Simple checks
fontSize: Platform.OS === 'web' ? 16 : 14

// Complex differences
if (Platform.OS === 'ios') {
  Alert.alert('Title', 'Message');
} else {
  setShowConfirm(true); // Use ConfirmModal
}
```

### Responsive Layouts
```javascript
// Tablet detection
const isTablet = () => {
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height) >= 600 && width / height > 1.2;
};

// Android FlexWrap approach
Platform.OS === 'android' ? {
  flexWrap: 'wrap',
  alignContent: 'flex-start'
} : {
  // iOS standard approach
}
```

## 🧪 Testing Strategy

### Before Committing Shared Components
**MUST test on ALL platforms:**

1. **iOS**: iPhone 16 Pro Max + iPad
2. **Android**: Pixel 8 Pro + Pixel Tablet  
3. **Web**: Chrome, Safari, Firefox

### Platform-Specific Testing Focus

#### iOS Testing
- Modal layering and swipe gestures
- Font loading and rendering
- AsyncStorage performance
- Alert.alert confirmations

#### Android Testing
- FlexWrap card layouts
- Font variant rendering
- Java 17 build compatibility
- Tablet 2-column layouts

#### Web Testing  
- Material Icons rendering
- ConfirmModal functionality
- PWA install flow
- Offline capabilities

## 📚 Additional Resources

### Key Documentation
- [Field Naming Standards](../prompts/core/field-conventions.md)
- [Deployment Guide](../prompts/core/deployment.md)  
- [Store Architecture](../STORE_ARCHITECTURE.md)
- [Typography System](../components/Typography/)

### Build Scripts
- `/scripts/react-native/` - Android build scripts (Java 17)
- `/scripts/deploy-*.sh` - Platform deployment automation
- `/scripts/qual_deploy.sh or prod_deploy.sh` - Master deployment script

### Critical Files
- `src/components/Typography/index.js` - Cross-platform font handling
- `src/utils/dataNormalizer.js` - Field normalization
- `src/stores/useAppStore.js` - iOS AsyncStorage debouncing
- `src/utils/*.web.js` - Web platform polyfills

## 🚨 Common Gotchas

1. **Font Issues**: Always use Typography component, never direct fontFamily
2. **Android Builds**: MUST use Java 17 - use provided scripts
3. **iOS Freezes**: AsyncStorage and NetInfo.fetch() cause issues
4. **Web Icons**: Material Icons need `<span>` not `<Text>` components
5. **Layout Differences**: Android FlexWrap vs iOS standard approaches

## 📝 Update Guidelines

When updating platform documentation:
1. Test changes on affected platforms
2. Update cross-platform guide if patterns change
3. Verify all quick reference commands still work
4. Update CLAUDE.md for critical recurring issues

---

**Remember**: Changes that work on one platform may break others. Always test cross-platform before committing!