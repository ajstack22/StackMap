import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { COLORS } from '../../../constants';
import ConfirmModal from '../ConfirmModal';

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
  const [showPinRemoveConfirm, setShowPinRemoveConfirm] = useState(false);

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
    setShowPinRemoveConfirm(true);
  };
  
  const confirmPinRemove = () => {
    showToast({ message: 'Removing PIN...' });
    onPinRemove();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {Platform.OS === 'android' && (
        <StatusBar 
          backgroundColor={theme.primary} 
          barStyle="light-content" 
          translucent={false}
        />
      )}
      <View style={[styles.modalContainer, { backgroundColor: theme.primary }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <View style={styles.headerLeft}>
              <Icon name="group" size={24} color="white" style={styles.headerIcon} />
              <Text style={styles.modalTitle}>Users & Security</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: theme.light }}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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
                <TouchableOpacity style={[styles.addUserButton, { borderColor: theme.primary }]} onPress={onAddUser}>
                  <Icon name="person-add" size={20} color={theme.primary} />
                  <Text style={[styles.addUserText, { color: theme.primary }]}>Add User</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Security Section */}
            <View style={[styles.section, { borderBottomWidth: 0 }]}>
              <Text style={styles.sectionTitle}>Security</Text>
              <Text style={styles.sectionDescription}>
                Add a simple PIN to prevent accidental changes.
              </Text>

              <View style={[styles.pinStatus, { borderColor: hasPinProtection ? COLORS.success : COLORS.gray[300] }]}>
                <Icon 
                  name={hasPinProtection ? "lock" : "lock-open"} 
                  size={24} 
                  color={hasPinProtection ? COLORS.success : COLORS.gray[500]}
                  style={styles.pinStatusIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinStatusText}>
                    {hasPinProtection ? 'PIN Enabled' : 'PIN Disabled'}
                  </Text>
                  <Text style={styles.pinStatusSubtext}>
                    {hasPinProtection ? 'Prevents accidental changes to your plans' : 'Quick access without a code'}
                  </Text>
                </View>
              </View>

              {hasPinProtection ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={onPinChange}
                  >
                    <Icon name="lock-reset" size={20} color="white" />
                    <Text style={styles.buttonText}>Change Code</Text>
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
                  <Text style={styles.buttonText}>Add PIN</Text>
                </TouchableOpacity>
              )}

              {hasPinProtection && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    💡 Remember your PIN! If forgotten, you'll need to reset the app data.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        <SafeAreaView style={{ backgroundColor: theme.light }} />
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
    </Modal>
  );
};

export default UsersSecurityModal;