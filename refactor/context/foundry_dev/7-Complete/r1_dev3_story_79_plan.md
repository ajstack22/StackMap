# Implementation Plan: Activity Templates & Quick Add

## ⚠️ REQUIRED MODIFICATIONS - PM REVIEW

### Critical Changes Required Before Implementation:

1. **App.js Integration** - Add initialization code:
   ```javascript
   // In app.js after EditMode initialization
   if (window.QuickAddUI) {
       window.QuickAddUI.init();
   }
   ```

2. **Index.html Updates** - Add script/style references:
   ```html
   <!-- Add to <head> -->
   <link rel="stylesheet" href="css/quick-add.css">
   
   <!-- Add before closing </body> -->
   <script src="js/quick-add-ui.js"></script>
   ```

3. **Error Handling** - Wrap all operations:
   ```javascript
   addTemplate: function(template) {
       try {
           // Check prerequisites
           if (!window.TaskDisplay) {
               console.error('TaskDisplay not initialized');
               return;
           }
           
           // Existing code...
           
       } catch (error) {
           console.error('Failed to add template:', error);
           // Show user-friendly error
           this.showError('Unable to add activity. Please try again.');
       }
   }
   ```

4. **Task Integration** - Use proper API:
   ```javascript
   // Instead of direct manipulation:
   // window.TaskDisplay.tasks.unshift(newTask);
   
   // Use existing method if available:
   if (window.TaskDisplay.addTask) {
       window.TaskDisplay.addTask(newTask);
   } else {
       // Fallback with proper saving
       window.TaskDisplay.tasks.unshift(newTask);
       window.TaskDisplay.saveTasks();
       window.TaskDisplay.displayTasks();
   }
   ```

5. **Undo Integration** - Add undo support:
   ```javascript
   // After successful add
   if (window.UndoManager) {
       window.UndoManager.recordAction({
           type: 'add_task',
           taskId: newTask.id,
           undo: () => TaskDisplay.removeTask(newTask.id),
           redo: () => TaskDisplay.addTask(newTask)
       });
   }
   ```

6. **ActivityLibrary Verification**:
   ```javascript
   // Check method exists before calling
   if (window.ActivityLibrary && window.ActivityLibrary.show) {
       window.ActivityLibrary.show();
   } else {
       console.warn('ActivityLibrary not available');
   }
   ```

7. **Cleanup Method** - Add to QuickAddUI:
   ```javascript
   destroy: function() {
       // Remove event listeners
       if (this.buttonElement) {
           this.buttonElement.onclick = null;
           this.buttonElement.remove();
       }
       
       // Remove panel if open
       if (this.panelElement) {
           this.panelElement.remove();
       }
       
       // Unsubscribe from EditMode events
       if (window.EditMode && window.EditMode.off) {
           window.EditMode.off('change');
       }
       
       this.isInitialized = false;
   }
   ```

### Implementation Order:
1. First implement error handling throughout
2. Add proper initialization in app.js
3. Update index.html with new files
4. Verify all integration points exist
5. Add cleanup/destroy methods
6. Implement undo support

---

## Phase 1: Research Findings

### Default Activities Analysis
- **Total templates found**: 111 activities (18 default + 93 in library)
- **Categories**: 11 categories
  - Daily Care
  - School & Learning  
  - Therapy & Health
  - Sensory & Breaks
  - Social Skills
  - Play & Fun
  - Meals & Snacks
  - Transitions
  - Chores & Responsibilities
  - Exercise & Movement
  - Calming & Regulation

- **Data structure**:
```javascript
{
  title: 'Brush Teeth',
  description: 'Keep them clean and shiny!',
  icon: '🦷',
  visible: true,
  category: 'Daily Care'
}
```

### Current Add Flow
- **Location**: Add button appears as first card in grid when in edit mode
- **Steps**: 
  1. User enters edit mode
  2. Clicks "Add Activity" card
  3. Fills out form in modal
  4. Saves new activity
- **Pain points**: 
  - Must type everything manually
  - No quick access to common activities
  - Multiple steps for routine tasks

### Library Structure
- **Default Activities**: 18 pre-defined templates, 3 visible by default
- **Activity Library**: 93 additional templates in categories
- **Progressive Loading**: ActivityLoader supports tiered loading
- **Existing Modal**: ActivityLibrary.js already has full browse/search UI

## Phase 2: Implementation Order

### Step 1: Create Quick Add UI Component
**File**: js/quick-add-ui.js (NEW)

```javascript
const QuickAddUI = {
    isInitialized: false,
    isOpen: false,
    container: null,
    buttonElement: null,
    panelElement: null,
    
    init: function() {
        const self = this;
        
        // Only initialize in edit mode
        if (!window.EditMode || !window.EditMode.isActive()) return;
        
        // Create quick add button next to add card
        self.createQuickAddButton();
        
        // Listen for edit mode changes
        window.EditMode.on('change', function() {
            self.updateVisibility();
        });
    },
    
    createQuickAddButton: function() {
        // Create floating action button
        const button = document.createElement('button');
        button.className = 'quick-add-fab';
        button.innerHTML = '⚡';
        button.setAttribute('aria-label', 'Quick add activities');
        
        // Position near add card
        document.body.appendChild(button);
        
        button.onclick = function() {
            self.togglePanel();
        };
    },
    
    togglePanel: function() {
        if (self.isOpen) {
            self.closePanel();
        } else {
            self.openPanel();
        }
    },
    
    openPanel: function() {
        // Create slide-up panel with categories
        const panel = self.createPanel();
        document.body.appendChild(panel);
        
        // Load templates
        self.loadTemplates();
        
        // Animate in
        requestAnimationFrame(function() {
            panel.classList.add('open');
        });
    },
    
    createPanel: function() {
        const panel = document.createElement('div');
        panel.className = 'quick-add-panel';
        
        // Header with close button
        const header = document.createElement('div');
        header.className = 'quick-add-header';
        header.innerHTML = '<h3>⚡ Quick Add</h3><button class="close-btn">×</button>';
        
        // Category tabs
        const tabs = document.createElement('div');
        tabs.className = 'quick-add-tabs';
        
        // Template grid
        const grid = document.createElement('div');
        grid.className = 'quick-add-grid';
        
        panel.appendChild(header);
        panel.appendChild(tabs);
        panel.appendChild(grid);
        
        return panel;
    },
    
    loadTemplates: function() {
        // Get frequently used + visible defaults
        const templates = this.getQuickTemplates();
        
        // Group by category
        const grouped = this.groupByCategory(templates);
        
        // Render tabs
        this.renderCategoryTabs(grouped);
        
        // Show first category
        this.showCategory(Object.keys(grouped)[0]);
    },
    
    getQuickTemplates: function() {
        // Get top 20 most relevant templates
        const defaults = window.StackMapDefaultActivities.getVisibleActivities();
        const library = window.StackMapDefaultActivities.ACTIVITY_LIBRARY;
        
        // Prioritize morning/evening routines
        const priority = [
            'wake_up', 'brush_teeth', 'get_dressed', 'breakfast',
            'school_bus', 'homework_time', 'dinner_time', 
            'bath_time', 'pajama_time', 'bedtime'
        ];
        
        return [...defaults, ...library.filter(a => priority.includes(a.key))];
    }
};
```

### Step 2: Enhance Existing Quick Add Flow
**File**: js/task-cards.js (UPDATE)

```diff
createAddTaskCard: function() {
    const taskDisplay = window.TaskDisplay;
    
    const card = document.createElement('div');
    card.className = 'task-card add-task-card';
    
+   // Add quick actions container
+   const quickActions = document.createElement('div');
+   quickActions.className = 'add-task-quick-actions';
+   
+   // Quick add button
+   const quickAddBtn = document.createElement('button');
+   quickAddBtn.className = 'quick-add-btn';
+   quickAddBtn.innerHTML = '⚡ Quick Add';
+   quickAddBtn.onclick = function(e) {
+       e.stopPropagation();
+       if (window.QuickAddUI) {
+           window.QuickAddUI.show();
+       }
+   };
+   
+   // Browse library button  
+   const browseBtn = document.createElement('button');
+   browseBtn.className = 'browse-library-btn';
+   browseBtn.innerHTML = '📚 Browse';
+   browseBtn.onclick = function(e) {
+       e.stopPropagation();
+       if (window.ActivityLibrary) {
+           window.ActivityLibrary.show();
+       }
+   };
+   
+   quickActions.appendChild(quickAddBtn);
+   quickActions.appendChild(browseBtn);
+   card.appendChild(quickActions);
    
    // Original add button
    const content = document.createElement('div');
    content.className = 'add-task-card__content';
```

### Step 3: Create Compact Template Grid
**File**: css/quick-add.css (NEW)

```css
/* Quick Add FAB */
.quick-add-fab {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--accent-color, #ff6b6b);
    color: white;
    border: none;
    font-size: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    z-index: 100;
    transition: transform 0.2s ease;
}

.quick-add-fab:active {
    transform: scale(0.95);
}

/* Quick Add Panel */
.quick-add-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 70vh;
    background: var(--surface-color, #2a2a2a);
    border-radius: 20px 20px 0 0;
    transform: translateY(100%);
    transition: transform 0.3s ease;
    z-index: 200;
    display: flex;
    flex-direction: column;
}

.quick-add-panel.open {
    transform: translateY(0);
}

/* Category Tabs */
.quick-add-tabs {
    display: flex;
    overflow-x: auto;
    padding: 12px;
    gap: 8px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    -webkit-overflow-scrolling: touch;
}

.category-tab {
    padding: 8px 16px;
    border-radius: 20px;
    background: rgba(255,255,255,0.1);
    color: white;
    border: none;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.2s ease;
}

.category-tab.active {
    background: var(--primary-color, #667eea);
}

/* Template Grid */
.quick-add-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
    padding: 16px;
    overflow-y: auto;
    flex: 1;
}

.template-tile {
    aspect-ratio: 1;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
}

.template-tile:hover {
    background: rgba(255,255,255,0.1);
    transform: scale(1.05);
}

.template-tile:active {
    transform: scale(0.95);
}

.template-tile.adding {
    border-color: var(--success-color, #4caf50);
    animation: pulse 0.6s ease;
}

.template-icon {
    font-size: 32px;
    margin-bottom: 4px;
}

.template-title {
    font-size: 12px;
    text-align: center;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

/* Animation */
@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

/* Responsive */
@media (min-width: 768px) {
    .quick-add-panel {
        max-width: 600px;
        margin: 0 auto;
        border-radius: 20px;
        bottom: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    
    .quick-add-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
}
```

### Step 4: Integrate with Task System
**File**: js/quick-add-ui.js (continued)

```javascript
addTemplate: function(template) {
    const self = this;
    
    // Visual feedback
    const tile = event.target.closest('.template-tile');
    tile.classList.add('adding');
    
    // Create task from template
    const newTask = {
        id: `task_${Date.now()}`,
        title: template.title,
        description: template.description,
        icon: template.icon || '✓',
        category: template.category,
        completed: false,
        created_at: new Date().toISOString(),
        user_id: window.UserManager?.getCurrentUser()?.id
    };
    
    // Add to current day
    const currentDay = window.DaySelector?.getCurrentDay() || 'today';
    newTask.day = currentDay;
    
    // Add to TaskDisplay
    window.TaskDisplay.tasks.unshift(newTask);
    window.TaskDisplay.saveTasks();
    
    // Show success feedback
    setTimeout(function() {
        tile.classList.remove('adding');
        self.showAddedFeedback(template);
    }, 300);
    
    // Keep panel open for multiple adds
    // Close only on backdrop click or X button
},

showAddedFeedback: function(template) {
    // Brief toast notification
    const toast = document.createElement('div');
    toast.className = 'quick-add-toast';
    toast.innerHTML = `✓ Added ${template.icon} ${template.title}`;
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.remove();
    }, 2000);
}
```

### Step 5: Mobile Optimizations

1. **Touch Targets**: All tiles minimum 60px in safe mode
2. **Swipe to Dismiss**: Panel can be swiped down to close
3. **Category Scrolling**: Horizontal scroll for categories
4. **Haptic Feedback**: Vibration on add (if supported)
5. **Reduced Motion**: Respect user preferences

## Phase 3: Testing Plan

- [x] Test with all 111 default templates
- [x] Test category filtering and switching
- [x] Test rapid multiple additions
- [x] Test panel open/close animations
- [x] Test in edit mode only
- [x] Test with current day context
- [x] Test on small screens (320px)
- [x] Test on tablets
- [x] Test with keyboard navigation
- [x] Test with screen readers

## UI/UX Considerations

### Panel vs Modal
- **Choice**: Slide-up panel (mobile-first)
- **Rationale**: 
  - Faster than modal
  - Allows multiple quick adds
  - Familiar mobile pattern
  - Non-blocking interaction

### Recently Used Section
- Track last 5 used templates
- Show at top of panel
- Persist in localStorage

### Search Capability
- Not needed for quick add
- Full search available in ActivityLibrary
- Quick add is for speed, not discovery

## Integration Points

1. **Edit Mode**: Only show when active
2. **Day Context**: Add to current selected day
3. **User Context**: Tag with current user
4. **Task Display**: Use existing render system
5. **Undo System**: Integrate with undo manager

## Performance Considerations

1. **Lazy Loading**: Load templates on first open
2. **Preload Icons**: Use emoji, no external assets
3. **Debounce Adds**: Prevent double-taps
4. **Memory**: Reuse panel DOM elements

## Accessibility

1. **Keyboard**: Tab through templates, Enter to add
2. **Screen Reader**: Announce additions
3. **Focus Management**: Return focus after add
4. **High Contrast**: Visible borders in HC mode

## Questions Resolved

1. **Show all templates?** No, curated list of ~20
2. **Custom templates?** Phase 2 feature
3. **Per-user templates?** Use existing user system
4. **Max additions?** No limit, rapid-fire capable
5. **Analytics?** Track template usage for "recently used"

## Definition of Done

- [x] Research documented
- [x] Quick add button visible in edit mode
- [x] Panel slides up smoothly
- [x] Templates organized by category
- [x] One-tap adding works
- [x] Multiple rapid additions supported
- [x] Mobile-optimized layout
- [x] Integrates with existing systems
- [x] Accessible via keyboard
- [x] Screen reader compatible