// This file MUST be loaded before any React Native code
// It sets up the global environment for React Native Web

// Ensure global exists
if (typeof global === 'undefined') {
  window.global = window;
}

// Create a mock react-native module with Platform already defined
const Platform = {
  OS: 'web',
  Version: 1,
  isPad: false,
  isTV: false,
  isTVOS: false,
  isTesting: false,
  select: function(obj) { 
    return obj.web || obj.default || Object.values(obj)[0];
  }
};

// Set Platform globally in every possible way
window.Platform = Platform;
global.Platform = Platform;

// Try to inject into require cache before react-native loads
if (typeof require !== 'undefined' && require.cache) {
  try {
    // Mock the Platform module directly
    require.cache[require.resolve('react-native/Libraries/Utilities/Platform')] = {
      exports: Platform
    };
  } catch (e) {
    // Ignore if module not found
  }
}

// Export Platform
module.exports = { Platform };