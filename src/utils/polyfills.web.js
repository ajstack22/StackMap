// Polyfills for web environment

// Mock Platform - CRITICAL for React Native web
if (typeof window !== 'undefined') {
  // Platform must be global for React Native
  global.Platform = window.Platform = {
    OS: 'web',
    Version: 1,
    isPad: false,
    isTV: false,
    isTVOS: false,
    isTesting: false,
    select: (obj) => obj.web || obj.default || Object.values(obj)[0],
  };
}

// Mock native bridge config to prevent React Native errors
global.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModulesConfig: [],
};

// Complete NativeModules mock
global.NativeModules = {
  SourceCode: {
    scriptURL: 'http://localhost:8081/index.bundle?platform=web',
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
          width: window.innerWidth || 1024,
          height: window.innerHeight || 768,
          scale: 1,
          fontScale: 1,
        },
        screen: {
          width: window.screen?.width || window.innerWidth || 1024,
          height: window.screen?.height || window.innerHeight || 768,
          scale: 1,
          fontScale: 1,
        },
      },
      isTablet: false,
      isEmulator: false,
    }),
    Dimensions: {
      window: {
        width: window.innerWidth || 1024,
        height: window.innerHeight || 768,
        scale: 1,
        fontScale: 1,
      },
      screen: {
        width: window.screen?.width || window.innerWidth || 1024,
        height: window.screen?.height || window.innerHeight || 768,
        scale: 1,
        fontScale: 1,
      },
    },
  },
  UIManager: {
    RCTView: {
      directEventTypes: {},
    },
    getViewManagerConfig: () => null,
  },
  KeyboardObserver: {
    addListener: () => ({ remove: () => {} }),
  },
  StatusBarManager: {
    HEIGHT: 0,
    getHeight: (callback) => callback({ height: 0 }),
  },
  Networking: {
    addListener: () => {},
    removeListeners: () => {},
  },
  AppState: {
    getCurrentAppState: (callback) => callback({ app_state: 'active' }),
    addListener: () => ({ remove: () => {} }),
  },
  Clipboard: {
    setString: () => {},
    getString: () => Promise.resolve(''),
  },
  I18nManager: {
    localeIdentifier: 'en_US',
    getConstants: () => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: true,
      localeIdentifier: 'en_US',
    }),
  },
  Linking: {
    getInitialURL: () => Promise.resolve(null),
    addEventListener: () => ({ remove: () => {} }),
    canOpenURL: () => Promise.resolve(true),
    openURL: (url) => window.open(url, '_blank'),
  },
  Settings: {
    get: () => ({}),
    set: () => {},
    watchKeys: () => {},
  },
  Appearance: {
    getColorScheme: () => 'light',
    addChangeListener: () => ({ remove: () => {} }),
  },
  AccessibilityInfo: {
    addEventListener: () => ({ remove: () => {} }),
    isScreenReaderEnabled: () => Promise.resolve(false),
    fetch: () => Promise.resolve(false),
  },
};

// Mock TurboModuleRegistry with ALL modules
global.__turboModuleProxy = function(name) {
  // Return NativeModules entry if it exists
  if (global.NativeModules[name]) {
    return global.NativeModules[name];
  }
  
  // Otherwise return a generic mock
  return {
    getConstants: () => ({}),
    addListener: () => ({ remove: () => {} }),
  };
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