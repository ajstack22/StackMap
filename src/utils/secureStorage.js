import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let Keychain = null;
// Only load Keychain on iOS - Android will use AsyncStorage fallback
if (Platform.OS === 'ios') {
  try {
    Keychain = require('react-native-keychain');
  } catch (e) {
    console.log('[SecureStorage] react-native-keychain not available on iOS');
  }
}

const PIN_SERVICE = 'StackMapPIN';
const PIN_USERNAME = 'editModePin';

/**
 * Securely store PIN using iOS Keychain / Android Keystore
 * @param {string} pin - The PIN to store
 * @returns {Promise<boolean>} Success status
 */
export const setSecurePin = async (pin) => {
  try {
    if (!pin) {
      // Use removeSecurePin for consistency
      return await removeSecurePin();
    }

    // Clear the disabled flag when setting a new PIN
    try {
      await AsyncStorage.removeItem('@stackmap_pin_disabled');
    } catch (e) {
      console.log('Could not remove disabled flag:', e);
    }

    // Android: Use AsyncStorage
    if (Platform.OS === 'android') {
      await AsyncStorage.setItem('@stackmap_pin', pin);
      return true;
    }

    // iOS: Use Keychain
    if (!Keychain) {
      console.log('[SecureStorage] Keychain module not available');
      return false;
    }
    
    // Check if the method exists
    if (typeof Keychain.setInternetCredentials !== 'function') {
      console.log('[SecureStorage] setInternetCredentials not available');
      return false;
    }

    // Store PIN securely
    const result = await Keychain.setInternetCredentials(
      PIN_SERVICE,
      PIN_USERNAME,
      pin,
      {}
    );
    return result !== false;
  } catch (error) {
    console.error('Error storing PIN securely:', error);
    return false;
  }
};

/**
 * Retrieve PIN from secure storage
 * @returns {Promise<string|null>} The stored PIN or null
 */
export const getSecurePin = async () => {
  try {
    // Android: Use AsyncStorage as fallback
    if (Platform.OS === 'android') {
      const pin = await AsyncStorage.getItem('@stackmap_pin');
      return pin || null;
    }
    
    // iOS: Use Keychain
    if (!Keychain) {
      console.log('[SecureStorage] Keychain module not available');
      return null;
    }
    
    // Check if the method exists
    if (typeof Keychain.getInternetCredentials !== 'function') {
      console.log('[SecureStorage] getInternetCredentials not available');
      return null;
    }
    
    // Get credentials using internet credentials
    const credentials = await Keychain.getInternetCredentials(PIN_SERVICE);
    
    if (credentials && credentials.password) {
      // Check for our deletion marker or empty string
      if (credentials.password === 'DELETED' || credentials.password === '') {
        return null;
      }
      // Return the actual PIN
      return credentials.password;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving PIN:', error);
    return null;
  }
};

/**
 * Remove PIN from secure storage
 * @returns {Promise<boolean>} Success status
 */
export const removeSecurePin = async () => {
  try {
    console.log('[SecureStorage] Starting PIN removal for platform:', Platform.OS);
    
    // First, set the disabled flag to prevent any PIN checks
    try {
      await AsyncStorage.setItem('@stackmap_pin_disabled', 'true');
      console.log('[SecureStorage] Set PIN disabled flag successfully');
    } catch (e) {
      console.error('[SecureStorage] Failed to set disabled flag:', e);
    }
    
    // Android: Use AsyncStorage
    if (Platform.OS === 'android') {
      try {
        await AsyncStorage.removeItem('@stackmap_pin');
        console.log('[SecureStorage] Android: Removed PIN from AsyncStorage');
      } catch (e) {
        console.log('[SecureStorage] Android: Failed to remove PIN:', e.message);
      }
      return true;
    }
    
    // iOS: Use Keychain (iOS developer will handle)
    if (!Keychain) {
      console.log('[SecureStorage] Keychain not available on this platform');
      return true; // Return true since we set the disabled flag
    }
    
    if (Platform.OS === 'ios') {
      // iOS - try reset first, then fallback to DELETED
      try {
        if (Keychain && typeof Keychain.resetInternetCredentials === 'function') {
          await Keychain.resetInternetCredentials(PIN_SERVICE);
          console.log('[SecureStorage] iOS: Reset credentials successfully');
        } else if (Keychain && typeof Keychain.setInternetCredentials === 'function') {
          await Keychain.setInternetCredentials(PIN_SERVICE, PIN_USERNAME, 'DELETED', {});
          console.log('[SecureStorage] iOS: Set DELETED marker as fallback');
        }
      } catch (e) {
        console.log('[SecureStorage] iOS: Reset failed, trying DELETED marker:', e.message);
        try {
          if (Keychain && typeof Keychain.setInternetCredentials === 'function') {
            await Keychain.setInternetCredentials(PIN_SERVICE, PIN_USERNAME, 'DELETED', {});
            console.log('[SecureStorage] iOS: Set DELETED marker successfully');
          }
        } catch (e2) {
          console.log('[SecureStorage] iOS: Failed to set DELETED marker:', e2.message);
        }
      }
    }
    
    console.log('[SecureStorage] PIN removal completed');
    return true;
  } catch (error) {
    console.error('[SecureStorage] Critical error in removeSecurePin:', error);
    // Even on error, ensure the disabled flag is set
    try {
      await AsyncStorage.setItem('@stackmap_pin_disabled', 'true');
    } catch (e) {
      console.error('[SecureStorage] Failed to set disabled flag in catch:', e);
    }
    return true; // Return true to allow UI update
  }
};

/**
 * Check if a PIN is set
 * @returns {Promise<boolean>} Whether a PIN exists
 */
export const hasSecurePin = async () => {
  try {
    // First check if PIN is disabled
    const disabled = await AsyncStorage.getItem('@stackmap_pin_disabled');
    if (disabled === 'true') {
      console.log('[SecureStorage] PIN is disabled via flag');
      return false;
    }
    
    const pin = await getSecurePin();
    console.log('[SecureStorage] Retrieved PIN:', pin ? `exists (length: ${pin.length})` : 'null/empty');
    
    // More explicit check for PIN existence
    const hasPin = pin !== null && pin !== '' && pin !== undefined && pin.length > 0 && pin !== 'DELETED';
    console.log('[SecureStorage] hasSecurePin result:', hasPin);
    
    return hasPin;
  } catch (error) {
    console.error('[SecureStorage] Error in hasSecurePin:', error);
    // If there's an error getting the PIN, assume it doesn't exist
    return false;
  }
};

/**
 * Verify if the provided PIN matches the stored PIN
 * @param {string} inputPin - PIN to verify
 * @returns {Promise<boolean>} Whether the PIN is correct
 */
export const verifyPin = async (inputPin) => {
  const storedPin = await getSecurePin();
  
  // If there's no stored PIN, verification should always fail
  if (!storedPin || storedPin === '' || storedPin === 'DELETED') {
    console.log('[SecureStorage] No valid PIN stored, verification failed');
    return false;
  }
  
  const isValid = storedPin === inputPin;
  console.log('[SecureStorage] PIN verification:', isValid ? 'success' : 'failed');
  return isValid;
};

/**
 * Migrate PIN from AsyncStorage to secure storage
 * This should be run once on app startup
 */
export const migratePinToSecureStorage = async () => {
  try {
    // Check if migration already happened
    const migrationKey = '@stackmap_pin_migrated';
    const migrated = await AsyncStorage.getItem(migrationKey);
    
    if (migrated === 'true') {
      return; // Already migrated
    }

    // Load existing data from AsyncStorage
    const data = await AsyncStorage.getItem('@stackmap_data');
    if (data) {
      const parsedData = JSON.parse(data);
      
      // Check if there's a PIN in the old format
      if (parsedData.globalSettings?.editModePin) {
        // Store PIN securely
        await setSecurePin(parsedData.globalSettings.editModePin);
        
        // Remove PIN from AsyncStorage data
        delete parsedData.globalSettings.editModePin;
        await AsyncStorage.setItem('@stackmap_data', JSON.stringify(parsedData));
        
        // PIN migrated to secure storage successfully
      }
    }

    // Mark migration as complete
    await AsyncStorage.setItem(migrationKey, 'true');
  } catch (error) {
    console.error('Error migrating PIN:', error);
  }
};