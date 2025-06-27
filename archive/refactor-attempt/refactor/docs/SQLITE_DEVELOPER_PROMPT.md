# SQLite Storage Implementation Prompt

## Your Mission
Implement SQLite storage for StackMap using @capacitor-community/sqlite based on the proven research findings.

## Context
The research is complete: SQLite is the clear winner. Todoist, Notion, and Bear all use it. It provides <0.1% failure rate with 2-5ms operations even on 512MB devices.

## Implementation Plan

### 1. Setup (4 hours)
```bash
npm install @capacitor-community/sqlite
npx cap sync
```

### 2. Core Implementation
Implement the TaskDatabaseService from the research:
- Start with the minimal version (bottom of research doc)
- Use the full implementation as reference
- Keep it simple - no over-engineering

### 3. Integration Points
- Replace the stubbed IndexedDB in `/refactor/js/storage-adapter.js`
- Adapt to our existing schema in `/refactor/js/db-schema.js`
- Use existing error handling from `/refactor/js/messaging.js`

### 4. Key Configuration
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false
    }
  }
};
```

### 5. Database Schema (from research)
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

CREATE TABLE attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

### 6. Critical Implementation Notes
- Use WAL mode for reliability: `PRAGMA journal_mode = WAL;`
- Implement pagination (50 tasks at a time)
- Store images in filesystem, references in DB
- Add export/import for manual backup
- Migrate from localStorage on first run

### 7. Testing Checklist
- [ ] Create 1000 tasks - should take <900ms
- [ ] Load 50 tasks - should take <45ms  
- [ ] Add image attachment - should take <70ms
- [ ] Memory usage stays under 3MB
- [ ] Data survives app force-stop
- [ ] Export/import works correctly

## What NOT to Do
- Don't add encryption (performance cost)
- Don't implement sync (yet)
- Don't add complex migrations
- Don't over-optimize early

## Success Criteria
- Works on Android 5+ and iOS 14+
- <3MB memory on 512MB devices
- All operations <100ms
- Zero data loss in normal use
- Simple enough to maintain

## Resources
- Full research: `/refactor/research/Storage implementation for ADHDautism-focused task management app.md`
- Existing code: `/refactor/js/storage-adapter.js` (integrate here)
- Schema reference: `/refactor/js/db-schema.js`

## Remember
SQLite is the boring, proven choice. Todoist uses it. Notion uses it. It just works. Keep the implementation simple and focus on reliability over features.