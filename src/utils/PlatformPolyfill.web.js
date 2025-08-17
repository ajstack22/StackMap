/**
 * Platform polyfill for React Native Web
 * This module is aliased in webpack to replace react-native's Platform module
 * It ensures Platform is always defined with the correct values for web
 */

const Platform = {
  OS: 'web',
  Version: 1,
  isPad: false,
  isTV: false,
  isTVOS: false,
  isTesting: false,
  constants: {
    reactNativeVersion: {
      major: 0,
      minor: 72,
      patch: 0,
    },
  },
  select: function (obj) {
    if ('web' in obj) {
      return obj.web;
    } else if ('default' in obj) {
      return obj.default;
    } else {
      const keys = Object.keys(obj);
      if (keys.length > 0) {
        return obj[keys[0]];
      }
      return undefined;
    }
  },
};

// Ensure it's available globally as well (for any code that might use global.Platform)
if (typeof global !== 'undefined') {
  global.Platform = Platform;
}
if (typeof window !== 'undefined') {
  window.Platform = Platform;
}

// Export both as default and named export to handle different import styles
export default Platform;
export { Platform };
