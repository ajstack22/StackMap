/**
 * @format
 */

import React from 'react';
import { AppRegistry, Text, TextInput, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';
import { name as appName } from './app.json';

// Set default font for all Text components
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.style = [
  {
    fontFamily: Platform.select({
      ios: 'Comic Relief',
      android: 'ComicRelief-Regular'
    })
  },
  Text.defaultProps.style
];

// Set default font for all TextInput components
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.style = [
  {
    fontFamily: Platform.select({
      ios: 'Comic Relief',
      android: 'ComicRelief-Regular'
    })
  },
  TextInput.defaultProps.style
];

const AppWithSafeArea = () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);

AppRegistry.registerComponent(appName, () => AppWithSafeArea);
