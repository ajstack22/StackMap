/**
 * Simple Conflict Resolver - Last Write Wins
 * 
 * This is a dramatically simplified sync strategy:
 * - Compares single timestamp for entire state
 * - Newer timestamp wins completely
 * - No field-by-field merging
 * - No complex conflict resolution
 * 
 * Benefits:
 * - Dead simple to understand and debug
 * - No partial states or merge conflicts
 * - Predictable behavior
 * - Works great with small data sets (~4KB)
 */

interface ConflictItem {
  field: string;
  localValue: any;
  remoteValue: any;
  localTimestamp?: number;
  remoteTimestamp?: number;
  strategy: string;
}

interface Resolution {
  field: string;
  resolvedValue: any;
  winner: 'local' | 'remote';
  requiresUserInput: boolean;
}

class ConflictResolver {
  /**
   * Simple comparison: which state is newer?
   */
  detectConflicts(localState: any, remoteState: any): ConflictItem[] {
    const localTimestamp = localState.lastModified || 0;
    const remoteTimestamp = remoteState.lastModified || 0;
    
    console.log('[Sync] Comparing timestamps:', {
      local: new Date(localTimestamp).toISOString(),
      remote: new Date(remoteTimestamp).toISOString(),
      winner: localTimestamp > remoteTimestamp ? 'local' : 
              localTimestamp < remoteTimestamp ? 'remote' : 'same'
    });

    // If timestamps are the same, no conflict
    if (localTimestamp === remoteTimestamp) {
      return [];
    }

    // Return single conflict for entire state
    return [{
      field: 'state',
      localValue: localState,
      remoteValue: remoteState,
      localTimestamp,
      remoteTimestamp,
      strategy: 'LAST_WRITE_WINS'
    }];
  }

  /**
   * Resolve conflicts - super simple: newer wins
   */
  resolveConflicts(conflicts: ConflictItem[]): Resolution[] {
    if (!conflicts || conflicts.length === 0) {
      return [];
    }

    const conflict = conflicts[0]; // Should only ever be one
    const useRemote = (conflict.remoteTimestamp || 0) > (conflict.localTimestamp || 0);
    
    console.log(`[Sync] Resolution: Using ${useRemote ? 'remote' : 'local'} state (newer)`);
    
    return [{
      field: 'state',
      resolvedValue: useRemote ? conflict.remoteValue : conflict.localValue,
      winner: useRemote ? 'remote' : 'local',
      requiresUserInput: false
    }];
  }

  /**
   * Apply resolution - replace entire state
   */
  applyResolutions(resolutions: Resolution[]): any {
    if (!resolutions || resolutions.length === 0) {
      return null;
    }

    const resolution = resolutions[0];
    if (resolution.field === 'state' && resolution.resolvedValue) {
      // Return the complete winning state
      return resolution.resolvedValue;
    }

    return null;
  }

  /**
   * Check if states are effectively the same (for logging)
   */
  statesAreEqual(state1: any, state2: any): boolean {
    // Quick check on timestamps
    return (state1.lastModified || 0) === (state2.lastModified || 0);
  }

  /**
   * Simple helper to determine if remote data should be used
   * Used by simplified sync service
   */
  shouldUseRemoteData(localState: any, remoteState: any): boolean {
    const localTimestamp = localState.lastModified || 0;
    const remoteTimestamp = remoteState.lastModified || 0;
    return remoteTimestamp > localTimestamp;
  }
}

// Export singleton instance
const conflictResolver = new ConflictResolver();

export default conflictResolver;