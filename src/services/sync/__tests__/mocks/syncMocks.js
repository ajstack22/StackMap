// Mock implementations for sync system dependencies

// AsyncStorage mock with persistent state
export const createAsyncStorageMock = () => {
  let storage = {};
  
  return {
    getItem: jest.fn((key) => {
      return Promise.resolve(storage[key] || null);
    }),
    setItem: jest.fn((key, value) => {
      storage[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      delete storage[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      storage = {};
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => {
      return Promise.resolve(Object.keys(storage));
    }),
    multiGet: jest.fn((keys) => {
      return Promise.resolve(keys.map(key => [key, storage[key] || null]));
    }),
    multiSet: jest.fn((keyValuePairs) => {
      keyValuePairs.forEach(([key, value]) => {
        storage[key] = value;
      });
      return Promise.resolve();
    }),
    __getStorage: () => storage,
    __setStorage: (newStorage) => { storage = newStorage; },
  };
};

// Platform mock for testing platform-specific behavior
export const createPlatformMock = (os = 'ios') => ({
  OS: os,
  Version: os === 'ios' ? 17 : 34,
  select: jest.fn((options) => options[os] || options.default),
  isPad: false,
  isTV: false,
});

// Fetch mock for network operations
export const createFetchMock = () => {
  const responses = new Map();
  
  const fetchMock = jest.fn((url, options) => {
    const key = `${options?.method || 'GET'} ${url}`;
    const response = responses.get(key);
    
    if (response) {
      return Promise.resolve({
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText || 'OK',
        json: () => Promise.resolve(response.data),
        text: () => Promise.resolve(JSON.stringify(response.data)),
        headers: new Map(Object.entries(response.headers || {})),
      });
    }
    
    // Default 404 response
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: 'Not found' }),
      text: () => Promise.resolve('Not found'),
      headers: new Map(),
    });
  });
  
  fetchMock.setResponse = (method, url, response) => {
    responses.set(`${method} ${url}`, response);
  };
  
  fetchMock.clearResponses = () => {
    responses.clear();
  };
  
  return fetchMock;
};

// Crypto mock for encryption operations
export const createCryptoMock = () => ({
  getRandomValues: jest.fn((buffer) => {
    // Fill with deterministic values for testing
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
    return buffer;
  }),
  randomUUID: jest.fn(() => 'test-uuid-1234-5678-9abc-def012345678'),
  subtle: {
    digest: jest.fn(() => Promise.resolve(new ArrayBuffer(32))),
  },
});

// Window/location mock for web environment
export const createWindowMock = () => ({
  location: {
    href: 'https://stackmap.app/',
    search: '',
    hash: '',
    origin: 'https://stackmap.app',
    protocol: 'https:',
    host: 'stackmap.app',
    hostname: 'stackmap.app',
    pathname: '/',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  navigator: {
    onLine: true,
    userAgent: 'Mozilla/5.0 (Testing)',
  },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  localStorage: createAsyncStorageMock(),
});

// NetInfo mock for network state
export const createNetInfoMock = () => ({
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
});

// Store mock factory for Zustand stores
export const createStoreMock = (initialState = {}) => {
  let state = { ...initialState };
  const listeners = new Set();
  
  const store = {
    getState: jest.fn(() => state),
    setState: jest.fn((update) => {
      const newState = typeof update === 'function' ? update(state) : update;
      state = { ...state, ...newState };
      listeners.forEach(listener => listener(state));
    }),
    subscribe: jest.fn((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    destroy: jest.fn(() => {
      listeners.clear();
    }),
    __setState: (newState) => {
      state = newState;
    },
  };
  
  return store;
};

// Timer utilities for testing debouncing and intervals
export const createTimerUtils = () => ({
  advanceTimersByTime: (ms) => jest.advanceTimersByTime(ms),
  runAllTimers: () => jest.runAllTimers(),
  runOnlyPendingTimers: () => jest.runOnlyPendingTimers(),
  clearAllTimers: () => jest.clearAllTimers(),
  getTimerCount: () => jest.getTimerCount(),
});

// Encryption service mock
export const createEncryptionServiceMock = () => ({
  initialize: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  deriveKeyFromPhrase: jest.fn((phrase) => Promise.resolve(`key-${phrase}`)),
  encryptData: jest.fn((data) => Promise.resolve(`encrypted-${JSON.stringify(data)}`)),
  decryptData: jest.fn((data) => {
    if (data.startsWith('encrypted-')) {
      return Promise.resolve(JSON.parse(data.replace('encrypted-', '')));
    }
    throw new Error('Invalid encrypted data');
  }),
  generateRecoveryPhrase: jest.fn(() => '0123456789abcdef0123456789abcdef'),
  storeRecoveryPhrase: jest.fn(() => Promise.resolve()),
  getStoredRecoveryPhrase: jest.fn(() => Promise.resolve('0123456789abcdef0123456789abcdef')),
  getDeviceId: jest.fn(() => Promise.resolve('test-device-id')),
});

// Conflict resolver mock
export const createConflictResolverMock = () => ({
  resolveConflicts: jest.fn((local, remote, options) => {
    // Simple last-write-wins mock
    return remote;
  }),
  validateConflictResolution: jest.fn(() => true),
});

// Data normalizer mock
export const createDataNormalizerMock = () => ({
  normalizeActivity: jest.fn((activity) => ({
    ...activity,
    text: activity.text || activity.name || activity.title,
    icon: activity.icon || activity.emoji,
  })),
  normalizeUser: jest.fn((user) => ({
    ...user,
    icon: user.icon || user.emoji,
  })),
  normalizeSyncData: jest.fn((data) => data),
  needsNormalization: jest.fn(() => false),
});

// Test helper to set up all mocks
export const setupAllMocks = () => {
  const asyncStorageMock = createAsyncStorageMock();
  const platformMock = createPlatformMock();
  const fetchMock = createFetchMock();
  const cryptoMock = createCryptoMock();
  const netInfoMock = createNetInfoMock();
  const encryptionServiceMock = createEncryptionServiceMock();
  const conflictResolverMock = createConflictResolverMock();
  const dataNormalizerMock = createDataNormalizerMock();
  
  // Note: jest.mock() calls must be hoisted and cannot reference variables
  // These mocks should be set up in the test file or jest.setup.js
  
  global.fetch = fetchMock;
  global.crypto = cryptoMock;
  
  return {
    asyncStorageMock,
    platformMock,
    fetchMock,
    cryptoMock,
    netInfoMock,
    encryptionServiceMock,
    conflictResolverMock,
    dataNormalizerMock,
  };
};

// Test helper to verify no memory leaks
export const checkForMemoryLeaks = (fn) => {
  const initialMemory = process.memoryUsage().heapUsed;
  fn();
  global.gc && global.gc();
  const finalMemory = process.memoryUsage().heapUsed;
  const leak = finalMemory - initialMemory;
  
  // Allow up to 10MB difference
  expect(leak).toBeLessThan(10 * 1024 * 1024);
};

// Test helper for async operations with timeout
export const withTimeout = (promise, ms = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);
};

export default {
  createAsyncStorageMock,
  createPlatformMock,
  createFetchMock,
  createCryptoMock,
  createWindowMock,
  createNetInfoMock,
  createStoreMock,
  createTimerUtils,
  createEncryptionServiceMock,
  createConflictResolverMock,
  createDataNormalizerMock,
  setupAllMocks,
  checkForMemoryLeaks,
  withTimeout,
};