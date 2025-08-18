import React, { useState, useEffect } from 'react';
import { Text } from '../Typography';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import syncService from '../../services/sync/syncService';
import { TYPOGRAPHY } from '../../constants';

const SyncBlockingIndicator = ({ theme }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if sync is initializing on mount
    const checkInitialSync = async () => {
      const isInitializing =
        syncService.isInitializing || syncService.syncInProgress;

      if (isInitializing) {
        setIsVisible(true);
      }
    };
    checkInitialSync();

    // Subscribe to sync status updates
    const updateStatus = status => {
      // ONLY show blocking indicator during initial sync or when explicitly restoring
      // Don't show for incremental syncs
      const shouldShowBlockingUI =
        status &&
        (syncService.isInitializing ||
          status.phase === 'restoring' ||
          (status.phase === 'checking' &&
            !syncService.hasCompletedInitialSync));

      if (shouldShowBlockingUI) {
        setIsVisible(true);

        switch (status.phase) {
          case 'checking':
            setStatusMessage('Checking for updates...');
            break;
          case 'pulling':
            setStatusMessage('Downloading your data...');
            break;
          case 'decrypting':
            setStatusMessage('Decrypting...');
            break;
          case 'restoring':
            setStatusMessage('Restoring your activities...');
            break;
          case 'merging':
            setStatusMessage('Merging changes...');
            break;
          case 'pushing':
            setStatusMessage('Uploading changes...');
            break;
          case 'complete':
            setStatusMessage('Sync complete!');
            setTimeout(() => setIsVisible(false), 1000);
            break;
          case 'error':
            setStatusMessage(
              'Sync error: ' + (status.details || 'Please try again'),
            );
            setTimeout(() => setIsVisible(false), 3000);
            break;
          default:
            setStatusMessage('Syncing...');
        }
      } else {
        // Hide after a short delay
        setTimeout(() => setIsVisible(false), 500);
      }
    };

    const updateProgress = value => {
      setProgress(value);
    };

    // Override the syncService callbacks
    const originalStatusChange = syncService.onStatusChange;
    const originalProgressChange = syncService.onProgressChange;

    syncService.onStatusChange = updateStatus;
    syncService.onProgressChange = updateProgress;

    return () => {
      // Restore original callbacks
      syncService.onStatusChange = originalStatusChange;
      syncService.onProgressChange = originalProgressChange;
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: '#fff' }]}>
          <ActivityIndicator
            size="large"
            color={theme?.primary || '#2196F3'}
            style={styles.spinner}
          />
          <Text style={styles.title}>Syncing Your Data</Text>
          <Text style={styles.message}>{statusMessage}</Text>
          {progress > 0 && progress < 100 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${progress}%`,
                      backgroundColor: theme?.primary || '#2196F3',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          )}
          <Text style={styles.hint}>This may take a moment...</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 16,
    padding: 32,
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      },
    }),
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  hint: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 16,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SyncBlockingIndicator;
