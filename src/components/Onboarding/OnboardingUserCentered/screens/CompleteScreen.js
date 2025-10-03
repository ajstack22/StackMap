import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles';

const CompleteScreen = ({
  theme,
  users,
  userJourney,
  onComplete,
}) => (
  <View style={styles.stepContainer}>
    <Icon name="celebration" size={80} color={theme.primary} />
    <Text style={styles.title}>All Set!</Text>
    <Text style={styles.subtitle}>
      Your StackMap is ready to use
    </Text>

    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Your Setup:</Text>
      <Text style={styles.summaryText}>
        • {users.length} user{users.length !== 1 ? 's' : ''} created
      </Text>
      {!!userJourney.pinEnabled && (
        <Text style={styles.summaryText}>• PIN protection enabled</Text>
      )}
      {!!userJourney.syncEnabled && (
        <Text style={styles.summaryText}>• Sync enabled</Text>
      )}
    </View>

    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: theme.primary }]}
      onPress={onComplete}
    >
      <Text style={styles.buttonText}>Start Using StackMap</Text>
    </TouchableOpacity>
  </View>
);

export default CompleteScreen;