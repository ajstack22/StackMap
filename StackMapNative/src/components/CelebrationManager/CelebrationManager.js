import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Color themes for celebrations - matching PWA
const CELEBRATION_COLORS = {
  rainbow: ['#ff6b9d', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'],
  blue: ['#0077be', '#4ecdc4', '#87ceeb', '#00ced1', '#20b2aa', '#48d1cc'],
  orange: ['#ff6b35', '#ffa726', '#ffeb3b', '#ff5722', '#ffcc02', '#ff8c00'],
  pink: ['#ff6b9d', '#ff1744', '#e91e63', '#ff9ff3', '#ffb6c1', '#ff69b4'],
  purple: ['#9b59b6', '#8e44ad', '#bf55ec', '#dda0dd', '#da70d6', '#ba55d3'],
  gold: ['#ffd700', '#ffb300', '#ff8f00', '#ffc107', '#ffed4e', '#f9a825'],
  green: ['#ff9ff3', '#96ceb4', '#ffeaa7', '#fd79a8', '#a8e6cf', '#ffcccc'],
  random: ['#ff6b9d', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#ffd700', '#ff69b4', '#87ceeb', '#98fb98', '#ffa500'],
};

const Confetti = ({ color, delay, startX, duration = 4000 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, screenHeight + 50],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [startX, startX + 30, startX - 30],
  });

  const rotate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg'],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1, 0],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [
            { translateX },
            { translateY },
            { rotate },
          ],
          opacity,
        },
      ]}
      accessibilityElementsHidden={true}
      importantForAccessibility="no"
    />
  );
};

const FireworkBurst = ({ x, y, colors, delay }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const particleCount = 19 + Math.floor(Math.random() * 13); // 25% more particles (19-31)
  const particles = Array.from({ length: particleCount }, (_, i) => i);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 1500,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return particles.map((i) => {
    const angle = (i / particles.length) * Math.PI * 2;
    const burstSize = 1 + Math.random() * 0.75; // 25% larger
    const velocity = (50 + Math.random() * 50) * burstSize; // 25% more velocity
    const color = colors[Math.floor(Math.random() * colors.length)];

    const translateX = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.cos(angle) * velocity],
    });

    const translateY = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, Math.sin(angle) * velocity],
    });

    const scale = animatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1.5, 0], // 25% larger scale
    });

    const opacity = animatedValue.interpolate({
      inputRange: [0, 0.1, 0.9, 1],
      outputRange: [0, 1, 1, 0],
    });

    return (
      <Animated.View
        key={i}
        style={[
          styles.fireworkParticle,
          {
            backgroundColor: color,
            left: x,
            top: y,
            width: 5 + Math.random() * 7.5, // 25% larger particles
            height: 5 + Math.random() * 7.5,
            transform: [
              { translateX },
              { translateY },
              { scale },
            ],
            opacity,
          },
        ]}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      />
    );
  });
};

export const CelebrationView = ({ type, theme = 'rainbow', onComplete }) => {
  const [reducedMotion, setReducedMotion] = React.useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
  }, []);

  // Don't show animations if reduced motion is enabled or theme is 'none'
  if (reducedMotion || theme === 'none') {
    onComplete?.();
    return null;
  }

  // Handle random theme selection
  let selectedColors;
  if (theme === 'random') {
    const colorKeys = Object.keys(CELEBRATION_COLORS).filter(key => key !== 'random');
    const randomKey = colorKeys[Math.floor(Math.random() * colorKeys.length)];
    selectedColors = CELEBRATION_COLORS[randomKey];
  } else {
    selectedColors = CELEBRATION_COLORS[theme] || CELEBRATION_COLORS.rainbow;
  }

  if (type === 'confetti') {
    const confettiPieces = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: selectedColors[Math.floor(Math.random() * selectedColors.length)],
      delay: Math.random() * 500,
      startX: Math.random() * screenWidth,
    }));

    // Call onComplete after animation duration
    useEffect(() => {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4500);
      return () => clearTimeout(timer);
    }, []);

    return (
      <View style={styles.container} pointerEvents="none">
        {confettiPieces.map((piece) => (
          <Confetti
            key={piece.id}
            color={piece.color}
            delay={piece.delay}
            startX={piece.startX}
          />
        ))}
      </View>
    );
  }

  if (type === 'fireworks') {
    const bursts = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80, // percentage of screen width
      y: 10 + Math.random() * 60, // percentage of screen height  
      delay: i * 160, // 25% faster rate (was 200ms)
    }));

    // Call onComplete after animation duration
    useEffect(() => {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3500);
      return () => clearTimeout(timer);
    }, []);

    return (
      <View style={styles.container} pointerEvents="none">
        {bursts.map((burst) => (
          <FireworkBurst
            key={burst.id}
            x={`${burst.x}%`}
            y={`${burst.y}%`}
            colors={selectedColors}
            delay={burst.delay}
          />
        ))}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  fireworkParticle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default CelebrationView;