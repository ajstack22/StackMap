import React, { useState, useEffect } from 'react';
import { Text } from '../../Typography';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ModalFooter } from '../../ModalUtilities';
import ConfirmModal from '../../Modals/ConfirmModal';
import { styles } from './styles';

const CompleteTabContent = ({
  theme,
  activities = [],
  onCompleteDay,
  loading,
  showToast,
  currentUser,
  users,
}) => {
  // State for managing which activities go where
  const [unpinnedToDelete, setUnpinnedToDelete] = useState([]);
  const [pinnedToKeep, setPinnedToKeep] = useState([]);
  const [tomorrowToToday, setTomorrowToToday] = useState([]);
  const [pinnedForTomorrow, setPinnedForTomorrow] = useState([]);
  const [hasTomorrowActivities, setHasTomorrowActivities] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width,
  );

  // Update screen width on resize
  useEffect(() => {
    const updateDimensions = ({ window }) => {
      setScreenWidth(window.width);
    };

    const subscription = Dimensions.addEventListener(
      'change',
      updateDimensions,
    );
    return () => subscription?.remove();
  }, []);

  // Determine layout based on screen width
  const useGridLayout = screenWidth > 768; // Tablet/desktop breakpoint
  const getColumns = () => {
    if (screenWidth > 1200) return 3; // Large desktop
    if (screenWidth > 900) return 2; // Desktop/large tablet
    if (screenWidth > 768) return 2; // Tablet
    return 1; // Mobile
  };

  // Initialize buckets when activities change
  useEffect(() => {
    if (activities) {
      // Unpinned activities will be deleted by default
      const unpinned = activities.filter(a => !a.pinned);
      setUnpinnedToDelete(unpinned);

      // Pinned activities will be kept for today by default
      const pinned = activities.filter(a => a.pinned);
      setPinnedToKeep(pinned);

      // Tomorrow's activities will move to today
      const tomorrowActivities =
        users?.[currentUser]?.days?.tomorrow?.activities || [];
      setTomorrowToToday(tomorrowActivities);
      setHasTomorrowActivities(tomorrowActivities.length > 0);

      // Only create tomorrow activities if tomorrow mode is active (has activities)
      if (tomorrowActivities.length > 0) {
        setPinnedForTomorrow(
          pinned.map(a => ({
            ...a,
            id: 'tomorrow_' + a.id + '_' + Date.now(),
            completed: false,
            originalId: a.id, // Keep reference to original
          })),
        );
      } else {
        setPinnedForTomorrow([]);
      }
    }
  }, [activities, users, currentUser]);

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
          setPinnedForTomorrow(prev =>
            prev.filter(a => a.originalId !== activity.id),
          );
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
          setPinnedForTomorrow(prev => [
            ...prev,
            {
              ...activity,
              id: 'tomorrow_' + activity.id + '_' + Date.now(),
              completed: false,
              originalId: activity.id,
            },
          ]);
        }
        break;
      case 'fromTomorrow':
        setTomorrowToToday(prev => [...prev, activity]);
        break;
    }
  };

  const handleCompleteDay = () => {
    setShowConfirm(true);
  };

  const handleConfirmCompleteDay = () => {
    // Call parent handler with the organized activities
    onCompleteDay({
      toDelete: unpinnedToDelete,
      toKeepForToday: pinnedToKeep,
      fromTomorrowToToday: tomorrowToToday,
      forNewTomorrow: pinnedForTomorrow.map(a => {
        const { originalId, ...cleanActivity } = a;
        return cleanActivity;
      }),
    });
    setShowConfirm(false);
  };

  const renderActivityCard = (activity, category, showActions = true) => {
    // Determine which icon to show based on current category
    const showDeleteIcon = category === 'keep' || category === 'fromTomorrow';
    const targetCategory = showDeleteIcon ? 'delete' : 'keep';
    const iconName = showDeleteIcon ? 'delete-outline' : 'push-pin';
    const iconColor = showDeleteIcon ? '#e53e3e' : theme.primary;

    const CardContent = (
      <>
        <Text style={styles.completeActivityEmoji}>
          {activity.icon || activity.icon || '🎯'}
        </Text>
        <Text
          style={[styles.completeActivityTitle, { flex: 1 }]}
          numberOfLines={2}
        >
          {activity.text || activity.text || activity.text || ''}
        </Text>
        {showActions && category !== 'newTomorrow' && (
          <Icon
            name={iconName}
            size={18}
            color={iconColor}
            style={styles.completeActionIcon}
          />
        )}
      </>
    );

    if (showActions && category !== 'newTomorrow') {
      return (
        <TouchableOpacity
          key={activity.id}
          style={styles.completeActivityCard}
          onPress={() => moveActivity(activity, category, targetCategory)}
          activeOpacity={0.7}
        >
          {CardContent}
        </TouchableOpacity>
      );
    }

    return (
      <View key={activity.id} style={styles.completeActivityCard}>
        {CardContent}
      </View>
    );
  };

  const renderSection = (
    title,
    activities,
    icon,
    iconColor,
    description,
    category,
  ) => {
    return (
      <View
        style={[
          styles.completeSection,
          useGridLayout && styles.completeSectionGrid,
        ]}
      >
        <View style={styles.completeSectionInner}>
          <View style={styles.completeSectionHeader}>
            <View
              style={[
                styles.completeSectionIconContainer,
                { backgroundColor: iconColor + '15' },
              ]}
            >
              <Icon name={icon} size={20} color={iconColor} />
            </View>
            <View style={styles.completeSectionTitleContainer}>
              <Text style={styles.completeSectionTitle}>{title}</Text>
              <Text style={styles.completeSectionCount}>
                ({activities.length})
              </Text>
            </View>
          </View>
          {description && (
            <Text style={styles.completeSectionDescription}>{description}</Text>
          )}
          <View style={styles.completeActivitiesContainer}>
            {activities.length > 0 ? (
              activities.map(activity =>
                renderActivityCard(
                  activity,
                  category,
                  category !== 'newTomorrow', // Don't show actions for new tomorrow items
                ),
              )
            ) : (
              <Text style={styles.completeEmptyText}>No activities</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[{ flexGrow: 1 }, styles.scrollContainer]}
      >
        <View style={styles.contentSection}>
          {/* Header Panel */}
          <View style={styles.completeSection}>
            <View style={styles.completeSectionInner}>
              <View style={styles.standardTabContainer}>
                <Icon name="check-circle" size={48} color={theme.primary} />
                <Text style={styles.standardTabTitle}>Complete Day</Text>
                <Text style={styles.standardTabDescription}>
                  {hasTomorrowActivities
                    ? 'Review and organize your activities'
                    : 'Complete today and clean up your day'}
                </Text>
                <Text
                  style={[
                    styles.completeExplanationSubtext,
                    { textAlign: 'center' },
                  ]}
                >
                  Tap activities to move them between sections
                </Text>

                {/* Complete Day Button */}
                <TouchableOpacity
                  style={[
                    styles.completeButton,
                    { backgroundColor: theme.primary, marginTop: 20 },
                  ]}
                  onPress={handleCompleteDay}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={20} color="white" />
                      <Text style={styles.completeButtonText}>
                        Complete Day
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sections Container - Grid or Stack based on width */}
          <View
            style={[
              styles.sectionsContainer,
              useGridLayout && styles.sectionsGrid,
            ]}
          >
            {/* Delete Section - Unpinned Activities */}
            <View style={useGridLayout ? styles.gridSection : null}>
              {renderSection(
                'Will Be Removed',
                unpinnedToDelete,
                'delete-outline',
                '#e53e3e',
                'These activities will be permanently deleted',
                'delete',
              )}
            </View>

            {/* Today Section - Tomorrow's Activities - Only show if tomorrow has activities */}
            {hasTomorrowActivities && (
              <View style={useGridLayout ? styles.gridSection : null}>
                {renderSection(
                  'Moving from Tomorrow',
                  tomorrowToToday,
                  'schedule',
                  '#2196F3',
                  "Tomorrow's activities will move to today",
                  'fromTomorrow',
                )}
              </View>
            )}

            {/* Keep Section - Pinned Activities */}
            <View style={useGridLayout ? styles.gridSection : null}>
              {renderSection(
                hasTomorrowActivities
                  ? 'Keep & Copy Forward'
                  : 'Keep for Today',
                pinnedToKeep,
                'push-pin',
                theme.primary,
                hasTomorrowActivities
                  ? 'Pinned activities stay today and copy to tomorrow'
                  : 'Pinned activities will remain on today',
                'keep',
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmCompleteDay}
        theme={theme}
        title="Complete Day"
        message="This will move activities as shown. Continue?"
        confirmText="Complete Day"
        confirmButtonColor={theme.primary}
        icon="event-available"
        iconColor={theme.primary}
      />
    </>
  );
};

export default React.memo(CompleteTabContent);
