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
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHADOWS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  isTablet,
  getContainerPadding,
} from '../../constants';

// Helper function to get icon name based on position and state
const getMoreIconName = (showMoreMenu, position) => {
  if (showMoreMenu) {
    return position === 'top' ? 'expand-less' : 'expand-more';
  }
  return position === 'top' ? 'expand-more' : 'expand-less';
};

// Helper function to get icon size based on platform and screen size
const getIconSize = () => {
  if (Platform.OS === 'web') {
    return isTablet() ? 28 : 24;
  }
  return isTablet() ? 34 : 30;
};

// Helper function to calculate visible buttons
const calculateVisibleButtons = (screenWidth) => {
  const containerPadding = getContainerPadding() * 2;
  const availableWidth = screenWidth - containerPadding;

  // Button width calculation - adjusted for Galaxy S25+ and similar phones
  const buttonWidth = isTablet(screenWidth) ? 65 : 44;
  const buttonGap = 5;
  const editModeTextWidth = isTablet(screenWidth) ? 85 : 58;
  const moreButtonWidth = buttonWidth;

  // Always reserve space for More button since Sort is always in overflow
  const reservedWidth = editModeTextWidth + moreButtonWidth + buttonGap * 2;
  const usableWidth = availableWidth - reservedWidth;

  // Calculate how many buttons fit (including gaps)
  const maxButtons = Math.floor(
    (usableWidth + buttonGap) / (buttonWidth + buttonGap),
  );

  // Android tablets should always show all 4 buttons
  if (Platform.OS === 'android' && isTablet(screenWidth)) {
    return 4;
  }

  // Force 4 buttons on phones with reasonable screen width
  const minVisible = screenWidth >= 360 ? 4 : 3;
  return Math.max(minVisible, maxButtons);
};

// Helper function to render action button
const renderActionButton = (item) => (
  <TouchableOpacity
    style={[styles.actionButton, item.disabled && styles.disabledButton]}
    onPress={item.disabled ? null : item.onPress}
    disabled={item.disabled}
  >
    <Icon
      name={item.icon}
      size={getIconSize()}
      color={item.disabled ? '#999' : 'white'}
    />
    <Text
      style={[
        styles.actionLabel,
        { color: item.disabled ? '#999' : 'white' },
      ]}
    >
      {item.label}
      {item.disabled && ' *'}
    </Text>
  </TouchableOpacity>
);

// Helper function to render more button
const renderMoreButton = (
  showMoreMenu,
  setShowMoreMenu,
  onMoreToggle,
  position
) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      showMoreMenu && styles.actionButtonActive,
    ]}
    onPress={() => {
      const newState = !showMoreMenu;
      setShowMoreMenu(newState);
      if (onMoreToggle) onMoreToggle(newState);
    }}
  >
    <Icon
      name={getMoreIconName(showMoreMenu, position)}
      size={getIconSize()}
      color="white"
    />
    <Text style={[styles.actionLabel, { color: 'white' }]}>
      {showMoreMenu ? 'Less' : 'More'}
    </Text>
  </TouchableOpacity>
);

// Helper function to get action configurations
const getActionConfigurations = (
  onActivityManagement,
  onDayManagement,
  onUsers,
  onData,
  onCustomize,
  onSupport,
  theme
) => {
  return {
    activities: {
      label: 'Activities',
      icon: 'add-photo-alternate',
      onPress: () => onActivityManagement && onActivityManagement('add'),
    },
    day: {
      label: 'Day',
      icon: 'event',
      onPress: () => onDayManagement && onDayManagement('plan'),
    },
    access: {
      label: 'Access',
      icon: 'security',
      onPress: onUsers,
    },
    data: {
      label: 'Data',
      icon: 'source',
      onPress: onData,
    },
    // Overflow items
    settings: {
      label: 'Settings',
      icon: 'settings',
      onPress: onCustomize,
      alwaysOverflow: true,
    },
    ...(Platform.OS === 'web' && onSupport
      ? {
          contribute: {
            label: 'Support',
            icon: 'favorite',
            onPress: onSupport,
            alwaysOverflow: true,
          },
        }
      : {}),
  };
};

// Helper function to get visible and overflow actions
const getVisibleAndOverflowActions = (
  actionMap,
  toolbarOrder,
  visibleButtonCount,
  moreButtonPosition,
  theme
) => {
  // Default order if none provided
  const defaultOrder = ['data', 'access', 'day', 'activities'];

  // Validate toolbar order
  const validIds = Object.keys(actionMap);
  const validatedOrder = toolbarOrder
    ? toolbarOrder.filter(id => validIds.includes(id))
    : [];

  const currentOrder =
    validatedOrder.length >= 3 ? validatedOrder : defaultOrder;

  // Create actions array
  const actions = currentOrder
    .filter(id => actionMap[id] && !actionMap[id].alwaysOverflow)
    .map(id => ({
      id,
      ...actionMap[id],
      color: theme.primary,
    }));

  const visibleActions =
    moreButtonPosition === 'left'
      ? actions.slice(-visibleButtonCount)
      : actions.slice(0, visibleButtonCount);

  const regularOverflowActions =
    moreButtonPosition === 'left'
      ? actions.slice(0, -visibleButtonCount)
      : actions.slice(visibleButtonCount);

  // Add always overflow actions
  const settingsAction = {
    id: 'settings',
    ...actionMap.settings,
    color: theme.primary,
  };

  const alwaysOverflowActions = [settingsAction];
  if (Platform.OS === 'web' && actionMap.contribute) {
    alwaysOverflowActions.push({
      id: 'contribute',
      ...actionMap.contribute,
      color: theme.primary,
    });
  }

  const overflowActions = [...regularOverflowActions, ...alwaysOverflowActions];
  const showMore = overflowActions.length > 0;

  return { visibleActions, overflowActions, showMore };
};

// Helper function to render overflow row
const renderOverflowRow = (
  showMore,
  position,
  expandHeight,
  overflowActions
) => {
  if (!showMore) return null;

  const isTop = position === 'top';
  const style = [
    styles.overflowRow,
    isTop ? {} : styles.overflowRowTop,
    {
      maxHeight: expandHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 100],
      }),
      opacity: expandHeight,
      overflow: 'hidden',
    },
  ];

  return (
    <Animated.View style={style}>
      <View style={styles.overflowButtons}>
        {overflowActions.map(action => (
          <View key={action.id}>
            {renderActionButton(action)}
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

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
  style,
}) => {
  const insets = useSafeAreaInsets();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [translateY] = useState(
    () => new Animated.Value(position === 'top' ? -100 : 100),
  );
  const [opacity] = useState(() => new Animated.Value(0));
  const [backgroundOpacity] = useState(() => new Animated.Value(0));
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width,
  );
  const [expandHeight] = useState(() => new Animated.Value(0));

  // Update screen width on dimension change
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

  const actionMap = getActionConfigurations(
    onActivityManagement,
    onDayManagement,
    onUsers,
    onData,
    onCustomize,
    onSupport,
    theme
  );

  const visibleButtonCount = calculateVisibleButtons(screenWidth);

  const { visibleActions, overflowActions, showMore } = getVisibleAndOverflowActions(
    actionMap,
    toolbarOrder,
    visibleButtonCount,
    moreButtonPosition,
    theme
  );

  const renderAction = ({ item }) => renderActionButton(item);

  // Calculate top padding for safe area
  const topPadding =
    position === 'top'
      ? Platform.OS === 'ios'
        ? insets.top
        : Platform.OS === 'android'
        ? StatusBar.currentHeight || 24
        : 0
      : 0;

  return (
    <>
      <View
        style={[
          styles.container,
          position === 'top' ? styles.topPosition : styles.bottomPosition,
          {
            backgroundColor: theme.primary,
            paddingTop: topPadding,
          },
        ]}
      >
        <View style={styles.toolbarContainer}>
          {/* Theme-colored background with fade animation */}
          <Animated.View
            style={[
              styles.backgroundBar,
              { backgroundColor: theme.primary, opacity: backgroundOpacity },
            ]}
          />

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
            {position === 'bottom' && renderOverflowRow(
              showMore,
              position,
              expandHeight,
              overflowActions
            )}

            <View style={styles.toolbar}>
              {/* More button on the left */}
              {showMore && moreButtonPosition === 'left' &&
                renderMoreButton(
                  showMoreMenu,
                  setShowMoreMenu,
                  onMoreToggle,
                  position
                )
              }

              {/* Regular action buttons */}
              {visibleActions.map(action => (
                <View key={action.id}>{renderAction({ item: action })}</View>
              ))}

              {/* More button on the right */}
              {showMore && moreButtonPosition === 'right' &&
                renderMoreButton(
                  showMoreMenu,
                  setShowMoreMenu,
                  onMoreToggle,
                  position
                )
              }
            </View>

            {/* Edit Mode label at bottom when position is bottom */}
            {position === 'bottom' && (
              <View
                style={[
                  styles.editModeLabelContainer,
                  styles.editModeLabelBottom,
                ]}
              >
                <Text style={styles.editModeLabel}>Edit Mode</Text>
              </View>
            )}

            {/* Expandable overflow row - appears below main toolbar when position is top */}
            {position === 'top' && renderOverflowRow(
              showMore,
              position,
              expandHeight,
              overflowActions
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
    zIndex: 100,
    elevation: Platform.OS === 'android' ? 10 : 0, // Android elevation for proper layering
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
    paddingTop: Platform.OS === 'web' ? 12 : Platform.OS === 'android' ? 8 : 16,
    paddingBottom:
      Platform.OS === 'web' ? 12 : Platform.OS === 'android' ? 16 : 20,
    position: 'relative',
    zIndex: 1,
  },
  editModeLabelContainer: {
    marginBottom: 1,
  },
  editModeLabelBottom: {
    marginBottom: Platform.OS === 'android' ? 2 : 0,
    marginTop: 1,
  },
  editModeLabel: {
    color: 'white',
    fontSize:
      Platform.OS === 'web'
        ? isTablet(Dimensions.get('window').width)
          ? 16
          : 15
        : isTablet(Dimensions.get('window').width)
        ? 18
        : 16,
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
    ...(Platform.OS === 'web'
      ? { gap: 1 }
      : Platform.OS === 'ios'
      ? { gap: 2 }
      : {}),
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
    fontSize:
      Platform.OS === 'web'
        ? isTablet(Dimensions.get('window').width)
          ? 12
          : 9
        : isTablet(Dimensions.get('window').width)
        ? 13
        : 11,
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
