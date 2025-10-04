import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../../../Typography';

import { styles } from '../styles';

const SyncImportScreen = ({
  theme,
  recoveryPhrase,
  setRecoveryPhrase,
  syncLoading,
  syncError,
  isImporting,
  importError,
  onImport,
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.title}>Join Sync Group</Text>
    <Text style={styles.subtitle}>
      Enter your recovery phrase to join sync
    </Text>

    <View style={styles.inputGroup}>
      <TextInput
        style={styles.input}
        placeholder="Recovery Phrase (32 characters)"
        value={recoveryPhrase}
        onChangeText={setRecoveryPhrase}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
      />
    </View>

    {(syncLoading || isImporting) && (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.processingText}>
          {isImporting ? 'Joining sync...' : 'Validating recovery phrase...'}
        </Text>
        <Text style={styles.processingSubtext}>This may take a moment</Text>
      </View>
    )}

    {(syncError || importError) && (
      <Text style={styles.errorText}>{syncError || importError}</Text>
    )}

    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        onPress={onImport}
        disabled={isImporting || !recoveryPhrase || recoveryPhrase.length !== 32}
      >
        <Text style={styles.buttonText}>Join Sync</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default SyncImportScreen;