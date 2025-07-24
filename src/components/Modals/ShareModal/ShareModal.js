import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Clipboard,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import styles from './styles';
import syncService from '../../../services/sync/syncService';

const ShareModal = ({
  visible,
  onClose,
  theme,
  user,
  userId,
  showToast,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [expiresHours, setExpiresHours] = useState('24');
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includeTomorrow, setIncludeTomorrow] = useState(true);
  const [activeShares, setActiveShares] = useState([]);
  const [showActiveShares, setShowActiveShares] = useState(false);

  useEffect(() => {
    if (visible) {
      // Generate new token when modal opens
      const token = syncService.generateShareToken();
      setShareToken(token);
      loadActiveShares();
    } else {
      // Reset form
      setShareToken('');
      setShareUrl('');
      setRecipientName('');
      setShareNote('');
      setExpiresHours('24');
      setIncludeCompleted(true);
      setIncludeTomorrow(true);
    }
  }, [visible]);

  const loadActiveShares = async () => {
    const shares = await syncService.getActiveShares();
    setActiveShares(shares.filter(share => share.userId === userId));
  };

  const handleCreateShare = async () => {
    setLoading(true);
    try {
      const result = await syncService.createShareLink(userId, {
        recipientName,
        shareNote,
        includeCompleted,
        includeTomorrow,
        expiresHours: parseInt(expiresHours),
        accessToken: shareToken
      });

      setShareUrl(result.share_url);
      showToast({ message: 'Share link created!' });
      loadActiveShares();
    } catch (error) {
      showToast({ 
        message: error.message || 'Failed to create share link',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(shareUrl);
    } else {
      Clipboard.setString(shareUrl);
    }
    showToast({ message: 'Link copied to clipboard!' });
  };

  const handleDeleteShare = async (shareId) => {
    Alert.alert(
      'Delete Share Link',
      'Are you sure you want to delete this share link?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await syncService.deleteShare(shareId);
            showToast({ message: 'Share link deleted' });
            loadActiveShares();
          }
        }
      ]
    );
  };

  const getExpirationOptions = () => [
    { label: '1 hour', value: '1' },
    { label: '6 hours', value: '6' },
    { label: '24 hours', value: '24' },
    { label: '3 days', value: '72' },
    { label: '1 week', value: '168' },
    { label: '1 month', value: '720' },    // 30 days
    { label: '2 months', value: '1440' },  // 60 days
    { label: '3 months', value: '2160' },  // 90 days
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent,
          { paddingBottom: insets.bottom + 20 }
        ]}>
          <View style={styles.header}>
            <Text style={styles.title}>Share {user?.name}'s Progress</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {!shareUrl ? (
              <>
                {/* Create Share Form */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Share Settings</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Recipient (optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={recipientName}
                      onChangeText={setRecipientName}
                      placeholder="e.g., Dr. Smith, Teacher Jane"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Note (optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={shareNote}
                      onChangeText={setShareNote}
                      placeholder="Add any notes for the recipient..."
                      placeholderTextColor="#999"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Expires in</Text>
                    <View style={styles.expirationOptions}>
                      {getExpirationOptions().map(option => (
                        <TouchableOpacity
                          key={option.value}
                          style={[
                            styles.expirationOption,
                            expiresHours === option.value && styles.expirationOptionActive
                          ]}
                          onPress={() => setExpiresHours(option.value)}
                        >
                          <Text style={[
                            styles.expirationOptionText,
                            expiresHours === option.value && styles.expirationOptionTextActive
                          ]}>
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.checkboxGroup}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setIncludeCompleted(!includeCompleted)}
                    >
                      <Icon 
                        name={includeCompleted ? 'check-box' : 'check-box-outline-blank'}
                        size={24}
                        color={theme.primary}
                      />
                      <Text style={styles.checkboxLabel}>Show completed activities</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setIncludeTomorrow(!includeTomorrow)}
                    >
                      <Icon 
                        name={includeTomorrow ? 'check-box' : 'check-box-outline-blank'}
                        size={24}
                        color={theme.primary}
                      />
                      <Text style={styles.checkboxLabel}>Include tomorrow's plan</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.tokenPreview}>
                  <Text style={styles.tokenLabel}>Access Code</Text>
                  <Text style={styles.tokenText}>{shareToken}</Text>
                  <Text style={styles.tokenHint}>This code will be part of your share link</Text>
                </View>

                <TouchableOpacity
                  style={[styles.createButton, loading && styles.createButtonDisabled]}
                  onPress={handleCreateShare}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="share" size={20} color="#fff" />
                      <Text style={styles.createButtonText}>Create Share Link</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Share Link Created */}
                <View style={styles.successSection}>
                  <Icon name="check-circle" size={48} color="#4CAF50" />
                  <Text style={styles.successTitle}>Share Link Created!</Text>
                  
                  {/* QR Code */}
                  <View style={styles.qrCodeContainer}>
                    <QRCode
                      value={shareUrl}
                      size={200}
                      color="#000"
                      backgroundColor="#fff"
                    />
                  </View>
                  
                  <Text style={styles.qrCodeHint}>Scan this code or share the link below</Text>
                  
                  <View style={styles.urlContainer}>
                    <Text style={styles.urlText} numberOfLines={2}>{shareUrl}</Text>
                    <TouchableOpacity style={styles.copyButton} onPress={handleCopyUrl}>
                      <Icon name="content-copy" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  </View>

                  {recipientName && (
                    <Text style={styles.recipientInfo}>For: {recipientName}</Text>
                  )}

                  <Text style={styles.expirationInfo}>
                    Expires in {
                      parseInt(expiresHours) >= 720 
                        ? `${Math.floor(parseInt(expiresHours) / 720)} month${Math.floor(parseInt(expiresHours) / 720) > 1 ? 's' : ''}`
                        : parseInt(expiresHours) >= 168
                        ? `${Math.floor(parseInt(expiresHours) / 168)} week${Math.floor(parseInt(expiresHours) / 168) > 1 ? 's' : ''}`
                        : parseInt(expiresHours) >= 24
                        ? `${Math.floor(parseInt(expiresHours) / 24)} day${Math.floor(parseInt(expiresHours) / 24) > 1 ? 's' : ''}`
                        : `${expiresHours} hour${parseInt(expiresHours) > 1 ? 's' : ''}`
                    }
                  </Text>

                  <TouchableOpacity
                    style={styles.newShareButton}
                    onPress={() => {
                      setShareUrl('');
                      setShareToken(syncService.generateShareToken());
                    }}
                  >
                    <Text style={styles.newShareButtonText}>Create Another Share</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Active Shares */}
            {activeShares.length > 0 && (
              <View style={styles.activeSharesSection}>
                <TouchableOpacity
                  style={styles.activeSharesHeader}
                  onPress={() => setShowActiveShares(!showActiveShares)}
                >
                  <Text style={styles.activeSharesTitle}>
                    Active Shares ({activeShares.length})
                  </Text>
                  <Icon 
                    name={showActiveShares ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="#666"
                  />
                </TouchableOpacity>

                {showActiveShares && (
                  <View style={styles.sharesList}>
                    {activeShares.map(share => (
                      <View key={share.shareId} style={styles.shareItem}>
                        <View style={styles.shareItemInfo}>
                          <Text style={styles.shareItemToken}>{share.token}</Text>
                          {share.recipientName && (
                            <Text style={styles.shareItemRecipient}>
                              For: {share.recipientName}
                            </Text>
                          )}
                          <Text style={styles.shareItemExpires}>
                            Expires: {new Date(share.expiresAt).toLocaleString()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteShareButton}
                          onPress={() => handleDeleteShare(share.shareId)}
                        >
                          <Icon name="delete" size={20} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ShareModal;