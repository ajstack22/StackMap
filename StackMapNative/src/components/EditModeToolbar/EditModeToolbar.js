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
  theme,
  position = 'bottom',
  visible = true,
  onAnimationComplete,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [translateY] = useState(() => new Animated.Value(position === 'top' ? -100 : 100));
  const [opacity] = useState(() => new Animated.Value(0));
  const [backgroundOpacity] = useState(() => new Animated.Value(0));

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

  // Define all actions - ordered for right-handed users (most used on right)
  const actions = [
    { id: 'settings', label: 'Settings', icon: 'settings', onPress: onSettings, color: theme.primary },
    { id: 'complete', label: 'Complete', icon: 'event-available', onPress: onCompleteDay, color: theme.primary },
    { id: 'plan', label: 'Plan', icon: 'event', onPress: onPlan, color: theme.primary },
    { id: 'library', label: 'Library', icon: 'collections-bookmark', onPress: onLibrary, color: theme.primary },
    { id: 'add', label: 'Add', icon: 'add-circle', onPress: onAdd, color: theme.primary },
  ];

  // Show all 4 actions on both mobile and tablet
  const visibleActions = actions;
  const overflowActions = [];
  const showMore = false;

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
        size={isTablet() ? 36 : 31} 
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
                },
              ]}
            >
              <Text style={styles.editModeLabel}>Edit Mode</Text>
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
    paddingTop: Platform.OS === 'android' ? SPACING.lg : SPACING.sm,
    paddingBottom: Platform.OS === 'android' ? SPACING.lg : SPACING.sm,
    position: 'relative',
    zIndex: 1,
  },
  editModeLabel: {
    color: 'white',
    fontSize: isTablet() ? 20 : 18,
    fontWeight: Platform.OS === 'ios' ? '700' : 'normal',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginBottom: SPACING.sm,
    opacity: 1,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: getContainerPadding() + SPACING.sm,
    justifyContent: (Platform.OS === 'web' || isTablet()) ? 'center' : 'space-between',
    width: '100%',
    gap: (Platform.OS === 'web' || isTablet()) ? SPACING.md : 0,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
    flex: (Platform.OS === 'web' || isTablet()) ? 0 : 1,
    maxWidth: (Platform.OS === 'web' || isTablet()) ? undefined : 80,
    minWidth: (Platform.OS === 'web' || isTablet()) ? 70 : undefined,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionLabel: {
    fontSize: isTablet() ? 16 : 14,
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