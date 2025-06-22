# StackMap Developer Context

## Project Overview
StackMap is a task management application designed specifically for users with ADHD and executive function challenges. We're currently in a mobile-first refactor phase, rebuilding the app from the ground up with a focus on stability, accessibility, and graceful degradation.

## Current Status (2025-06-22)

### ✅ Completed
1. **Phase 1**: Zero-JavaScript emergency fallback page
2. **Phase 2**: Pre-boot error detection (50ms timeout)
3. **Phase 3**: Safe mode implementation with URL parameter activation

### 🎯 Next Up
- **Phase 4**: Inline fallback UI for runtime errors
- **Phase 5**: Service worker fallback for offline handling

## Architecture Overview

### Directory Structure
```
/StackMap/
├── refactor/                    # Mobile-first rebuild
│   ├── index.html              # Single HTML file with all views
│   ├── js/
│   │   └── app.js             # Main application (ES5 compatible)
│   ├── css/
│   │   ├── base.css           # Core styles including safe mode
│   │   ├── mobile.css         # Mobile-specific styles
│   │   └── tv.css             # TV platform styles
│   └── emergency-static.html   # Zero-JS fallback page
└── context/                    # Developer documentation
```

### Key Technical Decisions

1. **Single HTML File**: All views in one file for consistent Capacitor behavior
2. **ES5 JavaScript**: Android 5 compatibility requirement
3. **View-Based Navigation**: No page reloads, instant transitions
4. **Platform Detection**: Adapts to Web/PWA/iOS/Android/TV
5. **Safe Mode**: Degraded experience for stability when needed

## Safe Mode Implementation Details

### Activation Methods
- URL parameter: `?safe=true`
- With persistence: `?safe=true&persist=true` (24 hours)
- Automatic activation on error (Phase 4 - not yet implemented)

### Safe Mode Features
- No animations or transitions
- 60px minimum touch targets (vs 44px normal)
- Extended timeouts (3.3x multiplier)
- Simplified UI with core features only
- Usage analytics for monitoring

### Implementation Constants
```javascript
SAFE_MODE_CONSTANTS = {
    BANNER_HEIGHT: 44,
    MAX_ANALYTICS_COUNT: 1000000,
    TIMEOUT_MULTIPLIER: 3.3,
    CACHE_MAX_SIZE: 5,
    TRANSACTION_ID_MAX: 2147483647
}
```

## Critical Code Patterns

### Storage Operations
Always wrap in try-catch with quota handling:
```javascript
try {
    localStorage.setItem(key, value);
} catch (e) {
    if (e.name === 'QuotaExceededError') {
        // Handle quota exceeded
    }
}
```

### Event Listeners
Store references for cleanup:
```javascript
window.MyHandler = function(e) { /* ... */ };
element.addEventListener('click', window.MyHandler);
// Later in cleanup:
element.removeEventListener('click', window.MyHandler);
```

### URL Parameter Parsing
Use proper regex with anchors:
```javascript
/[?&]param=value(&|$)/i.test(urlParams)  // Case-insensitive
```

### Memory Management
Proper array cleanup:
```javascript
while (array.length > 0) {
    array.pop();
}
array = null;
```

## Testing Requirements

### Before Any Commit
1. Test on mobile viewport
2. Test offline functionality
3. Test TV navigation (arrow keys)
4. Test safe mode activation
5. Run adversarial review
6. Check for memory leaks
7. Verify Android 5 compatibility

### Platform Testing Matrix
- **Web**: Chrome, Safari, Firefox
- **Mobile**: Physical Android 5+ device
- **PWA**: Install and test offline
- **TV**: 1920px+ viewport with keyboard
- **Safe Mode**: All above with `?safe=true`

## Development Principles

### Stability First
- Every feature must degrade gracefully
- Errors should never crash the app
- User data preservation is paramount
- Routine disruption is unacceptable

### ADHD/Autism Considerations
- Predictable behavior patterns
- Clear visual feedback
- Minimal cognitive load
- Sensory-friendly design
- Quick task capture
- No distracting animations (especially in safe mode)

### Code Quality Standards
- ES5 compatibility (no const/let, arrow functions, etc.)
- Comprehensive error handling
- Resource cleanup in all code paths
- Constants for magic numbers
- Clear commenting for complex logic

## Known Issues & Workarounds

### Android 5 Limitations
- No ES6+ features
- Limited storage APIs
- Older WebView engine
- Performance constraints

### Capacitor Considerations
- URL schemes affect navigation
- Platform-specific behaviors
- Storage access variations
- Camera/sensor permissions

## Phase 4 Preview

The next phase will implement inline fallback UI for runtime errors:
- Error boundary concept (without React)
- Graceful degradation on component failure
- User-friendly error messages
- Recovery options without reload
- Integration with safe mode

## Resources

### Documentation
- `/context/emergency-fallback-phase3-working.md` - Phase 3 implementation details
- `/refactor/docs/architecture.md` - Technical decisions
- `/refactor/CLAUDE.md` - AI assistant instructions

### Testing Tools
- `/refactor/test-safe-mode.html` - Safe mode test suite
- Chrome DevTools - Memory profiling
- BrowserStack/LambdaTest - Device testing

## Contact & Support

This is an open-source project focused on accessibility for neurodivergent users. The implementation prioritizes stability and usability over feature richness, recognizing that a working simple app is better than a broken complex one.