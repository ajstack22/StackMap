/**
 * Web-safe replacement for react-native's Platform module
 * Provides consistent Platform API without TurboModule dependencies
 */

const PlatformWeb = {
  OS: 'web',
  Version: 1,
  isPad: false,
  isTV: false,
  isTVOS: false,
  isTesting: false,
  
  select: (obj) => {
    if ('web' in obj) return obj.web;
    if ('default' in obj) return obj.default;
    // Return first available value
    return Object.values(obj)[0];
  },
  
  // Constants for web environment
  constants: {
    reactNativeVersion: { major: 0, minor: 72, patch: 0 },
    isTesting: false,
    forceTouchAvailable: false,
  },
};

export default PlatformWeb;
export const Platform = PlatformWeb;