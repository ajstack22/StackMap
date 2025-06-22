# [OUTDATED] Mobile Storage Developer Prompt

> **Note**: This prompt contains outdated assumptions about IndexedDB complexity. See MOBILE_STORAGE_DEVELOPER_PROMPT_SIMPLE.md for current approach while we await research results.

## Your Mission
Implement a bulletproof IndexedDB storage layer for StackMap's mobile app that works flawlessly offline and handles all edge cases.

## Context
StackMap is a task management app for users with ADHD/autism who need absolute reliability. This is a **fresh mobile-first implementation** - no migration needed. Users depend on this app for daily functioning, so data loss is unacceptable.

## Current State
- ✅ Storage abstraction layer exists (`/refactor/js/storage-adapter.js`)
- ✅ Blob manager implemented (`/refactor/js/blob-manager.js`)
- ✅ Database schema designed (`/refactor/js/db-schema.js`)
- ❌ Dexie.js integration stubbed but not implemented
- ❌ No tests exist

## Your Task: Complete the IndexedDB Implementation

### 1. First, understand the existing code:
```bash
# Read these files to understand current state:
- /refactor/js/storage-adapter.js (see line 138 - IndexedDB stubbed)
- /refactor/js/db-schema.js (Dexie schema ready)
- /refactor/js/blob-manager.js (attachment handling)
- /refactor/js/messaging.js (RSD-safe error messages)
- /refactor/CLAUDE.md (project context)
```

### 2. Implement Dexie.js Integration:
- Complete the `supportsIndexedDB()` method to actually use Dexie
- Implement all storage operations using Dexie transactions
- Add write verification (write → read → compare)
- Handle offline queue for future sync
- Ensure all errors use RSD-safe messaging

#### ⚠️ ADVERSARIAL REVIEW WARNING:
The current approach has critical gaps that could cause data loss:

**MISSING CRITICAL SAFEGUARDS:**
1. **No backup before IndexedDB operations** - If IndexedDB corrupts, data is gone forever
2. **No transaction rollback mechanism** - Partial writes could corrupt data
3. **No handling for Dexie upgrade failures** - Schema changes could brick the app
4. **No explicit iOS/Android storage persistence** - OS can delete IndexedDB without warning
5. **No data export mechanism** - Users can't manually backup their data

**REQUIRED ADDITIONS:**
```javascript
// CRITICAL: Add these before ANY IndexedDB operations
1. Implement localStorage backup of critical data before each transaction
2. Add transaction wrapper with automatic rollback on failure
3. Create data export to JSON functionality (user-triggered)
4. For iOS: Request persistent storage via navigator.storage.persist()
5. For Android: Monitor storage pressure and warn users
```

### 3. Key Requirements:
- **Zero data loss** - Every write must be verified
- **Offline-first** - Assume no internet connection
- **Memory efficient** - Must work on 512MB devices
- **Fast** - All operations < 100ms
- **Resilient** - Handle app crashes, storage pressure

### 4. Mobile-Specific Considerations:
- App may be killed at any time by OS
- Storage may be cleared by system
- WebView varies across Android versions
- User may reinstall app (preserve data)

#### ⚠️ ADVERSARIAL REVIEW - CRITICAL MOBILE ISSUES:

**YOU'RE NOT HANDLING THESE KILLERS:**
1. **iOS WKWebView storage eviction** - IndexedDB can be deleted after 7 days of no use
2. **Android System WebView crashes** - Corrupts IndexedDB on some devices
3. **Background restrictions** - Writes interrupted when app backgrounds
4. **No handling for storage permission denials**
5. **Missing app lifecycle hooks** - Need Capacitor App plugin integration

**MUST IMPLEMENT:**
```javascript
// Use Capacitor for proper lifecycle handling
import { App } from '@capacitor/app';

App.addListener('appStateChange', ({ isActive }) => {
  if (!isActive) {
    // Force flush any pending writes
    // Save critical state to Capacitor Preferences
  }
});

// For iOS persistence
if (Capacitor.getPlatform() === 'ios') {
  // Use Capacitor Storage plugin as primary
  // IndexedDB as secondary only
}
```

### 5. Implementation Checklist:
- [ ] Complete Dexie.js setup in storage-adapter.js
- [ ] Implement save() with checksums and verification
- [ ] Implement get() with corruption detection  
- [ ] Add offline queue for sync operations
- [ ] Handle storage quota and cleanup
- [ ] Test on Android 5 WebView
- [ ] Add performance monitoring
- [ ] Create recovery mechanisms

#### ⚠️ ADVERSARIAL REVIEW - INCOMPLETE CHECKLIST:

**CRITICAL MISSING ITEMS:**
- [ ] **Implement dual-write to Capacitor Preferences for critical data**
- [ ] **Add automatic localStorage backup before transactions**
- [ ] **Create manual export/import functionality**
- [ ] **Implement storage persistence request for iOS/Safari**
- [ ] **Add Capacitor App lifecycle integration**
- [ ] **Create corruption recovery from localStorage backup**
- [ ] **Implement storage pressure monitoring**
- [ ] **Add data integrity verification on app launch**
- [ ] **Handle IndexedDB deletion by OS**
- [ ] **Test with storage full scenarios**

**WITHOUT THESE, YOU WILL LOSE USER DATA!**

### 6. Code Standards:
```javascript
// Use ES5 syntax for Android 5 compatibility
var storage = {
    save: function(key, data) {
        // NOT arrow functions or const/let
    }
};

// Always handle errors gracefully
try {
    // attempt operation
} catch (error) {
    console.warn('Storage operation needs retry:', error);
    // Never crash, always recover
}
```

### 7. Testing Your Implementation:
- Simulate storage quota exceeded
- Force-quit app during write operations
- Test with 100MB of data
- Verify checksum on every read
- Test offline for extended periods

#### ⚠️ ADVERSARIAL REVIEW - INSUFFICIENT TESTING:

**THESE TESTS WON'T CATCH THE REAL KILLERS:**

**MUST ALSO TEST:**
1. **iOS Background Eviction**
   - Leave app unused for 7 days
   - Verify data survives iOS cleanup
   
2. **Android WebView Crashes**
   - Force crash during IndexedDB write
   - Corrupt IndexedDB manually
   - Test recovery mechanisms
   
3. **Real Device Scenarios**
   - Fill device storage to 95%
   - Install/uninstall app repeatedly
   - Upgrade app with schema changes
   - Clear app data in OS settings
   
4. **Race Conditions**
   - Multiple rapid saves to same key
   - Background/foreground transitions during writes
   - Network state changes during operations
   
5. **Data Recovery Testing**
   - Delete IndexedDB, verify localStorage backup works
   - Corrupt checksums, verify detection
   - Test export/import round trip

## Definition of Done
1. Dexie.js fully integrated and working
2. All storage operations verified with checksums
3. Offline queue implemented
4. Memory usage < 50MB on 512MB devices
5. Zero data loss in chaos testing
6. All errors use RSD-safe messaging

### ⚠️ ADVERSARIAL REVIEW - REVISED DEFINITION OF DONE:

**THIS ISN'T "DONE" UNTIL:**

7. **Dual-write system implemented** (IndexedDB + Capacitor Preferences for critical data)
8. **Automatic backup to localStorage** before every transaction
9. **Manual export/import** functionality tested and working
10. **iOS persistence requested** and fallback implemented
11. **Capacitor lifecycle hooks** integrated and tested
12. **Corruption recovery** tested with real corruption scenarios
13. **7-day iOS eviction** tested and survived
14. **Storage pressure** handled gracefully
15. **Schema migration** tested without data loss
16. **Real device testing** on:
    - Android 5, 7, 10, 13
    - iOS 14, 15, 16, 17
    - Low memory devices (512MB)
    - Nearly full storage devices

**REMEMBER: These aren't edge cases for ADHD/autism users - they WILL hit every single one of these scenarios!**

## Resources
- GitHub Issue #23 has updated requirements
- Dexie.js docs: https://dexie.org
- Current implementation in `/refactor/js/`
- Research docs in `/refactor/research/`

## Remember
You're building for users who:
- Cannot tolerate data loss
- May have memory/attention challenges
- Depend on this app for daily functioning
- Need absolute reliability

Every line of code should reflect this responsibility. When in doubt, choose safety over performance.

---

## ⚠️ FINAL ADVERSARIAL WARNING

**The current plan will cause data loss for your most vulnerable users.**

**Why this plan fails:**
1. **Over-reliance on IndexedDB** - It's not reliable on mobile
2. **No real backup strategy** - Checksums don't help if DB is deleted
3. **Ignoring platform realities** - iOS WILL delete your data
4. **Missing Capacitor integration** - You need native storage APIs
5. **No user agency** - Users can't save their own data

**THE ONLY SAFE APPROACH:**
```javascript
// Priority order for storage:
1. Critical data → Capacitor Preferences (survives everything)
2. User data → IndexedDB with localStorage mirror
3. Attachments → IndexedDB with size monitoring
4. Export option → Always available to user
5. Import option → Can recover from any failure
```

**If you ignore these warnings, users with ADHD who depend on their task lists for medication reminders, work tasks, and daily functioning will lose everything when iOS decides to "optimize" storage. This isn't hypothetical - it WILL happen.**