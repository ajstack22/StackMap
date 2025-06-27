# StackMap Mobile-First Refactor

## Overview
This is a ground-up rebuild of StackMap with a mobile-first, cross-platform architecture. Built with vanilla JavaScript and CSS, it works identically across Web, PWA, iOS, Android, and TV platforms.

## Quick Start

### Web Testing
Simply open `/refactor/index.html` in a browser or visit:
```
https://stackmap.app/refactor/
```

### Mobile Testing
```bash
# From main StackMap directory
npx cap sync
npx cap run android
# or
npx cap run ios
```

## Architecture

### Single Page Application
- One `index.html` file contains all views
- Views show/hide instead of page navigation
- No external HTML files needed

### Platform Detection
The app automatically detects and adapts to:
- Web browser
- PWA (installed web app)
- iOS app (via Capacitor)
- Android app (via Capacitor)
- TV (Google TV, Apple TV)

### Mobile-First Design
1. Designed for touch/remote input first
2. Enhanced for larger screens
3. Works offline by default
4. Instant view transitions

## File Structure

```
refactor/
├── index.html          # Single entry point
├── js/
│   └── app.js         # Main application logic
├── css/
│   ├── base.css       # Core styles
│   ├── mobile.css     # Mobile-specific
│   └── tv.css         # TV adaptations
├── docs/
│   └── architecture.md # Technical decisions
└── config/
    └── manifest.json   # PWA configuration
```

## Key Features

### Navigation
- Hash-based routing (#privacy, #settings)
- Back button support on all platforms
- TV remote control navigation
- External links handled properly per platform

### Storage
- Local storage for offline support
- Tasks persist between sessions
- Settings sync across app restarts

### Accessibility
- 44px minimum touch targets
- Clear focus indicators
- Screen reader support
- High contrast design

## Development Guidelines

### JavaScript
Using safe ES6 features only:
- `const`/`let` instead of `var`
- Arrow functions where appropriate
- Template literals for strings
- Classes with static methods

Avoiding newer features that need polyfills:
- No `async`/`await` (use Promises)
- No optional chaining `?.`
- No nullish coalescing `??`
- No spread operator for objects

### CSS
- Mobile-first media queries
- CSS custom properties for theming
- Platform-specific adjustments via classes
- Safe area insets for notched devices

### Testing
1. Test mobile viewport first
2. Test offline functionality
3. Test on real devices when possible
4. Verify TV remote navigation

## Platform-Specific Notes

### iOS
- Uses `capacitor://localhost/` URL scheme
- Handles safe area insets
- Backdrop blur on headers

### Android  
- Uses `https://localhost/` URL scheme
- Material Design touch feedback
- Hardware back button support

### TV
- Larger UI elements (125% scale)
- Spatial navigation with D-pad
- Clear focus indicators
- Simplified interactions

## Next Steps

1. Implement task management core
2. Add sync functionality
3. Create settings panel
4. Add theme customization
5. Implement notifications

## Quality Assurance

### Adversarial Code Review (Required)
Every significant change must undergo adversarial review:

1. **Quick Review**: Type `/review` in Claude Code
2. **Manual Review**: See `scripts/adversarial-review.md`
3. **Example**: See `docs/adversarial-review-example.md`

Reviews examine code from 5 personas:
- Security Auditor
- Accessibility Expert  
- Performance Engineer
- Chaos Engineer
- ADHD User Advocate

### Custom Commands
- `/review` - Run adversarial code review
- `/test-all` - Run comprehensive test suite
- `/check-platforms` - Verify cross-platform compatibility

## Debugging

Open browser console and use:
```javascript
StackMapApp.Platform.detect()  // Check platform
StackMapApp.ViewController.show('settings-view')  // Navigate
StackMapApp.Storage.save('test', {data: 'value'})  // Test storage
```