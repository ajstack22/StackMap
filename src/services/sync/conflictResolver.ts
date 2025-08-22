// Type definitions
interface User {
  id?: string;
  name?: string;
  icon?: string;
  emoji?: string;
  deleted?: boolean;
  lastModified?: number;
  days?: Record<string, { date?: string; activities: Activity[] }>;
  settings?: any;
  [key: string]: any;
}

interface Activity {
  id: string;
  text?: string;
  icon?: string;
  completed?: boolean;
  completedAt?: number;
  completedBy?: string;
  lastModified?: number;
  deleted?: boolean;
  order?: number;
  pinned?: boolean;
  [key: string]: any;
}

interface AppState {
  users?: Record<string, User>;
  currentUser?: string;
  currentTheme?: string;
  activities?: Activity[];
  [key: string]: any;
}

// Conflict resolution strategies
enum Strategy {
  LAST_WRITE_WINS = 'last_write_wins',
  MERGE = 'merge',
  USER_CHOICE = 'user_choice',
  CUSTOM = 'custom',
}

// Field-specific resolution strategies
const FIELD_STRATEGIES: Record<string, Strategy> = {
  // Arrays - merge unique items
  activities: Strategy.MERGE,

  // Objects - merge properties with special handling
  users: Strategy.CUSTOM,

  // Scalars - last write wins
  currentUser: Strategy.LAST_WRITE_WINS,
  currentTheme: Strategy.LAST_WRITE_WINS,
  bannerPosition: Strategy.LAST_WRITE_WINS,
  soundEnabled: Strategy.LAST_WRITE_WINS,
  taskCelebration: Strategy.LAST_WRITE_WINS,
  routineCelebration: Strategy.LAST_WRITE_WINS,
  currentDay: Strategy.LAST_WRITE_WINS,
};

interface Conflict {
  id: string;
  field: string;
  type: 'array_conflict' | 'object_conflict' | 'value_conflict';
  localValue: any;
  remoteValue: any;
  localTimestamp: number;
  remoteTimestamp: number;
  strategy: Strategy;
  detectedAt: number;
  resolution?: 'local' | 'remote' | 'merged';
  resolvedValue?: any;
}

interface ResolveOptions {
  strategy?: Strategy;
  autoResolve?: boolean;
  preferLocal?: boolean;
}

interface SyncState extends Partial<AppState> {
  lastModified?: number;
  [key: string]: any;
}

class ConflictResolver {
  private pendingConflicts: Conflict[] = [];
  private conflictHistory: Conflict[] = [];
  private resolveCallback: ((conflicts: Conflict[]) => void) | null = null;

  /**
   * Detect conflicts between local and remote state
   */
  detectConflicts(
    localState: SyncState,
    remoteState: SyncState,
    _lastSyncTime?: number,
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    // Get timestamps
    const localTimestamp = localState.lastModified || Date.now();
    const remoteTimestamp = remoteState.lastModified || Date.now();

    // Check each field for conflicts
    for (const field of Object.keys(FIELD_STRATEGIES)) {
      if (localState[field] === undefined || remoteState[field] === undefined) {
        continue;
      }

      // Check if both sides changed since last sync
      if (this.hasChanged(localState[field], remoteState[field])) {
        const conflict: Conflict = {
          id: `${field}_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          field,
          type: this.getConflictType(
            field,
            localState[field],
            remoteState[field],
          ),
          localValue: localState[field],
          remoteValue: remoteState[field],
          localTimestamp,
          remoteTimestamp,
          strategy: FIELD_STRATEGIES[field],
          detectedAt: Date.now(),
        };

        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  /**
   * Check if values have changed
   */
  private hasChanged(value1: any, value2: any): boolean {
    return JSON.stringify(value1) !== JSON.stringify(value2);
  }

  /**
   * Determine conflict type
   */
  private getConflictType(
    field: string,
    localValue: any,
    remoteValue: any,
  ): Conflict['type'] {
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      return 'array_conflict';
    } else if (
      typeof localValue === 'object' &&
      typeof remoteValue === 'object'
    ) {
      return 'object_conflict';
    } else {
      return 'value_conflict';
    }
  }

  /**
   * Resolve conflicts automatically where possible
   */
  async resolveConflicts(
    conflicts: Conflict[],
    options: ResolveOptions = {},
  ): Promise<Conflict[]> {
    const resolved: Conflict[] = [];
    const needsUserInput: Conflict[] = [];

    for (const conflict of conflicts) {
      const strategy = options.strategy || conflict.strategy;

      switch (strategy) {
        case Strategy.LAST_WRITE_WINS:
          resolved.push(this.resolveLastWriteWins(conflict));
          break;

        case Strategy.MERGE:
          resolved.push(this.resolveMerge(conflict));
          break;

        case Strategy.CUSTOM:
          resolved.push(this.resolveCustom(conflict));
          break;

        case Strategy.USER_CHOICE:
          needsUserInput.push(conflict);
          break;

        default:
          // Default to last write wins
          resolved.push(this.resolveLastWriteWins(conflict));
      }
    }

    // Store pending conflicts that need user input
    this.pendingConflicts = needsUserInput;

    // Add to history
    this.conflictHistory.push(...resolved);

    // If there are conflicts needing user input, trigger callback
    if (needsUserInput.length > 0 && this.resolveCallback) {
      this.resolveCallback(needsUserInput);
    }

    return resolved;
  }

  /**
   * Resolve using last write wins strategy
   */
  private resolveLastWriteWins(conflict: Conflict): Conflict {
    const useRemote = conflict.remoteTimestamp > conflict.localTimestamp;

    return {
      ...conflict,
      resolution: useRemote ? 'remote' : 'local',
      resolvedValue: useRemote ? conflict.remoteValue : conflict.localValue,
    };
  }

  /**
   * Resolve by merging values
   */
  private resolveMerge(conflict: Conflict): Conflict {
    let mergedValue: any;

    if (
      Array.isArray(conflict.localValue) &&
      Array.isArray(conflict.remoteValue)
    ) {
      // Merge arrays by combining unique items
      const localSet = new Set(
        conflict.localValue.map((item: any) =>
          typeof item === 'object' ? JSON.stringify(item) : item,
        ),
      );
      const remoteSet = new Set(
        conflict.remoteValue.map((item: any) =>
          typeof item === 'object' ? JSON.stringify(item) : item,
        ),
      );

      const combined = [...localSet, ...remoteSet];
      mergedValue = combined.map((item: string) => {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      });
    } else if (
      typeof conflict.localValue === 'object' &&
      typeof conflict.remoteValue === 'object'
    ) {
      // Merge objects
      mergedValue = { ...conflict.localValue, ...conflict.remoteValue };
    } else {
      // Can't merge scalars, use last write wins
      return this.resolveLastWriteWins(conflict);
    }

    return {
      ...conflict,
      resolution: 'merged',
      resolvedValue: mergedValue,
    };
  }

  /**
   * Custom resolution for specific fields
   */
  private resolveCustom(conflict: Conflict): Conflict {
    switch (conflict.field) {
      case 'users':
        return this.resolveUsersConflict(conflict);
      default:
        return this.resolveLastWriteWins(conflict);
    }
  }

  /**
   * Special handling for users conflicts
   */
  private resolveUsersConflict(conflict: Conflict): Conflict {
    const localUsers = conflict.localValue as Record<string, User>;
    const remoteUsers = conflict.remoteValue as Record<string, User>;
    const mergedUsers: Record<string, User> = {};

    // Get all unique user IDs
    const allUserIds = new Set([
      ...Object.keys(localUsers),
      ...Object.keys(remoteUsers),
    ]);

    for (const userId of allUserIds) {
      const localUser = localUsers[userId];
      const remoteUser = remoteUsers[userId];

      if (!localUser) {
        // User only exists remotely
        mergedUsers[userId] = remoteUser;
      } else if (!remoteUser) {
        // User only exists locally
        mergedUsers[userId] = localUser;
      } else if (localUser.deleted && !remoteUser.deleted) {
        // Local deletion wins if it's newer
        if ((localUser.lastModified || 0) > (remoteUser.lastModified || 0)) {
          mergedUsers[userId] = localUser;
        } else {
          mergedUsers[userId] = remoteUser;
        }
      } else if (!localUser.deleted && remoteUser.deleted) {
        // Remote deletion wins if it's newer
        if ((remoteUser.lastModified || 0) > (localUser.lastModified || 0)) {
          mergedUsers[userId] = remoteUser;
        } else {
          mergedUsers[userId] = localUser;
        }
      } else {
        // Both exist and neither is deleted - merge their properties
        mergedUsers[userId] = this.mergeUserData(localUser, remoteUser);
      }
    }

    return {
      ...conflict,
      resolution: 'merged',
      resolvedValue: mergedUsers,
    };
  }

  /**
   * Merge individual user data
   */
  private mergeUserData(localUser: User, remoteUser: User): User {
    // Use the newer version as base
    const baseUser =
      (localUser.lastModified || 0) > (remoteUser.lastModified || 0)
        ? localUser
        : remoteUser;

    // Start with all fields from base user
    const mergedUser: User = { ...baseUser };

    // Merge days (activities) from both users
    if (localUser.days && remoteUser.days) {
      mergedUser.days = this.mergeUserDays(localUser.days, remoteUser.days);
    } else if (!mergedUser.days) {
      mergedUser.days = localUser.days || remoteUser.days || {};
    }

    // Ensure critical fields are preserved - ALWAYS preserve existing values
    // Name: Keep the most meaningful name
    if (!mergedUser.name || mergedUser.name === 'User') {
      const bestName =
        (localUser.name && localUser.name !== 'User' ? localUser.name : null) ||
        (remoteUser.name && remoteUser.name !== 'User'
          ? remoteUser.name
          : null) ||
        mergedUser.name ||
        'User';
      mergedUser.name = bestName;
    }

    // Icon: CRITICAL - always ensure icon exists and prefer actual icons over defaults
    const localIcon = localUser.icon || (localUser as any).emoji;
    const remoteIcon = remoteUser.icon || (remoteUser as any).emoji;

    // Prefer non-default icons
    if (
      !mergedUser.icon ||
      mergedUser.icon === '👤' ||
      mergedUser.icon === '😀'
    ) {
      if (localIcon && localIcon !== '👤' && localIcon !== '😀') {
        mergedUser.icon = localIcon;
      } else if (remoteIcon && remoteIcon !== '👤' && remoteIcon !== '😀') {
        mergedUser.icon = remoteIcon;
      } else {
        // Use any available icon, even if default
        mergedUser.icon = mergedUser.icon || localIcon || remoteIcon || '👤';
      }
    }

    // Ensure icon is always present
    if (!mergedUser.icon) {
//       console.error('CRITICAL: User merge resulted in no icon!', {
        localIcon,
        remoteIcon,
        baseUser: baseUser.icon,
      });
      mergedUser.icon = localIcon || remoteIcon || '👤';
    }

    // Clean up any emoji field if present
    if ((mergedUser as any).emoji) {
      delete (mergedUser as any).emoji;
    }

    return mergedUser;
  }

  /**
   * Merge user days (activities)
   */
  private mergeUserDays(
    localDays: Record<string, { date?: string; activities: Activity[] }>,
    remoteDays: Record<string, { date?: string; activities: Activity[] }>,
  ): Record<string, { date?: string; activities: Activity[] }> {
    const mergedDays: Record<
      string,
      { date?: string; activities: Activity[] }
    > = {};

    // Get all unique day keys
    const allDayKeys = new Set([
      ...Object.keys(localDays),
      ...Object.keys(remoteDays),
    ]);

    for (const dayKey of allDayKeys) {
      const localDay = localDays[dayKey];
      const remoteDay = remoteDays[dayKey];

      if (!localDay) {
        mergedDays[dayKey] = remoteDay;
      } else if (!remoteDay) {
        mergedDays[dayKey] = localDay;
      } else {
        // Merge activities for this day
        mergedDays[dayKey] = {
          date: dayKey,
          activities: this.mergeActivities(
            localDay.activities,
            remoteDay.activities,
          ),
        };
      }
    }

    return mergedDays;
  }

  /**
   * Merge activities arrays with completion status priority
   */
  private mergeActivities(
    localActivities: Activity[],
    remoteActivities: Activity[],
  ): Activity[] {
    const activityMap = new Map<string, Activity>();

    // Process all activities
    const allActivities = [...localActivities, ...remoteActivities];

    for (const activity of allActivities) {
      const existing = activityMap.get(activity.id);

      if (!existing) {
        activityMap.set(activity.id, activity);
      } else {
        // Merge activity - use completion status from most recent change
        const merged = this.mergeActivity(existing, activity);
        activityMap.set(activity.id, merged);
      }
    }

    // Convert back to array and sort by order
    return Array.from(activityMap.values())
      .filter(activity => !activity.deleted)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Merge individual activity
   */
  private mergeActivity(activity1: Activity, activity2: Activity): Activity {
    // For completion status, use the most recent change
    const completedAt1 = activity1.completedAt || 0;
    const completedAt2 = activity2.completedAt || 0;
    const modifiedAt1 = activity1.lastModified || 0;
    const modifiedAt2 = activity2.lastModified || 0;

    // Determine which activity is more recent
    const mostRecent = Math.max(
      completedAt1,
      completedAt2,
      modifiedAt1,
      modifiedAt2,
    );

    if (mostRecent === completedAt2 || mostRecent === modifiedAt2) {
      return { ...activity1, ...activity2 };
    } else {
      return { ...activity2, ...activity1 };
    }
  }

  /**
   * Apply resolved conflicts to state
   */
  applyResolvedConflicts(
    resolvedConflicts: Conflict[],
    currentState: SyncState,
  ): SyncState {
    const newState = { ...currentState };

    for (const conflict of resolvedConflicts) {
      if (conflict.resolvedValue !== undefined) {
        newState[conflict.field] = conflict.resolvedValue;
      }
    }

    // Update last modified timestamp
    newState.lastModified = Date.now();

    return newState;
  }

  /**
   * Handle user choice for a conflict
   */
  resolveUserChoice(
    conflictId: string,
    choice: 'local' | 'remote',
  ): Conflict | null {
    const conflictIndex = this.pendingConflicts.findIndex(
      c => c.id === conflictId,
    );

    if (conflictIndex === -1) {
      return null;
    }

    const conflict = this.pendingConflicts[conflictIndex];
    const resolved: Conflict = {
      ...conflict,
      resolution: choice,
      resolvedValue:
        choice === 'local' ? conflict.localValue : conflict.remoteValue,
    };

    // Remove from pending and add to history
    this.pendingConflicts.splice(conflictIndex, 1);
    this.conflictHistory.push(resolved);

    return resolved;
  }

  /**
   * Set callback for conflicts needing user input
   */
  onConflictNeedsResolution(callback: (conflicts: Conflict[]) => void): void {
    this.resolveCallback = callback;
  }

  /**
   * Get pending conflicts
   */
  getPendingConflicts(): Conflict[] {
    return this.pendingConflicts;
  }

  /**
   * Get conflict history
   */
  getConflictHistory(): Conflict[] {
    return this.conflictHistory;
  }

  /**
   * Clear conflict history
   */
  clearHistory(): void {
    this.conflictHistory = [];
  }
}

// Export singleton instance
const conflictResolver = new ConflictResolver();
export default conflictResolver;
