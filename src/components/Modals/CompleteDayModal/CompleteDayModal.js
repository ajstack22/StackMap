import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

const CompleteDayModal = ({
  visible,
  onClose,
  theme,
  activities,
  showToast,
  onCompleteDay,
  currentUser,
  users,
}) => {
  // State for managing which activities go where
  const [unpinnedToDelete, setUnpinnedToDelete] = useState([]);
  const [pinnedToKeep, setPinnedToKeep] = useState([]);
  const [tomorrowToToday, setTomorrowToToday] = useState([]);
  const [pinnedForTomorrow, setPinnedForTomorrow] = useState([]);
  const [hasTomorrowActivities, setHasTomorrowActivities] = useState(false);
  
  // Initialize buckets when modal opens
  useEffect(() => {
    if (visible && activities) {
      // Unpinned activities will be deleted by default
      const unpinned = activities.filter(a => !a.pinned);
      setUnpinnedToDelete(unpinned);
      
      // Pinned activities will be kept for today by default
      const pinned = activities.filter(a => a.pinned);
      setPinnedToKeep(pinned);
      
      // Tomorrow's activities will move to today
      const tomorrowActivities = users[currentUser]?.days?.tomorrow?.activities || [];
      setTomorrowToToday(tomorrowActivities);
      setHasTomorrowActivities(tomorrowActivities.length > 0);
      
      // Only create tomorrow activities if tomorrow mode is active (has activities)
      if (tomorrowActivities.length > 0) {
        setPinnedForTomorrow(pinned.map(a => ({
          ...a,
          id: 'tomorrow_' + a.id + '_' + Date.now(),
          completed: false,
          originalId: a.id // Keep reference to original
        })));
      } else {
        setPinnedForTomorrow([]);
      }
    }
  }, [visible, activities, users, currentUser]);
  
  // Move activity between categories
  const moveActivity = (activity, fromCategory, toCategory) => {
    // Remove from source
    switch (fromCategory) {
      case 'delete':
        setUnpinnedToDelete(prev => prev.filter(a => a.id !== activity.id));
        break;
      case 'keep':
        setPinnedToKeep(prev => prev.filter(a => a.id !== activity.id));
        // Also remove from tomorrow if it was pinned
        if (activity.pinned) {
          setPinnedForTomorrow(prev => prev.filter(a => a.originalId !== activity.id));
        }
        break;
      case 'fromTomorrow':
        setTomorrowToToday(prev => prev.filter(a => a.id !== activity.id));
        break;
    }
    
    // Add to destination
    switch (toCategory) {
      case 'delete':
        setUnpinnedToDelete(prev => [...prev, activity]);
        break;
      case 'keep':
        setPinnedToKeep(prev => [...prev, activity]);
        // If tomorrow mode is active and activity is pinned, also add to tomorrow
        if (hasTomorrowActivities && activity.pinned) {
          setPinnedForTomorrow(prev => [...prev, {
            ...activity,
            id: 'tomorrow_' + activity.id + '_' + Date.now(),
            completed: false,
            originalId: activity.id
          }]);
        }
        break;
      case 'fromTomorrow':
        setTomorrowToToday(prev => [...prev, activity]);
        break;
    }
  };
  
  const handleCompleteDay = () => {
    // Show confirmation
    Alert.alert(
      'Complete Day',
      'This will move activities as shown. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Complete Day', 
          style: 'default',
          onPress: () => {
            // Call parent handler with the organized activities
            onCompleteDay({
              toDelete: unpinnedToDelete,
              toKeepForToday: pinnedToKeep,
              fromTomorrowToToday: tomorrowToToday,
              forNewTomorrow: pinnedForTomorrow.map(a => {
                const { originalId, ...cleanActivity } = a;
                return cleanActivity;
              })
            });
            onClose();
          }
        }
      ]
    );
  };
  
  const renderActivityCard = (activity, category, showActions = true) => {
    // Determine which icon to show based on current category
    const showDeleteIcon = category === 'keep' || category === 'fromTomorrow';
    const targetCategory = showDeleteIcon ? 'delete' : 'keep';
    const iconName = showDeleteIcon ? 'delete' : 'push-pin';
    const iconColor = showDeleteIcon ? '#d32f2f' : '#4CAF50';
    
    const CardContent = (
      <>
        <Text style={styles.activityEmoji}>{activity.emoji || '🎯'}</Text>
        <Text style={styles.activityText} numberOfLines={1}>
          {activity.text || activity.title || 'Activity'}
        </Text>
        {showActions && category !== 'newTomorrow' && (
          <Icon name={iconName} size={20} color={iconColor} style={styles.actionIcon} />
        )}
      </>
    );
    
    if (showActions && category !== 'newTomorrow') {
      return (
        <TouchableOpacity
          key={activity.id}
          style={styles.activityCard}
          onPress={() => moveActivity(activity, category, targetCategory)}
          activeOpacity={0.7}
        >
          {CardContent}
        </TouchableOpacity>
      );
    }
    
    return (
      <View key={activity.id} style={styles.activityCard}>
        {CardContent}
      </View>
    );
  };
  
  const renderSection = (title, activities, icon, iconColor, description, category) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconContainer, { backgroundColor: iconColor + '20' }]}>
          <Icon name={icon} size={22} color={iconColor} />
        </View>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>({activities.length})</Text>
        </View>
      </View>
      {description && (
        <Text style={styles.sectionDescription}>{description}</Text>
      )}
      <View style={styles.activitiesContainer}>
        {activities.length > 0 ? (
          activities.map(activity => renderActivityCard(
            activity, 
            category,
            category !== 'newTomorrow' // Don't show actions for new tomorrow items
          ))
        ) : (
          <Text style={styles.emptyText}>No activities</Text>
        )}
      </View>
    </View>
  );
  
  // Use theme light color for background
  const backgroundColor = theme.light;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.primary }]}>
        <StatusBar backgroundColor={theme.primary} barStyle="light-content" />
        
        {/* Header */}
        <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
          <View style={styles.headerLeft}>
            <Icon name="event-available" size={28} color="white" style={styles.headerIcon} />
            <Text style={styles.modalTitle}>Complete Day</Text>
          </View>
          <TouchableOpacity 
            onPress={onClose} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="close" size={30} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <ScrollView 
          style={[styles.modalContent, { backgroundColor }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Complete Day Button at Top */}
          <View style={[styles.topActionContainer, { backgroundColor: theme.light }]}>
            <Text style={styles.explanationText}>
              {hasTomorrowActivities 
                ? 'Review and adjust how activities will be organized:'
                : 'Complete today and clean up activities:'}
            </Text>
            <Text style={styles.explanationSubtext}>
              Tap 📌 to keep, tap 🗑️ to remove
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handleCompleteDay}
            >
              <Icon name="check" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Complete Day</Text>
            </TouchableOpacity>
          </View>
          
          {/* Delete Section - Unpinned Activities */}
          {renderSection(
            'Will Be Removed',
            unpinnedToDelete,
            'delete',
            '#d32f2f',
            hasTomorrowActivities ? 'These activities will be deleted' : 'Unpinned activities will be deleted',
            'delete'
          )}
          
          {/* Today Section - Tomorrow's Activities - Only show if tomorrow has activities */}
          {hasTomorrowActivities && renderSection(
            'Tomorrow → Today',
            tomorrowToToday,
            'arrow-forward',
            '#2196F3',
            "Tomorrow's activities moving to today",
            'fromTomorrow'
          )}
          
          {/* Keep Section - Pinned Activities */}
          {renderSection(
            hasTomorrowActivities ? 'Keep Today & Copy to Tomorrow' : 'Keep for Today',
            pinnedToKeep,
            'push-pin',
            '#4CAF50',
            hasTomorrowActivities 
              ? 'Pinned activities stay on today and are copied to tomorrow'
              : 'Pinned activities will remain on today',
            'keep'
          )}
          
          {/* Summary */}
          <View style={[styles.summaryContainer, { backgroundColor: theme.light }]}>
            <Text style={styles.summaryTitle}>Summary:</Text>
            <Text style={styles.summaryText}>
              • {unpinnedToDelete.length} activities will be removed
            </Text>
            {hasTomorrowActivities && (
              <Text style={styles.summaryText}>
                • {tomorrowToToday.length} activities move from tomorrow to today
              </Text>
            )}
            <Text style={styles.summaryText}>
              • {pinnedToKeep.length} pinned activities {hasTomorrowActivities ? 'stay today & copy to tomorrow' : 'will remain on today'}
            </Text>
          </View>
          
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default CompleteDayModal;