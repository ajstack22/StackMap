// PIN Debug Helper - Run this in your app to check PIN status

import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const debugPINStatus = async () => {
  console.log('===== PIN DEBUG START =====');
  console.log('Platform:', Platform.OS);
  
  // Check MMKV
  try {
    if (Platform.OS !== 'web') {
      const pinStorage = new MMKV({
        id: Platform.OS === 'ios' ? 'stackmap-pin-storage-ios' : 'stackmap-pin-storage'
      });
      
      console.log('MMKV Initialized: YES');
      
      // Check for PIN in MMKV
      const mmkvPin = pinStorage.getString('secure_pin');
      const mmkvDisabled = pinStorage.getString('pin_disabled');
      
      console.log('MMKV PIN exists:', !!mmkvPin);
      console.log('MMKV PIN value:', mmkvPin);
      console.log('MMKV PIN disabled:', mmkvDisabled);
      
      // List all MMKV keys
      const allKeys = pinStorage.getAllKeys();
      console.log('All MMKV keys:', allKeys);
    }
  } catch (e) {
    console.log('MMKV Error:', e.message);
  }
  
  // Check AsyncStorage
  try {
    const asyncPin = await AsyncStorage.getItem('@stackmap_pin');
    const asyncDisabled = await AsyncStorage.getItem('@stackmap_pin_disabled');
    
    console.log('AsyncStorage PIN exists:', !!asyncPin);
    console.log('AsyncStorage PIN value:', asyncPin);
    console.log('AsyncStorage PIN disabled:', asyncDisabled);
    
    // Get all AsyncStorage keys
    const allAsyncKeys = await AsyncStorage.getAllKeys();
    const pinRelatedKeys = allAsyncKeys.filter(key => key.includes('pin') || key.includes('PIN'));
    console.log('PIN-related AsyncStorage keys:', pinRelatedKeys);
  } catch (e) {
    console.log('AsyncStorage Error:', e.message);
  }
  
  console.log('===== PIN DEBUG END =====');
};

// Call this function when needed
// debugPINStatus();