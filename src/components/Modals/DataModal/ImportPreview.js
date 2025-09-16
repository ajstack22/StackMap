// @ts-check
import React, { useState, useEffect } from 'react';
import { Text } from '../../Typography';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

/**
 * ImportPreview Component
 * Displays preview of data to be imported with selection controls
 */
const ImportPreview = ({
  theme,
  importFile,
  importData,
  importMode = 'fresh',
  importSelections = {},
  isOnboarding = false,
  onImportModeChange,
  onSelectionChange,
  onRemoveFile,
  onGetSelectedCounts,
}) => {
  // Initialize import selections based on file data
  const initializeImportSelections = (parsedData) => {
    const selections = {};

    if (parsedData.users) {
      Object.entries(parsedData.users).forEach(([userId, user]) => {
        selections[`user_${userId}`] = true;
      });
    }

    if (parsedData.activityCards) {
      parsedData.activityCards.forEach(activity => {
        selections[`activity_${activity.id}`] = true;
      });
    }

    // v4 only - no templates support
    if (parsedData.library && parsedData.library.categories) {
      parsedData.library.categories.forEach(category => {
        selections[`category_${category.id}`] = true;
        if (category.activities) {
          category.activities.forEach(activity => {
            selections[`template_${category.id}_${activity.id}`] = true;
          });
        }
      });
    }

    return selections;
  };

  // Initialize selections when data changes
  useEffect(() => {
    if (importData && Object.keys(importSelections).length === 0) {
      const initialSelections = initializeImportSelections(importData);
      onSelectionChange(initialSelections);
    }
  }, [importData, importSelections, onSelectionChange]);

  // Toggle import selection
  const toggleImportSelection = (key) => {
    const newSelections = {
      ...importSelections,
      [key]: !importSelections[key],
    };
    onSelectionChange(newSelections);
  };

  // Get counts of selected items for display
  const getSelectedCounts = () => {
    let userCount = 0;
    let activityCount = 0;
    let categoryCount = 0;
    let templateCount = 0;

    Object.entries(importSelections).forEach(([key, selected]) => {
      if (selected) {
        if (key.startsWith('user_')) userCount++;
        else if (key.startsWith('activity_')) activityCount++;
        else if (key.startsWith('category_')) categoryCount++;
        else if (key.startsWith('template_')) templateCount++;
      }
    });

    return { userCount, activityCount, categoryCount, templateCount };
  };

  // Report selected counts to parent
  useEffect(() => {
    if (onGetSelectedCounts) {
      const counts = getSelectedCounts();
      onGetSelectedCounts(counts);
    }
  }, [importSelections, onGetSelectedCounts]);

  if (!importData || !importFile) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* File Info */}
      <View style={styles.fileInfoCard}>
        <Icon name="insert-drive-file" size={24} color={theme.primary} />
        <View style={styles.fileInfoContent}>
          <Text style={styles.fileInfoName} numberOfLines={1}>
            {importFile.name}
          </Text>
          <Text style={styles.fileInfoDate}>
            Exported:{' '}
            {new Date(importData.exportDate).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity onPress={onRemoveFile}>
          <Icon name="close" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Import Mode Selection (not shown in onboarding) */}
      {!isOnboarding && (
        <View style={styles.importModeContainer}>
          <Text style={styles.importModeTitle}>Import Mode</Text>
          <View style={styles.importModeOptions}>
            <TouchableOpacity
              style={[
                styles.importModeOption,
                importMode === 'fresh' && styles.importModeOptionActive,
              ]}
              onPress={() => onImportModeChange('fresh')}
            >
              <Icon
                name="refresh"
                size={20}
                color={importMode === 'fresh' ? theme.primary : '#666'}
              />
              <Text
                style={[
                  styles.importModeText,
                  importMode === 'fresh' && styles.importModeTextActive,
                ]}
              >
                Start Fresh
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.importModeOption,
                importMode === 'merge' && styles.importModeOptionActive,
              ]}
              onPress={() => onImportModeChange('merge')}
            >
              <Icon
                name="merge-type"
                size={20}
                color={importMode === 'merge' ? theme.primary : '#666'}
              />
              <Text
                style={[
                  styles.importModeText,
                  importMode === 'merge' && styles.importModeTextActive,
                ]}
              >
                Merge with Existing
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.importModeDescription}>
            {importMode === 'fresh'
              ? 'Clear all existing data, then add only the selected items'
              : 'Keep existing data and add selected items'}
          </Text>
        </View>
      )}

      {/* Item Selection */}
      <View style={styles.importSelectionsContainer}>
        <Text style={styles.sectionTitle}>Select Items to Import</Text>

        {/* Users */}
        {!!importData.users && Object.keys(importData.users).length > 0 && (
          <View style={styles.importCategory}>
            <Text style={styles.importCategoryTitle}>Users</Text>
            {Object.entries(importData.users).map(([userId, user]) => (
              <TouchableOpacity
                key={userId}
                style={styles.importItem}
                onPress={() => toggleImportSelection(`user_${userId}`)}
                activeOpacity={0.7}
              >
                <Icon
                  name={
                    importSelections[`user_${userId}`]
                      ? 'check-box'
                      : 'check-box-outline-blank'
                  }
                  size={20}
                  color={
                    importSelections[`user_${userId}`]
                      ? theme.primary
                      : '#999'
                  }
                />
                <Text style={styles.importItemEmoji}>
                  {user.icon || '😀'}
                </Text>
                <Text style={styles.importItemText}>{user.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Activity Cards */}
        {importData.activityCards && importData.activityCards.length > 0 && (
          <View style={styles.importCategory}>
            <Text style={styles.importCategoryTitle}>
              Activity Cards ({importData.activityCards.length})
            </Text>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={() => {
                const allSelected = importData.activityCards.every(
                  a => importSelections[`activity_${a.id}`],
                );
                const newSelections = { ...importSelections };
                importData.activityCards.forEach(activity => {
                  newSelections[`activity_${activity.id}`] = !allSelected;
                });
                onSelectionChange(newSelections);
              }}
            >
              <Text style={styles.selectAllText}>
                {importData.activityCards.every(
                  a => importSelections[`activity_${a.id}`],
                )
                  ? 'Deselect All'
                  : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Activity Library */}
        {importData.library &&
          importData.library.categories &&
          importData.library.categories.length > 0 && (
            <View style={styles.importCategory}>
              <Text style={styles.importCategoryTitle}>
                Activity Library
              </Text>
              {importData.library.categories.map(category => (
                <View key={category.id}>
                  <TouchableOpacity
                    style={styles.importItem}
                    onPress={() =>
                      toggleImportSelection(`category_${category.id}`)
                    }
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={
                        importSelections[`category_${category.id}`]
                          ? 'check-box'
                          : 'check-box-outline-blank'
                      }
                      size={20}
                      color={
                        importSelections[`category_${category.id}`]
                          ? theme.primary
                          : '#999'
                      }
                    />
                    <Icon
                      name="folder"
                      size={16}
                      color="#666"
                      style={{ marginLeft: 8 }}
                    />
                    <Text style={styles.importItemText}>
                      {category.name}
                    </Text>
                    <Text style={styles.importItemCount}>
                      ({category.activities?.length || 0})
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
      </View>
    </View>
  );
};

export default ImportPreview;