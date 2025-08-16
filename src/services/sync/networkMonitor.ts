// Platform import removed - not needed since NetInfo is disabled
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Types for network monitoring
interface NetworkEvent {
  isOnline: boolean;
  wasOnline: boolean;
  connectionType: string;
}

interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  isInternetReachable: boolean;
  isMonitoring: boolean;
}

type NetworkListener = (event: NetworkEvent) => void;

/**
 * Monitors network connectivity status
 * NOTE: NetInfo.fetch() is disabled on iOS due to 20+ second freeze issues
 * The service assumes connectivity is always available on iOS
 */
class NetworkMonitor {
  isOnline: boolean = true;
  private listeners: Set<NetworkListener> = new Set();
  private unsubscribe: (() => void) | null = null;
  private connectionType: string = 'unknown';
  private isInternetReachable: boolean = true;

  /**
   * Start monitoring network status
   * DISABLED on iOS - assumes always online to avoid performance issues
   */
  start(): void {
    // DISABLED: NetInfo.fetch() causes 20+ second freeze on iOS
    // Just assume we're online and skip all network checking
    this.isOnline = true;
    this.isInternetReachable = true;
    return;
  }

  /**
   * Stop monitoring network status
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      if (__DEV__) {
        // Monitoring stopped
      }
    }
  }

  /**
   * Handle network state changes
   * @param state - The network state from NetInfo
   */
  private handleNetworkChange(state: NetInfoState): void {
    const wasOnline = this.isOnline;
    
    // Update connection state
    this.isOnline = state.isConnected && state.isInternetReachable !== false;
    this.connectionType = state.type;
    this.isInternetReachable = state.isInternetReachable !== false;

    if (__DEV__) {
      // Network state updated
    }

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
   * @returns Promise resolving to online status
   */
  async checkConnection(): Promise<boolean> {
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
   * @param apiUrl - The API URL to test connectivity against
   * @returns Promise resolving to true if server is reachable
   */
  async testServerConnection(apiUrl: string): Promise<boolean> {
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
      if (__DEV__) {
        // Server connection test failed
      }
      return false;
    }
  }

  /**
   * Add a listener for network status changes
   * @param callback - Function to call when network status changes
   * @returns Unsubscribe function
   */
  addListener(callback: NetworkListener): () => void {
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
   * Notify all listeners of network status change
   * @param event - The network event to broadcast
   */
  private notifyListeners(event: NetworkEvent): void {
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
   * @returns Current network status object
   */
  getStatus(): NetworkStatus {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      isInternetReachable: this.isInternetReachable,
      isMonitoring: !!this.unsubscribe
    };
  }

  /**
   * Wait for online status (with timeout)
   * @param timeoutMs - Maximum time to wait in milliseconds
   * @returns Promise that resolves when online or rejects on timeout
   */
  waitForOnline(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.isOnline) {
        resolve(true);
        return;
      }

      let unsubscribe: (() => void) | undefined;
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

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