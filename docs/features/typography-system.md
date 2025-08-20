# StackMap Typography System

## Overview
StackMap uses a consistent typography system across all platforms with Comic Relief as the primary font family. The system ensures accessibility, readability, and consistent branding while handling platform-specific font loading and weight variations.

## Font Family: Comic Relief

### Font Files
- **Regular**: `ComicRelief-Regular.ttf`
- **Bold**: `ComicRelief-Bold.ttf`
- **Location**: `/assets/fonts/`

### Platform Implementation

#### iOS & Web
Uses `fontWeight` property with "Comic Relief" font family:
```javascript
{
  fontFamily: 'Comic Relief',
  fontWeight: '400',  // Regular
  fontWeight: '700',  // Bold
}
```

#### Android
Uses specific font variants without `fontWeight` property:
```javascript
{
  fontFamily: 'ComicRelief-Regular',  // Regular text
  fontFamily: 'ComicRelief-Bold',     // Bold text
  // NO fontWeight property on Android
}
```

## Typography Component

### Usage
All text in StackMap should use the custom Typography component:

```javascript
import { Typography } from '../components/Typography';

// Basic usage
<Typography>Regular text</Typography>

// With weight
<Typography fontWeight="bold">Bold text</Typography>

// With size
<Typography fontSize={18}>Larger text</Typography>

// Combined
<Typography fontSize={16} fontWeight="bold" color="#333">
  Custom styled text
</Typography>
```

### Component Implementation
```javascript
// src/components/Typography/index.js
import React from 'react';
import { Text, Platform } from 'react-native';

export const Typography = ({ 
  children, 
  fontWeight = 'normal', 
  fontSize = 16,
  color = '#000',
  style,
  ...props 
}) => {
  const getFontFamily = () => {
    if (Platform.OS === 'android') {
      return fontWeight === 'bold' ? 'ComicRelief-Bold' : 'ComicRelief-Regular';
    }
    return 'Comic Relief';
  };

  const getFontWeight = () => {
    if (Platform.OS === 'android') {
      return undefined; // Don't use fontWeight on Android
    }
    return fontWeight === 'bold' ? '700' : '400';
  };

  const textStyle = {
    fontFamily: getFontFamily(),
    fontWeight: getFontWeight(),
    fontSize,
    color,
    ...style
  };

  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
};
```

## Typography Scale

### Standard Sizes
```javascript
const typographyScale = {
  // Headers
  h1: 28,
  h2: 24,
  h3: 20,
  
  // Body text
  body: 16,
  bodySmall: 14,
  
  // UI elements
  button: 16,
  caption: 12,
  
  // Activity cards
  activityTitle: 16,
  activityDescription: 14,
  activityEmoji: 24, // Platform-specific adjustments
  
  // Tablet adjustments
  tablet: {
    h1: 32,
    h2: 28,
    h3: 24,
    body: 18,
    bodySmall: 16,
    button: 18,
    activityTitle: 18,
    activityDescription: 15,
    activityEmoji: 32,
  }
};
```

### Responsive Typography
```javascript
// Utility for responsive font sizes
export const getResponsiveFontSize = (baseSize, isTablet = false) => {
  if (isTablet) {
    return Math.round(baseSize * 1.125); // 12.5% increase for tablets
  }
  return baseSize;
};

// Usage in components
const fontSize = getResponsiveFontSize(16, isTablet);
```

## Color Standards

### Text Colors (High Contrast)
```javascript
const textColors = {
  primary: '#000000',      // Primary text (WCAG AAA compliant)
  secondary: '#333333',    // Secondary text
  disabled: '#666666',     // Disabled state
  error: '#e53e3e',       // Error messages
  success: '#38a169',     // Success messages
  warning: '#d69e2e',     // Warning messages
};
```

### NO GRAY TEXT Rule
- **Primary text**: Always use `#000000` (black)
- **Accessibility requirement**: High contrast for readability
- **Exception**: Only disabled states may use lighter colors

## Platform-Specific Considerations

### Android Font Loading
```javascript
// android/app/src/main/assets/fonts/
// - ComicRelief-Regular.ttf
// - ComicRelief-Bold.ttf

// In react-native.config.js
module.exports = {
  assets: ['./assets/fonts/'],
};
```

### iOS Font Loading
```javascript
// ios/StackMapNative/Info.plist
<key>UIAppFonts</key>
<array>
  <string>ComicRelief-Regular.ttf</string>
  <string>ComicRelief-Bold.ttf</string>
</array>
```

### Web Font Loading
```javascript
// In index.html or CSS
@font-face {
  font-family: 'Comic Relief';
  src: url('./assets/fonts/ComicRelief-Regular.ttf');
  font-weight: 400;
}

@font-face {
  font-family: 'Comic Relief';
  src: url('./assets/fonts/ComicRelief-Bold.ttf');
  font-weight: 700;
}
```

## Common Usage Patterns

### Activity Cards
```javascript
// Activity title
<Typography fontSize={16} fontWeight="normal" color="#000">
  {activity.text || activity.title}
</Typography>

// Activity description
<Typography fontSize={14} color="#333">
  {activity.description}
</Typography>

// Activity emoji (platform-specific sizing)
<Typography fontSize={Platform.select({ web: 28, default: 24 })}>
  {activity.icon || activity.emoji}
</Typography>
```

### Headers and Titles
```javascript
// Main headers
<Typography fontSize={24} fontWeight="bold" color="#000">
  Page Title
</Typography>

// Section headers
<Typography fontSize={20} fontWeight="bold" color="#000">
  Section Title
</Typography>

// Subsection headers
<Typography fontSize={18} fontWeight="bold" color="#000">
  Subsection Title
</Typography>
```

### Buttons
```javascript
// Primary buttons
<Typography fontSize={16} fontWeight="bold" color="#fff">
  Button Text
</Typography>

// Secondary buttons
<Typography fontSize={16} color="#000">
  Secondary Action
</Typography>
```

### Form Labels
```javascript
// Form field labels
<Typography fontSize={14} fontWeight="bold" color="#000">
  Field Label
</Typography>

// Helper text
<Typography fontSize={12} color="#666">
  Helper text or instructions
</Typography>
```

## Accessibility Compliance

### WCAG Guidelines
- **Level AA**: Minimum 4.5:1 contrast ratio for normal text
- **Level AAA**: Minimum 7:1 contrast ratio (our standard)
- **Large text**: 18pt+ or 14pt+ bold

### Text Contrast Ratios
```javascript
// Black text on white background: 21:1 (AAA)
// Black text on theme colors: Verified for each theme
// Error text (#e53e3e) on white: 4.8:1 (AA)
```

### Screen Reader Support
```javascript
// Always provide meaningful text
<Typography accessibilityLabel="Activity completed">
  ✓
</Typography>

// Use semantic headings
<Typography 
  fontSize={24} 
  fontWeight="bold"
  accessibilityRole="header"
>
  Section Title
</Typography>
```

## Testing Typography

### Visual Testing
- Test all font weights on each platform
- Verify proper fallbacks
- Check emoji rendering consistency
- Test with system font size adjustments

### Accessibility Testing
- Screen reader testing
- High contrast mode testing
- Font size accessibility settings
- Color contrast verification

## Migration Notes

### From Direct Text Components
```javascript
// OLD - Direct Text usage
<Text style={{ fontFamily: 'Comic Relief', fontSize: 16 }}>
  Content
</Text>

// NEW - Typography component
<Typography fontSize={16}>
  Content
</Typography>
```

### Existing Style Objects
```javascript
// OLD - Platform-specific font handling
const textStyle = {
  fontFamily: Platform.select({
    ios: 'Comic Relief',
    android: 'ComicRelief-Regular',
    web: 'Comic Relief'
  }),
  fontSize: 16
};

// NEW - Typography component handles platform differences
<Typography fontSize={16}>Content</Typography>
```

## Font Loading Troubleshooting

### Common Issues

#### Android: Font Not Displaying
```bash
# Regenerate fonts
npx react-native-asset
cd android && ./gradlew clean
npx react-native run-android
```

#### iOS: Font Not Loading
```bash
# Clean and rebuild
cd ios && pod install
cd .. && npx react-native run-ios
```

#### Web: Font Loading Issues
- Verify font files in public/assets/fonts/
- Check browser console for loading errors
- Test font-face declarations in CSS

### Debug Commands
```javascript
// List available fonts (iOS)
console.log(UIFont.familyNames.sorted())

// Check font loading (Android)
// Use React DevTools to inspect fontFamily values

// Web font debug
// Check browser Network tab for font file requests
```

## Related Documentation
- [Design System](../architecture/TECHNICAL_STANDARDS.md)
- [Accessibility Implementation](../ACCESSIBILITY_IMPLEMENTATION.md)
- [Platform Guide](../platform/README.md)