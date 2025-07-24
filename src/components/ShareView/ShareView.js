import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import styles from './styles';
import { CUSTOM_IMAGE_SOURCES } from '../../constants';

const ShareView = ({ shareToken, theme = { primary: '#667eea' } }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('today');

  useEffect(() => {
    if (shareToken) {
      loadShareData();
    }
  }, [shareToken]);

  const loadShareData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use relative path to work in both qual and prod environments
      const apiPath = Platform.OS === 'web' && window.location.pathname.includes('/qual/')
        ? '/qual/api/sync/access_share.php'
        : '/api/sync/access_share.php';

      const response = await fetch(
        `${apiPath}?token=${shareToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to load share data');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Invalid share link');
      }

      setShareData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderUserIcon = (user) => {
    if (user.icon && user.icon.includes('.png')) {
      const imageSource = CUSTOM_IMAGE_SOURCES[user.icon];
      if (imageSource) {
        return (
          <Image 
            source={imageSource} 
            style={styles.userImage}
            resizeMode="contain"
          />
        );
      }
    }
    return <Text style={styles.userIcon}>{user.icon || '😀'}</Text>;
  };

  const renderActivity = (activity, index) => {
    // Skip deleted activities
    if (activity.deleted) return null;

    const renderActivityEmoji = () => {
      if (activity.emoji && activity.emoji.includes('.png')) {
        const imageSource = CUSTOM_IMAGE_SOURCES[activity.emoji];
        if (imageSource) {
          return (
            <Image 
              source={imageSource} 
              style={styles.activityImage}
              resizeMode="contain"
            />
          );
        }
      }
      return <Text style={styles.activityEmoji}>{activity.emoji || '🎯'}</Text>;
    };

    return (
      <View key={activity.id || index} style={styles.activityCard}>
        <View style={styles.activityContent}>
          <View style={styles.activityEmojiContainer}>
            {renderActivityEmoji()}
          </View>
          <View style={styles.activityTextContainer}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            {activity.description && (
              <Text style={styles.activityDescription}>{activity.description}</Text>
            )}
            {activity.time && (
              <View style={styles.activityTimeContainer}>
                <Icon name="access-time" size={14} color="#999" />
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={[
          styles.completionCircle,
          activity.completed && styles.completionCircleCompleted
        ]}>
          {activity.completed && (
            <Icon name="check" size={20} color="#fff" />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading shared progress...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#ff4444" />
        <Text style={styles.errorTitle}>Unable to Load Share</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => window.location.href = '/'}
          >
            <Text style={styles.backButtonText}>Go to StackMap</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!shareData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorMessage}>No data available</Text>
      </View>
    );
  }

  const { user, shared_at, expires_at, recipient_name, share_note } = shareData;
  const days = user?.days || {};
  const activities = days[selectedDay]?.activities || [];
  const completedCount = activities.filter(a => a.completed && !a.deleted).length;
  const totalCount = activities.filter(a => !a.deleted).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userIconContainer}>
            {renderUserIcon(user)}
          </View>
          <View>
            <Text style={styles.userName}>{user.name}'s Progress</Text>
            <Text style={styles.shareInfo}>
              Shared {format(new Date(shared_at), 'MMM d, yyyy h:mm a')}
            </Text>
            {recipient_name && (
              <Text style={styles.recipientInfo}>For: {recipient_name}</Text>
            )}
          </View>
        </View>
        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => window.location.href = '/'}
          >
            <Text style={styles.ctaButtonText}>Try StackMap</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Share Note */}
      {share_note && (
        <View style={styles.noteContainer}>
          <Icon name="note" size={20} color="#666" />
          <Text style={styles.noteText}>{share_note}</Text>
        </View>
      )}

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {Object.keys(days).map(day => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayTab,
              selectedDay === day && styles.dayTabActive
            ]}
            onPress={() => setSelectedDay(day)}
          >
            <Text style={[
              styles.dayTabText,
              selectedDay === day && styles.dayTabTextActive
            ]}>
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <Text style={styles.progressText}>
          {completedCount} of {totalCount} activities completed
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%',
                backgroundColor: theme.primary 
              }
            ]} 
          />
        </View>
      </View>

      {/* Activities */}
      <ScrollView style={styles.activitiesContainer} showsVerticalScrollIndicator={false}>
        {activities.length > 0 ? (
          activities.map((activity, index) => renderActivity(activity, index))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="event" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No activities for {selectedDay}</Text>
          </View>
        )}
        
        {/* Expiration Warning */}
        <View style={styles.expirationWarning}>
          <Icon name="access-time" size={16} color="#ff9800" />
          <Text style={styles.expirationText}>
            This share expires {format(new Date(expires_at), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by StackMap - Visual task management for everyone
        </Text>
      </View>
    </View>
  );
};

export default ShareView;