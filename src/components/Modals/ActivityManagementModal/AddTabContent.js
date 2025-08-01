import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput, ModalFooter } from '../../ModalUtilities';
import EmojiPicker from '../../EmojiPicker';
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
}) => {
  const [activityText, setActivityText] = useState('');
  const [activityIcon, setActivityIcon] = useState(DEFAULT_ACTIVITY_EMOJI);
  const [activityTime, setActivityTime] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('my-templates');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [errors, setErrors] = useState({});

  // Prefill form when coming from library
  useEffect(() => {
    if (prefilledActivity) {
      setActivityText(prefilledActivity.name || prefilledActivity.text || '');
      setActivityIcon(prefilledActivity.emoji || prefilledActivity.icon || DEFAULT_ACTIVITY_EMOJI);
      if (prefilledCategory) {
        setSelectedCategory(prefilledCategory);
      }
    }
  }, [prefilledActivity, prefilledCategory]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!activityText.trim()) {
      newErrors.text = 'Activity name is required';
    }
    
    if (activityTime && isNaN(parseInt(activityTime))) {
      newErrors.time = 'Time must be a number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast({ message: 'Please fix the errors', type: 'error' });
      return;
    }

    const activityData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: activityText.trim(),
      icon: activityIcon,
      completed: false,
      pinned: false,
      ...(activityTime && { duration: parseInt(activityTime) }),
    };

    // Add to current day
    await onAddActivity(activityData);

    // Optionally save to library
    if (saveToLibrary && selectedCategory) {
      await onSaveToLibrary(activityData, selectedCategory);
    }

    // Reset form for next activity
    resetForm();
  };

  const handleSaveAndAddAnother = async () => {
    await handleSave();
    // Form is reset but modal stays open
    showToast({ message: 'Activity added! Add another one.' });
  };

  const resetForm = () => {
    setActivityText('');
    setActivityIcon(DEFAULT_ACTIVITY_EMOJI);
    setActivityTime('');
    setErrors({});
    // Don't reset category or saveToLibrary preference
  };

  const handleEmojiSelect = (emoji) => {
    setActivityIcon(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ flexGrow: 1 }, styles.scrollContainer]}
        style={{ flex: 1 }}
      >
      <View style={[styles.addFormContainer, styles.contentSection]}>
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

        {/* Time/Duration (Optional) */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Duration (Optional)</Text>
          <FormInput
            placeholder="Minutes (e.g., 30)"
            value={activityTime}
            onChangeText={setActivityTime}
            keyboardType="numeric"
            error={errors.time}
            theme={theme}
          />
        </View>

        {/* Save to Library Option */}
        <View style={styles.formSection}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setSaveToLibrary(!saveToLibrary)}
          >
            <View style={[styles.checkbox, saveToLibrary && styles.checkboxChecked]}>
              {saveToLibrary && <Icon name="check" size={16} color="white" />}
            </View>
            <Text style={styles.checkboxLabel}>Save to Activity Library</Text>
          </TouchableOpacity>

          {saveToLibrary && (
            <View style={styles.categorySelector}>
              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.categoryChipActive
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === category.id && styles.categoryChipTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Quick Templates */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Quick Templates</Text>
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
      </View>
      </ScrollView>

      {/* Action Buttons */}
      <ModalFooter
        theme={theme}
        primaryButton={{
          label: 'Add Activity',
          icon: 'add',
          onPress: handleSave,
          disabled: loading
        }}
        secondaryButton={{
          label: 'Add & Continue',
          onPress: handleSaveAndAddAnother,
          disabled: loading
        }}
        loading={loading}
      />

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
    </>
  );
};

export default React.memo(AddTabContent);