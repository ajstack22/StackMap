/**
 * @format
 */

console.log('[APP STARTUP] index.js loading at', Date.now());

// Import Reanimated FIRST before any other imports
import 'react-native-reanimated';

// Import crypto polyfill for React Native BEFORE any other imports that might use it
import 'react-native-get-random-values';

import React from 'react';
import { AppRegistry, Text, TextInput, Platform, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';
import { name as appName } from './app.json';

// Suppress console warnings about Legacy Architecture
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      args[0] && 
      typeof args[0] === 'string' && 
      (args[0].includes('Legacy Architecture') ||
       args[0].includes('The app is running using the Legacy Architecture'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Ignore specific warnings
LogBox.ignoreLogs([
  // Ignore legacy React warnings
  'Warning: Using UNSAFE_componentWillMount',
  'Warning: Using UNSAFE_componentWillReceiveProps',
  'Warning: Using UNSAFE_componentWillUpdate',
  'Warning: componentWillMount has been renamed',
  'Warning: componentWillReceiveProps has been renamed',
  'Warning: componentWillUpdate has been renamed',
  // Ignore any warning that contains these strings
  'componentWillMount',
  'componentWillReceiveProps',
  'componentWillUpdate',
  'UNSAFE_',
  // Common React Native warnings
  'VirtualizedLists should never be nested',
  // Ignore Legacy Architecture warning
  'The app is running using the Legacy Architecture',
  'Legacy Architecture',
  // You can add other warnings to ignore here
]);

// Optionally, disable all yellow box warnings in development (not recommended for production)
// LogBox.ignoreAllLogs(true);

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
