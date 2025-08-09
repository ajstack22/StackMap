/**
 * Complete react-native replacement for web
 * This file re-exports everything from our custom modules
 */

// Re-export most things from react-native-web
export * from 'react-native-web';

// Override with our custom implementations
export { default as Platform } from './src/utils/react-native-web-modules/Platform';
export { default as Dimensions } from './src/utils/react-native-web-modules/Dimensions';
export { default as Linking } from './src/utils/react-native-web-modules/Linking';
export { default as NativeModules } from './src/utils/react-native-web-modules/NativeModules';
export { default as UIManager } from './src/utils/react-native-web-modules/UIManager';

// Also export them as named exports for destructuring imports
export const DeviceEventEmitter = {
  addListener: () => ({ remove: () => {} }),
  removeListener: () => {},
  emit: () => {},
};

// Export Alert
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

// Export PixelRatio
export const PixelRatio = {
  get: () => window.devicePixelRatio || 1,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size) => Math.round(size * (window.devicePixelRatio || 1)),
  roundToNearestPixel: (size) => Math.round(size * (window.devicePixelRatio || 1)) / (window.devicePixelRatio || 1),
};