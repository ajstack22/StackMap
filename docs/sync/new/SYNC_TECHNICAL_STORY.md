# Technical Story: Fix StackMap Sync System

## Story
As a StackMap user, I want my data to sync reliably between devices so that I can access my activities from anywhere without data loss.

## Current Situation
- **40+ failed deployments** attempting to fix sync
- **Critical Bug**: Device B receives data but loses it on refresh
- **Impact**: Users losing data, no trust in sync feature
- **Root Cause**: Architectural complexity obscuring simple bugs

## The Ask
Rebuild the sync system using a phased approach that starts extremely simple and adds complexity only after each layer is proven to work.

## Technical Context

### Reference Documents
1. **[SYNC_INTERFACES_SPEC.md](./SYNC_INTERFACES_SPEC.md)** - Complete system architecture
2. **[SYNC_REBUILD_PLAN.md](./SYNC_REBUILD_PLAN.md)** - Detailed implementation strategy

### Key Technical Constraints
- **Zero-knowledge encryption** (server never sees plaintext)
- **CRDT conflict resolution** (handle concurrent edits)
- **Cross-platform** (Web, iOS, Android)
- **AsyncStorage limitations** (especially iOS freezing)

## Implementation Approach

### Phase 1: Make Two Browser Tabs Exchange Data (Days 1-3)
**Goal**: Prove basic data exchange works

**Tasks**:
1. Create minimal sync service (no encryption, no CRDT)
2. Implement push/pull to existing API endpoints
3. Add verbose logging at every step
4. Store data in AsyncStorage
5. Test with two browser tabs

**Definition of Done**:
- [ ] Tab A creates data, Tab B receives it
- [ ] Data persists after Tab B refreshes
- [ ] Tab B creates data, Tab A receives it
- [ ] Clear console logs show data flow

**Code Location**: Create new `src/services/sync/simpleSyncService.js`

### Phase 2: Connect to State Management (Days 4-5)
**Goal**: Integrate with Zustand stores properly

**Tasks**:
1. Read state from all stores (User, Settings, Library)
2. Apply received state using store methods (NOT setState)
3. Handle field normalization (emoji→icon, name→text)
4. Test state persistence

**Definition of Done**:
- [ ] Activities sync between devices
- [ ] User settings sync
- [ ] Library templates sync
- [ ] No data corruption after multiple syncs

**Critical**: Must use store-specific methods:
```javascript
// CORRECT
useUserStore.getState().setUsers(users)

// WRONG - breaks sync
useAppStore.setState({users})
```

### Phase 3: Add Conflict Resolution (Days 6-8)
**Goal**: Handle concurrent edits gracefully

**Tasks**:
1. Implement timestamp-based Last-Write-Wins
2. Add field-level conflict resolution
3. Handle activity completion states
4. Test concurrent modifications

**Definition of Done**:
- [ ] Both devices can edit simultaneously
- [ ] Changes merge predictably
- [ ] No data loss during conflicts
- [ ] Activity order preserved

### Phase 4: Add Encryption (Days 9-10)
**Goal**: Secure the data exchange

**Tasks**:
1. Implement key derivation from recovery phrase
2. Add encryption/decryption layer
3. Maintain backward compatibility
4. Test with existing sync groups

**Definition of Done**:
- [ ] Data encrypted end-to-end
- [ ] Recovery phrase generates same key
- [ ] Can join existing sync groups
- [ ] Server never sees plaintext

### Phase 5: Production Hardening (Days 11-15)
**Goal**: Make it production-ready

**Tasks**:
1. Add 60-second protection period for new devices
2. Implement offline queue
3. Add retry logic with backoff
4. Performance optimization
5. Error handling and recovery

**Definition of Done**:
- [ ] Handles network failures gracefully
- [ ] No race conditions
- [ ] Performance < 3s initial sync
- [ ] Clear error messages

## Acceptance Criteria

### Minimum Viable Sync
1. **Two Browser Test**
   - Open app in two browser tabs
   - Create sync in Tab A with 3 activities
   - Join sync in Tab B with recovery phrase
   - Tab B shows all 3 activities
   - Refresh Tab B - activities still there ✓
   - Add activity in Tab B
   - Refresh Tab A - sees new activity ✓

2. **Mobile Test**
   - Same as above but with phone + desktop
   - Must survive app restart

3. **Conflict Test**
   - Both devices have same activities
   - Simultaneously mark different items complete
   - Both devices converge to same state

### Performance Requirements
- Initial sync: < 3 seconds
- Periodic sync: < 1 second  
- No UI freezing during sync
- Works on slow 3G connection

### Error Handling
- Network failure: Clear message, retry button
- Invalid recovery phrase: Helpful error
- Server down: Graceful degradation
- Corrupted data: Recovery attempt

## Development Guidelines

### Critical Rules
1. **Start Simple** - Phase 1 is just JSON exchange, nothing fancy
2. **Test Obsessively** - Manual test after every change
3. **Log Everything** - Console.log at every interface boundary
4. **No Shortcuts** - Complete each phase before moving on
5. **Use References** - Don't reinvent, check the spec docs

### Testing Setup
```bash
# Terminal 1: Run web on port 3000
npm run web

# Terminal 2: Run web on port 3001  
PORT=3001 npm run web

# Test in two browser tabs
# Use Chrome DevTools Network tab to monitor API calls
# Check Application > Local Storage for persistence
```

### Where to Look
- Current sync code: `src/services/sync/`
- Store definitions: `src/stores/`
- API endpoints: `sync/api/`
- Test utilities: `src/utils/dataNormalizer.js`

### Common Pitfalls to Avoid
1. **Don't copy the old sync wholesale** - It's too complex
2. **Don't skip to encryption** - Get basics working first
3. **Don't use useAppStore.setState** - Breaks sync
4. **Don't ignore race conditions** - They will bite you
5. **Don't assume AsyncStorage works** - It has issues on iOS

## Success Metrics
- Zero data loss incidents
- Sync works 99% of the time
- Users trust the feature
- No more "sync is broken" reports

## Communication
- Daily standups with progress update
- Blockers raised immediately
- Test results shared in Slack
- PR per phase for code review

## Next Steps
1. Read this story completely
2. Review `SYNC_INTERFACES_SPEC.md` for architecture understanding
3. Review `SYNC_REBUILD_PLAN.md` for detailed implementation
4. Set up two-browser test environment
5. Start Phase 1 with `simpleSyncService.js`
6. Report progress daily

---

**Remember**: After 40+ failed attempts, we need a different approach. Start ridiculously simple. Test everything. Add complexity gradually. Success is measured by working sync, not clever code.