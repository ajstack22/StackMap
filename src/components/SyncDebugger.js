import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Clipboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SyncDebugger = ({ onClose }) => {
  const [results, setResults] = useState('');
  const [running, setRunning] = useState(false);

  const copyResults = () => {
    if (results) {
      Clipboard.setString(results);
      Alert.alert('Copied!', 'Debug results copied to clipboard');
    } else {
      Alert.alert('No Results', 'Run the debug test first');
    }
  };

  const clearSyncData = async () => {
    try {
      await AsyncStorage.removeItem('@minimal_sync_id');
      await AsyncStorage.removeItem('@sync_phrase');
      await AsyncStorage.removeItem('encryption_salt');
      await AsyncStorage.removeItem('device_id');
      
      // Clear all sync-related keys
      const keys = await AsyncStorage.getAllKeys();
      const syncKeys = keys.filter(key => 
        key.includes('sync') || 
        key.includes('derived_key') || 
        key.includes('encryption')
      );
      await AsyncStorage.multiRemove(syncKeys);
      
      Alert.alert('Success', 'Sync data cleared. You can now join a fresh sync.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear sync data: ' + error.message);
    }
  };

  const runComprehensiveTest = async () => {
    setRunning(true);
    const logs = [];
    const log = (msg) => {
      logs.push(msg);
      console.log(msg);
    };

    try {
      log('=== COMPREHENSIVE SYNC DEBUG ===\n');
      log(`Platform: ${require('react-native').Platform.OS}`);
      log(`Time: ${new Date().toISOString()}\n`);

      // Test 1: Check what encryption services are available
      log('--- Test 1: Available Modules ---');
      try {
        const encService = require('../services/sync/encryptionService').default;
        log('✅ encryptionService.ts available');
      } catch (e) {
        log('❌ encryptionService.ts error: ' + e.message);
      }

      try {
        const encFixed = require('../services/sync/encryptionServiceFixed').default;
        log('✅ encryptionServiceFixed.ts available');
      } catch (e) {
        log('❌ encryptionServiceFixed.ts error: ' + e.message);
      }

      // Test 2: Check tweetnacl-util behavior
      log('\n--- Test 2: tweetnacl-util ---');
      try {
        const util = require('tweetnacl-util');
        
        // Test Base64
        const testBytes = new Uint8Array([1, 2, 3, 4, 5]);
        const b64 = util.encodeBase64(testBytes);
        const decoded = util.decodeBase64(b64);
        log(`Base64: encode([1,2,3,4,5]) = ${b64}`);
        log(`Base64: decode result = [${Array.from(decoded)}]`);
        log(`Base64 works: ${decoded.every((v, i) => v === testBytes[i]) ? '✅' : '❌'}`);
        
        // Test UTF-8
        const testStr = 'Hello 👋';
        const utf8Bytes = util.encodeUTF8(testStr);
        log(`\nUTF-8: encode("${testStr}") returned type: ${typeof utf8Bytes}`);
        log(`UTF-8: bytes length: ${utf8Bytes ? utf8Bytes.length : 'null'}`);
        if (utf8Bytes) {
          log(`UTF-8: first 10 bytes: [${Array.from(utf8Bytes.slice(0, 10))}]`);
          
          // Check if it's all zeros
          const allZeros = Array.from(utf8Bytes).every(b => b === 0);
          log(`UTF-8: All zeros? ${allZeros ? '❌ YES (BUG!)' : '✅ NO'}`);
          
          try {
            const decodedStr = util.decodeUTF8(utf8Bytes);
            log(`UTF-8: decoded = "${decodedStr}"`);
            log(`UTF-8 works: ${decodedStr === testStr ? '✅' : '❌'}`);
          } catch (e) {
            log(`UTF-8 decode error: ${e.message}`);
          }
        }
      } catch (e) {
        log('tweetnacl-util error: ' + e.message);
      }

      // Test 3: Check TextEncoder/TextDecoder
      log('\n--- Test 3: Native TextEncoder ---');
      log(`typeof TextEncoder: ${typeof TextEncoder}`);
      log(`typeof TextDecoder: ${typeof TextDecoder}`);
      
      if (typeof TextEncoder !== 'undefined') {
        try {
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          const testStr = 'Test 123 🎉';
          const encoded = encoder.encode(testStr);
          const decoded = decoder.decode(encoded);
          log(`TextEncoder works: ${decoded === testStr ? '✅' : '❌'}`);
        } catch (e) {
          log(`TextEncoder error: ${e.message}`);
        }
      }

      // Test 4: Check what sync data exists
      log('\n--- Test 4: Stored Sync Data ---');
      try {
        const syncId = await AsyncStorage.getItem('@minimal_sync_id');
        const phrase = await AsyncStorage.getItem('@sync_phrase');
        const salt = await AsyncStorage.getItem('encryption_salt');
        const deviceId = await AsyncStorage.getItem('device_id');
        
        log(`Sync ID: ${syncId ? syncId.substring(0, 8) + '...' : 'null'}`);
        log(`Recovery phrase: ${phrase ? 'exists (' + phrase.length + ' chars)' : 'null'}`);
        log(`Salt: ${salt ? salt.substring(0, 10) + '...' : 'null'}`);
        log(`Device ID: ${deviceId ? deviceId.substring(0, 8) + '...' : 'null'}`);
      } catch (e) {
        log('AsyncStorage error: ' + e.message);
      }

      // Test 5: Try actual decryption with sample data
      log('\n--- Test 5: Decryption Test ---');
      try {
        const encFixed = require('../services/sync/encryptionServiceFixed').default;
        
        // Initialize with test key
        encFixed.masterKey = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          encFixed.masterKey[i] = i;
        }
        
        // Try to encrypt and decrypt
        const testData = { test: 'data', num: 123 };
        log(`Test data: ${JSON.stringify(testData)}`);
        
        const encrypted = encFixed.encryptData(testData);
        log(`Encrypted length: ${encrypted.length}`);
        
        const decrypted = encFixed.decryptData(encrypted);
        log(`Decrypted: ${JSON.stringify(decrypted)}`);
        log(`Encryption works: ${JSON.stringify(decrypted) === JSON.stringify(testData) ? '✅' : '❌'}`);
      } catch (e) {
        log(`Encryption test error: ${e.message}`);
        log(`Stack: ${e.stack}`);
      }

      // Test 6: Sync ID Generation Test
      log('\n--- Test 6: Sync ID Generation ---');
      if (recoveryPhrase) {
        try {
          const minimalSync = require('../services/sync/minimalSyncService').default;
          const testPhrase = '45530ecc83f2d5c304f041e37906e3b0';
          const generatedId = await minimalSync.generateSyncId(testPhrase);
          log(`Test phrase: ${testPhrase}`);
          log(`Generated sync ID: ${generatedId}`);
          log(`Expected sync ID should be consistent across platforms`);
        } catch (e) {
          log(`Sync ID generation error: ${e.message}`);
        }
      }
      
      // Test 7: Network test - try to fetch actual sync data
      log('\n--- Test 7: Network Fetch ---');
      try {
        const syncId = await AsyncStorage.getItem('@minimal_sync_id');
        if (syncId) {
          const response = await fetch(
            `https://stackmap.app/qual/api/sync/pull_timestamp.php?sync_id=${syncId}&device_id=test&since=0`
          );
          const data = await response.json();
          log(`Server response: ${data.success ? '✅ success' : '❌ failed'}`);
          if (data.records && data.records.length > 0) {
            log(`Records found: ${data.records.length}`);
            const latest = data.records[data.records.length - 1];
            log(`Latest record timestamp: ${new Date(latest.timestamp).toISOString()}`);
            log(`Encrypted blob length: ${latest.encrypted_blob ? latest.encrypted_blob.length : 'null'}`);
            
            // Try to decode just the base64
            if (latest.encrypted_blob) {
              try {
                const util = require('tweetnacl-util');
                const decoded = util.decodeBase64(latest.encrypted_blob);
                log(`Base64 decode successful, bytes: ${decoded.length}`);
                
                // Check structure
                log(`First 4 bytes (should be nonce): [${Array.from(decoded.slice(0, 4))}]`);
              } catch (e) {
                log(`Base64 decode failed: ${e.message}`);
              }
            }
          }
        } else {
          log('No sync ID found');
        }
      } catch (e) {
        log(`Network error: ${e.message}`);
      }

      // Test 8: Manual UTF-8 implementation
      log('\n--- Test 8: Manual UTF-8 ---');
      try {
        // Manual UTF-8 encode
        const manualEncodeUTF8 = (str) => {
          const bytes = [];
          for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            if (char < 0x80) {
              bytes.push(char);
            } else if (char < 0x800) {
              bytes.push(0xc0 | (char >> 6));
              bytes.push(0x80 | (char & 0x3f));
            } else if (char < 0xd800 || char >= 0xe000) {
              bytes.push(0xe0 | (char >> 12));
              bytes.push(0x80 | ((char >> 6) & 0x3f));
              bytes.push(0x80 | (char & 0x3f));
            }
          }
          return new Uint8Array(bytes);
        };

        const testStr = 'Test 🎉';
        const encoded = manualEncodeUTF8(testStr);
        log(`Manual UTF-8 encode("${testStr}") = [${Array.from(encoded)}]`);
        log(`Length: ${encoded.length} bytes`);
      } catch (e) {
        log(`Manual UTF-8 error: ${e.message}`);
      }

      log('\n=== END OF DEBUG ===');
    } catch (error) {
      log(`\nFATAL ERROR: ${error.message}`);
      log(`Stack: ${error.stack}`);
    }

    setResults(logs.join('\n'));
    setRunning(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync Debugger</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, running && styles.buttonDisabled]} 
          onPress={runComprehensiveTest}
          disabled={running}
        >
          <Text style={styles.buttonText}>
            {running ? 'Running Tests...' : 'Run Debug'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.clearButton]} 
          onPress={clearSyncData}
        >
          <Text style={styles.buttonText}>
            Clear Sync Data
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.results}>
        <Text style={styles.resultsText}>{results || 'Press button to start debugging'}</Text>
      </ScrollView>
      
      {results && (
        <TouchableOpacity 
          style={styles.copyButton}
          onPress={copyResults}
        >
          <Text style={styles.copyButtonText}>Copy Results</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 10,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
    padding: 15,
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
  },
  resultsText: {
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 18,
  },
  copyButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    margin: 20,
    marginTop: 0,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SyncDebugger;