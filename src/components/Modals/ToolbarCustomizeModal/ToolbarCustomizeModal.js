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

// Conditionally import DraggableFlatList for non-web platforms
const DraggableFlatList = Platform.OS !== 'web' 
  ? require('react-native-draggable-flatlist').default 
  : null;

const DEFAULT_TOOLBAR_ORDER = ['data', 'users', 'share', 'complete', 'plan', 'library', 'add'];

const TOOLBAR_BUTTONS = {
  add: { label: 'Add', icon: 'add-circle' },
  library: { label: 'Library', icon: 'collections-bookmark' },
  plan: { label: 'Plan', icon: 'event' },
  share: { label: 'Share', icon: 'share' },
  complete: { label: 'Complete', icon: 'event-available' },
  data: { label: 'Data', icon: 'cloud-sync' },
  users: { label: 'Users', icon: 'group' },
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
    const buttonPadding = SPACING.xs * 2;
    const availableWidth = screenWidth - containerPadding - buttonPadding;
    
    // Button width calculation (approximate)
    const minButtonWidth = 60; // Match EditModeToolbar
    const editModeTextWidth = 80; // Match EditModeToolbar
    const moreButtonWidth = minButtonWidth; // Match EditModeToolbar
    
    const usableWidth = availableWidth - editModeTextWidth - moreButtonWidth;
    const count = Math.floor(usableWidth / minButtonWidth);
    
    return Math.max(3, Math.min(count, buttonOrder.length));
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
      <View style={[styles.modalContainer, { backgroundColor: theme.primary }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <Text style={styles.modalTitle}>Sort Toolbar</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: theme.light }}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* More Button Position Section */}
            <View style={styles.morePositionSection}>
              <Text style={styles.sectionTitle}>More Button Position</Text>
              <Text style={styles.sectionDescription}>
                Choose which side the More button appears on
              </Text>
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

            {Platform.OS === 'web' ? (
              // Web doesn't support DraggableFlatList, show list with up/down controls
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
              <DraggableFlatList
                data={buttonOrder}
                renderItem={renderButton}
                keyExtractor={(item) => item}
                onDragEnd={({ data }) => setButtonOrder(data)}
                style={styles.buttonsList}
              />
            )}

            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Preview</Text>
              <Text style={styles.previewNote}>Note: Sort button always stays in overflow menu</Text>
              <View style={styles.previewToolbar}>
                {morePosition === 'left' && buttonOrder.length > visibleButtonCount && (
                  <View style={styles.previewOverflow}>
                    <Icon name="more-horiz" size={20} color={theme.primary} />
                  </View>
                )}
                {(morePosition === 'left' 
                  ? buttonOrder.slice(-visibleButtonCount) // Show last items when More is on left
                  : buttonOrder.slice(0, visibleButtonCount) // Show first items when More is on right
                ).map(renderPreviewButton)}
                {morePosition === 'right' && buttonOrder.length > visibleButtonCount && (
                  <View style={styles.previewOverflow}>
                    <Icon name="more-horiz" size={20} color={theme.primary} />
                  </View>
                )}
              </View>
            </View>

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
        <SafeAreaView style={{ backgroundColor: theme.light }} />
      </View>
    </Modal>
  );
};

export default ToolbarCustomizeModal;