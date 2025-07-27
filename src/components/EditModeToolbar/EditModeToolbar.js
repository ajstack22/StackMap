import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  FlatList,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { SHADOWS, TYPOGRAPHY, SPACING, RADIUS, isTablet, getContainerPadding } from '../../constants';

const EditModeToolbar = ({
  onExit,
  onAdd,
  onLibrary,
  onCompleteDay,
  onPlan,
  onShare,
  onData,
  onUsers,
  onCustomize,
  theme,
  position = 'bottom',
  visible = true,
  onAnimationComplete,
  toolbarOrder,
  moreButtonPosition = 'right',
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

  // Define all actions
  const actionMap = {
    users: { label: 'Users', icon: 'group', onPress: onUsers },
    data: { label: 'Data', icon: 'cloud-sync', onPress: onData },
    complete: { label: 'Complete', icon: 'event-available', onPress: onCompleteDay },
    ...(onShare && { share: { label: 'Share', icon: 'share', onPress: onShare } }),
    plan: { label: 'Plan', icon: 'event', onPress: onPlan },
    library: { label: 'Library', icon: 'collections-bookmark', onPress: onLibrary },
    add: { label: 'Add', icon: 'add-circle', onPress: onAdd },
    sort: { label: 'Sort', icon: 'sort', onPress: onCustomize, alwaysOverflow: true },
  };

  // Default order if none provided
  const defaultOrder = ['data', 'users', 'share', 'complete', 'plan', 'library', 'add'];
  
  // Validate and use toolbar order
  const currentOrder = (Array.isArray(toolbarOrder) && toolbarOrder.length > 0) 
    ? toolbarOrder 
    : defaultOrder;

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
    
    // Button width calculation - more accurate based on actual button content
    const buttonWidth = isTablet() ? 65 : 50; // Actual button width is smaller
    const buttonGap = Platform.OS === 'web' ? 8 : 10; // Gap between buttons from styles
    const editModeTextWidth = isTablet() ? 90 : 65; // More accurate text width
    const moreButtonWidth = buttonWidth; // Same as regular buttons
    
    // Reserve space for "Edit Mode" text and "More" button
    const reservedWidth = editModeTextWidth + moreButtonWidth + (buttonGap * 2);
    const usableWidth = availableWidth - reservedWidth;
    
    // Calculate how many buttons fit (including gaps)
    const maxButtons = Math.floor((usableWidth + buttonGap) / (buttonWidth + buttonGap));
    
    // Ensure at least 4 buttons are visible on phones (5 total with More button)
    const minVisible = isTablet() ? 3 : 4;
    return Math.max(minVisible, Math.min(maxButtons, actions.length));
  };

  const visibleButtonCount = calculateVisibleButtons();
  const visibleActions = moreButtonPosition === 'left' 
    ? actions.slice(-visibleButtonCount) // Take from the end when More is on left
    : actions.slice(0, visibleButtonCount); // Take from the beginning when More is on right
  const regularOverflowActions = moreButtonPosition === 'left'
    ? actions.slice(0, -visibleButtonCount) // Overflow from the beginning when More is on left
    : actions.slice(visibleButtonCount); // Overflow from the end when More is on right
  
  // Add Sort button to overflow actions
  const sortAction = {
    id: 'sort',
    ...actionMap.sort,
    color: theme.primary
  };
  const overflowActions = [...regularOverflowActions, sortAction];
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
        size={Platform.OS === 'web' ? (isTablet() ? 28 : 24) : (isTablet() ? 32 : 28)} 
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
      ]}>
        <SafeAreaView style={[
          styles.safeArea,
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
                  // Add extra padding for Android to avoid camera
                  ...(Platform.OS === 'android' && {
                    // When toolbar is at top (banner at bottom), add top padding
                    ...(position === 'top' && {
                      paddingTop: (StatusBar.currentHeight || 24) + 8,
                    }),
                    // When toolbar is at bottom (banner at top), add bottom padding to avoid camera
                    ...(position === 'bottom' && {
                      paddingBottom: 16, // Extra padding to avoid camera cutout
                    }),
                  }),
                },
              ]}
            >
              {/* Edit Mode label at top when position is top, at bottom when position is bottom */}
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
                  style={styles.actionButton}
                  onPress={() => setShowMoreMenu(!showMoreMenu)}
                >
                  <Icon name={showMoreMenu ? (position === 'bottom' ? "expand-more" : "expand-less") : (position === 'bottom' ? "expand-less" : "expand-more")} size={Platform.OS === 'web' ? (isTablet() ? 28 : 24) : (isTablet() ? 32 : 28)} color="white" />
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
                  style={styles.actionButton}
                  onPress={() => setShowMoreMenu(!showMoreMenu)}
                >
                  <Icon name={showMoreMenu ? (position === 'bottom' ? "expand-more" : "expand-less") : (position === 'bottom' ? "expand-less" : "expand-more")} size={Platform.OS === 'web' ? (isTablet() ? 28 : 24) : (isTablet() ? 32 : 28)} color="white" />
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
        </SafeAreaView>
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
  safeArea: {
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  toolbarWrapper: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 4 : (Platform.OS === 'android' ? 8 : 4),
    paddingBottom: Platform.OS === 'web' ? 4 : (Platform.OS === 'android' ? 8 : 4),
    position: 'relative',
    zIndex: 1,
  },
  editModeLabelContainer: {
    marginBottom: Platform.OS === 'web' ? 2 : 3,
  },
  editModeLabelBottom: {
    marginBottom: 0,
    marginTop: Platform.OS === 'web' ? 2 : 3,
  },
  editModeLabel: {
    color: 'white',
    fontSize: Platform.OS === 'web' ? (isTablet() ? 16 : 15) : (isTablet() ? 18 : 16),
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
    gap: Platform.OS === 'web' ? 8 : 10,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 8 : 10,
    paddingVertical: Platform.OS === 'web' ? 4 : 5,
    gap: Platform.OS === 'web' ? 1 : 2,
    minWidth: isTablet() ? 70 : 60,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionLabel: {
    fontSize: Platform.OS === 'web' ? (isTablet() ? 13 : 11) : (isTablet() ? 14 : 12),
    fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textAlign: 'center',
  },
  overflowRow: {
    marginTop: Platform.OS === 'web' ? 4 : 6,
    paddingTop: Platform.OS === 'web' ? 4 : 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  overflowRowTop: {
    marginTop: 0,
    marginBottom: Platform.OS === 'web' ? 4 : 6,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'web' ? 4 : 6,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
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