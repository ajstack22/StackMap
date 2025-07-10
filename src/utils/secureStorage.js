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
    // Getting credentials for PIN_SERVICE
    const credentials = await Keychain.getInternetCredentials(PIN_SERVICE);
    // Retrieved credentials
    if (credentials) {
      // Returning stored PIN
      return credentials.password;
    }
    // No credentials found
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
    let removed = false;
    
    // Approach 1: Use resetInternetCredentials
    try {
      const resetResult = await Keychain.resetInternetCredentials(PIN_SERVICE);
      if (resetResult !== false) {
        removed = true;
      }
    } catch (error) {
      console.warn('resetInternetCredentials failed:', error);
    }
    
    // Approach 2: Overwrite with empty credentials
    if (!removed) {
      try {
        const setResult = await Keychain.setInternetCredentials(
          PIN_SERVICE,
          PIN_USERNAME,
          ''
        );
        if (setResult !== false) {
          removed = true;
        }
      } catch (error) {
        console.warn('setInternetCredentials with empty string failed:', error);
      }
    }
    
    // Approach 3: For iOS specifically, try removing with different variations
    if (!removed && Platform.OS === 'ios') {
      try {
        // Some iOS versions might need explicit null
        await Keychain.setInternetCredentials(PIN_SERVICE, PIN_USERNAME, null);
        removed = true;
      } catch (error) {
        console.warn('setInternetCredentials with null failed:', error);
      }
    }
    
    // Final verification
    try {
      const credentials = await Keychain.getInternetCredentials(PIN_SERVICE);
      if (!credentials || !credentials.password || credentials.password === '') {
        return true;
      } else {
        console.error('PIN still exists after all removal attempts');
        return false;
      }
    } catch (error) {
      // If we can't retrieve credentials, assume they don't exist
      return true;
    }
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
        
        // PIN migrated to secure storage successfully
      }
    }

    // Mark migration as complete
    await AsyncStorage.setItem(migrationKey, 'true');
  } catch (error) {
    console.error('Error migrating PIN:', error);
  }
};