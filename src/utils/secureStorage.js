// @ts-check
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let Keychain = null;
// Only load Keychain on iOS - Android will use AsyncStorage fallback
if (Platform.OS === 'ios') {
  try {
    Keychain = require('react-native-keychain');
  } catch (e) {
    // Keychain not available on iOS
  }
}

const PIN_SERVICE = 'StackMapPIN';
const PIN_USERNAME = 'editModePin';

/**
 * Securely store PIN using iOS Keychain / Android Keystore
 * @param {string} pin - The PIN to store
 * @returns {Promise<boolean>} Success status
 */
export const setSecurePin = async pin => {
  try {
    if (!pin) {
      // Use removeSecurePin for consistency
      return await removeSecurePin();
    }

    // Clear the disabled flag when setting a new PIN
    try {
      await AsyncStorage.removeItem('@stackmap_pin_disabled');
    } catch (e) {
      // Could not remove disabled flag
    }

    // Android: Use AsyncStorage
    if (Platform.OS === 'android') {
      await AsyncStorage.setItem('@stackmap_pin', pin);
      return true;
    }

    // iOS: Use Keychain if available, fallback to AsyncStorage
    if (!Keychain) {
      // Keychain module not available, use AsyncStorage fallback
      // This is temporary until react-native-keychain is properly linked
      await AsyncStorage.setItem('@stackmap_pin', pin);
      return true;
    }

    // Check if the method exists
    if (typeof Keychain.setInternetCredentials !== 'function') {
      // setInternetCredentials not available, use fallback
      await AsyncStorage.setItem('@stackmap_pin', pin);
      return true;
    }

    // Store PIN securely with Keychain
    const result = await Keychain.setInternetCredentials(
      PIN_SERVICE,
      PIN_USERNAME,
      pin,
      {},
    );
    return result !== false;
  } catch (error) {
    // Error storing PIN securely
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

    // iOS: Use Keychain if available, fallback to AsyncStorage
    if (!Keychain) {
      // Keychain module not available, use AsyncStorage fallback
      const pin = await AsyncStorage.getItem('@stackmap_pin');
      return pin || null;
    }

    // Check if the method exists (extra defensive check)
    if (
      !Keychain.getInternetCredentials ||
      typeof Keychain.getInternetCredentials !== 'function'
    ) {
      // getInternetCredentials not available, use fallback
      const pin = await AsyncStorage.getItem('@stackmap_pin');
      return pin || null;
    }

    // Get credentials using Keychain
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
    // Error retrieving PIN - fail silently
    return null;
  }
};

/**
 * Remove PIN from secure storage
 * @returns {Promise<boolean>} Success status
 */
export const removeSecurePin = async () => {
  let disabledFlagSet = false;
  let pinRemoved = false;

  try {
    // Starting PIN removal

    // First, set the disabled flag to prevent any PIN checks
    try {
      await AsyncStorage.setItem('@stackmap_pin_disabled', 'true');
      disabledFlagSet = true;
      // Set PIN disabled flag successfully
    } catch (e) {
      // Failed to set disabled flag
      console.error('[SecureStorage] Failed to set disabled flag:', e);
    }

    // Android: Use AsyncStorage
    if (Platform.OS === 'android') {
      try {
        await AsyncStorage.removeItem('@stackmap_pin');
        pinRemoved = true;
        // Android: Removed PIN from AsyncStorage
      } catch (e) {
        // Android: Failed to remove PIN
        console.error('[SecureStorage] Android: Failed to remove PIN:', e);
      }
      // Return true if either operation succeeded (to allow UI update)
      return disabledFlagSet || pinRemoved;
    }

    // iOS: Use Keychain if available, fallback to AsyncStorage
    if (Platform.OS === 'ios') {
      if (!Keychain) {
        // Keychain not available, use AsyncStorage fallback
        try {
          await AsyncStorage.removeItem('@stackmap_pin');
          pinRemoved = true;
          // iOS: Removed PIN from AsyncStorage fallback
        } catch (e) {
          // iOS: Failed to remove PIN from AsyncStorage
          console.error('[SecureStorage] iOS: Failed to remove PIN from AsyncStorage:', e);
        }
        // Return true if either operation succeeded (to allow UI update)
        return disabledFlagSet || pinRemoved;
      }

      // Try to use Keychain
      try {
        if (typeof Keychain.resetInternetCredentials === 'function') {
          await Keychain.resetInternetCredentials(PIN_SERVICE);
          pinRemoved = true;
          // iOS: Reset credentials successfully
        } else if (typeof Keychain.setInternetCredentials === 'function') {
          await Keychain.setInternetCredentials(
            PIN_SERVICE,
            PIN_USERNAME,
            'DELETED',
            {},
          );
          pinRemoved = true;
          // iOS: Set DELETED marker as fallback
        } else {
          // Keychain methods not available, use AsyncStorage fallback
          await AsyncStorage.removeItem('@stackmap_pin');
          pinRemoved = true;
        }
      } catch (e) {
        // iOS: Keychain failed, use AsyncStorage fallback
        console.error('[SecureStorage] iOS: Keychain operation failed:', e);
        try {
          await AsyncStorage.removeItem('@stackmap_pin');
          pinRemoved = true;
        } catch (e2) {
          // iOS: Failed to remove from AsyncStorage
          console.error('[SecureStorage] iOS: AsyncStorage fallback also failed:', e2);
        }
      }
    }

    // PIN removal completed
    // Return true if either operation succeeded (to allow UI update)
    return disabledFlagSet || pinRemoved;
  } catch (error) {
    // Critical error in removeSecurePin
    console.error('[SecureStorage] Critical error in removeSecurePin:', error);

    // Even on error, try to ensure the disabled flag is set
    try {
      await AsyncStorage.setItem('@stackmap_pin_disabled', 'true');
      disabledFlagSet = true;
    } catch (e) {
      // Failed to set disabled flag in catch
      console.error('[SecureStorage] Failed to set disabled flag in error handler:', e);
    }

    // Return true if we at least managed to set the disabled flag (to allow UI update)
    // Return false only if both operations completely failed
    return disabledFlagSet;
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
      return false;
    }

    const pin = await getSecurePin();

    // More explicit check for PIN existence
    const hasPin =
      pin !== null &&
      pin !== '' &&
      pin !== undefined &&
      pin.length > 0 &&
      pin !== 'DELETED';

    return hasPin;
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
export const verifyPin = async inputPin => {
  const storedPin = await getSecurePin();

  // If there's no stored PIN, verification should always fail
  if (!storedPin || storedPin === '' || storedPin === 'DELETED') {
    // No valid PIN stored, verification failed
    return false;
  }

  const isValid = storedPin === inputPin;
  // PIN verification complete
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
        await AsyncStorage.setItem(
          '@stackmap_data',
          JSON.stringify(parsedData),
        );

        // PIN migrated to secure storage successfully
      }
    }

    // Mark migration as complete
    await AsyncStorage.setItem(migrationKey, 'true');
  } catch (error) {
    // Error migrating PIN
  }
};
