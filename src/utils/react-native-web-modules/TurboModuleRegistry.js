/**
 * Mock TurboModuleRegistry for web
 * This prevents any TurboModule calls from throwing errors
 */

// Map of module names to implementations
const modules = {
  UIManager: {
    getConstants: () => ({}),
    getViewManagerConfig: () => null,
    hasViewManagerConfig: () => false,
    measure: () => {},
    measureInWindow: () => {},
    measureLayout: () => {},
    measureLayoutRelativeToParent: () => {},
    dispatchViewManagerCommand: () => {},
    RCTView: { directEventTypes: {} },
  },
  DeviceInfo: {
    getConstants: () => ({
      Dimensions: {
        window: {
          width: typeof window !== 'undefined' ? window.innerWidth : 1024,
          height: typeof window !== 'undefined' ? window.innerHeight : 768,
          scale: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
          fontScale: 1,
        },
        screen: {
          width:
            typeof window !== 'undefined' && window.screen
              ? window.screen.width
              : 1024,
          height:
            typeof window !== 'undefined' && window.screen
              ? window.screen.height
              : 768,
          scale: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
          fontScale: 1,
        },
      },
      isTablet: false,
      isEmulator: false,
    }),
  },
  SourceCode: {
    getConstants: () => ({
      scriptURL: typeof window !== 'undefined' ? window.location.href : '',
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
    getHeight: callback => callback && callback({ height: 0 }),
    setHidden: () => {},
    setStyle: () => {},
    setBackgroundColor: () => {},
    setTranslucent: () => {},
  },
  AppState: {
    getCurrentAppState: callback =>
      callback && callback({ app_state: 'active' }),
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
    localeIdentifier: 'en-US',
    getConstants: () => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: true,
      localeIdentifier: 'en-US',
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
    openURL: url =>
      typeof window !== 'undefined' ? window.open(url, '_blank') : null,
  },
};

// Mock the TurboModuleRegistry
const TurboModuleRegistry = {
  get(name) {
    return modules[name] || null;
  },

  getEnforcing(name) {
    const module = modules[name];
    if (!module) {
      // Instead of throwing, return a mock module
      console.warn(
        `[TurboModuleRegistry] Module ${name} not found, returning mock`,
      );
      return {
        getConstants: () => ({}),
        addListener: () => ({ remove: () => {} }),
        removeEventListener: () => {},
      };
    }
    return module;
  },
};

export default TurboModuleRegistry;
export { TurboModuleRegistry };
export const get = TurboModuleRegistry.get;
export const getEnforcing = TurboModuleRegistry.getEnforcing;
