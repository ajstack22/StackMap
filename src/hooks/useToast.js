import { useState, useCallback, useRef } from 'react';
import { TOAST_DURATION } from '../constants';

/**
 * Custom hook for managing toast notifications
 * @description Provides a toast notification system with auto-hide functionality
 * @returns {{toast: Object|null, showToast: Function, hideToast: Function}} Toast state and control functions
 */
export const useToast = () => {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback(config => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show new toast with visible flag
    setToast({ ...config, visible: true });

    // Set auto-hide timeout
    if (config.duration !== 0) {
      timeoutRef.current = setTimeout(() => {
        setToast({ visible: false });
      }, config.duration || TOAST_DURATION);
    }
  }, []);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setToast({ visible: false });
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};
