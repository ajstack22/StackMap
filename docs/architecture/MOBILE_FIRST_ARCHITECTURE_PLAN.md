# Mobile-First Architecture Plan for StackMap

## The Opportunity
Since Android is just starting and iOS hasn't begun, we can fix the architecture **before** shipping broken navigation to mobile users. This is the ideal time to get it right.

## Proposed Approach: Feature Branch with Mobile-First Development

### Branch Strategy
```bash
git checkout -b mobile-first-architecture
# This becomes our experimental playground
# Zero risk to demo or production
```

### Core Principles

1. **Mobile Constraints First**
   - Design for Capacitor's `capacitor://` scheme limitations
   - Assume no external navigation
   - Everything is a "view" within the app
   - Test on mobile FIRST, then verify on web

2. **Progressive Enhancement**
   - Mobile app = base experience
   - PWA = mobile + offline capabilities
   - Web = PWA + SEO considerations
   - TV = mobile + remote navigation

3. **Vanilla JS with Careful ES6**
   - Stick to widely supported ES6 features
   - No transpilation required
   - Test on oldest supported WebView versions
   - Document which ES6 features we use and why

## Immediate Architecture Decisions

### 1. Navigation Strategy
```javascript
// Everything is a "view" - no page navigation
const AppViews = {
  main: 'main-content',
  privacy: 'privacy-view',
  support: 'support-view',
  terms: 'terms-view'
};

// Single navigation controller
class ViewController {
  static show(viewName) {
    // Hide all views
    Object.values(AppViews).forEach(id => {
      document.getElementById(id)?.classList.add('hidden');
    });
    // Show requested view
    document.getElementById(AppViews[viewName])?.classList.remove('hidden');
  }
}
```

### 2. Platform Detection & Adaptation
```javascript
class Platform {
  static detect() {
    return {
      isCapacitor: window.Capacitor !== undefined,
      isAndroid: window.Capacitor?.getPlatform() === 'android',
      isIOS: window.Capacitor?.getPlatform() === 'ios',
      isPWA: window.matchMedia('(display-mode: standalone)').matches,
      isTV: navigator.userAgent.includes('TV') || window.innerWidth > 1920,
      isWeb: !window.Capacitor && !window.matchMedia('(display-mode: standalone)').matches
    };
  }
  
  static adapt() {
    const platform = this.detect();
    document.body.classList.add(`platform-${Object.keys(platform).find(k => platform[k])}`);
    return platform;
  }
}
```

### 3. Content Architecture
```html
<!-- index.html - Single entry point for ALL platforms -->
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <!-- Critical CSS inline for performance -->
  <style>
    .hidden { display: none !important; }
    .view { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }
  </style>
</head>
<body>
  <!-- Main App View -->
  <div id="main-content" class="view">
    <!-- Your existing app content -->
  </div>
  
  <!-- Secondary Views (hidden by default) -->
  <div id="privacy-view" class="view hidden">
    <!-- Privacy content -->
  </div>
  
  <div id="support-view" class="view hidden">
    <!-- Support content -->
  </div>
  
  <div id="terms-view" class="view hidden">
    <!-- Terms content -->
  </div>
  
  <!-- Single JS entry point -->
  <script src="js/app.js"></script>
</body>
</html>
```

### 4. Link Handling
```javascript
// Intercept ALL navigation
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;
  
  e.preventDefault();
  const href = link.getAttribute('href');
  
  // Internal navigation
  if (href.startsWith('#')) {
    ViewController.show(href.substring(1));
  }
  // External links
  else if (href.startsWith('http')) {
    ExternalLink.open(href);
  }
});

class ExternalLink {
  static async open(url) {
    const platform = Platform.detect();
    
    if (platform.isCapacitor) {
      // Use Capacitor Browser
      const { Browser } = Capacitor.Plugins;
      await Browser.open({ url });
    } else {
      // Web fallback
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
```

### 5. Safe ES6 Features to Use
```javascript
// SAFE - Widely supported since 2015+
const/let
Arrow functions
Template literals
Classes (with static methods)
Array methods (map, filter, forEach)
Object.assign()
Destructuring (basic)
Default parameters

// AVOID - May need polyfills
async/await (use Promises instead)
Spread operator in objects
Array.includes()
Object.entries()
Optional chaining (?.)
Nullish coalescing (??)
```

## Development Process

### Week 1: Core Infrastructure
1. Create mobile-first-architecture branch
2. Set up ViewController for single-page navigation
3. Implement Platform detection and adaptation
4. Convert all external HTML to embedded views

### Week 2: Mobile Testing
1. Build Android app with new architecture
2. Test all navigation scenarios
3. Implement TV remote navigation support
4. Verify PWA installation and behavior

### Week 3: Polish & Migration
1. Add iOS-specific adaptations
2. Implement offline support for all views
3. Create migration script for content
4. Performance optimization

### Testing Strategy
```bash
# 1. Mobile First
npm run build:android
# Test on real device with Capacitor

# 2. PWA Second  
npm run serve
# Install as PWA, test offline

# 3. Web Last
# Deploy to test subdomain
# Verify SEO and standard web behavior
```

## TV Considerations

### Remote Navigation
```javascript
class TVNavigation {
  static init() {
    if (!Platform.detect().isTV) return;
    
    // Spatial navigation for TV remotes
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.navigateFocus(e.key);
          break;
        case 'Enter':
          document.activeElement?.click();
          break;
      }
    });
  }
  
  static navigateFocus(direction) {
    // Implement spatial navigation
    // Find next focusable element in direction
  }
}
```

### TV-Specific Styling
```css
/* TV adaptations */
@media screen and (min-width: 1920px) {
  /* Larger touch targets for remote control */
  .card { min-height: 120px; }
  button { min-height: 60px; font-size: 24px; }
  
  /* Focus indicators for TV */
  :focus {
    outline: 4px solid #667eea;
    outline-offset: 4px;
  }
}
```

## Migration Checklist

- [ ] Create feature branch
- [ ] Implement ViewController
- [ ] Convert external pages to views
- [ ] Add Platform detection
- [ ] Update all internal links to use # anchors
- [ ] Implement external link handler
- [ ] Test on Android device/emulator
- [ ] Test PWA installation
- [ ] Test on web browser
- [ ] Add TV navigation support
- [ ] Performance audit
- [ ] Security audit (CSP headers, etc.)
- [ ] Merge to main when stable

## Benefits of This Approach

1. **True Mobile-First**: Built for constraints, enhanced for capabilities
2. **Single Codebase**: One HTML file, one JS entry point
3. **Future-Proof**: Easy to add new platforms (watch, TV, etc.)
4. **Performance**: No page loads, instant view switching
5. **Offline-First**: Everything cached, works without internet
6. **Testable**: Can unit test navigation without browser

## Rollback Safety

Since this is on a feature branch:
- Demo remains untouched
- Production remains untouched  
- Can experiment freely
- Can abandon if it doesn't work
- Can cherry-pick good ideas even if full approach fails

## Next Steps

1. Create the branch
2. Start with ViewController implementation
3. Test with your existing Android setup
4. Iterate based on real device testing
5. Only merge when fully confident

This approach turns the "bug" of Capacitor's URL schemes into a "feature" of instant, app-like navigation!