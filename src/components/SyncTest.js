/**
 * Simple test component for Phase 1 sync testing
 * This component tests ONLY the minimal sync service
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, ScrollView, StyleSheet } from 'react-native';
import minimalSync from '../services/sync/minimalSyncService';

export default function SyncTest() {
  const [syncId, setSyncId] = useState('');
  const [inputSyncId, setInputSyncId] = useState('');
  const [testData, setTestData] = useState({
    activities: ['Activity 1', 'Activity 2', 'Activity 3'],
    timestamp: Date.now(),
    deviceInfo: 'Test Device'
  });
  const [currentData, setCurrentData] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message) => {
    const timestamp = new Date().toISOString().slice(11, 19);
    setLogs(prev => [...prev, `${timestamp} - ${message}`]);
    console.log(`[SyncTest] ${message}`);
  };

  // Load data on mount
  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = async () => {
    addLog('Loading current data from storage...');
    const data = await minimalSync.getCurrentData();
    if (data) {
      setCurrentData(data);
      setSyncId(data.syncId);
      addLog(`Loaded data with ${data.data?.activities?.length || 0} activities`);
    } else {
      addLog('No existing data found');
    }
  };

  const handleCreateSync = async () => {
    addLog('Creating new sync...');
    const result = await minimalSync.createSync(testData);
    if (result.success) {
      setSyncId(result.syncId);
      addLog(`✅ Sync created! ID: ${result.syncId}`);
      await loadCurrentData();
    } else {
      addLog(`❌ Create failed: ${result.error}`);
    }
  };

  const handleJoinSync = async () => {
    if (!inputSyncId) {
      addLog('❌ Please enter a sync ID');
      return;
    }
    
    addLog(`Joining sync ${inputSyncId}...`);
    const result = await minimalSync.joinSync(inputSyncId);
    if (result.success) {
      setSyncId(inputSyncId);
      setCurrentData({
        syncId: inputSyncId,
        timestamp: result.timestamp,
        data: result.data
      });
      addLog(`✅ Joined! Received ${result.data?.activities?.length || 0} activities`);
    } else {
      addLog(`❌ Join failed: ${result.error}`);
    }
  };

  const handleAddActivity = async () => {
    const newActivity = `Activity ${(currentData?.data?.activities?.length || 0) + 1}`;
    const updatedData = {
      ...testData,
      activities: [...(currentData?.data?.activities || []), newActivity],
      timestamp: Date.now()
    };
    
    addLog(`Adding activity: ${newActivity}`);
    const result = await minimalSync.pushData(updatedData);
    if (result.success) {
      addLog('✅ Pushed successfully');
      await loadCurrentData();
    } else {
      addLog(`❌ Push failed: ${result.error}`);
    }
  };

  const handlePullData = async () => {
    addLog('Pulling latest data...');
    const result = await minimalSync.pullData();
    if (result.success) {
      if (result.data) {
        setCurrentData({
          syncId,
          timestamp: result.timestamp,
          data: result.data
        });
        addLog(`✅ Pulled ${result.data?.activities?.length || 0} activities`);
      } else {
        addLog('ℹ️ No new data');
      }
    } else {
      addLog(`❌ Pull failed: ${result.error}`);
    }
  };

  const handleRefreshPage = () => {
    addLog('Refreshing page...');
    window.location.reload();
  };

  const handleClearAll = async () => {
    addLog('Clearing all data...');
    await minimalSync.clearAll();
    setSyncId('');
    setCurrentData(null);
    setInputSyncId('');
    addLog('✅ All data cleared');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🧪 Phase 1: Minimal Sync Test</Text>
      
      {/* Current State */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current State</Text>
        <Text>Sync ID: {syncId || 'None'}</Text>
        <Text>Activities: {currentData?.data?.activities?.length || 0}</Text>
        {currentData?.data?.activities?.map((activity, i) => (
          <Text key={i} style={styles.activity}>• {activity}</Text>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <Button title="1. Create New Sync" onPress={handleCreateSync} />
        
        <View style={styles.joinSection}>
          <TextInput
            style={styles.input}
            value={inputSyncId}
            onChangeText={setInputSyncId}
            placeholder="Enter sync ID to join"
          />
          <Button title="2. Join Existing Sync" onPress={handleJoinSync} />
        </View>
        
        <Button title="3. Add Activity" onPress={handleAddActivity} disabled={!syncId} />
        <Button title="4. Pull Latest Data" onPress={handlePullData} disabled={!syncId} />
        <Button title="5. REFRESH PAGE (Test Persistence)" onPress={handleRefreshPage} />
        <Button title="Clear All Data" onPress={handleClearAll} />
      </View>

      {/* Logs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <ScrollView style={styles.logs}>
          {logs.map((log, i) => (
            <Text key={i} style={styles.log}>{log}</Text>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  activity: {
    marginLeft: 10,
    marginVertical: 2
  },
  joinSection: {
    marginVertical: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 4
  },
  logs: {
    maxHeight: 200,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 4
  },
  log: {
    fontSize: 12,
    marginVertical: 1
  }
});