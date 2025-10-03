import React from 'react';
import { Text, Platform } from 'react-native';

/**
 * Set Comic Relief as the default font for ALL Text components on Android
 * @description This ensures that even inline styles without fontFamily will use Comic Relief.
 * Modifies the Text component's render method to automatically apply the correct font variant
 * based on fontWeight property.
 * @returns {void}
 */
export const setupDefaultFont = () => {
  if (Platform.OS === 'android') {
    const oldTextRender = Text.render;
    Text.render = function (...args) {
      const origin = oldTextRender.call(this, ...args);
      const existingStyle = origin.props.style || {};

      // Extract fontWeight to determine which font variant to use
      let fontFamily = 'ComicRelief-Regular';

      // Check if style is an array or object
      const styles = Array.isArray(existingStyle)
        ? existingStyle
        : [existingStyle];

      // Look for fontWeight in the styles
      for (const style of styles) {
        if (style && style.fontWeight) {
          const weight = style.fontWeight;
          if (
            weight === 'bold' ||
            weight === '700' ||
            weight === '800' ||
            weight === '900'
          ) {
            fontFamily = 'ComicRelief-Bold';
            break;
          } else if (weight === '500' || weight === '600') {
            fontFamily = 'ComicRelief-Medium';
            break;
          }
        }
      }

      // Apply the default font family
      return React.cloneElement(origin, {
        style: [{ fontFamily }, existingStyle],
      });
    };
  }
};

// Call this function immediately when the module is imported
setupDefaultFont();
