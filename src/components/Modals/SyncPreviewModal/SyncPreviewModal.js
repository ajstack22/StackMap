import React, { useState, useEffect } from 'react';
import { Text } from '../../Typography';
import {
  Modal,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import syncService from '../../../services/sync/syncService';
import encryptionService from '../../../services/sync/encryptionService';

const SyncPreviewModal = ({
  visible,
  onClose,
  onConfirm,
  syncPhrase,
  theme,
  showToast,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncData, setSyncData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  useEffect(() => {
    if (visible && syncPhrase) {
      checkSyncData();
    }
  }, [visible, syncPhrase]);

  const checkSyncData = async () => {
    try {
      setLoading(true);
      setError('');
      setConnectionStatus('checking');

      // Decode the sync phrase properly
      const decodedPhrase = decodeURIComponent(syncPhrase);

      // Generate sync ID from phrase
      const syncId = await syncService.generateSyncId(decodedPhrase);

      // Try to fetch sync data
      const deviceId = await encryptionService.getDeviceId();
      const response = await fetch(
        `${syncService.getApiUrl()}/pull.php?sync_id=${syncId}&device_id=${encodeURIComponent(deviceId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 404) {
        setError('Sync group not found. The sync phrase may be incorrect.');
        setConnectionStatus('not_found');
        return;
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // Initialize encryption to decrypt the data
      // Use the same fixed salt as syncService for consistency
      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
      await encryptionService.initialize(decodedPhrase, syncId, fixedSalt);
      
      // Decrypt and preview the data
      const decryptedData = encryptionService.decryptData(data.encrypted_blob);
      
      // Extract preview information
      const preview = {
        users: [],
        totalActivities: 0,
        totalLibraryItems: 0,
        lastUpdated: data.lastModified || data.last_modified,  // Use camelCase, fallback for old data
      };

      if (decryptedData.users) {
        Object.entries(decryptedData.users).forEach(([userId, user]) => {
          let activityCount = 0;
          if (user.days) {
            Object.values(user.days).forEach(day => {
              activityCount += (day.activities || []).length;
            });
          }
          
          preview.users.push({
            name: user.name,
            icon: user.icon || '👤',  // Modern icon field only
            activityCount,
          });
          
          preview.totalActivities += activityCount;
        });
      }

      // Count library items (v4 format only)
      if (decryptedData.library && decryptedData.library.categories) {
        decryptedData.library.categories.forEach(category => {
          preview.totalLibraryItems += (category.activities || []).length;
        });
      }

      setSyncData(preview);
      setConnectionStatus('connected');
    } catch (error) {
      setError(error.message || 'Failed to connect to sync');
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      
      // Decode the sync phrase
      const decodedPhrase = decodeURIComponent(syncPhrase);
      
      // Clear existing local data before syncing
      // This ensures we don't have conflicts with existing users
      const { useUserStore, useLibraryStore } = require('../../../stores');
      
      // Clear existing data using proper store methods
      useUserStore.getState().setUsers({});
      useUserStore.getState().setCurrentUser(null);
      useLibraryStore.getState().setLibraryTemplates([]);
      
      // Initialize sync with the decoded phrase
      await syncService.initialize(decodedPhrase);
      
      showToast('Sync connected successfully!', 'success');
      
      // Let parent handle the success (likely reload)
      onConfirm();
    } catch (error) {
      setError(error.message || 'Failed to connect to sync');
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'checking':
        return <ActivityIndicator size="small" color={theme?.primary || '#5C7E9D'} />;
      case 'connected':
        return <Icon name="check-circle" size={24} color="#10b981" />;
      case 'not_found':
        return <Icon name="error" size={24} color="#ef4444" />;
      case 'error':
        return <Icon name="warning" size={24} color="#f59e0b" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'checking':
        return 'Checking connection...';
      case 'connected':
        return 'Connected to sync';
      case 'not_found':
        return 'Sync not found';
      case 'error':
        return 'Connection error';
      default:
        return '';
    }
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer,
          { paddingBottom: isWeb ? 20 : insets.bottom + 20 }
        ]}>
          <View style={styles.header}>
          <Text style={[styles.title, { color: theme?.text || '#000000' }]}>
            Join Sync Group
          </Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Icon name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Connection Status */}
          <View style={styles.statusSection}>
            <Text style={[styles.sectionTitle, { color: theme?.text || '#000000' }]}>
              Connection Status
            </Text>
            <View style={styles.statusRow}>
              {getStatusIcon()}
              <Text style={[styles.statusText, { color: theme?.text || '#000000' }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Data Preview */}
          {syncData && connectionStatus === 'connected' && (
            <View style={styles.previewSection}>
              <Text style={[styles.sectionTitle, { color: theme?.text || '#000000' }]}>
                Data to be imported:
              </Text>

              {/* Users */}
              <View style={styles.previewItem}>
                <Icon name="people" size={20} color={theme?.primary || '#5C7E9D'} />
                <Text style={[styles.previewLabel, { color: theme?.text || '#000000' }]}>
                  Users:
                </Text>
                <Text style={[styles.previewValue, { color: theme?.text || '#000000' }]}>
                  {syncData.users.length}
                </Text>
              </View>

              {syncData.users.map((user, index) => (
                <View key={index} style={styles.userItem}>
                  <Text style={styles.userIcon}>{user.icon}</Text>
                  <Text style={[styles.userName, { color: theme?.text || '#000000' }]}>
                    {user.name}
                  </Text>
                  <Text style={[styles.userActivities, { color: theme?.textSecondary || '#666666' }]}>
                    {user.activityCount} activities
                  </Text>
                </View>
              ))}

              {/* Activity Cards */}
              <View style={styles.previewItem}>
                <Icon name="dashboard" size={20} color={theme?.primary || '#5C7E9D'} />
                <Text style={[styles.previewLabel, { color: theme?.text || '#000000' }]}>
                  Activity Cards:
                </Text>
                <Text style={[styles.previewValue, { color: theme?.text || '#000000' }]}>
                  {syncData.totalActivities}
                </Text>
              </View>

              {/* Library Items */}
              {syncData.totalLibraryItems > 0 && (
                <View style={styles.previewItem}>
                  <Icon name="library-books" size={20} color={theme?.primary || '#5C7E9D'} />
                  <Text style={[styles.previewLabel, { color: theme?.text || '#000000' }]}>
                    Library Items:
                  </Text>
                  <Text style={[styles.previewValue, { color: theme?.text || '#000000' }]}>
                    {syncData.totalLibraryItems}
                  </Text>
                </View>
              )}

              {/* Last Updated */}
              <View style={styles.lastUpdated}>
                <Text style={[styles.lastUpdatedText, { color: theme?.textSecondary || '#666666' }]}>
                  Last updated: {new Date(syncData.lastUpdated).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Loading State */}
          {loading && !syncData && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme?.primary || '#5C7E9D'} />
              <Text style={[styles.loadingText, { color: theme?.text || '#000000' }]}>
                Checking sync data...
              </Text>
            </View>
          )}
          {/* Action Panel */}
          {connectionStatus === 'connected' && syncData && (
            <View style={styles.actionPanel}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: theme?.primary || '#5C7E9D' },
                  loading && styles.disabledButton
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="file-download" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Import This Data</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default SyncPreviewModal;