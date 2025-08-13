# StackMap Modal Implementation Patterns

## Overview
This document outlines the standard patterns for implementing modals in StackMap to ensure consistency across the application.

## Standard Modal Structure

```javascript
<Modal
  animationType="slide"
  transparent={false}
  visible={visible}
  onRequestClose={onClose}
  presentationStyle="pageSheet" // iOS specific
>
  <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.primary }]}>
    <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
    
    {/* Header */}
    <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
      <View style={styles.headerLeft}>
        <Icon name="icon-name" size={28} color="white" style={styles.headerIcon} />
        <Text style={styles.modalTitle}>Modal Title</Text>
      </View>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Icon name="close" size={30} color="white" />
      </TouchableOpacity>
    </View>
    
    {/* Content */}
    <ScrollView style={styles.modalContent}>
      {/* Modal content here */}
    </ScrollView>
  </SafeAreaView>
</Modal>
```

## Key Design Patterns

### 1. **Header Design**
- Always use theme.primary color for header background
- White text and icons in header
- Include descriptive icon on left
- X close button on right (no separate Cancel button needed)

### 2. **Content Background**
- Use theme.light for modal background (not gray)
- White cards/sections on themed background
- Card-style sections with rounded corners and subtle shadows

### 3. **Typography Rules**
- **ALL TEXT MUST BE BLACK (#000)** - No gray text allowed
- Use TYPOGRAPHY.fontFamily constants
- Platform-specific font weights

### 4. **Spacing & Layout**
- Consistent SPACING constants (xs, sm, md, lg, xl)
- Card sections with margins for separation
- Rounded corners using RADIUS constants

### 5. **Interactive Elements**
- Primary buttons use theme.primary color
- Touch targets minimum 44x44 points
- Visual feedback with activeOpacity
- Clear action icons with color coding

## Accessibility Requirements

1. **High Contrast**: All text must be black on light backgrounds
2. **Touch Targets**: Minimum 44x44 points for all interactive elements
3. **Screen Readers**: Include accessibilityLabel on all buttons
4. **Visual Hierarchy**: Clear section separation and consistent spacing

## Platform Considerations

### iOS
- Use presentationStyle="pageSheet"
- Bold font weights (700)
- Larger shadows

### Android
- Normal font weights with bold font family
- Material elevation
- Handle hardware back button

### Web
- Slightly smaller font sizes
- Consider desktop viewports
- Keyboard navigation support

## 🚨 CRITICAL: iOS Modal Panel Expansion Fix 🚨

### The Problem
iOS modals will expand beyond their content and become "too large" without proper flex constraints. This has caused HOURS of debugging.

### The Solution Pattern
```javascript
// styles.js - MUST FOLLOW EXACTLY
modalScrollView: {
  flex: 1,  // REQUIRED for iOS
},
scrollContent: {
  // iOS must NOT have flexGrow
  ...(Platform.OS === 'ios' ? {} : { flexGrow: 1 }),
},
sectionInner: {
  ...(Platform.OS === 'ios' && {
    flex: 0,       // CRITICAL: Prevents expansion
    flexGrow: 0,   // CRITICAL: No growing
    flexShrink: 1, // Can shrink if needed
  }),
},
activityCard: {
  ...(Platform.OS === 'ios' && {
    height: 32,    // FIXED height
    maxHeight: 32, // MUST match height
  }),
}
```

### ⚠️ Common Mistakes That Break iOS Modals
1. **Adding flexGrow to scrollContent on iOS** - Panels become huge
2. **Removing flex constraints from sectionInner** - Sections expand
3. **Using inline styles like `{ height: 'auto' }`** - Breaks constraints
4. **Forgetting the wrapper View with flex: 1** - Layout breaks

### Testing Checklist
- [ ] Test on iOS simulator with multiple theme colors
- [ ] Ensure panels only show content height, not full screen
- [ ] Check with 0 activities, few activities, many activities
- [ ] Verify scrolling works when content exceeds screen

## Example Implementation
See `CompleteDayModal` for a complete implementation following these patterns.