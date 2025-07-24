class SyncThrottle {
  constructor() {
    this.lastSyncTime = 0;
    this.pendingSync = null;
    this.syncTimeout = null;
    this.minSyncInterval = 5000; // Minimum 5 seconds between syncs
    this.debounceDelay = 2000; // Wait 2 seconds after last change
    this.maxDebounceWait = 10000; // Max 10 seconds wait
    this.debounceStartTime = 0;
    this.syncInProgress = false;
  }

  /**
   * Request a sync with throttling and debouncing
   */
  async requestSync(syncFunction, options = {}) {
    const { 
      immediate = false, 
      priority = 'normal' 
    } = options;

    // If sync is in progress, queue this request
    if (this.syncInProgress) {
      console.log('SyncThrottle: Sync in progress, queueing request');
      return this.queueSync(syncFunction, options);
    }

    // Check throttle for immediate syncs
    if (immediate) {
      const timeSinceLastSync = Date.now() - this.lastSyncTime;
      if (timeSinceLastSync < this.minSyncInterval) {
        console.log(`SyncThrottle: Throttled, wait ${this.minSyncInterval - timeSinceLastSync}ms`);
        return this.scheduleSync(syncFunction, this.minSyncInterval - timeSinceLastSync, options);
      }
      
      // Execute immediate sync
      return this.executeSync(syncFunction);
    }

    // Debounce normal syncs
    return this.debounceSync(syncFunction, options);
  }

  /**
   * Debounce sync requests
   */
  debounceSync(syncFunction, options) {
    // Clear existing timeout
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Track debounce start time
    if (!this.debounceStartTime) {
      this.debounceStartTime = Date.now();
    }

    // Calculate delay
    const elapsed = Date.now() - this.debounceStartTime;
    const remainingMaxWait = Math.max(0, this.maxDebounceWait - elapsed);
    const delay = Math.min(this.debounceDelay, remainingMaxWait);

    // If we've hit max wait time, sync immediately
    if (delay === 0) {
      this.debounceStartTime = 0;
      return this.executeSync(syncFunction);
    }

    // Schedule debounced sync
    return new Promise((resolve, reject) => {
      this.syncTimeout = setTimeout(async () => {
        this.debounceStartTime = 0;
        try {
          const result = await this.executeSync(syncFunction);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  /**
   * Queue a sync request
   */
  queueSync(syncFunction, options) {
    if (!this.pendingSync) {
      this.pendingSync = { syncFunction, options };
    } else if (options.priority === 'high') {
      // Replace with high priority sync
      this.pendingSync = { syncFunction, options };
    }

    return new Promise((resolve) => {
      // Will be executed after current sync
      const checkInterval = setInterval(() => {
        if (!this.syncInProgress && this.pendingSync) {
          clearInterval(checkInterval);
          const pending = this.pendingSync;
          this.pendingSync = null;
          this.requestSync(pending.syncFunction, pending.options).then(resolve);
        }
      }, 100);
    });
  }

  /**
   * Schedule a sync for later
   */
  scheduleSync(syncFunction, delay, options) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await this.requestSync(syncFunction, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  /**
   * Execute the sync
   */
  async executeSync(syncFunction) {
    // Check throttle one more time
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    if (timeSinceLastSync < this.minSyncInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minSyncInterval - timeSinceLastSync)
      );
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      console.log('SyncThrottle: Executing sync');
      const result = await syncFunction();
      
      this.lastSyncTime = Date.now();
      const duration = this.lastSyncTime - startTime;
      console.log(`SyncThrottle: Sync completed in ${duration}ms`);
      
      // Process any pending sync
      if (this.pendingSync) {
        const pending = this.pendingSync;
        this.pendingSync = null;
        setTimeout(() => {
          this.requestSync(pending.syncFunction, pending.options);
        }, 100);
      }
      
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Reset throttle state
   */
  reset() {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
    this.lastSyncTime = 0;
    this.pendingSync = null;
    this.debounceStartTime = 0;
    this.syncInProgress = false;
  }

  /**
   * Get throttle status
   */
  getStatus() {
    return {
      lastSyncTime: this.lastSyncTime,
      timeSinceLastSync: Date.now() - this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      hasPendingSync: !!this.pendingSync,
      isDebouncing: !!this.syncTimeout
    };
  }

  /**
   * Update throttle settings
   */
  updateSettings(settings) {
    if (settings.minSyncInterval !== undefined) {
      this.minSyncInterval = Math.max(1000, settings.minSyncInterval);
    }
    if (settings.debounceDelay !== undefined) {
      this.debounceDelay = Math.max(500, settings.debounceDelay);
    }
    if (settings.maxDebounceWait !== undefined) {
      this.maxDebounceWait = Math.max(this.debounceDelay * 2, settings.maxDebounceWait);
    }
  }
}

export default new SyncThrottle();