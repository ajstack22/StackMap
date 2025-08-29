import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local-only sync test - no API calls needed
 * Tests if data persists in AsyncStorage after refresh
 */
export default function LocalSyncTest() {
  const [activities, setActivities] = useState([]);
  const [testStatus, setTestStatus] = useState('not-started');
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[LocalSyncTest] ${message}`);
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    addLog('Loading data from AsyncStorage...');
    try {
      const stored = await AsyncStorage.getItem('@test_sync_data');
      if (stored) {
        const data = JSON.parse(stored);
        setActivities(data.activities || []);
        addLog(`✅ Loaded ${data.activities?.length || 0} activities from storage`, 'success');
        return true;
      } else {
        addLog('No data in storage', 'warning');
        return false;
      }
    } catch (error) {
      addLog(`Error loading: ${error.message}`, 'error');
      return false;
    }
  };

  // Test 1: Create test data
  const handleCreateData = async () => {
    addLog('Creating test data...', 'info');
    setTestStatus('creating');

    const testData = {
      activities: ['Test Activity 1', 'Test Activity 2', 'Test Activity 3'],
      timestamp: Date.now(),
      source: 'LocalSyncTest'
    };

    try {
      // Store in AsyncStorage
      await AsyncStorage.setItem('@test_sync_data', JSON.stringify(testData));
      
      // Verify it was stored
      const verify = await AsyncStorage.getItem('@test_sync_data');
      if (verify) {
        setActivities(testData.activities);
        addLog('✅ Data created and stored successfully!', 'success');
        setTestStatus('created');
        
        Alert.alert(
          'Step 1 Complete!',
          'Data stored. Now refresh the page (Cmd+R) to test persistence.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Storage verification failed');
      }
    } catch (error) {
      addLog(`❌ Failed to store: ${error.message}`, 'error');
      setTestStatus('failed');
    }
  };

  // Test 2: Check persistence after refresh
  const handleCheckPersistence = async () => {
    addLog('Checking if data persisted after refresh...', 'info');
    
    const hasData = await loadData();
    
    if (hasData && activities.length > 0) {
      addLog('✅ SUCCESS! Data persisted after refresh!', 'success');
      setTestStatus('success');
      Alert.alert('Success!', 'Data persisted! AsyncStorage is working correctly.');
    } else {
      addLog('❌ FAILED! Data did not persist', 'error');
      setTestStatus('failed');
      Alert.alert('Failed', 'Data did not persist. AsyncStorage may have issues.');
    }
  };

  // Test 3: Add new activity
  const handleAddActivity = async () => {
    const newActivity = `New Activity ${activities.length + 1}`;
    const updatedActivities = [...activities, newActivity];
    
    try {
      const updatedData = {
        activities: updatedActivities,
        timestamp: Date.now(),
        source: 'LocalSyncTest'
      };
      
      await AsyncStorage.setItem('@test_sync_data', JSON.stringify(updatedData));
      setActivities(updatedActivities);
      addLog(`✅ Added: ${newActivity}`, 'success');
    } catch (error) {
      addLog(`❌ Failed to add: ${error.message}`, 'error');
    }
  };

  // Clear all data
  const handleClearAll = async () => {
    try {
      await AsyncStorage.removeItem('@test_sync_data');
      setActivities([]);
      setTestStatus('not-started');
      setLogs([]);
      addLog('All data cleared', 'info');
    } catch (error) {
      addLog(`Error clearing: ${error.message}`, 'error');
    }
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case 'success': return '#28a745';
      case 'failed': return '#dc3545';
      case 'creating': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Local Storage Test</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{testStatus.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Data</Text>
        <Text style={styles.info}>Activities: {activities.length}</Text>
        {activities.map((activity, i) => (
          <Text key={i} style={styles.activity}>• {activity}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test AsyncStorage Persistence</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleCreateData}>
          <Text style={styles.buttonText}>1. Create Test Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={() => window.location.reload()}
        >
          <Text style={styles.buttonText}>2. REFRESH PAGE (Cmd+R)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.checkButton]} 
          onPress={handleCheckPersistence}
        >
          <Text style={styles.buttonText}>3. Check if Data Persisted</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Actions</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.smallButton]} 
            onPress={handleAddActivity}
          >
            <Text style={styles.buttonText}>Add Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.smallButton, styles.dangerButton]} 
            onPress={handleClearAll}
          >
            <Text style={styles.buttonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Info</Text>
        <Text style={styles.debugText}>
          Storage Type: {typeof window !== 'undefined' ? 'localStorage (Web)' : 'AsyncStorage (Native)'}
        </Text>
        <Text style={styles.debugText}>
          Test Key: @test_sync_data
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <ScrollView style={styles.logsContainer}>
          {logs.map((log, i) => (
            <Text 
              key={i} 
              style={[
                styles.log,
                log.type === 'error' && styles.errorLog,
                log.type === 'success' && styles.successLog,
                log.type === 'warning' && styles.warningLog
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  activity: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    marginVertical: 2,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#28a745',
    marginTop: 15,
  },
  checkButton: {
    backgroundColor: '#6f42c1',
  },
  smallButton: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
    fontFamily: 'monospace',
  },
  logsContainer: {
    maxHeight: 200,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
  },
  log: {
    fontSize: 12,
    marginVertical: 2,
    fontFamily: 'monospace',
    color: '#333',
  },
  errorLog: {
    color: '#dc3545',
  },
  successLog: {
    color: '#28a745',
  },
  warningLog: {
    color: '#ffc107',
  },
});