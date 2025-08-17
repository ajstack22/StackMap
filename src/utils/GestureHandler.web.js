import React from 'react';
import { View } from 'react-native';

// Web polyfill for react-native-gesture-handler

export const GestureHandlerRootView = ({ children, style }) => (
  <View style={[{ flex: 1 }, style]}>{children}</View>
);

export const PanGestureHandler = ({ children }) => children;

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
