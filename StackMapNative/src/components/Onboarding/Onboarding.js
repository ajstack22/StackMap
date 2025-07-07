import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
  StatusBar,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  isTablet,
  COMMON_EMOJIS,
  PIN_LENGTH,
  THEMES,
} from '../../constants';
import Logo from '../Logo/Logo';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Emoji options for user selection
const USER_EMOJI_OPTIONS = [
  '😊', '😎', '🤓', '🧑', '👤', '🌟', '✨', '🎯',
  '🚀', '💫', '🌈', '🦄', '🐶', '🐱', '🦊', '🐸',
  '🦋', '🌸', '🌺', '🌼', '🍀', '🌿', '🎨', '🎭',
  '🎪', '🎯', '🏆', '💎', '🔥', '⚡', '🌙', '☀️'
];

// Animated dot component that responds to scroll position
const ScrollAwareDot = ({ index, scrollX, screenWidth, totalSteps }) => {
  const inputRange = [
    (index - 1) * screenWidth,
    index * screenWidth,
    (index + 1) * screenWidth,
  ];
  
  const scaleX = scrollX.interpolate({
    inputRange,
    outputRange: [1, 2.5, 1],
    extrapolate: 'clamp',
  });
  
  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });
  
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          opacity,
          transform: [{ scaleX }],
          backgroundColor: THEMES.stackBlue.primary,
        },
      ]}
    />
  );
};

const Onboarding = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [users, setUsers] = useState([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isAddingAnotherUser, setIsAddingAnotherUser] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({ width: screenWidth, height: screenHeight });
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const insets = useSafeAreaInsets();
  const nameInputRef = useRef(null);
  const pinInputRef = useRef(null);
  const confirmPinInputRef = useRef(null);

  // Update screen dimensions on orientation change
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      setScreenDimensions({ width, height });
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  // Calculate optimal emoji grid columns based on screen width
  const calculateEmojiColumns = useCallback(() => {
    const padding = isTablet() ? SPACING.xxl * 1.5 : SPACING.xl;
    const availableWidth = screenDimensions.width - (padding * 2);
    const maxContentWidth = isTablet() ? 560 : 400;
    const contentWidth = Math.min(availableWidth, maxContentWidth);
    
    // Calculate item size with margins
    const itemSize = isTablet() ? 70 : 55;
    const itemMargin = SPACING.xs;
    const totalItemWidth = itemSize + (itemMargin * 2);
    
    // Calculate how many columns can fit
    const possibleColumns = Math.floor(contentWidth / totalItemWidth);
    
    // Limit columns to reasonable numbers and ensure all items fit without scrolling
    const columns = Math.min(possibleColumns, isTablet() ? 8 : 6);
    
    // Calculate grid height to prevent scrolling
    const rows = Math.ceil(USER_EMOJI_OPTIONS.length / columns);
    const gridHeight = rows * totalItemWidth;
    
    return {
      columns,
      itemSize,
      itemMargin,
      gridHeight,
      contentWidth
    };
  }, [screenDimensions.width]);

  // Dynamic steps based on state
  const getOnboardingSteps = () => {
    const infoSteps = [
      {
        id: 'privacy-first',
        title: 'Your Data, Your Control',
        description: 'StackMap is different - built on trust and privacy',
        icon: '🔒',
        type: 'info',
        bullets: [
          '100% offline - no accounts, no cloud, no tracking',
          'Your data never leaves your device',
          'Export anytime - you own everything',
          'Open source & free forever - no ads, no catches',
        ],
      },
      {
        id: 'designed-for-you',
        title: 'Designed With You in Mind',
        description: 'Created by and for ADHD & autistic families',
        icon: '🧠',
        type: 'info',
        bullets: [
          'Visual-first design reduces cognitive load',
          'Flexible routines, not rigid schedules',
          'Helps with time blindness & executive function',
          'Toggle features that feel overwhelming',
        ],
      },
      {
        id: 'simple-powerful',
        title: 'Everything You Need',
        description: 'Thoughtfully designed features that just work',
        icon: '✨',
        type: 'info',
        bullets: [
          'Emoji-based activities - minimal reading required',
          'Pin important daily tasks',
          'Visual progress tracking',
          'Customizable sensory settings (sounds, haptics)',
        ],
        demo: {
          type: 'features',
          items: ['😊', '📌', '📊', '🔊'],
        },
      },
    ];

    const setupSteps = [
      {
        id: 'name',
        title: users.length === 0 ? 'What\'s the first user\'s name?' : `What\'s user ${users.length + 1}\'s name?`,
        subtitle: 'You can add up to 3 users now (more can be added later)',
        icon: '👤',
        type: 'name-input',
      },
      {
        id: 'emoji',
        title: 'Make it Theirs',
        subtitle: `Pick an emoji for ${userName || 'this user'}`,
        icon: '✨',
        type: 'emoji-select',
      },
    ];

    // Only show PIN step for first user
    if (users.length === 0 && !isAddingAnotherUser) {
      setupSteps.push({
        id: 'pin',
        title: 'Would you like to protect Edit Mode with a PIN?',
        subtitle: 'This helps prevent accidental changes (one PIN for all users)',
        icon: '🔐',
        type: 'pin-input',
      });
    }

    // Add review step if we have users
    if (users.length > 0 || (currentStep > infoSteps.length + 2)) {
      setupSteps.push({
        id: 'review',
        title: users.length === 0 ? 'No users added yet' : 'Setup Complete!',
        subtitle: users.length === 0 ? 'Add at least one user to continue' : 
                  users.length < 3 ? 'Add another user or finish setup' : 
                  'You can add more users later in Settings',
        icon: users.length === 0 ? '👥' : '✅',
        type: 'review',
      });
    }

    return [...infoSteps, ...setupSteps];
  };

  const ONBOARDING_STEPS = getOnboardingSteps();
  
  const scrollToStep = useCallback((step) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: step * screenDimensions.width,
        animated: true,
      });
    }
  }, [screenDimensions.width]);

  const handleNext = () => {
    const currentStepData = ONBOARDING_STEPS[currentStep];
    
    // Handle user creation after emoji selection
    if (currentStepData.type === 'emoji-select' && userName.trim()) {
      const newUser = {
        name: userName.trim(),
        emoji: selectedEmoji,
      };
      setUsers([...users, newUser]);
      
      // Reset for potential next user
      setUserName('');
      setSelectedEmoji('😊');
      
      // If adding another user, skip to review
      if (isAddingAnotherUser) {
        setIsAddingAnotherUser(false);
        // Jump to review step
        const reviewIndex = ONBOARDING_STEPS.findIndex(step => step.id === 'review');
        if (reviewIndex !== -1) {
          setCurrentStep(reviewIndex);
          scrollViewRef.current?.scrollTo({
            x: screenWidth * reviewIndex,
            animated: true,
          });
          return;
        }
      }
    }

    // Validate name input
    if (currentStepData.type === 'name-input' && !userName.trim()) {
      return;
    }

    // Validate PIN input
    if (currentStepData.type === 'pin-input' && pin) {
      if (pin !== confirmPin) {
        setPinError('PINs do not match');
        return;
      }
      if (pin.length !== PIN_LENGTH) {
        setPinError(`PIN must be ${PIN_LENGTH} digits`);
        return;
      }
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      
      // Update scroll and state together
      setCurrentStep(nextStep);
      scrollToStep(nextStep);
      
      // Focus management
      const nextStepData = ONBOARDING_STEPS[nextStep];
      if (nextStepData.type === 'name-input') {
        setTimeout(() => nameInputRef.current?.focus(), 400);
      } else if (nextStepData.type === 'pin-input') {
        setTimeout(() => pinInputRef.current?.focus(), 400);
      }
    } else {
      // Complete onboarding
      handleComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollToStep(prevStep);
    }
  };

  const handleComplete = () => {
    console.log('Onboarding handleComplete - users array:', users);
    console.log('Onboarding handleComplete - pin:', pin);
    
    if (users.length > 0) {
      const dataToPass = {
        users: users,
        pin: pin || null,
      };
      console.log('Onboarding handleComplete calling onComplete with:', JSON.stringify(dataToPass, null, 2));
      onComplete(dataToPass);
    } else {
      console.warn('Onboarding handleComplete: No users to pass');
      // For debugging, let's see the current state
      console.log('Current userName:', userName);
      console.log('Current selectedEmoji:', selectedEmoji);
      console.log('Current step:', currentStep);
    }
  };

  const handleAddAnotherUser = () => {
    setIsAddingAnotherUser(true);
    setUserName('');
    setSelectedEmoji('😊');
    
    // Find the name input step
    const nameStepIndex = ONBOARDING_STEPS.findIndex(step => step.type === 'name-input');
    if (nameStepIndex !== -1) {
      setCurrentStep(nameStepIndex);
      scrollViewRef.current?.scrollTo({
        x: screenWidth * nameStepIndex,
        animated: true,
      });
      setTimeout(() => nameInputRef.current?.focus(), 300);
    }
  };

  const handleSkipPin = () => {
    // Move to next step (review)
    handleNext();
  };
  
  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const step = Math.round(offsetX / screenWidth);
    if (step !== currentStep && step >= 0 && step < ONBOARDING_STEPS.length) {
      setCurrentStep(step);
    }
  };

  const canProceed = () => {
    const currentStepData = ONBOARDING_STEPS[currentStep];
    
    switch (currentStepData.type) {
      case 'name-input':
        return userName.trim().length > 0;
      case 'pin-input':
        return !pin || (pin.length === PIN_LENGTH && pin === confirmPin);
      case 'review':
        return users.length > 0;
      default:
        return true;
    }
  };

  const renderStep = (step, index) => {
    switch (step.type) {
      case 'info':
        return (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.stepContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{step.icon}</Text>
              </View>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>
              
              {step.demo && renderDemo(step.demo)}
              
              <View style={styles.bulletsContainer}>
                {step.bullets.map((bullet, bulletIndex) => (
                  <View key={bulletIndex} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );

      case 'name-input':
        return (
          <KeyboardAvoidingView
            key={step.id}
            style={styles.stepContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.inputContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{step.icon}</Text>
              </View>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.subtitle}>{step.subtitle}</Text>
              
              <TextInput
                ref={nameInputRef}
                style={styles.textInput}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.gray[400]}
                value={userName}
                onChangeText={setUserName}
                autoFocus={false}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
              
              <Text style={styles.hint}>
                You can always change this later in settings
              </Text>
            </View>
          </KeyboardAvoidingView>
        );

      case 'emoji-select':
        const emojiGrid = calculateEmojiColumns();
        return (
          <View key={step.id} style={styles.stepContainer}>
            <View style={[styles.emojiContent, { width: emojiGrid.contentWidth }]}>
              <Text style={[
                styles.title, 
                Platform.OS === 'android' && { marginTop: insets.top + SPACING.xl }
              ]}>{step.title}</Text>
              <Text style={styles.subtitle}>{step.subtitle}</Text>
              
              <View style={styles.selectedEmojiContainer}>
                <Text style={styles.selectedEmoji}>{selectedEmoji}</Text>
              </View>
              
              <TextInput
                style={styles.emojiInput}
                placeholder="Type or paste an emoji"
                placeholderTextColor={COLORS.gray[400]}
                value=""
                onChangeText={(text) => {
                  // More comprehensive emoji regex that handles all emoji types
                  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Component})+/gu;
                  const matches = text.match(emojiRegex);
                  if (matches && matches[0]) {
                    setSelectedEmoji(matches[0]);
                  }
                }}
                maxLength={10}
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType={Platform.OS === 'ios' ? 'default' : 'visible-password'}
                enablesReturnKeyAutomatically={true}
              />
              
              <Text style={styles.orText}>or choose from below</Text>
              
              <View style={[styles.emojiGridContainer, { minHeight: emojiGrid.gridHeight }]}>
                <FlatList
                  data={USER_EMOJI_OPTIONS}
                  numColumns={emojiGrid.columns}
                  key={`grid-${emojiGrid.columns}`} // Force re-render when columns change
                  keyExtractor={(item, index) => `${item}-${index}`}
                  contentContainerStyle={styles.emojiGrid}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false} // Disable scrolling
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.emojiOption,
                        { 
                          width: emojiGrid.itemSize, 
                          height: emojiGrid.itemSize,
                          margin: emojiGrid.itemMargin 
                        },
                        selectedEmoji === item && styles.selectedEmojiOption,
                      ]}
                      onPress={() => setSelectedEmoji(item)}
                    >
                      <Text style={styles.emojiOptionText}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </View>
        );

      case 'pin-input':
        return (
          <KeyboardAvoidingView
            key={step.id}
            style={styles.stepContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.pinContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{step.icon}</Text>
              </View>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.subtitle}>{step.subtitle}</Text>
              
              <View style={styles.pinInputContainer}>
                <Text style={styles.pinLabel}>Enter PIN</Text>
                <TextInput
                  ref={pinInputRef}
                  style={styles.pinInput}
                  placeholder="••••"
                  placeholderTextColor={COLORS.gray[400]}
                  value={pin}
                  onChangeText={(text) => {
                    setPinError('');
                    setPin(text.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH));
                  }}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={PIN_LENGTH}
                  autoFocus={false}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPinInputRef.current?.focus()}
                />
              </View>
              
              <View style={styles.pinInputContainer}>
                <Text style={styles.pinLabel}>Confirm PIN</Text>
                <TextInput
                  ref={confirmPinInputRef}
                  style={styles.pinInput}
                  placeholder="••••"
                  placeholderTextColor={COLORS.gray[400]}
                  value={confirmPin}
                  onChangeText={(text) => {
                    setPinError('');
                    setConfirmPin(text.replace(/[^0-9]/g, '').slice(0, PIN_LENGTH));
                  }}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={PIN_LENGTH}
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                />
              </View>
              
              {pinError ? (
                <Text style={styles.errorText}>{pinError}</Text>
              ) : null}
              
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkipPin}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
              
              <Text style={styles.hint}>
                You can add or change your PIN later in settings
              </Text>
            </View>
          </KeyboardAvoidingView>
        );

      case 'review':
        return (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.reviewContent}>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.subtitle}>{step.subtitle}</Text>
              
              {users.length > 0 && (
                <View style={styles.usersList}>
                  {users.map((user, index) => (
                    <View key={index} style={styles.userReviewItem}>
                      <View style={styles.userEmojiContainer}>
                        <Text style={styles.userEmoji}>{user.emoji}</Text>
                      </View>
                      <Text style={styles.userName}>{user.name}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {users.length < 3 && (
                <TouchableOpacity
                  style={styles.addUserButton}
                  onPress={handleAddAnotherUser}
                >
                  <Icon name="add" size={24} color={THEMES.stackBlue.primary} />
                  <Text style={styles.addUserButtonText}>Add Another User</Text>
                </TouchableOpacity>
              )}
              
              <Text style={styles.hint}>
                You can always add more users later in Settings
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderDemo = (demo) => {
    if (!demo) return null;
    
    switch (demo.type) {
      case 'features':
        return (
          <View style={styles.demoContainer}>
            <View style={styles.demoFeatures}>
              {demo.items.map((emoji, index) => (
                <View key={index} style={styles.demoFeatureIcon}>
                  <Text style={styles.demoFeatureEmoji}>{emoji}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      
      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButtonTop}
        onPress={onSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      
      {/* Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { 
            useNativeDriver: false,
            listener: handleScroll 
          }
        )}
        scrollEventThrottle={16}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {ONBOARDING_STEPS.map((step, index) => renderStep(step, index))}
      </Animated.ScrollView>
      
      {/* Navigation */}
      <View style={styles.navigation}>
        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <ScrollAwareDot
              key={index}
              index={index}
              scrollX={scrollX}
              screenWidth={screenDimensions.width}
              totalSteps={ONBOARDING_STEPS.length}
            />
          ))}
        </View>
        
        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.button, styles.previousButton]}
              onPress={handlePrevious}
            >
              <Icon name="arrow-back" size={24} color={THEMES.stackBlue.primary} />
              <Text style={styles.previousButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.button,
              styles.nextButton,
              !canProceed() && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Finish Setup' : 'Next'}
            </Text>
            <Icon name="arrow-forward" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  skipButtonTop: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: SPACING.lg,
    zIndex: 10,
    padding: SPACING.sm,
  },
  skipText: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    color: THEMES.stackBlue.primary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal', // iOS uses fontWeight, Android uses font file
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    width: screenWidth,
    paddingHorizontal: Platform.OS === 'android' 
      ? (isTablet() ? SPACING.xxl * 1.2 : SPACING.lg)
      : (isTablet() ? SPACING.xxl * 1.5 : SPACING.xl),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    maxWidth: isTablet() ? 600 : 400,
    alignItems: 'center',
  },
  welcomeContent: {
    maxWidth: isTablet() ? 600 : 400,
    alignItems: 'center',
  },
  inputContent: {
    maxWidth: isTablet() ? 500 : 350,
    width: '100%',
    alignItems: 'center',
  },
  emojiContent: {
    alignItems: 'center',
    flex: 1,
  },
  emojiGridContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pinContent: {
    maxWidth: isTablet() ? 500 : 350,
    width: '100%',
    alignItems: 'center',
  },
  reviewContent: {
    maxWidth: isTablet() ? 600 : 400,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: isTablet() ? 120 : 100,
    height: isTablet() ? 120 : 100,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
    borderWidth: 2,
    borderColor: 'rgba(102, 126, 234, 0.2)', // Subtle theme-colored border
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.level2, // Add shadow for depth
  },
  logoContainer: {
    width: isTablet() ? 120 : 100,
    height: isTablet() ? 120 : 100,
    borderRadius: RADIUS.full,
    backgroundColor: THEMES.stackBlue.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'android' ? SPACING.lg : SPACING.xl,
    ...SHADOWS.level3,
    ...(Platform.OS === 'android' && {
      elevation: 4,
    }),
  },
  icon: {
    fontSize: isTablet() ? 60 : 50,
  },
  title: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.xxl : TYPOGRAPHY.fontSize.xl,
    ...Platform.select({
      ios: {
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        fontWeight: '700',
      },
      android: {
        fontFamily: 'ComicRelief-Bold',
        fontWeight: 'normal',
        marginTop: SPACING.sm,
        letterSpacing: 0.5,
      }
    }),
    color: COLORS.gray[900],
    marginBottom: Platform.OS === 'android' ? SPACING.lg : SPACING.md,
    textAlign: 'center',
  },
  description: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    fontFamily: Platform.OS === 'android' ? 'ComicRelief-Regular' : TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: isTablet() ? 28 : 24,
  },
  subtitle: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    ...Platform.select({
      ios: {
        fontFamily: TYPOGRAPHY.fontFamily.regular,
      },
      android: {
        fontFamily: 'ComicRelief-Regular',
        paddingHorizontal: SPACING.md,
        letterSpacing: 0.3,
      }
    }),
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
    lineHeight: isTablet() ? 28 : 24,
  },
  bulletsContainer: {
    alignSelf: 'stretch',
    marginTop: SPACING.lg,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  bulletPoint: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    color: THEMES.stackBlue.primary,
    marginRight: SPACING.sm,
    fontWeight: 'bold',
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  bulletText: {
    flex: 1,
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.md : TYPOGRAPHY.fontSize.sm,
    fontFamily: Platform.OS === 'android' ? 'ComicRelief-Regular' : TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[700],
    lineHeight: isTablet() ? 24 : 20,
  },
  demoContainer: {
    marginVertical: SPACING.xl,
  },
  demoFeatures: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  demoFeatureIcon: {
    width: isTablet() ? 60 : 50,
    height: isTablet() ? 60 : 50,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(102, 126, 234, 0.08)', // Subtle theme-colored background
    borderWidth: 1.5,
    borderColor: 'rgba(102, 126, 234, 0.15)', // Subtle border
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.level1, // Add subtle shadow for depth
  },
  demoFeatureEmoji: {
    fontSize: isTablet() ? 32 : 28,
  },
  textInput: {
    width: '100%',
    height: isTablet() ? 60 : 56,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[900],
    backgroundColor: 'white',
    marginBottom: SPACING.lg,
  },
  selectedEmojiContainer: {
    width: isTablet() ? 120 : 100,
    height: isTablet() ? 120 : 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 3,
    borderColor: THEMES.stackBlue.primary,
    ...SHADOWS.level2,
  },
  selectedEmoji: {
    fontSize: isTablet() ? 60 : 50,
  },
  emojiInput: {
    width: '80%',
    height: isTablet() ? 56 : 48,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[900],
    backgroundColor: 'white',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  orText: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.xs,
    fontFamily: Platform.OS === 'android' ? 'ComicRelief-Regular' : TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[500],
    marginBottom: SPACING.lg,
  },
  emojiGrid: {
    alignItems: 'center',
  },
  emojiOption: {
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray[200], // Subtle border always visible
    ...SHADOWS.level1, // Add subtle shadow
  },
  selectedEmojiOption: {
    borderColor: THEMES.stackBlue.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(102, 126, 234, 0.12)', // Slightly more visible when selected
    transform: [{ scale: 1.05 }], // Subtle scale effect
    ...SHADOWS.level2, // Stronger shadow when selected
  },
  emojiOptionText: {
    fontSize: isTablet() ? 32 : 28,
  },
  pinInputContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  pinLabel: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.md : TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal', // iOS uses fontWeight, Android uses font file
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
  },
  pinInput: {
    width: '100%',
    height: isTablet() ? 60 : 56,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.xl : TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[900],
    backgroundColor: 'white',
    textAlign: 'center',
    letterSpacing: isTablet() ? 10 : 8,
  },
  hint: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.xs,
    fontFamily: Platform.OS === 'android' ? 'ComicRelief-Regular' : TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal', // iOS uses fontWeight, Android uses font file
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  skipButton: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  skipButtonText: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.md : TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal', // iOS uses fontWeight, Android uses font file
    color: THEMES.stackBlue.primary,
    textDecorationLine: 'underline',
  },
  usersList: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  userReviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.level2,
  },
  userEmojiContainer: {
    width: isTablet() ? 60 : 50,
    height: isTablet() ? 60 : 50,
    borderRadius: RADIUS.full,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: THEMES.stackBlue.primary,
  },
  userEmoji: {
    fontSize: isTablet() ? 32 : 28,
  },
  userName: {
    flex: 1,
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal', // iOS uses fontWeight, Android uses font file
    color: COLORS.gray[900],
  },
  addUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 2,
    borderColor: THEMES.stackBlue.primary,
    borderStyle: 'dashed',
    gap: SPACING.sm,
  },
  addUserButtonText: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.md : TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal', // iOS uses fontWeight, Android uses font file
    color: THEMES.stackBlue.primary,
  },
  navigation: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  previousButton: {
    backgroundColor: COLORS.gray[100],
  },
  previousButtonText: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal', // iOS uses fontWeight, Android uses font file
    color: THEMES.stackBlue.primary,
  },
  nextButton: {
    backgroundColor: THEMES.stackBlue.primary,
    marginLeft: 'auto',
    ...SHADOWS.level2,
  },
  nextButtonText: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontWeight: Platform.OS === 'ios' ? '500' : 'normal', // iOS uses fontWeight, Android uses font file
    color: 'white',
  },
  disabledButton: {
    backgroundColor: COLORS.gray[300],
    opacity: 0.5,
  },
});

export default Onboarding;