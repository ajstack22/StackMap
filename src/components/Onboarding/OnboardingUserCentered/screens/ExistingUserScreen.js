import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles';

const ExistingUserScreen = ({
  theme,
  onJoinSync,
  onImportBackup,
  onStartFresh,
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.title}>Restore Your StackMap</Text>
    <Text style={styles.subtitle}>
      How would you like to recover your data?
    </Text>

    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[styles.optionCard, { borderColor: theme.primary }]}
        onPress={onJoinSync}
        accessibilityLabel="Join Sync - Connect to an existing sync group"
      >
        <Icon name="cloud-download" size={40} color={theme.primary} />
        <Text style={styles.optionTitle}>Join Sync</Text>
        <Text style={styles.optionDescription}>
          Connect with your other devices using a sync code
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionCard, { borderColor: theme.primary }]}
        onPress={onImportBackup}
      >
        <Icon name="upload-file" size={40} color={theme.primary} />
        <Text style={styles.optionTitle}>Import Backup</Text>
        <Text style={styles.optionDescription}>
          Restore from a local backup file
        </Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={styles.skipButton}
      onPress={onStartFresh}
    >
      <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
        Start fresh instead
      </Text>
    </TouchableOpacity>
  </View>
);

export default ExistingUserScreen;