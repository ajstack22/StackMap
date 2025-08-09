/**
 * Web-safe replacement for react-native's NativeModules
 * Provides mocks for all native modules used in the app
 */

const NativeModulesWeb = {
  // Core modules
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
    getHeight: (callback) => callback({ height: 0 }),
    setHidden: () => {},
    setStyle: () => {},
    setBackgroundColor: () => {},
    setTranslucent: () => {},
    setNetworkActivityIndicatorVisible: () => {},
  },
  
  UIManager: {
    RCTView: {
      directEventTypes: {},
    },
    getViewManagerConfig: () => null,
    measure: (node, callback) => {
      if (node && typeof node.getBoundingClientRect === 'function') {
        const rect = node.getBoundingClientRect();
        callback(rect.x, rect.y, rect.width, rect.height, window.pageXOffset + rect.x, window.pageYOffset + rect.y);
      }
    },
  },
  
  AppState: {
    getCurrentAppState: (callback) => callback({ app_state: 'active' }),
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
  },
  
  Clipboard: {
    setString: async (text) => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
    },
    getString: async () => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText();
      }
      return '';
    },
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
    getColorScheme: () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    },
    addChangeListener: (listener) => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addListener(listener);
      return {
        remove: () => mediaQuery.removeListener(listener),
      };
    },
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
};

export default NativeModulesWeb;