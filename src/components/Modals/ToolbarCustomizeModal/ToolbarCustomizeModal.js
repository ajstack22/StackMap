import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { SPACING } from '../../../constants';

// Lazy load these to avoid module-level Platform.OS access
let DraggableFlatList = null;
let GestureHandlerRootView = null;

const loadNativeModules = () => {
  if (Platform.OS !== 'web') {
    if (!DraggableFlatList) {
      DraggableFlatList = require('react-native-draggable-flatlist').default;
    }
    if (!GestureHandlerRootView) {
      GestureHandlerRootView = require('react-native-gesture-handler').GestureHandlerRootView;
    }
  }
};

const DEFAULT_TOOLBAR_ORDER = ['data', 'access', 'day', 'activities'];

const TOOLBAR_BUTTONS = {
  activities: { label: 'Activities', icon: 'add-circle' },
  day: { label: 'Day', icon: 'event' },
  access: { label: 'Access', icon: 'security' },
  data: { label: 'Data', icon: 'source' },
};

const ToolbarCustomizeModal = ({
  visible,
  onClose,
  theme,
  currentOrder,
  onSaveOrder,
  moreButtonPosition = 'right',
  onSaveMorePosition,
  showToast,
}) => {
  // Load native modules if needed
  loadNativeModules();
  
  const insets = useSafeAreaInsets();
  const [buttonOrder, setButtonOrder] = useState(() => {
    if (currentOrder && currentOrder.length > 0) {
      const filtered = currentOrder.filter(id => id !== 'settings' && id !== 'more' && TOOLBAR_BUTTONS[id]);
      return filtered.length > 0 ? filtered : DEFAULT_TOOLBAR_ORDER;
    }
    return DEFAULT_TOOLBAR_ORDER;
  });
  const [morePosition, setMorePosition] = useState(moreButtonPosition);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  // Calculate visible button count based on screen width
  const calculateVisibleButtonCount = () => {
    const containerPadding = 32 * 2; // Match EditModeToolbar's calculation
    const availableWidth = screenWidth - containerPadding;
    
    // Button width calculation - more accurate based on actual button content
    const buttonWidth = Platform.OS === 'web' ? 50 : 50; // Actual button width is smaller
    const buttonGap = Platform.OS === 'web' ? 8 : 10; // Gap between buttons from styles
    const editModeTextWidth = Platform.OS === 'web' ? 65 : 65; // More accurate text width
    const moreButtonWidth = buttonWidth; // Same as regular buttons
    
    // Reserve space for "Edit Mode" text and "More" button
    const reservedWidth = editModeTextWidth + moreButtonWidth + (buttonGap * 2);
    const usableWidth = availableWidth - reservedWidth;
    
    // Calculate how many buttons fit (including gaps)
    const maxButtons = Math.floor((usableWidth + buttonGap) / (buttonWidth + buttonGap));
    
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
    
    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (currentOrder && currentOrder.length > 0) {
      // Filter out 'settings' and 'more' if they exist in saved order
      const filteredOrder = currentOrder.filter(id => id !== 'settings' && id !== 'more' && TOOLBAR_BUTTONS[id]);
      setButtonOrder(filteredOrder.length > 0 ? filteredOrder : DEFAULT_TOOLBAR_ORDER);
    } else {
      // Reset to default if no custom order
      setButtonOrder(DEFAULT_TOOLBAR_ORDER);
    }
  }, [currentOrder]);

  const handleSave = () => {
    // Ensure we're saving a valid array
    const orderToSave = Array.isArray(buttonOrder) && buttonOrder.length > 0 
      ? [...buttonOrder] // Create a new array reference
      : DEFAULT_TOOLBAR_ORDER;
    
    onSaveOrder(orderToSave);
    
    if (onSaveMorePosition) {
      onSaveMorePosition(morePosition);
    }
    showToast({ message: 'Toolbar settings saved!' });
    onClose();
  };

  const handleReset = () => {
    setButtonOrder(DEFAULT_TOOLBAR_ORDER);
    setMorePosition('left');
  };

  const moveButton = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const newOrder = [...buttonOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setButtonOrder(newOrder);
  };

  const moveUp = (index) => {
    if (index > 0) {
      moveButton(index, index - 1);
    }
  };

  const moveDown = (index) => {
    if (index < buttonOrder.length - 1) {
      moveButton(index, index + 1);
    }
  };

  const renderButton = ({ item, drag, isActive }) => {
    const index = buttonOrder.indexOf(item);
    const isInOverflow = morePosition === 'left' 
      ? index < (buttonOrder.length - visibleButtonCount) // Overflow from beginning when More is on left
      : index >= visibleButtonCount; // Overflow from end when More is on right
    const button = TOOLBAR_BUTTONS[item];

    return (
      <TouchableOpacity
        style={[
          styles.buttonItem,
          isActive && styles.buttonItemDragging
        ]}
        onLongPress={drag}
        disabled={isActive}
      >
        <Icon name="drag-handle" size={24} color="#000" style={styles.dragHandle} />
        <Icon name={button.icon} size={24} color={theme.primary} style={styles.buttonIcon} />
        <Text style={styles.buttonLabel}>{button.label}</Text>
        <Text style={styles.buttonPosition}>#{morePosition === 'left' ? buttonOrder.length - index : index + 1}</Text>
        {isInOverflow && (
          <View style={styles.overflowIndicator}>
            <Text style={styles.overflowText}>OVERFLOW</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderPreviewButton = (buttonId) => {
    const button = TOOLBAR_BUTTONS[buttonId];
    if (!button) return null;
    return (
      <View key={buttonId} style={styles.previewButton}>
        <Icon name={button.icon} size={20} color={theme.primary} style={styles.previewButtonIcon} />
        <Text style={styles.previewButtonLabel}>{button.label}</Text>
      </View>
    );
  };

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
      <View style={[styles.modalContainer, { backgroundColor: theme.light }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <View style={styles.headerLeft}>
              <Icon name="sort" size={24} color="white" style={styles.headerIcon} />
              <Text style={styles.modalTitle}>Sort</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="close" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: theme.light }}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* More Button Position Section */}
            <View style={styles.morePositionSection}>
              <Text style={styles.sectionTitle}>More Button Position</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggle, morePosition === 'left' && styles.toggleActive]}
                  onPress={() => setMorePosition('left')}
                >
                  <Text style={[styles.toggleText, morePosition === 'left' && styles.toggleTextActive]}>
                    Left
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggle, morePosition === 'right' && styles.toggleActive]}
                  onPress={() => setMorePosition('right')}
                >
                  <Text style={[styles.toggleText, morePosition === 'right' && styles.toggleTextActive]}>
                    Right
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.description}>
              {Platform.OS === 'web' 
                ? morePosition === 'left'
                  ? `Use the arrows to reorder buttons. The last ${visibleButtonCount} buttons will be visible, the first ones will be in the overflow menu (plus the Sort button).`
                  : `Use the arrows to reorder buttons. The first ${visibleButtonCount} buttons will be visible, the rest will be in the overflow menu (plus the Sort button).`
                : morePosition === 'left'
                  ? `Drag buttons to reorder them. The last ${visibleButtonCount} buttons will be visible, the first ones will be in the overflow menu (plus the Sort button).`
                  : `Drag buttons to reorder them. The first ${visibleButtonCount} buttons will be visible, the rest will be in the overflow menu (plus the Sort button).`
              }
            </Text>

            {Platform.OS !== 'ios' ? (
              // Web and Android use arrow controls instead of drag-and-drop
              <View style={styles.buttonsList}>
                {buttonOrder.map((buttonId, index) => {
                  const button = TOOLBAR_BUTTONS[buttonId];
                  const isInOverflow = morePosition === 'left' 
                    ? index < (buttonOrder.length - visibleButtonCount) // Overflow from beginning when More is on left
                    : index >= visibleButtonCount; // Overflow from end when More is on right
                  
                  return (
                    <View key={buttonId} style={styles.webButtonItem}>
                      <View style={styles.buttonItemContent}>
                        <Icon name={button.icon} size={24} color={theme.primary} style={styles.buttonIcon} />
                        <Text style={styles.buttonLabel}>{button.label}</Text>
                        <Text style={styles.buttonPosition}>#{morePosition === 'left' ? buttonOrder.length - index : index + 1}</Text>
                        {isInOverflow && (
                          <View style={styles.overflowIndicator}>
                            <Text style={styles.overflowText}>OVERFLOW</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.webButtonControls}>
                        <TouchableOpacity
                          onPress={() => moveUp(index)}
                          disabled={index === 0}
                          style={[styles.webControlButton, index === 0 && styles.webControlButtonDisabled]}
                        >
                          <Icon name="arrow-upward" size={20} color={index === 0 ? '#ccc' : '#000'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => moveDown(index)}
                          disabled={index === buttonOrder.length - 1}
                          style={[styles.webControlButton, index === buttonOrder.length - 1 && styles.webControlButtonDisabled]}
                        >
                          <Icon name="arrow-downward" size={20} color={index === buttonOrder.length - 1 ? '#ccc' : '#000'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <GestureHandlerRootView style={{ flex: 1 }}>
                <DraggableFlatList
                  data={buttonOrder}
                  renderItem={renderButton}
                  keyExtractor={(item) => item}
                  onDragEnd={({ data }) => setButtonOrder(data)}
                  style={styles.buttonsList}
                />
              </GestureHandlerRootView>
            )}

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Icon name="restore" size={20} color="#000" />
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Order</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.light, height: Math.max(insets.bottom, 20) }} />
        )}
      </View>
    </Modal>
  );
};

export default ToolbarCustomizeModal;