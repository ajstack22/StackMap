// This file MUST be loaded before any React Native code
// It sets up the global environment for React Native Web

// Ensure global exists
if (typeof global === 'undefined') {
  window.global = window;
}

// Mock Platform - CRITICAL for React Native web
// This must exist before ANY React Native imports
window.Platform = {
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

// Make Platform available globally
global.Platform = window.Platform;

// Export Platform so webpack knows about it
module.exports = { Platform: window.Platform };