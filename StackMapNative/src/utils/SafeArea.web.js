import React from 'react';
import { View } from 'react-native';

// Web implementation of react-native-safe-area-context

export const SafeAreaProvider = ({ children }) => children;

export const SafeAreaView = ({ children, style, ...props }) => (
  <View style={style} {...props}>
    {children}
  </View>
);

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