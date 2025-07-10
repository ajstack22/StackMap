import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Picker,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, RADIUS, TYPOGRAPHY, THEMES } from '../../constants/theme';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';

const ContextModal = ({ visible, onClose, currentUser, users, onSave, theme, onUserChange }) => {
  const insets = useSafeAreaInsets();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isSmallScreen = screenWidth < 768;
  const [selectedUser, setSelectedUser] = useState(currentUser);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(new Date().getDay());
  const dayScale = useRef(new Animated.Value(1)).current;
  const userScale = useRef(new Animated.Value(1)).current;
  const [selectedWeather, setSelectedWeather] = useState(0);
  const [selectedMood, setSelectedMood] = useState(6); // Happy by default
  const [selectedTemperature, setSelectedTemperature] = useState(3); // Warm by default

  // Get current user theme
  const currentUserThemeColor = users && users[selectedUser]?.settings?.theme || 'stackBlue';
  const currentUserTheme = THEMES[currentUserThemeColor] || THEMES.stackBlue;

  // Update selected user when currentUser prop changes or modal opens
  useEffect(() => {
    if (visible && currentUser) {
      setSelectedUser(currentUser);
    }
  }, [visible, currentUser]);

  // Handle screen resize
  useEffect(() => {
    const updateDimensions = () => {
      setScreenWidth(Dimensions.get('window').width);
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    return () => subscription?.remove();
  }, []);

  // Animation values
  const weatherAnimation = useRef(new Animated.Value(0)).current;
  const weatherScale = useRef(new Animated.Value(1)).current;
  const temperatureScale = useRef(new Animated.Value(1)).current;
  // User carousel functions
  const userIds = users ? Object.keys(users) : [];
  const currentUserIndex = userIds.indexOf(selectedUser);

  const cycleUser = (direction) => {
    animateUserChange();
    const currentIndex = userIds.indexOf(selectedUser);
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % userIds.length;
    } else {
      newIndex = (currentIndex - 1 + userIds.length) % userIds.length;
    }
    const newUserId = userIds[newIndex];
    setSelectedUser(newUserId);
    
    // Immediately update the user and theme in parent component
    if (onUserChange) {
      onUserChange(newUserId);
    }
    
    // Auto-save when user changes (without closing)
    const contextData = {
      user: newUserId,
      dayOfWeek: selectedDayOfWeek,
      weather: weatherOptions[selectedWeather].id,
      temperature: temperatureOptions[selectedTemperature].id,
      mood: moods[selectedMood].emoji,
      autoSave: true, // Mark this as an auto-save
    };
    onSave(contextData);
  };

  const animateUserChange = () => {
    Animated.sequence([
      Animated.timing(userScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(userScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Weather animation
  const animateWeatherChange = () => {
    Animated.sequence([
      Animated.timing(weatherScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(weatherScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const temperatureOptions = [
    { id: 'freezing', emoji: '🧊', label: 'Freezing', color: '#2266dd', bgColor: '#E8F3FF', description: 'Brrr! Bundle up!' },
    { id: 'cold', emoji: '☃️', label: 'Cold', color: '#4488ff', bgColor: '#F0F7FF', description: 'Chilly weather!' },
    { id: 'cool', emoji: '🌬️', label: 'Cool', color: '#88aaff', bgColor: '#F5F9FF', description: 'Nice and fresh!' },
    { id: 'warm', emoji: '😊', label: 'Warm', color: '#ffaa88', bgColor: '#FFF8F3', description: 'Perfectly cozy!' },
    { id: 'hot', emoji: '🥵', label: 'Hot', color: '#ff4444', bgColor: '#FFE8E8', description: 'Getting toasty!' },
    { id: 'very-hot', emoji: '🔥', label: 'Very Hot', color: '#dd2222', bgColor: '#FFD8D8', description: 'Too hot to handle!' },
  ];

  const cycleTemperature = (direction) => {
    animateTemperatureChange();
    if (direction === 'next') {
      setSelectedTemperature((prev) => (prev + 1) % temperatureOptions.length);
    } else {
      setSelectedTemperature((prev) => (prev - 1 + temperatureOptions.length) % temperatureOptions.length);
    }
  };

  const animateTemperatureChange = () => {
    Animated.sequence([
      Animated.timing(temperatureScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(temperatureScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const weatherOptions = [
    { id: 'sunny', icon: '☀️', label: 'Sunny', color: '#FDB462', bgColor: '#FFF3CD', description: 'Bright and cheerful!' },
    { id: 'partly-cloudy', icon: '⛅', label: 'Partly Cloudy', color: '#74B9FF', bgColor: '#D6E9FF', description: 'A mix of sun and clouds' },
    { id: 'cloudy', icon: '☁️', label: 'Cloudy', color: '#95A5A6', bgColor: '#E8ECEC', description: 'Cozy cloud cover' },
    { id: 'rainy', icon: '🌧️', label: 'Rainy', color: '#5D6D7E', bgColor: '#D5D8DC', description: 'Pitter patter!' },
    { id: 'stormy', icon: '⛈️', label: 'Stormy', color: '#4A5568', bgColor: '#E2E8F0', description: 'Thunder and lightning!' },
    { id: 'snowy', icon: '🌨️', label: 'Snowy', color: '#CBD5E0', bgColor: '#F7FAFC', description: 'Winter wonderland!' },
    { id: 'foggy', icon: '🌫️', label: 'Foggy', color: '#BDC3C7', bgColor: '#F8F9F9', description: 'Mysterious mist' },
  ];

  const moods = [
    { emoji: '😢', label: 'Sad', color: '#5DADE2', bgColor: '#E8F4F8', description: 'Feeling blue' },
    { emoji: '😖', label: 'Frustrated', color: '#E74C3C', bgColor: '#FADBD8', description: 'Feeling stuck' },
    { emoji: '😟', label: 'Unhappy', color: '#85929E', bgColor: '#F0F1F2', description: 'Not great' },
    { emoji: '🥱', label: 'Tired', color: '#AF7AC5', bgColor: '#F4ECF7', description: 'Need some rest' },
    { emoji: '😐', label: 'Okay', color: '#F4D03F', bgColor: '#FEFCE8', description: 'Doing alright' },
    { emoji: '🤒', label: 'Sick', color: '#DC7633', bgColor: '#FAE5D3', description: 'Not feeling well' },
    { emoji: '😊', label: 'Happy', color: '#58D68D', bgColor: '#E8F8F0', description: 'Feeling good!' },
    { emoji: '🤪', label: 'Silly', color: '#F06292', bgColor: '#FCE4EC', description: 'Feeling playful!' },
    { emoji: '😄', label: 'Excited', color: '#EC7063', bgColor: '#FDEDEC', description: 'Super happy!' },
    { emoji: '😴', label: 'Bored', color: '#5499C7', bgColor: '#D6EAF8', description: 'Need something fun' },
  ];

  const moodScale = useRef(new Animated.Value(1)).current;

  const cycleMood = (direction) => {
    animateMoodChange();
    if (direction === 'next') {
      setSelectedMood((prev) => (prev + 1) % moods.length);
    } else {
      setSelectedMood((prev) => (prev - 1 + moods.length) % moods.length);
    }
  };

  const animateMoodChange = () => {
    Animated.sequence([
      Animated.timing(moodScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(moodScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const dayOptions = [
    { name: 'Sunday', emoji: '☀️', description: 'Start of the week!' },
    { name: 'Monday', emoji: '🌙', description: 'Moon-day!' },
    { name: 'Tuesday', emoji: '🌮', description: 'Taco Tuesday!' },
    { name: 'Wednesday', emoji: '🐪', description: 'Hump day!' },
    { name: 'Thursday', emoji: '⚡', description: 'Thunder day!' },
    { name: 'Friday', emoji: '🎉', description: 'TGIF!' },
    { name: 'Saturday', emoji: '🎯', description: 'Weekend fun!' },
  ];
  

  const cycleDay = (direction) => {
    animateDayChange();
    if (direction === 'next') {
      setSelectedDayOfWeek((prev) => (prev + 1) % dayOptions.length);
    } else {
      setSelectedDayOfWeek((prev) => (prev - 1 + dayOptions.length) % dayOptions.length);
    }
  };

  const animateDayChange = () => {
    Animated.sequence([
      Animated.timing(dayScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(dayScale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };


  const handleSave = () => {
    const contextData = {
      user: selectedUser,
      dayOfWeek: selectedDayOfWeek,
      weather: weatherOptions[selectedWeather].id,
      temperature: temperatureOptions[selectedTemperature].id,
      mood: moods[selectedMood].emoji,
    };
    onSave(contextData);
    onClose();
  };

  const handleClose = () => {
    // Ensure the current user is properly set when closing
    if (selectedUser !== currentUser && onUserChange) {
      onUserChange(selectedUser);
    }
    onClose();
  };

  const cycleWeather = (direction) => {
    animateWeatherChange();
    if (direction === 'next') {
      setSelectedWeather((prev) => (prev + 1) % weatherOptions.length);
    } else {
      setSelectedWeather((prev) => (prev - 1 + weatherOptions.length) % weatherOptions.length);
    }
  };


  // Weather Carousel Component
  const WeatherCarousel = () => {
    const currentWeather = weatherOptions[selectedWeather];
    
    const handleWeatherSwipe = ({ nativeEvent }) => {
      if (nativeEvent.state === State.END) {
        if (nativeEvent.translationX > 50) {
          cycleWeather('prev');
        } else if (nativeEvent.translationX < -50) {
          cycleWeather('next');
        }
      }
    };
    
    const carouselContent = (
      <Animated.View 
        style={[
          styles.carouselDisplay,
          { 
            transform: [{ scale: weatherScale }]
          }
        ]}
      >
        <Text style={styles.carouselEmoji}>{currentWeather.icon}</Text>
        <Text style={styles.carouselLabel}>{currentWeather.label}</Text>
        <Text style={styles.carouselDescription}>{currentWeather.description}</Text>
      </Animated.View>
    );
    
    return (
      <View style={styles.carousel}>
        <TouchableOpacity 
          style={styles.carouselArrow}
          onPress={() => cycleWeather('prev')}
        >
          <Icon name="chevron-left" size={24} color={currentUserTheme.primary} />
        </TouchableOpacity>
        
        {Platform.OS !== 'web' ? (
          <PanGestureHandler onHandlerStateChange={handleWeatherSwipe}>
            {carouselContent}
          </PanGestureHandler>
        ) : (
          carouselContent
        )}
        
        <TouchableOpacity 
          style={styles.carouselArrow}
          onPress={() => cycleWeather('next')}
        >
          <Icon name="chevron-right" size={24} color={currentUserTheme.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Day Carousel Component
  const DayCarousel = () => {
    const currentDay = dayOptions[selectedDayOfWeek];
    
    const handleDaySwipe = ({ nativeEvent }) => {
      if (nativeEvent.state === State.END) {
        if (nativeEvent.translationX > 50) {
          cycleDay('prev');
        } else if (nativeEvent.translationX < -50) {
          cycleDay('next');
        }
      }
    };
    
    const carouselContent = (
      <Animated.View 
        style={[
          styles.carouselDisplay,
          { 
            transform: [{ scale: dayScale }]
          }
        ]}
      >
        <Text style={styles.carouselEmoji}>{currentDay.emoji}</Text>
        <Text style={styles.carouselLabel}>{currentDay.name}</Text>
        <Text style={styles.carouselDescription}>{currentDay.description}</Text>
      </Animated.View>
    );
    
    return (
      <View style={styles.carousel}>
        <TouchableOpacity 
          style={styles.carouselArrow}
          onPress={() => cycleDay('prev')}
        >
          <Icon name="chevron-left" size={24} color={currentUserTheme.primary} />
        </TouchableOpacity>
        
        {Platform.OS !== 'web' ? (
          <PanGestureHandler onHandlerStateChange={handleDaySwipe}>
            {carouselContent}
          </PanGestureHandler>
        ) : (
          carouselContent
        )}
        
        <TouchableOpacity 
          style={styles.carouselArrow}
          onPress={() => cycleDay('next')}
        >
          <Icon name="chevron-right" size={24} color={currentUserTheme.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Temperature Carousel Component
  const TemperatureCarousel = () => {
    const currentTemp = temperatureOptions[selectedTemperature];
    
    const handleTempSwipe = ({ nativeEvent }) => {
      if (nativeEvent.state === State.END) {
        if (nativeEvent.translationX > 50) {
          cycleTemperature('prev');
        } else if (nativeEvent.translationX < -50) {
          cycleTemperature('next');
        }
      }
    };
    
    const carouselContent = (
      <Animated.View 
        style={[
          styles.carouselDisplay,
          { 
            transform: [{ scale: temperatureScale }]
          }
        ]}
      >
        <Text style={styles.carouselEmoji}>{currentTemp.emoji}</Text>
        <Text style={styles.carouselLabel}>{currentTemp.label}</Text>
        <Text style={styles.carouselDescription}>{currentTemp.description}</Text>
      </Animated.View>
    );
    
    return (
      <View style={styles.carousel}>
        <TouchableOpacity 
          style={styles.carouselArrow}
          onPress={() => cycleTemperature('prev')}
        >
          <Icon name="chevron-left" size={24} color={currentUserTheme.primary} />
        </TouchableOpacity>
        
        {Platform.OS !== 'web' ? (
          <PanGestureHandler onHandlerStateChange={handleTempSwipe}>
            {carouselContent}
          </PanGestureHandler>
        ) : (
          carouselContent
        )}
        
        <TouchableOpacity 
          style={styles.carouselArrow}
          onPress={() => cycleTemperature('next')}
        >
          <Icon name="chevron-right" size={24} color={currentUserTheme.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Mood Carousel Component
  const MoodCarousel = () => {
    const currentMood = moods[selectedMood];
    
    const handleMoodSwipe = ({ nativeEvent }) => {
      if (nativeEvent.state === State.END) {
        if (nativeEvent.translationX > 50) {
          cycleMood('prev');
        } else if (nativeEvent.translationX < -50) {
          cycleMood('next');
        }
      }
    };
    
    const carouselContent = (
      <Animated.View 
        style={[
          styles.carouselDisplay,
          { 
            transform: [{ scale: moodScale }]
          }
        ]}
      >
        <Text style={styles.carouselEmoji}>{currentMood.emoji}</Text>
        <Text style={styles.carouselLabel}>{currentMood.label}</Text>
        <Text style={styles.carouselDescription}>{currentMood.description}</Text>
      </Animated.View>
    );
    
    return (
      <View style={styles.carousel}>
        <TouchableOpacity 
          style={styles.carouselArrow}
          onPress={() => cycleMood('prev')}
        >
          <Icon name="chevron-left" size={24} color={currentUserTheme.primary} />
        </TouchableOpacity>
        
        {Platform.OS !== 'web' ? (
          <PanGestureHandler onHandlerStateChange={handleMoodSwipe}>
            {carouselContent}
          </PanGestureHandler>
        ) : (
          carouselContent
        )}
        
        <TouchableOpacity 
          style={styles.carouselArrow}
          onPress={() => cycleMood('next')}
        >
          <Icon name="chevron-right" size={24} color={currentUserTheme.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  // User Carousel Component
  const UserCarousel = () => {
    const currentUserData = users[selectedUser];
    const userThemeColor = currentUserData?.settings?.theme || 'stackBlue';
    const userTheme = THEMES[userThemeColor] || THEMES.stackBlue;
    
    const handleUserSwipe = ({ nativeEvent }) => {
      if (nativeEvent.state === State.END) {
        if (nativeEvent.translationX > 50) {
          cycleUser('prev');
        } else if (nativeEvent.translationX < -50) {
          cycleUser('next');
        }
      }
    };
    
    const carouselContent = (
      <Animated.View 
        style={[
          styles.userCarouselDisplay,
          { 
            backgroundColor: userTheme.primary,
            borderColor: userTheme.primary,
            transform: [{ scale: userScale }]
          }
        ]}
      >
        <Text style={styles.userCarouselEmoji}>{currentUserData?.icon || '😀'}</Text>
        <Text style={[styles.userCarouselName, { color: COLORS.white }]}>
          {currentUserData?.name || 'User'}
        </Text>
      </Animated.View>
    );
    
    const hasMultipleUsers = userIds.length > 1;
    
    return (
      <View style={styles.carousel}>
        {hasMultipleUsers ? (
          <TouchableOpacity 
            style={styles.carouselArrow}
            onPress={() => cycleUser('prev')}
          >
            <Icon name="chevron-left" size={24} color={userTheme.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.carouselArrow} />
        )}
        
        {Platform.OS !== 'web' && hasMultipleUsers ? (
          <PanGestureHandler onHandlerStateChange={handleUserSwipe}>
            {carouselContent}
          </PanGestureHandler>
        ) : (
          carouselContent
        )}
        
        {hasMultipleUsers ? (
          <TouchableOpacity 
            style={styles.carouselArrow}
            onPress={() => cycleUser('next')}
          >
            <Icon name="chevron-right" size={24} color={userTheme.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.carouselArrow} />
        )}
      </View>
    );
  };

  const styles = getStyles(currentUserTheme, isSmallScreen, screenWidth);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        {Platform.OS === 'android' && (
          <StatusBar 
            backgroundColor={currentUserTheme.primary} 
            barStyle="light-content" 
            translucent={false}
          />
        )}
        <View style={[styles.modalContainer, { backgroundColor: currentUserTheme.primary }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: currentUserTheme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ flex: 1, backgroundColor: currentUserTheme.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: currentUserTheme.primary }]}>
            <Text style={styles.modalTitle}>✅ Check-In</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        
        <ScrollView 
          style={{ flex: 1, backgroundColor: currentUserTheme.light }}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Users Section */}
          <View style={styles.userSection}>
            <Text style={styles.sectionTitle}>Who's checking in? 👋</Text>
            <UserCarousel />
          </View>

          {/* Visual Separator */}
          <View style={styles.sectionDivider} />

          {/* Context Section */}
          <View style={styles.contextSection}>
            <View style={styles.contextGrid}>
          
            {/* Day of Week */}
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>What day is it?</Text>
              <DayCarousel />
            </View>

            {/* Mood */}
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>How are you feeling?</Text>
              <MoodCarousel />
            </View>

            {/* Weather */}
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>How's the weather?</Text>
              <WeatherCarousel />
            </View>

            {/* Temperature */}
            <View style={styles.contextItem}>
              <Text style={styles.contextLabel}>How hot or cold?</Text>
              <TemperatureCarousel />
            </View>
          </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>All Set! ✅</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </SafeAreaView>
        {Platform.OS === 'android' && (
          <View style={{ 
            backgroundColor: currentUserTheme.primary, 
            height: (screenWidth >= 768 || Dimensions.get('window').height > 800) 
              ? Math.max(insets.bottom * 1.2, 20) // Reduced by 40%
              : Math.max(insets.bottom, 10) // Reduced by 40%
          }} />
        )}
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const getStyles = (userTheme, isSmallScreen, screenWidth) => ({
  modalContainer: {
    flex: 1,
    backgroundColor: userTheme.light,
    ...(Platform.OS === 'android' && {
      paddingTop: 0,
      paddingBottom: 0,
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  userSection: {
    paddingBottom: SPACING.md,
  },
  contextSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: -SPACING.md,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: SPACING.lg,
    marginHorizontal: SPACING.xl,
    borderRadius: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  userCarouselDisplay: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    width: isSmallScreen ? Math.min(screenWidth - 120, 280) : 260,
    borderWidth: 3,
    ...SHADOWS.level2,
  },
  userCarouselEmoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  userCarouselName: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginBottom: SPACING.xs,
  },
  userCarouselLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
  },
  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  contextItem: {
    alignItems: 'center',
    width: isSmallScreen ? '100%' : '49%',
    marginBottom: SPACING.lg,
  },
  contextLabel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pickerContainer: {
    width: '100%',
    maxWidth: 300,
    height: 150,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
  pickerItem: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'center',
    color: userTheme.primary,
  },
  androidPickerContainer: {
    borderWidth: 2,
    borderColor: userTheme.primary,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.white,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  androidPicker: {
    height: 50,
    width: '100%',
  },
  carousel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  carouselArrow: {
    padding: SPACING.xs,
    borderRadius: RADIUS.round,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: userTheme.primary,
    ...SHADOWS.level1,
  },
  carouselDisplay: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    width: isSmallScreen ? Math.min(screenWidth - 120, 280) : 260,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: userTheme.primary,
    ...SHADOWS.level2,
  },
  carouselEmoji: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  carouselLabel: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  carouselDescription: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: userTheme.primary,
    ...SHADOWS.level1,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: userTheme.primary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: userTheme.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    ...SHADOWS.level2,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.white,
  },
});

export default ContextModal;