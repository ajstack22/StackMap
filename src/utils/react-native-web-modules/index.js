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

/**
 * Custom Alert implementation for web
 * @description Provides web-compatible alert dialogs using native browser APIs
 */
export const Alert = {
  /**
   * Display an alert dialog
   * @param {string} title - Alert title
   * @param {string} message - Alert message
   * @param {Array<{text: string, onPress: Function, style?: string}>} buttons - Button configurations
   * @returns {void}
   */
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
  },
};

/**
 * PixelRatio utility for web
 * @description Provides device pixel ratio calculations for responsive layouts
 */
export const PixelRatio = {
  /**
   * Get the device pixel ratio
   * @returns {number} Device pixel ratio (default: 1)
   */
  get: () => window.devicePixelRatio || 1,
  /**
   * Get the font scale factor
   * @returns {number} Font scale factor (always 1 on web)
   */
  getFontScale: () => 1,
  /**
   * Convert layout size to pixel size
   * @param {number} size - Layout size
   * @returns {number} Pixel size adjusted for device pixel ratio
   */
  getPixelSizeForLayoutSize: size =>
    Math.round(size * (window.devicePixelRatio || 1)),
  /**
   * Round to nearest pixel for crisp rendering
   * @param {number} size - Size in pixels
   * @returns {number} Size rounded to nearest pixel
   */
  roundToNearestPixel: size =>
    Math.round(size * (window.devicePixelRatio || 1)) /
    (window.devicePixelRatio || 1),
};
