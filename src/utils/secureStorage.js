import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

    // Store PIN securely
    const result = await Keychain.setInternetCredentials(
      PIN_SERVICE,
      PIN_USERNAME,
      pin
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
    // Get credentials using internet credentials (works on all platforms)
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
    // Try multiple approaches to ensure PIN is removed
    const attempts = [];
    
    // Attempt 1: Reset internet credentials
    attempts.push(
      Keychain.resetInternetCredentials(PIN_SERVICE)
        .then(() => console.log('Reset internet credentials: success'))
        .catch(e => console.log('Reset internet credentials failed:', e.message))
    );
    
    // Attempt 2: Set to DELETED marker
    attempts.push(
      Keychain.setInternetCredentials(PIN_SERVICE, PIN_USERNAME, 'DELETED')
        .then(() => console.log('Set DELETED marker: success'))
        .catch(e => console.log('Set DELETED marker failed:', e.message))
    );
    
    // Attempt 3: Set to empty string
    attempts.push(
      Keychain.setInternetCredentials(PIN_SERVICE, PIN_USERNAME, '')
        .then(() => console.log('Set empty string: success'))
        .catch(e => console.log('Set empty string failed:', e.message))
    );
    
    // Also store a flag in AsyncStorage to indicate PIN is disabled
    attempts.push(
      AsyncStorage.setItem('@stackmap_pin_disabled', 'true')
        .then(() => console.log('Set PIN disabled flag: success'))
        .catch(e => console.log('Set PIN disabled flag failed:', e.message))
    );
    
    // Wait for all attempts
    await Promise.allSettled(attempts);
    
    // Always return true - we've done our best to remove it
    // The hasSecurePin function will check both the keychain and the disabled flag
    return true;
  } catch (error) {
    console.error('Error in removeSecurePin:', error);
    // Even on error, try to set the disabled flag
    try {
      await AsyncStorage.setItem('@stackmap_pin_disabled', 'true');
    } catch (e) {
      console.error('Failed to set disabled flag:', e);
    }
    return true; // Return true anyway to update UI
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