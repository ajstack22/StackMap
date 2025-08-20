// @ts-check
/**
 * Sync Debugger - Provides detailed visibility into sync operations
 * Enable with: window.SYNC_DEBUG = true (web) or global.SYNC_DEBUG = true (native)
 */

class SyncDebugger {
  constructor() {
    this.enabled = false;
    this.history = [];
    this.maxHistory = 50;
    this.logToConsole = true;
    this.logToFile = false;
  }

  enable() {
    this.enabled = true;
    console.log('🔍 SYNC DEBUG ENABLED - All sync operations will be logged');
    console.log('To disable: syncDebugger.disable()');
    console.log('To see history: syncDebugger.showHistory()');
    console.log('To export: syncDebugger.exportLogs()');
  }

  disable() {
    this.enabled = false;
    console.log('🔍 SYNC DEBUG DISABLED');
  }

  log(category, message, data = {}) {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      category,
      message,
      data: this.sanitizeData(data),
    };

    // Add to history
    this.history.unshift(entry);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    // Log to console
    if (this.logToConsole) {
      const color = this.getCategoryColor(category);
      console.log(
        `%c[SYNC-${category}] ${timestamp.split('T')[1].split('.')[0]} ${message}`,
        `color: ${color}; font-weight: bold`,
        data
      );
    }
  }

  sanitizeData(data) {
    // Remove sensitive info but keep structure
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Show data structure without actual values
    if (sanitized.users) {
      Object.keys(sanitized.users).forEach(userId => {
        const user = sanitized.users[userId];
        if (user.days) {
          Object.keys(user.days).forEach(day => {
            if (user.days[day]?.activities) {
              sanitized.users[userId].days[day] = {
                activityCount: user.days[day].activities.length,
                activities: user.days[day].activities.map(a => ({
                  id: a.id,
                  text: a.text ? '✓' : a.name ? '⚠️ name' : a.title ? '⚠️ title' : '❌',
                  icon: a.icon ? '✓' : a.emoji ? '⚠️ emoji' : '❌',
                  completed: a.completed || false,
                }))
              };
            }
          });
        }
        // Show field presence
        sanitized.users[userId] = {
          ...sanitized.users[userId],
          name: user.name ? (typeof user.name === 'string' ? '✓' : '⚠️ object') : '❌',
          icon: user.icon ? '✓' : (user.emoji ? '⚠️ emoji' : '❌'),
        };
      });
    }

    return sanitized;
  }

  getCategoryColor(category) {
    const colors = {
      'PUSH': '#4CAF50',
      'PULL': '#2196F3',
      'MERGE': '#FF9800',
      'CONFLICT': '#f44336',
      'ERROR': '#f44336',
      'STATE': '#9C27B0',
      'NETWORK': '#00BCD4',
      'ENCRYPT': '#607D8B',
      'DECISION': '#FFC107',
    };
    return colors[category] || '#888';
  }

  logPush(localState, encryptedSize) {
    this.log('PUSH', 'Pushing local state to server', {
      version: localState.version,
      lastModified: localState.lastModified,
      userCount: Object.keys(localState.users || {}).length,
      encryptedSize: `${Math.round(encryptedSize / 1024)}KB`,
      users: localState.users,
    });
  }

  logPull(remoteData, localVersion) {
    this.log('PULL', 'Received remote data', {
      remoteVersion: remoteData?.version,
      localVersion,
      versionDiff: remoteData ? remoteData.version - localVersion : 0,
      type: remoteData?.type || 'full',
      hasData: !!remoteData,
    });
  }

  logMergeDecision(decision, localState, remoteState, field) {
    this.log('DECISION', `Merge decision for ${field}`, {
      decision,
      field,
      localValue: this.summarizeValue(localState[field]),
      remoteValue: this.summarizeValue(remoteState[field]),
      localTimestamp: localState.lastModified,
      remoteTimestamp: remoteState.lastModified,
    });
  }

  logConflict(field, localValue, remoteValue, resolution) {
    this.log('CONFLICT', `Conflict detected in ${field}`, {
      field,
      localValue: this.summarizeValue(localValue),
      remoteValue: this.summarizeValue(remoteValue),
      resolution,
    });
  }

  summarizeValue(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`;
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      return `Object{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', ...' : ''}}`;
    }
    return typeof value;
  }

  showHistory() {
    console.log('=== SYNC DEBUG HISTORY ===');
    this.history.forEach((entry, i) => {
      console.log(`\n--- Entry ${i + 1} ---`);
      console.log(`Time: ${entry.timestamp}`);
      console.log(`Category: ${entry.category}`);
      console.log(`Message: ${entry.message}`);
      console.log('Data:', entry.data);
    });
  }

  exportLogs() {
    const logs = JSON.stringify(this.history, null, 2);
    if (typeof window !== 'undefined') {
      // Web - download as file
      const blob = new Blob([logs], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sync-debug-${Date.now()}.json`;
      a.click();
    } else {
      // Native - copy to clipboard
      console.log('Copy the following logs:');
      console.log(logs);
    }
    return logs;
  }

  compareStates(state1, state2, label1 = 'State 1', label2 = 'State 2') {
    console.log(`\n=== COMPARING ${label1} vs ${label2} ===`);
    
    // Compare users
    const users1 = Object.keys(state1.users || {});
    const users2 = Object.keys(state2.users || {});
    const allUsers = new Set([...users1, ...users2]);
    
    console.log(`Users in ${label1}: ${users1.length}, ${label2}: ${users2.length}`);
    
    allUsers.forEach(userId => {
      const user1 = state1.users?.[userId];
      const user2 = state2.users?.[userId];
      
      if (!user1) {
        console.log(`  User ${userId}: Only in ${label2}`);
      } else if (!user2) {
        console.log(`  User ${userId}: Only in ${label1}`);
      } else {
        // Compare days
        const days1 = Object.keys(user1.days || {});
        const days2 = Object.keys(user2.days || {});
        const allDays = new Set([...days1, ...days2]);
        
        allDays.forEach(day => {
          const activities1 = user1.days?.[day]?.activities?.length || 0;
          const activities2 = user2.days?.[day]?.activities?.length || 0;
          
          if (activities1 !== activities2) {
            console.log(`  User ${userId}, Day ${day}: ${label1}=${activities1} activities, ${label2}=${activities2} activities`);
          }
        });
      }
    });
    
    // Compare other fields
    const fields = ['currentUser', 'currentDay', 'currentTheme', 'version', 'lastModified'];
    fields.forEach(field => {
      if (state1[field] !== state2[field]) {
        console.log(`  ${field}: ${label1}=${state1[field]}, ${label2}=${state2[field]}`);
      }
    });
  }
}

// Create singleton instance
const syncDebugger = new SyncDebugger();

// Auto-enable in development
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  // Check for debug flag
  if ((typeof window !== 'undefined' && window.SYNC_DEBUG) || 
      (typeof global !== 'undefined' && global.SYNC_DEBUG)) {
    syncDebugger.enable();
  }
}

// Export for use
export default syncDebugger;