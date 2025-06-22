# [ARCHIVED] IndexedDB Implementation Prompts for StackMap

> **Note**: This document focused on progressive migration which is no longer needed for the mobile-first approach. See MOBILE_FIRST_IMPLEMENTATION.md for current approach.

## Overview
These prompts guide implementation of a robust IndexedDB storage layer that addresses all critical safety concerns for neurodivergent users. The implementation prioritizes data integrity, progressive migration, and absolute stability.

---

## Prompt 1: Storage Abstraction Layer

### Context
StackMap currently has tight coupling to localStorage throughout the codebase. We need a storage abstraction layer that allows progressive migration from localStorage to IndexedDB without breaking existing functionality.

### Requirements
1. Create a unified storage API that works with both localStorage and IndexedDB
2. Implement read-through and write-through caching
3. Support progressive migration over 30 days
4. Handle storage quota errors gracefully
5. Provide telemetry for migration progress

### Implementation Guidance
```javascript
// Example interface (DO NOT COPY - design your own)
class StorageManager {
    async get(key) { /* Returns from IndexedDB or localStorage */ }
    async set(key, value) { /* Writes to both during migration */ }
    async migrate() { /* Progressive migration logic */ }
}
```

### Key Safety Requirements
- NEVER lose data during migration
- Always verify writes succeeded
- Implement checksums for data integrity
- Handle corruption detection and recovery
- Support rollback if migration fails

### Testing Requirements
- Test with corrupted localStorage data
- Test with full storage quotas
- Test with concurrent access
- Test migration interruption scenarios
- Verify zero data loss across all scenarios

---

## Prompt 2: Dexie.js Integration with Safety Wrappers

### Context
Implement Dexie.js as the IndexedDB wrapper but add safety layers for data verification, corruption detection, and recovery mechanisms.

### Requirements
1. Set up Dexie.js with proper schema versioning
2. Implement write verification (write → read → compare)
3. Add corruption detection with checksums
4. Create recovery mechanisms for corrupted data
5. Handle upgrade failures gracefully

### Database Schema
```javascript
// Tables needed:
// - tasks (id, content, checksum, version, lastModified)
// - settings (key, value, checksum)
// - attachments (id, taskId, data, size, checksum)
// - sync_queue (id, operation, timestamp, retries)
// - migration_state (key, value, timestamp)
```

### Critical Implementation Details
- Use transactions for ALL multi-step operations
- Implement optimistic locking with version numbers
- Add checksums to detect corruption
- Create backup before schema migrations
- Log all operations for debugging

### Error Handling
- NEVER show IndexedDB errors to users
- Transform all errors using RSD-safe messaging
- Implement automatic recovery attempts
- Fall back to localStorage if IndexedDB fails
- Preserve user data at all costs

---

## Prompt 3: Progressive Migration System

### Context
Implement a 30-day progressive migration from localStorage to IndexedDB that runs in parallel, ensuring zero data loss and allowing rollback.

### Requirements
1. Dual-write to both storage systems for 30 days
2. Track migration progress per data type
3. Implement checkpoints for rollback
4. Verify data integrity at each checkpoint
5. Provide migration status UI (non-intrusive)

### Migration Phases
1. **Days 1-7**: Shadow writes (IndexedDB writes are verified but not used)
2. **Days 8-14**: Parallel reads (compare results, use localStorage if mismatch)
3. **Days 15-21**: IndexedDB primary (localStorage as backup)
4. **Days 22-30**: Verification phase (ensure all data migrated)
5. **Day 31+**: IndexedDB only (keep localStorage for emergency recovery)

### Safety Mechanisms
- Daily integrity checks comparing both stores
- Automatic rollback if corruption detected
- User notification only if action needed
- Emergency recovery mode via URL parameter
- Export/import functionality for manual backup

---

## Prompt 4: Blob Lifecycle Management

### Context
Implement intelligent blob management to prevent memory exhaustion while maintaining attachment functionality.

### Requirements
1. Implement reference counting for blobs
2. Lazy loading with LRU cache (max 10 blobs in memory)
3. Progressive compression for large attachments
4. Storage quota monitoring and alerts
5. Automatic cleanup of orphaned blobs

### Implementation Strategy
```javascript
// Blob lifecycle states:
// 1. Metadata only (list view)
// 2. Thumbnail loaded (preview)
// 3. Full blob in memory (active editing)
// 4. Archived (compressed, off-device)
```

### Memory Management
- Monitor device memory before loading blobs
- Implement progressive JPEG compression
- Use OffscreenCanvas for image processing
- Stream large files instead of loading fully
- Provide "lite mode" for low-memory devices

### User Experience
- Show loading progress for large attachments
- Offer quality/size tradeoffs to users
- Never lose attachments due to quota issues
- Provide clear storage usage indicators
- Allow manual attachment cleanup

---

## Prompt 5: Conflict Resolution System

### Context
Implement CRDT-based conflict resolution that handles multi-device scenarios without requiring user intervention.

### Requirements
1. Implement Last-Write-Wins with vector clocks
2. Automatic three-way merge for compatible changes
3. Preserve all versions for recovery
4. Silent resolution for 99% of conflicts
5. Clear UI for rare manual resolution needs

### Conflict Types and Resolution
1. **Simple property changes**: Last-write-wins
2. **List additions**: Union of all additions
3. **Task completion**: Once done, stays done
4. **Deletions**: Soft delete with recovery option
5. **Attachment conflicts**: Keep all versions

### Implementation Details
- Use device ID + timestamp for vector clocks
- Store conflict history for 30 days
- Implement undo for automated resolutions
- Test with clock skew scenarios
- Handle offline duration up to 30 days

---

## Prompt 6: Browser Compatibility Layer

### Context
Handle browser-specific IndexedDB limitations and bugs, especially Safari's storage limits and Android WebView issues.

### Requirements
1. Detect browser capabilities and limits
2. Implement Safari 10MB limit workarounds
3. Handle Android 5 WebView corruption
4. Provide fallbacks for unsupported features
5. Monitor and adapt to quota changes

### Browser-Specific Handling
```javascript
// Safari: Implement storage estimate API fallback
// Android 5: Use localStorage with sync to IndexedDB
// Firefox Private Mode: Detect and use memory-only
// Chrome: Use Storage Persistence API when available
```

### Quota Management
- Implement storage pressure detection
- Automatic cleanup of old data
- User-controlled data priority settings
- Clear storage usage visualization
- Never delete active task data

---

## Prompt 7: Testing Infrastructure

### Context
Create comprehensive testing for all failure modes and edge cases.

### Requirements
1. Unit tests for each storage operation
2. Integration tests for migration scenarios
3. Chaos testing for corruption handling
4. Performance tests for large datasets
5. Cross-browser compatibility tests

### Test Scenarios
- Power loss during write
- Storage quota exceeded
- Corrupted database files
- Clock skew between devices
- Rapid sequential writes
- Large attachment handling
- 30-day offline recovery
- Migration interruption
- Concurrent tab access
- Browser update during migration

### Success Metrics
- Zero data loss in all scenarios
- Recovery time < 2 seconds
- Migration success rate > 99.9%
- Conflict resolution accuracy > 99%
- Memory usage < 50MB on 512MB devices

---

## Implementation Order

1. **Week 1**: Storage abstraction layer
2. **Week 2**: Dexie.js integration with safety
3. **Week 3**: Progressive migration system
4. **Week 4**: Blob lifecycle management
5. **Week 5**: Conflict resolution
6. **Week 6**: Browser compatibility
7. **Week 7**: Testing infrastructure
8. **Week 8**: Production deployment

---

## Critical Success Factors

1. **Data Integrity**: Every write verified, every read checked
2. **Progressive Enhancement**: Features improve but never break
3. **User Trust**: Clear communication, no surprises
4. **Recovery Options**: Multiple fallbacks for every scenario
5. **Performance**: Fast enough to not be noticed
6. **Accessibility**: Works with all assistive technologies

---

## Warning Signs to Monitor

- IndexedDB operations taking > 100ms
- Storage quota usage > 80%
- Migration checkpoint failures
- Checksum mismatches
- Memory usage spikes
- User reports of missing data

Remember: The goal is invisible, bulletproof storage that users never have to think about. Every decision should prioritize stability and data preservation over features or performance.