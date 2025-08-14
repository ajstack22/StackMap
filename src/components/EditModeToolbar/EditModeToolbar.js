import React, { useState, useEffect, useRef } from 'react';
import { Text } from '../Typography';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Animated,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SHADOWS, TYPOGRAPHY, SPACING, RADIUS, isTablet, getContainerPadding } from '../../constants';

const EditModeToolbar = ({
  onExit,
  onData,
  onUsers,
  onDayManagement,
  onActivityManagement,
  onCustomize,
  onSupport,
  theme,
  position = 'bottom',
  visible = true,
  onAnimationComplete,
  toolbarOrder,
  moreButtonPosition = 'right',
  onMoreToggle,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [translateY] = useState(() => new Animated.Value(position === 'top' ? -100 : 100));
  const [opacity] = useState(() => new Animated.Value(0));
  const [backgroundOpacity] = useState(() => new Animated.Value(0));
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [expandHeight] = useState(() => new Animated.Value(0));
  
  // Update screen width on dimension change
  useEffect(() => {
    const updateDimensions = ({ window }) => {
      setScreenWidth(window.width);
    };
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  // Animate expand/collapse of overflow row
  useEffect(() => {
    Animated.timing(expandHeight, {
      toValue: showMoreMenu ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showMoreMenu]);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: position === 'top' ? -100 : 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [visible, position, onAnimationComplete]);

  // Define all actions - only modal buttons
  const actionMap = {
    activities: { 
      label: 'Activities', 
      icon: 'add-circle', 
      onPress: () => onActivityManagement && onActivityManagement('add') 
    },
    day: { 
      label: 'Day', 
      icon: 'event', 
      onPress: () => onDayManagement && onDayManagement('plan') 
    },
    access: { 
      label: 'Access', 
      icon: 'security', 
      onPress: onUsers 
    },
    data: { 
      label: 'Data', 
      icon: 'source', 
      onPress: onData 
    },
    // Overflow items
    settings: { label: 'Settings', icon: 'settings', onPress: onCustomize, alwaysOverflow: true },
    ...(Platform.OS === 'web' && onSupport && { 
      contribute: { 
        label: 'Support', 
        icon: 'favorite', 
        onPress: onSupport, 
        alwaysOverflow: true 
      } 
    }),
  };

  // Default order if none provided - R->L: Activities, Day, Access, Data
  const defaultOrder = ['data', 'access', 'day', 'activities'];
  
  // Validate toolbar order - filter out invalid IDs
  const validIds = Object.keys(actionMap);
  const validatedOrder = toolbarOrder ? toolbarOrder.filter(id => validIds.includes(id)) : [];
  
  // Use validated order only if it has at least 3 valid buttons, otherwise use default
  // This prevents using an incomplete/corrupted toolbar order
  const currentOrder = validatedOrder.length >= 3 ? validatedOrder : defaultOrder;

  // Create actions array based on custom order (excluding special buttons like sort)
  const actions = currentOrder
    .filter(id => actionMap[id] && !actionMap[id].alwaysOverflow) // Filter first
    .map(id => ({
      id,
      ...actionMap[id],
      color: theme.primary
    }));

  // Calculate how many buttons can fit based on screen width
  const calculateVisibleButtons = () => {
    const containerPadding = getContainerPadding() * 2;
    const availableWidth = screenWidth - containerPadding;
    
    // Button width calculation - adjusted for Galaxy S25+ and similar phones
    const buttonWidth = isTablet(screenWidth) ? 65 : 44; // Reduced from 45 to 44 for phones
    const buttonGap = Platform.OS === 'web' ? 5 : 5; // Reduced gap from 6 to 5 for phones
    const editModeTextWidth = isTablet(screenWidth) ? 85 : 58; // Reduced from 60 to 58
    const moreButtonWidth = buttonWidth; // Same as regular buttons
    
    // Always reserve space for More button since Sort is always in overflow
    const reservedWidth = editModeTextWidth + moreButtonWidth + (buttonGap * 2);
    const usableWidth = availableWidth - reservedWidth;
    
    // Calculate how many buttons fit (including gaps)
    const maxButtons = Math.floor((usableWidth + buttonGap) / (buttonWidth + buttonGap));
    
    // Android tablets should always show all 4 buttons
    if (Platform.OS === 'android' && isTablet(screenWidth)) {
      return 4; // Force all 4 action buttons to be visible
    }
    
    // Force 4 buttons on phones with reasonable screen width (like Galaxy S25+)
    // Only drop to 3 on very small screens
    const minVisible = screenWidth >= 360 ? 4 : 3;
    
    // Return the number of buttons that can fit, but at least minVisible
    return Math.max(minVisible, Math.min(maxButtons, actions.length));
  };

  const visibleButtonCount = calculateVisibleButtons();
  
  const visibleActions = moreButtonPosition === 'left' 
    ? actions.slice(-visibleButtonCount) // Take from the end when More is on left
    : actions.slice(0, visibleButtonCount); // Take from the beginning when More is on right
  const regularOverflowActions = moreButtonPosition === 'left'
    ? actions.slice(0, -visibleButtonCount) // Overflow from the beginning when More is on left
    : actions.slice(visibleButtonCount); // Overflow from the end when More is on right
  
  // Add Settings button to overflow actions
  const settingsAction = {
    id: 'settings',
    ...actionMap.settings,
    color: theme.primary
  };
  
  // Add Contribute button for web only
  const alwaysOverflowActions = [settingsAction];
  if (Platform.OS === 'web' && actionMap.contribute) {
    alwaysOverflowActions.push({
      id: 'contribute',
      ...actionMap.contribute,
      color: theme.primary
    });
  }
  
  const overflowActions = [...regularOverflowActions, ...alwaysOverflowActions];
  const showMore = overflowActions.length > 0;

  const renderAction = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.actionButton, 
        item.disabled && styles.disabledButton
      ]}
      onPress={item.disabled ? null : item.onPress}
      disabled={item.disabled}
    >
      <Icon 
        name={item.icon} 
        size={Platform.OS === 'web' ? (isTablet() ? 28 : 24) : (isTablet() ? 34 : 30)} 
        color={item.disabled ? '#999' : 'white'} 
      />
      <Text style={[
        styles.actionLabel,
        { color: item.disabled ? '#999' : 'white' }
      ]}>
        {item.label}
        {item.disabled && ' *'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        { backgroundColor: theme.primary },
      ]}>
          <View style={styles.toolbarContainer}>
            {/* Theme-colored background with fade animation */}
            <Animated.View style={[styles.backgroundBar, { backgroundColor: theme.primary, opacity: backgroundOpacity }]} />
            
            {/* Animated toolbar that slides from behind */}
            <Animated.View
              style={[
                styles.toolbarWrapper,
                {
                  transform: [{ translateY }],
                  opacity,
                  // No extra padding needed since toolbar is now positioned 110px from edge
                },
              ]}
            >
              {/* Edit Mode label at top when position is top */}
              {position === 'top' && (
                <View style={styles.editModeLabelContainer}>
                  <Text style={styles.editModeLabel}>Edit Mode</Text>
                </View>
              )}
              
              {/* Expandable overflow row - appears above main toolbar when position is bottom */}
              {showMore && position === 'bottom' && (
                <Animated.View 
                  style={[
                    styles.overflowRow,
                    styles.overflowRowTop,
                    {
                      maxHeight: expandHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 100]
                      }),
                      opacity: expandHeight,
                      overflow: 'hidden',
                    }
                  ]}
                >
                  <View style={styles.overflowButtons}>
                    {overflowActions.map(action => (
                      <View key={action.id}>
                        {renderAction({ item: action })}
                      </View>
                    ))}
                  </View>
                </Animated.View>
              )}
              
              <View style={styles.toolbar}>
              {/* More button on the left */}
              {showMore && moreButtonPosition === 'left' && (
                <TouchableOpacity
                  style={[styles.actionButton, showMoreMenu && styles.actionButtonActive]}
                  onPress={() => {
                    const newState = !showMoreMenu;
                    setShowMoreMenu(newState);
                    if (onMoreToggle) onMoreToggle(newState);
                  }}
                >
                  <Icon name={showMoreMenu ? (position === 'top' ? "expand-less" : "expand-more") : (position === 'top' ? "expand-more" : "expand-less")} size={Platform.OS === 'web' ? (isTablet() ? 28 : 24) : (isTablet() ? 34 : 30)} color="white" />
                  <Text style={[styles.actionLabel, { color: 'white' }]}>
                    {showMoreMenu ? 'Less' : 'More'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* Regular action buttons */}
              {visibleActions.map(action => (
                <View key={action.id}>
                  {renderAction({ item: action })}
                </View>
              ))}
              
              {/* More button on the right */}
              {showMore && moreButtonPosition === 'right' && (
                <TouchableOpacity
                  style={[styles.actionButton, showMoreMenu && styles.actionButtonActive]}
                  onPress={() => {
                    const newState = !showMoreMenu;
                    setShowMoreMenu(newState);
                    if (onMoreToggle) onMoreToggle(newState);
                  }}
                >
                  <Icon name={showMoreMenu ? (position === 'top' ? "expand-less" : "expand-more") : (position === 'top' ? "expand-more" : "expand-less")} size={Platform.OS === 'web' ? (isTablet() ? 28 : 24) : (isTablet() ? 34 : 30)} color="white" />
                  <Text style={[styles.actionLabel, { color: 'white' }]}>
                    {showMoreMenu ? 'Less' : 'More'}
                  </Text>
                </TouchableOpacity>
              )}
              </View>
              
              {/* Edit Mode label at bottom when position is bottom */}
              {position === 'bottom' && (
                <View style={[styles.editModeLabelContainer, styles.editModeLabelBottom]}>
                  <Text style={styles.editModeLabel}>Edit Mode</Text>
                </View>
              )}
              
              {/* Expandable overflow row - appears below main toolbar when position is top */}
              {showMore && position === 'top' && (
                <Animated.View 
                  style={[
                    styles.overflowRow,
                    {
                      maxHeight: expandHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 100]
                      }),
                      opacity: expandHeight,
                      overflow: 'hidden',
                    }
                  ]}
                >
                  <View style={styles.overflowButtons}>
                    {overflowActions.map(action => (
                      <View key={action.id}>
                        {renderAction({ item: action })}
                      </View>
                    ))}
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          </View>
      </View>

    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  topPosition: {
    top: 0,
  },
  bottomPosition: {
    bottom: 0,
  },
  toolbarContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 8 : 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  toolbarWrapper: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 8 : (Platform.OS === 'android' ? 0 : 12),
    paddingBottom: Platform.OS === 'web' ? 8 : (Platform.OS === 'android' ? 10 : 12),
    position: 'relative',
    zIndex: 1,
  },
  editModeLabelContainer: {
    marginBottom: Platform.OS === 'web' ? 1 : 1,
  },
  editModeLabelBottom: {
    marginBottom: Platform.OS === 'android' ? 2 : 0,
    marginTop: Platform.OS === 'web' ? 1 : 1,
  },
  editModeLabel: {
    color: 'white',
    fontSize: Platform.OS === 'web' ? (isTablet(Dimensions.get('window').width) ? 16 : 15) : (isTablet(Dimensions.get('window').width) ? 18 : 16),
    fontWeight: Platform.OS === 'ios' ? '700' : 'normal',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    opacity: 1,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: getContainerPadding() + SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    // Gap is not supported on Android, use margin on buttons instead
    ...(Platform.OS === 'web' && { gap: 5 }),
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 5 : 4,
    paddingVertical: Platform.OS === 'web' ? 4 : 5,
    // Gap is not supported on Android
    ...(Platform.OS === 'web' ? { gap: 1 } : Platform.OS === 'ios' ? { gap: 2 } : {}),
    // Add margin for Android to replace gap - increased for better spacing
    ...(Platform.OS === 'android' && { marginHorizontal: 5 }),
    // Also add margin for iOS for consistent spacing
    ...(Platform.OS === 'ios' && { marginHorizontal: 4 }),
    minWidth: isTablet(Dimensions.get('window').width) ? 65 : 44,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  actionLabel: {
    fontSize: Platform.OS === 'web' ? (isTablet(Dimensions.get('window').width) ? 12 : 9) : (isTablet(Dimensions.get('window').width) ? 13 : 11),
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'center',
  },
  overflowRow: {
    marginTop: Platform.OS === 'web' ? 4 : 6,
    paddingTop: Platform.OS === 'web' ? 6 : 8,
    paddingBottom: Platform.OS === 'web' ? 2 : 4,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  overflowRowTop: {
    marginTop: 0,
    marginBottom: Platform.OS === 'web' ? 4 : 6,
    paddingTop: Platform.OS === 'web' ? 2 : 4,
    paddingBottom: Platform.OS === 'web' ? 6 : 8,
    borderTopWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  overflowButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Platform.OS === 'web' ? 8 : 10,
    paddingHorizontal: getContainerPadding() + SPACING.xs,
  },
});

export default EditModeToolbar;