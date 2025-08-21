import React, { useEffect } from 'react';
import { Text, TextInput } from '../../Typography';
import { Modal, View, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

const PinModal = ({
  visible,
  onClose,
  theme,
  pinInput,
  pinLength,
  setPinInput,
  isSettingPin,
  confirmPin,
  onPinComplete,
}) => {
  // No need to clear PIN on unmount - handled by parent
  const handleNumberPress = num => {
    if (isSettingPin && confirmPin) {
      // During confirmation, we still use pinInput
      if (pinInput.length < 4) {
        const newPin = pinInput + num;
        setPinInput(newPin);
        // Check if PIN is complete and call callback
        if (newPin.length === 4 && onPinComplete) {
          // Pass the PIN directly to avoid state sync issues
          onPinComplete(newPin);
        }
      }
    } else {
      // Initial PIN entry
      if (pinInput.length < 4) {
        const newPin = pinInput + num;
        setPinInput(newPin);
        // Check if PIN is complete and call callback
        if (newPin.length === 4 && onPinComplete) {
          // Pass the PIN directly to avoid state sync issues
          onPinComplete(newPin);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPinInput(pinInput.slice(0, -1));
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={true}
    >
      <View style={styles.pinModalOverlay}>
        <View style={styles.pinModalContent}>
          <Text style={styles.pinModalTitle}>
            {isSettingPin
              ? confirmPin
                ? 'Confirm PIN'
                : 'Set New PIN'
              : 'Enter PIN'}
          </Text>

          <View style={styles.pinInputContainer}>
            {[0, 1, 2, 3].map(index => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  { borderColor: theme.primary },
                  pinInput.length > index && [
                    styles.pinDotFilled,
                    {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                    },
                  ],
                ]}
              />
            ))}
          </View>

          {/* Text input for desktop web */}
          {Platform.OS === 'web' && (
            <TextInput
              style={[styles.pinTextInput, { borderColor: theme.primary }]}
              value={pinInput}
              onChangeText={text => {
                // Only allow numeric input up to 4 digits
                const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
                setPinInput(numericText);
                // Auto-submit when 4 digits are entered
                if (numericText.length === 4 && onPinComplete) {
                  onPinComplete(numericText);
                }
              }}
              onSubmitEditing={() => {
                // Handle Enter key press - trigger PIN verification if 4 digits entered
                if (pinInput.length === 4 && onPinComplete) {
                  onPinComplete(pinInput);
                }
              }}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={4}
              autoFocus
              secureTextEntry
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
            />
          )}

          {/* Only show keypad on mobile platforms */}
          {Platform.OS !== 'web' && (
            <View style={styles.pinKeypad}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
                <TouchableOpacity
                  key={num}
                  style={styles.pinKey}
                  onPress={() => handleNumberPress(num)}
                >
                  <Text style={styles.pinKeyText}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.pinKey} onPress={handleBackspace}>
                <Icon name="backspace" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          )}

          {isSettingPin && (
            <Text style={styles.pinHelperText}>
              {!confirmPin
                ? 'Enter a 4-digit PIN'
                : pinInput.length === 4
                ? 'PIN confirmed! Processing...'
                : `Re-enter PIN to confirm (${pinInput.length}/4)`}
            </Text>
          )}

          <View style={styles.pinModalButtonContainer}>
            {/* Add Submit button for web */}
            {Platform.OS === 'web' && pinInput.length === 4 && (
              <TouchableOpacity
                style={[
                  styles.pinSubmitButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={() => onPinComplete && onPinComplete(pinInput)}
              >
                <Text style={styles.pinSubmitText}>Submit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.pinCancelButton}
              onPress={handleCancel}
            >
              <Text style={[styles.pinCancelText, { color: theme.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(PinModal);
