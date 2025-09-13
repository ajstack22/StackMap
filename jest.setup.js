/* eslint-env jest */
// Jest setup file for sync system tests

// Enable fake timers for testing debouncing and intervals
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock crypto globally
global.crypto = {
  getRandomValues: (buffer) => {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  },
  randomUUID: () => 'test-uuid-1234-5678-9abc-def012345678',
};

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {};
  return {
    getItem: jest.fn((key) => Promise.resolve(storage[key] || null)),
    setItem: jest.fn((key, value) => {
      storage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      delete storage[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(storage))),
    multiGet: jest.fn((keys) => 
      Promise.resolve(keys.map(key => [key, storage[key] || null]))
    ),
    multiSet: jest.fn((keyValuePairs) => {
      keyValuePairs.forEach(([key, value]) => {
        storage[key] = value;
      });
      return Promise.resolve();
    }),
  };
});

// Mock Platform
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: 17,
  select: jest.fn((options) => options.ios || options.default),
  isPad: false,
  isTV: false,
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
    details: {
      isConnectionExpensive: false,
    },
  })),
  isConnected: {
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    fetch: jest.fn(() => Promise.resolve(true)),
  },
}));

// Mock react-native modules that might be used
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Platform: {
    OS: 'ios',
    Version: 17,
    select: jest.fn((options) => options.ios || options.default),
  },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    getInitialURL: jest.fn(() => Promise.resolve(null)),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

// Mock pako for compression
jest.mock('pako', () => ({
  deflate: jest.fn((data) => data),
  inflate: jest.fn((data) => data),
}));

// Mock tweetnacl
jest.mock('tweetnacl', () => ({
  secretbox: {
    keyLength: 32,
    nonceLength: 24,
    open: jest.fn((box, nonce, key) => {
      // Simple mock decryption
      return new Uint8Array(Buffer.from('decrypted-data'));
    }),
  },
  hash: jest.fn((data) => {
    // Simple mock hashing
    return new Uint8Array(64);
  }),
  randomBytes: jest.fn((length) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }),
}));

// Helper to reset all mocks between tests
global.resetAllMocks = () => {
  jest.clearAllMocks();
  jest.clearAllTimers();
};