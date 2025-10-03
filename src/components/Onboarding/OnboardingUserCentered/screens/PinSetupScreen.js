import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, TextInput } from '../../../Typography';
import { styles } from '../styles';

const PinSetupScreen = ({
  theme,
  pin,
  setPin,
  confirmPin,
  setConfirmPin,
  pinError,
  onSetPin,
  onSkip,
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.title}>Protect with PIN?</Text>
    <Text style={styles.subtitle}>
      Keep your StackMap secure with a 4-digit PIN
    </Text>

    <View style={styles.inputGroup}>
      <TextInput
        style={styles.input}
        placeholder="Enter 4-digit PIN"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        secureTextEntry
        maxLength={4}
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
      />

      {pin.length === 4 && (
        <TextInput
          style={styles.input}
          placeholder="Confirm PIN"
          value={confirmPin}
          onChangeText={setConfirmPin}
          keyboardType="numeric"
          secureTextEntry
          maxLength={4}
          autoComplete="off"
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
        />
      )}

      {!!pinError && (
        <Text style={styles.errorText}>{pinError}</Text>
      )}
    </View>

    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        onPress={onSetPin}
        disabled={pin.length !== 4 || confirmPin.length !== 4}
      >
        <Text style={styles.buttonText}>Set PIN</Text>
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

export default PinSetupScreen;