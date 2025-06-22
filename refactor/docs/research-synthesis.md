# Research Synthesis: Key Findings for StackMap Refactor

## Critical Insights from Research

### 1. Mobile Navigation (ADHD/Special Needs)
- **2-3 levels maximum** navigation depth
- **Tab-based navigation** beats hamburger menus (less cognitive load)
- **200-300ms animations** for ADHD users (faster = less distraction)
- **5-7 focusable elements** per screen maximum
- **Visual landmarks** for wayfinding (colors, shapes, icons)
- **44x44pt minimum** touch targets (we already have this)

### 2. Cross-Platform Architecture
- **Ionic/Capacitor** confirmed as best choice (90-95% code sharing)
- **Three-layer architecture**: Core Logic → Service Layer → Presentation
- **Spatial navigation** required for TV (LRUD algorithm)
- **Performance budgets**: 200KB JS, 3s load on 3G
- **Adaptive loading** based on device capabilities

### 3. Offline-First Implementation
- **Local-first with CRDT** for conflict resolution
- **SQLite on mobile** (15-25k ops/sec) via Capacitor
- **IndexedDB on web** with Dexie wrapper
- **Static sync indicators** (no spinning animations)
- **Automatic conflict resolution** for 95%+ cases

### 4. JavaScript Compatibility (CRITICAL)
**UNSAFE Features to Avoid:**
- `let`/`const` - Use `var` (Android 5 failures!)
- Arrow functions - Use traditional functions
- `async`/`await` - Use Promises with `.then()`
- Classes - Use constructor functions
- Destructuring - Use traditional access
- `for...of` - 3-20x slower than `for` loops

**SAFE Features:**
- Template literals (backticks)
- Promises
- Traditional array methods (map, filter)
- `var` declarations

### 5. TV Interface Requirements
- **48×48dp minimum** targets (96×96dp for motor accessibility)
- **3:1 contrast ratio** for focus indicators (4.5:1 preferred)
- **Grid-based navigation** with circular wrapping
- **Menu-based reordering** (no drag-drop)
- **Voice as primary alternative** input

## Immediate Architecture Updates Needed

### 1. Fix JavaScript Compatibility Issues
Our current `app.js` uses unsafe ES6 features that will break on Android 5!

### 2. Implement Navigation Depth Limits
Add navigation tracking to prevent going deeper than 2-3 levels.

### 3. Add Offline-First Storage Layer
Implement tiered storage approach with automatic sync.

### 4. Enhance TV Navigation
Current implementation is basic - needs spatial navigation algorithm.

### 5. Add Performance Monitoring
Implement adaptive loading based on device capabilities.