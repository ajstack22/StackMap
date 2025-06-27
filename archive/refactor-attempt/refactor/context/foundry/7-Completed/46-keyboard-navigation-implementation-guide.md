# Keyboard Navigation Implementation Guide - Issue #46

## Overview
Enhanced keyboard navigation for users with ADHD, autism, and motor impairments. Implementation already exists in `js/keyboard-nav.js` but needs enhancements based on PM review.

## Current Implementation Status

### ✅ Already Implemented
- Basic arrow key navigation (up/down, j/k vim-style)
- Skip links functionality
- Roving tabindex pattern
- Focus management for task cards
- Some keyboard shortcuts (n, e, d, t, /, ?)
- ARIA attributes for screen readers
- 100ms debounce on key presses

### ⚠️ Critical Issues from PM Review
1. **100ms debounce too slow** - Reduce to 50ms for navigation
2. **Virtual scrolling focus loss** - Need to preserve focus during Clusterize updates
3. **Two-key shortcuts (g h) poor UX** - Remove in favor of single keys
4. **No undo for destructive actions** - Add Ctrl+Z support
5. **Mobile keyboard conflicts** - Need virtual keyboard detection

## Implementation Priority (Based on PM Feedback)

### Phase 1: Fix Critical Issues (Must Do)
1. **Reduce Debounce Timing**
   ```javascript
   // Different timings for different key types
   NAVIGATION_DEBOUNCE: 50,  // Arrow keys, j/k
   ACTION_DEBOUNCE: 100,      // Delete, edit actions
   ```

2. **Fix Virtual Scrolling Focus Loss**
   ```javascript
   // Store focus before virtual scroll update
   beforeVirtualUpdate: function() {
     this.focusedTaskId = document.activeElement.getAttribute('data-task-id');
   },
   
   // Restore after update
   afterVirtualUpdate: function() {
     if (this.focusedTaskId) {
       var element = document.querySelector('[data-task-id="' + this.focusedTaskId + '"]');
       if (element) element.focus();
     }
   }
   ```

3. **Remove Two-Key Shortcuts**
   - Delete 'g h', 'g t', 'g s' combinations
   - Keep only single-key shortcuts

4. **Add Undo System**
   ```javascript
   undoStack: [],
   MAX_UNDO: 5,
   
   addToUndoStack: function(action) {
     this.undoStack.push(action);
     if (this.undoStack.length > this.MAX_UNDO) {
       this.undoStack.shift();
     }
   }
   ```

### Phase 2: Core Enhancements
1. **Mobile Keyboard Detection**
   ```javascript
   detectVirtualKeyboard: function() {
     var threshold = 150;
     var windowHeight = window.innerHeight;
     var documentHeight = document.documentElement.clientHeight;
     return (windowHeight + threshold) < documentHeight;
   }
   ```

2. **Improved Focus Indicators**
   ```css
   /* High contrast, no animation option */
   .focus-indicator {
     outline: 3px solid #4A90E2;
     outline-offset: 2px;
   }
   
   .reduce-motion .focus-indicator {
     transition: none !important;
   }
   ```

3. **Emergency Escape (Triple ESC)**
   ```javascript
   escapeCount: 0,
   escapeTimer: null,
   
   handleEscape: function() {
     this.escapeCount++;
     if (this.escapeCount >= 3) {
       this.disableAllShortcuts();
     }
     // Reset after 1 second
     clearTimeout(this.escapeTimer);
     this.escapeTimer = setTimeout(() => {
       this.escapeCount = 0;
     }, 1000);
   }
   ```

### Phase 3: Nice to Have (If Time Permits)
- Focus history stack with Backspace navigation
- Context-aware help overlay
- Progressive disclosure of shortcuts

## Shortcuts to Implement

### Primary (Single Key)
- **T** - Create new task (replace 'n')
- **D** - Mark as done (safer than delete)
- **F** - Focus mode
- **Space** - Toggle checkbox/activate
- **/** - Search (with conflict detection)
- **?** - Help overlay

### Navigation
- **Arrow Keys** - Move between tasks
- **Home/End** - First/last task
- **Tab** - Section navigation
- **Enter** - Edit/activate
- **Escape** - Cancel/close

### With Modifiers (Safer)
- **Ctrl+Z** - Undo last action
- **Ctrl+D** - Delete (with confirmation)

## Testing Requirements

### Browser Testing
1. Chrome + NVDA
2. Firefox + JAWS
3. Safari + VoiceOver
4. Mobile Safari + VoiceOver
5. Chrome Android + TalkBack

### Special Conditions
1. Sticky Keys enabled
2. High contrast mode
3. Reduced motion preference
4. One-handed operation
5. Virtual keyboard active

### Extension Conflicts to Test
- Vimium (vim keybindings)
- LastPass (form filling)
- Grammarly (focus management)

## Performance Targets
- Navigation response: <16ms (one frame)
- Memory overhead: <50KB
- No jank during rapid navigation
- Focus restoration: <50ms

## Implementation Checklist

### Immediate Fixes
- [ ] Reduce debounce to 50ms for navigation
- [ ] Fix virtual scrolling focus loss
- [ ] Remove two-key shortcuts
- [ ] Add visual feedback for all actions
- [ ] Test with screen readers

### Core Features
- [ ] Implement single-key shortcuts
- [ ] Add undo system (Ctrl+Z)
- [ ] Mobile keyboard detection
- [ ] Emergency escape (3x ESC)
- [ ] Focus history tracking

### Accessibility
- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader announcements
- [ ] High contrast focus indicators
- [ ] Reduced motion support
- [ ] Skip links visible on focus

### Testing
- [ ] All shortcuts documented
- [ ] No keyboard traps
- [ ] Works with sticky keys
- [ ] Virtual keyboard handling
- [ ] Extension conflict warnings

## Success Metrics
- Time to complete task via keyboard: <2x mouse time
- Zero focus loss incidents during navigation
- All features accessible via keyboard
- Works with top 3 screen readers
- No conflicts with popular extensions

## Additional Requirements from PM Review

### Shortcut Conflict Detection
```javascript
// Must implement before shortcuts
detectShortcutConflicts: function() {
  var conflicts = {
    '/': 'Firefox Quick Find',
    'T': 'Browser find-as-you-type',
    'D': 'Bookmark shortcuts'
  };
  
  // Check user agent and warn
  if (navigator.userAgent.includes('Firefox') && this.shortcuts['/']) {
    console.warn('Slash key conflicts with Firefox Quick Find');
    // Provide alternative or disable
  }
}
```

### Mobile Keyboard Handling
- Detect Bluetooth keyboards vs virtual
- Handle hybrid touch + keyboard devices (iPad with keyboard)
- Different event handling for virtual keyboards

### International Keyboard Support
```javascript
// Detect keyboard layout
getKeyboardLayout: function() {
  // Use navigator.keyboard.getLayoutMap() when available
  // Fallback to locale detection
  // Adjust shortcuts based on layout
}
```

### Visual Shortcut Hints
- Add data-shortcut attributes to buttons
- Show tooltips with keyboard shortcuts
- Persistent hint mode in settings

### Memory Management
```javascript
// Clean up listeners on view change
destroy: function() {
  document.removeEventListener('keydown', this.globalHandler);
  this.container.removeEventListener('keydown', this.containerHandler);
  // Clear all references
  this.focusableElements = null;
}
```

## Updated Implementation Priority

### Must Have (Before Release)
1. ✅ Shortcut conflict detection and handling
2. ✅ Focus-visible with fallback (UPDATE: Modern JS OK!)
3. ✅ Mobile keyboard scenario handling
4. ✅ Listener cleanup strategy
5. ✅ RTL language support

### Strongly Recommended
1. Customizable shortcuts (save to settings)
2. Visual shortcut hints on hover
3. Reduced shortcut mode (3-4 keys only)
4. International keyboard layout detection

## Notes for Developer
- **IMPORTANT**: You can use modern JavaScript! :focus-visible is supported!
- Start with Phase 1 critical fixes
- Test each change with actual keyboard navigation
- Get feedback from ADHD/autism users early
- Don't over-engineer - simple is better
- Performance > Features for ADHD users
- Test with Firefox, Chrome, Safari for conflicts
- Include RTL language testing