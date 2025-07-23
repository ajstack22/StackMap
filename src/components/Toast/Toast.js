import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { SHADOWS, TYPOGRAPHY, RADIUS, SPACING } from '../../constants';

const Toast = ({ 
  toast,
  onDismiss,
  theme,
}) => {
  const [translateY] = useState(() => new Animated.Value(100));
  const timeoutRef = useRef(null);
  
  // Extract values with defaults to avoid conditional hook calls
  const visible = toast?.visible || false;
  const message = toast?.message || '';
  const action = toast?.action || null;
  const backgroundColor = toast?.backgroundColor || theme?.primary || '#667eea';
  const duration = toast?.duration || 3000;

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto dismiss
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          onDismiss();
        }, duration);
      }
    } else {
      // Hide toast
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, onDismiss]);

  if (!toast || !visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        { transform: [{ translateY }] }
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor }, SHADOWS.level3]}
        onPress={onDismiss}
        activeOpacity={0.9}
      >
        <Text style={styles.message}>{message}</Text>
        {action && (
          <TouchableOpacity
            style={styles.action}
            onPress={() => {
              action.onPress();
              onDismiss();
            }}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md - 4,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
  },
  message: {
    color: 'white',
    fontSize: TYPOGRAPHY.sizes.md,
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    textAlign: 'center',
  },
  action: {
    marginLeft: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.sm,
  },
  actionText: {
    color: 'white',
    fontWeight: TYPOGRAPHY.weights.bold,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
});

export default React.memo(Toast);