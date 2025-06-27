# Round 8 Dev 2 - Story #116: Activity Types & Categories

## Story Overview
**Priority**: CRITICAL - Missing activity organization  
**Developer**: Dev 2  
**Estimated Effort**: 3 days  
**Dependencies**: Activity system exists, needs categorization  

## Problem Statement
Activities are currently all treated the same, but users need different types for different purposes. Recurring habits, reusable templates, and one-time tasks require different behaviors and visual treatment. This categorization is essential for proper activity management.

## Acceptance Criteria

### ✅ **Activity Type System**
- [ ] **Recurring**: Daily/weekly patterns (habits, routines)
- [ ] **Template**: Reusable activity templates
- [ ] **Single-use**: One-time tasks and events
- [ ] **Project**: Multi-part ongoing work
- [ ] Type selection during activity creation

### ✅ **Visual Differentiation**
- [ ] Distinct icons for each activity type
- [ ] Color coding system for types
- [ ] Type indicators on activity cards
- [ ] Consistent visual language
- [ ] ADHD-friendly visual categorization

### ✅ **Type-Specific Behaviors**
- [ ] **Recurring**: Auto-regenerate after completion
- [ ] **Template**: Can be instantiated multiple times
- [ ] **Single-use**: Normal completion behavior
- [ ] **Project**: Can contain sub-activities
- [ ] Type-appropriate editing controls

### ✅ **Creation & Management**
- [ ] Type selection in add activity flow
- [ ] Ability to change activity type
- [ ] Type-specific creation shortcuts
- [ ] Bulk type assignment
- [ ] Template creation from existing activities

### ✅ **Integration Features**
- [ ] Filter activities by type
- [ ] Type-based activity counts
- [ ] Type-specific quick actions
- [ ] Export templates for sharing
- [ ] Category-based library organization

## Technical Implementation

### **New Components**
- `js/activity-types.js` - Core type system
- `js/template-system.js` - Template management
- `css/activity-types.css` - Type visual styling

### **Enhanced Components**
- `js/activity-creation.js` - Type selection UI
- `js/activity-cards.js` - Type indicators
- `js/activity-display.js` - Type filtering
- `js/quick-add-ui.js` - Type shortcuts

### **Database Schema**
```javascript
// Enhanced activity schema
{
  id: 'string',
  type: 'recurring|template|single-use|project',
  category: 'work|personal|health|etc',
  templateId: 'string', // if created from template
  recurringPattern: 'daily|weekly|custom',
  // ... existing fields
}
```

## Success Metrics
- [ ] Users can assign types to activities
- [ ] Type indicators are clear and helpful
- [ ] Type-specific behaviors work correctly
- [ ] Templates can be created and reused
- [ ] Filtering by type improves organization

## Definition of Done
- [ ] All activity types implemented
- [ ] Visual differentiation complete
- [ ] Type-specific behaviors working
- [ ] Template system functional
- [ ] Integration with existing features seamless

---

**Story #116 provides essential activity organization that makes StackMap scalable for different use cases and user needs.**