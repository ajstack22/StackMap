import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles';

const SyncChoiceScreen = ({
  theme,
  onEnableSync,
  onSkip,
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.title}>Enable Sync?</Text>
    <Text style={styles.subtitle}>
      Keep your data synced across all your devices
    </Text>

    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[styles.optionCard, { borderColor: theme.primary }]}
        onPress={onEnableSync}
      >
        <Icon name="sync" size={40} color={theme.primary} />
        <Text style={styles.optionTitle}>Enable Sync</Text>
        <Text style={styles.optionDescription}>
          Zero-knowledge encryption keeps your data private
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={onSkip}
      >
        <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
          Skip for now
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default SyncChoiceScreen;