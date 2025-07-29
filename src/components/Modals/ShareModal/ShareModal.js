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
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import styles from './styles';
import syncService from '../../../services/sync/syncService';
import { COLORS, SPACING } from '../../../constants';

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
  const [expiresHours, setExpiresHours] = useState('168'); // Default to 1 week
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includeTomorrow, setIncludeTomorrow] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true); // New state for auto-update
  const [activeShares, setActiveShares] = useState([]);
  const [showActiveShares, setShowActiveShares] = useState(true);
  const [extendingShare, setExtendingShare] = useState(null);
  const [extendDuration, setExtendDuration] = useState('168');

  useEffect(() => {
    if (visible) {
      // Generate new secure token when modal opens (v2 encrypted shares)
      const token = syncService.generateShareToken(true); // true = secure 24-char token
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
      setAutoUpdate(true);
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
        autoUpdate,
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

  const handleExtendShare = async (shareId) => {
    try {
      await syncService.extendShare(shareId, parseInt(extendDuration));
      showToast({ message: 'Share link extended!' });
      setExtendingShare(null);
      setExtendDuration('168');
      loadActiveShares();
    } catch (error) {
      showToast({ message: error.message || 'Failed to extend share' });
    }
  };

  const getExpirationOptions = () => [
    { label: '1 day', value: '24' },
    { label: '1 week', value: '168' },
    { label: '1 month', value: '720' },    // 30 days
    { label: '3 months', value: '2160' },  // 90 days
    { label: '6 months', value: '4320' },  // 180 days
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {Platform.OS === 'android' && (
        <StatusBar 
          backgroundColor={theme.primary} 
          barStyle="light-content" 
          translucent={false}
        />
      )}
      <View style={[styles.modalContainer, { backgroundColor: theme.light }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <View style={styles.headerLeft}>
              <Icon name="share" size={24} color="white" style={styles.headerIcon} />
              <Text style={styles.modalTitle}>Share {user?.name}'s Progress</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={{ flex: 1, backgroundColor: theme.light }}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Create Share Form */}
            <View style={[styles.section, shareUrl && styles.sectionCollapsed]}>
                  <Text style={styles.sectionTitle}>{shareUrl ? 'New Share' : 'Share Settings'}</Text>
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
                    <View style={styles.toggleContainer}>
                      {getExpirationOptions().map(option => (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.toggle, expiresHours === option.value && styles.toggleActive]}
                          onPress={() => setExpiresHours(option.value)}
                        >
                          <Text style={[styles.toggleText, expiresHours === option.value && styles.toggleTextActive]}>
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
                      <View style={[styles.checkboxContainer, { borderColor: theme.primary, backgroundColor: includeCompleted ? theme.primary : 'white' }]}>
                        {includeCompleted && <Icon name="check" size={18} color="white" />}
                      </View>
                      <Text style={styles.checkboxLabel}>Show completed activities</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setIncludeTomorrow(!includeTomorrow)}
                    >
                      <View style={[styles.checkboxContainer, { borderColor: theme.primary, backgroundColor: includeTomorrow ? theme.primary : 'white' }]}>
                        {includeTomorrow && <Icon name="check" size={18} color="white" />}
                      </View>
                      <Text style={styles.checkboxLabel}>Include tomorrow's plan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setAutoUpdate(!autoUpdate)}
                    >
                      <View style={[styles.checkboxContainer, { borderColor: theme.primary, backgroundColor: autoUpdate ? theme.primary : 'white' }]}>
                        {autoUpdate && <Icon name="check" size={18} color="white" />}
                      </View>
                      <Text style={styles.checkboxLabel}>Keep share up-to-date</Text>
                    </TouchableOpacity>
                    
                    {autoUpdate && (
                      <Text style={styles.autoUpdateHint}>
                        Share will automatically update when activities change
                      </Text>
                    )}
                  </View>

                <View style={styles.tokenPreview}>
                  <View style={styles.tokenHeader}>
                    <Icon name="lock" size={16} color="#000" />
                    <Text style={styles.tokenLabel}>End-to-End Encrypted Share</Text>
                  </View>
                  <Text style={styles.tokenHint}>
                    Your data will be encrypted before sharing
                  </Text>
                </View>

                {!shareUrl && (
                  <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: theme.primary }, loading && styles.createButtonDisabled]}
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
                )}
            </View>

            {/* Share Link Created */}
            {shareUrl && (
              <View style={styles.shareSection}>
                  <View style={styles.successHeader}>
                    <Icon name="check-circle" size={32} color={COLORS.success} />
                    <Text style={styles.sectionTitle}>Share Link Created!</Text>
                    <TouchableOpacity
                      style={styles.newShareLink}
                      onPress={() => {
                        setShareUrl('');
                        setShareToken(syncService.generateShareToken(true));
                        setRecipientName('');
                        setShareNote('');
                      }}
                    >
                      <Icon name="add-circle-outline" size={20} color={theme.primary} />
                      <Text style={[styles.newShareLinkText, { color: theme.primary }]}>New Share</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* QR Code */}
                  <View style={styles.qrContainer}>
                    <QRCode
                      value={shareUrl}
                      size={200}
                      color="#000000"
                      backgroundColor="#ffffff"
                    />
                  </View>
                  
                  {/* Copy Buttons */}
                  <TouchableOpacity 
                    style={[styles.button, { backgroundColor: theme.primary }]} 
                    onPress={handleCopyUrl}
                  >
                    <Icon name="content-copy" size={20} color="white" />
                    <Text style={styles.buttonText}>Copy Full Share Link</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, { backgroundColor: theme.primary, opacity: 0.8 }]} 
                    onPress={() => {
                      Clipboard.setString(shareToken);
                      showToast({ message: 'Encryption key copied!' });
                    }}
                  >
                    <Icon name="key" size={20} color="white" />
                    <Text style={styles.buttonText}>Copy Encryption Key Only</Text>
                  </TouchableOpacity>

                  {recipientName && (
                    <View style={styles.metaInfo}>
                      <Text style={styles.metaLabel}>For: {recipientName}</Text>
                    </View>
                  )}

                  <Text style={styles.metaLabel}>
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

                </View>
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
                    color="#000"
                  />
                </TouchableOpacity>

                {showActiveShares && (
                  <View style={styles.sharesList}>
                    {activeShares.map(share => {
                      const isExpired = new Date(share.expiresAt) < new Date();
                      const isIdle = share.status === 'idle';
                      
                      return (
                        <View key={share.shareId} style={[styles.activeShareItem, isIdle && styles.idleShareItem]}>
                          <View style={styles.activeShareInfo}>
                            {isIdle && (
                              <View style={styles.idleBadge}>
                                <Icon name="pause-circle-outline" size={16} color={COLORS.warning} />
                                <Text style={styles.idleBadgeText}>Idle</Text>
                              </View>
                            )}
                            <Text style={styles.activeShareRecipient}>
                              {share.recipientName || 'Unnamed share'}
                            </Text>
                            <Text style={styles.activeShareMeta}>
                              {isExpired ? 'Expired' : 'Expires'}: {new Date(share.expiresAt).toLocaleDateString()}
                            </Text>
                            {share.autoUpdate && (
                              <View style={styles.autoUpdateBadge}>
                                <Text style={styles.autoUpdateText}>Auto-update</Text>
                              </View>
                            )}
                          </View>
                          
                          {extendingShare === share.shareId ? (
                            <View style={styles.extendControls}>
                              <View style={styles.miniToggleContainer}>
                                {['24', '168', '720'].map(value => (
                                  <TouchableOpacity
                                    key={value}
                                    style={[styles.miniToggle, extendDuration === value && styles.miniToggleActive]}
                                    onPress={() => setExtendDuration(value)}
                                  >
                                    <Text style={[styles.miniToggleText, extendDuration === value && styles.miniToggleTextActive]}>
                                      {value === '24' ? '1d' : value === '168' ? '1w' : '1m'}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                              <View style={styles.extendButtons}>
                                <TouchableOpacity
                                  style={styles.extendConfirmButton}
                                  onPress={() => handleExtendShare(share.shareId)}
                                >
                                  <Icon name="check" size={16} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.extendCancelButton}
                                  onPress={() => {
                                    setExtendingShare(null);
                                    setExtendDuration('168');
                                  }}
                                >
                                  <Icon name="close" size={16} color={COLORS.gray[600]} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.activeShareActions}>
                              {isIdle ? (
                                <>
                                  <TouchableOpacity
                                    style={[styles.extendShareButton, { backgroundColor: theme.light }]}
                                    onPress={() => setExtendingShare(share.shareId)}
                                  >
                                    <Icon name="restore" size={16} color={theme.primary} />
                                    <Text style={[styles.extendShareButtonText, { color: theme.primary }]}>Re-enable</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.deleteShareButton}
                                    onPress={() => handleDeleteShare(share.shareId)}
                                  >
                                    <Icon name="delete" size={16} color="#e53e3e" />
                                    <Text style={styles.deleteShareButtonText}>Delete</Text>
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <>
                                  <TouchableOpacity
                                    style={styles.viewShareButton}
                                    onPress={() => {
                                      Clipboard.setString(share.shareUrl);
                                      showToast({ message: 'Share link copied!' });
                                    }}
                                  >
                                    <Icon name="content-copy" size={16} color={COLORS.gray[700]} />
                                    <Text style={styles.viewShareButtonText}>Copy</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.extendShareButton}
                                    onPress={() => setExtendingShare(share.shareId)}
                                  >
                                    <Icon name="update" size={16} color={theme.primary} />
                                    <Text style={[styles.extendShareButtonText, { color: theme.primary }]}>Extend</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.deleteShareButton}
                                    onPress={() => handleDeleteShare(share.shareId)}
                                  >
                                    <Icon name="delete" size={16} color="#e53e3e" />
                                    <Text style={styles.deleteShareButtonText}>Delete</Text>
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
        <SafeAreaView style={{ backgroundColor: theme.light }} />
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.light, height: Math.max(insets.bottom, 20) }} />
        )}
      </View>
    </Modal>
  );
};

export default ShareModal;