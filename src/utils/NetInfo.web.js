/**
 * Web-safe mock for @react-native-community/netinfo
 * Provides basic network monitoring for web
 */

const NetInfo = {
  addEventListener: (callback) => {
    // Monitor online/offline events
    const handleChange = () => {
      callback({
        type: 'unknown',
        isConnected: navigator.onLine,
        isInternetReachable: navigator.onLine,
        details: null
      });
    };

    window.addEventListener('online', handleChange);
    window.addEventListener('offline', handleChange);

    // Return unsubscribe function
    return () => {
      window.removeEventListener('online', handleChange);
      window.removeEventListener('offline', handleChange);
    };
  },

  fetch: () => {
    return Promise.resolve({
      type: 'unknown',
      isConnected: navigator.onLine,
      isInternetReachable: navigator.onLine,
      details: null
    });
  },

  useNetInfo: () => {
    return {
      type: 'unknown',
      isConnected: navigator.onLine,
      isInternetReachable: navigator.onLine,
      details: null
    };
  }
};

export default NetInfo;