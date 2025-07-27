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

## Example Implementation
See `CompleteDayModal` for a complete implementation following these patterns.