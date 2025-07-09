import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      console.log('setSecurePin: Removing PIN');
      // Remove PIN - call reset first for web compatibility
      try {
        console.log('setSecurePin: Calling resetInternetCredentials');
        await Keychain.resetInternetCredentials(PIN_SERVICE);
        console.log('setSecurePin: resetInternetCredentials success');
      } catch (resetError) {
        console.log('setSecurePin: resetInternetCredentials failed:', resetError);
        // If reset fails, try to overwrite with empty string
        try {
          console.log('setSecurePin: Trying setInternetCredentials with empty string');
          await Keychain.setInternetCredentials(
            PIN_SERVICE,
            PIN_USERNAME,
            ''
          );
          console.log('setSecurePin: setInternetCredentials with empty string success');
        } catch (e) {
          console.log('Could not clear PIN credentials:', e);
        }
      }
      return true;
    }

    // Store PIN securely
    const result = await Keychain.setInternetCredentials(
      PIN_SERVICE,
      PIN_USERNAME,
      pin
    );
    return result;
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
    console.log('getSecurePin: Getting credentials for', PIN_SERVICE);
    const credentials = await Keychain.getInternetCredentials(PIN_SERVICE);
    console.log('getSecurePin: credentials:', credentials);
    if (credentials) {
      console.log('getSecurePin: returning password:', credentials.password);
      return credentials.password;
    }
    console.log('getSecurePin: no credentials, returning null');
    return null;
  } catch (error) {
    console.error('Error retrieving PIN:', error);
    return null;
  }
};

/**
 * Check if a PIN is set
 * @returns {Promise<boolean>} Whether a PIN exists
 */
export const hasSecurePin = async () => {
  const pin = await getSecurePin();
  return pin !== null && pin !== '';
};

/**
 * Verify if the provided PIN matches the stored PIN
 * @param {string} inputPin - PIN to verify
 * @returns {Promise<boolean>} Whether the PIN is correct
 */
export const verifyPin = async (inputPin) => {
  const storedPin = await getSecurePin();
  return storedPin === inputPin;
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
        
        console.log('PIN migrated to secure storage successfully');
      }
    }

    // Mark migration as complete
    await AsyncStorage.setItem(migrationKey, 'true');
  } catch (error) {
    console.error('Error migrating PIN:', error);
  }
};