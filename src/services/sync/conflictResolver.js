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

class ConflictResolver {
  /**
   * Simple comparison: which state is newer?
   */
  detectConflicts(localState, remoteState) {
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
  resolveConflicts(conflicts) {
    if (!conflicts || conflicts.length === 0) {
      return [];
    }

    const conflict = conflicts[0]; // Should only ever be one
    const useRemote = conflict.remoteTimestamp > conflict.localTimestamp;
    
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
  applyResolutions(resolutions) {
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
  statesAreEqual(state1, state2) {
    // Quick check on timestamps
    return (state1.lastModified || 0) === (state2.lastModified || 0);
  }
}

// Export singleton instance
const conflictResolver = new ConflictResolver();

// Support both ES modules and CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = conflictResolver;
}

export default conflictResolver;