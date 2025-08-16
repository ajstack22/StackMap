import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../stores';

const SYNC_QUEUE_KEY = '@sync_queue';
const MAX_QUEUE_SIZE = 100; // Prevent unbounded growth
const MAX_RETRY_ATTEMPTS = 5;

// Types for sync queue
interface QueueOperation {
  type: string;
  timestamp: number;
  [key: string]: any;
}

interface QueueItem {
  id: string;
  operation: QueueOperation;
  timestamp: number;
  attempts: number;
  lastAttempt: number | null;
  error: string | null;
  state: any; // Store state snapshot
  completed?: boolean;
}

interface QueueStatus {
  pending: number;
  failed: number;
  total: number;
  isProcessing: boolean;
  oldestPending?: number;
  items: QueueItem[];
}

interface SyncService {
  sync(): Promise<any>;
}

/**
 * Manages a queue of sync operations for offline support and retry logic
 * Persists queue to AsyncStorage for recovery after app restart
 */
class SyncQueue {
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private initialized: boolean = false;
  private listeners: Set<(status: QueueStatus) => void> = new Set();

  /**
   * Initialize the queue from storage
   * Restores any pending sync operations from previous sessions
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
      this.initialized = true;
    } catch (error) {
      this.queue = [];
      this.initialized = true;
    }
  }

  /**
   * Add a sync operation to the queue
   * @param operation - The sync operation to queue
   * @returns The ID of the queued item
   */
  async enqueue(operation: QueueOperation): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Create queue item with metadata
    const queueItem: QueueItem = {
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

    return queueItem.id;
  }

  /**
   * Get all pending operations
   * @returns Array of pending queue items
   */
  getPending(): QueueItem[] {
    return this.queue.filter(item => 
      item.attempts < MAX_RETRY_ATTEMPTS && 
      !item.completed
    );
  }

  /**
   * Get failed operations (exceeded retry limit)
   * @returns Array of failed queue items
   */
  getFailed(): QueueItem[] {
    return this.queue.filter(item => 
      item.attempts >= MAX_RETRY_ATTEMPTS && 
      !item.completed
    );
  }

  /**
   * Process the queue
   * Attempts to sync all pending items with exponential backoff
   * @param syncService - The sync service to use for processing
   */
  async process(syncService: SyncService): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get items that can be retried
      const pending = this.getPending();
      
      for (const item of pending) {
        try {
          // Check if we should retry based on backoff
          if (!this.shouldRetry(item)) {
            continue;
          }

          // Update attempt info
          item.attempts++;
          item.lastAttempt = Date.now();
          
          // Attempt sync
          await syncService.sync();
          
          // Mark as completed
          item.completed = true;
          item.error = null;

        } catch (error: any) {
          item.error = error.message || 'Sync failed';
          
          // If it's a network error, we'll retry later
          if (this.isNetworkError(error)) {
            // Network error - will retry with backoff
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
   * @param item - The queue item to check
   * @returns True if enough time has passed for retry
   */
  shouldRetry(item: QueueItem): boolean {
    if (item.attempts === 0) return true;
    
    const backoffMs = Math.min(
      1000 * Math.pow(2, item.attempts - 1), // Exponential backoff
      300000 // Max 5 minutes
    );
    
    const timeSinceLastAttempt = Date.now() - (item.lastAttempt || 0);
    return timeSinceLastAttempt >= backoffMs;
  }

  /**
   * Check if error is network-related
   * @param error - The error to check
   * @returns True if error appears to be network-related
   */
  isNetworkError(error: Error | any): boolean {
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
   * Clear the entire queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.persist();
    this.notifyListeners();
  }

  /**
   * Clear failed items from the queue
   */
  async clearFailed(): Promise<void> {
    this.queue = this.queue.filter(item => 
      item.attempts < MAX_RETRY_ATTEMPTS || item.completed
    );
    await this.persist();
    this.notifyListeners();
  }

  /**
   * Retry a specific item by resetting its attempt counter
   * @param itemId - The ID of the item to retry
   */
  async retry(itemId: string): Promise<void> {
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
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      // Silent fail - queue will be lost on restart but app continues
    }
  }

  /**
   * Add a listener for queue changes
   * @param callback - Function to call when queue changes
   * @returns Unsubscribe function
   */
  addListener(callback: (status: QueueStatus) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        // Ignore listener errors
      }
    });
  }

  /**
   * Get current queue status
   * @returns Status object with queue metrics
   */
  getStatus(): QueueStatus {
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