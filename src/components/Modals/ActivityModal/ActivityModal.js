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
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { EmojiPicker } from '../../';
import { CUSTOM_IMAGE_SOURCES, FEATURE_FLAGS } from '../../../constants';
import { styles } from './styles';

const ActivityModal = ({
  visible,
  onClose,
  theme,
  insets,
  // Form state
  activityTitle,
  setActivityTitle,
  activityDescription,
  setActivityDescription,
  activityEmoji,
  setActivityEmoji,
  activityTime,
  setActivityTime,
  // Edit mode
  editingActivity,
  // Actions
  onSave,
  onReset,
  // Emoji picker
  showEmojiPicker,
  setShowEmojiPicker,
  // Android specific
  getAndroidModalBottomHeight,
}) => {
  const handleClose = () => {
    onClose();
    onReset();
  };

  const handleSave = () => {
    onSave();
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
      <View style={styles.modalContainer}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <Text style={styles.modalTitle}>
              {editingActivity ? 'Edit Activity' : 'New Activity'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
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
              <>
                {/* Emoji Selector */}
                <TouchableOpacity 
                  style={styles.emojiSelector}
                  onPress={() => setShowEmojiPicker(true)}
                >
                  {activityEmoji && activityEmoji.startsWith('image:') ? (
                    <Image 
                      source={CUSTOM_IMAGE_SOURCES[activityEmoji.substring(6)]}
                      style={styles.selectedEmojiImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.selectedEmoji}>{activityEmoji}</Text>
                  )}
                  <Text style={styles.emojiSelectorLabel}>Tap to change</Text>
                </TouchableOpacity>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Activity title"
                    value={activityTitle}
                    onChangeText={setActivityTitle}
                    autoFocus={!editingActivity}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Add more details..."
                    value={activityDescription}
                    onChangeText={setActivityDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Time (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 9:00 AM"
                    value={activityTime}
                    onChangeText={setActivityTime}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.primary }]}
                  onPress={handleSave}
                >
                  <Text style={styles.buttonText}>
                    {editingActivity ? 'Save Changes' : 'Add Activity'}
                  </Text>
                </TouchableOpacity>
              </>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
        <SafeAreaView style={{ backgroundColor: theme.light }} />
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: getAndroidModalBottomHeight(insets) }} />
        )}
        
        {/* Emoji Picker Modal for Add Activity */}
        {showEmojiPicker && (
          <EmojiPicker 
            mode="modal"
            visible={true}
            onClose={() => setShowEmojiPicker(false)}
            onSelect={(emoji) => {
              setActivityEmoji(emoji);
              setShowEmojiPicker(false);
            }}
            showCustomImages={FEATURE_FLAGS.ENABLE_CUSTOM_EMOJIS}
            theme={theme}
            selectedEmoji={activityEmoji}
          />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(ActivityModal);