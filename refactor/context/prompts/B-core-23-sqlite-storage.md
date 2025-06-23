# Issue #23: Implement SQLite Storage via Capacitor

## 🚨 CRITICAL: Development Process
1. **BEFORE IMPLEMENTING**: Post your DETAILED implementation plan to Issue #23 on GitHub for PM adversarial review
2. **AFTER COMPLETING**: Update Issue #23 with completion status for final adversarial review
3. **DO NOT MERGE**: Until PM completes adversarial review and approves
4. **THINK HARD**: This is SUPER IMPORTANT - this is the foundation for offline-first architecture

## Problem Statement
Implement SQLite storage using @capacitor-community/sqlite for true offline-first data persistence. This replaces localStorage for native apps while maintaining web compatibility.

## Critical Requirements
- **Zero data loss** during migration
- **Backwards compatibility** with localStorage
- **Offline-first** architecture
- **Multi-user support** from the start
- **Platform detection** for appropriate storage

## Architecture Overview

### Storage Strategy by Platform
```javascript
const StorageStrategy = {
    WEB: 'localStorage',      // Browser/PWA
    NATIVE: 'sqlite',          // iOS/Android via Capacitor
    FALLBACK: 'indexedDB'      // If SQLite fails
};
```

### Data Schema
```sql
-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    settings TEXT, -- JSON
    created_at INTEGER,
    updated_at INTEGER
);

-- Tasks table  
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    completed INTEGER DEFAULT 0,
    task_order INTEGER,
    category TEXT,
    priority TEXT,
    time_estimate INTEGER,
    icon TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Photos table (reference only, blob in IndexedDB)
CREATE TABLE task_photos (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    photo_id TEXT NOT NULL,
    caption TEXT,
    category TEXT,
    display_order INTEGER,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

## Implementation Design

### Core Storage Module
```javascript
(function() {
    'use strict';
    
    var SQLiteStorage = {
        db: null,
        isNative: false,
        isReady: false,
        
        init: async function() {
            var platform = Platform.detect();
            this.isNative = platform.isNative;
            
            if (this.isNative && window.Capacitor) {
                await this._initSQLite();
            } else {
                // Use localStorage for web
                this._initWebStorage();
            }
        },
        
        _initSQLite: async function() {
            try {
                const sqlite = window.Capacitor.Plugins.CapacitorSQLite;
                
                // Create/open database
                this.db = await sqlite.createConnection({
                    database: 'stackmap.db',
                    version: 1,
                    encrypted: false,
                    mode: 'no-encryption'
                });
                
                await this.db.open();
                await this._createTables();
                this.isReady = true;
                
            } catch (error) {
                console.error('SQLite init failed:', error);
                // Fallback to web storage
                this._initWebStorage();
            }
        }
    };
    
    window.SQLiteStorage = SQLiteStorage;
})();
```

### Migration Safety (CRITICAL!)
Based on Issue #34 learnings:
```javascript
const MigrationManager = {
    async migrateFromLocalStorage() {
        // 1. Create backup first
        const backup = await this.createBackup();
        
        try {
            // 2. Read all localStorage data
            const data = this.readAllLocalStorage();
            
            // 3. Validate data integrity
            if (!this.validateData(data)) {
                throw new Error('Data validation failed');
            }
            
            // 4. Write to SQLite in transaction
            await this.db.transaction(async (tx) => {
                await this.migrateUsers(tx, data.users);
                await this.migrateTasks(tx, data.tasks);
            });
            
            // 5. Verify migration
            const verified = await this.verifyMigration(data);
            if (!verified) {
                throw new Error('Migration verification failed');
            }
            
            // 6. Keep localStorage for 30 days as backup
            this.markLocalStorageAsArchived();
            
        } catch (error) {
            // Automatic rollback
            await this.restoreFromBackup(backup);
            throw error;
        }
    }
};
```

## Files to Create/Modify

1. **Create `js/sqlite-storage.js`**
   - Core SQLite implementation
   - Platform detection logic
   - Migration management

2. **Create `js/storage-adapter.js`**
   - Unified API for all storage types
   - Automatic platform selection
   - Fallback handling

3. **Update `js/storage.js`**
   - Use new adapter
   - Maintain backward compatibility

4. **Create `capacitor.config.json`** updates
   ```json
   {
     "plugins": {
       "CapacitorSQLite": {
         "iosDatabaseLocation": "Library/LocalDatabase"
       }
     }
   }
   ```

## Implementation Checklist

### Phase 1: Core Implementation
- [ ] Install @capacitor-community/sqlite
- [ ] Create SQLite storage module
- [ ] Implement table schemas
- [ ] Add platform detection

### Phase 2: Data Operations
- [ ] CRUD operations for tasks
- [ ] User management functions
- [ ] Query optimization
- [ ] Transaction support

### Phase 3: Migration System
- [ ] Backup creation (30-day retention)
- [ ] Data validation
- [ ] Atomic migration
- [ ] Verification system
- [ ] Rollback capability

### Phase 4: Testing & Polish
- [ ] Unit tests for all operations
- [ ] Migration failure scenarios
- [ ] Performance benchmarks
- [ ] Error handling

## Testing Requirements

### Critical Test Scenarios
1. **Migration Safety**
   ```javascript
   // Test migration with corruption
   localStorage.setItem('tasks', '{"corrupt: true');
   await SQLiteStorage.migrate();
   // Should rollback, keep original data
   ```

2. **Platform Fallback**
   ```javascript
   // Test when SQLite unavailable
   window.Capacitor = undefined;
   await SQLiteStorage.init();
   // Should use localStorage
   ```

3. **Large Data Sets**
   - Test with 1000+ tasks
   - Verify performance
   - Check memory usage

4. **Offline Scenarios**
   - All operations work offline
   - Sync when online (future)

## Performance Requirements
- Task list load: <100ms
- Single task save: <50ms  
- Migration of 1000 tasks: <5s
- Memory usage: <50MB

## Error Handling
```javascript
const SQLiteErrors = {
    MIGRATION_FAILED: 'We kept your data safe. Try again?',
    DB_LOCKED: 'Database busy, retrying...',
    QUOTA_EXCEEDED: 'Storage full. Let\'s free up space.',
    CORRUPT_DATA: 'Found an issue. Using your backup.'
};
```

## Definition of Done
- [ ] SQLite works on iOS/Android
- [ ] Falls back to localStorage on web
- [ ] Zero data loss migration
- [ ] 30-day backup retention
- [ ] All CRUD operations work
- [ ] Multi-user support ready
- [ ] Performance targets met
- [ ] Error messages RSD-aware
- [ ] Passes all test scenarios
- [ ] Video demo of migration

## Common Pitfalls to Avoid
1. Don't delete localStorage immediately
2. Don't trust single backup location
3. Don't skip data validation
4. Don't forget transaction rollback
5. Always handle offline state

Remember: This is the foundation. If storage fails, the entire app fails. Be paranoid about data safety!