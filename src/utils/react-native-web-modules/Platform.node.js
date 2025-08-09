/**
 * Web-safe Platform module for node_modules replacement
 * This replaces react-native's Platform.js directly
 */

const Platform = {
  OS: 'web',
  Version: 1,
  isPad: false,
  isTV: false,
  isTVOS: false,
  isTesting: false,
  
  select: (obj) => {
    if (obj && typeof obj === 'object') {
      if ('web' in obj) return obj.web;
      if ('default' in obj) return obj.default;
      // Return first available value
      const keys = Object.keys(obj);
      if (keys.length > 0) return obj[keys[0]];
    }
    return undefined;
  },
  
  // Constants for web environment
  constants: {
    reactNativeVersion: { major: 0, minor: 72, patch: 0 },
    isTesting: false,
    forceTouchAvailable: false,
  },
};

// Export in CommonJS format for node_modules
module.exports = Platform;