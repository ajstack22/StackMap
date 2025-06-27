# [ARCHIVED] New Session Prompts for IndexedDB Implementation

> **Note**: These prompts assumed progressive migration. See MOBILE_FIRST_IMPLEMENTATION.md for the current mobile-first approach without migration.

## Important Context
The StackMap project has pivoted from Service Workers to IndexedDB for offline storage after discovering that Service Worker complexity poses unacceptable risks for neurodivergent users. We're now implementing a safer, more predictable approach using IndexedDB with extensive safety mechanisms.

---

## Prompt 1: Storage Abstraction Developer

### Session Prompt
```
I need you to implement a storage abstraction layer for StackMap's mobile-first refactor. 

Context:
- StackMap is a task management app for users with ADHD/autism who need absolute stability
- Currently uses localStorage throughout the codebase
- Need to migrate to IndexedDB without breaking anything
- Must support 30-day parallel operation for safe migration

Key Requirements:
1. Create StorageManager class that abstracts localStorage and IndexedDB
2. Implement parallel writes during migration period
3. Add checksum verification for all data
4. Support progressive migration with rollback capability
5. Handle all errors gracefully with RSD-safe messaging

Please read:
- /refactor/CLAUDE.md for project context
- /refactor/docs/INDEXEDDB_IMPLEMENTATION_PROMPTS.md for detailed requirements
- /refactor/js/messaging.js for RSD-safe error handling
- /refactor/docs/architecture.md for current storage approach

Start by analyzing the current localStorage usage in app.js and create a migration plan.
```

---

## Prompt 2: Dexie.js Safety Engineer

### Session Prompt
```
I need you to integrate Dexie.js with comprehensive safety wrappers for StackMap's IndexedDB implementation.

Context:
- StackMap serves users with ADHD/autism who cannot tolerate data loss
- Need bulletproof data integrity with corruption detection
- Must handle all browser quirks and edge cases
- Zero data loss is the #1 priority

Key Requirements:
1. Set up Dexie.js with proper schema for tasks, settings, attachments
2. Implement write verification (write → read → compare)
3. Add checksums to detect corruption
4. Create recovery mechanisms for corrupted data
5. Handle schema migrations with backup

Please read:
- /refactor/CLAUDE.md for project context
- /refactor/docs/INDEXEDDB_IMPLEMENTATION_PROMPTS.md (Prompt 2) for detailed requirements
- /refactor/js/messaging.js for error transformation
- GitHub Issue #23 for additional context

Focus on making every operation verifiable and recoverable.
```

---

## Prompt 3: Migration System Architect

### Session Prompt
```
I need you to build a progressive migration system from localStorage to IndexedDB for StackMap.

Context:
- Users have executive function challenges and depend on routine
- Cannot have any disruption during migration
- Need 30-day parallel operation with verification
- Must support instant rollback if issues detected

Key Requirements:
1. Implement phased migration (shadow writes → parallel reads → primary switch)
2. Add daily integrity checks comparing both stores
3. Create checkpoint system for rollback
4. Monitor migration progress with telemetry
5. Provide non-intrusive status updates

Please read:
- /refactor/CLAUDE.md for project context
- /refactor/docs/INDEXEDDB_IMPLEMENTATION_PROMPTS.md (Prompt 3) for migration phases
- /refactor/docs/architecture.md for current storage structure
- GitHub Issue #22 for requirements

The migration must be invisible to users unless action is needed.
```

---

## Prompt 4: Memory Management Specialist

### Session Prompt
```
I need you to implement blob lifecycle management for StackMap's attachment system.

Context:
- Users may have low-end devices (512MB RAM)
- Attachments can be images, PDFs, etc.
- Must prevent memory exhaustion
- Need to handle Safari's 10MB limit

Key Requirements:
1. Implement reference counting for blobs
2. Create LRU cache (max 10 blobs in memory)
3. Add progressive image compression
4. Monitor storage quotas across browsers
5. Provide graceful degradation

Please read:
- /refactor/CLAUDE.md for project context
- /refactor/docs/INDEXEDDB_IMPLEMENTATION_PROMPTS.md (Prompt 4) for blob lifecycle
- /refactor/research/Offline-first architecture.md for storage limits
- GitHub Issue #24 for additional requirements

Focus on memory efficiency without losing user data.
```

---

## Prompt 5: Conflict Resolution Developer

### Session Prompt
```
I need you to implement CRDT-based conflict resolution for StackMap's multi-device sync.

Context:
- Users may edit tasks on multiple devices while offline
- Cannot show conflict dialogs (causes anxiety)
- Must handle up to 30 days offline
- Need automatic resolution for 99% of cases

Key Requirements:
1. Implement Last-Write-Wins with vector clocks
2. Create three-way merge for compatible changes
3. Preserve all versions for recovery
4. Handle special cases (task completion is permanent)
5. Test with clock skew scenarios

Please read:
- /refactor/CLAUDE.md for project context
- /refactor/docs/INDEXEDDB_IMPLEMENTATION_PROMPTS.md (Prompt 5) for conflict types
- /refactor/research/Offline-first architecture.md for CRDT patterns
- GitHub Issue #24 for sync requirements

Remember: Users should never see merge conflicts.
```

---

## Prompt 6: Testing Infrastructure Engineer

### Session Prompt
```
I need you to create comprehensive testing infrastructure for StackMap's IndexedDB implementation.

Context:
- Testing for users who cannot tolerate failures
- Must cover all edge cases and failure modes
- Need chaos testing for corruption scenarios
- Performance critical on low-end devices

Key Requirements:
1. Create unit tests for every storage operation
2. Build integration tests for migration scenarios
3. Implement chaos testing (corruption, quota, crashes)
4. Add performance benchmarks
5. Set up cross-browser compatibility tests

Please read:
- /refactor/CLAUDE.md for testing requirements
- /refactor/docs/INDEXEDDB_IMPLEMENTATION_PROMPTS.md (Prompt 7) for test scenarios
- /refactor/docs/critical-fixes-needed.md for browser issues
- All GitHub issues (#22, #23, #24) for acceptance criteria

Success metric: Zero data loss in all test scenarios.
```

---

## General Guidance for All Sessions

1. **Always read CLAUDE.md first** - It contains critical project context
2. **Use ES5 syntax** - The app must work on Android 5 WebView
3. **Transform all errors** - Use messaging.js for RSD-safe messages
4. **Test everything** - Users depend on this app for daily functioning
5. **No surprises** - Every change must be predictable and safe

## Success Criteria

Each implementation must:
- Work offline for 30+ days
- Handle corrupted data gracefully
- Perform well on 512MB devices
- Support instant rollback
- Preserve user data at all costs

## Remember

You're building for users with ADHD and autism who:
- Depend on routine and consistency
- Cannot tolerate unexpected changes
- Need absolute reliability
- May have sensory sensitivities
- Trust this app with their daily functioning

Every line of code should reflect this responsibility.