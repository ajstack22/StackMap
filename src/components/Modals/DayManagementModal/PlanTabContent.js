import React, { useState, useEffect } from 'react';
import { Text } from '../../Typography';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { SPACING } from '../../../constants';

const PlanTabContent = ({
  theme,
  users = {},
  currentUser,
  showToast,
  dayMode = 'both',
  setDayMode,
  onSelectUserDay,
  onClose,
}) => {
  // State for user/day selection
  const [selectedUser, setSelectedUser] = useState(currentUser);
  const [selectedDay, setSelectedDay] = useState('today');
  const [viewMode, setViewMode] = useState(dayMode || 'both');

  // Initialize selected user when currentUser changes
  useEffect(() => {
    setSelectedUser(currentUser);
  }, [currentUser]);

  const handleDayModeChange = mode => {
    setViewMode(mode);
    if (setDayMode) {
      setDayMode(mode);
    }
    if (mode === 'today') {
      setSelectedDay('today');
    }
  };

  const handleSwitchToDay = () => {
    if (onSelectUserDay) {
      onSelectUserDay(selectedUser, selectedDay);
    }
    showToast({
      message: `Switched to ${users[selectedUser]?.name}'s ${
        selectedDay === 'today' ? 'Today' : 'Tomorrow'
      }`,
    });
    // Close the modal to let user manage activities on main screen
    if (onClose) {
      onClose();
    }
  };

  // Show user/day selection UI
  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ flexGrow: 1 }, styles.scrollContainer]}
        style={{ flex: 1 }}
      >
        <View style={styles.contentSection}>
          {/* Single Consolidated Panel */}
          <View style={styles.formPanel}>
            {/* Header */}
            <View style={styles.standardTabContainer}>
              <Icon name="event" size={48} color={theme.primary} />
              <Text style={styles.standardTabTitle}>Plan Your Day</Text>
              <Text style={styles.standardTabDescription}>
                Choose which user and day to manage
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />
            {/* Users Section */}
            <View style={styles.planSelectionSection}>
              <Text style={styles.planSectionTitle}>Select User</Text>
              <View style={styles.usersList}>
                {Object.entries(users)
                  .filter(([userId, user]) => !user.deleted)
                  .map(([userId, user]) => (
                    <TouchableOpacity
                      key={userId}
                      style={[
                        styles.userCard,
                        selectedUser === userId && styles.userCardActive,
                        selectedUser === userId && {
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => setSelectedUser(userId)}
                    >
                      <Text style={styles.userEmoji}>{user.icon}</Text>
                      <Text
                        style={[
                          styles.userName,
                          selectedUser === userId && styles.userNameActive,
                        ]}
                      >
                        {user.name}
                      </Text>
                      {selectedUser === userId && (
                        <Icon name="check" size={24} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Day Mode Section */}
            <View style={styles.planSelectionSection}>
              <Text style={styles.planSectionTitle}>Day Mode</Text>
              <View style={styles.dayModeToggle}>
                <TouchableOpacity
                  style={[
                    styles.dayModeOption,
                    viewMode === 'today' && styles.dayModeOptionActive,
                  ]}
                  onPress={() => handleDayModeChange('today')}
                >
                  <Icon
                    name="wb-sunny"
                    size={20}
                    color={viewMode === 'today' ? theme.primary : '#000'}
                  />
                  <Text
                    style={[
                      styles.dayModeText,
                      viewMode === 'today' && styles.dayModeTextActive,
                    ]}
                  >
                    Today Only
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dayModeOption,
                    viewMode === 'both' && styles.dayModeOptionActive,
                  ]}
                  onPress={() => handleDayModeChange('both')}
                >
                  <Icon
                    name="calendar-today"
                    size={20}
                    color={viewMode === 'both' ? theme.primary : '#000'}
                  />
                  <Text
                    style={[
                      styles.dayModeText,
                      viewMode === 'both' && styles.dayModeTextActive,
                    ]}
                  >
                    Both Days
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Day Selection - only show when both days mode */}
            {viewMode === 'both' && (
              <>
                <View style={styles.divider} />
                <View style={styles.planSelectionSection}>
                  <Text style={styles.planSectionTitle}>Select Day</Text>
                  <View style={styles.dayCardsRow}>
                    <TouchableOpacity
                      style={[
                        styles.dayCard,
                        selectedDay === 'today' && styles.dayCardActive,
                        selectedDay === 'today' && {
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => setSelectedDay('today')}
                    >
                      <Icon
                        name="wb-sunny"
                        size={32}
                        color={selectedDay === 'today' ? theme.primary : '#000'}
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
                        selectedDay === 'tomorrow' && {
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => setSelectedDay('tomorrow')}
                    >
                      <Icon
                        name="upcoming"
                        size={32}
                        color={
                          selectedDay === 'tomorrow' ? theme.primary : '#000'
                        }
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

            {/* Divider */}
            <View style={styles.divider} />

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={handleSwitchToDay}
            >
              <Icon name="today" size={20} color="white" />
              <Text style={styles.actionButtonText}>Apply Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default PlanTabContent;
