import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles';

const DeviceStrategyScreen = ({
  theme,
  onSelectStrategy,
  onSkip,
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.title}>How many devices?</Text>
    <Text style={styles.subtitle}>
      Will you use StackMap on multiple devices?
    </Text>

    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[styles.optionCard, { borderColor: theme.primary }]}
        onPress={() => onSelectStrategy('single')}
      >
        <Icon name="smartphone" size={40} color={theme.primary} />
        <Text style={styles.optionTitle}>Just This Device</Text>
        <Text style={styles.optionDescription}>
          I'll only use StackMap here
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionCard, { borderColor: theme.primary }]}
        onPress={() => onSelectStrategy('multi')}
      >
        <Icon name="devices" size={40} color={theme.primary} />
        <Text style={styles.optionTitle}>Multiple Devices</Text>
        <Text style={styles.optionDescription}>
          Phone, tablet, computer, etc.
        </Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={styles.skipButton}
      onPress={onSkip}
    >
      <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>
        I'll decide later
      </Text>
    </TouchableOpacity>
  </View>
);

export default DeviceStrategyScreen;