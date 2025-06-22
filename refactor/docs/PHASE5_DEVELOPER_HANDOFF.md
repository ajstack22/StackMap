# Phase 5 Developer Handoff: Service Worker Implementation

## Status: Phase 4 Complete, Ready for Phase 5

**Handoff Date**: 2025-01-22  
**From**: Claude (Phase 4 Developer)  
**To**: Next Developer (Phase 5)

---

## What You're Inheriting

### ✅ Completed Work (Phases 1-4)

1. **Phase 1**: Zero-JavaScript emergency fallback (`emergency-static.html`)
2. **Phase 2**: Pre-boot error detection (50ms safety check)
3. **Phase 3**: Safe mode implementation (`?safe=true` parameter)
4. **Phase 4**: Inline fallback UI with error detection and data preservation

### 🎯 Your Mission: Phase 5 - Service Worker Offline Support

Implement a service worker that provides offline functionality while respecting the needs of users with ADHD and autism. This is the final piece of our emergency fallback system.

---

## Critical Context You Must Understand

### Our Users
- **Primary**: Adults with ADHD and executive function challenges
- **Secondary**: Autistic adults who need predictable, stable tools
- **Key Needs**: Routine stability, zero data loss, minimal cognitive load
- **Biggest Fear**: Losing work or having their routine disrupted

### Architecture Principles
1. **Stability Over Features**: A working simple app > broken complex app
2. **Progressive Enhancement**: Start basic, enhance carefully
3. **Graceful Degradation**: Every feature must have a fallback
4. **User Dignity**: Never make users feel stupid or overwhelmed

### Technical Constraints
- **ES5 Only**: Must work on Android 5 (512MB devices)
- **No Frameworks**: Vanilla JavaScript for reliability
- **Multiple Fallbacks**: SW → Safe Mode → Emergency Static
- **Zero External Dependencies**: Everything self-contained

---

## Phase 5 Requirements

### Core Functionality

1. **Offline Task Access**
   - Cache all task data locally
   - Enable full CRUD operations offline
   - Queue changes for sync when online

2. **Resilient Caching Strategy**
   ```javascript
   // Recommended approach from research
   const CACHE_STRATEGY = {
     'emergency-static.html': 'cacheFirst',    // Always available
     'index.html': 'networkFirst',             // Fresh when possible
     '/js/app.js': 'staleWhileRevalidate',    // Quick load, update in background
     '/api/*': 'networkOnly',                  // Don't cache dynamic data
     'assets/*': 'cacheFirst'                  // Static assets cached
   };
   ```

3. **Non-Alarming Status Indicators**
   - Use positive language: "Working offline" not "No connection"
   - Subtle visual indicator (small icon, not banner)
   - No red colors or error-like styling

4. **Update Management**
   - Silent updates by default
   - No disruption to active sessions
   - Version-based cache naming for clean updates

### Integration Points

1. **With Error Detection** (Phase 4)
   ```javascript
   // Report network failures to error system
   if (!navigator.onLine) {
     window.StackMapErrorDetection.reportNetworkError();
   }
   ```

2. **With Data Preservation** (Phase 4)
   ```javascript
   // Save to preservation system before SW cache
   window.StackMapDataPreservation.saveNow('offline-queue', changes);
   ```

3. **With Safe Mode** (Phase 3)
   - Service worker should respect safe mode settings
   - Reduced caching in safe mode to save memory

---

## Implementation Guidelines

### File Structure
```
/refactor/
├── sw.js                    # Service worker (create this)
├── js/
│   ├── app.js              # Main app (has SW registration spot)
│   └── sw-manager.js       # SW lifecycle management (create this)
└── manifest.json           # PWA manifest (already exists)
```

### Service Worker Registration

Add to `app.js` in the `init()` function:
```javascript
// Register service worker (after successful app load)
if ('serviceWorker' in navigator && !window.StackMapSafeMode) {
    navigator.serviceWorker.register('/sw.js')
        .then(function(reg) {
            console.log('Service worker registered');
        })
        .catch(function(err) {
            console.warn('Service worker registration failed:', err);
            // Continue without SW - graceful degradation
        });
}
```

### Critical Implementation Details

1. **Cache Versioning**
   ```javascript
   const CACHE_VERSION = 'stackmap-v1';
   const CRITICAL_CACHE = 'stackmap-critical-v1';
   ```

2. **Offline Queue Structure**
   ```javascript
   const offlineQueue = {
     actions: [],
     add: function(action) {
       this.actions.push({
         id: Date.now(),
         type: action.type,
         data: action.data,
         timestamp: new Date().toISOString()
       });
     }
   };
   ```

3. **Background Sync** (if supported)
   ```javascript
   self.addEventListener('sync', function(event) {
     if (event.tag === 'sync-tasks') {
       event.waitUntil(syncOfflineQueue());
     }
   });
   ```

---

## Testing Requirements

### Before ANY Commit

1. **Offline Functionality**
   - Kill network, verify app still works
   - Create/edit tasks offline
   - Verify sync when returning online

2. **Update Flow**
   - Change SW version
   - Verify clean update without data loss
   - Check no disruption to active session

3. **Memory Constraints**
   - Test on Chrome with 512MB device emulation
   - Verify SW doesn't exceed memory limits
   - Check cache size limits

4. **Integration Tests**
   - Trigger errors while offline
   - Verify data preservation works
   - Test safe mode with SW active

### Platform Testing
- Chrome (Desktop & Android)
- Safari (iOS - limited SW support)
- Firefox
- Samsung Internet
- Chrome with throttled network

---

## Common Pitfalls to Avoid

1. **Don't Cache Everything**
   - User data changes frequently
   - Limit cache size for low-end devices

2. **Don't Force Updates**
   - Users hate interrupted workflows
   - Use skipWaiting carefully

3. **Don't Show Scary Messages**
   - "Offline" is scary to some users
   - Use positive, action-oriented language

4. **Don't Assume navigator.onLine is Accurate**
   - It only checks network adapter
   - Implement actual fetch-based checks

---

## Resources

### Required Reading
1. `/refactor/research/Phase5-Research-Briefs.md` - Service Worker research
2. `/context/DEVELOPER_CONTEXT.md` - Overall project context
3. `/refactor/docs/PHASE4_WORKING_DOCUMENT.md` - What was just built

### Key APIs You'll Need
- Service Worker API
- Cache API  
- Background Sync API (optional)
- IndexedDB (for complex offline data)

### Testing Tools
- Chrome DevTools Service Worker panel
- Lighthouse PWA audit
- chrome://inspect/#service-workers

---

## Success Criteria

Your Phase 5 implementation succeeds when:

1. **Offline Works**: Users can use the app fully offline
2. **Data Persists**: No data loss during offline/online transitions  
3. **Updates are Smooth**: SW updates don't disrupt users
4. **Memory Efficient**: Works on 512MB Android devices
5. **Users Don't Notice**: Offline transition is seamless

---

## Handoff Checklist

Before starting Phase 5:
- [ ] Read all three required documents above
- [ ] Test Phase 4 implementation locally
- [ ] Understand the error detection system
- [ ] Review service worker best practices
- [ ] Set up testing environment with throttling

## Questions?

The Phase 4 implementation is solid and ready for Phase 5. The error detection and data preservation systems are designed to integrate cleanly with service workers.

Key integration points are marked in the code with `TODO` comments. The app.js file has a spot ready for SW registration.

Remember: Our users depend on this app for daily functioning. Every line of code should respect their needs and protect their data.

Good luck with Phase 5! 🚀