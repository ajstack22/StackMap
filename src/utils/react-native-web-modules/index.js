/**
 * Web-safe replacements for React Native modules
 * These avoid TurboModule dependencies that cause errors on web
 */

// First, set up our overrides on the global scope to intercept TurboModule calls
if (typeof window !== 'undefined') {
  // Mock TurboModuleRegistry before anything else loads
  window.__turboModuleProxy = function(name) {
    // Return our mock modules
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
        getConstants: () => ({}),
        getViewManagerConfig: () => null,
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
    };
    
    return modules[name] || null;
  };
}

// Re-export everything from react-native-web
export * from 'react-native-web';

// Override problematic modules with our web-safe versions
export { default as Dimensions } from './Dimensions';
export { default as Platform } from './Platform';
export { default as NativeModules } from './NativeModules';
export { default as Linking } from './Linking';

// Additional exports that might be needed
export const Alert = {
  alert: (title, message, buttons, options) => {
    // Simple web implementation
    if (buttons && buttons.length > 0) {
      const confirmButton = buttons.find(b => b.style !== 'cancel');
      const cancelButton = buttons.find(b => b.style === 'cancel');
      
      if (confirmButton && cancelButton) {
        if (window.confirm(`${title}\n\n${message}`)) {
          confirmButton.onPress && confirmButton.onPress();
        } else {
          cancelButton.onPress && cancelButton.onPress();
        }
      } else if (confirmButton) {
        window.alert(`${title}\n\n${message}`);
        confirmButton.onPress && confirmButton.onPress();
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  }
};

export const PixelRatio = {
  get: () => window.devicePixelRatio || 1,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size) => Math.round(size * (window.devicePixelRatio || 1)),
  roundToNearestPixel: (size) => Math.round(size * (window.devicePixelRatio || 1)) / (window.devicePixelRatio || 1),
};