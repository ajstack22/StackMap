import React, { useState, useEffect } from 'react';
import { Text } from '../Typography';
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Platform,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import createStyles from './styles';
import { CUSTOM_IMAGE_SOURCES, getCustomImageSource, THEMES } from '../../constants';
import PreferencesModal from '../Modals/PreferencesModal';
import { BUILD_VERSION } from '../../utils/version';

const ShareView = ({ shareToken, shareId, shareKey }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [windowWidth, setWindowWidth] = useState(
    Platform.OS === 'web' ? window.innerWidth : 0,
  );
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('stackBlue');
  
  // Get theme from state
  const theme = THEMES[currentTheme] || THEMES.stackBlue;
  const styles = createStyles(theme.primary);

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
    // If we have shareId and shareKey from props (best case - captured immediately)
    if (shareId && shareKey) {
      loadShareDataV3(shareId, shareKey);
    }
    // Legacy V2 format: ?share=[token]
    else if (shareToken) {
      loadShareData();
    }
    // Fallback: try to detect from URL (shouldn't happen with proper capture)
    else if (Platform.OS === 'web') {
      const path = window.location.pathname;
      
      if (path.includes('/share/')) {
        const match = path.match(/\/share\/([A-Za-z0-9\-_]+)/);
        const id = match?.[1];
        const key = window.location.hash.substring(1);
        
        if (id && key) {
          loadShareDataV3(id, key);
        } else if (id) {
          setError('Invalid share link - missing security key');
          setLoading(false);
        } else {
          setError('Invalid share link format');
          setLoading(false);
        }
      } else {
        setError('No share data provided');
        setLoading(false);
      }
    } else {
      setError('No share data provided');
      setLoading(false);
    }
  }, [shareToken, shareId, shareKey]);

  const loadShareData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use relative path to work in both qual and prod environments
      const apiPath =
        Platform.OS === 'web' && window.location.pathname.includes('/qual/')
          ? '/qual/api/sync/access_share.php'
          : '/api/sync/access_share.php';

      const response = await fetch(`${apiPath}?token=${shareToken}`);

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
          expires_at: data.expires_at,
        });
        setLoading(false);
        return;
      }

      if (data.version === 2 || data.version === 3) {
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
            read_only: true,
          });
        } catch (decryptError) {
          throw new Error(
            'Failed to decrypt share data. The link may be corrupted.',
          );
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

  const renderUserIcon = user => {
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

  // New function for V3 format
  const loadShareDataV3 = async (shareId, encryptionKey) => {
    try {
      setLoading(true);
      setError(null);

      // Use relative path to work in both qual and prod environments
      const apiPath =
        Platform.OS === 'web' && window.location.pathname.includes('/qual/')
          ? '/qual/api/sync/access_share.php'
          : '/api/sync/access_share.php';

      // V3: Fetch by ID only (key not sent to server)
      const response = await fetch(`${apiPath}?id=${shareId}`);

      if (!response.ok) {
        throw new Error('Failed to load share data');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Invalid share link');
      }

      // V3 decryption using key from fragment
      if (data.version === 3) {
        try {
          const encryptedData = data.encrypted_data;

          // Convert key back from URL-safe format
          const paddedKey = encryptionKey.replace(/-/g, '+').replace(/_/g, '/');
          const padding = (4 - (paddedKey.length % 4)) % 4;
          const fullKey = paddedKey + '='.repeat(padding);
          const shareKey = util.decodeBase64(fullKey);

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

          // Format for display
          setShareData({
            user: shareData.user,
            recipient_name: data.recipient_name,
            share_note: data.share_note,
            shared_at: shareData.shared_at,
            expires_at: data.expires_at,
            testMode: false,
            version: 3,
          });
        } catch (decryptError) {
          console.error('Decryption error:', decryptError);
          setError('Failed to decrypt share data. The link may be invalid.');
        }
      } else {
        // Handle V2 data if accessed via ID (backward compat)
        setError('This share uses an older format. Please ask for a new share link.');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading share:', error);
      setError(error.message || 'Failed to load share');
      setLoading(false);
    }
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
            <Text style={styles.activityTitle}>{activity.text}</Text>
            {activity.description && (
              <Text style={styles.activityDescription}>
                {activity.description}
              </Text>
            )}
            {activity.time && (
              <View style={styles.activityTimeContainer}>
                <Icon name="access-time" size={14} color="#999" />
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            styles.completionCircle,
            activity.completed && styles.completionCircleCompleted,
          ]}
        >
          {activity.completed && <Icon name="check" size={20} color="#fff" />}
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
            onPress={() => (window.location.href = '/')}
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
            <Text style={styles.infoText}>
              Type: {shareData.tokenInfo?.type}
            </Text>
            <Text style={styles.infoText}>
              Length: {shareData.tokenInfo?.length} characters
            </Text>
            <Text style={styles.infoText}>
              Token: {shareData.tokenInfo?.token?.substring(0, 20)}...
            </Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Share Details:</Text>
            <Text style={styles.infoText}>
              Recipient: {shareData.recipient_name || 'None'}
            </Text>
            <Text style={styles.infoText}>
              Note: {shareData.share_note || 'None'}
            </Text>
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
  // Show all activities from today (or first available day)
  const dayKey = days.today ? 'today' : Object.keys(days)[0];
  const activities = days[dayKey]?.activities || [];

  const handleClose = () => {
    if (Platform.OS === 'web') {
      window.location.href = 'https://stackmap.app';
    }
  };

  const handleSaveTheme = (newTheme) => {
    setCurrentTheme(newTheme);
  };

  const handlePrivacyPress = () => {
    if (Platform.OS === 'web') {
      window.open('https://stackmap.com/privacy', '_blank');
    }
  };

  const handleSupportPress = () => {
    if (Platform.OS === 'web') {
      window.open('https://stackmap.com/support', '_blank');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Left FAB - Preferences */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowPreferencesModal(true)}
        >
          <Icon name="palette" size={24} color={theme.primary} />
        </TouchableOpacity>

        {/* Center Content */}
        <View style={styles.headerCenter}>
          <View style={styles.logoRow}>
            <Image
              source={{ uri: '/icons/icon-192.png' }}
              style={styles.logoImage}
            />
            <Text style={styles.logoText}>StackMap</Text>
          </View>
          <TouchableOpacity style={styles.userPill} activeOpacity={0.8}>
            <Text style={styles.userEmoji}>
              {user?.icon || '👤'}
            </Text>
            <Text style={styles.userNamePill}>
              {user?.name || 'User'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right FAB - Close */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleClose}
        >
          <Icon name="close" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Share Note */}
      {share_note && (
        <View style={styles.noteContainer}>
          <Icon name="note" size={20} color="#666" />
          <Text style={styles.noteText}>{share_note}</Text>
        </View>
      )}


      {/* Activities */}
      <ScrollView
        style={styles.activitiesContainer}
        showsVerticalScrollIndicator={false}
      >
        {activities.length > 0 ? (
          activities.map((activity, index) => renderActivity(activity, index))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="event" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>
              No activities to display
            </Text>
          </View>
        )}

        {/* Expiration Warning */}
        <View style={styles.expirationWarning}>
          <Icon name="access-time" size={16} color="#ff9800" />
          <Text style={styles.expirationText}>
            This share expires{' '}
            {format(new Date(expires_at), 'MMM d, yyyy h:mm a')}
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by StackMap - Better days through shared understanding
        </Text>
      </View>

      {/* Preferences Modal */}
      <PreferencesModal
        visible={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        theme={theme}
        currentTheme={currentTheme}
        setCurrentTheme={setCurrentTheme}
        onSaveTheme={handleSaveTheme}
        onPrivacyPress={handlePrivacyPress}
        onSupportPress={handleSupportPress}
      />
    </SafeAreaView>
  );
};

export default ShareView;
