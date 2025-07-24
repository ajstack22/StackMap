import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../stores';

const CHANGE_LOG_KEY = '@sync_change_log';
const MAX_CHANGES = 1000; // Prevent unbounded growth

class ChangeTracker {
  constructor() {
    this.changes = [];
    this.lastSyncedState = null;
    this.tracking = false;
    this.unsubscribe = null;
  }

  /**
   * Start tracking changes
   */
  async startTracking() {
    if (this.tracking) return;

    // Load existing changes
    try {
      const stored = await AsyncStorage.getItem(CHANGE_LOG_KEY);
      if (stored) {
        this.changes = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load change log:', error);
    }

    // Subscribe to store changes
    this.unsubscribe = useAppStore.subscribe(
      (state) => this.recordChange(state),
      (state) => state // Subscribe to all state changes
    );

    this.tracking = true;
    console.log('ChangeTracker: Started tracking');
  }

  /**
   * Stop tracking changes
   */
  stopTracking() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.tracking = false;
    console.log('ChangeTracker: Stopped tracking');
  }

  /**
   * Record a state change
   */
  recordChange(newState) {
    if (!this.tracking) return;

    // Create change record
    const change = {
      timestamp: Date.now(),
      type: 'state_update',
      changes: this.detectChanges(this.lastSyncedState, newState)
    };

    // Only record if there are actual changes
    if (change.changes.length > 0) {
      this.changes.push(change);
      
      // Limit change log size
      if (this.changes.length > MAX_CHANGES) {
        this.changes = this.changes.slice(-MAX_CHANGES);
      }

      // Persist changes
      this.persistChanges();
    }

    this.lastSyncedState = this.cloneState(newState);
  }

  /**
   * Detect what changed between two states
   */
  detectChanges(oldState, newState) {
    const changes = [];
    
    if (!oldState) {
      changes.push({ path: 'full_state', type: 'initial' });
      return changes;
    }

    // Check each relevant field
    const fieldsToTrack = [
      'activities',
      'users',
      'completedActivities',
      'currentUser',
      'currentTheme',
      'bannerPosition',
      'soundEnabled',
      'taskCelebration',
      'routineCelebration',
      'currentDay'
    ];

    for (const field of fieldsToTrack) {
      if (JSON.stringify(oldState[field]) !== JSON.stringify(newState[field])) {
        changes.push({
          path: field,
          type: 'update',
          oldValue: oldState[field],
          newValue: newState[field]
        });
      }
    }

    return changes;
  }

  /**
   * Get changes since last sync
   */
  getChangesSince(lastSyncTime) {
    return this.changes.filter(change => change.timestamp > lastSyncTime);
  }

  /**
   * Create incremental update from changes
   */
  createIncrementalUpdate(lastSyncTime) {
    const relevantChanges = this.getChangesSince(lastSyncTime);
    
    if (relevantChanges.length === 0) {
      return null;
    }

    // Merge all changes into a single update
    const update = {
      type: 'incremental',
      timestamp: Date.now(),
      changes: relevantChanges,
      patch: this.createPatch(relevantChanges)
    };

    return update;
  }

  /**
   * Create a patch object from changes
   */
  createPatch(changes) {
    const patch = {};
    
    for (const change of changes) {
      if (change.changes) {
        // Nested changes
        for (const subChange of change.changes) {
          if (subChange.newValue !== undefined) {
            patch[subChange.path] = subChange.newValue;
          }
        }
      }
    }

    return patch;
  }

  /**
   * Clear changes after successful sync
   */
  async clearChanges() {
    this.changes = [];
    await AsyncStorage.removeItem(CHANGE_LOG_KEY);
  }

  /**
   * Mark current state as synced
   */
  markAsSynced() {
    this.lastSyncedState = this.cloneState(useAppStore.getState());
    this.clearChanges();
  }

  /**
   * Persist changes to storage
   */
  async persistChanges() {
    try {
      await AsyncStorage.setItem(CHANGE_LOG_KEY, JSON.stringify(this.changes));
    } catch (error) {
      console.error('Failed to persist change log:', error);
    }
  }

  /**
   * Clone state for comparison
   */
  cloneState(state) {
    if (!state) return null;
    
    // Only clone relevant fields
    return {
      activities: state.activities,
      users: state.users,
      completedActivities: state.completedActivities,
      currentUser: state.currentUser,
      currentTheme: state.currentTheme,
      bannerPosition: state.bannerPosition,
      soundEnabled: state.soundEnabled,
      taskCelebration: state.taskCelebration,
      routineCelebration: state.routineCelebration,
      currentDay: state.currentDay
    };
  }

  /**
   * Check if we should use incremental sync
   */
  shouldUseIncremental(lastSyncTime) {
    const changes = this.getChangesSince(lastSyncTime);
    
    // Use incremental if:
    // 1. We have a small number of changes
    // 2. The changes are recent (within last hour)
    // 3. We have a valid lastSyncedState
    
    const isSmallUpdate = changes.length < 50;
    const isRecent = Date.now() - lastSyncTime < 3600000; // 1 hour
    const hasBaseline = this.lastSyncedState !== null;
    
    return isSmallUpdate && isRecent && hasBaseline;
  }
}

export default new ChangeTracker();