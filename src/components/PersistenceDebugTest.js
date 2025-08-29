import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PersistenceDebugTest() {
  const [logs, setLogs] = useState([]);
  const [storageData, setStorageData] = useState({});

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[PersistenceDebug] ${message}`);
  };

  // Test 1: Write test data to AsyncStorage
  const writeTestData = async () => {
    addLog('Writing test data to AsyncStorage...', 'info');
    
    const testData = {
      test: 'persistence',
      timestamp: Date.now(),
      random: Math.random(),
      message: 'This should persist after refresh'
    };
    
    try {
      // Write to multiple keys to test different patterns
      await AsyncStorage.setItem('@test_direct', JSON.stringify(testData));
      await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify({
        syncId: 'test-sync-id',
        timestamp: Date.now(),
        data: { activities: ['Test 1', 'Test 2', 'Test 3'] }
      }));
      await AsyncStorage.setItem('@sync_timestamp', Date.now().toString());
      
      addLog('✅ Data written successfully', 'success');
      await readAllData();
    } catch (error) {
      addLog(`❌ Write failed: ${error.message}`, 'error');
    }
  };

  // Test 2: Read all AsyncStorage data
  const readAllData = async () => {
    addLog('Reading all AsyncStorage data...', 'info');
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      addLog(`Found ${keys.length} keys in AsyncStorage`, 'info');
      
      const data = {};
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          data[key] = value;
          
          // Try to parse JSON values
          try {
            const parsed = JSON.parse(value);
            data[key] = parsed;
          } catch {
            // Keep as string if not JSON
          }
        } catch (error) {
          data[key] = `Error: ${error.message}`;
        }
      }
      
      setStorageData(data);
      addLog('✅ Data read successfully', 'success');
      
      // Check specific keys
      if (data['@test_direct']) {
        addLog('✅ @test_direct persisted!', 'success');
      } else {
        addLog('❌ @test_direct NOT found!', 'error');
      }
      
      if (data['@minimal_sync_data']) {
        addLog('✅ @minimal_sync_data persisted!', 'success');
      } else {
        addLog('❌ @minimal_sync_data NOT found!', 'error');
      }
      
      if (data['@sync_timestamp']) {
        addLog(`✅ @sync_timestamp persisted: ${data['@sync_timestamp']}`, 'success');
      } else {
        addLog('❌ @sync_timestamp NOT found!', 'error');
      }
      
    } catch (error) {
      addLog(`❌ Read failed: ${error.message}`, 'error');
    }
  };

  // Test 3: Clear specific keys
  const clearTestData = async () => {
    addLog('Clearing test data...', 'info');
    
    try {
      await AsyncStorage.multiRemove([
        '@test_direct',
        '@minimal_sync_data',
        '@sync_timestamp'
      ]);
      
      addLog('✅ Test data cleared', 'success');
      await readAllData();
    } catch (error) {
      addLog(`❌ Clear failed: ${error.message}`, 'error');
    }
  };

  // Test 4: Check localStorage vs AsyncStorage
  const compareStorages = async () => {
    addLog('Comparing localStorage vs AsyncStorage...', 'info');
    
    // Check localStorage
    const localStorageKeys = Object.keys(localStorage);
    addLog(`localStorage has ${localStorageKeys.length} keys`, 'info');
    
    // Check AsyncStorage
    const asyncKeys = await AsyncStorage.getAllKeys();
    addLog(`AsyncStorage has ${asyncKeys.length} keys`, 'info');
    
    // Find keys in both
    const inBoth = asyncKeys.filter(key => localStorageKeys.includes(key));
    if (inBoth.length > 0) {
      addLog(`Keys in both: ${inBoth.join(', ')}`, 'warning');
    }
    
    // Find keys only in AsyncStorage
    const onlyAsync = asyncKeys.filter(key => !localStorageKeys.includes(key));
    if (onlyAsync.length > 0) {
      addLog(`Only in AsyncStorage: ${onlyAsync.join(', ')}`, 'info');
    }
    
    // Find keys only in localStorage
    const onlyLocal = localStorageKeys.filter(key => !asyncKeys.includes(key));
    if (onlyLocal.length > 0) {
      addLog(`Only in localStorage: ${onlyLocal.join(', ')}`, 'info');
    }
  };

  // Test 5: Write with immediate verification
  const writeAndVerify = async () => {
    addLog('Write and immediately verify...', 'info');
    
    const testKey = '@immediate_test';
    const testValue = { test: 'immediate', timestamp: Date.now() };
    
    // Write
    await AsyncStorage.setItem(testKey, JSON.stringify(testValue));
    addLog('Data written', 'info');
    
    // Immediately read back
    const readBack = await AsyncStorage.getItem(testKey);
    if (readBack) {
      const parsed = JSON.parse(readBack);
      if (parsed.test === 'immediate') {
        addLog('✅ Immediate verification successful!', 'success');
      } else {
        addLog('❌ Data corrupted!', 'error');
      }
    } else {
      addLog('❌ Data not found immediately after write!', 'error');
    }
    
    // Wait 100ms and check again
    setTimeout(async () => {
      const readAgain = await AsyncStorage.getItem(testKey);
      if (readAgain) {
        addLog('✅ Data still present after 100ms', 'success');
      } else {
        addLog('❌ Data lost after 100ms!', 'error');
      }
    }, 100);
  };

  // Load data on mount
  useEffect(() => {
    addLog('Component mounted, checking persistence...', 'info');
    readAllData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔍 AsyncStorage Persistence Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Actions</Text>
        
        <TouchableOpacity style={styles.button} onPress={writeTestData}>
          <Text style={styles.buttonText}>1. Write Test Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.readButton]} onPress={readAllData}>
          <Text style={styles.buttonText}>2. Read All Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.verifyButton]} onPress={writeAndVerify}>
          <Text style={styles.buttonText}>3. Write & Verify</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.compareButton]} onPress={compareStorages}>
          <Text style={styles.buttonText}>4. Compare Storages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearTestData}>
          <Text style={styles.buttonText}>5. Clear Test Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={() => window.location.reload()}
        >
          <Text style={styles.buttonText}>🔄 REFRESH PAGE</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Storage Data</Text>
        <ScrollView style={styles.dataContainer}>
          <Text style={styles.dataText}>
            {JSON.stringify(storageData, null, 2)}
          </Text>
        </ScrollView>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Logs</Text>
        <ScrollView style={styles.logsContainer}>
          {logs.map((log, i) => (
            <Text 
              key={i} 
              style={[
                styles.log,
                log.type === 'error' && styles.errorLog,
                log.type === 'success' && styles.successLog,
                log.type === 'warning' && styles.warningLog,
                log.type === 'info' && styles.infoLog
              ]}
            >
              [{log.timestamp}] {log.message}
            </Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 12,
    borderRadius: 6,
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  readButton: {
    backgroundColor: '#28a745',
  },
  verifyButton: {
    backgroundColor: '#6f42c1',
  },
  compareButton: {
    backgroundColor: '#fd7e14',
  },
  clearButton: {
    backgroundColor: '#dc3545',
  },
  refreshButton: {
    backgroundColor: '#17a2b8',
    marginTop: 10,
  },
  dataContainer: {
    maxHeight: 200,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
  },
  dataText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
  logsContainer: {
    maxHeight: 250,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
  },
  log: {
    fontSize: 12,
    marginVertical: 2,
    fontFamily: 'monospace',
  },
  errorLog: {
    color: '#dc3545',
  },
  successLog: {
    color: '#28a745',
  },
  warningLog: {
    color: '#fd7e14',
  },
  infoLog: {
    color: '#17a2b8',
  },
});