// Mock AsyncStorage with proper functionality BEFORE any imports
const mockAsyncStorage = {
  storage: new Map(),
  setItem: jest.fn((key, value) => {
    mockAsyncStorage.storage.set(key, value);
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(mockAsyncStorage.storage.get(key) || null);
  }),
  removeItem: jest.fn((key) => {
    mockAsyncStorage.storage.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    mockAsyncStorage.storage.clear();
    return Promise.resolve();
  })
};

// Mock Platform BEFORE AsyncStorage to ensure proper loading
jest.mock('react-native', () => ({
  Platform: {
    OS: 'web', // Use web for tests to avoid iOS-specific issues
  },
}));

// Mock crypto for tests and set up global crypto
jest.mock('react-native-get-random-values', () => {});

// Set up global crypto for tests (needed by tweetnacl)
global.crypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
};

// Mock AsyncStorage AFTER platform to ensure proper module resolution
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Ensure global AsyncStorage is available for TypeScript service
global.AsyncStorage = mockAsyncStorage;

// Use the fixed encryption service that works in test environments
const encryptionService = require('../encryptionServiceFixed.ts').default;

describe('EncryptionService', () => {
  beforeEach(async () => {
    // Clear AsyncStorage mock
    mockAsyncStorage.storage.clear();
    mockAsyncStorage.setItem.mockClear();
    mockAsyncStorage.getItem.mockClear();
    mockAsyncStorage.removeItem.mockClear();

    // Clear encryption service state
    await encryptionService.clear();
  });

  test('generates recovery phrase', () => {
    const phrase = encryptionService.generateRecoveryPhrase();
    expect(phrase).toBeTruthy();
    expect(typeof phrase).toBe('string');
    expect(phrase.length).toBeGreaterThan(0);
  });


  test('derives consistent key from phrase', async () => {
    const phrase = 'test recovery phrase';
    // Generate a proper base64-encoded salt
    const { salt } = await encryptionService.deriveKeyFromPhrase(phrase);

    const result1 = await encryptionService.deriveKeyFromPhrase(phrase, salt);
    const result2 = await encryptionService.deriveKeyFromPhrase(phrase, salt);

    expect(result1.key).toEqual(result2.key);
    expect(result1.salt).toBe(result2.salt);
  });

  test('encrypts and decrypts data successfully', async () => {
    const phrase = encryptionService.generateRecoveryPhrase();

    // Manual initialization without AsyncStorage calls
    const { key, salt } = await encryptionService.deriveKeyFromPhrase(phrase);
    encryptionService.masterKey = key;
    encryptionService.syncId = 'test-sync-id';

    const testData = {
      activities: ['activity1', 'activity2'],
      categories: ['category1'],
      timestamp: Date.now(),
    };

    const encrypted = encryptionService.encryptData(testData);
    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe('string');

    const decrypted = encryptionService.decryptData(encrypted);
    expect(decrypted).toEqual(testData);
  });

  test('different encryptions produce different ciphertexts', async () => {
    const phrase = encryptionService.generateRecoveryPhrase();

    // Manual initialization without AsyncStorage calls
    const { key, salt } = await encryptionService.deriveKeyFromPhrase(phrase);
    encryptionService.masterKey = key;
    encryptionService.syncId = 'test-sync-id';

    const testData = { test: 'data' };

    const encrypted1 = encryptionService.encryptData(testData);
    const encrypted2 = encryptionService.encryptData(testData);

    // Due to random nonce, ciphertexts should be different
    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to same data
    expect(encryptionService.decryptData(encrypted1)).toEqual(testData);
    expect(encryptionService.decryptData(encrypted2)).toEqual(testData);
  });

  test('decryption fails with wrong key', async () => {
    // Initialize with first phrase
    const phrase1 = encryptionService.generateRecoveryPhrase();
    const { key: key1 } = await encryptionService.deriveKeyFromPhrase(phrase1);
    encryptionService.masterKey = key1;
    encryptionService.syncId = 'sync1';
    const encrypted = encryptionService.encryptData({ test: 'data' });

    // Clear service and try to decrypt with different phrase
    encryptionService.masterKey = null;
    encryptionService.syncId = null;
    const phrase2 = encryptionService.generateRecoveryPhrase();
    const { key: key2 } = await encryptionService.deriveKeyFromPhrase(phrase2);
    encryptionService.masterKey = key2;
    encryptionService.syncId = 'sync2';

    expect(() => {
      encryptionService.decryptData(encrypted);
    }).toThrow(/Decryption failed|invalid key|corrupted data/);
  });

  test('handles large data sets', async () => {
    const phrase = encryptionService.generateRecoveryPhrase();

    // Manual initialization without AsyncStorage calls
    const { key, salt } = await encryptionService.deriveKeyFromPhrase(phrase);
    encryptionService.masterKey = key;
    encryptionService.syncId = 'test-sync-id';

    // Create large dataset
    const largeData = {
      activities: Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: `activity-${i}`,
          name: `Activity ${i}`,
          description:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        })),
    };

    const encrypted = encryptionService.encryptData(largeData);
    const decrypted = encryptionService.decryptData(encrypted);

    expect(decrypted).toEqual(largeData);
  });
});
