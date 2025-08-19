// @ts-check
import { Animated, Platform, Easing } from 'react-native';

// Unified animation timing constants
export const ANIMATION_TIMING = {
  // Main transition duration for edit mode toggle
  TRANSITION_DURATION: 350,
  
  // Stagger delay between list items
  STAGGER_DELAY: 30,
  
  // Individual component fade durations
  FADE_DURATION: 250,
  
  // Toolbar slide duration
  TOOLBAR_SLIDE: 300,
  
  // Icon rotation duration
  ICON_ROTATION: 400,
  
  // Bounce effect duration
  BOUNCE_DURATION: 450,
  
  // Quick fade for immediate feedback
  QUICK_FADE: 150,
};

// Unified easing curves for consistent feel
export const ANIMATION_EASING = {
  // Smooth entrance/exit
  smooth: Easing.bezier(0.4, 0, 0.2, 1), // Material design standard
  
  // Bounce effect for playful elements
  bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  
  // Quick snappy animations
  snappy: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  
  // Linear for consistent movement
  linear: Easing.linear,
};

// Create staggered animations for list items
export const createStaggeredAnimation = (items, animatedValues, config = {}) => {
  const {
    duration = ANIMATION_TIMING.FADE_DURATION,
    delay = ANIMATION_TIMING.STAGGER_DELAY,
    toValue = 1,
    easing = ANIMATION_EASING.smooth,
  } = config;

  return Animated.stagger(delay, 
    animatedValues.map(value => 
      Animated.timing(value, {
        toValue,
        duration,
        easing,
        useNativeDriver: true,
      })
    )
  );
};

// Create fade animation
export const createFadeAnimation = (animatedValue, toValue, config = {}) => {
  const {
    duration = ANIMATION_TIMING.FADE_DURATION,
    easing = ANIMATION_EASING.smooth,
    delay = 0,
  } = config;

  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    delay,
    useNativeDriver: true,
  });
};

// Create slide animation
export const createSlideAnimation = (animatedValue, toValue, config = {}) => {
  const {
    duration = ANIMATION_TIMING.TOOLBAR_SLIDE,
    easing = ANIMATION_EASING.smooth,
  } = config;

  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
};

// Create rotation animation
export const createRotationAnimation = (animatedValue, toValue, config = {}) => {
  const {
    duration = ANIMATION_TIMING.ICON_ROTATION,
    easing = ANIMATION_EASING.bounce,
  } = config;

  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
};

// Create spring animation for bouncy effects
export const createSpringAnimation = (animatedValue, toValue, config = {}) => {
  const {
    tension = 40,
    friction = 7,
    useNativeDriver = true,
  } = config;

  return Animated.spring(animatedValue, {
    toValue,
    tension,
    friction,
    useNativeDriver,
  });
};

// Create parallel animations that run together
export const createParallelAnimation = (animations, config = {}) => {
  const { stopTogether = true } = config;
  return Animated.parallel(animations, { stopTogether });
};

// Create sequence animations that run one after another
export const createSequenceAnimation = (animations) => {
  return Animated.sequence(animations);
};

// Helper to reset animation values
export const resetAnimationValues = (animatedValues, value = 0) => {
  animatedValues.forEach(animValue => {
    animValue.setValue(value);
  });
};

// Platform-specific animation adjustments
export const getPlatformAnimationConfig = () => {
  if (Platform.OS === 'web') {
    // Web animations need slightly different timing for smooth CSS transitions
    return {
      durationMultiplier: 1.1,
      useNativeDriver: false, // Web doesn't support native driver for all properties
    };
  } else if (Platform.OS === 'android') {
    // Android needs slightly faster animations to feel responsive
    return {
      durationMultiplier: 0.9,
      useNativeDriver: true,
    };
  } else {
    // iOS default
    return {
      durationMultiplier: 1.0,
      useNativeDriver: true,
    };
  }
};

// Create edit mode transition animation
export const createEditModeTransition = (isEntering, animations) => {
  const {
    contentOpacity,
    toolbarTranslate,
    iconRotation,
    listItemsOpacity = [],
    fabScale,
  } = animations;

  const platformConfig = getPlatformAnimationConfig();
  const durationMultiplier = platformConfig.durationMultiplier;

  const animationSequence = [];

  if (isEntering) {
    // Entering edit mode
    animationSequence.push(
      createParallelAnimation([
        // Fade out normal content
        createFadeAnimation(contentOpacity, 0, {
          duration: ANIMATION_TIMING.QUICK_FADE * durationMultiplier,
        }),
        // Rotate FAB icon
        createRotationAnimation(iconRotation, 1, {
          duration: ANIMATION_TIMING.ICON_ROTATION * durationMultiplier,
        }),
        // Scale FAB slightly
        fabScale && createSpringAnimation(fabScale, 1.1),
      ])
    );

    // Then slide in toolbar and fade in list items
    animationSequence.push(
      createParallelAnimation([
        createSlideAnimation(toolbarTranslate, 0, {
          duration: ANIMATION_TIMING.TOOLBAR_SLIDE * durationMultiplier,
          easing: ANIMATION_EASING.smooth,
        }),
        listItemsOpacity.length > 0 && createStaggeredAnimation(
          listItemsOpacity,
          listItemsOpacity,
          {
            duration: ANIMATION_TIMING.FADE_DURATION * durationMultiplier,
            delay: ANIMATION_TIMING.STAGGER_DELAY,
            toValue: 1,
          }
        ),
      ].filter(Boolean))
    );
  } else {
    // Exiting edit mode
    animationSequence.push(
      createParallelAnimation([
        // Slide out toolbar
        createSlideAnimation(toolbarTranslate, 100, {
          duration: ANIMATION_TIMING.TOOLBAR_SLIDE * durationMultiplier,
          easing: ANIMATION_EASING.smooth,
        }),
        // Fade out list items
        listItemsOpacity.length > 0 && createStaggeredAnimation(
          listItemsOpacity.slice().reverse(), // Reverse for exit
          listItemsOpacity.slice().reverse(),
          {
            duration: ANIMATION_TIMING.QUICK_FADE * durationMultiplier,
            delay: ANIMATION_TIMING.STAGGER_DELAY / 2,
            toValue: 0,
          }
        ),
      ].filter(Boolean))
    );

    // Then restore normal content
    animationSequence.push(
      createParallelAnimation([
        // Fade in normal content
        createFadeAnimation(contentOpacity, 1, {
          duration: ANIMATION_TIMING.FADE_DURATION * durationMultiplier,
        }),
        // Rotate FAB icon back
        createRotationAnimation(iconRotation, 0, {
          duration: ANIMATION_TIMING.ICON_ROTATION * durationMultiplier,
        }),
        // Scale FAB back
        fabScale && createSpringAnimation(fabScale, 1),
      ])
    );
  }

  return createSequenceAnimation(animationSequence);
};