/**
 * Web-safe replacement for react-native's Platform module
 * Provides consistent Platform API without TurboModule dependencies
 */

const Platform = {
  OS: 'web',
  Version: 1,
  isPad: false,
  isTV: false,
  isTVOS: false,
  isTesting: false,
  
  select: (obj) => {
    // Use 'web' key if it exists, otherwise fall back to 'default'
    if (obj.web !== undefined) {
      return obj.web;
    }
    if (obj.default !== undefined) {
      return obj.default;
    }
    // If neither is present, return undefined to match native behavior more closely
    return undefined;
  },
  
  // Constants for web environment
  constants: {
    reactNativeVersion: { major: 0, minor: 72, patch: 0 },
    isTesting: false,
    forceTouchAvailable: false,
  },
};

export default Platform;
