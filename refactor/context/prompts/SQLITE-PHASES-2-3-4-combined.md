# SQLite Implementation Phases 2-4 (Issues #35, #36, #37)

## Instructions
Complete these three phases sequentially without waiting for review between them. I'll do an adversarial review of all three at once when you're done.

---

# Phase 2: Data Migration System (Issue #35)

## Context
Phase 1 is complete with basic SQLite working. Now implement localStorage → SQLite migration.

## Requirements

### 1. Fix MigrationManager Integration
The `MigrationManager` already exists but needs to work with your SQLite implementation:

```javascript
// In storage-adapter.js around line 50-65
if (window.MigrationManager && !window.MigrationManager.hasMigrated()) {
    window.MigrationManager.migrateFromLocalStorage(self.sqliteAdapter, function(migrated, error) {
        // This is already there, just needs your SQLite adapter to work
    });
}
```

### 2. Ensure Compatibility
Your `TaskSQLite` needs to work as the `sqliteAdapter`:
- ✓ `getItem()` - You already have this
- ✓ `setItem()` - You already have this  
- ✓ `removeItem()` - You already have this
- Add any missing methods MigrationManager expects

### 3. Test Migration Path
```javascript
// Add test in test-sqlite.html
function testMigrationFromLocalStorage() {
    // 1. Put test data in localStorage
    localStorage.setItem('stackmap-test', JSON.stringify({
        data: {id: 1, title: 'Test'},
        checksum: '12345',
        timestamp: Date.now()
    }));
    
    // 2. Run migration
    // 3. Verify data exists in SQLite
    // 4. Verify localStorage cleaned up
}
```

### 4. Add Progress Tracking
```javascript
// In TaskSQLite, add:
getMigrationProgress: function(callback) {
    var self = this;
    self.db.query('SELECT COUNT(*) as count FROM storage', [])
        .then(function(result) {
            callback(result.values[0].count);
        });
}
```

## Success Criteria
- [ ] Migration runs automatically on first SQLite use
- [ ] All localStorage data transferred to SQLite
- [ ] Backups created before migration
- [ ] Progress tracking works
- [ ] Rollback on failure

---

# Phase 3: Performance Optimization (Issue #36)

## Context
Make SQLite operations fast for ADHD users who need instant response.

## Requirements

### 1. Batch Operations
```javascript
// Add to TaskSQLite:
setItems: function(items, callback) {
    var self = this;
    
    // Start transaction
    self.db.execute('BEGIN TRANSACTION', [], false)
        .then(function() {
            // Insert all items
            var promises = items.map(function(item) {
                return self.db.run(
                    'INSERT OR REPLACE INTO storage (key, value, updated_at) VALUES (?, ?, datetime("now"))',
                    [item.key, JSON.stringify(item.value)],
                    false // no individual transactions
                );
            });
            return Promise.all(promises);
        })
        .then(function() {
            // Commit transaction
            return self.db.execute('COMMIT', [], false);
        })
        .then(function() {
            if (callback) callback(null);
        })
        .catch(function(error) {
            // Rollback on error
            self.db.execute('ROLLBACK', [], false);
            if (callback) callback(error);
        });
}
```

### 2. Connection Pooling
Since Capacitor SQLite doesn't support multiple connections, implement a "busy" flag:
```javascript
// Add to TaskSQLite state:
isBusy: false,
operationQueue: [],

// Wrap all operations:
_executeOperation: function(operation) {
    var self = this;
    if (self.isBusy) {
        self.operationQueue.push(operation);
        return;
    }
    
    self.isBusy = true;
    operation(function() {
        self.isBusy = false;
        if (self.operationQueue.length > 0) {
            var next = self.operationQueue.shift();
            self._executeOperation(next);
        }
    });
}
```

### 3. Optimize Queries
```javascript
// Add indexes for common queries
createIndexes: function(callback) {
    var self = this;
    var indexes = [
        'CREATE INDEX IF NOT EXISTS idx_storage_updated ON storage(updated_at)',
        'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)',
        'CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at)'
    ];
    
    // Execute all
}
```

### 4. Memory Management
```javascript
// Add cleanup method:
cleanup: function() {
    var self = this;
    // Clear any cached data
    // Run VACUUM periodically
    self.db.execute('VACUUM', [], false);
}
```

## Performance Targets
- [ ] Single save: <50ms
- [ ] Batch save (10 items): <200ms
- [ ] Query 100 items: <100ms
- [ ] No UI blocking

---

# Phase 4: Testing & Integration (Issue #37)

## Context
Ensure SQLite works reliably across all platforms.

## Requirements

### 1. Comprehensive Test Suite
Expand test-sqlite.html with:
```javascript
var SQLiteTestSuite = {
    tests: [
        'testConnection',
        'testKeyValueOperations',
        'testBatchOperations',
        'testMigration',
        'testPerformance',
        'testErrorScenarios',
        'testMemoryLeaks',
        'testConcurrency'
    ],
    
    runAll: function() {
        // Run each test with timing
    }
};
```

### 2. Platform-Specific Tests
```javascript
testPlatformSpecific: function() {
    if (Platform.isIOS()) {
        // Test iOS-specific paths
    } else if (Platform.isAndroid()) {
        // Test Android-specific storage
    }
}
```

### 3. Integration with App
Ensure storage-adapter.js fully uses SQLite:
```javascript
// Verify these work:
// - Theme saving/loading
// - Task saving/loading  
// - Settings persistence
// - Demo mode data
```

### 4. Performance Benchmarks
```javascript
runBenchmarks: function() {
    var results = {
        singleSave: [],
        batchSave: [],
        query: []
    };
    
    // Run 100 iterations of each
    // Calculate average, min, max
    // Ensure meets targets
}
```

### 5. Error Recovery Tests
- Corrupt database recovery
- Out of space handling
- Permission denied scenarios
- Concurrent access conflicts

## Success Criteria
- [ ] All tests pass on iOS Simulator
- [ ] All tests pass on Android Emulator
- [ ] Performance meets targets
- [ ] No memory leaks after 1000 operations
- [ ] Graceful degradation on errors

---

## General Requirements (All Phases)

### ES5 Compatibility
- No const/let (use var)
- No arrow functions
- No template literals in SQL
- No destructuring

### Error Handling
- Every operation wrapped in try-catch
- RSD-aware error messages
- Always callback with error first: callback(error, result)

### Code Organization
- Keep all changes in task-sqlite.js
- Update storage-adapter.js minimally
- Document any API changes

## Time Estimate
- Phase 2: 6-8 hours
- Phase 3: 6-8 hours  
- Phase 4: 4-6 hours
- **Total: 16-22 hours** (2-3 days)

## Final Deliverable
When all three phases are complete:
1. Post a comment on Issue #23 summarizing what you've implemented
2. List any issues or concerns
3. Confirm all tests are passing
4. I'll then do a comprehensive adversarial review of all three phases

Good luck! 🚀