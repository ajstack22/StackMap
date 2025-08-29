import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * ULTRA SIMPLE TEST: Can we persist the sync timestamp?
 * This is the core issue - Device B loses its timestamp on refresh
 */
export default function TimestampPersistTest() {
  const [timestamp, setTimestamp] = useState(null);
  const [savedTimestamp, setSavedTimestamp] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${time}] ${msg}`]);
    console.log(`[TimestampTest] ${msg}`);
  };

  // Load on mount
  useEffect(() => {
    loadTimestamp();
  }, []);

  const loadTimestamp = async () => {
    try {
      addLog('Loading @sync_timestamp from AsyncStorage...');
      const stored = await AsyncStorage.getItem('@sync_timestamp');
      
      if (stored) {
        const parsed = parseInt(stored, 10);
        setTimestamp(parsed);
        setSavedTimestamp(parsed);
        addLog(`✅ Loaded timestamp: ${parsed}`);
        addLog(`This means Device B should request since=${parsed}`);
      } else {
        addLog('❌ No timestamp found - Device B will request since=0');
        setTimestamp(0);
        setSavedTimestamp(0);
      }
    } catch (error) {
      addLog(`❌ Error loading: ${error.message}`);
    }
  };

  const saveNewTimestamp = async () => {
    try {
      const newTimestamp = Date.now();
      addLog(`Saving new timestamp: ${newTimestamp}`);
      
      // Save directly - no debouncing
      await AsyncStorage.setItem('@sync_timestamp', newTimestamp.toString());
      
      // Verify it saved
      const verification = await AsyncStorage.getItem('@sync_timestamp');
      if (verification === newTimestamp.toString()) {
        addLog('✅ Timestamp saved and verified!');
        setTimestamp(newTimestamp);
        setSavedTimestamp(newTimestamp);
      } else {
        addLog(`❌ Save failed! Expected ${newTimestamp}, got ${verification}`);
      }
    } catch (error) {
      addLog(`❌ Error saving: ${error.message}`);
    }
  };

  const clearTimestamp = async () => {
    try {
      await AsyncStorage.removeItem('@sync_timestamp');
      addLog('Timestamp cleared');
      setTimestamp(0);
      setSavedTimestamp(0);
    } catch (error) {
      addLog(`Error clearing: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Timestamp Persistence Test</Text>
      
      <View style={styles.status}>
        <Text style={styles.label}>Current Timestamp:</Text>
        <Text style={styles.value}>{timestamp || 'Not loaded'}</Text>
      </View>

      <View style={styles.status}>
        <Text style={styles.label}>Last Saved:</Text>
        <Text style={styles.value}>{savedTimestamp || 'Never'}</Text>
      </View>

      <View style={styles.explanation}>
        <Text style={styles.explainText}>
          This is what Device B uses for "since" parameter.
          If this is 0 or missing, Device B requests ALL records.
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={saveNewTimestamp}>
        <Text style={styles.buttonText}>1. Save New Timestamp</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.refreshButton]} onPress={() => window.location.reload()}>
        <Text style={styles.buttonText}>2. Refresh Page</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.checkButton]} onPress={loadTimestamp}>
        <Text style={styles.buttonText}>3. Check if Persisted</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearTimestamp}>
        <Text style={styles.buttonText}>Clear Timestamp</Text>
      </TouchableOpacity>

      <View style={styles.logs}>
        <Text style={styles.logTitle}>Logs:</Text>
        {logs.map((log, i) => (
          <Text key={i} style={styles.log}>{log}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  value: {
    flex: 1,
    fontFamily: 'monospace',
  },
  explanation: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  explainText: {
    fontSize: 14,
    color: '#1976d2',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#2196F3',
  },
  checkButton: {
    backgroundColor: '#9C27B0',
  },
  dangerButton: {
    backgroundColor: '#f44336',
  },
  logs: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    maxHeight: 200,
  },
  logTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  log: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});