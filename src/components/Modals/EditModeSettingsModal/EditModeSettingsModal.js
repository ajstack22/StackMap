import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../../constants';
import { styles } from './styles';

const EditModeSettingsModal = ({
  visible,
  onClose,
  theme,
  insets,
  // Settings
  users,
  currentUser,
  dayMode,
  setDayMode,
  hasPinProtection,
  // Settings key
  settingsScrollKey,
  // Actions
  onUserSelect,
  onUserEdit,
  onUserDelete,
  onAddUser,
  onPinChange,
  onPinRemove,
  onPinEnable,
  onExportData,
  onImportData,
  onResetApp,
  // Toast
  showToast,
  // Android specific
  getAndroidModalBottomHeight,
}) => {
  const settingsScrollRef = useRef(null);

  const handleUserSelect = (userId) => {
    onUserSelect(userId);
  };

  const handleUserDelete = (userId, userName) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${userName}? This will permanently remove the user and all their activity cards for all days.`
      );
      if (confirmed) {
        onUserDelete(userId);
      }
    } else {
      Alert.alert(
        'Delete User',
        `Are you sure you want to delete ${userName}? This will permanently remove the user and all their activity cards for all days.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onUserDelete(userId)
          }
        ]
      );
    }
  };

  const handlePinRemove = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to remove PIN protection?');
      if (confirmed) {
        await onPinRemove();
      }
    } else {
      Alert.alert(
        'Remove PIN',
        'Are you sure you want to remove PIN protection?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: onPinRemove
          }
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
      onShow={() => {
        // Force layout update on Android to fix scrolling
        if (Platform.OS === 'android') {
          setTimeout(() => {
            settingsScrollRef.current?.scrollTo({ y: 0, animated: false });
          }, 0);
        }
      }}
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
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <ScrollView 
          key={settingsScrollKey}
          ref={settingsScrollRef}
          style={{ flex: 1, backgroundColor: theme.light }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          collapsable={false}
          nestedScrollEnabled={true}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* User Management Section */}
            <Text style={styles.sectionTitle}>Users</Text>
            <View style={styles.usersList}>
              {Object.entries(users).map(([userId, user]) => (
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
                    <Icon name="check" size={20} color={theme.primary} />
                  )}
                  <TouchableOpacity
                    style={styles.editUserButton}
                    onPress={() => onUserEdit(userId, user.name, user.icon)}
                  >
                    <Icon name="edit" size={18} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteUserButton}
                    onPress={() => handleUserDelete(userId, user.name)}
                  >
                    <Icon name="delete" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addUserButton}
                onPress={onAddUser}
              >
                <Icon name="add" size={24} color={theme.primary} />
                <Text style={styles.addUserText}>Add User</Text>
              </TouchableOpacity>
            </View>
            
            {/* Day Mode Section */}
            <Text style={styles.sectionTitle}>Day Mode</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggle, dayMode === 'today' && styles.toggleActive]}
                onPress={() => setDayMode('today')}
              >
                <Text style={[styles.toggleText, dayMode === 'today' && styles.toggleTextActive]}>
                  Today Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, dayMode === 'both' && styles.toggleActive]}
                onPress={() => setDayMode('both')}
              >
                <Text style={[styles.toggleText, dayMode === 'both' && styles.toggleTextActive]}>
                  Today & Tomorrow
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Edit Mode PIN Section */}
            <Text style={styles.sectionTitle}>PIN Protection</Text>
            <View style={styles.pinSection}>
              {hasPinProtection ? (
                <>
                  <Text style={styles.pinStatus}>PIN protection is enabled</Text>
                  <View style={styles.pinButtons}>
                    <TouchableOpacity
                      style={[styles.pinButton, { backgroundColor: theme.primary }]}
                      onPress={onPinChange}
                    >
                      <Text style={styles.pinButtonText}>Change PIN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pinButton, { backgroundColor: '#f56565' }]}
                      onPress={handlePinRemove}
                    >
                      <Text style={styles.pinButtonText}>Remove PIN</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.pinStatus}>No PIN set</Text>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]}
                    onPress={onPinEnable}
                  >
                    <Icon name="lock" size={20} color="white" />
                    <Text style={styles.buttonText}>Enable PIN</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            {/* Data Management Section */}
            <Text style={styles.sectionTitle}>Data Management</Text>
            <View style={styles.settingsSection}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary, marginBottom: 10 }]}
                onPress={onExportData}
              >
                <Icon name="save-alt" size={20} color="white" />
                <Text style={styles.buttonText}>Export Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={onImportData}
              >
                <Icon name="folder-open" size={20} color="white" />
                <Text style={styles.buttonText}>Import Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: COLORS.error, marginTop: 20 }]}
                onPress={onResetApp}
              >
                <Icon name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>Reset App</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </ScrollView>
        <SafeAreaView style={{ backgroundColor: theme.light }} />
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: getAndroidModalBottomHeight(insets) }} />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(EditModeSettingsModal);