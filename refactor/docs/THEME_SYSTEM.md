# StackMap Theme System Documentation

## Overview

The StackMap theme system is designed with sensory preferences and accessibility in mind, specifically targeting users with ADHD and autism. It provides multiple theme options and sensory controls to create a comfortable visual environment.

## Features

### Theme Options

1. **Light Theme** ☀️
   - Bright and cheerful colors
   - Default theme for most users
   - Purple gradient background
   - High contrast between text and background

2. **Dark Theme** 🌙
   - Easy on the eyes in low light
   - Reduced eye strain for extended use
   - Muted gradient background
   - Softer shadows

3. **High Contrast Theme** 👁️
   - Maximum readability
   - Black background with white text
   - Green accent colors for better visibility
   - Strong borders and outlines

4. **Calm Theme** 🌊
   - Soothing colors for sensory comfort
   - Soft greens and blues
   - Reduced visual stimulation
   - Gentle shadows and transitions

5. **Warm Theme** 🔥
   - Cozy and comfortable
   - Warm earth tones
   - Orange/brown color palette
   - Soft contrast

### Sensory Preferences

1. **Animations**
   - Toggle on/off for all transitions
   - Respects system `prefers-reduced-motion` setting
   - When off, all animations are instant

2. **Color Vibrancy**
   - **Muted**: 70% saturation for softer colors
   - **Normal**: Default saturation
   - **Vibrant**: 130% saturation for brighter colors

3. **Contrast Level**
   - **Low**: Softer contrast with slight opacity
   - **Normal**: Default contrast
   - **High**: Increased font weights and stronger borders

## Implementation

### Files

- `js/theme-manager.js` - Core theme logic and preference management
- `js/theme-settings-ui.js` - UI components for theme selection
- `css/themes.css` - Theme-specific styles and overrides
- `css/mobile.css` - Mobile-specific theme adjustments
- `css/tv.css` - TV-specific theme adjustments

### Usage

#### Quick Theme Toggle

A theme toggle button is added to the main header, allowing users to quickly cycle through themes:

```javascript
// The button cycles through themes in order
Light → Dark → High Contrast → Calm → Warm → Light
```

#### Settings Page

In the Settings view, users have access to:
- Visual theme selector with previews
- Individual sensory preference controls
- Tips for choosing appropriate themes

#### Programmatic Access

```javascript
// Set a specific theme
window.StackMapThemeManager.setTheme('dark');

// Get current theme
var currentTheme = window.StackMapThemeManager.getCurrentTheme();

// Set sensory preference
window.StackMapThemeManager.setSensoryPreference('animations', false);

// Listen for theme changes
document.addEventListener('themechange', function(e) {
    console.log('Theme changed to:', e.detail.theme);
});
```

### Storage

All theme preferences are stored in localStorage:
- `stackmap-theme` - Current theme name
- `stackmap-sensory-prefs` - JSON object with sensory preferences

### Accessibility Features

1. **System Integration**
   - Automatically detects system dark mode preference
   - Respects `prefers-reduced-motion`
   - Supports high contrast mode

2. **Focus Management**
   - Theme-aware focus indicators
   - High contrast mode has enhanced focus visibility
   - TV mode has larger focus indicators

3. **Safe Mode Compatibility**
   - In safe mode, always uses readable colors
   - Disables potentially problematic dark themes in safe mode

## Research Notes

The theme system is based on research into sensory preferences for neurodiverse users:

1. **Color Choices**
   - Avoided pure white backgrounds (can cause glare)
   - Used muted colors in calm theme to reduce stimulation
   - High contrast option for users with visual processing differences

2. **Animation Control**
   - Many ADHD/autism users find animations distracting
   - Option to disable all animations instantly
   - Smooth transitions when enabled for those who prefer them

3. **Customization**
   - Multiple options allow users to find their comfort zone
   - Sensory controls are separate from theme selection
   - Preferences persist across sessions

## Testing

Use `theme-test.html` to test the theme system:
1. Open `/refactor/theme-test.html` in a browser
2. Try each theme option
3. Test sensory preference controls
4. Verify colors update correctly
5. Check persistence after page reload

## Future Enhancements

1. **Time-based Themes**
   - Automatically switch between light/dark based on time
   - Customizable schedule

2. **Custom Themes**
   - Allow users to create their own color combinations
   - Import/export theme configurations

3. **Sensory Profiles**
   - Pre-configured sensory settings for common preferences
   - Quick switching between profiles

4. **Additional Sensory Controls**
   - Font size adjustment
   - Line spacing control
   - Sound/haptic feedback options