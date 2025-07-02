import { useState, useCallback, useRef } from 'react';
import { TOAST_DURATION } from '../constants';

export const useToast = () => {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback((config) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show new toast
    setToast(config);

    // Set auto-hide timeout
    if (config.duration !== 0) {
      timeoutRef.current = setTimeout(() => {
        setToast(null);
      }, config.duration || TOAST_DURATION);
    }
  }, []);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};