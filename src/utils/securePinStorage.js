// @ts-check
import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a separate encrypted MMKV instance for PIN storage
// iOS 18.5 may have issues with MMKV encryption, so we handle it specially
let pinStorage = null;

// Initialize MMKV for native platforms
// iOS: Uses AsyncStorage (pinStorage = null) due to MMKV encryption issues on iOS 18.5
// Android: Uses MMKV with encryption
if (Platform.OS === 'android') {
  try {
    pinStorage = new MMKV({
      id: 'stackmap-pin-storage',
      encryptionKey: 'StackMap-PIN-2025-Secure-Key',
    });
  } catch (e) {
    pinStorage = null;
    // MMKV initialization failed, will fallback to AsyncStorage
  }
}

const PIN_KEY = 'secure_pin';
const PIN_DISABLED_KEY = 'pin_disabled';

/**
 * Securely store PIN using MMKV with encryption
 * Falls back to AsyncStorage if MMKV is not available
 * @param {string} pin - The PIN to store
 * @returns {Promise<boolean>} Success status
 */
export const setSecurePin = async pin => {
  try {
    if (!pin) {
      return await removeSecurePin();
    }

    // Ensure PIN is a string and trimmed
    const pinToStore = String(pin).trim();

    // Clear the disabled flag when setting a new PIN
    if (pinStorage) {
      pinStorage.delete(PIN_DISABLED_KEY);
    } else {
      await AsyncStorage.removeItem('@stackmap_pin_disabled');
    }

    // Store PIN
    if (pinStorage) {
      // Use MMKV with encryption (Android only now)
      pinStorage.set(PIN_KEY, pinToStore);
      return true;
    } else {
      // Fallback to AsyncStorage for iOS and web
      await AsyncStorage.setItem('@stackmap_pin', pinToStore);
      return true;
    }
  } catch (error) {
    return false;
  }
};

/**
 * Retrieve PIN from secure storage
 * @returns {Promise<string|null>} The stored PIN or null
 */
export const getSecurePin = async () => {
  try {
    // First check if PIN is disabled
    if (pinStorage) {
      const disabled = pinStorage.getString(PIN_DISABLED_KEY);
      if (disabled === 'true') {
        return null;
      }

      // Get PIN from MMKV (Android)
      const pin = pinStorage.getString(PIN_KEY);
      return pin || null;
    } else {
      // Fallback to AsyncStorage (iOS/Web)
      const disabled = await AsyncStorage.getItem('@stackmap_pin_disabled');
      if (disabled === 'true') {
        return null;
      }

      const pin = await AsyncStorage.getItem('@stackmap_pin');
      return pin || null;
    }
  } catch (error) {
    return null;
  }
};

/**
 * Remove PIN from secure storage
 * @returns {Promise<boolean>} Success status
 */
export const removeSecurePin = async () => {
  try {
    // Set the disabled flag to prevent any PIN checks
    if (pinStorage) {
      pinStorage.set(PIN_DISABLED_KEY, 'true');
      pinStorage.delete(PIN_KEY);
    } else {
      await AsyncStorage.setItem('@stackmap_pin_disabled', 'true');
      await AsyncStorage.removeItem('@stackmap_pin');
    }

    return true;
  } catch (error) {
    // Error removing PIN
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
    return pin !== null && pin !== '' && pin !== undefined && pin.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Verify if the provided PIN matches the stored PIN
 * @param {string} inputPin - PIN to verify
 * @returns {Promise<boolean>} Whether the PIN is correct
 */
export const verifyPin = async inputPin => {
  try {
    // Ensure input is a string and trimmed
    const cleanInput = String(inputPin || '').trim();

    const storedPin = await getSecurePin();

    if (!storedPin || storedPin === '') {
      return false;
    }

    // Clean stored PIN too
    const cleanStored = String(storedPin).trim();

    const match = cleanStored === cleanInput;

    return match;
  } catch (error) {
    return false;
  }
};

/**
 * Debug function to check PIN storage status on iOS
 * @returns {Promise<object>} Debug information about PIN storage
 */
export const debugPinStorage = async () => {
  const debugInfo = {
    platform: Platform.OS,
    usingMMKV: !!pinStorage,
    asyncStorageKeys: [],
    mmkvKeys: [],
    pinStatus: {},
  };

  try {
    // Check AsyncStorage
    const allKeys = await AsyncStorage.getAllKeys();
    debugInfo.asyncStorageKeys = allKeys.filter(
      key => key.includes('pin') || key.includes('PIN'),
    );

    // Get AsyncStorage PIN values
    const asyncPin = await AsyncStorage.getItem('@stackmap_pin');
    const asyncDisabled = await AsyncStorage.getItem('@stackmap_pin_disabled');

    debugInfo.pinStatus.asyncStorage = {
      hasPin: !!asyncPin,
      pinLength: asyncPin?.length || 0,
      isDisabled: asyncDisabled === 'true',
    };

    // Check MMKV if available
    if (pinStorage) {
      try {
        debugInfo.mmkvKeys = pinStorage.getAllKeys();
        const mmkvPin = pinStorage.getString(PIN_KEY);
        const mmkvDisabled = pinStorage.getString(PIN_DISABLED_KEY);

        debugInfo.pinStatus.mmkv = {
          hasPin: !!mmkvPin,
          pinLength: mmkvPin?.length || 0,
          isDisabled: mmkvDisabled === 'true',
        };
      } catch (e) {
        debugInfo.mmkvError = e.message;
      }
    }

    // Get the PIN using our getter
    const retrievedPin = await getSecurePin();
    debugInfo.pinStatus.retrieved = {
      hasPin: !!retrievedPin,
      pinLength: retrievedPin?.length || 0,
    };

    return debugInfo;
  } catch (error) {
    return debugInfo;
  }
};

/**
 * Migrate PIN from old storage to new secure storage
 * This should be run once on app startup
 */
export const migratePinToSecureStorage = async () => {
  try {
    // Check if migration already happened
    const migrationKey = '@stackmap_pin_migrated_mmkv';
    const migrated = await AsyncStorage.getItem(migrationKey);

    if (migrated === 'true') {
      return; // Already migrated
    }

    // Try to get PIN from old AsyncStorage location
    const oldPin = await AsyncStorage.getItem('@stackmap_pin');
    if (oldPin && pinStorage) {
      // Migrate to MMKV
      pinStorage.set(PIN_KEY, oldPin);
      await AsyncStorage.removeItem('@stackmap_pin');
      // PIN migrated to MMKV successfully
    }

    // Also check if there's a PIN in the old Zustand data
    const data = await AsyncStorage.getItem('@stackmap_data');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (parsedData.globalSettings?.editModePin) {
          // Store PIN securely
          await setSecurePin(parsedData.globalSettings.editModePin);

          // Remove PIN from AsyncStorage data
          delete parsedData.globalSettings.editModePin;
          await AsyncStorage.setItem(
            '@stackmap_data',
            JSON.stringify(parsedData),
          );

          // PIN migrated from Zustand data
        }
      } catch (e) {
        // Failed to parse old data
      }
    }

    // Mark migration as complete
    await AsyncStorage.setItem(migrationKey, 'true');
  } catch (error) {
    // Error migrating PIN
  }
};
