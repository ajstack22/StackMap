import React from 'react';
import { View } from 'react-native';

/**
 * Web polyfill for react-native-gesture-handler
 * @description Provides web-compatible replacements for gesture handler components
 */

/**
 * GestureHandlerRootView component for web
 * @description Wraps the app content to enable gesture handling (no-op on web)
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.style - Optional style overrides
 * @returns {React.ReactElement} Wrapped children in a View component
 */
export const GestureHandlerRootView = ({ children, style }) => (
  <View style={[{ flex: 1 }, style]}>{children}</View>
);

/**
 * PanGestureHandler component for web
 * @description Handles pan gestures (no-op on web, returns children as-is)
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactNode} Children without any wrapping
 */
export const PanGestureHandler = ({ children }) => children;

/**
 * Gesture states enumeration
 * @description Maps gesture states to numeric values for compatibility
 * @type {Object.<string, number>}
 */
export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

export default {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
};
