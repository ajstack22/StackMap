# Issue #30: Implement Edit Mode System

## 🚨 CRITICAL: Development Process
1. **BEFORE IMPLEMENTING**: Post your DETAILED implementation plan to Issue #30 on GitHub for PM adversarial review
2. **AFTER COMPLETING**: Update Issue #30 with completion status for final adversarial review
3. **DO NOT MERGE**: Until PM completes adversarial review and approves
4. **THINK HARD**: This is SUPER IMPORTANT - prevents accidental task changes for ADHD users

## Problem Statement
ADHD users often accidentally modify or delete tasks when trying to scroll or interact with the interface. We need a deliberate "Edit Mode" that:
- Prevents accidental modifications in normal use
- Makes editing intentional and obvious
- Provides clear visual feedback about current mode
- Remembers user preference

## Research Context
From ADHD research:
- **Accidental taps/modifications** are extremely frustrating
- Users need **clear mode indicators**
- **Persistent state** important for routine users
- **One-handed operation** must be supported

## Requirements

### 1. Mode States
```javascript
const EditModeStates = {
    VIEWING: 'viewing',    // Default - no edits possible
    EDITING: 'editing'     // Edit mode - modifications allowed
};
```

### 2. Visual Indicators
- Prominent mode indicator in header
- Different card appearance in edit mode
- Edit controls only visible when editing
- Clear "Exit Edit Mode" button

### 3. Persistence
- Remember mode per user
- Reset to viewing mode after inactivity (30 min)
- Option to "always start in view mode"

## Implementation Design

### Core Module Structure
```javascript
(function() {
    'use strict';
    
    var EditMode = {
        // State
        isActive: false,
        inactivityTimer: null,
        INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
        
        init: function() {
            this.loadState();
            this.setupUI();
            this.startInactivityTimer();
        },
        
        toggle: function() {
            this.isActive = !this.isActive;
            this.saveState();
            this.updateUI();
            this.notifyObservers();
            
            if (this.isActive) {
                this.resetInactivityTimer();
            }
        }
    };
    
    window.EditMode = EditMode;
})();
```

### Files to Create/Modify

1. **Create `js/edit-mode.js`**
   - Core edit mode logic
   - State management
   - Observer pattern for components

2. **Update `js/task-cards.js`**
   - Show/hide edit controls based on mode
   - Disable task modifications when not editing

3. **Update `css/edit-mode.css`**
   - Visual styles for edit mode
   - Mode indicator styles
   - Transition animations

4. **Update header in `index.html`**
   - Add edit mode toggle button
   - Add mode indicator

## UI/UX Requirements

### Mode Toggle Button
```html
<button class="edit-mode-toggle" aria-label="Toggle edit mode">
    <span class="edit-mode-icon">✏️</span>
    <span class="edit-mode-text">Edit</span>
</button>
```

### Visual Feedback
```css
/* Normal mode */
.task-card {
    border: 1px solid var(--border-color);
}

/* Edit mode */
.edit-mode .task-card {
    border: 2px dashed var(--primary-color);
    background: var(--edit-mode-bg);
}

/* Edit mode indicator */
.edit-mode-indicator {
    background: var(--warning-color);
    color: white;
    padding: 8px 16px;
    font-weight: bold;
}
```

### Disabled Interactions in View Mode
- No drag and drop
- No delete buttons
- No inline editing
- Checkbox completion still works (intentional action)

## Implementation Checklist

### Phase 1: Core System
- [ ] Create EditMode module
- [ ] Add toggle button to header
- [ ] Implement state persistence
- [ ] Add visual mode indicators

### Phase 2: Component Integration
- [ ] Update TaskCards to respect mode
- [ ] Disable drag-drop when not editing
- [ ] Hide delete buttons when not editing
- [ ] Update TaskDisplay for inline editing

### Phase 3: Polish
- [ ] Add smooth transitions
- [ ] Implement inactivity timeout
- [ ] Add confirmation for destructive actions
- [ ] Keyboard shortcut (Cmd/Ctrl + E)

## Testing Requirements

### Functional Tests
1. **Mode Toggle**
   - Toggle edit mode on/off
   - Verify visual changes
   - Verify control visibility

2. **Persistence**
   - Enable edit mode
   - Refresh page
   - Verify mode maintained

3. **Inactivity**
   - Enable edit mode
   - Wait 30 minutes
   - Verify auto-disable

4. **Protection**
   - In view mode, try to:
     - Delete a task (should fail)
     - Drag a task (should fail)
     - Edit task title (should fail)
   - Verify checkbox still works

### Accessibility Tests
- [ ] Screen reader announces mode changes
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] ARIA labels accurate

## Definition of Done
- [ ] Edit mode toggle works reliably
- [ ] Visual indicators clear and obvious
- [ ] All edit actions blocked in view mode
- [ ] Mode persists across sessions
- [ ] Inactivity timeout works
- [ ] No console errors
- [ ] Smooth animations (respects prefers-reduced-motion)
- [ ] Works on all platforms (web, mobile, PWA)
- [ ] Accessibility verified
- [ ] Video demo provided

## Common Pitfalls to Avoid
1. Don't block emergency actions (like marking complete)
2. Don't make mode indicator too subtle
3. Don't forget keyboard users
4. Don't break platform back button
5. Remember safe mode (reduced animations)

## Success Metrics
- **0 accidental modifications** in view mode
- **Clear mode visibility** in user testing
- **<100ms** mode switch time
- **Persistent state** across sessions

Remember: This protects ADHD users from frustrating accidents. Every accidental deletion or change can derail their entire day!