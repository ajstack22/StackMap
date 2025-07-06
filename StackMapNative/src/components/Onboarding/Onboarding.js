import React, { useState, useRef } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
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
  const scrollViewRef = useRef(null);
  const nameInputRef = useRef(null);
  const pinInputRef = useRef(null);
  const confirmPinInputRef = useRef(null);

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
        id: 'independence',
        title: 'Your Space, Your Way',
        description: 'Tools that respect autonomy and build confidence',
        icon: '💪',
        type: 'info',
        bullets: [
          'PIN protection for privacy & control',
          'Complete tasks anytime - no judgment',
          'Celebration moments for positive reinforcement',
          'Today/Tomorrow view for better planning',
        ],
      },
      {
        id: 'communication',
        title: 'Connect Without Pressure',
        description: 'Natural ways to share daily experiences',
        icon: '💬',
        type: 'info',
        bullets: [
          'Activities become conversation starters',
          'Reduces "what did you do today?" stress',
          'Shared visibility without intrusion',
          'Celebrate achievements together',
        ],
      },
      {
        id: 'family-ready',
        title: 'Made for Shared Spaces',
        description: 'Perfect for families, classrooms, and care teams',
        icon: '👨‍👩‍👧‍👦',
        type: 'info',
        bullets: [
          'Multiple user profiles on one device',
          'Each person gets their own experience',
          'Works great in schools and therapy settings',
          'Community-driven development',
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
        id: 'get-started',
        title: "Let's Get Started!",
        description: 'Set up your first user in just a minute',
        icon: '🚀',
        type: 'setup-intro',
      },
      {
        id: 'name',
        title: users.length === 0 ? 'What\'s the first user\'s name?' : `What\'s user ${users.length + 1}\'s name?`,
        subtitle: 'You can add up to 3 users now (more can be added later)',
        type: 'name-input',
      },
      {
        id: 'emoji',
        title: 'Choose an avatar',
        subtitle: `Pick an emoji for ${userName || 'this user'}`,
        type: 'emoji-select',
      },
    ];

    // Only show PIN step for first user
    if (users.length === 0 && !isAddingAnotherUser) {
      setupSteps.push({
        id: 'pin',
        title: 'Would you like to protect Edit Mode with a PIN?',
        subtitle: 'This helps prevent accidental changes (one PIN for all users)',
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
        type: 'review',
      });
    }

    return [...infoSteps, ...setupSteps];
  };

  const ONBOARDING_STEPS = getOnboardingSteps();
  
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
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: screenWidth * nextStep,
        animated: true,
      });
      
      // Focus management
      const nextStepData = ONBOARDING_STEPS[nextStep];
      if (nextStepData.type === 'name-input') {
        setTimeout(() => nameInputRef.current?.focus(), 300);
      } else if (nextStepData.type === 'pin-input') {
        setTimeout(() => pinInputRef.current?.focus(), 300);
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
      scrollViewRef.current?.scrollTo({
        x: screenWidth * prevStep,
        animated: true,
      });
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

      case 'setup-intro':
        return (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.welcomeContent}>
              <View style={styles.logoContainer}>
                <Logo size={isTablet() ? 60 : 50} theme={THEMES.stackBlue} />
              </View>
              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>
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
        return (
          <View key={step.id} style={styles.stepContainer}>
            <View style={styles.emojiContent}>
              <Text style={styles.title}>{step.title}</Text>
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
                  const emojiRegex = /\p{Emoji}/u;
                  const match = text.match(emojiRegex);
                  if (match) {
                    setSelectedEmoji(match[0]);
                  }
                }}
                maxLength={5}
              />
              
              <Text style={styles.orText}>or choose from below</Text>
              
              <FlatList
                data={USER_EMOJI_OPTIONS}
                numColumns={isTablet() ? 8 : 6}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.emojiGrid}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.emojiOption,
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
        );

      case 'pin-input':
        return (
          <KeyboardAvoidingView
            key={step.id}
            style={styles.stepContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.pinContent}>
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
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={false}
        style={styles.scrollView}
      >
        {ONBOARDING_STEPS.map((step, index) => renderStep(step, index))}
      </ScrollView>
      
      {/* Navigation */}
      <View style={styles.navigation}>
        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.activeDot,
              ]}
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
    maxWidth: isTablet() ? 560 : 400,
    alignItems: 'center',
    flex: 1,
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
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
    marginBottom: Platform.OS === 'android' ? SPACING.lg : SPACING.md,
    textAlign: 'center',
    ...(Platform.OS === 'android' && {
      marginTop: SPACING.sm,
      letterSpacing: 0.5,
    }),
  },
  description: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: isTablet() ? 28 : 24,
  },
  subtitle: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.lg : TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: Platform.OS === 'android' ? SPACING.xxl : SPACING.xl,
    lineHeight: isTablet() ? 28 : 24,
    ...(Platform.OS === 'android' && {
      paddingHorizontal: SPACING.md,
      letterSpacing: 0.3,
    }),
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
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
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[500],
    marginBottom: SPACING.lg,
  },
  emojiGrid: {
    paddingBottom: SPACING.xl,
  },
  emojiOption: {
    width: isTablet() ? 70 : 55,
    height: isTablet() ? 70 : 55,
    margin: SPACING.xs,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedEmojiOption: {
    borderColor: THEMES.stackBlue.primary,
    backgroundColor: THEMES.stackBlue.primary + '20',
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
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  errorText: {
    fontSize: isTablet() ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
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
    backgroundColor: COLORS.gray[300],
  },
  activeDot: {
    width: 24,
    backgroundColor: THEMES.stackBlue.primary,
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
    color: 'white',
  },
  disabledButton: {
    backgroundColor: COLORS.gray[300],
    opacity: 0.5,
  },
});

export default Onboarding;