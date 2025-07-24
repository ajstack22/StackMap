import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import conflictResolver from '../../services/sync/conflictResolver';

const ConflictResolutionModal = ({ 
  visible, 
  onClose, 
  conflicts, 
  onResolve,
  theme 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolving, setResolving] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [previewChoice, setPreviewChoice] = useState(null);

  const currentConflict = conflicts[currentIndex];
  const hasMore = currentIndex < conflicts.length - 1;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      setSelectedChoice(null);
      setPreviewChoice(null);
    }
  }, [visible]);

  const handleChoice = async (choice) => {
    setResolving(true);
    setSelectedChoice(choice);

    try {
      const resolution = conflictResolver.resolveUserConflict(currentConflict.id, choice);
      
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
      console.error('Failed to resolve conflict:', error);
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
          isSelected && styles.choiceCardSelected
        ]}
        onPress={() => handleChoice(choice)}
        onPressIn={() => setPreviewChoice(choice)}
        onPressOut={() => setPreviewChoice(null)}
        disabled={resolving}
      >
        <View style={styles.choiceHeader}>
          <Text style={[styles.choiceLabel, isSelected && styles.choiceLabelSelected]}>
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
                    {activity.name}
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
      return (
        <Text style={styles.scalarValue}>
          {String(value)}
        </Text>
      );
    }
  };

  const getFieldDescription = (field) => {
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
      currentDay: 'Current day view'
    };
    return descriptions[field] || field;
  };

  if (!currentConflict) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.primary }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Sync Conflict</Text>
            <Text style={styles.subtitle}>
              {currentIndex + 1} of {conflicts.length}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} disabled={resolving}>
            <Icon name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.conflictInfo}>
            <Icon name="warning" size={32} color={theme.primary} />
            <Text style={styles.conflictTitle}>
              {getFieldDescription(currentConflict.field)}
            </Text>
            <Text style={styles.conflictDescription}>
              Both devices made changes to this data. Choose which version to keep:
            </Text>
          </View>

          <View style={styles.choicesContainer}>
            {renderValue(currentConflict.localValue, 'Keep Local (This Device)', 'local')}
            {renderValue(currentConflict.remoteValue, 'Keep Remote (Other Device)', 'remote')}
            
            {currentConflict.strategy === 'merge' && (
              renderValue(
                conflictResolver.mergeValues(
                  currentConflict.field,
                  currentConflict.localValue,
                  currentConflict.remoteValue
                ),
                'Merge Both',
                'merge'
              )
            )}
          </View>

          {resolving && (
            <View style={styles.resolvingOverlay}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.resolvingText}>Applying choice...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Tip: For activity lists, merging usually gives the best result
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ConflictResolutionModal;