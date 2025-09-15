/**
 * Integration Tests for EncryptionService
 * Tests encryption/decryption workflows and cross-service interactions
 */

// Mock AsyncStorage before importing anything else
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

// Set up mocks before any imports
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' }
}));
jest.mock('react-native-get-random-values', () => {});

// Mock console to reduce noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
});

// Import after mocks are set up
const encryptionService = require('../encryptionService').default;

describe('EncryptionService Integration Tests', () => {
  beforeEach(async () => {
    // Clear all mocks and storage
    mockAsyncStorage.storage.clear();
    jest.clearAllMocks();

    // Reset encryption service state
    encryptionService.masterKey = null;
    encryptionService.syncId = null;

    // Clear any cached keys
    if (encryptionService.keyCache) {
      encryptionService.keyCache = {};
    }
  });

  describe('Basic Encryption Operations', () => {
    test('should generate valid recovery phrase', () => {
      const phrase = encryptionService.generateRecoveryPhrase();

      expect(phrase).toBeTruthy();
      expect(typeof phrase).toBe('string');
      expect(phrase.length).toBe(32); // 16 bytes * 2 hex chars
      expect(/^[0-9a-f]+$/.test(phrase)).toBe(true); // Only hex chars
    });

    test('should derive consistent keys from same phrase and salt', async () => {
      const phrase = 'test-recovery-phrase-12345678';

      // First derivation
      const result1 = await encryptionService.deriveKeyFromPhrase(phrase);
      expect(result1.key).toBeInstanceOf(Uint8Array);
      expect(result1.salt).toBeTruthy();

      // Second derivation with same salt should produce same key
      const result2 = await encryptionService.deriveKeyFromPhrase(phrase, result1.salt);
      expect(result2.key).toEqual(result1.key);
      expect(result2.salt).toBe(result1.salt);
    });

    test('should initialize encryption service properly', async () => {
      const phrase = encryptionService.generateRecoveryPhrase();
      const syncId = 'test-sync-id';

      const result = await encryptionService.initialize(phrase, syncId);

      expect(result.salt).toBeTruthy();
      expect(encryptionService.masterKey).toBeInstanceOf(Uint8Array);
      expect(encryptionService.syncId).toBe(syncId);

      // Verify AsyncStorage calls
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        `@sync_phrase_${syncId}`,
        phrase
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'encryption_salt',
        result.salt
      );
    });
  });

  describe('Data Encryption/Decryption Workflows', () => {
    let testPhrase;
    let testSyncId;

    beforeEach(async () => {
      testPhrase = 'test-phrase-for-encryption';
      testSyncId = 'test-sync-12345';
      await encryptionService.initialize(testPhrase, testSyncId);
    });

    test('should encrypt and decrypt simple data', () => {
      const testData = {
        message: 'Hello World',
        number: 42,
        boolean: true
      };

      const encrypted = encryptionService.encryptData(testData);
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = encryptionService.decryptData(encrypted);
      expect(decrypted).toEqual(testData);
    });

    test('should handle complex data structures', () => {
      const complexData = {
        users: {
          user1: {
            name: 'Test User',
            activities: [
              { id: '1', text: 'Task 1', completed: false },
              { id: '2', text: 'Task 2', completed: true }
            ],
            settings: {
              theme: 'blue',
              soundEnabled: true
            }
          }
        },
        library: {
          categories: [
            {
              name: 'Morning',
              activities: [
                { text: 'Brush Teeth', icon: '🪥' }
              ]
            }
          ]
        },
        metadata: {
          version: '1.0.0',
          lastUpdated: Date.now()
        }
      };

      const encrypted = encryptionService.encryptData(complexData);
      const decrypted = encryptionService.decryptData(encrypted);

      expect(decrypted).toEqual(complexData);
      expect(decrypted.users.user1.activities).toHaveLength(2);
      expect(decrypted.library.categories[0].activities).toHaveLength(1);
    });

    test('should produce different ciphertexts for same data', () => {
      const testData = { message: 'Same data' };

      const encrypted1 = encryptionService.encryptData(testData);
      const encrypted2 = encryptionService.encryptData(testData);

      // Ciphertexts should be different due to random nonce
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same data
      expect(encryptionService.decryptData(encrypted1)).toEqual(testData);
      expect(encryptionService.decryptData(encrypted2)).toEqual(testData);
    });

    test('should handle large datasets efficiently', () => {
      // Create large dataset (similar to real app data)
      const largeData = {
        users: {},
        library: {
          categories: []
        }
      };

      // Add 50 users with 20 activities each
      for (let i = 0; i < 50; i++) {
        const activities = [];
        for (let j = 0; j < 20; j++) {
          activities.push({
            id: `activity-${i}-${j}`,
            text: `Activity ${j + 1} for User ${i + 1}`,
            icon: '🎯',
            completed: Math.random() > 0.5,
            timestamp: Date.now() - Math.random() * 86400000
          });
        }

        largeData.users[`user-${i}`] = {
          id: `user-${i}`,
          name: `User ${i + 1}`,
          icon: '👤',
          days: {
            today: { activities: activities.slice(0, 10) },
            tomorrow: { activities: activities.slice(10) }
          }
        };
      }

      // Add 20 categories with 10 activities each
      for (let i = 0; i < 20; i++) {
        const activities = [];
        for (let j = 0; j < 10; j++) {
          activities.push({
            id: `lib-activity-${i}-${j}`,
            text: `Library Activity ${j + 1} in Category ${i + 1}`,
            icon: '📚'
          });
        }

        largeData.library.categories.push({
          id: `category-${i}`,
          name: `Category ${i + 1}`,
          icon: '📁',
          activities
        });
      }

      const startTime = Date.now();
      const encrypted = encryptionService.encryptData(largeData);
      const encryptTime = Date.now() - startTime;

      const decryptStartTime = Date.now();
      const decrypted = encryptionService.decryptData(encrypted);
      const decryptTime = Date.now() - decryptStartTime;

      // Performance assertions
      expect(encryptTime).toBeLessThan(1000); // Should encrypt large data in < 1s
      expect(decryptTime).toBeLessThan(1000); // Should decrypt large data in < 1s

      // Data integrity
      expect(decrypted.users).toBeDefined();
      expect(Object.keys(decrypted.users)).toHaveLength(50);
      expect(decrypted.library.categories).toHaveLength(20);

      // Spot check some data
      expect(decrypted.users['user-0'].days.today.activities).toHaveLength(10);
      expect(decrypted.library.categories[0].activities).toHaveLength(10);
    });
  });

  describe('Error Handling and Security', () => {
    test('should fail to encrypt without initialization', () => {
      // Reset service to uninitialized state
      encryptionService.masterKey = null;

      expect(() => {
        encryptionService.encryptData({ test: 'data' });
      }).toThrow('Encryption not initialized');
    });

    test('should fail to decrypt with wrong key', async () => {
      // Initialize with first phrase and encrypt data
      const phrase1 = 'first-test-phrase';
      await encryptionService.initialize(phrase1, 'sync1');
      const encrypted = encryptionService.encryptData({ test: 'secret data' });

      // Reset and initialize with different phrase
      encryptionService.masterKey = null;
      encryptionService.syncId = null;

      const phrase2 = 'different-test-phrase';
      await encryptionService.initialize(phrase2, 'sync2');

      // Decryption should fail
      expect(() => {
        encryptionService.decryptData(encrypted);
      }).toThrow(/Decryption failed|invalid key|corrupted data/);
    });

    test('should handle corrupted data gracefully', async () => {
      const phrase = 'test-phrase-corruption';
      await encryptionService.initialize(phrase, 'sync-corruption');

      // Create valid encrypted data
      const validEncrypted = encryptionService.encryptData({ test: 'data' });

      // Corrupt the data
      const corruptedData = validEncrypted.slice(0, -10) + 'corrupted!!';

      expect(() => {
        encryptionService.decryptData(corruptedData);
      }).toThrow();
    });

    test('should handle invalid base64 data', async () => {
      const phrase = 'test-phrase-invalid';
      await encryptionService.initialize(phrase, 'sync-invalid');

      expect(() => {
        encryptionService.decryptData('invalid-base64-data!!');
      }).toThrow();
    });
  });

  describe('Persistence and Caching', () => {
    test('should cache derived keys for performance', async () => {
      const phrase = 'cache-test-phrase';
      const syncId = 'cache-sync-id';

      // First initialization should derive key
      const start1 = Date.now();
      await encryptionService.initialize(phrase, syncId);
      const time1 = Date.now() - start1;

      // Reset to simulate app restart
      encryptionService.masterKey = null;
      encryptionService.syncId = null;

      // Second initialization should use cached key (faster)
      const start2 = Date.now();
      await encryptionService.initialize(phrase, syncId);
      const time2 = Date.now() - start2;

      // Second initialization should be much faster due to caching
      expect(time2).toBeLessThan(time1 / 2);

      // Should still work correctly
      const testData = { cached: true };
      const encrypted = encryptionService.encryptData(testData);
      const decrypted = encryptionService.decryptData(encrypted);
      expect(decrypted).toEqual(testData);
    });

    test('should store recovery phrase securely', async () => {
      const phrase = 'secure-storage-phrase';
      const syncId = 'secure-sync-id';

      await encryptionService.initialize(phrase, syncId);

      // Verify phrase was stored
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        `@sync_phrase_${syncId}`,
        phrase
      );

      // Verify it was read back for verification
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        `@sync_phrase_${syncId}`
      );
    });
  });

  describe('Real-world Sync Scenarios', () => {
    test('should handle typical sync data structure', async () => {
      const phrase = 'sync-scenario-phrase';
      await encryptionService.initialize(phrase, 'sync-scenario');

      // Simulate real app sync data
      const syncData = {
        users: {
          'user-1': {
            id: 'user-1',
            name: 'Parent',
            icon: '👨',
            settings: {
              theme: 'stackBlue',
              celebration: 'rainbow',
              soundEnabled: true
            },
            days: {
              today: {
                activities: [
                  { id: 'act-1', text: 'Morning Exercise', icon: '🏃‍♂️', completed: true },
                  { id: 'act-2', text: 'Breakfast', icon: '🍳', completed: true },
                  { id: 'act-3', text: 'Work Meeting', icon: '💼', completed: false }
                ]
              },
              tomorrow: {
                activities: [
                  { id: 'act-4', text: 'Doctor Appointment', icon: '🏥', completed: false }
                ]
              }
            }
          }
        },
        library: {
          categories: [
            {
              id: 'morning',
              name: 'Morning Routine',
              icon: '☀️',
              activities: [
                { id: 'lib-1', text: 'Wake Up', icon: '⏰' },
                { id: 'lib-2', text: 'Brush Teeth', icon: '🪥' },
                { id: 'lib-3', text: 'Shower', icon: '🚿' }
              ]
            }
          ],
          userActivityIds: ['custom-1', 'custom-2']
        },
        settings: {
          currentTheme: 'stackBlue',
          hasCompletedOnboarding: true,
          syncEnabled: true
        },
        metadata: {
          version: '2025.09.14.6',
          lastSync: Date.now(),
          deviceId: 'test-device'
        }
      };

      const encrypted = encryptionService.encryptData(syncData);
      const decrypted = encryptionService.decryptData(encrypted);

      // Verify complete data integrity
      expect(decrypted).toEqual(syncData);
      expect(decrypted.users['user-1'].days.today.activities).toHaveLength(3);
      expect(decrypted.library.categories[0].activities).toHaveLength(3);
      expect(decrypted.settings.syncEnabled).toBe(true);
    });

    test('should handle empty or minimal data', async () => {
      const phrase = 'minimal-data-phrase';
      await encryptionService.initialize(phrase, 'minimal-sync');

      const minimalData = {
        users: {},
        library: { categories: [], userActivityIds: [] },
        settings: { hasCompletedOnboarding: false }
      };

      const encrypted = encryptionService.encryptData(minimalData);
      const decrypted = encryptionService.decryptData(encrypted);

      expect(decrypted).toEqual(minimalData);
      expect(Object.keys(decrypted.users)).toHaveLength(0);
      expect(decrypted.library.categories).toHaveLength(0);
    });
  });
});