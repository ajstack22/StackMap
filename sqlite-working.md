# SQLite Storage Implementation - Working Document

## Executive Summary

SQLite via @capacitor-community/sqlite is the correct choice for StackMap. The research is conclusive: Todoist, Notion, and Bear all converged on this solution. It provides <0.1% failure rate with 2-5ms operations even on 512MB devices.

However, I have significant concerns about the integration approach that need addressing.

## Critical Architecture Decisions

### 1. ✅ SQLite Choice - Validated
- Production-proven by apps serving ADHD/autism users
- Survives app updates (critical for routine preservation)
- 60fps scrolling even on 512MB Android devices
- Simple mental model aligns with user needs

### 2. ⚠️ Integration Point - Needs Reconsideration

**Current Plan**: Replace IndexedDB in `storage-adapter.js`

**My Concern**: The existing storage adapter is architected for key-value stores (localStorage/IndexedDB). SQLite is fundamentally different - it's relational. Forcing SQLite into a key-value adapter pattern will:
- Lose SQLite's query capabilities
- Create impedance mismatch
- Complicate error handling
- Make testing harder

**Recommendation**: Create a new `task-storage.js` that directly implements SQLite patterns, then update `app.js` to use it instead of the generic adapter.

### 3. ✅ Schema Design - Solid Foundation
The proposed schema aligns well with our existing `db-schema.js`:
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT 0,
  priority INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  tags TEXT
);
```

**Alignment Points**:
- Matches our validation rules
- Supports existing metadata structure
- Handles sync fields for future

### 4. ⚠️ Migration Strategy - Needs More Planning

**Current State**: 
- Safe mode detection working
- Emergency fallback phases 1-3 complete
- Some users likely have localStorage data

**Migration Risks**:
1. Data loss during migration (unacceptable for ADHD users)
2. Performance hit on first launch
3. Failure leaves app in inconsistent state

**Proposed Safe Migration**:
```javascript
// 1. Detect existing data
// 2. Show migration UI with progress
// 3. Backup to emergency format first
// 4. Migrate in chunks with verification
// 5. Keep localStorage as fallback for 30 days
```

## Implementation Architecture

### Layer 1: SQLite Service (New File)
```javascript
// task-sqlite.js
var TaskSQLite = {
    db: null,
    isReady: false,
    
    init: function(callback) {
        // Platform detection
        // Database initialization
        // Migration check
    },
    
    // Direct task operations
    createTask: function(task, callback) {},
    getTasks: function(limit, offset, callback) {},
    updateTask: function(id, updates, callback) {},
    
    // Specialized queries
    searchTasks: function(query, callback) {},
    getTasksByStatus: function(status, callback) {}
};
```

### Layer 2: Compatibility Bridge
```javascript
// storage-bridge.js
// Temporary bridge during migration
var StorageBridge = {
    primary: null,    // SQLite
    fallback: null,   // localStorage
    
    get: function(key, callback) {
        // Try primary first
        // Fall back if needed
        // Log for monitoring
    }
};
```

### Layer 3: Application Integration
Update `app.js` to use TaskSQLite directly for task operations while keeping StorageAdapter for settings/preferences.

## Performance Considerations

### Memory Management on 512MB Devices
```javascript
// Critical for low-memory devices
PRAGMA cache_size = -1024;      // 1MB cache limit
PRAGMA temp_store = MEMORY;     // Faster but uses RAM
PRAGMA journal_mode = WAL;      // Better concurrency
PRAGMA synchronous = NORMAL;    // Balance safety/speed
```

### Pagination Strategy
- Initial load: 50 tasks max
- Scroll trigger: Load next 50 at 80% scroll
- Memory limit: 200 tasks in DOM
- Virtual scrolling for larger lists

### Image Handling
```javascript
// Store in filesystem, reference in DB
// This prevents database bloat
var attachment = {
    task_id: 123,
    file_path: 'attachments/task_123_image.jpg',
    file_size: 245760  // Monitor size
};
```

## Failure Mode Analysis

### 1. Database Corruption (<0.1%)
**Symptoms**: Queries fail, app won't start
**Prevention**: WAL mode, proper transactions
**Recovery**: 
```javascript
// Auto-recovery with user notification
if (corruptionDetected) {
    showMessage("Repairing your data...");
    restoreFromBackup();
    rebuildIndexes();
}
```

### 2. Storage Full (2-5%)
**Symptoms**: Saves fail, images won't attach
**Prevention**: Size monitoring, old data cleanup
**Recovery**: Prompt user to archive old tasks

### 3. Migration Failure
**Symptoms**: Missing tasks after update
**Prevention**: Backup before migration
**Recovery**: Restore from localStorage backup

### 4. Platform-Specific Issues
- **iOS 14**: Database location matters for persistence
- **Android 5**: Memory constraints require careful tuning
- **Web**: Needs jeep-sqlite polyfill

## Testing Strategy

### Unit Tests
```javascript
// Test each operation in isolation
describe('TaskSQLite', function() {
    it('creates task with minimum data', function() {});
    it('handles corrupt data gracefully', function() {});
    it('respects memory limits', function() {});
});
```

### Integration Tests
- Full user workflow from create to complete
- Migration from localStorage with 1000 tasks
- Performance under memory pressure
- Offline/online transitions

### Device Testing Matrix
| Device | OS | RAM | Test Focus |
|--------|----|----|------------|
| Android Go | 5.1 | 512MB | Memory limits |
| iPhone SE | iOS 14 | 2GB | Data persistence |
| iPad Mini | iOS 15 | 3GB | Large datasets |
| Pixel 3a | Android 12 | 4GB | Performance baseline |

## Implementation Timeline

### Phase 1: Foundation (8 hours)
- [ ] Install @capacitor-community/sqlite
- [ ] Create task-sqlite.js service
- [ ] Implement core CRUD operations
- [ ] Add error handling and logging

### Phase 2: Integration (8 hours)
- [ ] Create storage bridge for migration
- [ ] Update app.js to use SQLite
- [ ] Implement progress indicators
- [ ] Add fallback mechanisms

### Phase 3: Migration (6 hours)
- [ ] Build migration UI
- [ ] Implement chunked migration
- [ ] Add verification steps
- [ ] Create rollback capability

### Phase 4: Testing (8 hours)
- [ ] Unit test coverage
- [ ] Device testing
- [ ] Performance profiling
- [ ] Edge case validation

### Phase 5: Polish (4 hours)
- [ ] Optimize queries
- [ ] Tune for 512MB devices
- [ ] Documentation
- [ ] Monitoring setup

**Total: 34 hours** (vs 25-30 in prompt)

## Risk Assessment

### High Risk
1. **Data Loss During Migration** - Mitigate with backups and verification
2. **Performance on Old Devices** - Mitigate with careful tuning

### Medium Risk
1. **Complexity vs Key-Value** - Mitigate with good abstractions
2. **Platform Differences** - Mitigate with thorough testing

### Low Risk
1. **SQLite Reliability** - Proven by production apps
2. **Long-term Maintenance** - Well-documented standard

## Success Metrics

1. **Zero data loss** during migration
2. **<100ms** for all operations
3. **<3MB** memory usage on 512MB devices
4. **60fps** scrolling with 1000 tasks
5. **<5** support tickets in first month

## Open Questions for PM

1. **Migration UI**: Should we show progress or do it silently?
2. **Backup Frequency**: Daily? On each significant change?
3. **Data Limits**: Max tasks per device? Archive strategy?
4. **Rollback Period**: How long keep localStorage fallback?
5. **Web Support**: Include jeep-sqlite for web platform?

## Recommendation

Proceed with SQLite implementation but:
1. Create new task-sqlite.js instead of modifying storage-adapter.js
2. Implement robust migration with UI feedback
3. Keep localStorage fallback for 30 days
4. Add comprehensive error recovery
5. Test extensively on 512MB Android devices

The research is solid. SQLite is the right choice. But the implementation needs to respect the fundamental differences between key-value and relational storage.

## Next Steps

1. PM approval on architecture changes
2. Clarify migration UX requirements  
3. Confirm device testing matrix
4. Set up performance monitoring
5. Begin Phase 1 implementation

---

*This is a living document. Updates will be added as implementation progresses.*