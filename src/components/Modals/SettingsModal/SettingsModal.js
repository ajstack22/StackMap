import React, { useState, useEffect, useRef } from 'react';
import { Text } from '../../Typography';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { SPACING } from '../../../constants';

// Note: Draggable functionality has been removed in favor of button-based reordering

const DEFAULT_TOOLBAR_ORDER = ['data', 'access', 'complete', 'library', 'add'];

const TOOLBAR_BUTTONS = {
  add: { label: 'Add', icon: 'add-circle' },
  library: { label: 'Library', icon: 'bookmark' },
  complete: { label: 'Complete', icon: 'check-circle' },
  access: { label: 'Access', icon: 'security' },
  data: { label: 'Data', icon: 'source' },
};

const SettingsModal = ({
  visible,
  onClose,
  theme,
  currentOrder,
  onSaveOrder,
  moreButtonPosition = 'right',
  onSaveMorePosition,
  showToast,
  // Display settings
  bannerPosition,
  setBannerPosition,
  displayMode,
  setDisplayMode,
  taskCelebration,
  setTaskCelebration,
  routineCelebration,
  setRoutineCelebration,
  onSaveBannerPosition,
  onSaveDisplayMode,
  onSaveCelebration,
  // Day mode settings
  dayMode,
  setDayMode,
}) => {
  // Native modules removed - using standard components

  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [scrollKey, setScrollKey] = useState(0);
  const [buttonOrder, setButtonOrder] = useState(() => {
    if (currentOrder && currentOrder.length) {
      const filtered = currentOrder.filter(
        id => id !== 'settings' && id !== 'more' && TOOLBAR_BUTTONS[id],
      );
      return filtered.length ? filtered : DEFAULT_TOOLBAR_ORDER;
    }
    return DEFAULT_TOOLBAR_ORDER;
  });
  const [morePosition, setMorePosition] = useState(moreButtonPosition);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width,
  );

  // Calculate visible button count based on screen width
  const calculateVisibleButtonCount = () => {
    const containerPadding = 32 * 2; // Match EditModeToolbar's calculation
    const availableWidth = screenWidth - containerPadding;

    // Button width calculation - more accurate based on actual button content
    const buttonWidth = 50; // Actual button width is smaller
    const buttonGap = Platform.OS === 'web' ? 8 : 10; // Gap between buttons from styles
    const editModeTextWidth = 65; // More accurate text width
    const moreButtonWidth = buttonWidth; // Same as regular buttons

    // Reserve space for "Edit Mode" text and "More" button
    const reservedWidth = editModeTextWidth + moreButtonWidth + buttonGap * 2;
    const usableWidth = availableWidth - reservedWidth;

    // Calculate how many buttons fit (including gaps)
    const maxButtons = Math.floor(
      (usableWidth + buttonGap) / (buttonWidth + buttonGap),
    );

    // Ensure at least 4 buttons are visible on phones
    const minVisible = 4;
    return Math.max(minVisible, Math.min(maxButtons, buttonOrder.length));
  };

  const visibleButtonCount = calculateVisibleButtonCount();

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

  useEffect(() => {
    let newOrder;

    if (currentOrder && currentOrder.length) {
      // Map old IDs to new ones if needed
      const idMap = {
        users: 'access',
        share: 'data',
        day: 'complete', // Migrate 'day' to 'complete'
        plan: 'complete', // Also map old 'plan' to 'complete'
        activities: 'add', // Map old 'activities' to 'add'
        new: 'add', // Map 'new' to 'add' for any existing configs
        sort: null, // Remove old sort button
      };

      // Filter and map the order
      let filteredOrder = currentOrder
        .map(id => {
          // Filter out special buttons
          if (id === 'settings' || id === 'more' || id === 'sort') return null;
          // Use mapped ID if it exists, otherwise use original
          return idMap[id] !== undefined ? idMap[id] : id;
        })
        .filter(id => id && TOOLBAR_BUTTONS[id]); // Remove nulls and invalid IDs

      // Add any missing buttons from DEFAULT_TOOLBAR_ORDER
      // This handles migration when new buttons are added (like 'library')
      DEFAULT_TOOLBAR_ORDER.forEach(id => {
        if (!filteredOrder.includes(id)) {
          // Insert new buttons at their default position
          const defaultIndex = DEFAULT_TOOLBAR_ORDER.indexOf(id);
          filteredOrder.splice(defaultIndex, 0, id);
        }
      });

      // On Android tablets, force default if we get a suspicious result
      if (Platform.OS === 'android' && filteredOrder.length < 3) {
        newOrder = DEFAULT_TOOLBAR_ORDER;
      } else {
        newOrder = filteredOrder.length ? filteredOrder : DEFAULT_TOOLBAR_ORDER;
      }
    } else {
      // Reset to default if no custom order
      newOrder = DEFAULT_TOOLBAR_ORDER;
    }

    // Only update if the order actually changed (prevents infinite loops)
    setButtonOrder(prevOrder => {
      if (JSON.stringify(prevOrder) === JSON.stringify(newOrder)) {
        return prevOrder; // No change, return same reference
      }
      return newOrder;
    });
  }, [currentOrder]);

  const handleBannerPositionChange = position => {
    setBannerPosition(position);
    onSaveBannerPosition(position);
  };

  const handleDisplayModeChange = mode => {
    setDisplayMode(mode);
    onSaveDisplayMode(mode);
  };

  const handleTaskCelebrationChange = celebration => {
    setTaskCelebration(celebration);
    onSaveCelebration('task', celebration);
  };

  const handleRoutineCelebrationChange = celebration => {
    setRoutineCelebration(celebration);
    onSaveCelebration('routine', celebration);
  };

  // Auto-save button order when it changes
  useEffect(() => {
    if (buttonOrder && buttonOrder.length) {
      const orderToSave =
        Array.isArray(buttonOrder) && buttonOrder.length
          ? [...buttonOrder] // Create a new array reference
          : DEFAULT_TOOLBAR_ORDER;

      // Only save if the order actually changed
      if (JSON.stringify(orderToSave) !== JSON.stringify(currentOrder)) {
        onSaveOrder(orderToSave);
      }
    }
  }, [buttonOrder]); // Remove onSaveOrder from dependencies

  // Auto-save more position when it changes
  useEffect(() => {
    if (onSaveMorePosition && morePosition !== moreButtonPosition) {
      onSaveMorePosition(morePosition);
    }
  }, [morePosition]); // Remove onSaveMorePosition from dependencies

  const handleReset = () => {
    setButtonOrder(DEFAULT_TOOLBAR_ORDER);
    setMorePosition('left');
    setBannerPosition('bottom');
    showToast({ message: 'Reset to defaults' });
  };

  const moveButton = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    const newOrder = [...buttonOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setButtonOrder(newOrder);
  };

  const moveUp = index => {
    if (index > 0) {
      moveButton(index, index - 1);
    }
  };

  const moveDown = index => {
    if (index < buttonOrder.length - 1) {
      moveButton(index, index + 1);
    }
  };

  const renderButton = ({ item, drag, isActive }) => {
    const index = buttonOrder.indexOf(item);
    const isInOverflow =
      morePosition === 'left'
        ? index < buttonOrder.length - visibleButtonCount // Overflow from beginning when More is on left
        : index >= visibleButtonCount; // Overflow from end when More is on right
    const button = TOOLBAR_BUTTONS[item];

    return (
      <TouchableOpacity
        style={[styles.buttonItem, isActive && styles.buttonItemDragging]}
        onLongPress={drag}
        disabled={isActive}
      >
        <Icon
          name="drag-handle"
          size={24}
          color="#000"
          style={styles.dragHandle}
        />
        <Icon
          name={button.icon}
          size={24}
          color={theme.primary}
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonLabel}>{button.label}</Text>
        <Text style={styles.buttonPosition}>
          #{morePosition === 'left' ? buttonOrder.length - index : index + 1}
        </Text>
        {isInOverflow && (
          <View style={styles.overflowIndicator}>
            <Text style={styles.overflowText}>OVERFLOW</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPreviewButton = buttonId => {
    const button = TOOLBAR_BUTTONS[buttonId];
    if (!button) return null;
    return (
      <View key={buttonId} style={styles.previewButton}>
        <Icon
          name={button.icon}
          size={20}
          color={theme.primary}
          style={styles.previewButtonIcon}
        />
        <Text style={styles.previewButtonLabel}>{button.label}</Text>
      </View>
    );
  };

  const renderContent = () => (
    <View style={styles.section}>
              {/* Header */}
              <View style={styles.standardTabContainer}>
                <Icon name="settings" size={48} color={theme.primary} />
                <Text style={styles.standardTabTitle}>Settings</Text>
                <Text style={styles.standardTabDescription}>
                  Customize your toolbar and display preferences
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Position Settings */}
              <Text style={styles.sectionTitle}>More Button Position</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    morePosition === 'left' && styles.toggleActive,
                  ]}
                  onPress={() => setMorePosition('left')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      morePosition === 'left' && styles.toggleTextActive,
                    ]}
                  >
                    Left
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    morePosition === 'right' && styles.toggleActive,
                  ]}
                  onPress={() => setMorePosition('right')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      morePosition === 'right' && styles.toggleTextActive,
                    ]}
                  >
                    Right
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.settingDescription}>
                Position of the More button in the toolbar
              </Text>

              {/* Banner Position - placed next to More Button Position */}
              <Text style={styles.sectionTitle}>Banner Position</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    bannerPosition === 'top' && styles.toggleActive,
                  ]}
                  onPress={() => handleBannerPositionChange('top')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      bannerPosition === 'top' && styles.toggleTextActive,
                    ]}
                  >
                    Top
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    bannerPosition === 'bottom' && styles.toggleActive,
                  ]}
                  onPress={() => handleBannerPositionChange('bottom')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      bannerPosition === 'bottom' && styles.toggleTextActive,
                    ]}
                  >
                    Bottom
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.settingDescription}>
                Position of the StackMap banner
              </Text>

              {/* Day Mode Section */}
              <Text style={styles.sectionTitle}>Day Mode</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    dayMode === 'today' && styles.toggleActive,
                  ]}
                  onPress={() => setDayMode('today')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      dayMode === 'today' && styles.toggleTextActive,
                    ]}
                  >
                    Today Only
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    dayMode === 'both' && styles.toggleActive,
                  ]}
                  onPress={() => setDayMode('both')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      dayMode === 'both' && styles.toggleTextActive,
                    ]}
                  >
                    Both Days
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.settingDescription}>
                Show just today or both today and tomorrow
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Button Order */}
              <Text style={styles.sectionTitle}>Button Order</Text>
              <Text style={styles.settingDescription}>
                {Platform.OS === 'web'
                  ? 'Use arrows to reorder'
                  : 'Drag to reorder'}
              </Text>

              {Platform.OS !== 'ios' ? (
                // Web and Android use arrow controls instead of drag-and-drop
                <View style={styles.buttonsList}>
                  {buttonOrder &&
                    buttonOrder.length &&
                    buttonOrder.map((buttonId, index) => {
                      const button = TOOLBAR_BUTTONS[buttonId];
                      const isInOverflow =
                        morePosition === 'left'
                          ? index < buttonOrder.length - visibleButtonCount // Overflow from beginning when More is on left
                          : index >= visibleButtonCount; // Overflow from end when More is on right

                      return (
                        <View key={buttonId} style={styles.webButtonItem}>
                          <View style={styles.buttonItemContent}>
                            <Icon
                              name={button.icon}
                              size={24}
                              color={theme.primary}
                              style={styles.buttonIcon}
                            />
                            <Text style={styles.buttonLabel}>
                              {button.label}
                            </Text>
                            <Text style={styles.buttonPosition}>
                              #
                              {morePosition === 'left'
                                ? buttonOrder.length - index
                                : index + 1}
                            </Text>
                            {isInOverflow && (
                              <View style={styles.overflowIndicator}>
                                <Text style={styles.overflowText}>
                                  OVERFLOW
                                </Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.webButtonControls}>
                            <TouchableOpacity
                              onPress={() => moveUp(index)}
                              disabled={index === 0}
                              style={[
                                styles.webControlButton,
                                index === 0 && styles.webControlButtonDisabled,
                              ]}
                            >
                              <Icon
                                name="arrow-upward"
                                size={20}
                                color={index === 0 ? '#ccc' : '#000'}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => moveDown(index)}
                              disabled={index === buttonOrder.length - 1}
                              style={[
                                styles.webControlButton,
                                index === buttonOrder.length - 1 &&
                                  styles.webControlButtonDisabled,
                              ]}
                            >
                              <Icon
                                name="arrow-downward"
                                size={20}
                                color={
                                  index === buttonOrder.length - 1
                                    ? '#ccc'
                                    : '#000'
                                }
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                </View>
              ) : null}

              {/* Divider */}
              <View style={styles.divider} />

              {/* Display Mode Section */}
              <Text style={styles.sectionTitle}>Activity Display</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    displayMode === 'none' && styles.toggleActive,
                  ]}
                  onPress={() => handleDisplayModeChange('none')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      displayMode === 'none' && styles.toggleTextActive,
                    ]}
                  >
                    None
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    displayMode === 'numbers' && styles.toggleActive,
                  ]}
                  onPress={() => handleDisplayModeChange('numbers')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      displayMode === 'numbers' && styles.toggleTextActive,
                    ]}
                  >
                    Numbers
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    displayMode === 'time' && styles.toggleActive,
                  ]}
                  onPress={() => handleDisplayModeChange('time')}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      displayMode === 'time' && styles.toggleTextActive,
                    ]}
                  >
                    Time
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.settingDescription}>
                Show activity order or time on cards
              </Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Celebrations Section */}
              <Text style={styles.sectionTitle}>Task Celebration</Text>
              <Text style={styles.settingDescription}>
                Animation when completing activities
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                removeClippedSubviews={false}
                style={styles.celebrationScrollView}
              >
                <View style={styles.celebrationOptions}>
                  {[
                    'none',
                    'random',
                    'rainbow',
                    'blue',
                    'orange',
                    'pink',
                    'purple',
                    'gold',
                    'green',
                  ].map(celebration => (
                    <TouchableOpacity
                      key={celebration}
                      style={[
                        styles.celebrationOption,
                        taskCelebration === celebration && [
                          styles.celebrationActive,
                          {
                            backgroundColor: theme.primary,
                            borderColor: theme.primary,
                          },
                        ],
                      ]}
                      onPress={() => handleTaskCelebrationChange(celebration)}
                    >
                      <Text
                        style={[
                          styles.celebrationText,
                          taskCelebration === celebration &&
                            styles.celebrationTextActive,
                        ]}
                      >
                        {celebration.charAt(0).toUpperCase() +
                          celebration.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.sectionTitle}>Routine Celebration</Text>
              <Text style={styles.settingDescription}>
                Animation when completing all activities
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                removeClippedSubviews={false}
                style={styles.celebrationScrollView}
              >
                <View style={styles.celebrationOptions}>
                  {[
                    'none',
                    'random',
                    'rainbow',
                    'blue',
                    'orange',
                    'pink',
                    'purple',
                    'gold',
                    'green',
                  ].map(celebration => (
                    <TouchableOpacity
                      key={celebration}
                      style={[
                        styles.celebrationOption,
                        routineCelebration === celebration && [
                          styles.celebrationActive,
                          {
                            backgroundColor: theme.primary,
                            borderColor: theme.primary,
                          },
                        ],
                      ]}
                      onPress={() =>
                        handleRoutineCelebrationChange(celebration)
                      }
                    >
                      <Text
                        style={[
                          styles.celebrationText,
                          routineCelebration === celebration &&
                            styles.celebrationTextActive,
                        ]}
                      >
                        {celebration.charAt(0).toUpperCase() +
                          celebration.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Reset Button */}
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
              >
                <Icon name="restore" size={20} color="#000" />
                <Text style={styles.resetButtonText}>Reset to Defaults</Text>
              </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
      onShow={() => {
        // Force layout update on Android to fix scrolling
        if (Platform.OS === 'android') {
          setTimeout(() => {
            setScrollKey(prev => prev + 1);
          }, 0);
        }
      }}
    >
      {Platform.OS === 'android' && (
        <StatusBar
          backgroundColor={theme.primary}
          barStyle="light-content"
          translucent={false}
        />
      )}
      <View style={[styles.modalContainer, { backgroundColor: theme.light }]}>
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: theme.primary,
              height: StatusBar.currentHeight || 24,
            }}
          />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View
            style={[styles.modalHeader, { backgroundColor: theme.primary }]}
          >
            <View style={styles.headerLeft}>
              <Icon
                name="settings"
                size={24}
                color="white"
                style={styles.headerIcon}
              />
              <Text style={styles.modalTitle}>Settings</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
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

        <View style={{ flex: 1, backgroundColor: theme.light }}>
          {Platform.OS === 'android' ? (
            <FlatList
              ref={scrollRef}
              key={scrollKey}
              data={[{ key: 'content' }]}
              renderItem={() => (
                <View style={[styles.modalContent, { flex: undefined }]}>
                  {renderContent()}
                </View>
              )}
              keyExtractor={item => item.key}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
            />
          ) : (
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{
                paddingBottom: 80,
              }}
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              removeClippedSubviews={false}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              bounces={true}
            >
              {renderContent()}
            </ScrollView>
          )}
        </View>
        {Platform.OS === 'android' && (
          <View
            style={{
              backgroundColor: theme.light,
              height: Math.max(insets.bottom, 20),
            }}
          />
        )}
      </View>
    </Modal>
  );
};

export default SettingsModal;
