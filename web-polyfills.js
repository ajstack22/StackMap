/**
 * Critical polyfills that MUST run before any React Native code
 * This file is loaded as the first entry point in webpack
 */

// Ensure global exists
if (typeof global === 'undefined') {
  window.global = window;
}

// Mock the native bridge
window.__fbBatchedBridgeConfig = {
  remoteModuleConfig: [],
  localModulesConfig: [],
};

// The KEY fix - mock TurboModuleRegistry BEFORE react-native loads
window.__turboModuleProxy = function(name) {
  const modules = {
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          window: {
            width: window.innerWidth || 1024,
            height: window.innerHeight || 768,
            scale: window.devicePixelRatio || 1,
            fontScale: 1,
          },
          screen: {
            width: window.screen?.width || window.innerWidth || 1024,
            height: window.screen?.height || window.innerHeight || 768,
            scale: window.devicePixelRatio || 1,
            fontScale: 1,
          },
        },
        isTablet: window.innerWidth >= 768,
        isEmulator: false,
      }),
    },
    UIManager: {
      getConstants: () => ({
        Dimensions: {
          window: {
            width: window.innerWidth || 1024,
            height: window.innerHeight || 768,
          },
          screen: {
            width: window.screen?.width || window.innerWidth || 1024,
            height: window.screen?.height || window.innerHeight || 768,
          },
        },
      }),
      getViewManagerConfig: () => null,
      hasViewManagerConfig: () => false,
      measure: () => {},
      measureInWindow: () => {},
      measureLayout: () => {},
      measureLayoutRelativeToParent: () => {},
      dispatchViewManagerCommand: () => {},
      RCTView: {
        directEventTypes: {},
      },
    },
    SourceCode: {
      getConstants: () => ({
        scriptURL: window.location.href,
      }),
    },
    PlatformConstants: {
      getConstants: () => ({
        reactNativeVersion: { major: 0, minor: 72, patch: 0 },
        isTesting: false,
        forceTouchAvailable: false,
      }),
    },
    StatusBarManager: {
      HEIGHT: 0,
      getHeight: (callback) => callback && callback({ height: 0 }),
      setHidden: () => {},
      setStyle: () => {},
      setBackgroundColor: () => {},
      setTranslucent: () => {},
    },
    AppState: {
      getCurrentAppState: (callback) => callback && callback({ app_state: 'active' }),
      addEventListener: () => ({ remove: () => {} }),
      removeEventListener: () => {},
    },
    Clipboard: {
      setString: () => {},
      getString: () => Promise.resolve(''),
    },
    Networking: {
      addListener: () => {},
      removeListeners: () => {},
    },
    I18nManager: {
      localeIdentifier: navigator.language || 'en-US',
      getConstants: () => ({
        isRTL: false,
        doLeftAndRightSwapInRTL: true,
        localeIdentifier: navigator.language || 'en-US',
      }),
    },
    KeyboardObserver: {
      addListener: () => ({ remove: () => {} }),
    },
    Appearance: {
      getColorScheme: () => 'light',
      addChangeListener: () => ({ remove: () => {} }),
    },
    AccessibilityInfo: {
      addEventListener: () => ({ remove: () => {} }),
      removeEventListener: () => {},
      isScreenReaderEnabled: () => Promise.resolve(false),
      fetch: () => Promise.resolve(false),
    },
    Settings: {
      get: () => ({}),
      set: () => {},
      watchKeys: () => {},
    },
    Linking: {
      getInitialURL: () => Promise.resolve(null),
      addEventListener: () => ({ remove: () => {} }),
      removeEventListener: () => {},
      canOpenURL: () => Promise.resolve(true),
      openURL: (url) => window.open(url, '_blank'),
    },
  };
  
  // Return the module if we have it, otherwise return a generic mock
  return modules[name] || {
    getConstants: () => ({}),
    addListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
  };
};

// Platform polyfill
window.Platform = {
  OS: 'web',
  Version: 1,
  isPad: false,
  isTV: false,
  isTVOS: false,
  isTesting: false,
  select: (obj) => obj.web || obj.default || Object.values(obj)[0],
};

// setImmediate polyfill
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (fn) => setTimeout(fn, 0);
  global.clearImmediate = clearTimeout;
}

// requestAnimationFrame polyfill
if (typeof requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
  global.cancelAnimationFrame = clearTimeout;
}

console.log('[Polyfills] React Native web polyfills loaded');