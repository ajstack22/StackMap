import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

// Hook for managing category expand/collapse animations
const useCategoryAnimations = (expandedState, isSortMode, isDraggingAnyCategory, isExpanded, setIsExpanded) => {
  // Use useRef for Animated values to avoid re-creation issues
  const expandAnim = useRef(
    new Animated.Value(
      expandedState !== undefined ? (expandedState ? 1 : 0) : 1,
    ),
  ).current;
  const rotateAnim = useRef(
    new Animated.Value(
      expandedState !== undefined ? (expandedState ? 1 : 0) : 1,
    ),
  ).current;
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update expanded state when it changes
  useEffect(() => {
    if (expandedState !== undefined) {
      setIsExpanded(expandedState);
      // Animate to the new state
      const toValue = expandedState ? 1 : 0;
      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(rotateAnim, {
          toValue,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [expandedState, isSortMode]);

  // Collapse when any category starts dragging
  useEffect(() => {
    if (isDraggingAnyCategory && isExpanded) {
      // Animate collapse smoothly
      Animated.parallel([
        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Only update state after animation completes if still mounted
        if (isMounted.current) {
          setIsExpanded(false);
        }
      });
    }
  }, [isDraggingAnyCategory]);

  const toggleExpand = (categoryId, onExpandedChange, isSortMode) => {
    // Don't allow expand/collapse in sort mode
    if (isSortMode) return;

    const newExpanded = !isExpanded;
    const toValue = newExpanded ? 1 : 0;
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    if (isMounted.current) {
      setIsExpanded(newExpanded);
      if (onExpandedChange) {
        onExpandedChange(categoryId, newExpanded);
      }
    }
  };

  // Create stable interpolations using useRef to avoid re-creation
  const animatedStylesRef = useRef({
    rotation: rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '90deg'],
    }),
    maxHeight: expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1500],
    }),
    opacity: expandAnim.interpolate({
      inputRange: [0, 0.8, 1],
      outputRange: [0, 1, 1],
    }),
  });
  const animatedStyles = animatedStylesRef.current;

  return {
    animatedStyles,
    toggleExpand,
    isMounted,
  };
};

export { useCategoryAnimations };