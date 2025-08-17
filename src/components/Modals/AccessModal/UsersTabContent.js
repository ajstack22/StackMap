import React, { useState } from 'react';
import { Text } from '../../Typography';
import { View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import ConfirmModal from '../../Modals/ConfirmModal';
import AddUserModal from '../../Modals/AddUserModal/AddUserModal';
import { DEFAULT_USER_ICON } from '../../../constants';

const UsersTabContent = ({
  theme,
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onSelectUser,
  onDeleteUser,
  showToast,
  loading,
  setLoading,
  insets,
  getAndroidModalBottomHeight,
}) => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmoji, setNewUserEmoji] = useState(DEFAULT_USER_ICON);
  const [showUserEmojiPicker, setShowUserEmojiPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const handleUserSelect = userId => {
    onSelectUser(userId);
    const userName =
      typeof users[userId]?.name === 'string'
        ? users[userId].name
        : String(users[userId]?.name || 'User');
    showToast({ message: `Switched to ${userName}` });
  };

  const handleUserDelete = (userId, userName) => {
    // Ensure userName is a string
    const name =
      typeof userName === 'string' ? userName : String(userName || 'User');
    setUserToDelete({ id: userId, name: name });
    setShowDeleteConfirm(true);
  };

  const confirmUserDelete = () => {
    if (userToDelete) {
      onDeleteUser(userToDelete.id);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleAddUser = async (userName, userEmoji) => {
    setLoading(true);
    try {
      // Call onAddUser with both parameters as expected by App.js
      await onAddUser(userName, userEmoji);
      setShowAddUserModal(false);
      setEditingUser(null);
    } catch (error) {
      showToast({ message: 'Failed to add user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, userName, userEmoji) => {
    setLoading(true);
    try {
      // Call the onUpdateUser prop passed from App.js
      if (onUpdateUser) {
        onUpdateUser(userId, userName, userEmoji);
        setShowAddUserModal(false);
        setEditingUser(null);
        setNewUserName('');
        setNewUserEmoji(DEFAULT_USER_ICON);
      }
    } catch (error) {
      showToast({ message: 'Failed to update user', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={styles.section}>
        {/* Header */}
        <View style={styles.standardTabContainer}>
          <Icon name="group" size={48} color={theme.primary} />
          <Text style={styles.standardTabTitle}>Manage Users</Text>
          <Text style={styles.standardTabDescription}>
            Switch between users or add new ones
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={styles.usersList}>
          {Object.entries(users)
            .filter(([userId, user]) => !user.deleted)
            .map(([userId, user]) => (
              <TouchableOpacity
                key={userId}
                style={[
                  styles.userItem,
                  currentUser === userId && styles.userItemActive,
                ]}
                onPress={() => handleUserSelect(userId)}
              >
                <Text style={styles.userItemEmoji}>
                  {user.icon || user.emoji || DEFAULT_USER_ICON}
                </Text>
                <Text
                  style={[
                    styles.userItemName,
                    currentUser === userId && styles.userItemNameActive,
                  ]}
                >
                  {typeof user.name === 'string'
                    ? user.name
                    : String(user.name || 'User')}
                </Text>
                {currentUser === userId && (
                  <View style={styles.enabledBadge}>
                    <Text style={styles.enabledText}>Active</Text>
                  </View>
                )}
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => {
                      setEditingUser({
                        id: userId,
                        name: user.name,
                        icon: user.icon,
                      });
                      setNewUserName(user.name);
                      setNewUserEmoji(user.icon);
                      setShowAddUserModal(true);
                    }}
                  >
                    <Icon name="edit" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  {Object.keys(users).filter(id => !users[id].deleted).length >
                    1 && (
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
          <TouchableOpacity
            style={[styles.addUserButton, { borderColor: theme.primary }]}
            onPress={() => {
              setEditingUser(null);
              setNewUserName('');
              setNewUserEmoji(DEFAULT_USER_ICON);
              setShowAddUserModal(true);
            }}
          >
            <Icon name="person-add" size={20} color={theme.primary} />
            <Text style={[styles.addUserText, { color: theme.primary }]}>
              Add User
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmUserDelete}
        theme={theme}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.name}? This will permanently remove the user and all their activity cards.`}
        confirmText="Delete"
        confirmButtonColor="#e53e3e"
        icon="delete"
        iconColor="#e53e3e"
      />

      {/* Add/Edit User Modal */}
      <AddUserModal
        visible={showAddUserModal}
        onClose={() => {
          setShowAddUserModal(false);
          setEditingUser(null);
        }}
        theme={theme}
        insets={insets}
        newUserName={newUserName}
        setNewUserName={setNewUserName}
        newUserEmoji={newUserEmoji}
        setNewUserEmoji={setNewUserEmoji}
        showUserEmojiPicker={showUserEmojiPicker}
        setShowUserEmojiPicker={setShowUserEmojiPicker}
        editingUser={editingUser}
        users={users}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        showToast={showToast}
        getAndroidModalBottomHeight={getAndroidModalBottomHeight}
      />
    </ScrollView>
  );
};

export default UsersTabContent;
