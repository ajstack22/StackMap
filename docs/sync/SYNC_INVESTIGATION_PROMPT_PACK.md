# StackMap Sync System Investigation Prompt Pack
*Created: August 2025*
*Purpose: Technical investigation into persistent sync issues*

## 🎯 Investigation Objective

Investigate and propose architectural solutions for critical sync issues in StackMap, a React Native app supporting neurodivergent users who depend on reliable, consistent task management across devices.

## 🚨 Critical Recent Issue (August 25, 2025)

**Symptom**: User marked 5 cards complete, ~30 seconds later all reverted to incomplete.

**Context**: This occurred on version 2025.08.25.x with the current complex sync architecture that uses:
- Last-write-wins with timestamp-based conflict resolution
- 10-second debounce after changes
- 30-second periodic sync interval
- Zero-knowledge encryption (TweetNaCl.js)

## 📋 Complete Issue History

### 1. Sync Reversion Issues (Ongoing)
- **Changes disappear after sync**: User edits on one device get overwritten
- **Rapid edit conflicts**: Editing then reordering causes first edit to revert
- **Completion state reversion**: Marked complete items revert to incomplete
- **Missing timestamp updates**: Some operations don't update modifiedAt
- **Stale React props**: Components using outdated data during reorder

### 2. Race Conditions (Partially Fixed)
- **Sync join failures**: "No valid users found" when joining existing sync
- **Import overwrites**: Sync pulls and overwrites just-imported data
- **Multiple devices joining**: Simultaneous joins cause data corruption
- **Push/pull timing**: Devices pulling while another is mid-push

### 3. Architecture Issues
- **Complex codebase**: syncService.js is ~2200 lines
- **Scattered logic**: 9+ supporting modules for sync
- **State management**: 4 separate Zustand stores that must stay synchronized
- **Field naming inconsistencies**: Historical text/name/title and icon/emoji variations
- **Protection mechanisms backfiring**: 3-second "too recent" protection blocking valid updates

### 4. Platform-Specific Issues
- **iOS**: AsyncStorage performance problems, 20+ second freezes
- **Web**: Service worker caching old bundles
- **Android**: FlexWrap layout issues affecting UI updates

### 5. User Experience Problems
- **Data loss perception**: Users see their work disappear
- **Trust erosion**: Neurodivergent users need reliability for daily routines
- **Sync status confusion**: Unclear when sync is active/working
- **Recovery difficulty**: No clear path when sync fails

## 🔍 Research Topics for 2025

### 1. Modern Sync Architectures (2025 State of the Art)
- **CRDTs (Conflict-free Replicated Data Types)**: How Yjs, Automerge handle this in 2025
- **Event Sourcing**: Whether this pattern could prevent reversion issues
- **Operational Transformation**: Like Google Docs real-time collaboration
- **Vector Clocks vs Timestamps**: Better conflict resolution strategies
- **Research Question**: What sync patterns do successful 2025 apps use for similar use cases?

### 2. React Native Sync Solutions (2025 Versions)
- **Current Stack**: React Native 0.72.4, Zustand state management
- **WatermelonDB**: Offline-first database with sync capabilities
- **Realm Sync**: MongoDB's solution for React Native
- **Firebase Realtime Database**: Google's approach
- **AWS Amplify DataStore**: Amazon's offline/online sync
- **Research Question**: Which solutions handle rapid edits and prevent reversions in 2025?

### 3. Zero-Knowledge Sync Patterns (Privacy-First 2025)
- **Current**: TweetNaCl.js for encryption, custom sync protocol
- **Standard Notes approach**: How they handle encrypted sync
- **Obsidian Sync**: Their end-to-end encrypted solution
- **Notion's offline mode**: How they prevent conflicts
- **Research Question**: How do 2025 privacy-focused apps handle sync conflicts?

## 🏗️ Architectural Patterns to Investigate

### 1. Event-Based Architecture
```javascript
// Instead of last-write-wins, track all events
{
  type: 'ACTIVITY_COMPLETED',
  activityId: 'abc123',
  timestamp: 1724601600000,
  deviceId: 'device1',
  previousState: { completed: false },
  newState: { completed: true }
}
```

### 2. Optimistic UI with Rollback
```javascript
// Apply changes immediately, rollback if conflict
{
  localChanges: [...], // Optimistic updates
  confirmedState: {...}, // Server-confirmed state
  pendingSync: [...], // Changes awaiting confirmation
}
```

### 3. Hybrid Clock Approach
```javascript
// Combine logical and physical timestamps
{
  modifiedAt: 1724601600000, // Physical timestamp
  version: 5, // Logical version
  vectorClock: { device1: 3, device2: 5 }, // Device-specific versions
}
```

### 4. Simplified Sync Protocol
```javascript
// Reduce complexity with clear separation
SyncEngine: Core sync logic (< 200 lines)
ConflictResolver: Pluggable strategies
StorageAdapter: Platform-specific storage
EncryptionLayer: Separate encryption concerns
```

## 💡 Key Questions to Answer

1. **Why do completions revert after 30 seconds?**
   - Is it the periodic sync pulling stale data?
   - Are timestamps not being properly set/compared?
   - Is there a race condition with the 10-second debounce?

2. **Can we reproduce reliably?**
   - Create test scenario: Mark 5 items complete
   - Wait exactly 30 seconds
   - Check if periodic sync is reverting

3. **What would a simpler architecture look like?**
   - Could we use a single source of truth?
   - Can we eliminate the complex conflict resolution?
   - Should we move to an append-only log?

## 📊 Current System Analysis

### Data Flow
```
User Action → Store Update → Debounce (10s) → Encrypt → Push to Server
                    ↓
            Periodic Sync (30s) → Pull from Server → Decrypt → Conflict Resolution → Store Update
```

### Problem Areas
1. **Conflict Resolution** (conflictResolver.js:728-772)
   - Prefers timestamped versions but logic has been confusing
   - Missing timestamps default to 0

2. **Store Updates** (App.js:1868-1901)
   - toggleActivity adds completedAt but may miss modifiedAt
   - Race between React props and store state

3. **Sync Timing** (syncService.js:94-113)
   - 10s debounce might not be enough
   - 30s periodic might pull before push completes

## 🛠️ Testing Scenarios

### Scenario 1: Rapid Completion Test
```javascript
// Mark 5 items complete in quick succession
// Wait 30 seconds
// Check if they revert
```

### Scenario 2: Multi-Device Race
```javascript
// Device A: Mark items complete
// Device B: Simultaneously edit different items
// Check final state on both devices
```

### Scenario 3: Network Interruption
```javascript
// Mark items complete
// Disconnect network
// Wait 30 seconds
// Reconnect
// Check if changes persist
```

## 📚 Required Reading

1. `/docs/sync/README.md` - Current architecture
2. `/docs/sync/troubleshooting.md` - Known issues and fixes
3. `/src/services/sync/syncService.js` - Main sync implementation
4. `/src/services/sync/conflictResolver.js` - Conflict resolution logic
5. `/CLAUDE.md` - Project-specific guidelines

## 🎯 Success Criteria

A successful investigation should:
1. **Identify root cause** of the 30-second reversion issue
2. **Propose architectural solution** that prevents all listed issues
3. **Maintain zero-knowledge encryption** requirement
4. **Simplify codebase** (target: < 500 lines core sync)
5. **Ensure reliability** for neurodivergent users who depend on consistency

## 🚀 Next Steps

1. **Reproduce the issue** with detailed logging
2. **Analyze sync timing** with timestamps
3. **Review conflict resolution** logic
4. **Prototype alternative architecture**
5. **Test with real-world scenarios**

---

## Prompt for New Engineer

"I need you to investigate critical sync issues in StackMap (v2025.08.25.x), a React Native app for neurodivergent users. Users are experiencing data reversion where completed tasks revert after ~30 seconds. 

Please:
1. Review the attached SYNC_INVESTIGATION_PROMPT_PACK.md for full context
2. Analyze the current sync architecture in /src/services/sync/
3. Research modern sync patterns used by successful apps in 2025
4. Propose an architectural solution that prevents reversion issues
5. Consider CRDT, event sourcing, or other conflict-free approaches
6. Maintain zero-knowledge encryption requirement
7. Target < 500 lines for core sync logic

The current system is overly complex (2200+ lines) and causing reliability issues that severely impact our neurodivergent users who depend on consistent daily routines. We need a simpler, more reliable solution."