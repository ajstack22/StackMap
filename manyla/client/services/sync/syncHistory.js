import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = '@sync_history';
const MAX_HISTORY_ITEMS = 100;

class SyncHistory {
  constructor() {
    this.history = [];
    this.initialized = false;
  }

  /**
   * Initialize history from storage
   */
  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load sync history:', error);
      this.history = [];
      this.initialized = true;
    }
  }

  /**
   * Add a sync event to history
   */
  async addEvent(event) {
    if (!this.initialized) {
      await this.initialize();
    }

    const historyItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: event.type || 'sync',
      success: event.success !== false,
      ...event
    };

    // Add to history
    this.history.unshift(historyItem);

    // Limit history size
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
    }

    // Persist
    await this.persist();

    return historyItem;
  }

  /**
   * Add sync operation
   */
  async addSync(details) {
    return this.addEvent({
      type: 'sync',
      direction: details.direction || 'both', // push, pull, both
      dataSize: details.dataSize,
      duration: details.duration,
      changes: details.changes,
      compressed: details.compressed,
      incremental: details.incremental,
      version: details.version,
      success: details.success,
      error: details.error
    });
  }

  /**
   * Add conflict event
   */
  async addConflict(details) {
    return this.addEvent({
      type: 'conflict',
      conflicts: details.conflicts,
      resolved: details.resolved,
      pending: details.pending,
      resolutionStrategy: details.strategy,
      fields: details.fields
    });
  }

  /**
   * Add error event
   */
  async addError(details) {
    return this.addEvent({
      type: 'error',
      errorType: details.errorType,
      message: details.message,
      retryable: details.retryable,
      networkError: details.networkError,
      success: false
    });
  }

  /**
   * Get history with filters
   */
  getHistory(options = {}) {
    const {
      limit = 50,
      type = null,
      startDate = null,
      endDate = null,
      successOnly = false
    } = options;

    let filtered = [...this.history];

    // Filter by type
    if (type) {
      filtered = filtered.filter(item => item.type === type);
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(item => item.timestamp >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(item => item.timestamp <= endDate);
    }

    // Filter by success
    if (successOnly) {
      filtered = filtered.filter(item => item.success);
    }

    // Apply limit
    return filtered.slice(0, limit);
  }

  /**
   * Get sync statistics
   */
  getStatistics(timeRange = 86400000) { // Default 24 hours
    const cutoff = Date.now() - timeRange;
    const recentHistory = this.history.filter(item => item.timestamp >= cutoff);

    const stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflicts: 0,
      resolvedConflicts: 0,
      pendingConflicts: 0,
      errors: 0,
      networkErrors: 0,
      averageSyncTime: 0,
      dataTransferred: 0,
      compressionSavings: 0
    };

    let totalSyncTime = 0;
    let syncCount = 0;

    for (const item of recentHistory) {
      switch (item.type) {
        case 'sync':
          stats.totalSyncs++;
          if (item.success) {
            stats.successfulSyncs++;
            if (item.duration) {
              totalSyncTime += item.duration;
              syncCount++;
            }
            if (item.dataSize) {
              stats.dataTransferred += item.dataSize;
            }
          } else {
            stats.failedSyncs++;
          }
          break;

        case 'conflict':
          stats.conflicts += item.conflicts || 0;
          stats.resolvedConflicts += item.resolved || 0;
          stats.pendingConflicts += item.pending || 0;
          break;

        case 'error':
          stats.errors++;
          if (item.networkError) {
            stats.networkErrors++;
          }
          break;
      }
    }

    // Calculate averages
    if (syncCount > 0) {
      stats.averageSyncTime = Math.round(totalSyncTime / syncCount);
    }

    // Calculate success rate
    stats.successRate = stats.totalSyncs > 0 
      ? Math.round((stats.successfulSyncs / stats.totalSyncs) * 100) 
      : 100;

    return stats;
  }

  /**
   * Get conflict history
   */
  getConflictHistory(limit = 20) {
    return this.history
      .filter(item => item.type === 'conflict')
      .slice(0, limit);
  }

  /**
   * Get last successful sync
   */
  getLastSuccessfulSync() {
    return this.history.find(item => 
      item.type === 'sync' && item.success
    );
  }

  /**
   * Clear history
   */
  async clearHistory() {
    this.history = [];
    await AsyncStorage.removeItem(HISTORY_KEY);
  }

  /**
   * Persist history to storage
   */
  async persist() {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to persist sync history:', error);
    }
  }

  /**
   * Export history for debugging
   */
  exportHistory() {
    return {
      version: 1,
      exported: new Date().toISOString(),
      itemCount: this.history.length,
      statistics: this.getStatistics(Infinity),
      history: this.history
    };
  }
}

export default new SyncHistory();