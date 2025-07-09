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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, SHADOWS, SPACING, RADIUS, TYPOGRAPHY } from '../../constants/theme';

const PlanningModal = ({ visible, onClose, currentUser, currentDay, users, onSelectUserDay, theme }) => {
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
          style={{ flex: 1, backgroundColor: COLORS.gray[50] }}
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
          <View style={styles.daySelector}>
            <TouchableOpacity
              style={[
                styles.dayButton,
                selectedDay === 'today' && styles.dayButtonActive
              ]}
              onPress={() => setSelectedDay('today')}
            >
              <Text style={[
                styles.dayButtonText,
                selectedDay === 'today' && styles.dayButtonTextActive
              ]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dayButton,
                selectedDay === 'tomorrow' && styles.dayButtonActive
              ]}
              onPress={() => setSelectedDay('tomorrow')}
            >
              <Text style={[
                styles.dayButtonText,
                selectedDay === 'tomorrow' && styles.dayButtonTextActive
              ]}>
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
          <View style={{ backgroundColor: themeColors.primary, height: 24 }} />
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
  daySelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dayButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  dayButtonText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[700],
  },
  dayButtonTextActive: {
    color: COLORS.white,
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

export default PlanningModal;