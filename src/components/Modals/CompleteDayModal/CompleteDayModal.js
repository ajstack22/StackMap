import React, { useState } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text } from '../../Typography';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CompleteTabContent from '../DayManagementModal/CompleteTabContent';
import { SPACING, TYPOGRAPHY, THEMES } from '../../../constants';

/**
 * CompleteDayModal - Single-purpose modal for completing the day
 * Replaces the tabbed DayManagementModal with just the Complete functionality
 * (Plan tab functionality moved to Settings/Context modals)
 */
const CompleteDayModal = ({
  visible,
  onClose,
  theme,
  activities = [],
  onCompleteDay,
  showToast,
  users,
  currentUser,
}) => {
  const [loading, setLoading] = useState(false);

  const handleCompleteDay = async (organizedActivities) => {
    setLoading(true);
    try {
      await onCompleteDay(organizedActivities);
      showToast({ message: 'Day completed successfully!' });
      onClose();
    } catch (error) {
      showToast({ message: 'Failed to complete day', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

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
            backgroundColor={theme.primary}
            barStyle="light-content"
            translucent={false}
          />
        )}
        <View style={[styles.container, { backgroundColor: theme.light }]}>
          {Platform.OS === 'android' && (
            <View
              style={{
                backgroundColor: theme.primary,
                height: StatusBar.currentHeight || 24,
              }}
            />
          )}

          <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.primary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
              <View style={styles.headerLeft}>
                <Icon name="check-circle" size={24} color="white" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>Complete Day</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <View style={styles.closeCircle}>
                  <Icon name="close" size={20} color="white" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Content - Reuse CompleteTabContent */}
            <View style={[styles.content, { backgroundColor: theme.light }]}>
              <CompleteTabContent
                theme={theme}
                activities={activities}
                onCompleteDay={handleCompleteDay}
                loading={loading}
                showToast={showToast}
                currentUser={currentUser}
                users={users}
              />
            </View>
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
});

export default React.memo(CompleteDayModal);
