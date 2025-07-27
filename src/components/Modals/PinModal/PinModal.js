import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
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
}) => {
  // No need to clear PIN on unmount - handled by parent
  const handleNumberPress = (num) => {
    if (isSettingPin && confirmPin) {
      // During confirmation, we still use pinInput
      if (pinInput.length < 4) {
        setPinInput(pinInput + num);
      }
    } else {
      // Initial PIN entry
      if (pinInput.length < 4) {
        setPinInput(pinInput + num);
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
    >
      <View style={styles.pinModalOverlay}>
        <View style={styles.pinModalContent}>
          <Text style={styles.pinModalTitle}>
            {isSettingPin ? 
              (confirmPin ? 'Confirm PIN' : 'Set New PIN') : 
              'Enter PIN'}
          </Text>
          
          <View style={styles.pinInputContainer}>
            {[0, 1, 2, 3].map(index => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  { borderColor: theme.primary },
                  pinLength > index && [
                    styles.pinDotFilled,
                    { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]
                ]}
              />
            ))}
          </View>
          
          {/* Text input for desktop web */}
          {Platform.OS === 'web' && (
            <TextInput
              style={[styles.pinTextInput, { borderColor: theme.primary }]}
              value={pinInput}
              onChangeText={(text) => {
                // Only allow numeric input up to 4 digits
                const numericText = text.replace(/[^0-9]/g, '').slice(0, 4);
                setPinInput(numericText);
              }}
              onSubmitEditing={() => {
                // Handle Enter key press - trigger PIN verification if 4 digits entered
                if (pinInput.length === 4) {
                  // The useEffect will handle the verification automatically
                }
              }}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={4}
              autoFocus
              secureTextEntry
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
              <TouchableOpacity
                style={styles.pinKey}
                onPress={handleBackspace}
              >
                <Icon name="backspace" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          
          {isSettingPin && (
            <Text style={styles.pinHelperText}>
              {!confirmPin ? 
                'Enter a 4-digit PIN' : 
                (pinLength === 4 ? 
                  'PIN confirmed! Processing...' : 
                  `Re-enter PIN to confirm (${pinLength}/4)`)}
            </Text>
          )}
          
          <View style={styles.pinModalButtonContainer}>
            <TouchableOpacity
              style={styles.pinCancelButton}
              onPress={handleCancel}
            >
              <Text style={[styles.pinCancelText, { color: theme.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(PinModal);