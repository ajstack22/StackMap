import React, { useState, useEffect } from 'react';
import { Text } from '../Typography';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LoadingSpinner } from '../shared';
import { styles } from './styles';
import conflictResolver from '../../services/sync/conflictResolver';

const ConflictResolutionModal = ({
  visible,
  onClose,
  conflicts,
  onResolve,
  theme,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [previewChoice, setPreviewChoice] = useState(null);

  const currentConflict = conflicts?.[currentIndex];
  const hasMore = currentIndex < (conflicts?.length || 0) - 1;

  const getMergedValue = (field, localValue, remoteValue) => {
    try {
      if (field === 'activities') {
        return conflictResolver.mergeActivitiesArray(
          localValue || [],
          remoteValue || []
        );
      } else if (field === 'users') {
        // For users, we need to create mock metadata for the merge
        const localMeta = { fieldTimestamps: { users: Date.now() - 1000 } };
        const remoteMeta = { fieldTimestamps: { users: Date.now() } };
        return conflictResolver.mergeUsers(
          localValue,
          remoteValue,
          localMeta,
          remoteMeta
        );
      } else if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
        // For other arrays, combine and deduplicate by id
        const combined = [...(localValue || []), ...(remoteValue || [])];
        const seen = new Set();
        return combined.filter(item => {
          const key = item.id || JSON.stringify(item);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      // For non-array values, prefer remote as fallback
      return remoteValue;
    } catch (error) {
      // Fallback to remote value on merge error
      return remoteValue;
    }
  };

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setSelectedChoice(null);
      setPreviewChoice(null);
    }
  }, [visible]);

  const handleChoice = async choice => {
    setResolving(true);
    setSelectedChoice(choice);

    try {
      let resolvedValue;

      if (choice === 'local') {
        resolvedValue = currentConflict.localValue;
      } else if (choice === 'remote') {
        resolvedValue = currentConflict.remoteValue;
      } else if (choice === 'merge') {
        // Use the appropriate merge method based on field type
        if (currentConflict.field === 'activities') {
          resolvedValue = conflictResolver.mergeActivitiesArray(
            currentConflict.localValue || [],
            currentConflict.remoteValue || []
          );
        } else if (currentConflict.field === 'users') {
          // For users, we need to create mock metadata for the merge
          const localMeta = { fieldTimestamps: { users: Date.now() - 1000 } };
          const remoteMeta = { fieldTimestamps: { users: Date.now() } };
          resolvedValue = conflictResolver.mergeUsers(
            currentConflict.localValue,
            currentConflict.remoteValue,
            localMeta,
            remoteMeta
          );
        } else {
          // For other fields, default to remote value as fallback
          resolvedValue = currentConflict.remoteValue;
        }
      }

      const resolution = {
        id: currentConflict.id,
        field: currentConflict.field,
        choice,
        resolvedValue
      };

      if (onResolve) {
        await onResolve(resolution);
      }

      // Move to next conflict or close
      if (hasMore) {
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
          setSelectedChoice(null);
          setPreviewChoice(null);
          setResolving(false);
        }, 500);
      } else {
        setTimeout(() => {
          onClose();
          setResolving(false);
        }, 500);
      }
    } catch (error) {
      setResolving(false);
    }
  };

  const renderValue = (value, label, choice) => {
    const isSelected = selectedChoice === choice;
    const isPreviewing = previewChoice === choice;

    return (
      <TouchableOpacity
        style={[
          styles.choiceCard,
          isPreviewing && styles.choiceCardHover,
          isSelected && styles.choiceCardSelected,
        ]}
        onPress={() => handleChoice(choice)}
        onPressIn={() => setPreviewChoice(choice)}
        onPressOut={() => setPreviewChoice(null)}
        disabled={resolving}
      >
        <View style={styles.choiceHeader}>
          <Text
            style={[
              styles.choiceLabel,
              isSelected && styles.choiceLabelSelected,
            ]}
          >
            {label}
          </Text>
          {isSelected && (
            <Icon name="check-circle" size={24} color={theme.primary} />
          )}
        </View>

        <View style={styles.valueContainer}>
          {renderFieldValue(currentConflict.field, value)}
        </View>

        {choice === 'merge' && (
          <Text style={styles.mergeNote}>
            Automatically combined from both versions
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderFieldValue = (field, value) => {
    if (Array.isArray(value)) {
      return (
        <>
          <Text style={styles.arrayCount}>{value.length} items</Text>
          {field === 'activities' && (
            <View style={styles.activityPreview}>
              {value.slice(0, 3).map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <Text style={styles.activityIcon}>{activity.icon}</Text>
                  <Text style={styles.activityName} numberOfLines={1}>
                    {activity.text}
                  </Text>
                </View>
              ))}
              {value.length > 3 && (
                <Text style={styles.moreText}>+{value.length - 3} more</Text>
              )}
            </View>
          )}
          {field === 'completedActivities' && (
            <Text style={styles.completedCount}>
              {value.length} completed activities
            </Text>
          )}
        </>
      );
    } else if (typeof value === 'object' && value !== null) {
      return (
        <Text style={styles.objectPreview}>
          {JSON.stringify(value, null, 2).substring(0, 100)}...
        </Text>
      );
    } else {
      return <Text style={styles.scalarValue}>{String(value)}</Text>;
    }
  };

  const getFieldDescription = field => {
    const descriptions = {
      activities: 'Activity templates',
      completedActivities: 'Completed activity records',
      users: 'User profiles',
      currentUser: 'Selected user',
      currentTheme: 'App theme',
      bannerPosition: 'Banner position',
      soundEnabled: 'Sound settings',
      taskCelebration: 'Task celebration effect',
      routineCelebration: 'Routine celebration effect',
      currentDay: 'Current day view',
    };
    return descriptions[field] || field;
  };

  if (!currentConflict || !conflicts?.length) return null;

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
          backgroundColor={theme.primary}
          barStyle="light-content"
          translucent={false}
        />
      )}
      <View style={[styles.container, { backgroundColor: theme.primary }]}>
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: theme.primary,
              height: StatusBar.currentHeight || 24,
            }}
          />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View style={[styles.header, { backgroundColor: theme.primary }]}>
            <View>
              <Text style={styles.title}>Sync Conflict</Text>
              <Text style={styles.subtitle}>
                {currentIndex + 1} of {conflicts.length}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={resolving}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="close" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <ScrollView
          style={[styles.content, { backgroundColor: theme.light }]}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.conflictInfo}>
            <Icon name="warning" size={32} color={theme.primary} />
            <Text style={styles.conflictTitle}>
              {getFieldDescription(currentConflict.field)}
            </Text>
            <Text style={styles.conflictDescription}>
              Both devices made changes to this data. Choose which version to
              keep:
            </Text>
          </View>

          <View style={styles.choicesContainer}>
            {renderValue(
              currentConflict.localValue,
              'Keep Local (This Device)',
              'local',
            )}
            {renderValue(
              currentConflict.remoteValue,
              'Keep Remote (Other Device)',
              'remote',
            )}

            {currentConflict.strategy === 'merge' &&
              renderValue(
                getMergedValue(
                  currentConflict.field,
                  currentConflict.localValue,
                  currentConflict.remoteValue,
                ),
                'Merge Both',
                'merge',
              )}
          </View>

          {resolving && (
            <View style={styles.resolvingOverlay}>
              <LoadingSpinner
                size="large"
                color={theme.primary}
                message="Applying choice..."
                theme={theme}
              />
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: 'white' }]}>
          <Text style={styles.footerText}>
            Tip: For activity lists, merging usually gives the best result
          </Text>
        </View>
        <SafeAreaView style={{ backgroundColor: theme.light }} />
      </View>
    </Modal>
  );
};

export default ConflictResolutionModal;
