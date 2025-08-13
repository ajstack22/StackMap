import React, { useState, useEffect, useRef } from 'react';
import { Text } from '../../Typography';
import { 
  Modal, 
  View, 
  TouchableOpacity, 
  Platform, 
  Text as RNText,
  TextInput,
  Vibration,
  Animated
} from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';

const ReorderModal = ({
  visible,
  onClose,
  theme,
  reorderingActivity,
  activities,
  setNewPosition,
  onReorder,
}) => {
  const [localPosition, setLocalPosition] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [lastHapticValue, setLastHapticValue] = useState(1);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  
  const totalActivities = activities.filter(a => !a.deleted).length;
  const currentPosition = reorderingActivity?.currentPosition || 1;

  // Get activities before and after the new position
  const getNeighborActivities = (position) => {
    const filteredActivities = activities.filter(a => !a.deleted);
    const beforeActivity = position > 1 ? filteredActivities[position - 2] : null;
    const afterActivity = position < filteredActivities.length ? filteredActivities[position] : null;
    return { beforeActivity, afterActivity };
  };

  useEffect(() => {
    if (visible) {
      // Initialize with current position
      setLocalPosition(currentPosition);
      setInputValue(currentPosition.toString());
      setLastHapticValue(currentPosition);
      
      // Animate modal sliding up
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animation
      slideAnimation.setValue(0);
    }
  }, [visible, currentPosition]);

  const handleSliderChange = (value) => {
    const newValue = Math.round(value);
    setLocalPosition(newValue);
    setInputValue(newValue.toString());
    setNewPosition(newValue.toString());
    
    // Haptic feedback on each step change
    if (newValue !== lastHapticValue) {
      setLastHapticValue(newValue);
      if (Platform.OS !== 'web') {
        Vibration.vibrate(10);
      }
    }
  };

  const handleInputChange = (text) => {
    setInputValue(text);
    const num = parseInt(text);
    if (!isNaN(num) && num >= 1 && num <= totalActivities) {
      setLocalPosition(num);
      setNewPosition(text);
    }
  };

  const handleMoveToTop = () => {
    setLocalPosition(1);
    setInputValue('1');
    setNewPosition('1');
    if (Platform.OS !== 'web') {
      Vibration.vibrate(20);
    }
  };

  const handleMoveToBottom = () => {
    setLocalPosition(totalActivities);
    setInputValue(totalActivities.toString());
    setNewPosition(totalActivities.toString());
    if (Platform.OS !== 'web') {
      Vibration.vibrate(20);
    }
  };

  const handleCancel = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      setNewPosition('');
    });
  };

  const handleConfirm = () => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate(30);
    }
    onReorder();
  };

  const isReorderDisabled = localPosition === currentPosition;
  const { beforeActivity, afterActivity } = getNeighborActivities(localPosition);

  const modalTranslateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleCancel}
      >
        <Animated.View 
          style={[
            styles.bottomSheetContainer,
            { 
              backgroundColor: theme.light,
              transform: [{ translateY: modalTranslateY }]
            }
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={[styles.bottomSheetHeader, { backgroundColor: theme.primary }]}>
            <Text style={styles.bottomSheetTitle}>Move Activity</Text>
            <TouchableOpacity onPress={handleCancel}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.bottomSheetContent}>
            {/* Activity Preview Panel */}
            <View style={styles.whitePanel}>
              <Text style={styles.panelTitle}>Moving Activity</Text>
              {reorderingActivity && (
                <View style={styles.activityCard}>
                  <RNText style={styles.activityEmoji}>
                    {reorderingActivity.activity.emoji || '🎯'}
                  </RNText>
                  <Text style={styles.activityTitle} numberOfLines={2}>
                    {reorderingActivity.activity.text || reorderingActivity.activity.title || ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Position Neighbors Panel */}
            <View style={styles.whitePanel}>
              <Text style={styles.panelTitle}>New Position Preview</Text>
              
              <View style={styles.neighborsContainer}>
                {/* Before Activity */}
                <View style={styles.neighborSection}>
                  <Text style={styles.neighborLabel}>Will come after:</Text>
                  {beforeActivity ? (
                    <View style={[styles.neighborCard, { borderColor: theme.primary + '40' }]}>
                      <RNText style={styles.neighborEmoji}>
                        {beforeActivity.emoji || '📋'}
                      </RNText>
                      <Text style={styles.neighborText} numberOfLines={1}>
                        {beforeActivity.text || beforeActivity.title || ''}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.neighborPlaceholder}>
                      {localPosition === 1 ? 'First position' : 'No activity'}
                    </Text>
                  )}
                </View>

                {/* Current Activity Indicator */}
                <View style={[styles.currentPositionIndicator, { backgroundColor: theme.primary }]}>
                  <Icon name="drag-indicator" size={20} color="white" />
                  <Text style={styles.currentPositionText}>New Position {localPosition}</Text>
                </View>

                {/* After Activity */}
                <View style={styles.neighborSection}>
                  <Text style={styles.neighborLabel}>Will come before:</Text>
                  {afterActivity ? (
                    <View style={[styles.neighborCard, { borderColor: theme.primary + '40' }]}>
                      <RNText style={styles.neighborEmoji}>
                        {afterActivity.emoji || '📋'}
                      </RNText>
                      <Text style={styles.neighborText} numberOfLines={1}>
                        {afterActivity.text || afterActivity.title || ''}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.neighborPlaceholder}>
                      {localPosition === totalActivities ? 'Last position' : 'No activity'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Position Controls Panel */}
            <View style={styles.whitePanel}>
              <Text style={styles.panelTitle}>Select Position</Text>
              
              {/* Position Display */}
              <View style={styles.positionDisplay}>
                <View style={styles.positionIndicator}>
                  <Text style={styles.positionLabel}>Current</Text>
                  <Text style={[styles.positionNumber, { color: '#666' }]}>
                    {currentPosition}
                  </Text>
                </View>
                
                <Icon 
                  name="arrow-forward" 
                  size={24} 
                  color={theme.primary} 
                  style={styles.arrowIcon}
                />
                
                <View style={styles.positionIndicator}>
                  <Text style={styles.positionLabel}>New</Text>
                  <Text style={[styles.positionNumber, { color: theme.primary }]}>
                    {localPosition}
                  </Text>
                </View>
              </View>

              {/* Slider */}
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>1</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={totalActivities}
                  value={localPosition}
                  onValueChange={handleSliderChange}
                  step={1}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor={theme.primary}
                />
                <Text style={styles.sliderLabel}>{totalActivities}</Text>
              </View>

              {/* Direct Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Or type position:</Text>
                <TextInput
                  style={[styles.positionInput, { borderColor: theme.primary + '40' }]}
                  value={inputValue}
                  onChangeText={handleInputChange}
                  keyboardType="numeric"
                  maxLength={3}
                  selectTextOnFocus
                />
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={[styles.quickButton, localPosition === 1 && styles.quickButtonDisabled]}
                  onPress={handleMoveToTop}
                  disabled={localPosition === 1}
                >
                  <Icon name="vertical-align-top" size={20} color={localPosition === 1 ? '#ccc' : theme.primary} />
                  <Text style={[styles.quickButtonText, { color: localPosition === 1 ? '#ccc' : theme.primary }]}>
                    Move to Top
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.quickButton, localPosition === totalActivities && styles.quickButtonDisabled]}
                  onPress={handleMoveToBottom}
                  disabled={localPosition === totalActivities}
                >
                  <Icon name="vertical-align-bottom" size={20} color={localPosition === totalActivities ? '#ccc' : theme.primary} />
                  <Text style={[styles.quickButtonText, { color: localPosition === totalActivities ? '#ccc' : theme.primary }]}>
                    Move to Bottom
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.confirmButton,
                  { backgroundColor: isReorderDisabled ? '#ccc' : theme.primary }
                ]}
                onPress={handleConfirm}
                disabled={isReorderDisabled}
              >
                <Text style={styles.confirmButtonText}>
                  Move to Position {localPosition}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default React.memo(ReorderModal);