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

## Critical Insights from Additional Research

### 6. Error Recovery (ADHD/Executive Function)
- **Working memory**: Only 3-5 items (often less under stress)
- **Rejection Sensitive Dysphoria**: Intense emotional response to mistakes
- **Undo requirements**: 10-15 visible, 100 total, with branch history
- **Auto-save**: Hybrid approach - drafts every 30-60s + explicit save
- **Prevention focus**: 70% prevention, 30% recovery effort split

### 7. Multi-Device Family Sync
- **Progressive autonomy**: Start controlled, build independence
- **COPPA compliance**: Strict requirements for under-13 users
- **Account tiers**: Parent → User → Secondary caregivers
- **Conflict resolution**: CRDT for properties, OT for scheduling
- **Trust critical**: Technical failures multiply in family context

### 8. Neurodivergent-First Notifications
- **15-40% of population** is neurodivergent - inclusive design essential
- **Task switching costs >23 minutes** for ADHD users
- **93-96% of autistic individuals** have sensory processing differences
- **Progressive escalation**: Visual → haptic → audio (never harsh)
- **Context-aware batching**: Reduces cognitive load by 33%

### 9. Conflict Resolution UX
- **Maximum 3 choices** initially to prevent paralysis
- **Lead with reassurance**: "Your work is safe"
- **Visual metaphors**: Side-by-side docs, traffic lights, journey paths
- **No time pressure**: Remove countdowns and urgency
- **8th-grade reading level**, 20 words per sentence max

### 10. Voice Command Design (TV)
- **Keyword commands**: 40-60% higher accuracy than natural language
- **Personalized models**: 93.49% accuracy achievable with training
- **400 utterances minimum** for effective personalization
- **Multimodal fallback**: Gesture (91.5% at 3.5m), switches, eye tracking
- **Condition-specific**: Echolalia acceptance, fragment reconstruction

### 11. Android 5 Compatibility Crisis
- **Capacitor 4.x required**: Last version supporting Android 5.1+
- **WebView 60+ recommended**: Many devices locked at v44-52
- **5+ second load times**: Android vs <2s on iOS
- **ES6 polyfills needed**: For older WebView versions
- **Samsung devices slower**: Consistent performance issues

### 12. Migration Strategy Requirements
- **Shadow tables**: Zero-disruption dual-write strategy
- **4-6 weeks notice**: Required for routine changes
- **50-pixel limit**: Maximum UI deviation for muscle memory
- **3-tier rollback**: 10-minute/3-minute/immediate options
- **User-controlled**: Never automatic transitions

### 13. Visual Task Management (ADHD)
- **Spatial over linear**: Mind maps, kanban boards preferred
- **40% productivity loss**: Per task switch for ADHD
- **80% stress reduction**: With visual timeline approaches
- **4-6 colors maximum**: For effective color coding
- **Progressive disclosure**: 3-7 initial options only

## Immediate Architecture Updates Needed

### 1. Fix JavaScript Compatibility Issues
Our current `app.js` uses unsafe ES6 features that will break on Android 5!

### 2. Implement Navigation Depth Limits
Add navigation tracking to prevent going deeper than 2-3 levels.

### 3. Add Comprehensive Undo System
Command pattern with 10-15 visible actions, 100 in history, branch support.

### 4. Create Hybrid Auto-Save
Drafts every 30-60 seconds with explicit save/publish for user control.

### 5. Design Family Account Architecture
Three-tier system with progressive permissions and COPPA compliance.

### 6. Enhance TV Navigation
Current implementation is basic - needs spatial navigation algorithm.

### 7. Add State Preservation
Critical for working memory - persist all context through errors.

### 8. Implement Sensory-Aware Notifications
Progressive escalation with full customization for 93-96% with sensory differences.

### 9. Create Hyperfocus Protection
Prevent >23 minute recovery costs with smart interruption management.

### 10. Design Calm Error Messages
Never "ERROR/FAILED" - use reassuring, clear language at 8th grade level.

### 11. Downgrade to Capacitor 4.x
Critical for Android 5.1+ support - Capacitor 5+ drops compatibility entirely.

### 12. Implement WebView Detection
Many devices locked at v44-52 - need warnings and graceful degradation.

### 13. Create Migration Safety Nets
Shadow tables, 3-tier rollback, user control - zero disruption mandatory.