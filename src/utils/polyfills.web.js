// Polyfills for web environment

// Mock native bridge config to prevent React Native errors
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModulesConfig: [],
};

// Mock NativeModules
global.NativeModules = {
  SourceCode: {
    scriptURL: 'http://localhost:8081/index.bundle?platform=web',
  },
  PlatformConstants: {
    getConstants: () => ({
      reactNativeVersion: { major: 0, minor: 72, patch: 0 },
    }),
  },
  DeviceInfo: {
    Dimensions: {
      window: {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 1,
        fontScale: 1,
      },
      screen: {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 1,
        fontScale: 1,
      },
    },
  },
};

// Mock TurboModuleRegistry
global.__turboModuleProxy = function(name) {
  const mockModule = {
    SourceCode: {
      getConstants: () => ({
        scriptURL: 'http://localhost:8081/index.bundle?platform=web',
      }),
    },
    PlatformConstants: {
      getConstants: () => ({
        reactNativeVersion: { major: 0, minor: 72, patch: 0 },
        isTesting: false,
        forceTouchAvailable: false,
      }),
    },
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          window: {
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1,
            fontScale: 1,
          },
          screen: {
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1,
            fontScale: 1,
          },
        },
      }),
    },
  };
  
  return mockModule[name] || {};
};

// setImmediate polyfill
if (typeof setImmediate === 'undefined') {
  global.setImmediate = function(callback) {
    return setTimeout(callback, 0);
  };
  global.clearImmediate = function(id) {
    return clearTimeout(id);
  };
}

// requestAnimationFrame polyfill
if (typeof requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 1000 / 60);
  };
}

// cancelAnimationFrame polyfill  
if (typeof cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = function(id) {
    return clearTimeout(id);
  };
}

// Performance polyfill
if (typeof performance === 'undefined') {
  global.performance = {
    now: function() {
      return Date.now();
    }
  };
}