import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import simpleEncryption from '../services/sync/encryptionServiceSimple';

const TestEncryption = () => {
  const [results, setResults] = useState('');
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    setResults('Running tests...\n');
    
    // Capture console logs
    const logs = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      originalLog(...args);
      logs.push(args.join(' '));
    };
    
    console.error = (...args) => {
      originalError(...args);
      logs.push('ERROR: ' + args.join(' '));
    };
    
    try {
      await simpleEncryption.runAllTests();
    } catch (error) {
      logs.push(`Test execution error: ${error.message}`);
    }
    
    // Restore console
    console.log = originalLog;
    console.error = originalError;
    
    setResults(logs.join('\n'));
    setRunning(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>iOS Encryption Test</Text>
        <TouchableOpacity 
          style={[styles.button, running && styles.buttonDisabled]} 
          onPress={runTests}
          disabled={running}
        >
          <Text style={styles.buttonText}>
            {running ? 'Running...' : 'Run Tests'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.results}>
        <Text style={styles.resultsText}>{results || 'Press "Run Tests" to start'}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
    padding: 15,
  },
  resultsText: {
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default TestEncryption;