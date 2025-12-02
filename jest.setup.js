/* eslint-env jest */
// Jest setup file for React Native Web testing
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock React Native core components and APIs
jest.mock('react-native', () => {
  return {
    Platform: {
      OS: 'web',
      select: (options) => options.web || options.default,
    },
    TurboModuleRegistry: {
      getEnforcing: jest.fn(() => ({})),
      get: jest.fn(() => ({})),
    },
    NativeModules: {
      SettingsManager: {
        settings: {},
      },
    },
    Alert: {
      alert: jest.fn(),
    },
    Clipboard: {
      setString: jest.fn(),
      getString: jest.fn(() => Promise.resolve('')),
    },
    // Mock essential components
    View: 'View',
    Text: 'Text',
    ScrollView: 'ScrollView',
    TouchableOpacity: 'TouchableOpacity',
    FlatList: 'FlatList',
    Modal: 'Modal',
    TextInput: 'TextInput',
    Image: 'Image',
    SafeAreaView: 'SafeAreaView',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    ActivityIndicator: 'ActivityIndicator',
    StatusBar: 'StatusBar',
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 667,
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Animated: {
      View: 'Animated.View',
      Text: 'Animated.Text',
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => ({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        })),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
      sequence: jest.fn((animations) => ({
        start: jest.fn((callback) => {
          // Execute all animations and call callback
          animations.forEach(anim => {
            if (anim && anim.start) {
              anim.start();
            }
          });
          if (callback) callback();
        }),
      })),
      parallel: jest.fn((animations) => ({
        start: jest.fn((callback) => {
          animations.forEach(anim => {
            if (anim && anim.start) {
              anim.start();
            }
          });
          if (callback) callback();
        }),
      })),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((style) => style),
      compose: jest.fn((style1, style2) => [style1, style2].filter(Boolean)),
    },
  };
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
  })),
  addEventListener: jest.fn(() => jest.fn()),
  removeEventListener: jest.fn(),
}));

// Mock react-native-keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve(true)),
  getInternetCredentials: jest.fn(() => Promise.resolve({
    username: 'test',
    password: 'test',
  })),
  resetInternetCredentials: jest.fn(() => Promise.resolve(true)),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  withSafeAreaInsets: (Component) => Component,
}));

// Mock console methods to reduce noise in test output
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    if (
      args[0]?.includes?.('VirtualizedLists') ||
      args[0]?.includes?.('useNativeDriver') ||
      args[0]?.includes?.('Animated') ||
      args[0]?.includes?.('[BuildConfig]') ||
      args[0]?.includes?.('[Sync]')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    if (
      args[0]?.includes?.('Warning:') ||
      args[0]?.includes?.('ReactTestRenderer') ||
      args[0]?.includes?.('An update to TestComponent inside a test was not wrapped in act(') ||
      args[0]?.includes?.('act(...)')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Global test utilities
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Add performance.now polyfill for Node.js
if (typeof global.performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  };
}