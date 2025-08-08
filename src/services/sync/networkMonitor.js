import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

class NetworkMonitor {
  constructor() {
    this.isOnline = true;
    this.listeners = new Set();
    this.unsubscribe = null;
    this.connectionType = 'unknown';
    this.isInternetReachable = true;
  }

  /**
   * Start monitoring network status
   */
  start() {
    if (this.unsubscribe) {
      return; // Already monitoring
    }

    // Subscribe to network state changes
    this.unsubscribe = NetInfo.addEventListener(state => {
      this.handleNetworkChange(state);
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      this.handleNetworkChange(state);
    });

    if (__DEV__) {}
  }

  /**
   * Stop monitoring network status
   */
  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      if (__DEV__) {}
    }
  }

  /**
   * Handle network state changes
   */
  handleNetworkChange(state) {
    const wasOnline = this.isOnline;
    
    // Update connection state
    this.isOnline = state.isConnected && state.isInternetReachable !== false;
    this.connectionType = state.type;
    this.isInternetReachable = state.isInternetReachable !== false;

    if (__DEV__) {}

    // Notify listeners if online status changed
    if (wasOnline !== this.isOnline) {
      this.notifyListeners({
        isOnline: this.isOnline,
        wasOnline,
        connectionType: this.connectionType
      });
    }
  }

  /**
   * Check if currently online
   */
  async checkConnection() {
    try {
      const state = await NetInfo.fetch();
      this.handleNetworkChange(state);
      return this.isOnline;
    } catch (error) {
      if (__DEV__) {
        console.error('NetworkMonitor: Failed to check connection', error);
      }
      return this.isOnline;
    }
  }

  /**
   * Test actual connectivity by pinging the sync server
   */
  async testServerConnection(apiUrl) {
    if (!this.isOnline) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${apiUrl}/health.php`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      if (__DEV__) {}
      return false;
    }
  }

  /**
   * Add a listener for network status changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Immediately notify with current state
    callback({
      isOnline: this.isOnline,
      wasOnline: this.isOnline,
      connectionType: this.connectionType
    });

    // Return unsubscribe function
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        if (__DEV__) {
          console.error('NetworkMonitor: Listener error', error);
        }
      }
    });
  }

  /**
   * Get current network status
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      isInternetReachable: this.isInternetReachable,
      isMonitoring: !!this.unsubscribe
    };
  }

  /**
   * Wait for online status (with timeout)
   */
  waitForOnline(timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      if (this.isOnline) {
        resolve(true);
        return;
      }

      let unsubscribe;
      let timeoutId;

      const cleanup = () => {
        if (unsubscribe) unsubscribe();
        if (timeoutId) clearTimeout(timeoutId);
      };

      // Set up timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Timeout waiting for network'));
      }, timeoutMs);

      // Listen for online status
      unsubscribe = this.addListener(({ isOnline }) => {
        if (isOnline) {
          cleanup();
          resolve(true);
        }
      });
    });
  }
}

// Export singleton instance
export default new NetworkMonitor();