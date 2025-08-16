import React, { useState, useEffect, useRef } from 'react';
import { Text } from '../Typography';
import {
  Modal,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated as RNAnimated,
  Dimensions,
  ScrollView,
  PanResponder,
  Easing,
  BackHandler,
  
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { isTablet, SPACING } from '../../constants';
// Import PagerView for both Android and iOS (not Web)
let PagerView = null;
if (Platform.OS !== 'web') {
  PagerView = require('react-native-pager-view').default;
}

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
  const swipeAnimation = useRef(new RNAnimated.Value(0)).current;
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [isScrolling, setIsScrolling] = useState(false);
  const gestureRef = useRef({ isActive: false });
  const pagerRef = useRef(null);
  
  // Use controlled activeTab if provided, otherwise use internal state
  const activeTab = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  
  // Store activeTab and tabs in refs to use in pan responder
  const activeTabRef = useRef(activeTab);
  const tabsRef = useRef(tabs);
  useEffect(() => {
    activeTabRef.current = activeTab;
    // Sync PagerView with active tab on mobile platforms
    if (Platform.OS !== 'web' && pagerRef.current) {
      pagerRef.current.setPage(activeTab);
    }
    // Reset swipe animation when tab changes on web
    if (Platform.OS === 'web') {
      swipeAnimation.setValue(0);
      gestureRef.current.isActive = false;
    }
  }, [activeTab]);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  // Create pan responder for horizontal swipe gestures (tab switching)
  const horizontalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Don't capture on initial touch - wait for movement
        return false;
      },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => {
        // Don't capture on initial touch for iOS
        return false;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Android: Be VERY aggressive about capturing horizontal movement
        if (Platform.OS === 'android') {
          const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          const hasMovedEnough = Math.abs(gestureState.dx) > 5; // Lower threshold
          return isHorizontalSwipe && hasMovedEnough;
        }
        // iOS: Standard behavior
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const hasMovedEnough = Math.abs(gestureState.dx) > 10;
        return isHorizontalSwipe && hasMovedEnough && !isScrolling;
      },
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
        // CRITICAL FOR ANDROID: Capture BEFORE ScrollView can!
        if (Platform.OS === 'android') {
          const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          const hasMovedEnough = Math.abs(gestureState.dx) > 5; // Very low threshold
          return isHorizontalSwipe && hasMovedEnough;
        }
        // iOS: Less aggressive
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2;
        const hasMovedEnough = Math.abs(gestureState.dx) > 15;
        return isHorizontalSwipe && hasMovedEnough;
      },
      onPanResponderGrant: () => {
        // Start gesture
        gestureRef.current.isActive = true;
        if (__DEV__ && Platform.OS === 'android') {}
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update swipe animation value with some resistance at edges
        const resistance = 0.5;
        let dx = gestureState.dx;
        
        // Add resistance when trying to swipe past edges
        if ((activeTabRef.current === 0 && dx > 0) || (activeTabRef.current === tabsRef.current.length - 1 && dx < 0)) {
          dx = dx * resistance;
        }
        
        swipeAnimation.setValue(dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Reset gesture state
        gestureRef.current.isActive = false;
        
        const swipeThreshold = Platform.OS === 'android' ? screenWidth * 0.1 : screenWidth * 0.2; // Lower threshold for Android
        const velocityThreshold = Platform.OS === 'android' ? 0.3 : 0.5; // Lower velocity threshold for Android
        
        // Check velocity for quick swipes
        const shouldSwipeLeft = gestureState.dx < -swipeThreshold || gestureState.vx < -velocityThreshold;
        const shouldSwipeRight = gestureState.dx > swipeThreshold || gestureState.vx > velocityThreshold;
        
        if (__DEV__ && Platform.OS === 'android') {}
        
        if (shouldSwipeRight && activeTabRef.current > 0) {
          // Swipe right - go to previous tab
          animateToTab(activeTabRef.current - 1, true); // Pass true for fromSwipe
          // Reset gesture state after animation on Android
          if (Platform.OS === 'android') {
            setTimeout(() => {
              swipeAnimation.setValue(0);
              gestureRef.current.isActive = false;
            }, 200); // Match the faster animation duration
          }
        } else if (shouldSwipeLeft && activeTabRef.current < tabsRef.current.length - 1) {
          // Swipe left - go to next tab
          animateToTab(activeTabRef.current + 1, true); // Pass true for fromSwipe
          // Reset gesture state after animation on Android
          if (Platform.OS === 'android') {
            setTimeout(() => {
              swipeAnimation.setValue(0);
              gestureRef.current.isActive = false;
            }, 200); // Match the faster animation duration
          }
        } else {
          // Return to original position
          RNAnimated.timing(swipeAnimation, {
            toValue: 0,
            duration: 250,
            easing: Easing.bezier(0.2, 0, 0, 1),
            useNativeDriver: true,
          }).start(() => {
            // Reset gesture state after animation completes
            if (Platform.OS === 'android') {
              gestureRef.current.isActive = false;
            }
          });
        }
      },
      onPanResponderTerminate: () => {
        // Handle gesture interruption
        gestureRef.current.isActive = false;
        RNAnimated.timing(swipeAnimation, {
          toValue: 0,
          duration: 250,
          easing: Easing.bezier(0.2, 0, 0, 1),
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
  
  const animateToTab = (index, fromSwipe = false) => {
    if (index === activeTabRef.current) return;
    
    // Direction: negative when going to next tab (content slides left), positive when going to previous tab (content slides right)
    const direction = index > activeTabRef.current ? -1 : 1;
    
    // If not from swipe (e.g., tab press), use the original animation
    if (!fromSwipe) {
      swipeAnimation.setValue(0);
      // Material Design 3 shared axis transition - start from opposite direction
      swipeAnimation.setValue(-direction * screenWidth * 0.35);
    }
    // If from swipe, continue from current position for smooth transition
    
    // Defer the state update to avoid React Native's batching warning
    // This prevents state updates during touch event processing
    setTimeout(() => {
      handleTabPress(index);
      // Force a re-render on Android to reset gesture handlers
      if (Platform.OS === 'android' && !fromSwipe) {
        swipeAnimation.setValue(0);
      }
    }, 0);
    
    // Animate to the new tab position
    RNAnimated.timing(swipeAnimation, {
      toValue: 0,
      duration: fromSwipe ? 200 : 300, // Faster when continuing from swipe
      easing: Easing.bezier(0.2, 0, 0, 1), // MD3 emphasized easing
      useNativeDriver: true,
    }).start();
  };

  const handleTabPress = (index) => {
    if (index !== activeTabRef.current) {
      if (controlledActiveTab === undefined) {
        setInternalActiveTab(index);
      }
      if (onTabChange) {
        onTabChange(index);
      }
      // Control the PagerView on mobile platforms
      if (Platform.OS !== 'web' && pagerRef.current) {
        pagerRef.current.setPage(index);
      }
    }
  };
  
  // Keyboard navigation for web and back button handling for Android
  useEffect(() => {
    if (!visible) return;
    
    // Web keyboard navigation
    if (Platform.OS === 'web') {
      const handleKeyPress = (e) => {
        if (e.key === 'ArrowLeft' && activeTabRef.current > 0) {
          animateToTab(activeTabRef.current - 1);
        } else if (e.key === 'ArrowRight' && activeTabRef.current < tabsRef.current.length - 1) {
          animateToTab(activeTabRef.current + 1);
        } else if (e.key === 'Escape') {
          onClose();
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
    
    // Android back button handling
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        onClose();
        return true; // Prevent default back behavior
      });
      
      return () => backHandler.remove();
    }
  }, [visible, activeTab, tabs.length, onClose]);
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View 
        style={[
          styles.modalContainer, 
          { 
            backgroundColor: theme.light
          }
        ]}
      >
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
                {/* Modern rounded rectangle indicator behind content */}
                {activeTab === index && (
                  <View style={{
                    position: 'absolute',
                    top: Platform.OS === 'web' ? 4 : 3,
                    bottom: Platform.OS === 'web' ? 4 : 3,
                    left: Platform.OS === 'web' ? 4 : 2,
                    right: Platform.OS === 'web' ? 4 : 2,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Platform.OS === 'web' ? 4 : 3 }}>
                  {tab.icon && (Platform.OS === 'web' || isTablet() || activeTab === index) && (
                    <Icon 
                      name={tab.icon} 
                      size={Platform.OS === 'web' || isTablet() ? 18 : 16} 
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
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
        
        {/* Use native PagerView for Android and iOS, fallback to PanResponder for Web only */}
        {Platform.OS !== 'web' ? (
          <PagerView 
            style={{ flex: 1, backgroundColor: theme.light }}
            initialPage={activeTab}
            onPageSelected={(e) => {
              const newIndex = e.nativeEvent.position;
              if (newIndex !== activeTabRef.current) {
                if (controlledActiveTab === undefined) {
                  setInternalActiveTab(newIndex);
                }
                if (onTabChange) {
                  onTabChange(newIndex);
                }
              }
            }}
            ref={pagerRef}
          >
            {React.Children.map(children, (child, index) => (
              <View key={index} style={{ flex: 1 }}>
                {child}
              </View>
            ))}
          </PagerView>
        ) : (
          <View 
            style={{ flex: 1, backgroundColor: theme.light }}
            {...horizontalPanResponder.panHandlers}
          >
            <RNAnimated.View 
              style={[
                { flex: 1 },
                {
                  transform: [
                    {
                      translateX: swipeAnimation.interpolate({
                        inputRange: [-screenWidth, 0, screenWidth],
                        outputRange: [-screenWidth * 0.35, 0, screenWidth * 0.35],
                        extrapolate: 'clamp',
                      })
                    }
                  ]
                }
              ]}
            >
              {React.Children.map(children, (child, index) => 
                React.cloneElement(child, { 
                  onScrollStateChange: (scrolling) => {
                    // Only update if not in middle of gesture
                    if (!gestureRef.current.isActive) {
                      setIsScrolling(scrolling);
                    }
                  }
                })
              )}
            </RNAnimated.View>
          </View>
        )}
        
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.light, height: Math.max(insets.bottom, 20) }} />
        )}
      </View>
    </Modal>
  );
};

// Tab Content Wrapper Component
export const TabContent = ({ children, isActive, modalVisible, onScrollStateChange }) => {
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
  
  // Clone children with scroll tracking for horizontal swipe gesture coordination
  const enhancedChildren = React.Children.map(children, child => {
    // Check if child is a ScrollView (imported from react-native)
    if (child?.type === ScrollView || child?.type?.displayName === 'ScrollView' || child?.props?.scrollable) {
      return React.cloneElement(child, {
        onScrollBeginDrag: (event) => {
          onScrollStateChange?.(true);
          child.props.onScrollBeginDrag?.(event);
        },
        onScrollEndDrag: (event) => {
          setTimeout(() => {
            onScrollStateChange?.(false);
          }, 100);
          child.props.onScrollEndDrag?.(event);
        },
        onMomentumScrollEnd: (event) => {
          onScrollStateChange?.(false);
          child.props.onMomentumScrollEnd?.(event);
        },
        scrollEventThrottle: 16
      });
    }
    return child;
  });
  
  return (
    <View style={[styles.tabContent, { display: isActive ? 'flex' : 'none' }]}>
      {enhancedChildren}
    </View>
  );
};

export default TabbedModal;