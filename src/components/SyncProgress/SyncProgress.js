import React, { useState, useEffect, useRef } from 'react';
import { Text } from '../Typography';
import { View, Animated, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TYPOGRAPHY } from '../../constants';
import syncService from '../../services/sync/syncServiceSimple';

const SyncProgress = ({ theme }) => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Subscribe to sync status updates
    const updateStatus = status => {
      setSyncStatus(status);

      if (status) {
        // Show the progress indicator
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Hide after a delay
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: -100,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }, 1000);
      }
    };

    const updateProgress = value => {
      setProgress(value);
    };

    // Set up listeners
    syncService.onStatusChange = updateStatus;
    syncService.onProgressChange = updateProgress;

    return () => {
      // Clean up listeners
      syncService.onStatusChange = null;
      syncService.onProgressChange = null;
    };
  }, []);

  if (!syncStatus) {
    return null;
  }

  const getStatusMessage = () => {
    if (!syncStatus) return '';

    switch (syncStatus.phase) {
      case 'checking':
        return 'Checking for updates...';
      case 'pulling':
        return 'Downloading data...';
      case 'decrypting':
        return 'Decrypting...';
      case 'merging':
        return 'Merging changes...';
      case 'encrypting':
        return 'Encrypting...';
      case 'pushing':
        return 'Uploading changes...';
      case 'restoring':
        return 'Restoring data...';
      case 'complete':
        return 'Sync complete!';
      case 'error':
        return 'Sync error';
      default:
        return 'Syncing...';
    }
  };

  const getStatusIcon = () => {
    if (syncStatus?.phase === 'complete') {
      return 'check-circle';
    }
    if (syncStatus?.phase === 'error') {
      return 'error-outline';
    }
    return 'sync';
  };

  const getStatusColor = () => {
    if (syncStatus?.phase === 'complete') {
      return '#4caf50';
    }
    if (syncStatus?.phase === 'error') {
      return '#f44336';
    }
    return theme?.primary || '#2196F3';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={[styles.progressCard, { backgroundColor: '#fff' }]}>
        <View style={styles.iconContainer}>
          <Icon
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
            style={
              syncStatus?.phase !== 'complete' && syncStatus?.phase !== 'error'
                ? styles.rotatingIcon
                : {}
            }
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.statusText}>{getStatusMessage()}</Text>
          {syncStatus?.details && (
            <Text style={styles.detailsText}>{syncStatus.details}</Text>
          )}
        </View>
        {progress > 0 && progress < 100 && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progress}%`,
                  backgroundColor: getStatusColor(),
                },
              ]}
            />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
    }),
    minWidth: 200,
    maxWidth: '90%',
  },
  iconContainer: {
    marginRight: 12,
  },
  rotatingIcon: {
    // Will be animated with a rotation animation
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '500',
    color: '#333',
  },
  detailsText: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#666',
    marginTop: 2,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#e0e0e0',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
});

export default SyncProgress;
