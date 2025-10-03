import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from '../styles';

const UserTypeScreen = ({
  theme,
  onSelectUserType,
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.title}>Who will use StackMap?</Text>
    <Text style={styles.subtitle}>
      This helps us customize your experience
    </Text>

    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[styles.optionCard, { borderColor: theme.primary }]}
        onPress={() => onSelectUserType('self')}
        accessibilityLabel="Just Me - Set up for personal use only"
      >
        <Icon name="person" size={40} color={theme.primary} />
        <Text style={styles.optionTitle}>Just Me</Text>
        <Text style={styles.optionDescription}>
          I'll use this for my own activities
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionCard, { borderColor: theme.primary }]}
        onPress={() => onSelectUserType('helper')}
        accessibilityLabel="Helper/Caregiver - Set up to assist someone else"
      >
        <Icon name="supervisor-account" size={40} color={theme.primary} />
        <Text style={styles.optionTitle}>I'm Helping Someone</Text>
        <Text style={styles.optionDescription}>
          Parent, caregiver, or teacher
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.optionCard, { borderColor: theme.primary }]}
        onPress={() => onSelectUserType('group')}
      >
        <Icon name="groups" size={40} color={theme.primary} />
        <Text style={styles.optionTitle}>Multiple People</Text>
        <Text style={styles.optionDescription}>
          Family or classroom sharing
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default UserTypeScreen;