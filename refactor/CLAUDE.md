# CLAUDE.md - StackMap Mobile-First Refactor

## 🚨 CRITICAL: Read This First

You are working on a **mobile-first refactor** in the `/refactor` directory. This is a ground-up rebuild with a completely different architecture than the parent StackMap app.

### Key Differences from Main App
- **Single HTML file** (no separate privacy.html, etc.)
- **View-based navigation** (no page loads)
- **Mobile-first design** (not desktop retrofitted)
- **Platform detection built-in** (Web/PWA/iOS/Android/TV)

## Core Principles

### 1. Stability Over Features
- Users have ADHD/executive function challenges
- Routine disruption is unacceptable
- Every change must enhance reliability
- Think 5 steps ahead before implementing

### 2. Test Everything
```bash
# Before ANY commit:
npm test
npm run lint
# Test in browser
# Test offline mode
# Test TV navigation (arrow keys)
```

### 3. Platform Priority
1. Mobile (most constrained)
2. PWA (mobile + offline)
3. Web (PWA + SEO)
4. TV (mobile + remote control)

## File Structure

```
/refactor/
├── index.html          # ONLY HTML file - all views here
├── js/
│   └── app.js         # Main app - view controller, platform detection
├── css/
│   ├── base.css       # Core styles
│   ├── mobile.css     # Mobile adaptations
│   └── tv.css         # TV adaptations
└── docs/
    └── architecture.md # Technical decisions
```

## Coding Standards

### JavaScript (ES5 + Safe Features Only)
```javascript
// ✅ USE THESE
var                   // NOT let/const (Android 5 fails!)
function() {}         // NOT arrow functions
`${template}`         // Template literals (safe)
Promises              // Universally supported

// ❌ AVOID THESE (Will break on Android 5)
const/let             // Use var instead
() => {}              // Use function() {}
async/await           // Use Promises
class                 // Use constructor functions
for...of              // 3-20x slower, use for loops
[a, b] = array        // No destructuring
```

### CSS Requirements
- Mobile-first: Start small, enhance up
- Minimum touch targets: 44px
- Platform classes: `.platform-ios`, `.platform-tv`
- Safe area insets: `env(safe-area-inset-top)`

### View Navigation
```javascript
// ✅ CORRECT
ViewController.show('privacy-view');

// ❌ WRONG
window.location.href = '/privacy.html';  // No separate pages!
```

## Commands

### Development
```bash
# Run tests
npm test

# Lint code
npm run lint

# Local web testing
open refactor/index.html
```

### Platform Testing
```bash
# Android
npx cap sync
npx cap run android

# iOS
npx cap sync
npx cap run ios

# PWA
# Install from browser on mobile

# TV
# Use arrow keys + Enter in browser
```

## Implementation Patterns

### Error Handling
```javascript
try {
  // Attempt operation
} catch (error) {
  console.error('Operation failed:', error);
  // Graceful fallback
  // Never crash the app
}
```

### Platform Detection
```javascript
// Always detect before adapting
const platform = Platform.detect();
if (platform.isTV) {
  // TV-specific code
}
```

### Storage Pattern
```javascript
// Always handle quota errors
Storage.save('key', data).catch(err => {
  // Handle gracefully
  console.warn('Storage full:', err);
});
```

## Testing Requirements

### Before Committing
1. [ ] Runs in mobile viewport
2. [ ] Works offline
3. [ ] TV navigation functions (arrow keys)
4. [ ] No console errors
5. [ ] All links work correctly
6. [ ] External links have `noopener,noreferrer`
7. [ ] **ADVERSARIAL REVIEW COMPLETED** (see scripts/adversarial-review.md)

### Platform Verification
- Web: Chrome, Safari, Firefox
- Mobile: Real device if possible
- PWA: Install and test offline
- TV: 1920px+ viewport with keyboard

## Common Issues & Solutions

### Issue: View not showing
```javascript
// Check: View ID matches HTML
// Check: Previous view hidden
// Check: No CSS conflicts
```

### Issue: Navigation broken
```javascript
// Verify: Using ViewController.show()
// NOT: window.location changes
```

### Issue: Platform not detected
```javascript
// Ensure: Platform.detect() called early
// Check: Body classes applied
```

## Architecture Decisions

### Why Single HTML?
- Capacitor URL schemes break multi-page
- Instant view switching
- Consistent behavior across platforms
- Simpler offline caching

### Why No Frameworks?
- Vanilla is fast and simple
- No build step needed
- Works everywhere
- Easier to debug

### Why Mobile-First?
- Design for constraints
- Progressive enhancement
- Better performance
- Future-proof

## Debugging

```javascript
// In browser console:
StackMapApp.Platform.detect()        // Check platform
StackMapApp.ViewController.show('settings-view')  // Navigate
StackMapApp.Storage.save('test', {}) // Test storage
```

## Remember

**You are building for users with ADHD and executive function challenges.** Every decision should prioritize:

1. **Reliability** - It must work every time
2. **Consistency** - Predictable behavior
3. **Simplicity** - Clear, obvious UI
4. **Performance** - Instant response
5. **Offline** - Works without internet

**If something doesn't work, roll back immediately.** Stability > Features.