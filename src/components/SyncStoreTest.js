import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import syncStore from '../services/sync/syncStoreIntegration';
import { useUserStore, useLibraryStore, useSettingsStore } from '../stores';

/**
 * Test component for Phase 1 & 2: Bidirectional sync with store integration
 */
export default function SyncStoreTest() {
  const [syncId, setSyncId] = useState('');
  const [inputSyncId, setInputSyncId] = useState('');
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);
  
  // Store data - matching actual structure
  const users = useUserStore(state => state.users) || {};
  const currentUser = useUserStore(state => state.currentUser);
  const currentDay = useUserStore(state => state.currentDay);
  const libraryState = useLibraryStore(state => state.library) || {};
  const library = libraryState.activities || [];
  const settings = useSettingsStore(state => state) || {};

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    setLogs(prev => [...prev, logEntry]);
    console.log(`[SyncStoreTest] ${message}`);
  };

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      addLog('Initializing sync store integration...');
      await syncStore.initialize();
      
      // Check sync status
      const status = syncStore.getSyncStatus();
      setStatus(status);
      
      if (status.syncId) {
        setSyncId(status.syncId);
        addLog(`Found existing sync: ${status.syncId}`, 'success');
        
        if (status.hasProtectionPeriod) {
          addLog(`Protection period active: ${status.protectionSecondsRemaining}s remaining`, 'warning');
        }
      }
      
      // Try to restore from backup
      const restored = await syncStore.restoreFromBackup();
      if (restored) {
        addLog('Restored data from backup', 'success');
      }
    };
    
    init();
    
    // Update status periodically
    const interval = setInterval(() => {
      const newStatus = syncStore.getSyncStatus();
      setStatus(newStatus);
      
      // Log status changes for debugging
      if (newStatus?.isEnabled !== status?.isEnabled) {
        console.log('[SyncStoreTest] Status changed:', newStatus);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Create new sync with test data
  const handleCreateSync = async () => {
    addLog('Creating new sync with test data...', 'info');
    
    try {
      // Add test data to stores - users is an object
      const testUsers = {
        'user1': { 
          id: 'user1', 
          name: 'Test User 1', 
          icon: '👤',
          days: {
            today: { activities: [] },
            tomorrow: { activities: [] }
          }
        },
        'user2': { 
          id: 'user2', 
          name: 'Test User 2', 
          icon: '👥',
          days: {
            today: { activities: [] },
            tomorrow: { activities: [] }
          }
        }
      };
      
      const testLibrary = {
        activities: [
          { id: 'lib1', text: 'Test Activity 1', icon: '📝', category: 'Test' },
          { id: 'lib2', text: 'Test Activity 2', icon: '✅', category: 'Test' },
          { id: 'lib3', text: 'Test Activity 3', icon: '🎯', category: 'Test' }
        ],
        categories: ['Test', 'Work', 'Personal'],
        templates: [],
        userAddedActivityIds: []
      };
      
      useUserStore.getState().setUsers(testUsers);
      useLibraryStore.getState().setLibrary(testLibrary);
      
      addLog('Added test data to stores', 'success');
      
      // Create sync - this should enable sync automatically
      const newSyncId = await syncStore.createSync();
      setSyncId(newSyncId);
      
      // Update status to reflect enabled state
      setStatus(syncStore.getSyncStatus());
      
      addLog(`✅ Sync created! ID: ${newSyncId}`, 'success');
      addLog('✅ Sync enabled with periodic pull every 30s', 'success');
      
      Alert.alert(
        'Sync Created!',
        `Sync ID: ${newSyncId}\n\nCopy this ID to test in another tab/device.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      addLog(`❌ Create failed: ${error.message}`, 'error');
    }
  };

  // Join existing sync
  const handleJoinSync = async () => {
    if (!inputSyncId.trim()) {
      Alert.alert('Error', 'Please enter a Sync ID');
      return;
    }

    addLog(`Joining sync ${inputSyncId}...`, 'info');
    
    try {
      await syncStore.joinSync(inputSyncId.trim());
      setSyncId(inputSyncId.trim());
      
      // Update status to reflect enabled state
      setStatus(syncStore.getSyncStatus());
      
      addLog(`✅ Joined sync successfully!`, 'success');
      addLog('📥 Data received and applied to stores', 'success');
      addLog('⏰ 60-second protection period started', 'warning');
      addLog('✅ Sync enabled with periodic pull every 30s', 'success');
      
      Alert.alert(
        'Joined Successfully!',
        'Data has been synced. There is a 60-second protection period before you can push changes.\n\nPeriodic sync is now active (every 30 seconds).',
        [{ text: 'OK' }]
      );
    } catch (error) {
      addLog(`❌ Join failed: ${error.message}`, 'error');
    }
  };

  // Add a new user (triggers automatic push after debounce)
  const handleAddUser = () => {
    const userId = `user-${Date.now()}`;
    const userCount = Object.keys(users).length;
    const newUser = {
      id: userId,
      name: `User ${userCount + 1}`,
      icon: '🆕',
      days: {
        today: { activities: [] },
        tomorrow: { activities: [] }
      }
    };
    
    addLog(`Adding user: ${newUser.name}`, 'info');
    // Add user to the users object
    const updatedUsers = { ...users, [userId]: newUser };
    useUserStore.getState().setUsers(updatedUsers);
    
    if (status?.hasProtectionPeriod) {
      addLog(`Change detected. Will push after protection period (${status.protectionSecondsRemaining}s)`, 'warning');
    } else {
      addLog('Change detected. Will push after 5 second debounce', 'info');
    }
  };

  // Add a new library item
  const handleAddLibraryItem = () => {
    const currentLibrary = Array.isArray(library) ? library : [];
    const newItem = {
      id: `lib-${Date.now()}`,
      text: `Activity ${currentLibrary.length + 1}`,
      icon: '🌟',
      category: 'Test'
    };
    
    addLog(`Adding library item: ${newItem.text}`, 'info');
    const updatedLibrary = {
      ...libraryState,
      activities: [...currentLibrary, newItem]
    };
    useLibraryStore.getState().setLibrary(updatedLibrary);
    
    if (status?.hasProtectionPeriod) {
      addLog(`Change detected. Will push after protection period (${status.protectionSecondsRemaining}s)`, 'warning');
    } else {
      addLog('Change detected. Will push after 5 second debounce', 'info');
    }
  };

  // Manual push (for testing)
  const handleManualPush = async () => {
    addLog('Manual push triggered', 'info');
    await syncStore.pushCurrentState();
  };

  // Clear all data
  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all sync data and stores. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await syncStore.clearAll();
            useUserStore.getState().setUsers([]);
            useLibraryStore.getState().setLibrary({
              activities: [],
              categories: [],
              templates: [],
              userAddedActivityIds: []
            });
            setSyncId('');
            setInputSyncId('');
            setStatus(null);
            addLog('All data cleared', 'warning');
          }
        }
      ]
    );
  };

  // Log entry component
  const LogEntry = ({ entry }) => {
    const colors = {
      info: '#007AFF',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30'
    };
    
    return (
      <Text style={[styles.logEntry, { color: colors[entry.type] }]}>
        [{entry.timestamp}] {entry.message}
      </Text>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sync Store Integration Test</Text>
        <Text style={styles.subtitle}>Phase 1 & 2: Bidirectional sync with stores</Text>
      </View>

      {/* Status Section */}
      {status && (
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text>Sync Enabled: {status.isEnabled ? '✅' : '❌'}</Text>
          <Text>Sync ID: {status.syncId || 'None'}</Text>
          {status.isEnabled && (
            <Text style={styles.success}>📡 Periodic sync active (30s interval)</Text>
          )}
          {status.hasProtectionPeriod && (
            <Text style={styles.warning}>
              ⏰ Protection Period: {status.protectionSecondsRemaining}s remaining
            </Text>
          )}
        </View>
      )}

      {/* Store Data Section */}
      <View style={styles.dataSection}>
        <Text style={styles.sectionTitle}>Store Data</Text>
        <Text>Users: {Object.keys(users).length}</Text>
        <Text>Library Items: {library?.length || 0}</Text>
        <View style={styles.userList}>
          {Object.entries(users).map(([userId, user]) => (
            <Text key={userId}>{user.icon || user.emoji || '👤'} {user.name}</Text>
          ))}
        </View>
        <View style={styles.libraryList}>
          {Array.isArray(library) && library.slice(0, 5).map(item => (
            <Text key={item.id}>{item.icon} {item.text}</Text>
          ))}
          {library?.length > 5 && <Text>... and {library.length - 5} more</Text>}
        </View>
      </View>

      {/* Controls Section */}
      <View style={styles.controls}>
        {!syncId ? (
          <>
            <TouchableOpacity style={styles.button} onPress={handleCreateSync}>
              <Text style={styles.buttonText}>Create New Sync</Text>
            </TouchableOpacity>
            
            <View style={styles.joinSection}>
              <TextInput
                style={styles.input}
                placeholder="Enter Sync ID to join"
                value={inputSyncId}
                onChangeText={setInputSyncId}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.button} onPress={handleJoinSync}>
                <Text style={styles.buttonText}>Join Existing Sync</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={handleAddUser}>
              <Text style={styles.buttonText}>Add User (Auto Sync)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={handleAddLibraryItem}>
              <Text style={styles.buttonText}>Add Library Item (Auto Sync)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={handleManualPush}>
              <Text style={styles.buttonText}>Manual Push</Text>
            </TouchableOpacity>
            
            {!status?.isEnabled && (
              <TouchableOpacity 
                style={[styles.button, styles.warning]} 
                onPress={async () => {
                  addLog('Manually enabling sync...', 'info');
                  await syncStore.initialize();
                  setStatus(syncStore.getSyncStatus());
                  addLog('✅ Sync enabled', 'success');
                }}
              >
                <Text style={styles.buttonText}>Enable Sync (Manual)</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={[styles.button, styles.destructive]} onPress={handleClearAll}>
              <Text style={styles.buttonText}>Clear All Data</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Logs Section */}
      <View style={styles.logsSection}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <ScrollView style={styles.logs}>
          {logs.map((entry, index) => (
            <LogEntry key={index} entry={entry} />
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  dataSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  warning: {
    color: '#FF9500',
    fontWeight: 'bold',
  },
  success: {
    color: '#34C759',
    fontWeight: 'bold',
  },
  userList: {
    marginTop: 10,
  },
  libraryList: {
    marginTop: 10,
  },
  controls: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  destructive: {
    backgroundColor: '#FF3B30',
  },
  warning: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  joinSection: {
    marginTop: 10,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logsSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 50,
  },
  logs: {
    maxHeight: 200,
  },
  logEntry: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});