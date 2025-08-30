import React, { useState } from 'react';
import { View, Button, TextInput, ScrollView, Alert } from 'react-native';
import { Text } from './Typography'; // Use our custom Text component
import minimalSyncService from '../services/sync/minimalSyncService';
import encryptionService from '../services/sync/encryptionService';
import syncStoreIntegration from '../services/sync/syncStoreIntegration';
import { useUserStore, useLibraryStore, useSettingsStore } from '../stores';

const SyncDiagnostic = () => {
  const [log, setLog] = useState([]);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [syncId, setSyncId] = useState('');
  
  // Get store update functions
  const setUsers = useUserStore(state => state.setUsers);
  const setLibrary = useLibraryStore(state => state.setLibrary);
  const updateSettings = useSettingsStore(state => state.updateSettings);
  
  const addLog = (message, data = null) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLog(prev => [...prev, { 
      time: timestamp, 
      message, 
      data: data ? JSON.stringify(data, null, 2) : null 
    }]);
    console.log(`[SyncDiag] ${message}`, data || '');
  };

  const testCreateSync = async () => {
    try {
      addLog('Starting CREATE sync test...');
      
      // Create test data
      const testData = {
        users: {
          'test-user-1': {
            id: 'test-user-1',
            name: 'Test User',
            icon: '🧪',
            days: {
              today: { activities: [] }
            }
          }
        },
        library: { categories: [] },
        settings: { theme: 'blue' }
      };
      
      addLog('Test data created', testData);
      
      // Generate recovery phrase
      const phrase = encryptionService.generateRecoveryPhrase();
      addLog('Generated recovery phrase', phrase);
      setRecoveryPhrase(phrase);
      
      // Generate sync ID
      const syncId = await minimalSyncService.generateSyncId(phrase);
      addLog('Generated sync ID', syncId);
      setSyncId(syncId);
      
      // Test encryption - use the same fixed salt as minimalSyncService
      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ='; // Base64 encoded salt
      await encryptionService.initialize(phrase, syncId, fixedSalt);
      const encrypted = encryptionService.encryptData(testData);
      addLog('Encrypted data length', encrypted.length);
      
      // Test decryption
      const decrypted = encryptionService.decryptData(encrypted);
      addLog('Decryption successful', { 
        matches: JSON.stringify(decrypted) === JSON.stringify(testData) 
      });
      
      // Create sync via API
      const deviceId = await encryptionService.getDeviceId();
      addLog('Device ID', deviceId);
      
      const createUrl = `https://stackmap.app/qual/api/sync/create_timestamp.php`;
      const payload = {
        sync_id: syncId,
        device_id: deviceId,
        encrypted_blob: encrypted,
        timestamp: Date.now()
      };
      
      addLog('Calling create_timestamp.php...', { url: createUrl });
      
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      addLog('Create response', result);
      
      // Check debug info
      const debugUrl = `https://stackmap.app/qual/api/sync/debug_sync.php?sync_id=${syncId}`;
      addLog('Checking debug info...', { url: debugUrl });
      
      const debugResponse = await fetch(debugUrl);
      const debugData = await debugResponse.json();
      addLog('Debug data', debugData);
      
    } catch (error) {
      addLog('ERROR in create test', { error: error.message, stack: error.stack });
    }
  };

  const testJoinSync = async () => {
    try {
      if (!recoveryPhrase) {
        addLog('ERROR: No recovery phrase set');
        return;
      }
      
      addLog('Starting JOIN sync test...');
      addLog('Using recovery phrase', recoveryPhrase);
      
      // Generate sync ID from phrase
      const syncId = await minimalSyncService.generateSyncId(recoveryPhrase);
      addLog('Generated sync ID', syncId);
      
      // Get device ID
      const deviceId = await encryptionService.getDeviceId();
      addLog('Device ID', deviceId);
      
      // Try join_timestamp.php
      const joinUrl = `https://stackmap.app/qual/api/sync/join_timestamp.php`;
      addLog('Calling join_timestamp.php...', { url: joinUrl });
      
      const joinResponse = await fetch(joinUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_id: syncId, device_id: deviceId })
      });
      
      const joinResult = await joinResponse.json();
      addLog('Join response', joinResult);
      
      // Try pull_timestamp.php with since=0
      const pullUrl = `https://stackmap.app/qual/api/sync/pull_timestamp.php?sync_id=${syncId}&device_id=${deviceId}&since=0`;
      addLog('Calling pull_timestamp.php with since=0...', { url: pullUrl });
      
      const pullResponse = await fetch(pullUrl);
      const pullResult = await pullResponse.json();
      addLog('Pull response', pullResult);
      
      if (pullResult.records && pullResult.records.length > 0) {
        addLog('Found records, attempting decrypt...');
        
        // Initialize encryption with the same fixed salt
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
        
        for (const record of pullResult.records) {
          try {
            const decrypted = encryptionService.decryptData(record.encrypted_blob);
            addLog(`Decrypted record from device ${record.device_id}`, decrypted);
          } catch (error) {
            addLog(`Failed to decrypt record from device ${record.device_id}`, error.message);
          }
        }
      }
      
      // Check debug info
      const debugUrl = `https://stackmap.app/qual/api/sync/debug_sync.php?sync_id=${syncId}`;
      addLog('Checking debug info...', { url: debugUrl });
      
      const debugResponse = await fetch(debugUrl);
      const debugData = await debugResponse.json();
      addLog('Debug data', debugData);
      
    } catch (error) {
      addLog('ERROR in join test', { error: error.message, stack: error.stack });
    }
  };

  const testRawPull = async () => {
    try {
      if (!syncId) {
        addLog('ERROR: No sync ID set');
        return;
      }
      
      addLog('Testing raw pull...');
      
      const deviceId = await encryptionService.getDeviceId();
      
      // Test with since=0 (should get ALL records)
      const pullUrl0 = `https://stackmap.app/qual/api/sync/pull_timestamp.php?sync_id=${syncId}&device_id=${deviceId}&since=0`;
      addLog('Pull with since=0...', { url: pullUrl0 });
      
      const response0 = await fetch(pullUrl0);
      const result0 = await response0.json();
      addLog('Pull since=0 result', { 
        success: result0.success,
        records_count: result0.records?.length || 0,
        records: result0.records 
      });
      
      // Test with current timestamp (should get nothing)
      const now = Date.now();
      const pullUrlNow = `https://stackmap.app/qual/api/sync/pull_timestamp.php?sync_id=${syncId}&device_id=${deviceId}&since=${now}`;
      addLog('Pull with since=now...', { url: pullUrlNow });
      
      const responseNow = await fetch(pullUrlNow);
      const resultNow = await responseNow.json();
      addLog('Pull since=now result', { 
        success: resultNow.success,
        records_count: resultNow.records?.length || 0 
      });
      
    } catch (error) {
      addLog('ERROR in raw pull test', { error: error.message });
    }
  };

  const testCreateWithRealData = async () => {
    try {
      addLog('Starting CREATE with REAL APP DATA...');
      
      // Get current app state
      const currentState = await syncStoreIntegration.getCurrentState();
      addLog('Current app state captured', {
        users: Object.keys(currentState.users || {}),
        userCount: Object.keys(currentState.users || {}).length,
        hasLibrary: !!currentState.library,
        hasSettings: !!currentState.settings
      });
      
      // Generate recovery phrase
      const phrase = encryptionService.generateRecoveryPhrase();
      addLog('Generated recovery phrase', phrase);
      setRecoveryPhrase(phrase);
      
      // Generate sync ID
      const syncId = await minimalSyncService.generateSyncId(phrase);
      addLog('Generated sync ID', syncId);
      setSyncId(syncId);
      
      // Initialize encryption
      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
      await encryptionService.initialize(phrase, syncId, fixedSalt);
      
      // Encrypt current state
      const encrypted = encryptionService.encryptData(currentState);
      addLog('Encrypted real data length', encrypted.length);
      
      // Test decryption
      const decrypted = encryptionService.decryptData(encrypted);
      addLog('Decryption test', { 
        success: true,
        userCount: Object.keys(decrypted.users || {}).length
      });
      
      // Create sync via API
      const deviceId = await encryptionService.getDeviceId();
      const createUrl = `https://stackmap.app/qual/api/sync/create_timestamp.php`;
      const payload = {
        sync_id: syncId,
        device_id: deviceId,
        encrypted_blob: encrypted,
        timestamp: Date.now()
      };
      
      addLog('Pushing real data to server...');
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      addLog('Create response', result);
      
    } catch (error) {
      addLog('ERROR in create with real data', { error: error.message, stack: error.stack });
    }
  };

  const testImportData = async () => {
    try {
      if (!recoveryPhrase) {
        addLog('ERROR: No recovery phrase set');
        return;
      }
      
      addLog('Starting IMPORT test (will modify app data!)...');
      
      // Join and get data
      const syncId = await minimalSyncService.generateSyncId(recoveryPhrase);
      const deviceId = await encryptionService.getDeviceId();
      
      // Initialize encryption
      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
      await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
      
      // Pull data
      const pullUrl = `https://stackmap.app/qual/api/sync/pull_timestamp.php?sync_id=${syncId}&device_id=${deviceId}&since=0`;
      addLog('Pulling data for import...');
      
      const pullResponse = await fetch(pullUrl);
      const pullResult = await pullResponse.json();
      
      if (pullResult.records && pullResult.records.length > 0) {
        // Get the latest record
        const latestRecord = pullResult.records[pullResult.records.length - 1];
        addLog('Found record to import', {
          device: latestRecord.device_id,
          timestamp: latestRecord.timestamp
        });
        
        // Decrypt the data
        const decryptedData = encryptionService.decryptData(latestRecord.encrypted_blob);
        addLog('Decrypted data for import', {
          users: Object.keys(decryptedData.users || {}),
          userCount: Object.keys(decryptedData.users || {}).length
        });
        
        // Now try to import it using syncStoreIntegration
        addLog('Calling syncStoreIntegration.handleDataReceived...');
        await syncStoreIntegration.handleDataReceived(decryptedData);
        
        addLog('✅ Import completed successfully!');
        
        // Verify what was imported
        const newState = await syncStoreIntegration.getCurrentState();
        addLog('New app state after import', {
          users: Object.keys(newState.users || {}),
          userCount: Object.keys(newState.users || {}).length
        });
        
      } else {
        addLog('No records found to import');
      }
      
    } catch (error) {
      addLog('ERROR in import test', { error: error.message, stack: error.stack });
    }
  };

  const loadDemoData = async () => {
    try {
      addLog('Loading FULL demo data from demo-data-kids-export.json...');
      
      // Demo data structure matching demo-data-kids-export.json
      const demoData = {
        users: {
          "user-atlas": {
            id: "user-atlas",
            name: "Atlas",
            icon: "🌎",
            createdAt: "2025-01-01T09:00:00.000Z",
            lastActive: new Date().toISOString(),
            settings: { theme: "#2196F3" },
            days: {
              today: {
                activities: [
                  { id: "atlas-1", text: "Brush teeth", icon: "🦷", completed: true, pinned: false, order: 0 },
                  { id: "atlas-2", text: "Get dressed", icon: "👕", completed: true, pinned: false, order: 1 },
                  { id: "atlas-3", text: "Eat breakfast", icon: "🥞", completed: true, pinned: true, order: 2 },
                  { id: "atlas-4", text: "Take medicine", icon: "💊", completed: false, pinned: true, order: 3 },
                  { id: "atlas-5", text: "Reading time", icon: "📖", completed: false, pinned: false, order: 4 },
                  { id: "atlas-6", text: "Math practice", icon: "🔢", completed: false, pinned: false, order: 5 },
                  { id: "atlas-7", text: "Snack time", icon: "🍎", completed: false, pinned: false, order: 6 },
                  { id: "atlas-8", text: "Art class", icon: "🎨", completed: false, pinned: false, order: 7 },
                  { id: "atlas-9", text: "Playground", icon: "🛝", completed: false, pinned: false, order: 8 },
                  { id: "atlas-10", text: "Speech therapy", icon: "💬", completed: false, pinned: false, order: 9 },
                  { id: "atlas-11", text: "Quiet time", icon: "🧘", completed: false, pinned: false, order: 10 },
                  { id: "atlas-12", text: "Bedtime routine", icon: "🌙", completed: false, pinned: false, order: 11 }
                ]
              },
              tomorrow: { activities: [] }
            }
          },
          "user-mappy": {
            id: "user-mappy",
            name: "Mappy",
            icon: "🗺️",
            createdAt: "2025-01-05T14:30:00.000Z",
            lastActive: new Date().toISOString(),
            settings: { theme: "#4CAF50" },
            days: {
              today: { activities: [] },
              tomorrow: { activities: [] }
            }
          },
          "user-desty": {
            id: "user-desty",
            name: "Desty",
            icon: "📍",
            createdAt: "2025-01-08T08:00:00.000Z",
            lastActive: new Date().toISOString(),
            settings: { theme: "#F44336" },
            days: {
              today: { activities: [] },
              tomorrow: { activities: [] }
            }
          }
        },
        currentUser: "user-atlas",
        currentDay: "today",
        library: {
          categories: [
            { id: "my-templates", name: "My Templates", icon: "⭐", activities: [] }
          ],
          userAddedActivityIds: []
        },
        settings: {
          currentTheme: "stackBlue",
          bannerPosition: "top",
          defaultView: "normal",
          displayMode: "numbers",
          enableDayManagement: true,
          pinEnabled: false
        }
      };
      
      // Update stores with demo data
      setUsers(demoData.users);
      setLibrary(demoData.library);
      updateSettings(demoData.settings);
      
      addLog('Demo data loaded!', {
        userCount: Object.keys(demoData.users).length,
        users: Object.keys(demoData.users)
      });
      
      // Verify it was loaded
      const currentState = await syncStoreIntegration.getCurrentState();
      addLog('Verified current state', {
        users: Object.keys(currentState.users || {}),
        userCount: Object.keys(currentState.users || {}).length
      });
      
    } catch (error) {
      addLog('ERROR loading demo data', { error: error.message });
    }
  };

  const loadFullDemoData = async () => {
    try {
      addLog('Loading COMPLETE demo-data-kids-export.json...');
      
      // Fetch the actual demo file
      const response = await fetch('/data/demo-data-kids-export.json');
      const fullData = await response.json();
      
      addLog('Demo file loaded', {
        version: fullData.version,
        hasUsers: !!fullData.users,
        hasLibrary: !!fullData.library
      });
      
      // Extract the data we need
      const importData = {
        users: fullData.users || {},
        currentUser: fullData.currentUser || 'user-atlas',
        currentDay: fullData.currentDay || 'today',
        library: fullData.library || {
          categories: fullData.library?.categories || [],
          userAddedActivityIds: fullData.library?.userAddedActivityIds || []
        },
        globalSettings: fullData.globalSettings || {}
      };
      
      // Update stores with full demo data
      if (importData.users && Object.keys(importData.users).length > 0) {
        setUsers(importData.users);
        addLog('Users loaded', {
          count: Object.keys(importData.users).length,
          users: Object.keys(importData.users)
        });
      }
      
      if (importData.library) {
        setLibrary(importData.library);
        addLog('Library loaded', {
          categories: importData.library.categories?.length || 0
        });
      }
      
      if (importData.globalSettings) {
        updateSettings(importData.globalSettings);
        addLog('Settings loaded');
      }
      
      // Verify the data was loaded
      const currentState = await syncStoreIntegration.getCurrentState();
      addLog('✅ Full demo data loaded! Current state:', {
        users: Object.keys(currentState.users || {}),
        userCount: Object.keys(currentState.users || {}).length,
        firstUserActivities: currentState.users?.['user-atlas']?.days?.today?.activities?.length || 0
      });
      
    } catch (error) {
      addLog('ERROR loading full demo data', { 
        error: error.message,
        note: 'File may not be accessible via web. Using inline demo data instead.'
      });
      // Fall back to the inline demo data
      loadDemoData();
    }
  };

  const clearLog = () => setLog([]);

  // Combined test functions
  const testBrowserA = async () => {
    clearLog();
    addLog('=== BROWSER A TEST SEQUENCE ===');
    
    // Step 1: Load demo data
    addLog('Step 1: Loading demo data...');
    await loadFullDemoData();
    
    // Wait a bit for state to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 2: Create sync with that data
    addLog('Step 2: Creating sync with demo data...');
    await testCreateWithRealData();
    
    addLog('=== TEST COMPLETE ===');
    addLog('📋 COPY THE RECOVERY PHRASE ABOVE TO BROWSER B');
  };
  
  const testBrowserB = async () => {
    if (!recoveryPhrase) {
      addLog('❌ ERROR: Please paste the recovery phrase from Browser A first!');
      return;
    }
    
    clearLog();
    addLog('=== BROWSER B TEST SEQUENCE ===');
    addLog('Using recovery phrase: ' + recoveryPhrase);
    
    // Import the data
    addLog('Importing data from sync...');
    await testImportData();
    
    addLog('=== TEST COMPLETE ===');
    addLog('✅ Check if data was imported successfully above');
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
        Sync Test
      </Text>
      
      <View style={{ 
        backgroundColor: '#f0f0f0', 
        padding: 15, 
        borderRadius: 8, 
        marginBottom: 20 
      }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          Which browser is this?
        </Text>
        
        <View style={{ marginBottom: 15 }}>
          <Button 
            title="🅰️ Browser A - CREATE SYNC" 
            onPress={testBrowserA}
            color="#2196F3"
          />
          <Text style={{ fontSize: 12, marginTop: 5, fontStyle: 'italic' }}>
            Creates a new sync with demo data
          </Text>
        </View>
        
        <View style={{ 
          borderTopWidth: 1, 
          borderTopColor: '#ccc', 
          paddingTop: 15,
          marginTop: 10 
        }}>
          <Text style={{ marginBottom: 5 }}>Recovery Phrase from Browser A:</Text>
          <TextInput
            value={recoveryPhrase}
            onChangeText={setRecoveryPhrase}
            style={{ 
              borderWidth: 1, 
              borderColor: '#ccc', 
              padding: 10, 
              marginBottom: 10,
              backgroundColor: '#fff',
              fontFamily: 'monospace'
            }}
            placeholder="Paste recovery phrase here"
          />
          
          <Button 
            title="🅱️ Browser B - JOIN SYNC" 
            onPress={testBrowserB}
            color="#4CAF50"
          />
          <Text style={{ fontSize: 12, marginTop: 5, fontStyle: 'italic' }}>
            Imports data using the recovery phrase
          </Text>
        </View>
      </View>
      
      <View style={{ marginBottom: 10 }}>
        <Button title="Clear Log" onPress={clearLog} color="#666" />
      </View>
      
      <View style={{ backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Log:</Text>
        {log.map((entry, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>
              [{entry.time}] {entry.message}
            </Text>
            {entry.data && (
              <Text style={{ 
                fontFamily: 'monospace', 
                fontSize: 11, 
                color: '#333',
                marginLeft: 10,
                marginTop: 5 
              }}>
                {entry.data}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default SyncDiagnostic;