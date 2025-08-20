// @ts-check
/**
 * State Debugger - Track what's changing your state
 */

class StateDebugger {
  constructor() {
    this.enabled = false;
    this.history = [];
    this.stores = null;
  }

  enable() {
    if (this.enabled) return;
    
    console.log('🔍 STATE DEBUGGER ENABLED');
    console.log('Tracking all state changes...');
    
    this.enabled = true;
    
    // Import stores
    const userStore = require('../stores/useUserStore.js').default;
    const settingsStore = require('../stores/useSettingsStore.js').default;
    const appStore = require('../stores/useAppStore.js').default;
    
    // Store original setState methods
    this.originalSetState = {
      user: userStore.setState,
      settings: settingsStore.setState,
      app: appStore.setState,
    };
    
    // Wrap setState to track changes
    const self = this;
    
    userStore.setState = function(partial, replace, action) {
      const before = userStore.getState();
      console.trace('📝 USER STORE CHANGE:', action || 'unknown');
      
      // Get stack trace
      const stack = new Error().stack;
      
      // Call original
      self.originalSetState.user.call(this, partial, replace, action);
      
      const after = userStore.getState();
      
      // Log specific changes
      if (typeof partial === 'function') {
        console.log('  Function update');
      } else {
        Object.keys(partial).forEach(key => {
          if (key === 'users') {
            // Check for activity changes
            const beforeUsers = before.users || {};
            const afterUsers = after.users || {};
            
            Object.keys(afterUsers).forEach(userId => {
              const beforeDays = beforeUsers[userId]?.days || {};
              const afterDays = afterUsers[userId]?.days || {};
              
              Object.keys(afterDays).forEach(day => {
                const beforeActivities = beforeDays[day]?.activities || [];
                const afterActivities = afterDays[day]?.activities || [];
                
                if (JSON.stringify(beforeActivities) !== JSON.stringify(afterActivities)) {
                  console.log(`  ⚠️ ACTIVITIES CHANGED for user ${userId} day ${day}`);
                  console.log(`    Before: ${beforeActivities.length} activities`);
                  console.log(`    After: ${afterActivities.length} activities`);
                  
                  // Check completion status changes
                  afterActivities.forEach((activity, i) => {
                    const beforeActivity = beforeActivities[i];
                    if (beforeActivity && beforeActivity.completed !== activity.completed) {
                      console.log(`    🔄 Activity "${activity.text || activity.name}" completion: ${beforeActivity.completed} → ${activity.completed}`);
                    }
                  });
                }
              });
            });
          } else {
            console.log(`  Changed: ${key}`);
          }
        });
      }
      
      self.history.push({
        store: 'user',
        action,
        timestamp: Date.now(),
        stack: stack.split('\n').slice(2, 5).join('\n'),
      });
    };
    
    appStore.setState = function(partial, replace, action) {
      console.trace('📝 APP STORE CHANGE:', action || 'unknown');
      
      // Get stack trace
      const stack = new Error().stack;
      
      // Check for activities changes
      if (partial.activities) {
        const before = appStore.getState().activities || [];
        console.log(`  Activities: ${before.length} → ${partial.activities.length}`);
        
        // Check completion changes
        partial.activities.forEach((activity, i) => {
          const beforeActivity = before[i];
          if (beforeActivity && beforeActivity.completed !== activity.completed) {
            console.log(`  🔄 Activity "${activity.text || activity.name}" completion: ${beforeActivity.completed} → ${activity.completed}`);
          }
        });
      }
      
      // Call original
      self.originalSetState.app.call(this, partial, replace, action);
      
      self.history.push({
        store: 'app',
        action,
        timestamp: Date.now(),
        stack: stack.split('\n').slice(2, 5).join('\n'),
      });
    };
  }

  disable() {
    if (!this.enabled) return;
    
    // Restore original setState methods
    const userStore = require('../stores/useUserStore.js').default;
    const settingsStore = require('../stores/useSettingsStore.js').default;
    const appStore = require('../stores/useAppStore.js').default;
    
    userStore.setState = this.originalSetState.user;
    settingsStore.setState = this.originalSetState.settings;
    appStore.setState = this.originalSetState.app;
    
    this.enabled = false;
    console.log('🔍 STATE DEBUGGER DISABLED');
  }

  showHistory() {
    console.log('=== STATE CHANGE HISTORY ===');
    this.history.slice(-20).forEach((entry, i) => {
      console.log(`\n${i + 1}. [${entry.store}] ${entry.action || 'unknown'}`);
      console.log(`   Time: ${new Date(entry.timestamp).toLocaleTimeString()}`);
      console.log('   Stack:', entry.stack);
    });
  }
}

const stateDebugger = new StateDebugger();

// Add to window for debugging
if (typeof window !== 'undefined') {
  window.stateDebugger = stateDebugger;
  window.trackStateChanges = () => stateDebugger.enable();
  window.stopTrackingState = () => stateDebugger.disable();
  
  console.log('💡 To track state changes: trackStateChanges()');
}

export default stateDebugger;