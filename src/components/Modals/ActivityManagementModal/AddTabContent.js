import React, { useState, useEffect } from 'react';
import { Text } from '../../Typography';
import { View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput } from '../../ModalUtilities';
import EmojiPicker from '../../EmojiPicker';
import TimePicker from '../../TimePicker';
import { styles } from './styles';
import { DEFAULT_ACTIVITY_EMOJI } from '../../../constants';
import { generateSecureRandomString } from '../../../utils/secureId';

const AddTabContent = ({
  theme,
  categories = [],
  onAddActivity,
  showToast,
  loading,
  prefilledActivity = null,
  prefilledCategory = null,
  onClose,
}) => {
  const [activityText, setActivityText] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [activityIcon, setActivityIcon] = useState(DEFAULT_ACTIVITY_EMOJI);
  const [activityTime, setActivityTime] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [errors, setErrors] = useState({});

  // Prefill form when coming from library
  useEffect(() => {
    if (prefilledActivity) {
      setActivityText(prefilledActivity.text || '');
      setActivityDescription(prefilledActivity.description || '');
      setActivityIcon(prefilledActivity.icon || DEFAULT_ACTIVITY_EMOJI);
      // Category selection removed - always uses My Templates
    }
  }, [prefilledActivity, prefilledCategory]);

  const validateForm = () => {
    const newErrors = {};

    if (!activityText.trim()) {
      newErrors.text = 'Activity name is required';
    }

    // Time validation removed - now using time picker

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndReturn = async () => {
    if (!validateForm()) {
      showToast({ message: 'Please fix the errors', type: 'error' });
      return;
    }

    // Generate enhanced activity ID with device ID
    const deviceId = await (async () => {
      try {
        const encryptionService = (
          await import('../../../services/sync/encryptionServiceFixed')
        ).default;
        return await encryptionService.getDeviceId();
      } catch (error) {
        return 'unknown';
      }
    })();

    const activityData = {
      id: `${deviceId}-${Date.now()}-${generateSecureRandomString(9)}`,
      text: activityText.trim(),
      description: activityDescription.trim(),
      icon: activityIcon,
      completed: false,
      pinned: false,
      ...(activityTime && { time: activityTime }),
    };

    // Add to current day
    await onAddActivity(activityData);

    // Close the modal
    if (onClose) {
      onClose();
    }
  };

  const handleEmojiSelect = icon => {
    setActivityIcon(icon);
    setShowEmojiPicker(false);
  };

  // Wrap entire content in a gesture-capturing view for Android
  const ContentWrapper = Platform.OS === 'android' ? View : React.Fragment;
  const wrapperProps = Platform.OS === 'android' ? { style: { flex: 1 } } : {};

  return (
    <ContentWrapper {...wrapperProps}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ flexGrow: 1 }, styles.scrollContainer]}
        style={{ flex: 1 }}
        nestedScrollEnabled={Platform.OS === 'android'}
        scrollEnabled={true}
      >
        <View style={styles.addFormContainer} pointerEvents="box-none">
          {/* Single Consolidated Panel */}
          <View style={styles.formPanel}>
            {/* Header */}
            <View style={styles.standardTabContainer}>
              <Icon name="add-circle" size={48} color={theme.primary} />
              <Text style={styles.standardTabTitle}>Add Activity</Text>
              <Text style={styles.standardTabDescription}>
                Create a new activity for your day
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />
            {/* Activity Name */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Activity Name</Text>
              <FormInput
                placeholder="Enter activity name"
                value={activityText}
                onChangeText={setActivityText}
                error={errors.text}
                theme={theme}
                autoFocus
              />
            </View>

            {/* Emoji Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Icon</Text>
              <TouchableOpacity
                style={styles.emojiSelector}
                onPress={() => setShowEmojiPicker(true)}
              >
                <Text style={styles.selectedEmoji}>{activityIcon}</Text>
                <Text style={styles.emojiSelectorText}>Tap to change</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description (Optional)</Text>
              <FormInput
                placeholder="Enter activity description"
                value={activityDescription}
                onChangeText={setActivityDescription}
                multiline
                numberOfLines={3}
                theme={theme}
              />
            </View>

            {/* Time (Optional) */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Time (Optional)</Text>
              <TimePicker
                value={activityTime}
                onChange={setActivityTime}
                placeholder="Select time"
                theme={theme}
                error={errors.time}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Action Button */}
            <View style={[styles.formSection, { marginBottom: 0 }]}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.primary },
                ]}
                onPress={handleSaveAndReturn}
                disabled={loading}
              >
                <Icon name="check" size={20} color="white" />
                <Text style={styles.actionButtonText}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <EmojiPicker
          visible={showEmojiPicker}
          onClose={() => setShowEmojiPicker(false)}
          onSelect={handleEmojiSelect}
          selectedEmoji={activityIcon}
          theme={theme}
        />
      )}
    </ContentWrapper>
  );
};

export default React.memo(AddTabContent);
