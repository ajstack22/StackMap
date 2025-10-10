/**
 * Typography Component
 * 
 * Ensures Comic Relief font is used consistently across all platforms.
 * 
 * IMPORTANT: Android Font Handling
 * - Android uses font file variants (ComicRelief-Regular, ComicRelief-Bold)
 * - fontWeight MUST be undefined on Android when using font variants
 * - If both fontFamily and fontWeight are set, Android falls back to system font
 * 
 * Platform Differences:
 * - iOS: Uses "Comic Relief" with fontWeight property
 * - Android: Uses "ComicRelief-Bold" or "ComicRelief-Regular" (no fontWeight)
 * - Web: Uses CSS font-family with font-weight
 */

import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  Platform,
  StyleSheet,
} from 'react-native';

// Font weight mappings for Android
const ANDROID_FONT_WEIGHTS = {
  'bold': 'ComicRelief-Bold',
  '700': 'ComicRelief-Bold',
  '800': 'ComicRelief-Bold',
  '900': 'ComicRelief-Bold',
  'medium': 'ComicRelief-Bold', // Fallback to Bold since we don't have Medium variant
  '500': 'ComicRelief-Bold',
  '600': 'ComicRelief-Bold',
  'regular': 'ComicRelief-Regular',
  'default': 'ComicRelief-Regular'
};

// Platform-specific font families
const PLATFORM_FONTS = {
  'android': (weight) => {
    // Handle edge cases for weight parameter
    try {
      const weightStr = String(weight);
      return ANDROID_FONT_WEIGHTS[weightStr] || ANDROID_FONT_WEIGHTS.default;
    } catch {
      return ANDROID_FONT_WEIGHTS.default;
    }
  },
  'ios': () => 'Comic Relief',
  'web': () => "'Comic Relief', 'Comic Sans MS', cursive"
};

/**
 * @description Get platform-specific font family based on weight
 * @param {string} weight - Font weight (regular, bold, or numeric)
 * @returns {string} Platform-appropriate font family
 */
const getFontFamily = (weight = 'regular') => {
  const platformKey = Platform.OS === 'android' ? 'android' :
                      Platform.OS === 'ios' ? 'ios' : 'web';
  return PLATFORM_FONTS[platformKey](weight);
};

// Custom Text component that ensures Comic Relief is used everywhere
export const Text = React.forwardRef((props, ref) => {
  const { style, children, ...restProps } = props;

  // Extract fontWeight from all styles
  let fontWeight = 'regular';

  if (style) {
    const styles = Array.isArray(style) ? style : [style];
    for (const s of styles) {
      if (s && s.fontWeight) {
        fontWeight = s.fontWeight;
      }
    }
  }

  // Apply Comic Relief font family based on weight - THIS ALWAYS WINS
  const fontFamily = getFontFamily(fontWeight);

  // On Android, when using font variants (Bold/Regular), we MUST remove fontWeight
  // Otherwise Android can't load the custom font and falls back to system font
  // IMPORTANT: We flatten the style array first, then apply fontFamily to avoid
  // nested arrays that can cause style resolution issues on web
  const flattenedStyle = StyleSheet.flatten(style);

  const finalStyle = Platform.OS === 'android'
    ? [
        flattenedStyle, // Flattened user styles
        {
          fontFamily, // Comic Relief font variant (Regular or Bold)
          fontWeight: undefined, // MUST be undefined on Android to use font variants
        },
      ]
    : [
        flattenedStyle, // Flattened user styles
        {
          fontFamily, // Comic Relief font
          // iOS and Web can handle fontWeight with custom fonts
        },
      ];

  return (
    <RNText ref={ref} {...restProps} style={finalStyle}>
      {children}
    </RNText>
  );
});

Text.displayName = 'StyledText';

// Custom TextInput component
export const TextInput = React.forwardRef((props, ref) => {
  const { style, ...restProps } = props;

  // Extract fontWeight from style
  let fontWeight = 'regular';
  if (style) {
    const styles = Array.isArray(style) ? style : [style];
    for (const s of styles) {
      if (s && s.fontWeight) {
        fontWeight = s.fontWeight;
        break;
      }
    }
  }

  const fontFamily = getFontFamily(fontWeight);

  // Flatten style array to avoid nested arrays causing style resolution issues
  const flattenedStyle = StyleSheet.flatten(style);

  // Android needs fontWeight removed when using font variants
  const finalStyle = Platform.OS === 'android'
    ? [
        flattenedStyle, // Flattened user styles
        {
          fontFamily, // Apply Comic Relief font variant
          fontWeight: undefined, // Remove fontWeight on Android
          color: '#000000', // Ensure black text on Android
        },
      ]
    : [
        flattenedStyle, // Flattened user styles
        {
          fontFamily, // Apply Comic Relief
        },
      ];

  return (
    <RNTextInput
      ref={ref}
      {...restProps}
      style={finalStyle}
    />
  );
});

TextInput.displayName = 'StyledTextInput';

// Export the original React Native components if needed
export { Text as RNText, TextInput as RNTextInput } from 'react-native';

// Export getFontFamily as named export
export { getFontFamily };

// Default export for convenience
export default {
  Text,
  TextInput,
  getFontFamily,
};
