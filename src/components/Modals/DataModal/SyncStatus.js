// @ts-check
import React from 'react';
import { Text } from '../../Typography';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

/**
 * SyncStatus component handles sync status display including:
 * - Sync enabled/disabled indicators
 * - Last sync time display
 * - Sync progress indicators
 * - Sync error messages
 * - Status icons and text
 */
const SyncStatus = ({
  theme,
  syncEnabled,
  syncStatus,
  lastSyncTime,
  syncError
}) => {

  // Format time ago helper
  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Get sync status icon and color
  const getSyncStatusIcon = () => {
    if (!syncEnabled) {
      return { icon: 'sync-disabled', color: '#ff9800' };
    }

    if (syncStatus === 'syncing') {
      return { icon: 'sync', color: theme.primary };
    }

    if (syncError) {
      return { icon: 'sync-problem', color: '#d32f2f' };
    }

    return { icon: 'cloud-done', color: '#4caf50' };
  };

  // Get sync status text
  const getSyncStatusText = () => {
    if (!syncEnabled) {
      return 'Sync disabled';
    }

    if (syncStatus === 'syncing') {
      return 'Syncing...';
    }

    if (syncError) {
      return `Sync error: ${syncError}`;
    }

    if (lastSyncTime) {
      return `Last synced ${formatTimeAgo(lastSyncTime)}`;
    }

    return 'Sync active';
  };

  // Render compact sync status card (combines header + status)
  const renderCompactSyncStatus = () => {
    const statusIcon = getSyncStatusIcon();
    const statusText = getSyncStatusText();

    return (
      <View style={styles.compactStatusCard}>
        <View style={styles.compactStatusLeft}>
          <Icon
            name={statusIcon.icon}
            size={24}
            color={statusIcon.color}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.compactStatusTitle}>Sync Enabled</Text>
            <Text style={styles.compactStatusSubtitle}>
              {statusText}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render sync enabled header (legacy - kept for compatibility)
  const renderSyncEnabledHeader = () => (
    <View style={styles.standardTabContainer}>
      <Icon name="cloud-done" size={48} color={theme.primary} />
      <Text style={styles.standardTabTitle}>Sync Enabled</Text>
      <Text style={styles.standardTabDescription}>
        Your data is syncing across devices
      </Text>
    </View>
  );

  // Render sync status info section
  const renderSyncStatusInfo = () => {
    const statusIcon = getSyncStatusIcon();
    const statusText = getSyncStatusText();

    return (
      <View style={styles.syncStatusInfo}>
        <View style={styles.syncStatusRow}>
          <Icon
            name={statusIcon.icon}
            size={20}
            color={statusIcon.color}
          />
          <Text style={styles.syncStatusText}>
            {statusText}
          </Text>
        </View>

        {syncError && (
          <View style={[styles.errorContainer, { marginTop: 8 }]}>
            <Icon name="error-outline" size={16} color="#d32f2f" />
            <Text style={styles.errorText}>{syncError}</Text>
          </View>
        )}
      </View>
    );
  };

  // Render sync progress indicator (for active syncing)
  const renderSyncProgress = () => {
    if (syncStatus !== 'syncing') return null;

    return (
      <View style={styles.shareSection}>
        <View style={styles.shareFieldLabel}>
          <Text style={styles.shareFieldHelper}>Synchronizing data...</Text>
        </View>
      </View>
    );
  };

  // Render compact sync status (for use in other components)
  const renderCompactStatus = () => {
    const statusIcon = getSyncStatusIcon();

    return (
      <View style={styles.shareInstructionItem}>
        <Icon
          name={statusIcon.icon}
          size={16}
          color={statusIcon.color}
        />
        <Text style={styles.shareInstructionText}>
          {syncEnabled ? 'Sync enabled' : 'Sync disabled'}
        </Text>
      </View>
    );
  };

  // Render sync features list (for disabled state)
  const renderSyncFeatures = () => (
    <View style={styles.syncFeatures}>
      <View style={styles.syncFeature}>
        <Icon name="security" size={20} color={theme.primary} />
        <Text style={styles.syncFeatureText}>End-to-end encrypted</Text>
      </View>
      <View style={styles.syncFeature}>
        <Icon name="devices" size={20} color={theme.primary} />
        <Text style={styles.syncFeatureText}>Multi-device support</Text>
      </View>
      <View style={styles.syncFeature}>
        <Icon name="cloud-off" size={20} color={theme.primary} />
        <Text style={styles.syncFeatureText}>Works offline</Text>
      </View>
    </View>
  );

  return {
    renderCompactSyncStatus,
    renderSyncEnabledHeader,
    renderSyncStatusInfo,
    renderSyncProgress,
    renderCompactStatus,
    renderSyncFeatures,
    formatTimeAgo,
    getSyncStatusIcon,
    getSyncStatusText
  };
};

export default SyncStatus;