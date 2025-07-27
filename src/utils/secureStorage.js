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
      // Removing PIN
      let removed = false;
      
      // Try resetInternetCredentials first
      try {
        // Calling resetInternetCredentials
        const resetResult = await Keychain.resetInternetCredentials(PIN_SERVICE);
        // resetInternetCredentials result
        removed = resetResult !== false;
      } catch (resetError) {
        console.warn('resetInternetCredentials failed:', resetError);
        // resetInternetCredentials failed
      }
      
      // If reset didn't work, try to overwrite with empty string
      if (!removed) {
        try {
          // Trying setInternetCredentials with empty string
          const setResult = await Keychain.setInternetCredentials(
            PIN_SERVICE,
            PIN_USERNAME,
            ''
          );
          // setInternetCredentials with empty string result
          removed = setResult !== false;
        } catch (setError) {
          console.error('Could not clear PIN credentials:', setError);
          return false;
        }
      }
      
      // Verify PIN was actually removed
      try {
        const credentials = await Keychain.getInternetCredentials(PIN_SERVICE);
        if (credentials && credentials.password && credentials.password !== '') {
          console.error('PIN still exists after removal attempt');
          return false;
        }
      } catch (verifyError) {
        // If we can't get credentials, assume they were removed
        console.log('Credentials removed successfully');
      }
      
      return removed;
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
    let success = false;
    
    // First, try to reset the credentials
    try {
      const resetResult = await Keychain.resetInternetCredentials(PIN_SERVICE);
      console.log('Reset internet credentials result:', resetResult);
      success = true;
    } catch (resetError) {
      console.log('Reset failed, trying alternative methods:', resetError.message);
    }
    
    // For all platforms, also try to overwrite with a special marker
    try {
      // Use a special marker that we'll recognize as "deleted"
      await Keychain.setInternetCredentials(PIN_SERVICE, PIN_USERNAME, 'DELETED');
      success = true;
    } catch (setError) {
      console.log('Failed to set deletion marker:', setError.message);
    }
    
    // Verify removal
    try {
      const check = await Keychain.getInternetCredentials(PIN_SERVICE);
      if (check && check.password && check.password !== 'DELETED' && check.password !== '') {
        console.warn('PIN still exists after removal attempts:', check.password?.length, 'chars');
        // One final attempt - overwrite with empty
        try {
          await Keychain.setInternetCredentials(PIN_SERVICE, PIN_USERNAME, '');
          success = true;
        } catch (e) {
          console.error('Final removal attempt failed:', e);
        }
      } else {
        success = true;
      }
    } catch (checkError) {
      // If we can't get credentials, consider them removed
      console.log('Cannot retrieve credentials, considering them removed');
      success = true;
    }
    
    return success;
  } catch (error) {
    console.error('Error removing PIN:', error);
    return false;
  }
};

/**
 * Check if a PIN is set
 * @returns {Promise<boolean>} Whether a PIN exists
 */
export const hasSecurePin = async () => {
  try {
    const pin = await getSecurePin();
    // More explicit check for PIN existence
    return pin !== null && pin !== '' && pin !== undefined && pin.length > 0;
  } catch (error) {
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
        
        // PIN migrated to secure storage successfully
      }
    }

    // Mark migration as complete
    await AsyncStorage.setItem(migrationKey, 'true');
  } catch (error) {
    console.error('Error migrating PIN:', error);
  }
};