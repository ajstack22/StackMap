/**
 * Web-safe replacements for React Native modules
 * These avoid TurboModule dependencies that cause errors on web
 */

// Import all exports from react-native-web
import * as ReactNativeWeb from 'react-native-web';

// Explicitly delete the modules we want to override
// This prevents them from being re-exported by the wildcard export
delete ReactNativeWeb.Dimensions;
delete ReactNativeWeb.Platform;
delete ReactNativeWeb.Linking;
delete ReactNativeWeb.NativeModules;

// Re-export everything from react-native-web EXCEPT the modules we deleted
export * from 'react-native-web';

// Now, export our own web-safe versions
// These will be the only versions available to the bundler
export { default as Dimensions } from './Dimensions';
export { default as Platform } from './Platform';
export { default as Linking } from './Linking';
export { default as NativeModules } from './NativeModules';

// --- Other polyfills can remain as they are ---

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