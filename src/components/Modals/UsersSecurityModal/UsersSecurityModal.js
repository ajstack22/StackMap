import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { COLORS } from '../../../constants';

const UsersSecurityModal = ({
  visible,
  onClose,
  theme,
  users,
  currentUser,
  onUserSelect,
  onUserEdit,
  onUserDelete,
  onAddUser,
  hasPinProtection,
  onPinChange,
  onPinRemove,
  onPinEnable,
  showToast,
}) => {
  const insets = useSafeAreaInsets();

  const handleUserSelect = (userId) => {
    onUserSelect(userId);
    showToast({ message: `Switched to ${users[userId].name}` });
  };

  const handleUserDelete = (userId, userName) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${userName}? This will permanently remove the user and all their activity cards.`
      );
      if (confirmed) {
        onUserDelete(userId);
      }
    } else {
      Alert.alert(
        'Delete User',
        `Are you sure you want to delete ${userName}? This will permanently remove the user and all their activity cards.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onUserDelete(userId),
          }
        ]
      );
    }
  };

  const handlePinRemove = () => {
    Alert.alert(
      'Remove PIN Protection',
      'Are you sure you want to remove PIN protection? Anyone will be able to access the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove PIN',
          style: 'destructive',
          onPress: onPinRemove,
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Users & Security</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Users Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Users</Text>
              <Text style={styles.sectionDescription}>
                Manage users and switch between them.
              </Text>

              <View style={styles.usersList}>
                {Object.entries(users)
                  .filter(([userId, user]) => !user.deleted)
                  .map(([userId, user]) => (
                    <TouchableOpacity
                      key={userId}
                      style={[
                        styles.userItem,
                        currentUser === userId && styles.userItemActive
                      ]}
                      onPress={() => handleUserSelect(userId)}
                    >
                      <Text style={styles.userItemEmoji}>{user.icon}</Text>
                      <Text style={[
                        styles.userItemName,
                        currentUser === userId && styles.userItemNameActive
                      ]}>
                        {user.name}
                      </Text>
                      {currentUser === userId && (
                        <View style={styles.enabledBadge}>
                          <Text style={styles.enabledText}>Active</Text>
                        </View>
                      )}
                      <View style={styles.userActions}>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => onUserEdit(userId, user.name, user.icon)}
                        >
                          <Icon name="edit" size={20} color={theme.primary} />
                        </TouchableOpacity>
                        {Object.keys(users).filter(id => !users[id].deleted).length > 1 && (
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleUserDelete(userId, user.name)}
                          >
                            <Icon name="delete" size={20} color="#e53e3e" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
              </View>

              {Object.keys(users).filter(id => !users[id].deleted).length < 5 && (
                <TouchableOpacity style={styles.addButton} onPress={onAddUser}>
                  <Icon name="person-add" size={20} color={COLORS.gray[700]} />
                  <Text style={styles.addButtonText}>Add User</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Security Section */}
            <View style={[styles.section, { borderBottomWidth: 0 }]}>
              <Text style={styles.sectionTitle}>Security</Text>
              <Text style={styles.sectionDescription}>
                Protect your StackMap with a PIN.
              </Text>

              <View style={styles.pinStatus}>
                <Icon 
                  name={hasPinProtection ? "lock" : "lock-open"} 
                  size={20} 
                  color={hasPinProtection ? COLORS.success : COLORS.gray[500]}
                  style={styles.pinStatusIcon}
                />
                <Text style={styles.pinStatusText}>
                  PIN Protection is {hasPinProtection ? 'enabled' : 'disabled'}
                </Text>
                {hasPinProtection && (
                  <View style={styles.enabledBadge}>
                    <Text style={styles.enabledText}>Active</Text>
                  </View>
                )}
              </View>

              {hasPinProtection ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={onPinChange}
                  >
                    <Icon name="lock-reset" size={20} color="white" />
                    <Text style={styles.buttonText}>Change PIN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#e53e3e' }]}
                    onPress={handlePinRemove}
                  >
                    <Icon name="lock-open" size={20} color="white" />
                    <Text style={styles.buttonText}>Remove PIN</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.primary }]}
                  onPress={onPinEnable}
                >
                  <Icon name="lock" size={20} color="white" />
                  <Text style={styles.buttonText}>Enable PIN Protection</Text>
                </TouchableOpacity>
              )}

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  {hasPinProtection 
                    ? '⚠️ Make sure to remember your PIN. If forgotten, you\'ll need to reset the app.'
                    : 'ℹ️ A PIN adds security by requiring a code to access the app.'
                  }
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default UsersSecurityModal;