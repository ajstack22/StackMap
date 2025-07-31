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
  Platform,
} from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { SPACING } from '../../../constants';

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
  const insets = useSafeAreaInsets();
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
    const iconName = showDeleteIcon ? 'delete-outline' : 'push-pin';
    const iconColor = showDeleteIcon ? '#e53e3e' : theme.primary;
    
    const CardContent = (
      <>
        <Text style={styles.activityEmoji}>{activity.emoji || '🎯'}</Text>
        <Text style={[styles.activityTitle, { flex: 1 }]} numberOfLines={2}>
          {activity.text || activity.title || activity.name || ''}
        </Text>
        {showActions && category !== 'newTomorrow' && (
          <Icon name={iconName} size={18} color={iconColor} style={styles.actionIcon} />
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
  
  const renderSection = (title, activities, icon, iconColor, description, category) => {
    // Debug log for iOS
    if (Platform.OS === 'ios') {
      console.log(`Section: ${title}, Activities: ${activities.length}`);
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionInner}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: iconColor + '15' }]}>
              <Icon name={icon} size={20} color={iconColor} />
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
      </View>
    );
  };
  
  // Use theme light color for background
  const backgroundColor = theme.light;
  
  // Create the modal content
  const ModalContent = () => (
    <View style={[styles.modalContainer, { backgroundColor: theme.light }]}>
        <View style={{ 
          backgroundColor: theme.primary, 
          paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : insets.top 
        }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <View style={styles.headerLeft}>
              <Icon name="event-available" size={24} color="white" style={styles.headerIcon} />
              <Text style={styles.modalTitle}>Complete Day</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ padding: 8 }}
            >
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="close" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ flex: 1, backgroundColor }}>
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ 
              padding: SPACING.lg, 
              paddingBottom: 100, // Increased padding to ensure scrollability
              flexGrow: 1 // Allow content to grow
            }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            scrollEnabled={true}
          >
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
          {/* Complete Day Button at Top */}
          <View style={styles.topActionContainer}>
            <View style={styles.summaryHeader}>
              <Icon name="event-available" size={20} color={theme.primary} style={styles.summaryIcon} />
              <Text style={styles.explanationText}>
                {hasTomorrowActivities 
                  ? 'Review and organize your activities'
                  : 'Complete today and clean up your day'}
              </Text>
            </View>
            <Text style={styles.explanationSubtext}>
              Tap activities to move them between sections
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
              onPress={handleCompleteDay}
              activeOpacity={0.8}
            >
              <Icon name="check-circle" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Complete Day</Text>
            </TouchableOpacity>
          </View>
          
          {/* Delete Section - Unpinned Activities */}
          {renderSection(
            'Will Be Removed',
            unpinnedToDelete,
            'delete-outline',
            '#e53e3e',
            'These activities will be permanently deleted',
            'delete'
          )}
          
          {/* Today Section - Tomorrow's Activities - Only show if tomorrow has activities */}
          {hasTomorrowActivities && renderSection(
            'Moving from Tomorrow',
            tomorrowToToday,
            'schedule',
            '#2196F3',
            "Tomorrow's activities will move to today",
            'fromTomorrow'
          )}
          
          {/* Keep Section - Pinned Activities */}
          {renderSection(
            hasTomorrowActivities ? 'Keep & Copy Forward' : 'Keep for Today',
            pinnedToKeep,
            'push-pin',
            theme.primary,
            hasTomorrowActivities 
              ? 'Pinned activities stay today and copy to tomorrow'
              : 'Pinned activities will remain on today',
            'keep'
          )}
          
          </TouchableOpacity>
          </ScrollView>
        </View>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.light, height: Math.max(insets.bottom, 20) }} />
        )}
      </View>
  );

  // Wrap content with gestureHandlerRootHOC for Android
  const WrappedContent = Platform.OS === 'android' ? gestureHandlerRootHOC(ModalContent) : ModalContent;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <WrappedContent />
    </Modal>
  );
};

export default CompleteDayModal;