// @ts-check
import React, { useState } from 'react';
import { Text } from '../../Typography';
import { Platform, Alert } from 'react-native';
import { ModalButton } from '../../ModalUtilities';
import ConfirmModal from '../ConfirmModal';

/**
 * ImportConfirmation Component
 * Handles the import confirmation process with mode-specific warnings
 */
const ImportConfirmation = ({
  theme,
  importData,
  importMode = 'fresh',
  importSelections = {},
  onImportComplete,
  onError,
  disabled = false,
  showToast,
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Process import data based on selections
  const processImportData = async () => {
    try {
      setLoading(true);

      // Prepare imported data based on selections
      const dataToImport = {
        mode: importMode,
        users: {},
        activityCards: [],
        library: null,
        libraryTemplates: [],
        globalSettings: importData.globalSettings || {},
      };

      // Process selected users with validation
      if (importData.users) {
        Object.entries(importData.users).forEach(([userId, user]) => {
          if (importSelections[`user_${userId}`]) {
            // Validate user data before adding to import
            const validatedUser = { ...user };

            // Ensure name is a string
            if (!validatedUser.name || typeof validatedUser.name !== 'string') {
              if (
                typeof validatedUser.name === 'object' &&
                validatedUser.name !== null
              ) {
                // Try to extract name from object
                validatedUser.name =
                  validatedUser.name.name || validatedUser.name.text || 'User';
              } else {
                validatedUser.name = 'User';
              }
            }

            // Normalize icon field - always use 'icon', not 'emoji'
            if (!validatedUser.icon || typeof validatedUser.icon !== 'string') {
              if (
                validatedUser.emoji &&
                typeof validatedUser.emoji === 'string'
              ) {
                // Legacy support - migrate emoji to icon
                validatedUser.icon = validatedUser.emoji;
              } else {
                validatedUser.icon = '👤';
              }
            }

            // Remove redundant emoji field to prevent confusion
            if (validatedUser.emoji) {
              delete validatedUser.emoji;
            }

            dataToImport.users[userId] = validatedUser;
          }
        });
      }

      // Process selected activity cards
      if (importData.activityCards) {
        importData.activityCards.forEach(activity => {
          if (importSelections[`activity_${activity.id}`]) {
            dataToImport.activityCards.push(activity);
          }
        });
      }

      // Process selected library (v4 only)
      if (importData.library && importData.library.categories) {
        const selectedCategories = [];
        importData.library.categories.forEach(category => {
          if (importSelections[`category_${category.id}`]) {
            const categoryToImport = { ...category, activities: [] };

            if (category.activities) {
              category.activities.forEach(activity => {
                if (
                  importSelections[`template_${category.id}_${activity.id}`]
                ) {
                  categoryToImport.activities.push(activity);
                }
              });
            }

            selectedCategories.push(categoryToImport);
          }
        });
        dataToImport.library = {
          categories: selectedCategories,
          userAddedActivityIds: importData.library.userAddedActivityIds || [],
        };
      }

      if (importData.libraryTemplates) {
        dataToImport.libraryTemplates = importData.libraryTemplates;
      }

      // Call parent import handler
      await onImportComplete(dataToImport);

      if (showToast) {
        showToast({
          message:
            importMode === 'fresh'
              ? 'Data imported successfully!'
              : 'Data merged successfully!',
        });
      }
    } catch (error) {
      onError('Failed to import data. Please try again.');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Handle import initiation
  const handleImportClick = () => {
    if (Platform.OS === 'ios') {
      // Use native iOS alert
      Alert.alert(
        importMode === 'fresh' ? 'Start Fresh Import' : 'Merge Import',
        importMode === 'fresh'
          ? 'This will DELETE all your current data and replace it with only the selected items. This action cannot be undone.'
          : 'This will add the selected items to your existing data. Duplicate items will be skipped.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: () => {
              processImportData();
            },
          },
        ],
      );
    } else {
      // Use ConfirmModal for Android/Web
      setShowConfirmModal(true);
    }
  };

  // Check if any items are selected
  const hasSelectedItems = Object.values(importSelections).some(v => v);

  return (
    <>
      <ModalButton
        theme={theme}
        variant="primary"
        label="Import Selected Items"
        icon="file-download"
        onPress={handleImportClick}
        disabled={!hasSelectedItems || loading || disabled}
        loading={loading}
        fullWidth
      />

      <ConfirmModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          processImportData();
        }}
        theme={theme}
        title={importMode === 'fresh' ? 'Start Fresh Import' : 'Merge Import'}
        message={
          importMode === 'fresh'
            ? 'This will DELETE all your current data and replace it with only the selected items. This action cannot be undone.'
            : 'This will add the selected items to your existing data. Duplicate items will be skipped.'
        }
        confirmText="Import"
        confirmButtonColor={theme.primary}
        icon="file-download"
        iconColor={theme.primary}
      />
    </>
  );
};

export default ImportConfirmation;