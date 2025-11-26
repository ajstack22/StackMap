// @ts-check
import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {Array} activities
 */

/**
 * @typedef {Object} CategoryPickerModalProps
 * @property {boolean} visible
 * @property {() => void} onClose
 * @property {(categoryId: string, categoryName?: string, isNewCategory?: boolean) => void} onSelect
 * @property {(newCategoryName: string) => string} onCreateCategory
 * @property {Category[]} categories
 * @property {Object} theme
 * @property {string} activityName - Name of activity being saved (for display)
 */

/**
 * Modal for selecting which library category to save an activity to
 * @param {CategoryPickerModalProps} props
 */
const CategoryPickerModal = ({
  visible,
  onClose,
  onSelect,
  onCreateCategory,
  categories = [],
  theme,
  activityName,
}) => {
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleClose = () => {
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    onClose();
  };

  const handleSelectCategory = (category) => {
    onSelect(category.id, category.name, false);
    handleClose();
  };

  const handleCreateCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      return;
    }

    // Check for duplicate names
    const duplicate = categories.find(
      cat => cat.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      // Select existing category instead
      handleSelectCategory(duplicate);
      return;
    }

    // Create new category ID and select it with isNewCategory flag
    const newCategoryId = onCreateCategory(trimmedName);
    if (newCategoryId) {
      // Pass isNewCategory=true so the category is created in the same state update
      onSelect(newCategoryId, trimmedName, true);
      handleClose();
    }
  };

  const handleShowNewCategoryInput = () => {
    setShowNewCategoryInput(true);
  };

  // Sort categories to put My Templates first
  const sortedCategories = [...categories].sort((a, b) => {
    if (a.id === 'my-templates') return -1;
    if (b.id === 'my-templates') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={() => {}}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Save to Library</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {activityName}
              </Text>
            </View>

            {/* Category List */}
            <ScrollView
              style={styles.categoryList}
              contentContainerStyle={styles.categoryListContent}
              showsVerticalScrollIndicator={false}
            >
              {sortedCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => handleSelectCategory(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryIcon}>
                      {category.id === 'my-templates' ? '⭐' : '📁'}
                    </Text>
                    <Text style={styles.categoryName} numberOfLines={1}>
                      {category.name}
                    </Text>
                    <Text style={styles.categoryCount}>
                      ({category.activities?.length || 0})
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={24}
                    color="#999"
                  />
                </TouchableOpacity>
              ))}

              {/* Create New Category */}
              {!showNewCategoryInput ? (
                <TouchableOpacity
                  style={[styles.categoryItem, styles.createCategoryButton]}
                  onPress={handleShowNewCategoryInput}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.addIconContainer,
                        { backgroundColor: theme.primary },
                      ]}
                    >
                      <Icon name="add" size={20} color="#fff" />
                    </View>
                    <Text
                      style={[styles.categoryName, { color: theme.primary }]}
                    >
                      Create New Group
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.newCategoryContainer}>
                  <TextInput
                    style={styles.newCategoryInput}
                    placeholder="Enter group name..."
                    placeholderTextColor="#999"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoFocus={true}
                    returnKeyType="done"
                    onSubmitEditing={handleCreateCategory}
                    maxLength={50}
                  />
                  <View style={styles.newCategoryActions}>
                    <TouchableOpacity
                      style={styles.newCategoryCancel}
                      onPress={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }}
                    >
                      <Text style={styles.newCategoryCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.newCategoryCreate,
                        { backgroundColor: theme.primary },
                        !newCategoryName.trim() && styles.newCategoryCreateDisabled,
                      ]}
                      onPress={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      <Text style={styles.newCategoryCreateText}>Create</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CategoryPickerModal;
