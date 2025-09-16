import React, { useState } from 'react';
import { Text, TextInput } from '../Typography';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
  DEFAULT_ACTIVITY_EMOJI,
} from '../../constants';

// Category name editing component for inline editing in header
const CategoryNameEditor = ({
  editingCategoryName,
  setEditingCategoryName,
  onSave,
  onCancel,
}) => {
  return (
    <>
      <View style={styles.categoryEditContainer}>
        <TextInput
          style={styles.categoryEditInput}
          value={editingCategoryName}
          onChangeText={setEditingCategoryName}
          autoFocus
          onSubmitEditing={onSave}
        />
      </View>

      <View style={styles.categoryActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onSave}
        >
          <Icon name="check" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onCancel}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
};

// Helper function to handle save edit logic
const handleSaveEditLogic = ({
  editMode,
  editName,
  editEmoji,
  editDescription,
  editingItem,
  selectedCategoryId,
  categories,
  DEFAULT_ACTIVITY_EMOJI,
}) => {
  if (!editName.trim()) {
    Alert.alert('Error', 'Name cannot be empty');
    return null;
  }

  let newCategories = [...categories];

  switch (editMode) {
    case 'category':
      newCategories = categories.map(cat =>
        cat.id === editingItem.id ? { ...cat, name: editName } : cat,
      );
      break;

    case 'activity':
      newCategories = categories.map(cat => ({
        ...cat,
        activities: cat.activities.map(act =>
          act.id === editingItem.id
            ? {
                ...act,
                name: editName,
                icon: editEmoji || DEFAULT_ACTIVITY_EMOJI,
                description: editDescription,
              }
            : act,
        ),
      }));
      break;

    case 'new-category':
      const newCategoryId = `category-${Date.now()}`;
      newCategories.push({
        id: newCategoryId,
        name: editName,
        activities: [],
      });
      break;

    case 'new-activity':
      if (!editEmoji) {
        Alert.alert('Error', 'Please select an emoji for the activity');
        return null;
      }
      const newActivityId = `activity-${Date.now()}`;
      newCategories = categories.map(cat =>
        cat.id === selectedCategoryId
          ? {
              ...cat,
              activities: [
                ...cat.activities,
                {
                  id: newActivityId,
                  name: editName,
                  icon: editEmoji || DEFAULT_ACTIVITY_EMOJI,
                  description: editDescription,
                },
              ],
            }
          : cat,
      );
      break;
  }

  return newCategories;
};

// Edit modal logic moved to CategoryEditModal.js

// Hook for managing edit state
const useEditState = () => {
  const [editingItem, setEditingItem] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const resetEditState = () => {
    setEditMode(null);
    setEditingItem(null);
    setEditName('');
    setEditEmoji('');
    setEditDescription('');
    setShowEmojiPicker(false);
  };

  const handleEditCategory = (category) => {
    setEditingItem(category);
    setEditMode('category');
    setEditName(category.name);
  };

  const handleEditActivity = (activity) => {
    setEditingItem(activity);
    setEditMode('activity');
    setEditName(activity.text || '');
    setEditEmoji(activity.icon || '');
    setEditDescription(activity.description || '');
  };

  const handleAddCategory = () => {
    setEditMode('new-category');
    setEditName('');
  };

  const handleAddActivity = (category) => {
    setSelectedCategoryId(category.id);
    setEditMode('new-activity');
    setEditName('');
    setEditEmoji(DEFAULT_ACTIVITY_EMOJI);
    setEditDescription('');
  };

  const handleStartEditCategory = (categoryId) => {
    setEditingCategoryId(categoryId);
  };

  const handleEndEditCategory = () => {
    setEditingCategoryId(null);
  };

  return {
    // State
    editingItem,
    editMode,
    editName,
    editEmoji,
    editDescription,
    selectedCategoryId,
    editingCategoryId,
    showEmojiPicker,

    // Setters
    setEditName,
    setEditEmoji,
    setEditDescription,
    setEditMode,
    setShowEmojiPicker,

    // Actions
    resetEditState,
    handleEditCategory,
    handleEditActivity,
    handleAddCategory,
    handleAddActivity,
    handleStartEditCategory,
    handleEndEditCategory,
  };
};

const styles = StyleSheet.create({
  categoryEditContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  categoryEditInput: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: SPACING.xs,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
  },
});

export {
  CategoryNameEditor,
  handleSaveEditLogic,
  useEditState,
};