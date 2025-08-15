import React, { useState, useEffect } from 'react';
import { Text } from '../Typography';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
  
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import createStyles from './styles';
import { CUSTOM_IMAGE_SOURCES, getCustomImageSource } from '../../constants';

const ShareView = ({ shareToken, theme = { primary: '#667eea' } }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [selectedDay, setSelectedDay] = useState('today');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [windowWidth, setWindowWidth] = useState(Platform.OS === 'web' ? window.innerWidth : 0);
  
  const styles = createStyles(isDarkMode);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    // Return empty cleanup function for non-web platforms
    return () => {};
  }, []);

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

      // Check if this is a v2 encrypted share
      // Handle test mode
      if (data.test_mode) {
        setShareData({
          success: true,
          testMode: true,
          message: data.message,
          tokenInfo: data.token_info,
          recipient_name: data.recipient_name,
          share_note: data.share_note,
          expires_at: data.expires_at
        });
        setLoading(false);
        return;
      }
      
      if (data.version === 2) {
        try {
          // Decrypt the data client-side
          const encryptedData = data.encrypted_data;
          
          // Convert token back to key
          const paddedToken = shareToken.replace(/-/g, '+').replace(/_/g, '/');
          // Add padding if needed
          const padding = (4 - (paddedToken.length % 4)) % 4;
          const fullToken = paddedToken + '='.repeat(padding);
          const shareKey = util.decodeBase64(fullToken);
          
          // Decode the encrypted data
          const combined = util.decodeBase64(encryptedData);
          
          // Extract nonce and ciphertext
          const nonce = combined.slice(0, nacl.secretbox.nonceLength);
          const ciphertext = combined.slice(nacl.secretbox.nonceLength);
          
          // Decrypt
          const decrypted = nacl.secretbox.open(ciphertext, nonce, shareKey);
          if (!decrypted) {
            throw new Error('Failed to decrypt share data - invalid key');
          }
          
          // Parse decrypted data
          const decryptedString = util.encodeUTF8(decrypted);
          const shareData = JSON.parse(decryptedString);
          
          // Format for display (similar to v1 structure)
          setShareData({
            user: shareData.user,
            recipient_name: data.recipient_name,
            share_note: data.share_note,
            shared_at: shareData.shared_at,
            expires_at: data.expires_at,
            access_count: data.access_count,
            read_only: true
          });
        } catch (decryptError) {
          throw new Error('Failed to decrypt share data. The link may be corrupted.');
        }
      } else {
        // V1 legacy share - data already decrypted by server
        setShareData(data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderUserIcon = (user) => {
    if (user.icon && user.icon.includes('.png')) {
      const imageSource = getCustomImageSource(user.icon);
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
      const activityIcon = activity.icon || activity.icon;
      if (activityIcon && activityIcon.includes('.png')) {
        const imageSource = getCustomImageSource(activityIcon);
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
      return <Text style={styles.activityEmoji}>{activityIcon || '🎯'}</Text>;
    };

    return (
      <View key={activity.id || index} style={styles.activityCard}>
        <View style={styles.activityContent}>
          <View style={styles.activityEmojiContainer}>
            {renderActivityEmoji()}
          </View>
          <View style={styles.activityTextContainer}>
            <Text style={styles.activityTitle}>{activity.text || activity.text || activity.name}</Text>
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
  
  // Handle test mode display
  if (shareData?.testMode) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="check-circle" size={48} color="#4CAF50" />
          <Text style={styles.title}>Share Endpoint Working!</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.message}>{shareData.message}</Text>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Token Information:</Text>
            <Text style={styles.infoText}>Type: {shareData.tokenInfo?.type}</Text>
            <Text style={styles.infoText}>Length: {shareData.tokenInfo?.length} characters</Text>
            <Text style={styles.infoText}>Token: {shareData.tokenInfo?.token?.substring(0, 20)}...</Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Share Details:</Text>
            <Text style={styles.infoText}>Recipient: {shareData.recipient_name || 'None'}</Text>
            <Text style={styles.infoText}>Note: {shareData.share_note || 'None'}</Text>
            <Text style={styles.infoText}>Expires: {shareData.expires_at}</Text>
          </View>
          <Text style={styles.successNote}>
            ✅ The share system is working correctly!{'\n'}
            The issue is with the database connection in access_share.php
          </Text>
        </View>
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
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{user.name}'s Progress</Text>
            <Text style={styles.shareInfo}>
              Shared {format(new Date(shared_at), 'MMM d, yyyy h:mm a')}
            </Text>
            {recipient_name && (
              <Text style={styles.recipientInfo}>For: {recipient_name}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerControls}>
          {/* Dark Mode Toggle */}
          <TouchableOpacity
            style={styles.darkModeToggle}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            <Icon 
              name={isDarkMode ? "brightness-7" : "brightness-4"} 
              size={24} 
              color={isDarkMode ? '#fff' : '#666'} 
            />
            <Text style={[styles.darkModeText, { color: isDarkMode ? '#fff' : '#666' }]}>
              {isDarkMode ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>
          {/* Try StackMap button - desktop only */}
          {Platform.OS === 'web' && windowWidth > 768 && (
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => window.location.href = '/'}
            >
              <Text style={styles.ctaButtonText}>Try StackMap</Text>
            </TouchableOpacity>
          )}
        </View>
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
          Powered by StackMap - Better days through shared understanding
        </Text>
      </View>
      
      {/* Mobile Try StackMap button */}
      {Platform.OS === 'web' && windowWidth <= 768 && (
        <View style={styles.mobileCtaContainer}>
          <TouchableOpacity
            style={styles.mobileCtaButton}
            onPress={() => window.location.href = '/'}
          >
            <Text style={styles.mobileCtaButtonText}>Try StackMap</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ShareView;