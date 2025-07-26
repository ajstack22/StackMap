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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { SPACING } from '../../../constants';

// Conditionally import DraggableFlatList for non-web platforms
const DraggableFlatList = Platform.OS !== 'web' 
  ? require('react-native-draggable-flatlist').default 
  : null;

const DEFAULT_TOOLBAR_ORDER = ['add', 'library', 'plan', 'share', 'complete', 'data', 'users', 'settings'];

const TOOLBAR_BUTTONS = {
  add: { label: 'Add', icon: 'add-circle' },
  library: { label: 'Library', icon: 'collections-bookmark' },
  plan: { label: 'Plan', icon: 'event' },
  share: { label: 'Share', icon: 'share' },
  complete: { label: 'Complete', icon: 'event-available' },
  data: { label: 'Data', icon: 'cloud-sync' },
  users: { label: 'Users', icon: 'group' },
  settings: { label: 'Settings', icon: 'settings' },
};

const ToolbarCustomizeModal = ({
  visible,
  onClose,
  theme,
  currentOrder,
  onSaveOrder,
  showToast,
}) => {
  const insets = useSafeAreaInsets();
  const [buttonOrder, setButtonOrder] = useState(currentOrder || DEFAULT_TOOLBAR_ORDER);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  // Calculate visible button count based on screen width
  const calculateVisibleButtonCount = () => {
    const containerPadding = 32; // Approximate container padding
    const buttonWidth = 70; // Approximate button width
    const editModeTextWidth = 100; // Space for "Edit Mode" text
    const moreButtonWidth = 70; // Space for "More" button
    
    const availableWidth = screenWidth - containerPadding - editModeTextWidth - moreButtonWidth;
    const count = Math.floor(availableWidth / buttonWidth);
    
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
    if (currentOrder) {
      setButtonOrder(currentOrder);
    }
  }, [currentOrder]);

  const handleSave = () => {
    onSaveOrder(buttonOrder);
    showToast({ message: 'Toolbar order saved!' });
    onClose();
  };

  const handleReset = () => {
    setButtonOrder(DEFAULT_TOOLBAR_ORDER);
  };

  const renderButton = ({ item, drag, isActive }) => {
    const index = buttonOrder.indexOf(item);
    const isInOverflow = index >= visibleButtonCount;
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
        <Icon name="drag-handle" size={24} color="#999" style={styles.dragHandle} />
        <Icon name={button.icon} size={24} color={theme.primary} style={styles.buttonIcon} />
        <Text style={styles.buttonLabel}>{button.label}</Text>
        <Text style={styles.buttonPosition}>#{index + 1}</Text>
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
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Customize Toolbar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>
              Drag buttons to reorder them. The first {visibleButtonCount} buttons will be visible, 
              the rest will be in the overflow menu.
            </Text>

            {Platform.OS === 'web' ? (
              // Web doesn't support DraggableFlatList, show a simple list
              <View style={styles.buttonsList}>
                {buttonOrder.map((buttonId) => (
                  <View key={buttonId}>
                    {renderButton({ item: buttonId, drag: () => {}, isActive: false })}
                  </View>
                ))}
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
              <View style={styles.previewToolbar}>
                {buttonOrder.slice(0, visibleButtonCount).map(renderPreviewButton)}
                {buttonOrder.length > visibleButtonCount && (
                  <View style={styles.previewOverflow}>
                    <Icon name="more-vert" size={20} color={theme.primary} />
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Icon name="restore" size={20} color="#666" />
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.lg }]}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Order</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default ToolbarCustomizeModal;