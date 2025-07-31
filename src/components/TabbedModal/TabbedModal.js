import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { isTablet, SPACING } from '../../constants';

const TabbedModal = ({
  visible,
  onClose,
  theme,
  title,
  icon,
  tabs,
  defaultTab = 0,
  activeTab: controlledActiveTab,
  onTabChange,
  children,
  headerRight,
}) => {
  const insets = useSafeAreaInsets();
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab);
  const swipeAnimation = useRef(new Animated.Value(0)).current;
  const tabTransition = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = Dimensions.get('window');
  
  // Use controlled activeTab if provided, otherwise use internal state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  
  // Create pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Respond to horizontal swipes greater than 5 pixels
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const hasMovedEnough = Math.abs(gestureState.dx) > 5;
        return isHorizontalSwipe && hasMovedEnough;
      },
      onPanResponderGrant: () => {
        // Start gesture
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update swipe animation value with some resistance at edges
        const resistance = 0.5;
        let dx = gestureState.dx;
        
        // Add resistance when trying to swipe past edges
        if ((activeTab === 0 && dx > 0) || (activeTab === tabs.length - 1 && dx < 0)) {
          dx = dx * resistance;
        }
        
        swipeAnimation.setValue(dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const swipeThreshold = screenWidth * 0.25; // 25% of screen width
        const velocityThreshold = 0.3;
        
        // Check velocity for quick swipes
        const shouldSwipeLeft = gestureState.dx < -swipeThreshold || gestureState.vx < -velocityThreshold;
        const shouldSwipeRight = gestureState.dx > swipeThreshold || gestureState.vx > velocityThreshold;
        
        if (shouldSwipeRight && activeTab > 0) {
          // Swipe right - go to previous tab
          animateToTab(activeTab - 1);
        } else if (shouldSwipeLeft && activeTab < tabs.length - 1) {
          // Swipe left - go to next tab
          animateToTab(activeTab + 1);
        } else {
          // Return to original position
          Animated.spring(swipeAnimation, {
            toValue: 0,
            tension: 40,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Handle gesture interruption
        Animated.spring(swipeAnimation, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;
  
  // Reset to default tab when modal opens (only if not controlled)
  useEffect(() => {
    if (visible && controlledActiveTab === undefined) {
      setInternalActiveTab(defaultTab);
    }
  }, [visible, defaultTab, controlledActiveTab]);
  
  const animateToTab = (index) => {
    const direction = index > activeTab ? -1 : 1;
    
    // Animate swipe to full screen width in the direction of the new tab
    Animated.parallel([
      Animated.timing(swipeAnimation, {
        toValue: direction * screenWidth,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(tabTransition, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update the active tab
      handleTabPress(index);
      
      // Reset animations for next transition
      swipeAnimation.setValue(direction * -screenWidth);
      
      Animated.parallel([
        Animated.spring(swipeAnimation, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(tabTransition, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleTabPress = (index) => {
    if (index !== activeTab) {
      if (controlledActiveTab === undefined) {
        setInternalActiveTab(index);
      }
      if (onTabChange) {
        onTabChange(index);
      }
    }
  };
  
  // Keyboard navigation
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && activeTab > 0) {
        animateToTab(activeTab - 1);
      } else if (e.key === 'ArrowRight' && activeTab < tabs.length - 1) {
        animateToTab(activeTab + 1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [visible, activeTab, tabs.length, onClose]);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.light }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary, width: '100%' }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <View style={styles.headerLeft}>
              {icon && (
                <Icon name={icon} size={24} color="white" style={styles.headerIcon} />
              )}
              <Text style={styles.modalTitle}>{title}</Text>
            </View>
            <View style={styles.headerRight}>
              {headerRight}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
          </View>
          
          <View style={[styles.tabContainer, { 
            backgroundColor: theme.primary
          }]}>
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={tab.key || index}
                style={styles.tab}
                onPress={() => animateToTab(index)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === index }}
                accessibilityLabel={`${tab.label} tab`}
              >
                <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  {/* Modern pill/blob indicator behind content */}
                  {activeTab === index && (
                    <View style={{
                      position: 'absolute',
                      top: Platform.OS === 'web' ? 6 : 4,
                      bottom: Platform.OS === 'web' ? 6 : 4,
                      left: Platform.OS === 'web' ? 8 : 4,
                      right: Platform.OS === 'web' ? 8 : 4,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 20,
                      opacity: 1,
                      ...(Platform.OS === 'ios' && {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08,
                        shadowRadius: 3,
                      }),
                      ...(Platform.OS === 'android' && {
                        elevation: 2,
                      }),
                      ...(Platform.OS === 'web' && {
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      }),
                    }} />
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {tab.icon && (Platform.OS === 'web' || isTablet() || tabs.length <= 2) && (
                      <Icon 
                        name={tab.icon} 
                        size={Platform.OS === 'web' || isTablet() ? 20 : 18} 
                        color={activeTab === index ? theme.primary : 'rgba(255,255,255,0.7)'} 
                      />
                    )}
                    <Text 
                      style={[
                        styles.tabText,
                        activeTab === index && styles.tabTextActive,
                        activeTab === index && { color: theme.primary }
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={Platform.OS !== 'web' && !isTablet()}
                      minimumFontScale={0.7}
                    >
                      {tab.label}
                    </Text>
                    {tab.badge && (
                      <View style={[styles.badge, { 
                        backgroundColor: activeTab === index ? theme.primary : 'rgba(255,255,255,0.7)'
                      }]}>
                        <Text style={[styles.badgeText, { 
                          color: '#FFFFFF'
                        }]}>{tab.badge}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: theme.light }}>
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                transform: [
                  {
                    translateX: swipeAnimation.interpolate({
                      inputRange: [-screenWidth, 0, screenWidth],
                      outputRange: [-screenWidth * 0.3, 0, screenWidth * 0.3],
                      extrapolate: 'clamp',
                    })
                  }
                ],
                opacity: tabTransition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.8],
                })
              }
            ]}
            {...panResponder.panHandlers}
          >
            {children}
          </Animated.View>
        </View>
        
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.light, height: Math.max(insets.bottom, 20) }} />
        )}
      </View>
    </Modal>
  );
};

// Tab Content Wrapper Component
export const TabContent = ({ children, isActive, modalVisible }) => {
  const [hasBeenActive, setHasBeenActive] = useState(false);
  
  // Reset hasBeenActive when modal closes
  useEffect(() => {
    if (!modalVisible) {
      setHasBeenActive(false);
    }
  }, [modalVisible]);
  
  useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);
  
  // Only render if currently active or has been active before (to preserve state)
  if (!isActive && !hasBeenActive) {
    return null;
  }
  
  return (
    <View style={[styles.tabContent, { display: isActive ? 'flex' : 'none' }]}>
      {children}
    </View>
  );
};

export default TabbedModal;