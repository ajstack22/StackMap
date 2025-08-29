import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import fixedSyncService from '../services/sync/fixedSyncService';
import { useUserStore } from '../stores';

/**
 * Test component that demonstrates the sync persistence fix
 */
export default function SyncFixTest() {
  const [testStatus, setTestStatus] = useState('not-started');
  const [logs, setLogs] = useState([]);
  const users = useUserStore(state => state.users);
  const currentUser = useUserStore(state => state.currentUser);
  
  // Get activities from the store
  const activities = users?.[currentUser]?.days?.today?.activities || [];

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[SyncFixTest] ${message}`);
  };

  useEffect(() => {
    // Check for restored data on mount
    checkCurrentState();
    // Try to restore from backup if needed
    fixedSyncService.restoreFromBackup().then(restored => {
      if (restored) {
        addLog('📥 Data restored from backup after refresh!', 'success');
      }
    });
  }, []);

  const checkCurrentState = () => {
    addLog(`Current state: ${activities.length} activities in store`);
    if (activities.length > 0) {
      addLog('✅ Found activities in store', 'success');
      activities.forEach(act => {
        addLog(`  • ${act.text}`, 'info');
      });
    } else {
      addLog('⚠️ No activities in store', 'warning');
    }
  };

  // Test 1: Simulate receiving sync data (like Device B would)
  const handleSimulateReceive = async () => {
    addLog('📡 Simulating data receive from sync...', 'info');
    setTestStatus('receiving');

    const testData = {
      activities: [
        'Synced Activity 1',
        'Synced Activity 2', 
        'Synced Activity 3'
      ]
    };

    const success = await fixedSyncService.testReceiveData(testData);
    
    if (success) {
      addLog('✅ Data received and persisted!', 'success');
      setTestStatus('received');
      
      // Check the store
      setTimeout(() => {
        checkCurrentState();
        Alert.alert(
          'Step 1 Complete!',
          'Data received and saved. Now refresh the page to test persistence.',
          [{ text: 'OK' }]
        );
      }, 100);
    } else {
      addLog('❌ Failed to persist received data', 'error');
      setTestStatus('failed');
    }
  };

  // Test 2: Check after refresh
  const handleCheckAfterRefresh = () => {
    addLog('🔍 Checking if sync data persisted...', 'info');
    
    if (activities.length > 0) {
      addLog('✅ SUCCESS! Sync data persisted after refresh!', 'success');
      setTestStatus('success');
      Alert.alert(
        '🎉 Success!', 
        'The sync fix works! Data from Device A would now persist on Device B after refresh.',
        [{ text: 'Great!' }]
      );
    } else {
      addLog('❌ No activities found after refresh', 'error');
      setTestStatus('failed');
      Alert.alert('Failed', 'Data did not persist. The issue may be deeper.');
    }
  };

  // Clear test data
  const handleClear = async () => {
    await fixedSyncService.clearBackup();
    // Clear the stores
    useUserStore.getState().setUsers({});
    setLogs([]);
    setTestStatus('not-started');
    addLog('Test data cleared', 'info');
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case 'success': return '#28a745';
      case 'failed': return '#dc3545';
      case 'receiving': return '#ffc107';
      case 'received': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Sync Persistence Fix Test</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{testStatus.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.explanation}>
        <Text style={styles.explainTitle}>The Problem:</Text>
        <Text style={styles.explainText}>
          Device B receives sync data but loses it on refresh because stores don't persist fast enough.
        </Text>
        <Text style={styles.explainTitle}>The Fix:</Text>
        <Text style={styles.explainText}>
          Force immediate persistence using store.persist.flush() and backup to AsyncStorage.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Store State</Text>
        <Text style={styles.info}>Activities in store: {activities.length}</Text>
        {activities.map((activity, i) => (
          <Text key={i} style={styles.activity}>• {activity.text}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test the Fix</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleSimulateReceive}>
          <Text style={styles.buttonText}>1. Simulate Receiving Sync Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={() => window.location.reload()}
        >
          <Text style={styles.buttonText}>2. REFRESH PAGE (Cmd+R)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.checkButton]} 
          onPress={handleCheckAfterRefresh}
        >
          <Text style={styles.buttonText}>3. Check if Sync Data Persisted</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]} 
          onPress={handleClear}
        >
          <Text style={styles.buttonText}>Clear Test Data</Text>
        </TouchableOpacity>
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
    fontSize: 22,
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
  explanation: {
    backgroundColor: '#f0f8ff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  explainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  explainText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 10,
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
  dangerButton: {
    backgroundColor: '#dc3545',
    marginTop: 20,
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