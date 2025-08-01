import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FormInput, ModalFooter } from '../../ModalUtilities';
import { styles } from './styles';

const PlanTabContent = ({
  theme,
  tomorrowActivities = [],
  templates = {},
  users = {},
  currentUser,
  onSavePlan,
  loading,
  showToast,
  dayMode = 'both',
  setDayMode,
  onSelectUserDay,
}) => {
  // State for user/day selection
  const [selectedUser, setSelectedUser] = useState(currentUser);
  const [selectedDay, setSelectedDay] = useState('tomorrow');
  const [viewMode, setViewMode] = useState(dayMode);
  
  // State for activities planning
  const [activities, setActivities] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [planningMode, setPlanningMode] = useState(false); // false = selection, true = planning

  // Load activities when user/day changes
  useEffect(() => {
    if (planningMode && users[selectedUser]) {
      const userActivities = users[selectedUser]?.days?.[selectedDay]?.activities || [];
      setActivities(userActivities.filter(a => !a.deleted));
    }
  }, [selectedUser, selectedDay, planningMode, users]);

  // Reset to selection mode when modal opens
  useEffect(() => {
    setPlanningMode(false);
    setSelectedUser(currentUser);
    setSelectedDay('tomorrow');
  }, [currentUser]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (setDayMode) {
      setDayMode(mode);
    }
    if (mode === 'today') {
      setSelectedDay('today');
    }
  };

  const handleStartPlanning = () => {
    if (onSelectUserDay) {
      onSelectUserDay(selectedUser, selectedDay);
    }
    setPlanningMode(true);
    showToast({ 
      message: `Planning ${users[selectedUser]?.name}'s ${selectedDay === 'today' ? 'Today' : 'Tomorrow'}` 
    });
  };

  const handleBackToSelection = () => {
    setPlanningMode(false);
  };

  const moveActivity = (fromIndex, toIndex) => {
    const newActivities = [...activities];
    const [removed] = newActivities.splice(fromIndex, 1);
    newActivities.splice(toIndex, 0, removed);
    setActivities(newActivities);
  };

  const handleAddActivity = (activity) => {
    const newActivity = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
      pinned: false,
    };
    setActivities([...activities, newActivity]);
    showToast({ message: 'Activity added' });
  };

  const handleRemoveActivity = (activityId) => {
    setActivities(activities.filter(a => a.id !== activityId));
    showToast({ message: 'Activity removed' });
  };

  const handleSave = () => {
    onSavePlan({
      userId: selectedUser,
      day: selectedDay,
      activities: activities
    });
  };

  const getFilteredTemplates = () => {
    if (!searchQuery) return templates;
    
    const filtered = {};
    Object.entries(templates).forEach(([categoryId, category]) => {
      const matchingActivities = category.activities?.filter(activity =>
        activity.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.icon.includes(searchQuery)
      ) || [];
      
      if (matchingActivities.length > 0) {
        filtered[categoryId] = {
          ...category,
          activities: matchingActivities,
        };
      }
    });
    return filtered;
  };

  const renderActivity = (item, index) => (
    <View
      key={item.id}
      style={styles.planActivityCard}
    >
      <View style={styles.dragButtonsContainer}>
        <TouchableOpacity
          onPress={() => index > 0 && moveActivity(index, index - 1)}
          disabled={index === 0}
          style={styles.dragButton}
        >
          <Icon name="arrow-upward" size={20} color={index === 0 ? '#ddd' : '#666'} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => index < activities.length - 1 && moveActivity(index, index + 1)}
          disabled={index === activities.length - 1}
          style={styles.dragButton}
        >
          <Icon name="arrow-downward" size={20} color={index === activities.length - 1 ? '#ddd' : '#666'} />
        </TouchableOpacity>
      </View>
      <Text style={styles.planActivityIcon}>{item.icon || item.emoji}</Text>
      <Text style={styles.planActivityText}>{item.text || item.name}</Text>
      <TouchableOpacity
        onPress={() => handleRemoveActivity(item.id)}
        style={styles.removeButton}
      >
        <Icon name="close" size={20} color="#999" />
      </TouchableOpacity>
    </View>
  );

  // Selection Mode UI
  if (!planningMode) {
    return (
      <>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[{ flexGrow: 1 }, styles.scrollContainer]}
          style={{ flex: 1 }}
        >
        <View style={styles.contentSection}>
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
                  <Icon name="check" size={24} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* View Mode */}
        <View style={styles.planSelectionSection}>
          <Text style={styles.planSectionTitle}>View Mode</Text>
          <Text style={styles.planSectionDescription}>
            How many days should be visible?
          </Text>
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[styles.viewModeToggle, viewMode === 'today' && styles.viewModeToggleActive]}
              onPress={() => handleViewModeChange('today')}
            >
              <Icon name="today" size={20} color={viewMode === 'today' ? theme.primary : '#666'} />
              <Text style={[styles.viewModeText, viewMode === 'today' && styles.viewModeTextActive]}>
                Today Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeToggle, viewMode === 'both' && styles.viewModeToggleActive]}
              onPress={() => handleViewModeChange('both')}
            >
              <Icon name="date-range" size={20} color={viewMode === 'both' ? theme.primary : '#666'} />
              <Text style={[styles.viewModeText, viewMode === 'both' && styles.viewModeTextActive]}>
                Today & Tomorrow
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Day Selection - only show when view mode includes tomorrow */}
        {viewMode === 'both' && (
          <View style={styles.planSelectionSection}>
            <Text style={styles.planSectionTitle}>Planning Day</Text>
            <Text style={styles.planSectionDescription}>
              Which day are you planning?
            </Text>
            <View style={styles.dayToggleContainer}>
              <TouchableOpacity
                style={[styles.dayToggle, selectedDay === 'today' && styles.dayToggleActive]}
                onPress={() => setSelectedDay('today')}
              >
                <Text style={[styles.dayToggleText, selectedDay === 'today' && styles.dayToggleTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dayToggle, selectedDay === 'tomorrow' && styles.dayToggleActive]}
                onPress={() => setSelectedDay('tomorrow')}
              >
                <Text style={[styles.dayToggleText, selectedDay === 'tomorrow' && styles.dayToggleTextActive]}>
                  Tomorrow
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        </View>
        </ScrollView>
        
        {/* Start Planning Button */}
        <ModalFooter
          theme={theme}
          primaryButton={{
            label: 'Start Planning',
            icon: 'arrow-forward',
            onPress: handleStartPlanning,
          }}
          showOnDesktop={true}
        />
      </>
    );
  }

  // Planning Mode UI
  return (
    <>
    <ScrollView 
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={styles.contentSection}>
      {/* Back Button and Header */}
      <View style={styles.planHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToSelection}
        >
          <Icon name="arrow-back" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.planHeaderInfo}>
          <Text style={styles.planHeaderUser}>
            {users[selectedUser]?.icon} {users[selectedUser]?.name}
          </Text>
          <Text style={styles.planHeaderDay}>
            {selectedDay === 'today' ? 'Today' : 'Tomorrow'}
          </Text>
        </View>
      </View>

      {/* Activities Section */}
      <View style={styles.planSection}>
        <View style={styles.planSectionHeader}>
          <Text style={styles.planSectionTitle}>Activities</Text>
          <Text style={styles.planCount}>{activities.length} activities</Text>
        </View>
        
        {activities.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="event" size={48} color="#999" />
            <Text style={styles.emptyStateText}>No activities planned yet</Text>
            <Text style={styles.emptyStateSubtext}>Add activities from templates below</Text>
          </View>
        ) : (
          <ScrollView style={styles.planActivityList}>
            {activities.map((activity, index) => renderActivity(activity, index))}
          </ScrollView>
        )}
      </View>

      {/* Add from Templates */}
      <TouchableOpacity
        style={styles.templateToggle}
        onPress={() => setShowTemplates(!showTemplates)}
      >
        <Text style={styles.templateToggleText}>Add from Templates</Text>
        <Icon 
          name={showTemplates ? "expand-less" : "expand-more"} 
          size={24} 
          color="#666" 
        />
      </TouchableOpacity>

      {showTemplates && (
        <View style={styles.templateSection}>
          <FormInput
            placeholder="Search templates..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon="search"
            theme={theme}
          />
          
          <ScrollView 
            style={styles.templateList}
            showsVerticalScrollIndicator={false}
          >
            {Object.entries(getFilteredTemplates()).map(([categoryId, category]) => (
              <View key={categoryId} style={styles.templateCategory}>
                <Text style={styles.templateCategoryName}>{category.name}</Text>
                <View style={styles.templateActivities}>
                  {category.activities?.map((activity, index) => (
                    <TouchableOpacity
                      key={`${categoryId}-${index}`}
                      style={styles.templateActivity}
                      onPress={() => handleAddActivity(activity)}
                    >
                      <Text style={styles.templateActivityIcon}>{activity.icon}</Text>
                      <Text style={styles.templateActivityText}>{activity.text}</Text>
                      <Icon name="add" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  )) || null}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      </View>
      </ScrollView>

      {/* Save Button */}
      <ModalFooter
        theme={theme}
        primaryButton={{
          label: "Save Plan",
          icon: 'save',
          onPress: handleSave,
          disabled: loading
        }}
        secondaryButton={{
          label: "Back",
          onPress: handleBackToSelection,
        }}
        loading={loading}
        showOnDesktop={true}
      />
    </>
  );
};

export default React.memo(PlanTabContent);