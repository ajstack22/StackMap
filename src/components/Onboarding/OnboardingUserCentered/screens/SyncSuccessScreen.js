import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles';

const SyncSuccessScreen = ({
  theme,
  generatedSyncCode,
  importResult,
  onContinue,
}) => (
  <View style={styles.stepContainer}>
    <Icon name="check-circle" size={80} color={theme.primary} />
    <Text style={styles.title}>
      {importResult ? 'Data Imported!' : 'Sync Enabled!'}
    </Text>
    <Text style={styles.subtitle}>
      {importResult
        ? 'Your data has been successfully restored'
        : 'Your devices will now stay in sync'}
    </Text>

    {generatedSyncCode && (
      <View style={styles.successInfo}>
        <Text style={styles.infoText}>
          Recovery phrase saved. Use it to connect other devices.
        </Text>
      </View>
    )}

    {importResult && (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Import Summary:</Text>
        <Text style={styles.summaryText}>
          • {importResult.userCount || 0} user{importResult.userCount !== 1 ? 's' : ''} imported
        </Text>
        <Text style={styles.summaryText}>
          • {importResult.activityCount || 0} activities imported
        </Text>
      </View>
    )}

    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: theme.primary }]}
      onPress={onContinue}
    >
      <Text style={styles.buttonText}>Continue</Text>
    </TouchableOpacity>
  </View>
);

export default SyncSuccessScreen;