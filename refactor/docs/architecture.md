# StackMap Mobile-First Architecture

## Design Decisions

### 1. Single HTML File Approach

**Decision**: Everything lives in one `index.html` file with show/hide views.

**Rationale**:
- Capacitor URL schemes (`capacitor://localhost/`) break traditional multi-page navigation
- Instant view switching provides better UX than page loads
- Easier offline caching - one file to rule them all
- Consistent behavior across all platforms

**Trade-offs**:
- Larger initial HTML file
- SEO considerations for web (mitigated by proper meta tags)
- All content loaded upfront (mitigated by lazy loading)

### 2. View-Based Navigation

**Decision**: Use hash-based routing (#privacy, #settings) with view show/hide.

**Rationale**:
- Works identically on all platforms
- Browser back button "just works"
- No server-side routing needed
- Deep linking support via hashes

**Implementation**:
```javascript
// Simple and effective
ViewController.show('privacy-view');
// Updates URL to #privacy on web
```

### 3. Platform Detection Strategy

**Decision**: Detect platform once on load, adapt UI accordingly.

**Rationale**:
- Different platforms need different behaviors
- CSS classes enable platform-specific styling
- JavaScript can make platform-specific decisions

**Platforms**:
- `platform-web`: Standard browser
- `platform-pwa`: Installed progressive web app
- `platform-ios`: iOS via Capacitor
- `platform-android`: Android via Capacitor
- `platform-tv`: Large screen/TV interface

### 4. Mobile-First Constraints

**Decision**: Design for most constrained environment (mobile) first.

**Constraints considered**:
- Touch targets minimum 44px
- Offline-first functionality
- Limited screen space
- No hover states
- Virtual keyboard handling

**Progressive enhancement**:
```
Mobile → Tablet → Desktop → TV
Each step adds capabilities
```

### 5. ES6 Feature Selection

**Decision**: Use only ES6 features supported since ~2015.

**Safe features**:
- `const`/`let`
- Arrow functions
- Template literals
- Classes
- Basic destructuring

**Avoided features**:
- `async`/`await` (use Promises)
- Optional chaining
- Nullish coalescing
- Object spread

**Rationale**: 
- WebView compatibility on older devices
- No build/transpilation step needed
- Proven stability

### 6. Storage Strategy

**Decision**: localStorage for all data with future sync capability.

**Structure**:
```javascript
{
  "stackmap-settings": { /* user preferences */ },
  "stackmap-tasks": { /* task data */ },
  "stackmap-sync": { /* sync metadata */ }
}
```

**Rationale**:
- Simple and universally supported
- Works offline
- Easy to debug
- Can migrate to IndexedDB later if needed

### 7. Navigation Patterns

**TV Remote**:
- Arrow keys for spatial navigation
- Enter to select
- Escape/Back to go back
- Simple focus management

**Touch/Mouse**:
- Large touch targets
- Swipe gestures (future)
- Click/tap consistency

**Keyboard**:
- Tab navigation
- Keyboard shortcuts (future)
- Accessibility compliance

### 8. External Link Handling

**Decision**: Centralized link handler with platform-specific behavior.

```javascript
if (Capacitor && Browser plugin) {
  // Use in-app browser
} else {
  // Use window.open with security
}
```

**Security**: Always include `noopener,noreferrer` for external links.

### 9. Performance Strategy

**Initial Load**:
- Inline critical CSS
- Defer non-critical JavaScript
- Preload key resources

**Runtime**:
- View transitions via CSS
- Minimal DOM manipulation
- Event delegation

**Offline**:
- Service worker for caching
- Local data persistence
- Sync when online

### 10. Testing Philosophy

**Order of testing**:
1. Mobile browser viewport
2. Real mobile device
3. PWA installation
4. Native app build
5. TV/large screen

**Key test scenarios**:
- Offline functionality
- Navigation flow
- External links
- Data persistence
- Platform-specific features

## Future Considerations

### Potential Enhancements
1. **IndexedDB** for larger data sets
2. **Service Worker** for advanced caching
3. **Web Components** for reusable UI
4. **CSS Grid** for complex layouts
5. **WebRTC** for real-time sync

### Scaling Considerations
- Code splitting if JS grows too large
- Virtual scrolling for long lists
- Lazy loading for images/content
- Progressive image loading

### Platform Expansion
- Apple Watch (simplified views)
- Android Wear
- Voice assistants (Alexa/Google)
- Desktop widgets

## Lessons from Previous Architecture

### What Failed
- Multiple HTML files broke in Capacitor
- Relative paths didn't solve the problem
- Band-aid fixes added complexity
- Desktop-first thinking

### What We Learned
- Start with constraints
- Test on real devices early
- Simple solutions often best
- Platform differences matter

## Conclusion

This architecture prioritizes:
1. **Simplicity** - One way to do things
2. **Reliability** - Works offline, every time
3. **Performance** - Fast on all devices
4. **Maintainability** - Clean, understandable code
5. **Future-proof** - Easy to extend and adapt

By starting with mobile constraints and building up, we create an app that works exceptionally well everywhere, rather than a web app that "sort of" works on mobile.