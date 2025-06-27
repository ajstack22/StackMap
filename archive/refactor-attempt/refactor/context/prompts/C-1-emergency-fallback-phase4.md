# Issue #26: Emergency Fallback Phase 4 - Inline Error Handling

## Context
StackMap is an ADHD/autism-focused task management app. Users need graceful fallbacks when JavaScript partially fails.

## Requirements

### 1. Component-Level Error Boundaries
Add error handling to each major component that shows inline fallback UI instead of breaking the entire app.

### 2. Implementation Pattern
```javascript
// Wrap each component initialization
try {
    TaskDisplay.init();
} catch (error) {
    console.error('TaskDisplay failed:', error);
    document.getElementById('task-container').classList.add('component-error-active');
    // Fallback UI is already in HTML, just needs CSS class
}
```

### 3. Components to Protect
- [ ] TaskDisplay (task list)
- [ ] UserManager (profile switching)
- [ ] EditMode (edit functionality)
- [ ] DragDropReorder (reordering)
- [ ] ThemeManager (themes)
- [ ] DataExport/Import (backup)

### 4. Fallback UI Requirements
Each component area should have:
- Hidden fallback content in HTML
- RSD-aware messaging (gentle, not alarming)
- Simple recovery action (reload button)
- Form-based alternatives where possible

### 5. Add to index.html
```html
<!-- Example for task area -->
<div id="tasks">
    <div class="component-normal">
        <div id="task-container"></div>
    </div>
    <div class="component-fallback" role="alert">
        <p class="fallback-message">Taking a moment to load your tasks</p>
        <button onclick="location.reload()" class="fallback-button">
            Try again
        </button>
    </div>
</div>
```

### 6. CSS Classes
```css
.component-fallback { display: none; }
.component-error-active .component-normal { display: none; }
.component-error-active .component-fallback { display: block; }
```

### 7. Error Recovery
- Store last known good state
- Attempt component restart
- Log errors for debugging
- Don't cascade failures

## Success Criteria
- [ ] Each component has fallback UI
- [ ] Partial failures don't break entire app
- [ ] Users see helpful messages, not errors
- [ ] Recovery is one click/tap away
- [ ] Works without JavaScript for critical actions

## Time Estimate: 4-6 hours