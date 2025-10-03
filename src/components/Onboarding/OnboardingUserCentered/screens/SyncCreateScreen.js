import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, Platform, Clipboard } from 'react-native';
import { Text } from '../../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles';

const SyncCreateScreen = ({
  theme,
  generatedSyncCode,
  syncLoading,
  syncError,
  onCreateSync,
  onSkip,
}) => {
  const copyToClipboard = async () => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(generatedSyncCode);
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = generatedSyncCode;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } else {
      Clipboard.setString(generatedSyncCode);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Create Sync Group</Text>
      <Text style={styles.subtitle}>
        Set up secure sync across your devices
      </Text>

      {generatedSyncCode && !syncLoading && (
        <View style={styles.syncCodeContainer}>
          <Text style={styles.syncCode}>{generatedSyncCode}</Text>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: theme.primary }]}
            onPress={copyToClipboard}
          >
            <Icon name="content-copy" size={20} color="#fff" />
            <Text style={styles.copyButtonText}>Copy Recovery Phrase</Text>
          </TouchableOpacity>
          <Text style={styles.syncCodeHint}>
            Save this phrase securely - you'll need it to connect other devices
          </Text>
        </View>
      )}

      {syncLoading && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.processingText}>Creating sync group...</Text>
          <Text style={styles.processingSubtext}>This may take a moment</Text>
        </View>
      )}

      {syncError && (
        <Text style={styles.errorText}>{syncError}</Text>
      )}

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={onCreateSync}
          disabled={syncLoading}
        >
          <Text style={styles.buttonText}>
            {syncError ? 'Try Again' : 'Create Sync'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={onSkip}
          disabled={syncLoading}
        >
          <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SyncCreateScreen;