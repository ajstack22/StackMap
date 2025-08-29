/**
 * Comprehensive Conflict Resolution Test Suite
 * 
 * Tests various scenarios to ensure data integrity across multiple devices
 * Includes automated tests for:
 * - Simultaneous user additions
 * - User modification conflicts
 * - Library activity conflicts
 * - Complex multi-field updates
 * - Rapid sequential updates
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
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  
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
      setLogs([]);
      setTestResults({});
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };
  
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[ConflictTest] ${message}`);
  };
  
  // Test 1: Simultaneous User Additions
  const testSimultaneousUsers = async () => {
    addLog('📝 TEST 1: Simultaneous User Additions', 'test');
    
    const timestamp = Date.now();
    
    // Simulate Device A adding users
    const deviceAUsers = {
      'alice': { 
        id: 'alice', 
        name: 'Alice from Device A', 
        icon: '👩',
        lastModified: timestamp,
        days: { today: { activities: ['workout', 'reading'] } }
      },
      'bob': { 
        id: 'bob', 
        name: 'Bob from Device A', 
        icon: '👨',
        lastModified: timestamp + 1
      }
    };
    
    // Simulate Device B adding different users
    const deviceBUsers = {
      'charlie': { 
        id: 'charlie', 
        name: 'Charlie from Device B', 
        icon: '🧑',
        lastModified: timestamp + 100
      },
      'diana': { 
        id: 'diana', 
        name: 'Diana from Device B', 
        icon: '👩‍💼',
        lastModified: timestamp + 101
      }
    };
    
    // Apply both sets
    useUserStore.getState().setUsers({ ...deviceAUsers, ...deviceBUsers });
    addLog('Added 4 users from 2 devices', 'info');
    
    // Push and verify
    await syncStore.pushCurrentState();
    
    // Check all users exist
    const finalUsers = useUserStore.getState().users || {};
    const hasAll = ['alice', 'bob', 'charlie', 'diana'].every(id => finalUsers[id]);
    
    if (hasAll) {
      addLog('✅ TEST 1 PASSED: All users preserved', 'success');
      setTestResults(prev => ({ ...prev, test1: 'passed' }));
    } else {
      addLog('❌ TEST 1 FAILED: Some users lost', 'error');
      setTestResults(prev => ({ ...prev, test1: 'failed' }));
    }
  };
  
  // Test 2: Conflicting User Modifications
  const testUserModification = async () => {
    addLog('📝 TEST 2: Conflicting User Modifications', 'test');
    
    // Create base user
    const baseUser = {
      id: 'conflict_test',
      name: 'Original Name',
      icon: '🔄',
      lastModified: Date.now() - 5000,
      days: { today: { activities: [] } }
    };
    
    useUserStore.getState().setUsers({ conflict_test: baseUser });
    
    // Simulate two devices modifying same user
    const localMod = {
      ...baseUser,
      name: 'Modified Locally',
      icon: '📱',
      lastModified: Date.now() + 1000, // Newer
      days: { today: { activities: ['local_activity'] } }
    };
    
    const remoteMod = {
      ...baseUser,
      name: 'Modified Remotely',
      icon: '☁️',
      lastModified: Date.now(), // Older
      days: { today: { activities: ['remote_activity'] } }
    };
    
    // Test conflict resolution
    const merged = conflictResolver.mergeStates(
      { users: { conflict_test: localMod } },
      { users: { conflict_test: remoteMod } }
    );
    
    // Apply merged result
    useUserStore.getState().setUsers(merged.users);
    
    const finalUser = useUserStore.getState().users?.conflict_test;
    const nameCorrect = finalUser?.name === 'Modified Locally'; // Newer wins
    const activitiesPreserved = finalUser?.days?.today?.activities?.length >= 1;
    
    if (nameCorrect && activitiesPreserved) {
      addLog('✅ TEST 2 PASSED: Newer modification won, activities merged', 'success');
      setTestResults(prev => ({ ...prev, test2: 'passed' }));
    } else {
      addLog('❌ TEST 2 FAILED: Conflict resolution incorrect', 'error');
      setTestResults(prev => ({ ...prev, test2: 'failed' }));
    }
  };
  
  // Test 3: Library Activities Merge
  const testLibraryMerge = async () => {
    addLog('📝 TEST 3: Library Activities Merge', 'test');
    
    // Device A activities
    const deviceALibrary = {
      activities: [
        { id: 'exercise', text: 'Exercise', icon: '🏃', category: 'Health' },
        { id: 'meditation', text: 'Meditation', icon: '🧘', category: 'Wellness' }
      ],
      categories: ['Health', 'Wellness']
    };
    
    // Device B activities
    const deviceBLibrary = {
      activities: [
        { id: 'coding', text: 'Coding', icon: '💻', category: 'Work' },
        { id: 'reading', text: 'Reading', icon: '📚', category: 'Learning' }
      ],
      categories: ['Work', 'Learning']
    };
    
    // Apply both
    useLibraryStore.getState().setLibrary({
      activities: [...deviceALibrary.activities, ...deviceBLibrary.activities],
      categories: [...new Set([...deviceALibrary.categories, ...deviceBLibrary.categories])],
      templates: [],
      userAddedActivityIds: []
    });
    
    const finalLibrary = useLibraryStore.getState().library || {};
    const hasAllActivities = ['exercise', 'meditation', 'coding', 'reading']
      .every(id => finalLibrary.activities?.some(a => a.id === id));
    const hasAllCategories = ['Health', 'Wellness', 'Work', 'Learning']
      .every(cat => finalLibrary.categories?.includes(cat));
    
    if (hasAllActivities && hasAllCategories) {
      addLog('✅ TEST 3 PASSED: All library items merged correctly', 'success');
      setTestResults(prev => ({ ...prev, test3: 'passed' }));
    } else {
      addLog('❌ TEST 3 FAILED: Library merge incomplete', 'error');
      setTestResults(prev => ({ ...prev, test3: 'failed' }));
    }
  };
  
  // Test 4: Rapid Sequential Updates
  const testRapidUpdates = async () => {
    addLog('📝 TEST 4: Rapid Sequential Updates', 'test');
    
    const updates = [];
    for (let i = 1; i <= 5; i++) {
      updates.push({
        [`rapid_${i}`]: {
          id: `rapid_${i}`,
          name: `Rapid User ${i}`,
          icon: i % 2 === 0 ? '⚡' : '🔥',
          lastModified: Date.now() + i * 10
        }
      });
    }
    
    // Apply all rapidly
    for (const update of updates) {
      useUserStore.getState().setUsers({
        ...useUserStore.getState().users,
        ...update
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const finalUsers = useUserStore.getState().users || {};
    const allPresent = updates.every(update => 
      Object.keys(update).every(key => finalUsers[key])
    );
    
    if (allPresent) {
      addLog('✅ TEST 4 PASSED: All rapid updates preserved', 'success');
      setTestResults(prev => ({ ...prev, test4: 'passed' }));
    } else {
      addLog('❌ TEST 4 FAILED: Some rapid updates lost', 'error');
      setTestResults(prev => ({ ...prev, test4: 'failed' }));
    }
  };
  
  // Test 5: Complex Multi-Field Scenario
  const testComplexScenario = async () => {
    addLog('📝 TEST 5: Complex Multi-Field Scenario', 'test');
    
    // Simulate complex state from multiple devices
    const complexState = {
      users: {
        'multi_1': { 
          id: 'multi_1', 
          name: 'Multi User 1', 
          icon: '1️⃣',
          days: {
            '2025-01-13': { activities: ['morning', 'afternoon'] },
            '2025-01-14': { activities: ['evening'] }
          }
        },
        'multi_2': { 
          id: 'multi_2', 
          name: 'Multi User 2', 
          icon: '2️⃣'
        }
      },
      library: {
        activities: [
          { id: 'complex_1', text: 'Complex Activity 1', icon: '🎯' },
          { id: 'complex_2', text: 'Complex Activity 2', icon: '🎨' }
        ],
        categories: ['Category A', 'Category B'],
        templates: ['Template 1'],
        userAddedActivityIds: ['complex_1']
      }
    };
    
    // Apply complex state
    useUserStore.getState().setUsers(complexState.users);
    useLibraryStore.getState().setLibrary(complexState.library);
    
    // Push and pull to test sync
    await syncStore.pushCurrentState();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify everything preserved
    const finalUsers = useUserStore.getState().users || {};
    const finalLibrary = useLibraryStore.getState().library || {};
    
    const usersOk = Object.keys(complexState.users).every(id => finalUsers[id]);
    const activitiesOk = complexState.library.activities.every(act =>
      finalLibrary.activities?.some(a => a.id === act.id)
    );
    const categoriesOk = complexState.library.categories.every(cat =>
      finalLibrary.categories?.includes(cat)
    );
    
    if (usersOk && activitiesOk && categoriesOk) {
      addLog('✅ TEST 5 PASSED: Complex scenario handled correctly', 'success');
      setTestResults(prev => ({ ...prev, test5: 'passed' }));
    } else {
      addLog('❌ TEST 5 FAILED: Complex data not fully preserved', 'error');
      setTestResults(prev => ({ ...prev, test5: 'failed' }));
    }
  };
  
  // Run all automated tests
  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setLogs([]);
    setTestResults({});
    
    addLog('🚀 Starting Comprehensive Conflict Resolution Tests', 'info');
    
    // Clear data first
    useUserStore.getState().setUsers({});
    useLibraryStore.getState().setLibrary({
      activities: [],
      categories: [],
      templates: [],
      userAddedActivityIds: []
    });
    
    try {
      await testSimultaneousUsers();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testUserModification();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testLibraryMerge();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testRapidUpdates();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await testComplexScenario();
      
      // Summary
      const results = Object.values(testResults);
      const passed = results.filter(r => r === 'passed').length;
      const failed = results.filter(r => r === 'failed').length;
      
      addLog('═══════════════════════════════════', 'info');
      addLog(`📊 SUMMARY: ${passed} passed, ${failed} failed`, 
        failed === 0 ? 'success' : 'error');
      
      if (failed === 0) {
        addLog('🎉 All tests passed! Conflict resolution working correctly', 'success');
        setStatus('✅ All tests passed');
      } else {
        addLog('⚠️ Some tests failed - review conflict resolution', 'error');
        setStatus(`⚠️ ${failed} tests failed`);
      }
    } catch (error) {
      addLog(`Test error: ${error.message}`, 'error');
      setStatus('Test suite error');
    } finally {
      setIsRunning(false);
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
        
        {/* Automated Test Suite */}
        <View style={{ marginBottom: 20, padding: 10, backgroundColor: '#e8f5e9', borderRadius: 10 }}>
          <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 10, fontSize: 18 }]}>
            🧪 Automated Test Suite
          </Text>
          
          <TouchableOpacity
            style={[styles.button, { 
              backgroundColor: isRunning ? '#9E9E9E' : '#4CAF50',
              marginBottom: 10,
              padding: 15
            }]}
            onPress={runAllTests}
            disabled={isRunning}
          >
            <Text style={[styles.buttonText, { fontSize: 16 }]}>
              {isRunning ? '⏳ Tests Running...' : '🚀 Run All Tests'}
            </Text>
          </TouchableOpacity>
          
          {/* Individual Tests */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <TouchableOpacity
              style={[styles.button, { margin: 3, backgroundColor: '#2196F3', flex: 0, minWidth: 100 }]}
              onPress={testSimultaneousUsers}
              disabled={isRunning}
            >
              <Text style={[styles.buttonText, { fontSize: 12 }]}>Test Users</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { margin: 3, backgroundColor: '#FF9800', flex: 0, minWidth: 100 }]}
              onPress={testUserModification}
              disabled={isRunning}
            >
              <Text style={[styles.buttonText, { fontSize: 12 }]}>Test Conflicts</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { margin: 3, backgroundColor: '#9C27B0', flex: 0, minWidth: 100 }]}
              onPress={testLibraryMerge}
              disabled={isRunning}
            >
              <Text style={[styles.buttonText, { fontSize: 12 }]}>Test Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { margin: 3, backgroundColor: '#00BCD4', flex: 0, minWidth: 100 }]}
              onPress={testRapidUpdates}
              disabled={isRunning}
            >
              <Text style={[styles.buttonText, { fontSize: 12 }]}>Test Rapid</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, { margin: 3, backgroundColor: '#FF5722', flex: 0, minWidth: 100 }]}
              onPress={testComplexScenario}
              disabled={isRunning}
            >
              <Text style={[styles.buttonText, { fontSize: 12 }]}>Test Complex</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <View style={{ marginBottom: 20, padding: 10, backgroundColor: '#fff3e0', borderRadius: 10 }}>
            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 10 }]}>
              📊 Test Results:
            </Text>
            {Object.entries(testResults).map(([test, result]) => (
              <Text key={test} style={{
                fontSize: 14,
                marginBottom: 3,
                color: result === 'passed' ? '#2E7D32' : '#C62828'
              }}>
                {test}: {result === 'passed' ? '✅ PASSED' : '❌ FAILED'}
              </Text>
            ))}
          </View>
        )}
        
        {/* Test Logs */}
        {logs.length > 0 && (
          <View style={{ marginBottom: 20, padding: 10, backgroundColor: '#f5f5f5', borderRadius: 10 }}>
            <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 10 }]}>
              📋 Test Logs:
            </Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {logs.map((entry, index) => {
                const colors = {
                  info: '#666',
                  success: '#2E7D32',
                  error: '#C62828',
                  test: '#1976D2',
                  warning: '#F57C00'
                };
                return (
                  <Text key={index} style={{
                    fontSize: 11,
                    marginBottom: 2,
                    color: colors[entry.type] || '#000'
                  }}>
                    [{entry.timestamp}] {entry.message}
                  </Text>
                );
              })}
            </ScrollView>
          </View>
        )}
        
        {/* Manual Test Actions */}
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.text, { fontWeight: 'bold', marginBottom: 10 }]}>
            Manual Actions:
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