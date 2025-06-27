# Story #79: Activity Templates & Quick Add System

## Story Overview
**Round**: 1  
**Developer**: 3  
**Priority**: High - Major usability feature

## Background
Parents need a fast way to add common activities without typing everything each time. The legacy app has default activities that can be quickly added. We need a template system that makes adding routine activities fast and easy.

## User Story
As a parent setting up my child's day, I want to quickly add common activities from templates so that I don't have to type "Brush Teeth" every single day.

## Acceptance Criteria
- [ ] Template library with common activities
- [ ] Quick add button/interface in edit mode
- [ ] One-tap to add template activity
- [ ] Templates include emoji, title, description
- [ ] Can add multiple activities quickly
- [ ] Integrates with existing activity system

## Research Requirements
Before creating your plan, research:

1. **Default Activities**:
   - Study `js/default-activities.js` 
   - List all existing templates
   - Understand the data structure

2. **Activity Library**:
   - Check `js/activity-library.js`
   - How are activities categorized?
   - Personal vs shared templates?

3. **Current Add Flow**:
   - How do users currently add activities?
   - Where is the add button?
   - What's the current form like?

4. **Edit Mode Integration**:
   - How does edit-mode.js work?
   - Where should quick add appear?
   - Mobile considerations?

## Implementation Plan Template
Create your plan in: `/refactor/context/foundry/4-PlanReview/r1_dev3_story_79_plan.md`

```markdown
# Implementation Plan: Activity Templates & Quick Add

## Phase 1: Research Findings
### Default Activities Analysis
- Total templates found: [number]
- Categories: [list them]
- Data structure:
```javascript
{
  emoji: "🦷",
  title: "Brush Teeth", 
  description: "Brush teeth",
  category: "morning",
  cardType: "recurring"
}
```

### Current Add Flow
- Location: [where is add button]
- Steps: [current flow]
- Pain points: [what's slow]

### Library Structure
- Personal templates: [how stored]
- Shared templates: [how stored]
- Categories: [how organized]

## Phase 2: Implementation Order

### Step 1: Create Quick Add UI Component
**File**: js/quick-add-ui.js (NEW)
```javascript
class QuickAddUI {
  constructor() {
    this.templates = [];
    this.categories = ['morning', 'school', 'evening', 'anytime'];
  }
  
  show() {
    // Create modal or panel
    // Show categorized templates
  }
  
  renderTemplates() {
    // Grid of template cards
  }
  
  addActivity(template) {
    // One-tap add
  }
}
```

### Step 2: Enhance Activity Library
**File**: js/activity-library.js
```diff
+ getQuickAddTemplates() {
+   // Return categorized templates
+ }
+ 
+ addFromTemplate(template) {
+   // Quick creation
+ }
```

### Step 3: Add Quick Add Button
**File**: js/edit-mode.js
```diff
// Add quick add button to edit UI
+ const quickAddBtn = document.createElement('button');
+ quickAddBtn.innerHTML = '⚡ Quick Add';
```

### Step 4: Create Template Grid
**File**: css/quick-add.css (NEW)
```css
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.template-card {
  /* Tappable cards */
}
```

### Step 5: Wire Everything Together
- Connect button to UI
- Handle template selection
- Add to current day
- Show confirmation

## Phase 3: Testing Plan
- [ ] Test with all default templates
- [ ] Test category filtering
- [ ] Test rapid additions
- [ ] Mobile layout testing
- [ ] Edit mode integration

## UI/UX Considerations
- Modal vs slide-out panel?
- Search/filter options?
- Recently used section?
- Custom template creation?
```

## Visual Design Reference
```
┌──────────────────────────┐
│ ⚡ Quick Add Activities   │
├──────────────────────────┤
│ Morning Routine          │
│ ┌────┐ ┌────┐ ┌────┐   │
│ │ 🦷  │ │ 🚿  │ │ 🥣  │   │
│ │Brush│ │Shower│ │Eat  │   │
│ └────┘ └────┘ └────┘   │
│                          │
│ School                   │
│ ┌────┐ ┌────┐ ┌────┐   │
│ │ 📚  │ │ ✏️  │ │ 🎒  │   │
│ └────┘ └────┘ └────┘   │
└──────────────────────────┘
```

## Code Patterns to Follow
```javascript
// Template structure
const template = {
  emoji: "🦷",
  title: "Brush Teeth",
  description: "Brush your teeth for 2 minutes",
  category: "morning",
  cardType: "recurring",
  isDefault: true
};

// Quick add flow
quickAdd.on('template-selected', async (template) => {
  const activity = await ActivityLibrary.createFromTemplate(template);
  await ActivityManager.add(activity);
  UI.showConfirmation(`Added: ${template.emoji} ${template.title}`);
});
```

## Integration Requirements
1. Must work in edit mode only
2. Must respect current day context
3. Must update activity count
4. Must trigger UI refresh
5. Must work with custom activities

## Common Pitfalls to Avoid
- Don't hardcode templates - load from data
- Consider loading time with many templates  
- Ensure templates are appropriate for user
- Handle duplicate additions gracefully
- Test with very long template names

## Definition of Done
- [ ] Research documented
- [ ] Detailed plan in 4-PlanReview
- [ ] PM approval received
- [ ] Quick add button visible in edit mode
- [ ] Template grid displays correctly
- [ ] One-tap adding works
- [ ] Categories function properly
- [ ] Mobile-optimized
- [ ] Tests pass

## Time Estimate
- Research: 1.5 hours
- Plan Creation: 1.5 hours
- Implementation: 5-6 hours
- Testing: 2 hours

## Questions for PM Before Starting
1. Should we show all templates or paginate?
2. Can users create custom templates?
3. Should templates be per-user or shared?
4. Max number of activities to quick-add at once?
5. Should we track template usage analytics?

---
Note: This feature significantly improves the parent experience. Quick add can reduce setup time from minutes to seconds.