/**
 * Test Component for Conflict Resolution
 * 
 * Allows testing concurrent edits and conflict resolution
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import syncStore from '../services/sync/syncStoreIntegration';
import minimalSync from '../services/sync/minimalSyncService';
import conflictResolver from '../services/sync/conflictResolver';
import { useUserStore, useLibraryStore } from '../stores';
import styles from '../styles';

const ConflictResolutionTest = () => {
  const [syncId, setSyncId] = useState(minimalSync.syncId || '');
  const [status, setStatus] = useState('Not syncing');
  const [localData, setLocalData] = useState(null);
  const [remoteData, setRemoteData] = useState(null);
  const [mergeLog, setMergeLog] = useState([]);
  const [testActivity, setTestActivity] = useState('');
  const [testUser, setTestUser] = useState('');
  
  const users = useUserStore(state => state.users);
  const library = useLibraryStore(state => state.library);
  
  useEffect(() => {
    updateLocalData();
  }, [users, library]);
  
  const updateLocalData = async () => {
    const state = await syncStore.getCurrentState();
    setLocalData(state);
  };
  
  const createTestSync = async () => {
    try {
      setStatus('Creating sync...');
      
      // Add some test data
      const testData = {
        users: {
          test1: {
            id: 'test1',
            name: 'Test User 1',
            icon: '👤',
            days: {}
          }
        },
        activities: {},
        settings: {
          theme: 'blue'
        },
        library: {
          activities: [],
          categories: []
        }
      };
      
      const newSyncId = await syncStore.createSync();
      setSyncId(newSyncId);
      setStatus(`Created sync: ${newSyncId}`);
      
      // Pull to get initial state
      await pullLatestData();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('[ConflictTest] Create error:', error);
    }
  };
  
  const joinTestSync = async () => {
    if (!syncId) {
      Alert.alert('Error', 'Enter a sync ID first');
      return;
    }
    
    try {
      setStatus('Joining sync...');
      await syncStore.joinSync(syncId);
      setStatus(`Joined sync: ${syncId}`);
      
      // Pull to get current state
      await pullLatestData();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('[ConflictTest] Join error:', error);
    }
  };
  
  const simulateLocalChange = async () => {
    try {
      setStatus('Making local change...');
      
      // Add a test activity with timestamp
      const activityId = `activity_${Date.now()}`;
      const newActivity = {
        id: activityId,
        text: testActivity || `Local Activity ${Date.now()}`,
        icon: '🎯',
        createdAt: Date.now(),
        modifiedAt: Date.now()
      };
      
      // Update store (this will trigger sync)
      const currentUsers = useUserStore.getState().users;
      const userId = Object.keys(currentUsers)[0];
      
      if (userId) {
        const updatedUser = {
          ...currentUsers[userId],
          days: {
            ...currentUsers[userId].days,
            [new Date().toISOString().split('T')[0]]: {
              activities: [
                ...(currentUsers[userId].days[new Date().toISOString().split('T')[0]]?.activities || []),
                newActivity
              ]
            }
          }
        };
        
        useUserStore.getState().setUsers({
          ...currentUsers,
          [userId]: updatedUser
        });
        
        setStatus('Local change made - will sync in 5s');
      } else {
        // Create a new user if none exists
        const newUserId = testUser || `user_${Date.now()}`;
        useUserStore.getState().setUsers({
          [newUserId]: {
            id: newUserId,
            name: testUser || 'Test User',
            icon: '👤',
            days: {
              [new Date().toISOString().split('T')[0]]: {
                activities: [newActivity]
              }
            }
          }
        });
        
        setStatus('Created new user with activity - will sync in 5s');
      }
      
      await updateLocalData();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('[ConflictTest] Local change error:', error);
    }
  };
  
  const pullLatestData = async () => {
    try {
      setStatus('Pulling data...');
      const result = await minimalSync.pullData();
      
      if (result.success) {
        if (result.data) {
          setRemoteData(result.data);
          
          // Show merge log if there were conflicts
          if (result.hadConflicts && result.mergeLog) {
            setMergeLog(result.mergeLog);
            setStatus(`Pulled & merged (${result.mergeLog.length} decisions)`);
          } else {
            setStatus('Pulled latest data (no conflicts)');
          }
        } else {
          setStatus('No new data');
        }
      } else {
        setStatus(`Pull failed: ${result.error}`);
      }
      
      await updateLocalData();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('[ConflictTest] Pull error:', error);
    }
  };
  
  const pushCurrentData = async () => {
    try {
      setStatus('Pushing data...');
      await syncStore.pushCurrentState();
      setStatus('Data pushed successfully');
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('[ConflictTest] Push error:', error);
    }
  };
  
  const simulateConflict = async () => {
    try {
      setStatus('Simulating conflict...');
      
      // Create two different changes to the same data
      const localChange = {
        users: {
          conflict_user: {
            id: 'conflict_user',
            name: 'Local Version',
            icon: '🔴',
            modifiedAt: Date.now()
          }
        },
        metadata: {
          deviceId: 'device_local',
          fieldTimestamps: {
            users: Date.now()
          }
        }
      };
      
      const remoteChange = {
        users: {
          conflict_user: {
            id: 'conflict_user',
            name: 'Remote Version',
            icon: '🔵',
            modifiedAt: Date.now() - 1000 // Older timestamp
          }
        },
        metadata: {
          deviceId: 'device_remote',
          fieldTimestamps: {
            users: Date.now() - 1000
          }
        }
      };
      
      // Perform conflict resolution
      const merged = conflictResolver.mergeStates(localChange, remoteChange);
      
      // Show the result
      const log = conflictResolver.getMergeLog();
      setMergeLog(log);
      
      // The merged result should have the local version (newer timestamp)
      const winner = merged.users.conflict_user.name;
      setStatus(`Conflict resolved: ${winner} won`);
      
      console.log('[ConflictTest] Merge result:', merged);
      console.log('[ConflictTest] Merge log:', log);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error('[ConflictTest] Conflict simulation error:', error);
    }
  };
  
  const clearAll = async () => {
    try {
      await syncStore.clearAll();
      setSyncId('');
      setStatus('All data cleared');
      setLocalData(null);
      setRemoteData(null);
      setMergeLog([]);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };
  
  const formatData = (data) => {
    if (!data) return 'No data';
    
    const summary = {
      users: Object.keys(data.users || {}).length,
      activities: Object.keys(data.activities || {}).length,
      metadata: data.metadata
    };
    
    return JSON.stringify(summary, null, 2);
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: '#f0f0f0' }]}>
      <View style={styles.card}>
        <Text style={[styles.title, { fontSize: 24, marginBottom: 20 }]}>
          🔀 Conflict Resolution Test
        </Text>
        
        <Text style={[styles.text, { marginBottom: 10 }]}>
          Status: {status}
        </Text>
        
        {/* Sync Controls */}
        <View style={{ marginBottom: 20 }}>
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="Sync ID (for joining)"
            value={syncId}
            onChangeText={setSyncId}
          />
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={[styles.button, { margin: 5, backgroundColor: '#4CAF50' }]}
              onPress={createTestSync}
            >
              <Text style={styles.buttonText}>Create Sync</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { margin: 5, backgroundColor: '#2196F3' }]}
              onPress={joinTestSync}
            >
              <Text style={styles.buttonText}>Join Sync</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Test Actions */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 10 }]}>
            Test Actions:
          </Text>
          
          <TextInput
            style={[styles.input, { marginBottom: 5 }]}
            placeholder="Test activity name"
            value={testActivity}
            onChangeText={setTestActivity}
          />
          
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="Test user name"
            value={testUser}
            onChangeText={setTestUser}
          />
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={[styles.button, { margin: 5, backgroundColor: '#FF9800' }]}
              onPress={simulateLocalChange}
            >
              <Text style={styles.buttonText}>Local Change</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { margin: 5, backgroundColor: '#9C27B0' }]}
              onPress={pullLatestData}
            >
              <Text style={styles.buttonText}>Pull Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { margin: 5, backgroundColor: '#00BCD4' }]}
              onPress={pushCurrentData}
            >
              <Text style={styles.buttonText}>Push Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { margin: 5, backgroundColor: '#F44336' }]}
              onPress={simulateConflict}
            >
              <Text style={styles.buttonText}>Test Conflict</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { margin: 5, backgroundColor: '#607D8B' }]}
              onPress={clearAll}
            >
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Merge Log */}
        {mergeLog.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 10 }]}>
              📊 Merge Decisions:
            </Text>
            <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 5 }}>
              {mergeLog.slice(-10).map((entry, index) => (
                <Text key={index} style={{ fontSize: 12, marginBottom: 2 }}>
                  • {entry.message}
                </Text>
              ))}
            </View>
          </View>
        )}
        
        {/* Data Display */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 10 }]}>
            Local Data:
          </Text>
          <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 5 }}>
            <Text style={{ fontSize: 10, fontFamily: 'monospace' }}>
              {formatData(localData)}
            </Text>
          </View>
        </View>
        
        {remoteData && (
          <View style={{ marginBottom: 20 }}>
            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 10 }]}>
              Remote Data:
            </Text>
            <View style={{ backgroundColor: '#fff', padding: 10, borderRadius: 5 }}>
              <Text style={{ fontSize: 10, fontFamily: 'monospace' }}>
                {formatData(remoteData)}
              </Text>
            </View>
          </View>
        )}
        
        <Text style={[styles.text, { fontSize: 10, marginTop: 20, opacity: 0.7 }]}>
          Phase 4: Conflict Resolution Testing
        </Text>
      </View>
    </ScrollView>
  );
};

export default ConflictResolutionTest;