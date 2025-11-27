import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text } from '../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SPACING, TYPOGRAPHY, THEMES, RADIUS } from '../../../constants';

const { width: screenWidth } = Dimensions.get('window');
const IS_MOBILE = screenWidth < 768;

/**
 * Simplified Context Modal for User + Day selection
 * Follows standard modal patterns from DayManagementModal
 */
const ContextModal = ({
  visible,
  onClose,
  currentUser,
  users,
  theme,
  onUserChange,
  dayMode,
  currentDay,
  onDayChange,
}) => {
  const [selectedUser, setSelectedUser] = useState(currentUser);
  const [selectedDay, setSelectedDay] = useState(currentDay || 'today');

  // Get current user's theme for dynamic styling
  const currentUserThemeColor =
    (users && users[selectedUser]?.settings?.theme) || 'stackBlue';
  const currentUserTheme = THEMES[currentUserThemeColor] || theme || THEMES.stackBlue;

  // Sync state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedUser(currentUser);
      setSelectedDay(currentDay || 'today');
    }
  }, [visible, currentUser, currentDay]);

  const handleUserSelect = (userId) => {
    setSelectedUser(userId);
    if (onUserChange) {
      onUserChange(userId);
    }
  };

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    if (onDayChange) {
      onDayChange(day);
    }
  };

  // Get active users (filter out deleted)
  const activeUsers = Object.entries(users || {}).filter(
    ([, user]) => !user.deleted
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.outerContainer}>
        {Platform.OS === 'android' && (
          <StatusBar
            backgroundColor={currentUserTheme.primary}
            barStyle="light-content"
            translucent={false}
          />
        )}
        <View style={[styles.container, { backgroundColor: currentUserTheme.light }]}>
          {Platform.OS === 'android' && (
            <View
              style={{
                backgroundColor: currentUserTheme.primary,
                height: StatusBar.currentHeight || 24,
              }}
            />
          )}

          <SafeAreaView style={[styles.safeArea, { backgroundColor: currentUserTheme.primary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: currentUserTheme.primary }]}>
              <View style={styles.headerLeft}>
                <Icon name="people" size={24} color="white" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Context</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <View style={styles.closeCircle}>
                  <Icon name="close" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={[styles.content, { backgroundColor: currentUserTheme.light }]}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.contentSection}>
                {/* Form Panel - White card background */}
                <View style={styles.formPanel}>
                  {/* Panel Header */}
                  <View style={styles.panelHeader}>
                    <Icon name="people" size={48} color={currentUserTheme.primary} />
                    <Text style={styles.panelTitle}>Select Context</Text>
                    <Text style={styles.panelDescription}>
                      Choose which user and day to view
                    </Text>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* User Selection */}
                  <View style={styles.selectionSection}>
                    <Text style={styles.sectionTitle}>Select User</Text>
                    <View style={styles.usersList}>
                      {activeUsers.map(([userId, user]) => {
                        const isSelected = selectedUser === userId;
                        return (
                          <TouchableOpacity
                            key={userId}
                            style={[
                              styles.userCard,
                              isSelected && styles.userCardActive,
                              isSelected && { borderColor: currentUserTheme.primary },
                            ]}
                            onPress={() => handleUserSelect(userId)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.userEmoji}>{user.icon || '👤'}</Text>
                            <Text
                              style={[
                                styles.userName,
                                isSelected && styles.userNameActive,
                              ]}
                              numberOfLines={1}
                            >
                              {user.name || 'User'}
                            </Text>
                            {isSelected && (
                              <Icon
                                name="check"
                                size={24}
                                color={currentUserTheme.primary}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Day Selection - only when dayMode is 'both' */}
                  {dayMode === 'both' && (
                    <>
                      {/* Divider */}
                      <View style={styles.divider} />

                      <View style={styles.selectionSection}>
                        <Text style={styles.sectionTitle}>Select Day</Text>
                        <View style={styles.dayCardsRow}>
                          <TouchableOpacity
                            style={[
                              styles.dayCard,
                              selectedDay === 'today' && styles.dayCardActive,
                              selectedDay === 'today' && { borderColor: currentUserTheme.primary },
                            ]}
                            onPress={() => handleDaySelect('today')}
                            activeOpacity={0.7}
                          >
                            <Icon
                              name="wb-sunny"
                              size={32}
                              color={selectedDay === 'today' ? currentUserTheme.primary : '#000'}
                            />
                            <Text
                              style={[
                                styles.dayTitle,
                                selectedDay === 'today' && styles.dayTitleActive,
                              ]}
                            >
                              Today
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.dayCard,
                              selectedDay === 'tomorrow' && styles.dayCardActive,
                              selectedDay === 'tomorrow' && { borderColor: currentUserTheme.primary },
                            ]}
                            onPress={() => handleDaySelect('tomorrow')}
                            activeOpacity={0.7}
                          >
                            <Icon
                              name="upcoming"
                              size={32}
                              color={selectedDay === 'tomorrow' ? currentUserTheme.primary : '#000'}
                            />
                            <Text
                              style={[
                                styles.dayTitle,
                                selectedDay === 'tomorrow' && styles.dayTitleActive,
                              ]}
                            >
                              Tomorrow
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: 'white',
  },
  closeButton: {
    padding: SPACING.xs,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: SPACING.md,
    paddingBottom: 80,
    ...(Platform.OS === 'web' && {
      paddingHorizontal: SPACING.lg,
    }),
  },
  contentSection: {
    marginHorizontal: IS_MOBILE ? SPACING.xs : SPACING.md,
    marginTop: 0,
    marginBottom: SPACING.sm,
    ...(!IS_MOBILE && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  // Form Panel - White card background
  formPanel: {
    backgroundColor: 'white',
    borderRadius: RADIUS.lg,
    padding: IS_MOBILE ? 16 : 20,
    marginBottom: IS_MOBILE ? 16 : 20,
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : Platform.OS === 'android'
      ? {
          elevation: 3,
        }
      : {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }),
  },
  panelHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  panelTitle: {
    fontSize: 24,
    fontWeight: Platform.OS === 'ios' ? '700' : '800',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: '#000',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  panelDescription: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
    marginHorizontal: -20,
  },
  selectionSection: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  // User list cards (row-based like PlanTabContent)
  usersList: {
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  userCardActive: {
    backgroundColor: '#f5f5f5',
  },
  userEmoji: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  userName: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontWeight: '500',
    color: '#000',
    flex: 1,
  },
  userNameActive: {
    fontWeight: '700',
  },
  // Day selection cards
  dayCardsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  dayCard: {
    flex: 1,
    maxWidth: 150,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardActive: {
    backgroundColor: '#fff',
  },
  dayTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
  },
  dayTitleActive: {
    color: '#000',
    fontWeight: '700',
  },
});

export default React.memo(ContextModal);
