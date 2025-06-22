# Revised Implementation Priorities - Mobile-First IndexedDB

## Context Change: Fresh Mobile App, No Migration Needed

Since we're building a **new mobile-first app** for iOS/Android (not migrating existing web users), we can:
- ✅ Use IndexedDB from day one
- ✅ Skip the 30-day progressive migration
- ✅ Focus on mobile performance and reliability
- ✅ Keep localStorage only as emergency fallback

---

## New Priority Order

### 1. 🔴 CRITICAL: Complete IndexedDB Implementation
**Why First**: Core storage must work before anything else
- Implement Dexie.js integration (currently stubbed)
- Add write verification and checksums
- Handle offline/online seamlessly
- Test on real devices (Android 5+, iOS)

### 2. 🔴 CRITICAL: Blob/Attachment Management  
**Why Second**: Mobile users will take photos/attach files
- Implement progressive image compression
- Add memory pressure monitoring
- Handle device storage limits
- Optimize for mobile cameras

### 3. 🟡 HIGH: Testing Infrastructure
**Why Third**: Must verify reliability before release
- Unit tests for all storage operations
- Integration tests for offline scenarios
- Performance tests on low-end devices
- Chaos testing for app crashes

### 4. 🟡 HIGH: Conflict Resolution (Single Device)
**Why Fourth**: Handle app reinstalls and cache clearing
- Simple last-write-wins for now
- Focus on single-device scenarios first
- Multi-device sync can come later
- Handle app updates gracefully

### 5. 🟢 MEDIUM: Performance Optimization
**Why Fifth**: Ensure smooth experience
- Optimize for mobile CPUs
- Reduce memory footprint
- Implement lazy loading
- Add query indexes

---

## What We Can Skip/Defer

### Skip Entirely:
- ❌ 30-day progressive migration (no existing users)
- ❌ Parallel localStorage/IndexedDB operation
- ❌ Migration checkpoints and telemetry
- ❌ Complex browser compatibility (mobile WebView only)

### Defer to Later:
- ⏸️ Multi-device sync and conflict resolution
- ⏸️ Web browser support (focus on mobile app)
- ⏸️ PWA installation flows
- ⏸️ Service Worker complexity

---

## Immediate Action Items

### Week 1: Core Storage
```javascript
// Complete the IndexedDB implementation
class MobileStorage {
    constructor() {
        this.db = new Dexie('StackMapMobile');
        this.initSchema();
    }
    
    async save(key, data) {
        // Add checksum
        // Write to IndexedDB
        // Verify write succeeded
        // Handle offline queue
    }
}
```

### Week 2: Blob Management
```javascript
// Mobile-optimized image handling
class MobileAttachments {
    async processPhoto(blob) {
        // Compress if > 1MB
        // Generate thumbnail
        // Store with reference counting
        // Monitor memory usage
    }
}
```

### Week 3: Testing
- Create test suite for offline scenarios
- Test on minimum supported devices (512MB RAM)
- Verify data persistence through app updates
- Test crash recovery

### Week 4: Polish & Release
- Performance profiling on real devices
- Battery usage optimization
- Final stability testing
- App store preparation

---

## Mobile-Specific Considerations

### Storage Limits:
- iOS: No hard limit but system can clear
- Android: Varies by device and OS version
- Solution: Monitor usage, warn at 80%

### Offline First:
- Assume offline is normal state
- Queue all operations
- Sync when connection available
- Never lose user data

### Memory Constraints:
- Target 512MB devices
- Lazy load everything possible
- Compress images aggressively
- Clear unused data proactively

### Platform APIs:
- Use Capacitor plugins for native features
- Camera, filesystem, preferences
- Native SQLite if IndexedDB fails
- Platform-specific optimizations

---

## Success Metrics

1. **Storage Reliability**: Zero data loss in 10,000 operations
2. **Performance**: < 100ms for all storage operations
3. **Memory**: < 50MB usage on 512MB devices
4. **Offline**: 30+ days of offline operation
5. **Stability**: No crashes in 24-hour usage

---

## Bottom Line

With no migration needed, we can:
- Build the ideal mobile storage system from scratch
- Use IndexedDB exclusively (with emergency fallback)
- Optimize specifically for mobile constraints
- Ship faster without migration complexity

The key is maintaining the same safety-first approach but applying it to a clean mobile implementation rather than a complex migration.