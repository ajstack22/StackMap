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

  // Validate and normalize user name
  const normalizeUserName = (user) => {
    if (!user.name || typeof user.name !== 'string') {
      if (typeof user.name === 'object' && user.name !== null) {
        return user.name.name || user.name.text || 'User';
      }
      return 'User';
    }
    return user.name;
  };

  // Validate and normalize user icon
  const normalizeUserIcon = (user) => {
    if (!user.icon || typeof user.icon !== 'string') {
      if (user.emoji && typeof user.emoji === 'string') {
        return user.emoji;
      }
      return '👤';
    }
    return user.icon;
  };

  // Validate user data before import
  const validateUserData = (user) => {
    const validatedUser = { ...user };
    validatedUser.name = normalizeUserName(user);
    validatedUser.icon = normalizeUserIcon(user);

    // Remove redundant emoji field
    if (validatedUser.emoji) {
      delete validatedUser.emoji;
    }

    return validatedUser;
  };

  // Process selected users
  const processSelectedUsers = (importData, importSelections) => {
    const users = {};

    if (importData.users) {
      Object.entries(importData.users).forEach(([userId, user]) => {
        if (importSelections[`user_${userId}`]) {
          users[userId] = validateUserData(user);
        }
      });
    }

    return users;
  };

  // Process selected activity cards
  const processSelectedActivities = (importData, importSelections) => {
    const activityCards = [];

    if (importData.activityCards) {
      importData.activityCards.forEach(activity => {
        if (importSelections[`activity_${activity.id}`]) {
          activityCards.push(activity);
        }
      });
    }

    return activityCards;
  };

  // Process selected library categories
  const processSelectedLibrary = (importData, importSelections) => {
    if (!importData.library || !importData.library.categories) {
      return null;
    }

    const selectedCategories = [];

    importData.library.categories.forEach(category => {
      if (importSelections[`category_${category.id}`]) {
        const categoryToImport = { ...category, activities: [] };

        if (category.activities) {
          category.activities.forEach(activity => {
            if (importSelections[`template_${category.id}_${activity.id}`]) {
              categoryToImport.activities.push(activity);
            }
          });
        }

        selectedCategories.push(categoryToImport);
      }
    });

    return {
      categories: selectedCategories,
      userAddedActivityIds: importData.library.userAddedActivityIds || [],
    };
  };

  // Process import data based on selections
  const processImportData = async () => {
    try {
      setLoading(true);

      const dataToImport = {
        mode: importMode,
        users: processSelectedUsers(importData, importSelections),
        activityCards: processSelectedActivities(importData, importSelections),
        library: processSelectedLibrary(importData, importSelections),
        libraryTemplates: importData.libraryTemplates || [],
        globalSettings: importData.globalSettings || {},
      };

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