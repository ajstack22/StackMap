import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EmojiPicker from '../../EmojiPicker';
import { FEATURE_FLAGS } from '../../../constants';
import { styles } from './styles';

const AddUserModal = ({
  visible,
  onClose,
  theme,
  insets,
  // State
  newUserName,
  setNewUserName,
  newUserEmoji,
  setNewUserEmoji,
  showUserEmojiPicker,
  setShowUserEmojiPicker,
  editingUser,
  users,
  // Actions
  onAddUser,
  onUpdateUser,
  showToast,
  getAndroidModalBottomHeight,
}) => {
  const handleClose = () => {
    setNewUserName('');
    setNewUserEmoji('😀');
    setShowUserEmojiPicker(false);
    onClose();
  };

  const handleSave = () => {
    if (!newUserName.trim()) {
      Alert.alert('Error', 'Please enter a user name');
      return;
    }

    if (editingUser) {
      onUpdateUser(editingUser, newUserName.trim(), newUserEmoji);
    } else {
      onAddUser(newUserName.trim(), newUserEmoji);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
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
              <Icon name={editingUser ? "edit" : "person-add"} size={24} color="white" style={styles.headerIcon} />
              <Text style={styles.modalTitle}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={{ padding: 8 }}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: theme.light }}>
          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Emoji Selector */}
              <TouchableOpacity 
                style={styles.emojiSelector}
                onPress={() => setShowUserEmojiPicker(!showUserEmojiPicker)}
              >
                <Text style={styles.selectedEmoji}>{newUserEmoji}</Text>
                <Text style={styles.emojiSelectorLabel}>Tap to change</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="User name"
                value={newUserName}
                onChangeText={setNewUserName}
                autoFocus
              />
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>
                  {editingUser ? 'Save Changes' : 'Add User'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
        <SafeAreaView style={{ backgroundColor: theme.light }} />
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.light, height: getAndroidModalBottomHeight(insets) }} />
        )}
        
        {/* User Emoji Picker Modal */}
        {showUserEmojiPicker && (
          <EmojiPicker 
            mode="modal"
            visible={true}
            onClose={() => setShowUserEmojiPicker(false)}
            onSelect={(emoji) => {
              setNewUserEmoji(emoji);
              setShowUserEmojiPicker(false);
            }}
            theme={theme}
            selectedEmoji={newUserEmoji}
            showCustomImages={FEATURE_FLAGS.ENABLE_CUSTOM_EMOJIS}
          />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(AddUserModal);