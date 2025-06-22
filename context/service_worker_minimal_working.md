# Service Worker Minimal Implementation - Working Document

## Context & Requirements

### User Request
Implement a MINIMAL Service Worker for StackMap that ONLY caches static assets. Task data is handled by IndexedDB (separate implementation).

### Key Constraints
- Previous complex SW plans were rejected as too risky
- Only need to cache app shell for performance
- Must be absolutely simple and bulletproof
- No offline editing, no sync, no complexity

## Development Standards Review (from CLAUDE.md)

### Critical Principles
1. **Stability Over Features** - Users have ADHD/executive function challenges
2. **Test Everything** - Must run tests, lint, and verify
3. **Platform Priority**: Mobile → PWA → Web → TV

### JavaScript Constraints (ES5 + Safe Features)
- Must use `var` (not let/const) for Android 5 compatibility
- Must use `function() {}` (not arrow functions)
- Template literals and Promises are safe
- Must avoid: const/let, arrow functions, async/await, class syntax

### Safe Mode Integration
- Activated via `?safe=true` URL parameter
- Service Worker must be disabled in safe mode
- Can persist for 24 hours with `?safe=true&persist=true`

## Current App Architecture Analysis

### app.js Key Findings
- Safe mode detection starts at line 59
- Global flag: `window.StackMapSafeMode`
- Error detection system in place (Phase 4 complete)
- Data preservation system active
- Service worker registration should go in `init()` function (line 1191)

### Static Assets to Cache
From index.html analysis:
```
/refactor/
/refactor/index.html
/refactor/emergency-static.html
/refactor/css/base.css
/refactor/css/mobile.css
/refactor/css/tv.css
/refactor/js/app.js
/refactor/js/messaging.js
/refactor/js/rsd-safe-init.js
/refactor/manifest.json
```

## Implementation Plan

### 1. service-worker.js
```javascript
// Design decisions:
- CACHE_NAME = 'stackmap-v1' (simple versioning)
- Only cache essential static files
- Fail silently on all errors
- Cache-first strategy for static assets only
- No background sync, no push notifications
- No complex lifecycle management

// Event handlers:
- install: Cache all static assets, fail silently
- activate: Clean up old caches
- fetch: Serve from cache, fallback to network (GET only)
```

### 2. app.js Registration
Location: Add to `init()` function after platform detection (around line 1200)

```javascript
// Registration logic:
- Check if 'serviceWorker' in navigator
- Skip if window.StackMapSafeMode is true
- Skip if URL has ?nosw=true parameter
- Simple registration with no update prompts
- Log success/failure silently (no user alerts)
```

### 3. Risk Mitigation
- No caching of user data (IndexedDB handles tasks)
- No offline editing capabilities
- No background synchronization
- Silent failures (no user-facing errors)
- Safe mode completely bypasses SW
- Manual updates only (user must refresh)

## Testing Strategy

### Manual Testing Required
1. Normal mode: Verify SW registers and caches assets
2. Safe mode: Verify SW does NOT register
3. Second visit: Verify instant load from cache
4. Update scenario: Verify manual refresh required
5. Error scenario: Verify silent failure

### Platforms to Test
- Chrome/Edge desktop
- Safari desktop
- Chrome Android
- Safari iOS
- Android 5 WebView (if available)

## Success Criteria
- ✅ Second visit loads instantly from cache
- ✅ Updates require manual page refresh
- ✅ Fails silently without breaking the app
- ✅ No user-facing complexity or prompts
- ✅ Safe mode completely bypasses service worker

## What This Does NOT Include
- ❌ No offline task editing
- ❌ No background synchronization
- ❌ No push notifications
- ❌ No dynamic content caching
- ❌ No automatic update prompts
- ❌ No versioning UI
- ❌ No cache size management

## Current Status
- [x] Analyzed requirements and constraints
- [x] Reviewed existing codebase architecture
- [x] Created implementation plan
- [ ] Implement service-worker.js
- [ ] Update app.js registration
- [ ] Test across platforms

## Next Steps
1. Get approval for implementation plan
2. Create service-worker.js with minimal caching
3. Add registration to app.js with safe mode checks
4. Test thoroughly across all platforms
5. Document any issues or learnings

## Notes & Concerns
- Service worker path must be correct for scope
- Consider adding `?nosw=true` parameter for debugging
- May need to adjust cache list if new assets are added
- Emergency-static.html is critical fallback - must always cache

---
Last Updated: 2025-06-22
Story: Minimal Service Worker Implementation
Phase: Planning Complete, Awaiting Implementation Approval