# GitHub Issues Batch 4: Android 5 & Migration Strategy

## Based on Latest Research Reports

### From Android 5 Compatibility Research

#### 41. [P0-critical] Downgrade to Capacitor 4.x for Android 5.1+ support
**Labels**: `P0-critical`, `bug`, `android`, `compatibility`  
**Milestone**: v0.1 - ES5 Compatibility

Capacitor 5+ drops Android 5 support entirely. Must use 4.x:
```json
{
  "@capacitor/core": "^4.8.0",
  "@capacitor/android": "^4.8.0",
  "@capacitor/ios": "^4.8.0"
}
```
- Supports Android 5.1+ (API 22+)
- Maintains iOS 12+ compatibility
- Last version with Android 5 support

#### 42. [P0-critical] Implement WebView version detection
**Labels**: `P0-critical`, `feature`, `android`, `compatibility`  
**Milestone**: v0.1 - ES5 Compatibility

Many Android 5 devices have WebView 44-52 (incompatible):
- Detect WebView version on startup
- Show user-friendly warning if <60
- Provide upgrade instructions
- Industrial devices often locked at v44-52

#### 43. [P1-high] Add ES6 polyfills for older WebView
**Labels**: `P1-high`, `feature`, `compatibility`  
**Milestone**: v0.1 - ES5 Compatibility

Support ES6 features on older Android:
- Core-js polyfills for Promise, Array methods
- Babel runtime for syntax transforms
- Test on WebView 50+ (minimum viable)
- Bundle size impact analysis

#### 44. [P1-high] Optimize performance for slow Android devices
**Labels**: `P1-high`, `performance`, `android`  
**Milestone**: v0.2 - Core Navigation

Android shows 5+ second load times vs <2s iOS:
- Hardware acceleration with transform/opacity only
- Remove box-shadows during transitions
- Minimize reflows and repaints
- Lazy load non-critical features
- Samsung devices particularly affected

### From Migration Strategy Research

#### 45. [P0-critical] Implement shadow table migration strategy
**Labels**: `P0-critical`, `architecture`, `migration`  
**Milestone**: v0.7 - Migration Support

Zero-disruption data migration required:
- Dual-write to both old and new storage
- Shadow tables for progressive sync
- No data loss during transition
- Automatic consistency verification

#### 46. [P0-critical] Create opt-in migration flow
**Labels**: `P0-critical`, `feature`, `adhd`, `autism`  
**Milestone**: v0.7 - Migration Support

User-controlled migration essential:
- Never automatic transitions
- Preview mode without commitment
- 4-6 weeks advance notice
- Visual preparation guides
- Persistent old interface access

#### 47. [P1-high] Build 3-tier rollback system
**Labels**: `P1-high`, `feature`, `safety`  
**Milestone**: v0.7 - Migration Support

Instant rollback capability:
- Tier 1: 10-minute automated rollback
- Tier 2: 3-minute emergency rollback
- Tier 3: Immediate panic button
- Feature flags for instant switching
- Circuit breaker pattern

#### 48. [P1-high] Add migration monitoring metrics
**Labels**: `P1-high`, `monitoring`, `adhd`, `autism`  
**Milestone**: v0.7 - Migration Support

Neurodivergent-specific success metrics:
- Task completion rates
- Time-to-accomplish changes
- Error recovery patterns
- Abandonment triggers
- Routine disruption indicators

#### 49. [P2-medium] Maintain spatial UI consistency
**Labels**: `P2-medium`, `ux`, `autism`  
**Milestone**: v0.7 - Migration Support

50-pixel deviation limit for muscle memory:
- Map all button positions
- Maintain spatial relationships
- Gradual position transitions
- Visual diff tools for changes

### From Visual Task Management Research

#### 50. [P1-high] Implement progressive view disclosure
**Labels**: `P1-high`, `feature`, `adhd`, `ux`  
**Milestone**: v0.4 - Accessibility

Prevent option overwhelm:
- Tier 1: List, calendar, kanban (core)
- Tier 2: Density, color options
- Tier 3: Advanced customization
- Smart defaults from usage
- 3-7 initial options only

#### 51. [P1-high] Add visual time representations
**Labels**: `P1-high`, `feature`, `adhd`, `visual`  
**Milestone**: v0.4 - Accessibility

Time blindness accommodations:
- Countdown timers
- Disappearing disk visuals
- Progress arcs
- Time remaining indicators
- Optional "Time Timer" mode

#### 52. [P1-high] Create kanban board view
**Labels**: `P1-high`, `feature`, `adhd`, `visual`  
**Milestone**: v0.4 - Accessibility

Spatial task organization:
- Work-in-progress limits
- Drag between columns
- Visual capacity indicators
- Mobile-optimized gestures
- Quick add to columns

#### 53. [P2-medium] Build mind map visualization
**Labels**: `P2-medium`, `feature`, `adhd`, `visual`  
**Milestone**: v0.8 - Advanced Views

Non-linear thinking support:
- Radial task layout
- Connection visualization
- Zoom and pan controls
- Touch-optimized navigation
- Export to linear format

## New Milestones

### v0.7 - Migration Support (NEW)
- Shadow table strategy
- Opt-in migration flow
- 3-tier rollback system
- Migration monitoring
- Spatial consistency

### v0.8 - Advanced Views (NEW)
- Mind map visualization
- Advanced customization
- View presets
- Export capabilities

## Updated Priority Order

### Immediate (P0-critical)
1. **Downgrade to Capacitor 4.x** - Enables Android 5 support
2. **WebView version detection** - Prevents crashes
3. **Shadow table migration** - Zero data loss
4. **Opt-in migration flow** - User control

### High Priority (P1-high)
1. **ES6 polyfills** - Compatibility layer
2. **Performance optimization** - 5+ second loads unacceptable
3. **3-tier rollback** - Safety net
4. **Progressive view disclosure** - Prevent overwhelm
5. **Visual time representations** - Time blindness support

## Key Research Statistics Applied

### Android 5 Compatibility
- **Capacitor 4.x** last version supporting Android 5
- **WebView 60+** recommended, 50+ minimum
- **5+ seconds** load time on Android vs <2s iOS
- **Samsung devices** consistently slower

### Migration Requirements
- **4-6 weeks** advance notice required
- **2-4 weeks** phased implementation
- **50 pixels** maximum UI deviation
- **10/3/immediate** minute rollback tiers

### Visual Management
- **40% productivity loss** per task switch (ADHD)
- **80% stress reduction** with visual timelines
- **8 of 12** ADHD users prefer tabular data
- **4-6 colors** maximum for coding
- **<300ms** transition animations

## GitHub CLI Commands

```bash
# Critical Android 5 fix
gh issue create --title "[P0-critical] Downgrade to Capacitor 4.x for Android 5.1+ support" \
  --label "P0-critical,bug,android,compatibility" \
  --milestone "v0.1 - ES5 Compatibility" \
  --body "Capacitor 5+ drops Android 5. Must use 4.x for compatibility."

# WebView detection
gh issue create --title "[P0-critical] Implement WebView version detection" \
  --label "P0-critical,feature,android,compatibility" \
  --milestone "v0.1 - ES5 Compatibility" \
  --body "Detect and warn about incompatible WebView versions <60"

# Migration strategy
gh issue create --title "[P0-critical] Implement shadow table migration strategy" \
  --label "P0-critical,architecture,migration" \
  --milestone "v0.7 - Migration Support" \
  --body "Zero-disruption migration using dual-write shadow tables"
```