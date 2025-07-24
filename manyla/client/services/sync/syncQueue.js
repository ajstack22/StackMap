import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../stores';

const SYNC_QUEUE_KEY = '@sync_queue';
const MAX_QUEUE_SIZE = 100; // Prevent unbounded growth
const MAX_RETRY_ATTEMPTS = 5;

class SyncQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.initialized = false;
    this.listeners = new Set();
  }

  /**
   * Initialize the queue from storage
   */
  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log('SyncQueue: Loaded', this.queue.length, 'pending items');
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
      this.initialized = true;
    }
  }

  /**
   * Add a sync operation to the queue
   */
  async enqueue(operation) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Create queue item with metadata
    const queueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(),
      attempts: 0,
      lastAttempt: null,
      error: null,
      state: useAppStore.getState() // Capture current state
    };

    // Add to queue
    this.queue.push(queueItem);

    // Enforce max queue size (FIFO)
    if (this.queue.length > MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
    }

    // Persist to storage
    await this.persist();

    // Notify listeners
    this.notifyListeners();

    console.log('SyncQueue: Enqueued operation', queueItem.id);
    return queueItem.id;
  }

  /**
   * Get all pending operations
   */
  getPending() {
    return this.queue.filter(item => 
      item.attempts < MAX_RETRY_ATTEMPTS && 
      !item.completed
    );
  }

  /**
   * Get failed operations (exceeded retry limit)
   */
  getFailed() {
    return this.queue.filter(item => 
      item.attempts >= MAX_RETRY_ATTEMPTS && 
      !item.completed
    );
  }

  /**
   * Process the queue
   */
  async process(syncService) {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('SyncQueue: Processing', this.queue.length, 'items');

    try {
      // Get items that can be retried
      const pending = this.getPending();
      
      for (const item of pending) {
        try {
          // Check if we should retry based on backoff
          if (!this.shouldRetry(item)) {
            continue;
          }

          console.log('SyncQueue: Processing item', item.id);
          
          // Update attempt info
          item.attempts++;
          item.lastAttempt = Date.now();
          
          // Attempt sync
          await syncService.sync();
          
          // Mark as completed
          item.completed = true;
          item.error = null;
          
          console.log('SyncQueue: Successfully processed', item.id);
        } catch (error) {
          console.error('SyncQueue: Failed to process', item.id, error);
          item.error = error.message || 'Sync failed';
          
          // If it's a network error, we'll retry later
          if (this.isNetworkError(error)) {
            console.log('SyncQueue: Network error, will retry later');
          }
        }
      }

      // Remove completed items
      this.queue = this.queue.filter(item => !item.completed);
      
      // Persist changes
      await this.persist();
      
      // Notify listeners
      this.notifyListeners();
      
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Check if we should retry based on exponential backoff
   */
  shouldRetry(item) {
    if (item.attempts === 0) return true;
    
    const backoffMs = Math.min(
      1000 * Math.pow(2, item.attempts - 1), // Exponential backoff
      300000 // Max 5 minutes
    );
    
    const timeSinceLastAttempt = Date.now() - item.lastAttempt;
    return timeSinceLastAttempt >= backoffMs;
  }

  /**
   * Check if error is network-related
   */
  isNetworkError(error) {
    const message = error.message || error.toString();
    const networkErrors = [
      'network',
      'fetch',
      'Failed to fetch',
      'NetworkError',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENETUNREACH'
    ];
    
    return networkErrors.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Clear the queue
   */
  async clear() {
    this.queue = [];
    await this.persist();
    this.notifyListeners();
  }

  /**
   * Clear failed items
   */
  async clearFailed() {
    this.queue = this.queue.filter(item => 
      item.attempts < MAX_RETRY_ATTEMPTS || item.completed
    );
    await this.persist();
    this.notifyListeners();
  }

  /**
   * Retry a specific item
   */
  async retry(itemId) {
    const item = this.queue.find(i => i.id === itemId);
    if (item) {
      item.attempts = 0;
      item.lastAttempt = null;
      item.error = null;
      await this.persist();
      this.notifyListeners();
    }
  }

  /**
   * Persist queue to storage
   */
  async persist() {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  /**
   * Add a listener for queue changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of queue changes
   */
  notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('SyncQueue: Listener error', error);
      }
    });
  }

  /**
   * Get queue status
   */
  getStatus() {
    const pending = this.getPending();
    const failed = this.getFailed();
    
    return {
      pending: pending.length,
      failed: failed.length,
      total: this.queue.length,
      isProcessing: this.isProcessing,
      oldestPending: pending[0]?.timestamp,
      items: this.queue
    };
  }
}

export default new SyncQueue();