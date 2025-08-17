import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../../stores';

const CHANGE_LOG_KEY = '@sync_change_log';
const MAX_CHANGES = 1000; // Prevent unbounded growth

// Types for change tracking
interface Change {
  path: string;
  type: 'initial' | 'update';
  oldValue?: any;
  newValue?: any;
}

interface ChangeRecord {
  timestamp: number;
  type: string;
  changes: Change[];
}

interface IncrementalUpdate {
  type: 'incremental';
  timestamp: number;
  changes: ChangeRecord[];
  patch: Record<string, any>;
}

interface TrackedState {
  activities?: any;
  users?: any;
  currentUser?: string;
  currentTheme?: string;
  bannerPosition?: string;
  soundEnabled?: boolean;
  taskCelebration?: string;
  routineCelebration?: string;
  currentDay?: string;
}

/**
 * Tracks changes to app state for incremental sync operations
 * Maintains a log of changes since the last successful sync
 */
class ChangeTracker {
  private changes: ChangeRecord[] = [];
  private lastSyncedState: TrackedState | null = null;
  private tracking: boolean = false;
  private unsubscribe: (() => void) | null = null;

  /**
   * Start tracking changes to the app store
   * Loads existing changes from storage and subscribes to state updates
   */
  async startTracking(): Promise<void> {
    if (this.tracking) return;

    // Load existing changes
    try {
      const stored = await AsyncStorage.getItem(CHANGE_LOG_KEY);
      if (stored) {
        this.changes = JSON.parse(stored);
      }
    } catch (error) {
      // Silent fail - start with empty changes
    }

    // Subscribe to store changes
    this.unsubscribe = useAppStore.subscribe(state => this.recordChange(state));

    this.tracking = true;
  }

  /**
   * Stop tracking changes
   * Unsubscribes from store updates
   */
  stopTracking(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.tracking = false;
  }

  /**
   * Record a state change
   * Detects what changed and adds it to the change log
   * @param newState - The new state after the change
   */
  private recordChange(newState: any): void {
    if (!this.tracking) return;

    // Create change record
    const change: ChangeRecord = {
      timestamp: Date.now(),
      type: 'state_update',
      changes: this.detectChanges(this.lastSyncedState, newState),
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
   * @param oldState - The previous state
   * @param newState - The current state
   * @returns Array of detected changes
   */
  private detectChanges(
    oldState: TrackedState | null,
    newState: any,
  ): Change[] {
    const changes: Change[] = [];

    if (!oldState) {
      changes.push({ path: 'full_state', type: 'initial' });
      return changes;
    }

    // Check each relevant field
    const fieldsToTrack: (keyof TrackedState)[] = [
      'activities',
      'users',
      'currentUser',
      'currentTheme',
      'bannerPosition',
      'soundEnabled',
      'taskCelebration',
      'routineCelebration',
      'currentDay',
    ];

    for (const field of fieldsToTrack) {
      if (JSON.stringify(oldState[field]) !== JSON.stringify(newState[field])) {
        changes.push({
          path: field,
          type: 'update',
          oldValue: oldState[field],
          newValue: newState[field],
        });
      }
    }

    return changes;
  }

  /**
   * Get changes since last sync
   * @param lastSyncTime - Timestamp of last successful sync
   * @returns Array of changes since the specified time
   */
  getChangesSince(lastSyncTime: number): ChangeRecord[] {
    return this.changes.filter(change => change.timestamp > lastSyncTime);
  }

  /**
   * Create incremental update from changes
   * @param lastSyncTime - Timestamp of last successful sync
   * @returns Incremental update object or null if no changes
   */
  createIncrementalUpdate(lastSyncTime: number): IncrementalUpdate | null {
    const relevantChanges = this.getChangesSince(lastSyncTime);

    if (relevantChanges.length === 0) {
      return null;
    }

    // Merge all changes into a single update
    const update: IncrementalUpdate = {
      type: 'incremental',
      timestamp: Date.now(),
      changes: relevantChanges,
      patch: this.createPatch(relevantChanges),
    };

    return update;
  }

  /**
   * Create a patch object from changes
   * Merges all changes into a single patch object
   * @param changes - Array of change records
   * @returns Patch object with field updates
   */
  private createPatch(changes: ChangeRecord[]): Record<string, any> {
    const patch: Record<string, any> = {};

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
   * Removes all changes from memory and storage
   */
  async clearChanges(): Promise<void> {
    this.changes = [];
    await AsyncStorage.removeItem(CHANGE_LOG_KEY);
  }

  /**
   * Mark current state as synced
   * Updates the baseline state and clears the change log
   */
  markAsSynced(): void {
    this.lastSyncedState = this.cloneState(useAppStore.getState());
    this.clearChanges();
  }

  /**
   * Persist changes to storage
   * Saves the change log to AsyncStorage for recovery
   */
  private async persistChanges(): Promise<void> {
    try {
      await AsyncStorage.setItem(CHANGE_LOG_KEY, JSON.stringify(this.changes));
    } catch (error) {
      // Silent fail - changes will be lost on restart
    }
  }

  /**
   * Clone state for comparison
   * Creates a snapshot of relevant state fields
   * @param state - The state to clone
   * @returns Cloned state with tracked fields only
   */
  private cloneState(state: any): TrackedState | null {
    if (!state) return null;

    // Only clone relevant fields
    return {
      activities: state.activities,
      users: state.users,
      currentUser: state.currentUser,
      currentTheme: state.currentTheme,
      bannerPosition: state.bannerPosition,
      soundEnabled: state.soundEnabled,
      taskCelebration: state.taskCelebration,
      routineCelebration: state.routineCelebration,
      currentDay: state.currentDay,
    };
  }

  /**
   * Check if we should use incremental sync
   * Determines if incremental sync is appropriate based on change volume
   * @param lastSyncTime - Timestamp of last successful sync
   * @returns True if incremental sync should be used
   */
  shouldUseIncremental(lastSyncTime: number): boolean {
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
