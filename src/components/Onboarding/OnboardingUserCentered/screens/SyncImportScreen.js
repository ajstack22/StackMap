import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles';

const SyncImportScreen = ({
  theme,
  inviteCode,
  setInviteCode,
  recoveryPhrase,
  setRecoveryPhrase,
  syncPreviewData,
  syncLoading,
  syncError,
  isImporting,
  importError,
  onImport,
  onFetchPreview,
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.title}>Join Sync Group</Text>
    <Text style={styles.subtitle}>
      Enter your sync details to restore your data
    </Text>

    <View style={styles.inputGroup}>
      <TextInput
        style={styles.input}
        placeholder="Invite Code (optional)"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoCapitalize="none"
        autoCorrect={false}
      />

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

    {syncPreviewData && (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Found Sync Group:</Text>
        <Text style={styles.previewText}>
          • {syncPreviewData.userCount || 0} user{syncPreviewData.userCount !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.previewText}>
          • {syncPreviewData.activityCount || 0} activities
        </Text>
        {syncPreviewData.lastSync && (
          <Text style={styles.previewText}>
            • Last updated: {new Date(syncPreviewData.lastSync).toLocaleDateString()}
          </Text>
        )}
      </View>
    )}

    {(syncLoading || isImporting) && (
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.processingText}>
          {isImporting ? 'Importing data...' : 'Fetching preview...'}
        </Text>
        <Text style={styles.processingSubtext}>This may take a moment</Text>
      </View>
    )}

    {(syncError || importError) && (
      <Text style={styles.errorText}>{syncError || importError}</Text>
    )}

    <View style={styles.optionsContainer}>
      {!syncPreviewData ? (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={onFetchPreview}
          disabled={syncLoading || !inviteCode}
        >
          <Text style={styles.buttonText}>Fetch Preview</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={onImport}
          disabled={isImporting || !recoveryPhrase}
        >
          <Text style={styles.buttonText}>Import Data</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default SyncImportScreen;