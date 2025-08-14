import React, { useState } from 'react';
import { Text } from '../../Typography';
import { View, TouchableOpacity, ScrollView,  } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import ConfirmModal from '../../Modals/ConfirmModal';
import PinModal from '../../Modals/PinModal';

const PINTabContent = ({
  theme,
  hasSecurePin,
  onSetPin,
  onRemovePin,
  onVerifyPin,
  showToast,
  loading,
  setLoading,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPinRemoveConfirm, setShowPinRemoveConfirm] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLength, setPinLength] = useState(4);

  const handlePinSet = () => {
    setIsSettingPin(true);
    setShowPinModal(true);
    setPinInput('');
    setConfirmPin('');
  };

  const handlePinChange = () => {
    setIsSettingPin(false);
    setShowPinModal(true);
    setPinInput('');
  };

  const handlePinRemove = () => {
    setShowPinRemoveConfirm(true);
  };

  const confirmPinRemove = async () => {
    try {
      setLoading(true);
      showToast({ message: 'Removing PIN...' });
      setShowPinRemoveConfirm(false);
      await onRemovePin();
      showToast({ message: 'PIN removed successfully' });
    } catch (error) {
//       console.error('[PINTabContent] Error removing PIN:', error);
      showToast({ message: 'Failed to remove PIN. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPinInput('');
    setConfirmPin('');
    setIsSettingPin(false);
  };

  const handlePinSubmit = async (enteredPin) => {
    // Use the PIN passed from the callback, not the state
    const pinToUse = enteredPin || pinInput;
    
    if (isSettingPin) {
      if (!confirmPin) {
        // First entry, ask for confirmation
        setConfirmPin(pinToUse);
        setPinInput('');
        showToast({ message: 'Enter PIN again to confirm' });
      } else {
        // Confirming PIN
        if (pinToUse === confirmPin) {
          await onSetPin(pinToUse);
          handlePinModalClose();
          showToast({ message: 'PIN set successfully' });
        } else {
          showToast({ message: 'PINs do not match. Try again.', type: 'error' });
          setPinInput('');
          setConfirmPin('');
        }
      }
    } else {
      // Verifying existing PIN
      const isValid = await onVerifyPin(pinToUse);
      if (isValid) {
        handlePinModalClose();
        // If changing PIN, show the set PIN modal
        if (hasSecurePin) {
          setIsSettingPin(true);
          setShowPinModal(true);
          setPinInput('');
          setConfirmPin('');
        }
      } else {
        showToast({ message: 'Incorrect PIN', type: 'error' });
        setPinInput('');
      }
    }
  };

  // Handle PIN input completion - removed to avoid render-time state updates

  return (
    <ScrollView 
      style={styles.tabContent} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={styles.section}>
        {/* Header */}
        <View style={styles.standardTabContainer}>
          <Icon name="lock" size={48} color={theme.primary} />
          <Text style={styles.standardTabTitle}>PIN Security</Text>
          <Text style={styles.standardTabDescription}>
            Add a simple PIN to prevent accidental changes
          </Text>
        </View>
        
        {/* Divider */}
        <View style={styles.divider} />

        <View style={[styles.pinStatus, { borderColor: hasSecurePin ? COLORS.success : COLORS.gray[300] }]}>
          <Icon 
            name={hasSecurePin ? "lock" : "lock-open"} 
            size={24} 
            color={hasSecurePin ? COLORS.success : COLORS.gray[500]}
            style={styles.pinStatusIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.pinStatusText}>
              {hasSecurePin ? 'PIN Enabled' : 'PIN Disabled'}
            </Text>
            <Text style={styles.pinStatusSubtext}>
              {hasSecurePin ? 'Prevents accidental changes to your plans' : 'Quick access without a code'}
            </Text>
          </View>
        </View>

        {hasSecurePin ? (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={handlePinChange}
              disabled={loading}
            >
              <Icon name="lock-reset" size={20} color="white" />
              <Text style={styles.buttonText}>Change Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#e53e3e' }]}
              onPress={handlePinRemove}
              disabled={loading}
            >
              <Icon name="lock-open" size={20} color="white" />
              <Text style={styles.buttonText}>Remove PIN</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handlePinSet}
            disabled={loading}
          >
            <Icon name="lock" size={20} color="white" />
            <Text style={styles.buttonText}>Add PIN</Text>
          </TouchableOpacity>
        )}

        {hasSecurePin && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              💡 Remember your PIN! If forgotten, you'll need to reset the app data.
            </Text>
          </View>
        )}
      </View>

      {/* PIN Removal Confirmation Modal */}
      <ConfirmModal
        visible={showPinRemoveConfirm}
        onClose={() => setShowPinRemoveConfirm(false)}
        onConfirm={confirmPinRemove}
        theme={theme}
        title="Remove PIN"
        message="Are you sure you want to remove the PIN? Edit Mode will be accessible without a code."
        confirmText="Remove PIN"
        confirmButtonColor="#e53e3e"
        icon="lock-open"
        iconColor="#e53e3e"
      />

      {/* PIN Modal */}
      <PinModal
        visible={showPinModal}
        onClose={handlePinModalClose}
        theme={theme}
        pinInput={pinInput}
        pinLength={pinLength}
        setPinInput={setPinInput}
        isSettingPin={isSettingPin}
        confirmPin={confirmPin}
        onPinComplete={handlePinSubmit}
      />
    </ScrollView>
  );
};

export default PINTabContent;