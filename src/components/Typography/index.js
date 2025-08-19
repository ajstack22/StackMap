import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  Platform,
} from 'react-native';

// Centralized font configuration - change font family here to update everywhere
const getFontFamily = (weight = 'regular') => {
  if (Platform.OS === 'android') {
    switch (weight) {
      case 'bold':
      case '700':
      case '800':
      case '900':
        return 'ComicRelief-Bold';
      case 'medium':
      case '500':
      case '600':
        // Fallback to Bold since we don't have Medium variant
        return 'ComicRelief-Bold';
      default:
        return 'ComicRelief-Regular';
    }
  } else if (Platform.OS === 'ios') {
    return 'Comic Relief';
  } else {
    // Web
    return "'Comic Relief', 'Comic Sans MS', cursive";
  }
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
  const finalStyle = Platform.OS === 'android' 
    ? [
        style, // User styles
        {
          fontFamily, // Comic Relief font variant (Regular or Bold)
          fontWeight: undefined, // MUST be undefined on Android to use font variants
        },
      ]
    : [
        style, // User styles
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

  // Android needs fontWeight removed when using font variants
  const finalStyle = Platform.OS === 'android'
    ? [
        style,
        {
          fontFamily, // Apply Comic Relief font variant
          fontWeight: undefined, // Remove fontWeight on Android
          color: '#000000', // Ensure black text on Android
        },
      ]
    : [
        style,
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

// Default export for convenience
export default {
  Text,
  TextInput,
  getFontFamily,
};
