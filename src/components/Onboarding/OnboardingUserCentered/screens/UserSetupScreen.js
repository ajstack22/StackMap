import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, TextInput } from '../../../Typography';
import { styles } from '../styles';
import { DEFAULT_USER_ICON } from '../../../../constants';

const quickEmojis = ['🐶', '🦊', '🎨', '⚽', '🚀', '🌟'];

const UserSetupScreen = ({
  theme,
  users,
  userName,
  setUserName,
  selectedEmoji,
  setSelectedEmoji,
  userJourney,
  onAddUser,
  onContinue,
}) => {
  const handleAddUser = () => {
    if (userName.trim()) {
      const newUser = {
        id: Date.now().toString(),
        name: userName.trim(),
        icon: selectedEmoji,
      };
      onAddUser(newUser);
      setUserName('');
      setSelectedEmoji(DEFAULT_USER_ICON);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>
        {!users.length ? 'Create Your First User' : 'Add Another User?'}
      </Text>
      <Text style={styles.subtitle}>
        {userJourney.userType === 'helper'
          ? 'Add the person you\'re helping'
          : 'Set up your profile'}
      </Text>

      {!!users.length && (
        <View style={styles.usersList}>
          {users.map(user => (
            <View key={user.id} style={styles.userPill}>
              <Text style={styles.userPillEmoji}>{user.icon}</Text>
              <Text style={styles.userPillName}>{user.name}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="Enter name"
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="words"
        />

        <View style={styles.emojiSelector}>
          {quickEmojis.map(emoji => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.emojiOption,
                selectedEmoji === emoji && { backgroundColor: theme.light },
              ]}
              onPress={() => setSelectedEmoji(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={handleAddUser}
          disabled={!userName.trim()}
        >
          <Text style={styles.buttonText}>
            {!users.length ? 'Add User' : 'Add Another'}
          </Text>
        </TouchableOpacity>

        {!!users.length && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onContinue}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
              Continue
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default UserSetupScreen;