import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import minimalSync from '../services/sync/minimalSyncService';

export default function MinimalSyncTest() {
  const [syncId, setSyncId] = useState('');
  const [inputSyncId, setInputSyncId] = useState('');
  const [activities, setActivities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [testStatus, setTestStatus] = useState('not-started');

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    setLogs(prev => [...prev, logEntry]);
    console.log(`[SyncTest] ${message}`);
  };

  // Load data on mount and after any operation
  const loadData = async () => {
    addLog('Loading data from storage...');
    const data = await minimalSync.getCurrentData();
    
    if (data) {
      setSyncId(data.syncId);
      setActivities(data.data?.activities || []);
      addLog(`Loaded ${data.data?.activities?.length || 0} activities`, 'success');
      return true;
    } else {
      addLog('No data in storage', 'warning');
      return false;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Test 1: Create new sync
  const handleCreateSync = async () => {
    addLog('Creating new sync...', 'info');
    setTestStatus('creating');

    const testData = {
      activities: ['Test Activity 1', 'Test Activity 2', 'Test Activity 3'],
      timestamp: Date.now(),
      source: 'MinimalSyncTest'
    };

    const result = await minimalSync.createSync(testData);
    
    if (result.success) {
      setSyncId(result.syncId);
      setActivities(testData.activities);
      addLog(`✅ Sync created! ID: ${result.syncId}`, 'success');
      
      // Show sync ID in alert for easy copying
      Alert.alert(
        'Sync Created!',
        `Sync ID: ${result.syncId}\n\nCopy this ID to test in another tab/device.`,
        [{ text: 'OK' }]
      );
      
      setTestStatus('created');
    } else {
      addLog(`❌ Create failed: ${result.error}`, 'error');
      setTestStatus('failed');
    }
  };

  // Test 2: Join existing sync
  const handleJoinSync = async () => {
    if (!inputSyncId.trim()) {
      Alert.alert('Error', 'Please enter a Sync ID');
      return;
    }

    addLog(`Joining sync ${inputSyncId}...`, 'info');
    setTestStatus('joining');

    const result = await minimalSync.joinSync(inputSyncId.trim());
    
    if (result.success) {
      setSyncId(inputSyncId);
      setActivities(result.data?.activities || []);
      addLog(`✅ Joined! Received ${result.data?.activities?.length || 0} activities`, 'success');
      setTestStatus('joined');
      
      Alert.alert(
        'Test Persistence',
        'Now refresh the page (Cmd+R) and see if the data persists!',
        [{ text: 'OK' }]
      );
    } else {
      addLog(`❌ Join failed: ${result.error}`, 'error');
      setTestStatus('failed');
    }
  };

  // Test 3: Check persistence after refresh
  const handleCheckPersistence = async () => {
    addLog('Checking persistence after refresh...', 'info');
    
    const hasData = await loadData();
    
    if (hasData && activities.length > 0) {
      addLog('✅ SUCCESS! Data persisted after refresh!', 'success');
      setTestStatus('success');
      Alert.alert('Success!', 'Data persisted after refresh! The sync is working.');
    } else {
      addLog('❌ FAILED! Data did not persist', 'error');
      setTestStatus('failed');
      Alert.alert('Failed', 'Data did not persist after refresh.');
    }
  };

  // Test 4: Add new activity
  const handleAddActivity = async () => {
    if (!syncId) {
      Alert.alert('Error', 'Create or join a sync first');
      return;
    }

    const newActivity = `New Activity ${activities.length + 1}`;
    const updatedActivities = [...activities, newActivity];
    
    const updatedData = {
      activities: updatedActivities,
      timestamp: Date.now(),
      source: 'MinimalSyncTest'
    };

    addLog(`Adding activity: ${newActivity}`, 'info');
    const result = await minimalSync.pushData(updatedData);
    
    if (result.success) {
      setActivities(updatedActivities);
      addLog('✅ Activity added and pushed', 'success');
    } else {
      addLog(`❌ Push failed: ${result.error}`, 'error');
    }
  };

  // Test 5: Pull latest data
  const handlePullData = async () => {
    if (!syncId) {
      Alert.alert('Error', 'Create or join a sync first');
      return;
    }

    addLog('Pulling latest data...', 'info');
    const result = await minimalSync.pullData();
    
    if (result.success) {
      if (result.data) {
        setActivities(result.data.activities || []);
        addLog(`✅ Pulled ${result.data.activities?.length || 0} activities`, 'success');
      } else {
        addLog('No new data available', 'info');
      }
    } else {
      addLog(`❌ Pull failed: ${result.error}`, 'error');
    }
  };

  // Clear all data
  const handleClearAll = async () => {
    await minimalSync.clearAll();
    setSyncId('');
    setInputSyncId('');
    setActivities([]);
    setLogs([]);
    setTestStatus('not-started');
    addLog('All data cleared', 'info');
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case 'success': return '#28a745';
      case 'failed': return '#dc3545';
      case 'creating':
      case 'joining': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 Minimal Sync Test</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{testStatus.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current State</Text>
        <Text style={styles.info}>Sync ID: {syncId || 'None'}</Text>
        <Text style={styles.info}>Activities: {activities.length}</Text>
        {activities.map((activity, i) => (
          <Text key={i} style={styles.activity}>• {activity}</Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Steps</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleCreateSync}>
          <Text style={styles.buttonText}>1. Create New Sync</Text>
        </TouchableOpacity>

        <Text style={styles.or}>— OR —</Text>

        <View style={styles.joinSection}>
          <TextInput
            style={styles.input}
            value={inputSyncId}
            onChangeText={setInputSyncId}
            placeholder="Enter Sync ID to join"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.button} onPress={handleJoinSync}>
            <Text style={styles.buttonText}>2. Join Existing Sync</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, styles.refreshButton]} 
          onPress={() => window.location.reload()}
        >
          <Text style={styles.buttonText}>3. REFRESH PAGE (Cmd+R)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.checkButton]} 
          onPress={handleCheckPersistence}
        >
          <Text style={styles.buttonText}>4. Check if Data Persisted</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Actions</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.smallButton]} 
            onPress={handleAddActivity}
            disabled={!syncId}
          >
            <Text style={styles.buttonText}>Add Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.smallButton]} 
            onPress={handlePullData}
            disabled={!syncId}
          >
            <Text style={styles.buttonText}>Pull Data</Text>
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
  or: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#999',
  },
  joinSection: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: 'white',
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