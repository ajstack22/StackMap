import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import syncService from '../../services/sync/syncService';
import { styles } from './styles';

const SyncStatusIndicator = ({ theme, compact = false, showDetails = true }) => {
  const [syncStatus, setSyncStatus] = useState({
    status: 'idle',
    error: null,
    lastAttempt: null,
    lastSuccess: null,
    isOnline: true,
    queueStatus: { pending: 0, failed: 0 }
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Subscribe to sync status updates
    const unsubscribe = syncService.addStatusListener(setSyncStatus);
    
    // Pulse animation for syncing state
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    if (syncStatus.status === 'syncing') {
      pulse.start();
    } else {
      pulse.stop();
      pulseAnim.setValue(1);
    }
    
    return () => {
      unsubscribe();
      pulse.stop();
    };
  }, [syncStatus.status]);

  const getStatusIcon = () => {
    const { status, isOnline, queueStatus } = syncStatus;
    
    if (!isOnline) {
      return { name: 'cloud-off', color: '#ff9800' };
    }
    
    switch (status) {
      case 'syncing':
        return { name: 'sync', color: theme.primary };
      case 'success':
        return { name: 'cloud-done', color: '#4caf50' };
      case 'error':
        return { name: 'error-outline', color: '#f44336' };
      case 'offline':
        return { name: 'cloud-off', color: '#ff9800' };
      default:
        if (queueStatus.pending > 0) {
          return { name: 'cloud-queue', color: '#ff9800' };
        }
        return { name: 'cloud', color: '#999' };
    }
  };

  const getStatusText = () => {
    const { status, error, isOnline, queueStatus } = syncStatus;
    
    if (!isOnline) {
      return 'Offline';
    }
    
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'success':
        return 'Synced';
      case 'error':
        return compact ? 'Error' : (error || 'Sync error');
      case 'offline':
        return 'Offline';
      default:
        if (queueStatus.pending > 0) {
          return `${queueStatus.pending} pending`;
        }
        return 'Sync enabled';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const handlePress = () => {
    if (showDetails) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleRetry = async () => {
    try {
      await syncService.retryFailed();
    } catch (error) {
      console.error('Failed to retry sync:', error);
    }
  };

  const { name: iconName, color: iconColor } = getStatusIcon();
  const statusText = getStatusText();

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactContainer, { borderColor: iconColor }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {syncStatus.status === 'syncing' ? (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <ActivityIndicator size="small" color={iconColor} />
          </Animated.View>
        ) : (
          <Icon name={iconName} size={20} color={iconColor} />
        )}
        {!compact && <Text style={[styles.statusText, { color: iconColor }]}>{statusText}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.statusBar}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.statusContent}>
          {syncStatus.status === 'syncing' ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <ActivityIndicator size="small" color={iconColor} />
            </Animated.View>
          ) : (
            <Icon name={iconName} size={24} color={iconColor} />
          )}
          <Text style={[styles.statusText, { color: iconColor }]}>{statusText}</Text>
        </View>
        
        {showDetails && (
          <Icon 
            name={isExpanded ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#666" 
          />
        )}
      </TouchableOpacity>

      {isExpanded && showDetails && (
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last sync:</Text>
            <Text style={styles.detailValue}>
              {formatTime(syncStatus.lastSuccess)}
            </Text>
          </View>
          
          {syncStatus.queueStatus.pending > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pending:</Text>
              <Text style={styles.detailValue}>
                {syncStatus.queueStatus.pending} changes
              </Text>
            </View>
          )}
          
          {syncStatus.queueStatus.failed > 0 && (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: '#f44336' }]}>Failed:</Text>
                <Text style={[styles.detailValue, { color: '#f44336' }]}>
                  {syncStatus.queueStatus.failed} items
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={handleRetry}
              >
                <Icon name="refresh" size={16} color="white" />
                <Text style={styles.retryButtonText}>Retry Failed</Text>
              </TouchableOpacity>
            </>
          )}
          
          {syncStatus.error && (
            <Text style={styles.errorText}>{syncStatus.error}</Text>
          )}
          
          {!syncStatus.isOnline && (
            <Text style={styles.offlineText}>
              Waiting for network connection...
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default SyncStatusIndicator;