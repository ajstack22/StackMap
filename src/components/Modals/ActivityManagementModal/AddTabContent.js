import React, { useState, useEffect } from 'react';
import { Text, TextInput } from '../../Typography';
import { View, TouchableOpacity, ScrollView, Platform,  } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput } from '../../ModalUtilities';
import EmojiPicker from '../../EmojiPicker';
import TimePicker from '../../TimePicker';
import { styles } from './styles';
import { DEFAULT_ACTIVITY_EMOJI } from '../../../constants';

const AddTabContent = ({
  theme,
  categories = [],
  onAddActivity,
  onSaveToLibrary,
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
  // Always use 'my-templates' for now since we're not implementing custom categories yet
  const selectedCategory = 'my-templates';
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [errors, setErrors] = useState({});

  // Prefill form when coming from library
  useEffect(() => {
    if (prefilledActivity) {
      setActivityText(prefilledActivity.name || prefilledActivity.text || '');
      setActivityDescription(prefilledActivity.description || '');
      setActivityIcon(prefilledActivity.emoji || prefilledActivity.icon || DEFAULT_ACTIVITY_EMOJI);
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
        const encryptionService = (await import('../../../services/sync/encryptionService')).default;
        return await encryptionService.getDeviceId();
      } catch (error) {
//         console.warn('Could not get device ID, using fallback:', error);
        return 'unknown';
      }
    })();
    
    const activityData = {
      id: `${deviceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: activityText.trim(),
      description: activityDescription.trim(),
      icon: activityIcon,
      completed: false,
      pinned: false,
      ...(activityTime && { time: activityTime }),
    };

    // Add to current day
    await onAddActivity(activityData);

    // Optionally save to library (always to My Templates)
    if (saveToLibrary) {
      await onSaveToLibrary(activityData, 'my-templates');
    }

    // Close the modal
    if (onClose) {
      onClose();
    }
  };

  const handleSaveAndContinue = async () => {
    if (!validateForm()) {
      showToast({ message: 'Please fix the errors', type: 'error' });
      return;
    }

    // Generate enhanced activity ID with device ID
    const deviceId = await (async () => {
      try {
        const encryptionService = (await import('../../../services/sync/encryptionService')).default;
        return await encryptionService.getDeviceId();
      } catch (error) {
//         console.warn('Could not get device ID, using fallback:', error);
        return 'unknown';
      }
    })();
    
    const activityData = {
      id: `${deviceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: activityText.trim(),
      description: activityDescription.trim(),
      icon: activityIcon,
      completed: false,
      pinned: false,
      ...(activityTime && { time: activityTime }),
    };

    // Add to current day
    await onAddActivity(activityData);

    // Optionally save to library (always to My Templates)
    if (saveToLibrary) {
      await onSaveToLibrary(activityData, 'my-templates');
    }

    // Reset form for next activity
    resetForm();
    showToast({ message: 'Activity added! Add another one.' });
  };

  const resetForm = () => {
    setActivityText('');
    setActivityDescription('');
    setActivityIcon(DEFAULT_ACTIVITY_EMOJI);
    setActivityTime('');
    setErrors({});
    // Don't reset category or saveToLibrary preference
  };

  const handleEmojiSelect = (emoji) => {
    setActivityIcon(emoji);
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

          {/* Save to Library */}
          <View style={styles.formSection}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setSaveToLibrary(!saveToLibrary)}
            >
              <View style={[styles.checkbox, saveToLibrary && styles.checkboxChecked]}>
                {saveToLibrary && <Icon name="check" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>Save to My Templates</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Quick Templates */}
          <View style={styles.formSection}>
            <Text style={[styles.formLabel, { marginBottom: 12 }]}>Quick Templates</Text>
            <View style={styles.quickTemplates}>
              {[
                { icon: '🏃', text: 'Exercise' },
                { icon: '📚', text: 'Reading' },
                { icon: '🧹', text: 'Chores' },
                { icon: '🎮', text: 'Play Time' },
              ].map((template, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickTemplate}
                  onPress={() => {
                    setActivityText(template.text);
                    setActivityIcon(template.icon);
                  }}
                >
                  <Text style={styles.quickTemplateIcon}>{template.icon}</Text>
                  <Text style={styles.quickTemplateText}>{template.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={[styles.formSection, { marginBottom: 0 }]}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveAndReturn}
              disabled={loading}
            >
              <Icon name="check" size={20} color="white" />
              <Text style={styles.actionButtonText}>Add Activity</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleSaveAndContinue}
              disabled={loading}
            >
              <Icon name="add" size={20} color={theme.primary} />
              <Text style={[styles.actionButtonText, { color: theme.primary }]}>Add & Continue</Text>
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