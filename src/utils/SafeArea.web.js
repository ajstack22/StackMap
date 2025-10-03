import React from 'react';
import { View } from 'react-native';

/**
 * Web implementation of react-native-safe-area-context
 * @description Provides polyfills for safe area components and hooks on web platform
 */

/**
 * SafeAreaProvider component for web
 * @description Provides safe area context to child components (no-op on web)
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactNode} Children without any wrapping
 */
export const SafeAreaProvider = ({ children }) => children;

/**
 * SafeAreaView component for web
 * @description View that respects safe area insets (standard View on web)
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.style - Style object for the view
 * @param {Object} props...props - Additional props passed to View
 * @returns {React.ReactElement} View component with children
 */
export const SafeAreaView = ({ children, style, ...props }) => (
  <View style={style} {...props}>
    {children}
  </View>
);

/**
 * Hook to get safe area insets
 * @description Returns safe area insets (all zeros on web)
 * @returns {{top: number, right: number, bottom: number, left: number}} Safe area insets object
 */
export const useSafeAreaInsets = () => ({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

export default {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
};
