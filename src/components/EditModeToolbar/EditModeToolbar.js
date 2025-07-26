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
  onSettings,
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
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [translateY] = useState(() => new Animated.Value(position === 'top' ? -100 : 100));
  const [opacity] = useState(() => new Animated.Value(0));
  const [backgroundOpacity] = useState(() => new Animated.Value(0));
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  // Update screen width on dimension change
  useEffect(() => {
    const updateDimensions = ({ window }) => {
      setScreenWidth(window.width);
    };
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

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
    settings: { label: 'Settings', icon: 'settings', onPress: onSettings },
    users: { label: 'Users', icon: 'group', onPress: onUsers },
    data: { label: 'Data', icon: 'cloud-sync', onPress: onData },
    complete: { label: 'Complete', icon: 'event-available', onPress: onCompleteDay },
    share: { label: 'Share', icon: 'share', onPress: onShare },
    plan: { label: 'Plan', icon: 'event', onPress: onPlan },
    library: { label: 'Library', icon: 'collections-bookmark', onPress: onLibrary },
    add: { label: 'Add', icon: 'add-circle', onPress: onAdd },
  };

  // Default order if none provided
  const defaultOrder = ['add', 'library', 'plan', 'share', 'complete', 'data', 'users', 'settings'];
  const currentOrder = toolbarOrder || defaultOrder;

  // Create actions array based on custom order
  const actions = currentOrder.map(id => ({
    id,
    ...actionMap[id],
    color: theme.primary
  })).filter(action => action.onPress); // Filter out any invalid actions

  // Calculate how many buttons can fit based on screen width
  const calculateVisibleButtons = () => {
    const containerPadding = getContainerPadding() * 2;
    const buttonPadding = SPACING.xs * 2;
    const availableWidth = screenWidth - containerPadding - buttonPadding;
    
    // Button width calculation (approximate)
    const minButtonWidth = isTablet() ? 70 : 60;
    const editModeTextWidth = isTablet() ? 100 : 80;
    const moreButtonWidth = minButtonWidth;
    
    // Reserve space for "Edit Mode" text and "More" button
    const usableWidth = availableWidth - editModeTextWidth - moreButtonWidth;
    
    // Calculate how many buttons fit
    const maxButtons = Math.floor(usableWidth / minButtonWidth);
    
    // Ensure at least 3 buttons are visible
    return Math.max(3, Math.min(maxButtons, actions.length));
  };

  const visibleButtonCount = calculateVisibleButtons();
  const visibleActions = actions.slice(0, visibleButtonCount);
  const overflowActions = actions.slice(visibleButtonCount);
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

  const renderMoreMenuItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.moreMenuItem, item.disabled && styles.disabledMenuItem]}
      onPress={() => {
        setShowMoreMenu(false);
        if (!item.disabled && item.onPress) {
          item.onPress();
        }
      }}
      disabled={item.disabled}
    >
      <Icon 
        name={item.icon} 
        size={24} 
        color={item.disabled ? '#999' : item.color} 
      />
      <Text style={[
        styles.moreMenuLabel,
        { color: item.disabled ? '#999' : item.color }
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
              <TouchableOpacity onLongPress={onCustomize} activeOpacity={0.8}>
                <Text style={styles.editModeLabel}>Edit Mode</Text>
              </TouchableOpacity>
              <View style={styles.toolbar}>
              {visibleActions.map(action => (
                <View key={action.id}>
                  {renderAction({ item: action })}
                </View>
              ))}
              
              {showMore && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowMoreMenu(true)}
                >
                  <Icon name="more-horiz" size={isTablet() ? 32 : 28} color="white" />
                  <Text style={[styles.actionLabel, { color: 'white' }]}>
                    More
                  </Text>
                </TouchableOpacity>
              )}
              </View>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>

      {/* More Menu Modal */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.moreMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={[styles.moreMenuContainer, { backgroundColor: 'white' }]}>
            <FlatList
              data={overflowActions}
              renderItem={renderMoreMenuItem}
              keyExtractor={item => item.id}
              ItemSeparatorComponent={() => <View style={styles.moreMenuSeparator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  editModeLabel: {
    color: 'white',
    fontSize: Platform.OS === 'web' ? (isTablet() ? 16 : 15) : (isTablet() ? 18 : 16),
    fontWeight: Platform.OS === 'ios' ? '700' : 'normal',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginBottom: Platform.OS === 'web' ? 2 : 3,
    opacity: 1,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: getContainerPadding() + SPACING.xs,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 2 : 3,
    paddingVertical: Platform.OS === 'web' ? 4 : 5,
    gap: Platform.OS === 'web' ? 1 : 2,
    flex: 1,
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
  moreMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMenuContainer: {
    width: '80%',
    maxWidth: 300,
    borderRadius: RADIUS.lg,
    ...SHADOWS.level3,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  disabledMenuItem: {
    opacity: 0.6,
  },
  moreMenuLabel: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  moreMenuSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});

export default EditModeToolbar;