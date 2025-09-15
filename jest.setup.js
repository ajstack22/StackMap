/* eslint-env jest */
// Jest setup file for React Native Web testing
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

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
        interpolate: jest.fn(),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(),
      })),
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

// Mock console methods to reduce noise in test output
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    if (
      args[0]?.includes?.('VirtualizedLists') ||
      args[0]?.includes?.('useNativeDriver') ||
      args[0]?.includes?.('Animated')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    if (
      args[0]?.includes?.('Warning:') ||
      args[0]?.includes?.('ReactTestRenderer')
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