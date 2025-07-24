import encryptionService from '../encryptionService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

describe('EncryptionService', () => {
  beforeEach(async () => {
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
    await encryptionService.initialize(phrase, 'test-sync-id');
    
    const testData = {
      activities: ['activity1', 'activity2'],
      categories: ['category1'],
      timestamp: Date.now()
    };
    
    const encrypted = encryptionService.encryptData(testData);
    expect(encrypted).toBeTruthy();
    expect(typeof encrypted).toBe('string');
    
    const decrypted = encryptionService.decryptData(encrypted);
    expect(decrypted).toEqual(testData);
  });

  test('different encryptions produce different ciphertexts', async () => {
    const phrase = encryptionService.generateRecoveryPhrase();
    await encryptionService.initialize(phrase, 'test-sync-id');
    
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
    await encryptionService.initialize(phrase1, 'sync1');
    const encrypted = encryptionService.encryptData({ test: 'data' });
    
    // Try to decrypt with different phrase
    const phrase2 = encryptionService.generateRecoveryPhrase();
    await encryptionService.initialize(phrase2, 'sync2');
    
    expect(() => {
      encryptionService.decryptData(encrypted);
    }).toThrow('Decryption failed');
  });

  test('handles large data sets', async () => {
    const phrase = encryptionService.generateRecoveryPhrase();
    await encryptionService.initialize(phrase, 'test-sync-id');
    
    // Create large dataset
    const largeData = {
      activities: Array(1000).fill(null).map((_, i) => ({
        id: `activity-${i}`,
        name: `Activity ${i}`,
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
      }))
    };
    
    const encrypted = encryptionService.encryptData(largeData);
    const decrypted = encryptionService.decryptData(encrypted);
    
    expect(decrypted).toEqual(largeData);
  });
});