/**
 * Privacy-preserving event logger for sync debugging
 * Logs metadata and operations without exposing user content
 */

class EventLogger {
  constructor() {
    this.enabled = false; // Can be enabled via settings or dev mode
    this.events = []; // Circular buffer of recent events
    this.maxEvents = 100;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      console.log('[SYNC_DEBUG] Logging enabled - no user content will be logged');
    }
  }

  /**
   * Hash function for privacy (simple hash for debugging)
   */
  hashId(id) {
    if (!id) return 'null';
    // Simple hash that preserves uniqueness for debugging
    return id.substring(0, 8);
  }

  /**
   * Log a sync event with metadata only
   */
  log(category, action, metadata = {}) {
    if (!this.enabled) return;

    const event = {
      timestamp: Date.now(),
      category,
      action,
      ...this.sanitizeMetadata(metadata)
    };

    // Add to circular buffer
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Format and output
    const logMessage = this.formatLogMessage(event);
    console.log(logMessage);
  }

  /**
   * Sanitize metadata to remove any user content
   */
  sanitizeMetadata(metadata) {
    const sanitized = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      switch (key) {
        case 'activityId':
        case 'userId':
        case 'syncId':
          sanitized[key] = this.hashId(value);
          break;
        
        case 'text':
        case 'name':
        case 'content':
          // Never log actual content
          sanitized[`has${key.charAt(0).toUpperCase() + key.slice(1)}`] = !!value;
          if (typeof value === 'string') {
            sanitized[`${key}Length`] = value.length;
          }
          break;
        
        case 'completed':
        case 'deleted':
        case 'pinned':
          sanitized[key] = !!value;
          break;
        
        case 'timestamp':
        case 'modifiedAt':
        case 'completedAt':
        case 'uncompletedAt':
        case 'version':
          sanitized[key] = value;
          break;
        
        case 'device':
        case 'deviceId':
          sanitized.device = value ? this.hashId(value) : 'unknown';
          break;
        
        case 'activities':
          if (Array.isArray(value)) {
            sanitized.activityCount = value.length;
            sanitized.completedCount = value.filter(a => a.completed).length;
          }
          break;
        
        case 'users':
          if (typeof value === 'object') {
            sanitized.userCount = Object.keys(value).length;
          }
          break;
        
        case 'dataSize':
        case 'compressedSize':
        case 'encryptedSize':
          sanitized[key] = value;
          break;
        
        case 'conflict':
          sanitized.conflictType = value?.type || 'unknown';
          sanitized.resolution = value?.resolution || 'unknown';
          break;
        
        case 'error':
          sanitized.errorType = value?.name || 'unknown';
          sanitized.errorMessage = value?.message?.substring(0, 50) || 'unknown';
          break;
        
        default:
          // Only include if it's a safe type
          if (typeof value === 'boolean' || typeof value === 'number') {
            sanitized[key] = value;
          } else if (typeof value === 'string' && value.length < 20) {
            // Short strings that might be status/type indicators
            sanitized[key] = value;
          }
      }
    }
    
    return sanitized;
  }

  /**
   * Format log message for console output
   */
  formatLogMessage(event) {
    const { timestamp, category, action, ...metadata } = event;
    const time = new Date(timestamp).toISOString().substring(11, 23);
    
    // Build metadata string
    const metaStr = Object.entries(metadata)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
    
    return `[SYNC ${time}] ${category}:${action} ${metaStr}`;
  }

  /**
   * Log sync operation
   */
  logSync(action, metadata) {
    this.log('SYNC', action, metadata);
  }

  /**
   * Log activity operation
   */
  logActivity(action, metadata) {
    this.log('ACTIVITY', action, metadata);
  }

  /**
   * Log conflict resolution
   */
  logConflict(action, metadata) {
    this.log('CONFLICT', action, metadata);
  }

  /**
   * Log network operation
   */
  logNetwork(action, metadata) {
    this.log('NETWORK', action, metadata);
  }

  /**
   * Log timing information
   */
  logTiming(action, metadata) {
    this.log('TIMING', action, metadata);
  }

  /**
   * Get recent events for debugging
   */
  getRecentEvents() {
    return [...this.events];
  }

  /**
   * Export events for analysis
   */
  exportEvents() {
    return {
      startTime: this.events[0]?.timestamp,
      endTime: this.events[this.events.length - 1]?.timestamp,
      eventCount: this.events.length,
      events: this.events.map(e => ({
        ...e,
        relativeTime: e.timestamp - this.events[0].timestamp
      }))
    };
  }

  /**
   * Clear event history
   */
  clear() {
    this.events = [];
    console.log('[SYNC_DEBUG] Event history cleared');
  }
}

// Export singleton instance
const eventLogger = new EventLogger();

// Enable in development mode
if (__DEV__) {
  eventLogger.setEnabled(true);
}

export default eventLogger;