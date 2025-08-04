import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

const ConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  theme,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonColor,
  icon,
  iconColor,
}) => {
  const handleConfirm = () => {
    onConfirm();
    // Don't auto-close - let the parent handle closing
    // This prevents the modal from closing before async operations complete
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
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleCancel}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={() => {}}
        >
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: (iconColor || theme.primary) + '20' }]}>
              <Icon name={icon} size={40} color={iconColor || theme.primary} />
            </View>
          )}
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmButtonColor || theme.primary }
              ]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText} numberOfLines={2}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ConfirmModal;