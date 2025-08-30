import React, { useState } from 'react';
import { View, Text, Button, TextInput, ScrollView, Alert } from 'react-native';
import minimalSyncService from '../services/sync/minimalSyncService';
import encryptionService from '../services/sync/encryptionService';

const SyncDiagnostic = () => {
  const [log, setLog] = useState([]);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [syncId, setSyncId] = useState('');
  
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
      
      // Test encryption
      await encryptionService.initialize(phrase, syncId, 'test-salt');
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
        
        // Initialize encryption
        await encryptionService.initialize(recoveryPhrase, syncId, 'test-salt');
        
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

  const clearLog = () => setLog([]);

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Sync Diagnostic Tool
      </Text>
      
      <View style={{ marginBottom: 20 }}>
        <Text>Recovery Phrase:</Text>
        <TextInput
          value={recoveryPhrase}
          onChangeText={setRecoveryPhrase}
          style={{ 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 10, 
            marginVertical: 5,
            fontFamily: 'monospace'
          }}
          placeholder="Enter or generate recovery phrase"
        />
        
        <Text>Sync ID:</Text>
        <TextInput
          value={syncId}
          onChangeText={setSyncId}
          style={{ 
            borderWidth: 1, 
            borderColor: '#ccc', 
            padding: 10, 
            marginVertical: 5,
            fontFamily: 'monospace'
          }}
          placeholder="Sync ID (auto-generated)"
        />
      </View>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
        <Button title="1. Create Sync" onPress={testCreateSync} />
        <View style={{ width: 10 }} />
        <Button title="2. Join Sync" onPress={testJoinSync} />
        <View style={{ width: 10 }} />
        <Button title="3. Test Pull" onPress={testRawPull} />
        <View style={{ width: 10 }} />
        <Button title="Clear Log" onPress={clearLog} />
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