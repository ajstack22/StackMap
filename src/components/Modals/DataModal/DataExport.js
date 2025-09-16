// @ts-check
import React, { useState } from 'react';
import { Text } from '../../Typography';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ModalButton } from '../../ModalUtilities';
import { styles } from './styles';
import { handleExport } from './exportUtils';

/**
 * DataExport component handles exporting user data to JSON file
 */
const DataExport = ({
  theme,
  users,
  currentUser,
  currentDay,
  libraryCategories,
  currentTheme,
  bannerPosition,
  hasSecurePin,
  showToast,
}) => {
  const [loading, setLoading] = useState(false);
  const [exportSelections, setExportSelections] = useState({
    users: true,
    activityCards: true,
    activityLibrary: true,
  });

  const handleExportClick = async () => {
    try {
      setLoading(true);

      // Prepare data for export
      const exportData = {
        users,
        currentUser,
        currentDay,
        libraryCategories,
        currentTheme,
        bannerPosition,
        hasSecurePin,
      };

      // Call utility function to handle export
      await handleExport(exportSelections, exportData, showToast);
    } catch (error) {
      // Error handling is done in the utility function
    } finally {
      setLoading(false);
    }
  };

  // Helper function to toggle export selections
  const toggleExportSelection = key => {
    setExportSelections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <View style={styles.section}>
      <View style={styles.standardTabContainer}>
        <Icon name="file-upload" size={48} color={theme.primary} />
        <Text style={styles.standardTabTitle}>Export Data</Text>
        <Text style={styles.standardTabDescription}>
          Select data to save as a backup file
        </Text>
      </View>

      <TouchableOpacity
        style={styles.selectionCard}
        onPress={() => toggleExportSelection('users')}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <Icon
            name={
              exportSelections.users ? 'check-box' : 'check-box-outline-blank'
            }
            size={24}
            color={exportSelections.users ? theme.primary : '#999'}
          />
        </View>
        <View style={styles.selectionContent}>
          <Text style={styles.selectionTitle}>Users</Text>
          <Text style={styles.selectionDescription}>
            All user profiles and their assigned activities
          </Text>
        </View>
        <View style={styles.selectionCount}>
          <Text style={styles.countText}>
            {users ? Object.keys(users).length : 0}
          </Text>
          <Icon name="person" size={16} color="#666" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.selectionCard}
        onPress={() => toggleExportSelection('activityCards')}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <Icon
            name={
              exportSelections.activityCards
                ? 'check-box'
                : 'check-box-outline-blank'
            }
            size={24}
            color={exportSelections.activityCards ? theme.primary : '#999'}
          />
        </View>
        <View style={styles.selectionContent}>
          <Text style={styles.selectionTitle}>Activity Cards</Text>
          <Text style={styles.selectionDescription}>
            All current activity cards from all users
          </Text>
        </View>
        <View style={styles.selectionCount}>
          <Text style={styles.countText}>
            {users
              ? Object.values(users).reduce(
                  (count, user) =>
                    count +
                    (user.days?.today?.activities?.length || 0) +
                    (user.days?.tomorrow?.activities?.length || 0),
                  0,
                )
              : 0}
          </Text>
          <Icon name="dashboard" size={16} color="#666" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.selectionCard}
        onPress={() => toggleExportSelection('activityLibrary')}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <Icon
            name={
              exportSelections.activityLibrary
                ? 'check-box'
                : 'check-box-outline-blank'
            }
            size={24}
            color={exportSelections.activityLibrary ? theme.primary : '#999'}
          />
        </View>
        <View style={styles.selectionContent}>
          <Text style={styles.selectionTitle}>Activity Library</Text>
          <Text style={styles.selectionDescription}>
            All categories and routine templates
          </Text>
        </View>
        <View style={styles.selectionCount}>
          <Text style={styles.countText}>
            {libraryCategories
              ? libraryCategories.reduce(
                  (count, category) =>
                    count + (category.activities?.length || 0),
                  0,
                )
              : 0}
          </Text>
          <Icon name="folder" size={16} color="#666" />
        </View>
      </TouchableOpacity>

      <View style={styles.inPanelButtonContainer}>
        <ModalButton
          theme={theme}
          variant="primary"
          label="Export Selected Data"
          icon="file-upload"
          onPress={() => {
            handleExportClick();
          }}
          disabled={!Object.values(exportSelections).some(v => v) || loading}
          loading={loading}
          fullWidth
        />
      </View>
    </View>
  );
};

export default DataExport;