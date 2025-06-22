# Context Rules for Mobile-First Refactor

## Purpose
This refactor creates a truly mobile-first, cross-platform StackMap that works identically on Web, PWA, iOS, Android, and TV platforms.

## Core Principles

### ✅ DO Reference
- `/refactor/docs/` - All new architecture documentation
- `/context/special-needs-research.md` - User demographic insights
- Platform-first thinking (mobile → PWA → web → TV)
- Single-page application patterns
- View-based navigation (no page loads)

### ❌ DO NOT Reference
- Old `/js/HybridPanelManager.js` patterns
- Multiple HTML file approach (`privacy.html`, `support.html`, etc.)
- Link workarounds and band-aid fixes
- Desktop-first thinking
- Page-based navigation

## Architecture Rules

### 1. Single Entry Point
- ONE `index.html` file
- ALL content lives in this file as views
- NO separate HTML pages

### 2. View-Based Navigation
```javascript
// Good: Show/hide views
ViewController.show('privacy-view');

// Bad: Navigate to pages
window.location.href = '/privacy.html';
```

### 3. Platform Detection First
```javascript
// Always detect platform on init
const platform = Platform.detect();
// Adapt UI/UX accordingly
```

### 4. Mobile Constraints as Features
- Embrace Capacitor's URL schemes
- Design for offline-first
- Assume touch/remote input
- Optimize for small screens first

### 5. Progressive Enhancement
```
Mobile App (most constrained)
    ↓ enhance
PWA (+ offline capabilities)
    ↓ enhance  
Web (+ SEO, larger screens)
    ↓ enhance
TV (+ remote navigation)
```

## Safe ES6 Features Only

### Use These (Supported 2015+)
- `const` / `let`
- Arrow functions `() => {}`
- Template literals `${}`
- Classes with static methods
- Basic destructuring
- Default parameters
- `for...of` loops

### Avoid These (May Need Polyfills)
- `async/await` (use Promises)
- Spread operator for objects `{...obj}`
- Optional chaining `?.`
- Nullish coalescing `??`
- `Array.prototype.includes()`
- `Object.entries()`

## File Organization

```
/refactor/
├── index.html          # Single entry point
├── js/
│   ├── app.js         # Main application
│   ├── platform.js    # Platform detection/adaptation
│   ├── navigation.js  # View controller
│   ├── storage.js     # Offline/sync handling
│   └── tv.js          # TV-specific features
├── css/
│   ├── base.css       # Core styles
│   ├── mobile.css     # Mobile-first styles
│   ├── tv.css         # TV adaptations
│   └── themes.css     # Color schemes
└── docs/
    └── architecture.md # Technical decisions
```

## Development Workflow

1. **Start with mobile constraints**
   - Test in mobile viewport first
   - Use touch events before mouse
   - Design for offline before online

2. **Build up to larger screens**
   - Mobile → Tablet → Desktop → TV
   - Each step adds capabilities

3. **Test on real devices early**
   - Not just browser DevTools
   - Actual Capacitor builds
   - Real TV remotes

## Key Differences from Current App

| Current Approach | New Approach |
|-----------------|--------------|
| Multiple HTML files | Single HTML with views |
| Links navigate pages | Views show/hide |
| Web-first design | Mobile-first design |
| Retrofit for mobile | Built for mobile |
| Complex workarounds | Clean architecture |

## Success Metrics

- Zero broken links across platforms
- Instant view switching (no page loads)
- Works offline on all platforms
- TV remote navigation functions
- Consistent UX across all devices
- Clean, maintainable code

## Remember

We're not "fixing" the old architecture - we're building the RIGHT architecture from scratch. Every decision should start with "How does this work on the most constrained platform?" and enhance from there.