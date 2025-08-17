# Sync System Migration Guide (v2025.08.17)

## Overview

As of version 2025.08.17, StackMap has migrated from a complex field-by-field merge sync system to a simple last-write-wins approach. This guide explains the changes and migration path.

## What Changed

### Before (Complex Merge System)
- **Multiple timestamps**: `completedAt`, `uncompletedAt`, `modifiedAt`, `deletedAt` per item
- **Field-by-field merging**: Complex conflict resolution per field
- **Incremental sync**: Sending only changes via patches
- **900+ lines** of conflict resolution logic
- **Unpredictable behavior**: Merge conflicts, partial states

### After (Simple Last-Write-Wins)
- **Single timestamp**: One `lastModified` for entire state
- **Full replacement**: Newer timestamp wins completely
- **Always full sync**: Entire state sent (~4KB)
- **100 lines** of simple comparison logic
- **Predictable behavior**: Last save always wins

## Migration Steps

### For Existing Deployments

1. **No Data Migration Required**
   - The new system is backward compatible
   - Old timestamps are ignored but don't break anything
   - First sync with new version will establish `lastModified`

2. **Code Changes Required**
   ```javascript
   // Old: Multiple timestamps per activity
   activity.completedAt = Date.now();
   activity.uncompletedAt = Date.now();
   
   // New: Just update state, lastModified handled automatically
   // No timestamp tracking needed at activity level
   ```

3. **Remove Timestamp Fields**
   - Can keep for backward compatibility
   - But they're no longer used for sync decisions
   - Only `lastModified` at root level matters

### For Custom Implementations

If you've built on top of StackMap's sync:

1. **Remove conflict resolution logic**
   ```javascript
   // Old: Complex merge
   const merged = mergeActivities(local, remote);
   
   // New: Simple replacement
   const winner = localState.lastModified > remoteState.lastModified 
     ? localState 
     : remoteState;
   ```

2. **Update sync handling**
   ```javascript
   // Old: Handle incremental updates
   if (data.type === 'incremental') {
     applyPatch(data.patch);
   }
   
   // New: Always full replacement
   setState(remoteState); // That's it!
   ```

## Benefits of Migration

1. **Eliminates Bugs**
   - No more completion state ping-pong
   - No more partial merge states
   - No more field conflict issues

2. **Simpler Mental Model**
   - Users understand "last save wins"
   - Developers have 90% less code to maintain
   - Debugging is trivial (compare two timestamps)

3. **Better Performance**
   - No complex merge computations
   - Instant state replacement
   - Smaller code bundle

## FAQ

### Q: What about parallel edits on different devices?
A: The last save wins completely. For a single-user app, this is rarely an issue in practice.

### Q: What if I need field-level merging?
A: Consider if you really need it. At 4KB, full replacement is instant. If you must have it, you'll need to maintain the old conflict resolver.

### Q: Will this break existing syncs?
A: No. The first sync after upgrade will establish the new timestamp, then continue normally.

### Q: Can I still use incremental sync?
A: The API accepts it but treats everything as full sync now. The `sync_type` field is ignored.

### Q: What about data loss from overwrites?
A: The old system could also lose data through merge conflicts. The new system is more predictable - last save wins.

## Rollback Plan

If you need to rollback:

1. Restore `src/services/sync/conflictResolver.complex.backup.js`
2. Revert changes to `syncService.ts`
3. Re-enable changeTracker imports
4. Remove `lastModified` from useAppStore

But we strongly recommend staying with the simple approach - it eliminates entire categories of bugs.

## Support

For questions about the migration:
- Check console for `[Sync]` debug messages
- Review `/prompts/core/sync-troubleshooting.md`
- File issues at the GitHub repository