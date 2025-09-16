import React from 'react';
import { Text, TextInput } from '../Typography';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  COLORS,
  isTablet,
} from '../../constants';

// Helper function to render edit modal
const renderEditModal = (
  editMode,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  editEmoji,
  setShowEmojiPicker,
  getCustomImageSource,
  theme,
  setEditMode,
  handleSaveEdit
) => {
  if (!editMode) return null;

  return (
    <View style={styles.editModal}>
      <View style={styles.editModalContent}>
        <Text style={styles.editModalTitle}>
          {editMode === 'new-category'
            ? 'New Category'
            : editMode === 'new-activity'
            ? 'New Activity'
            : editMode === 'category'
            ? 'Edit Category'
            : 'Edit Activity'}
        </Text>

        <TextInput
          style={styles.editInput}
          value={editName}
          onChangeText={setEditName}
          placeholder="Name"
          placeholderTextColor="#999999"
          autoFocus
        />

        {(editMode === 'activity' || editMode === 'new-activity') && (
          <View>
            <TextInput
              style={[styles.editInput, styles.descriptionInput]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.emojiLabel}>Select Emoji:</Text>
            <TouchableOpacity
              style={styles.emojiSelector}
              onPress={() => setShowEmojiPicker(true)}
            >
              {editEmoji && editEmoji.startsWith('image:') ? (
                <Image
                  source={getCustomImageSource(editEmoji.substring(6))}
                  style={styles.selectedEmojiImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.selectedEmoji}>
                  {editEmoji || '🎯'}
                </Text>
              )}
              <Text style={styles.emojiSelectorLabel}>Tap to change</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.editModalButtons}>
          <TouchableOpacity
            style={[styles.editButton, styles.cancelButton]}
            onPress={() => {
              setEditMode(null);
              setShowEmojiPicker(false);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.editButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={handleSaveEdit}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  editModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    backgroundColor: 'white',
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.level3,
  },
  editModalTitle: {
    fontSize: isTablet() ? 20 : 18,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  editInput: {
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: isTablet() ? 16 : 14,
    marginBottom: SPACING.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000000', // Explicit black text color for Android devices
    backgroundColor: 'white', // Ensure white background
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emojiLabel: {
    fontSize: isTablet() ? 16 : 14,
    marginBottom: SPACING.sm,
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  emojiSelector: {
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  selectedEmoji: {
    fontSize: 48,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    marginBottom: SPACING.xs,
  },
  selectedEmojiImage: {
    width: 48,
    height: 48,
    marginBottom: SPACING.xs,
  },
  emojiSelectorLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  editButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[200],
  },
  cancelButtonText: {
    color: COLORS.gray[700],
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});

export { renderEditModal };