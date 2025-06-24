# Issue #27: Emergency Fallback Phase 5 - Service Worker Offline Support

## Context
StackMap users with ADHD need the app to work reliably even when offline. This implements a service worker for offline functionality.

## Requirements

### 1. Service Worker Setup
Create `/refactor/service-worker.js`:
```javascript
// Cache name with version
var CACHE_NAME = 'stackmap-v1';

// Files to cache
var urlsToCache = [
    './',
    './index.html',
    './emergency-static.html',
    './manifest.json',
    './css/base.css',
    './css/cards.css',
    './css/mobile.css',
    './js/app.js',
    './js/task-display.js',
    // Add all critical files
];
```

### 2. Registration
Add to index.html:
```javascript
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./service-worker.js')
            .then(function(reg) {
                console.log('Service Worker registered');
            })
            .catch(function(err) {
                console.log('Service Worker registration failed:', err);
            });
    });
}
```

### 3. Caching Strategy
- **Cache First**: Static assets (CSS, JS)
- **Network First**: API calls, dynamic content
- **Stale While Revalidate**: Images, non-critical assets

### 4. Offline Page
When completely offline, show a friendly message:
```javascript
// In service worker fetch handler
if (!navigator.onLine && request.mode === 'navigate') {
    return caches.match('./offline.html');
}
```

### 5. Create offline.html
Simple, beautiful offline page:
- "You're offline right now"
- "Your tasks are saved locally"
- "We'll sync when you're back online"
- Calming gradient background
- No alarming messages

### 6. Update Notifications
```javascript
// Notify users of updates gently
self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
```

### 7. Cache Management
- Limit cache size
- Clean old versions
- Handle quota errors gracefully

## Success Criteria
- [ ] App loads offline after first visit
- [ ] Static assets served from cache
- [ ] Friendly offline page when needed
- [ ] Updates happen in background
- [ ] No scary error messages
- [ ] Works on all platforms

## ES5 Compatibility Note
Service Workers support modern JS, but keep it simple for debugging.

## Time Estimate: 4-6 hours