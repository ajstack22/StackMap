// Platform mock for React Native Web
// This file is aliased in webpack config to replace react-native's Platform module

const Platform = {
  OS: 'web',
  Version: 1,
  isPad: false,
  isTV: false,
  isTVOS: false,
  isTesting: false,
  select: (obj) => obj.web || obj.default || Object.values(obj)[0],
};

// Also set it globally for any code that expects it
if (typeof window !== 'undefined') {
  window.Platform = Platform;
  if (typeof global !== 'undefined') {
    global.Platform = Platform;
  }
}

export default Platform;
export { Platform };