# Issue #31: Implement Drag and Drop Task Reordering

## 🚨 CRITICAL: Development Process
1. **BEFORE IMPLEMENTING**: Post your DETAILED implementation plan to Issue #31 on GitHub for PM adversarial review
2. **AFTER COMPLETING**: Update Issue #31 with completion status for final adversarial review
3. **DO NOT MERGE**: Until PM completes adversarial review and approves
4. **THINK HARD**: This is SUPER IMPORTANT - must not conflict with scroll fix from Issue #18

## Problem Statement
Users need to reorder tasks by priority, but this must work WITH the touch/scroll conflict fix from Issue #18. The implementation must:
- Require long-press (400ms) to initiate drag
- Work only in Edit Mode (Issue #30)
- Provide clear visual feedback
- Not interfere with natural scrolling

## Dependency Alert
⚠️ **REQUIRES**:
- Issue #18 touch/scroll fix (already completed)
- Issue #30 Edit Mode system (implement that first or coordinate)

## Research Context
From ADHD interaction patterns:
- **Task prioritization** is crucial for executive function
- **Visual feedback** needed within 100ms
- **Drop zones** must be obvious
- **Undo capability** important for confidence

## Technical Requirements

### Integration with Existing Systems
```javascript
// Must check edit mode before allowing drag
if (!window.EditMode || !window.EditMode.isActive()) {
    return; // No drag in view mode
}

// Must use same touch detection from Issue #18
const LONG_PRESS_THRESHOLD = 400; // Same as scroll fix
```

### Drag and Drop States
1. **Normal** - Card in default position
2. **Ready to drag** - After 400ms press (elevation change)
3. **Dragging** - Card lifted, drop zones visible
4. **Returning** - Cancelled drag, animate back
5. **Dropping** - Valid drop, reorder animation

## Implementation Design

### Core Module Structure
```javascript
(function() {
    'use strict';
    
    var DragDropReorder = {
        // Configuration (matching Issue #18)
        LONG_PRESS_MS: 400,
        SCROLL_THRESHOLD: 10,
        
        // State
        draggedElement: null,
        dropZones: [],
        originalIndex: -1,
        
        init: function() {
            // Only init if edit mode exists
            if (!window.EditMode) {
                console.warn('DragDropReorder requires EditMode');
                return;
            }
            
            this._setupEventListeners();
        },
        
        _canDrag: function() {
            return window.EditMode && window.EditMode.isActive();
        }
    };
    
    window.DragDropReorder = DragDropReorder;
})();
```

### Visual Feedback Requirements
```css
/* Long-press preparation (0-400ms) */
.task-card.preparing-drag {
    transition: transform 0.2s ease-out;
    transform: scale(0.98);
}

/* Ready to drag (400ms reached) */
.task-card.ready-to-drag {
    transform: scale(1.02);
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

/* Actively dragging */
.task-card.dragging {
    position: fixed;
    z-index: 1000;
    transform: scale(1.05) rotate(2deg);
    opacity: 0.9;
}

/* Drop zones */
.drop-zone {
    height: 80px;
    border: 2px dashed var(--primary-color);
    background: var(--drop-zone-bg);
    margin: 8px 0;
    transition: all 0.2s;
}

.drop-zone.active {
    background: var(--drop-zone-active);
    transform: scale(1.02);
}
```

### Files to Create/Modify

1. **Update `js/drag-drop-reorder.js`** (from Issue #18)
   - Add edit mode check
   - Implement reorder logic
   - Add drop zone management

2. **Update `js/task-cards.js`**
   - Add drag event handlers
   - Update card positions after drop

3. **Update `css/cards.css`**
   - Add drag states styling
   - Drop zone styles
   - Smooth animations

## Implementation Checklist

### Phase 1: Core Drag Mechanics
- [ ] Integrate with Issue #18 touch detection
- [ ] Add edit mode dependency check
- [ ] Implement drag state management
- [ ] Create visual feedback classes

### Phase 2: Drop Zones
- [ ] Calculate drop positions dynamically
- [ ] Show zones during drag
- [ ] Highlight active zone on hover
- [ ] Animate successful drop

### Phase 3: Data Persistence
- [ ] Update task order in storage
- [ ] Maintain order per user
- [ ] Handle offline scenarios
- [ ] Sync order changes

### Phase 4: Polish
- [ ] Haptic feedback on drag start
- [ ] Smooth animations throughout
- [ ] Undo functionality
- [ ] Keyboard alternative (up/down arrows)

## Testing Requirements

### Integration Tests
1. **Edit Mode Dependency**
   - Verify no drag in view mode
   - Verify drag works in edit mode
   - Mode toggle updates drag capability

2. **Scroll Conflict**
   - Natural scrolling still works
   - 400ms press initiates drag
   - Scroll cancels drag preparation

3. **Reorder Persistence**
   - Drag task to new position
   - Refresh page
   - Order maintained

### Edge Cases
- [ ] Drag to top of list
- [ ] Drag to bottom of list
- [ ] Cancel drag (ESC or outside drop)
- [ ] Rapid successive drags
- [ ] List with only one task
- [ ] Very long task lists (performance)

## Accessibility Requirements
- [ ] Keyboard reordering (arrow keys in edit mode)
- [ ] Screen reader announcements
- [ ] Focus management after reorder
- [ ] Clear instructions for screen reader users

## Definition of Done
- [ ] Drag only works in edit mode
- [ ] 400ms long-press requirement met
- [ ] Visual feedback at every stage
- [ ] Drop zones clear and responsive
- [ ] Order persists across sessions
- [ ] Natural scrolling preserved
- [ ] No console errors
- [ ] Keyboard alternative works
- [ ] Haptic feedback on mobile
- [ ] Smooth 60fps animations
- [ ] Video demo provided

## Common Pitfalls to Avoid
1. Don't break the scroll fix from Issue #18
2. Don't allow drag in view mode
3. Don't forget to persist order
4. Don't make drop zones too small
5. Handle very long lists efficiently

## Performance Considerations
```javascript
// Use CSS transforms, not position changes
element.style.transform = `translateY(${offset}px)`;

// Debounce drop zone calculations
let dropZoneTimeout;
function updateDropZones() {
    clearTimeout(dropZoneTimeout);
    dropZoneTimeout = setTimeout(calculateZones, 16); // 60fps
}
```

Remember: Task prioritization is critical for ADHD executive function. Make reordering smooth, obvious, and reliable!