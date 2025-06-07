# Animation System Implementation Debrief

## Overview
This document provides comprehensive context for implementing task completion and routine completion animations in StackMap, including a preferences menu system to control animation settings.

## Core Philosophy
StackMap is designed for families with special needs children. All animations must be:
- **Non-overstimulating**: Gentle, predictable movements
- **Optional**: Can be completely disabled via preferences
- **Accessible**: Respect `prefers-reduced-motion` media queries
- **Performant**: Work smoothly on low-end devices
- **Consistent**: Use the same timing and easing functions

## Current State Management

### Task Completion Flow
**File**: `/app/StackMapApp.js`
- Method: `toggleCardCompletion(index)` (line ~2600)
- Currently toggles the `completed` state in appState
- Saves to localStorage immediately
- Re-renders the entire card grid

**File**: `/renderer.js`
- Method: `renderCard()` 
- Adds class `card--completed` when task is done
- Shows completion indicator based on user preference
- Handles visual state changes

### Completion State Storage
**File**: `/state.js`
- Activities have `completed: boolean` property
- Stored per user in `user.activities[]` and `user.tomorrowActivities[]`
- Each activity also has:
  - `cardType`: 'recurring' | 'frequent' | 'single-use'
  - `visible`: boolean (for filtering completed single-use cards)

## Current Animation System

### CSS Animation Files
**File**: `/styles/animations.css`
- Contains reusable animation keyframes
- Current animations:
  - `fadeIn`: Simple opacity fade
  - `slideUp`: Slide up from bottom
  - `pulse`: Gentle pulsing effect
  - `shake`: Error feedback animation

### Existing Card Animations
**File**: `/styles/cards.css`
- Transition on hover: `transform 0.2s ease`
- Card flip animation potential (not currently used)
- Shadow animations on interaction

## Preferences System

### HybridPanelManager
**File**: `/js/HybridPanelManager.js`
- Manages all preference UI
- Method: `renderPreferencesContent()` (line ~272)
- Current preferences:
  - Theme colors
  - Display mode (none/numbers/times)
  - Completion indicators (on/off)

### Preference Storage
**File**: `/state.js`
- User preferences stored in `user.settings`
- Global settings in `appState.settings`
- Method: `getUserSetting(settingName)` in HybridPanelManager

### Adding New Preferences
1. Add to user settings schema in state.js
2. Add UI control in `renderPreferencesContent()`
3. Create handler method in HybridPanelManager
4. Update renderer to respect preference

## Component Architecture

### Card Rendering
**File**: `/components.js`
- `ActivityCard` class handles individual cards
- Method: `handleClick()` processes completion
- Could be extended for animation triggers

### Renderer System
**File**: `/renderer.js`
- `CardRenderer` class manages all card rendering
- Method: `renderCards()` builds entire grid
- Method: `getCardHTML()` generates individual card HTML
- Batch updates possible for performance

## User Experience Considerations

### Multi-User Support
- Each user has independent completion states
- Animation preferences should be per-user
- Consider if animations play when switching users

### Today/Tomorrow System
- Separate completion states for each day
- Consider transition animations when switching days
- Method: `switchDay()` in StackMapApp.js

### Display Modes
- Numbers mode: Shows card position
- Times mode: Shows activity time
- None mode: Clean cards
- Animations must work with all modes

## Accessibility Requirements

### WCAG Compliance
- Provide animation controls (WCAG 2.3.3)
- Respect `prefers-reduced-motion`
- No flashing > 3Hz
- Sufficient contrast during animations

### Special Needs Focus
- Avoid sudden movements
- Predictable timing
- Clear visual feedback
- Option for sound effects (with toggle)

## Technical Constraints

### Performance
- Cards render via innerHTML (batch updates)
- ~15-30 cards typical per user
- Mobile devices primary target
- Consider requestAnimationFrame for smoothness

### Browser Support
- Modern browsers only (ES6+)
- CSS custom properties used extensively
- No IE11 support needed
- PWA mode on iOS/Android

### Theme System
- CSS variables for all colors
- `--primary-color` changes with theme
- Animations should respect theme colors
- Dark themes need consideration

## Implementation Recommendations

### Animation Types to Consider

1. **Task Completion Animation**
   - Checkmark appearance
   - Card color transition
   - Celebratory burst effect
   - Progress indicator update

2. **Routine Completion Animation**
   - Full-screen celebration
   - Confetti or stars
   - Sound effect option
   - Auto-dismiss after X seconds

3. **Micro-interactions**
   - Hover states
   - Click feedback
   - Loading states
   - Error feedback

### Preference Menu Structure
```javascript
// Suggested preference structure
animationSettings: {
  enableAnimations: true,
  animationSpeed: 'normal', // slow, normal, fast
  celebrationType: 'confetti', // confetti, stars, minimal, none
  enableSounds: false,
  reducedMotion: false // auto-detect or manual
}
```

### Key Files to Modify

1. **For Preferences UI**:
   - `/js/HybridPanelManager.js` - Add animation preference controls
   - `/styles/hybrid-panels.css` - Style new preference controls

2. **For Animation Logic**:
   - `/app/StackMapApp.js` - Trigger animations on completion
   - `/renderer.js` - Apply animation classes during render
   - `/components.js` - Handle animation in card component

3. **For Animation Styles**:
   - `/styles/animations.css` - New keyframe animations
   - `/styles/cards.css` - Card-specific animations
   - Create new: `/styles/celebrations.css` - Routine completion animations

4. **For State Management**:
   - `/state.js` - Store animation preferences
   - Update user schema for new settings

## Testing Considerations

### Test Scenarios
1. Animation with multiple users
2. Rapid clicking (queue/cancel animations)
3. Page refresh during animation
4. Theme changes during animation
5. Mobile performance testing
6. Reduced motion compliance

### Debug Functions
- `window.debugAnimations()` - Test all animations
- `window.appInstance.appState` - Check current state
- Browser DevTools Animation panel

## Integration Points

### Google Drive Sync
- Animation preferences should sync
- Consider bandwidth for preference updates

### PWA Considerations
- Animations work offline
- Cache animation assets
- Service worker updates

### Drawer System
- Animations shouldn't interfere with drawer
- Z-index management crucial
- Mobile gesture conflicts

## Code Patterns

### Event Handling
```javascript
// Current pattern in StackMapApp
toggleCardCompletion(index) {
  const activities = this.appState.getCurrentActivities();
  if (activities[index]) {
    activities[index].completed = !activities[index].completed;
    
    // Add animation trigger here
    if (activities[index].completed) {
      this.triggerCompletionAnimation(index);
    }
    
    this.appState._triggerSave();
    this.render();
  }
}
```

### CSS Architecture
```css
/* Use CSS custom properties for timing */
:root {
  --animation-duration: 0.3s;
  --animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Potential Challenges

1. **State Synchronization**: Animations must complete before state updates
2. **Re-render Timing**: Current render() call might interrupt animations
3. **Memory Management**: Clean up animation elements
4. **Touch Interactions**: Prevent double-tap during animation
5. **Cross-browser**: Safari animation quirks, Firefox performance

## Resources

### Current Helper Functions
- `window.appInstance` - Global app reference
- `window.hybridPanelManager` - Preferences manager
- `localStorage.getItem('stackmap-data')` - Raw data access

### CSS Variables Available
- `--primary-color` - Theme color
- `--text-color` - Contrast text
- `--success-color` - Completion color (if added)
- `--background-color` - Page background

### Material Icons Available
- `check_circle` - Completion
- `celebration` - Party/completion
- `star` - Achievement
- `emoji_events` - Trophy

## Future Considerations

1. **Gamification**: Points, streaks, achievements
2. **Social Features**: Share celebrations
3. **Custom Animations**: User-uploaded GIFs
4. **Seasonal Themes**: Holiday-specific animations
5. **AI Celebrations**: Personalized messages

## Additional Critical Context

### Edit Mode Considerations
- Animations should be subtle or disabled in edit mode
- `grownupMode` property in StackMapApp indicates edit state
- Don't celebrate completions during task management

### Mobile-Specific Animations
- Touch feedback animations
- Smaller celebrations on mobile
- Battery/performance consciousness
- Gesture conflict avoidance

### Sound Architecture (Not Yet Implemented)
- Web Audio API for sound effects
- Preload audio files
- Volume controls needed
- Mute by default (accessibility)
- Consider haptic feedback API

### Animation Queue Management
```javascript
// Suggested pattern for sequential animations
class AnimationQueue {
  constructor() {
    this.queue = [];
    this.running = false;
  }
  
  add(animation) {
    this.queue.push(animation);
    if (!this.running) this.run();
  }
  
  async run() {
    this.running = true;
    while (this.queue.length > 0) {
      const animation = this.queue.shift();
      await animation();
    }
    this.running = false;
  }
}
```

### Existing Animation Examples
1. **Splash Screen** (just added):
   - Fade in/out: `.splash-screen.fade-out`
   - Slide up: `@keyframes slideUp`
   - Shows pattern for full-screen overlays

2. **Panel Animations**:
   - Transform-based sliding
   - 0.3s cubic-bezier timing
   - Good reference for timing

3. **FAB Hover States**:
   - Scale transforms
   - Shadow animations
   - Subtle but effective

### Critical Functions to Preserve
- `this.render()` - Full re-render (may interrupt animations)
- `this.appState._triggerSave()` - Saves to localStorage
- `this.updateDayCounts()` - Updates completion counters
- Panel animations shouldn't conflict with completion animations

### Z-Index Reference (from z-index-map.md)
- 10000: Splash screens
- 1010: Floating buttons
- 1006: Side panels  
- 1000: Backdrop
- 100: Cards
- Celebration animations need appropriate z-index

### Performance Patterns
```javascript
// Use requestAnimationFrame for smooth animations
function animateElement(element, keyframes, options) {
  if ('animate' in element) {
    // Web Animations API
    return element.animate(keyframes, options);
  } else {
    // Fallback to CSS classes
    element.classList.add('animating');
    return new Promise(resolve => {
      element.addEventListener('animationend', resolve, { once: true });
    });
  }
}
```

### Emoji Celebration Potential
- User's selected emoji could be part of celebration
- Current user emoji: `getCurrentUser().icon`
- Activity emoji: `activity.icon`
- Could create emoji fountain/burst effect

### Remember: Special Needs First
Every animation decision should ask:
1. Could this overwhelm a sensitive user?
2. Is it predictable and gentle?
3. Can it be disabled easily?
4. Does it provide clear feedback?
5. Is it necessary or just decorative?

---

This document should provide comprehensive context for implementing the animation system. The key is maintaining StackMap's special needs focus while adding delightful, optional enhancements to the user experience.