/**
 * Web-safe replacements for React Native modules.
 * This file explicitly imports and re-exports all APIs from react-native-web
 * to ensure our custom shims for Platform, Dimensions, etc., are the only
 * versions that get bundled.
 */

// Explicitly import all known APIs from react-native-web
import {
  // Components
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
  // Android
  BackHandler,
  DrawerLayoutAndroid,
  PermissionsAndroid,
  ToastAndroid,
  // iOS
  InputAccessoryView,
  SafeAreaView,
  // Other APIs
  Alert as RNWAlert,
  Animated,
  Appearance,
  AppRegistry,
  AppState,
  DevSettings,
  Easing,
  InteractionManager,
  LayoutAnimation,
  PanResponder,
  PixelRatio as RNWPixelRatio,
  Share,
  StyleSheet,
  // UIManager, // DON'T import UIManager - it uses TurboModules!
  Vibration,
} from 'react-native-web';

// Re-export them all
export {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
  BackHandler,
  DrawerLayoutAndroid,
  PermissionsAndroid,
  ToastAndroid,
  InputAccessoryView,
  SafeAreaView,
  RNWAlert,
  Animated,
  Appearance,
  AppRegistry,
  AppState,
  DevSettings,
  Easing,
  InteractionManager,
  LayoutAnimation,
  PanResponder,
  RNWPixelRatio,
  Share,
  StyleSheet,
  // UIManager, // We'll export our own below
  Vibration,
};

// --- Custom Shims ---
// Now, export our own web-safe versions. These will be the only ones available.
export { default as Dimensions } from './Dimensions';
export { default as Platform } from './Platform';
export { default as Linking } from './Linking';
export { default as NativeModules } from './NativeModules';
export { default as UIManager } from './UIManager';

// Custom Alert and PixelRatio to override RNW's if needed, or to provide a default
export const Alert = {
  alert: (title, message, buttons) => {
    if (buttons && buttons.length > 0) {
      const confirmButton = buttons.find(b => b.style !== 'cancel');
      if (confirmButton && window.confirm(`${title}\n\n${message}`)) {
        confirmButton.onPress && confirmButton.onPress();
      } else {
        const cancelButton = buttons.find(b => b.style === 'cancel');
        cancelButton && cancelButton.onPress && cancelButton.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  }
};

export const PixelRatio = {
  get: () => window.devicePixelRatio || 1,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size) => Math.round(size * (window.devicePixelRatio || 1)),
  roundToNearestPixel: (size) => Math.round(size * (window.devicePixelRatio || 1)) / (window.devicePixelRatio || 1),
};
