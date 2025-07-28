import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS, TYPOGRAPHY, THEMES } from '../../../constants';

const PlanningModal = ({ visible, onClose, currentUser, currentDay, users, onSelectUserDay, theme, dayMode, setDayMode }) => {
  const insets = useSafeAreaInsets();
  const themeColors = theme || THEMES.stackBlue;
  const [selectedUser, setSelectedUser] = useState(currentUser);
  const [selectedDay, setSelectedDay] = useState(currentDay);

  const handleSave = () => {
    onSelectUserDay(selectedUser, selectedDay);
    onClose();
  };

  const styles = getStyles(themeColors);

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
          backgroundColor={themeColors.primary} 
          barStyle="light-content" 
          translucent={false}
        />
      )}
      <View style={[styles.modalContainer, { backgroundColor: themeColors.primary }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: themeColors.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: themeColors.primary }]}>
            <View style={styles.headerLeft}>
              <Icon name="event" size={24} color="white" style={styles.headerIcon} />
              <Text style={styles.modalTitle}>Plan Ahead</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        
        <ScrollView 
          style={{ flex: 1, backgroundColor: themeColors.light }}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Users Section */}
          <Text style={styles.sectionTitle}>Users</Text>
          <View style={styles.usersList}>
            {Object.entries(users)
              .filter(([userId, user]) => !user.deleted)
              .map(([userId, user]) => (
              <TouchableOpacity
                key={userId}
                style={[
                  styles.userCard,
                  selectedUser === userId && styles.userCardActive
                ]}
                onPress={() => setSelectedUser(userId)}
              >
                <Text style={styles.userEmoji}>{user.icon}</Text>
                <Text style={[
                  styles.userName,
                  selectedUser === userId && styles.userNameActive
                ]}>
                  {user.name}
                </Text>
                {selectedUser === userId && (
                  <Icon name="check" size={24} color={themeColors.primary} style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* View Mode */}
          <Text style={styles.sectionTitle}>View Mode</Text>
          <Text style={styles.sectionDescription}>How many days should be visible in your StackMap?</Text>
          <View style={[styles.toggleContainer, styles.viewModeContainer]}>
            <TouchableOpacity
              style={[styles.toggle, styles.viewModeToggle, dayMode === 'today' && styles.toggleActive]}
              onPress={() => {
                setDayMode('today');
                setSelectedDay('today'); // Force today when in today-only mode
              }}
            >
              <Icon name="today" size={20} color={dayMode === 'today' ? themeColors.primary : '#000'} />
              <Text style={[styles.toggleText, dayMode === 'today' && styles.toggleTextActive]}>
                Today Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggle, styles.viewModeToggle, dayMode === 'both' && styles.toggleActive]}
              onPress={() => setDayMode('both')}
            >
              <Icon name="date-range" size={20} color={dayMode === 'both' ? themeColors.primary : '#000'} />
              <Text style={[styles.toggleText, dayMode === 'both' && styles.toggleTextActive]}>
                Today & Tomorrow
              </Text>
            </TouchableOpacity>
          </View>

          {/* Day Selection - only show when view mode includes tomorrow */}
          {dayMode === 'both' && (
            <>
              <Text style={styles.sectionTitle}>Planning Day</Text>
              <Text style={styles.sectionDescription}>Which day are you planning?</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggle, selectedDay === 'today' && styles.toggleActive]}
                  onPress={() => setSelectedDay('today')}
                >
                  <Text style={[styles.toggleText, selectedDay === 'today' && styles.toggleTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggle, selectedDay === 'tomorrow' && styles.toggleActive]}
                  onPress={() => setSelectedDay('tomorrow')}
                >
                  <Text style={[styles.toggleText, selectedDay === 'tomorrow' && styles.toggleTextActive]}>
                    Tomorrow
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save & Continue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </SafeAreaView>
        {Platform.OS === 'android' && (
          <View style={{ 
            backgroundColor: themeColors.primary, 
            height: (Dimensions.get('window').width >= 768 || Dimensions.get('window').height > 800) 
              ? Math.max(insets.bottom * 1.2, 20) // Reduced by 40%
              : Math.max(insets.bottom, 10) // Reduced by 40%
          }} />
        )}
      </View>
    </Modal>
  );
};

const getStyles = (themeColors) => ({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: themeColors.primary,
    ...(Platform.OS === 'android' && {
      paddingTop: 0,
      paddingBottom: 0,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
    marginTop: SPACING.lg,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: '#000',
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  usersList: {
    gap: SPACING.sm,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    borderWidth: 2,
    borderColor: themeColors.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  userCardActive: {
    backgroundColor: '#fff5f5',
    borderColor: themeColors.primary,
  },
  userEmoji: {
    fontSize: 32,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.gray[700],
    flex: 1,
  },
  userNameActive: {
    color: themeColors.primary,
  },
  checkmark: {
    marginLeft: 'auto',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.md,
    padding: 4,
  },
  toggle: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.level1,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: '#000',
  },
  toggleTextActive: {
    color: COLORS.gray[900],
    fontWeight: '600',
  },
  viewModeContainer: {
    backgroundColor: '#e8f4fd',
    borderWidth: 1,
    borderColor: themeColors.primary + '30',
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray[300],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[700],
  },
  saveButton: {
    flex: 1,
    backgroundColor: themeColors.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
  },
});

export default React.memo(PlanningModal);