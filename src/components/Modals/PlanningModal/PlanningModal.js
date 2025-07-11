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

const PlanningModal = ({ visible, onClose, currentUser, currentDay, users, onSelectUserDay, theme }) => {
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
            <Text style={styles.modalTitle}>Planning</Text>
            <TouchableOpacity onPress={onClose}>
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
            {Object.entries(users).map(([userId, user]) => (
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

          {/* Day Selection */}
          <Text style={styles.sectionTitle}>Day</Text>
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
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
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
    fontSize: TYPOGRAPHY.fontSize.lg,
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
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.gray[600],
  },
  toggleTextActive: {
    color: COLORS.gray[900],
    fontWeight: '600',
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
    fontSize: TYPOGRAPHY.fontSize.md,
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
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
  },
});

export default React.memo(PlanningModal);