# Round 4 Coordination Notes

## Overview
Round 4 implements the missing Edit Mode functionality that currently exists as placeholders in the Edit Mode Menu.

## Stories
- **Dev1 Story #90**: Pin/Keep Activities  
- **Dev2 Story #91**: Complete Day Workflow
- **Dev3 Story #92**: Bulk Delete & Copy to Tomorrow

## File Conflict Coordination

### Shared Files Requiring Coordination

1. **`js/edit-mode-menu.js`** - ALL THREE DEVELOPERS
   - This file needs modification by all developers to connect their features
   - **Coordination Strategy**:
     ```javascript
     // Dev1: Add around line 85 (pin activities handler)
     'pin-activities': () => {
       // Dev1 implements
     }
     
     // Dev2: Add around line 90 (complete day handler)  
     'complete-day': () => {
       // Dev2 implements
     }
     
     // Dev3: Add around line 95-100 (bulk operations)
     'bulk-delete': () => {
       // Dev3 implements
     }
     'copy-tomorrow': () => {
       // Dev3 implements
     }
     ```

2. **`js/activity-display.js`** - Dev1 and Dev2
   - Dev1: Adds pin button rendering
   - Dev2: Adds refresh method after complete day
   - **No conflict expected** - different parts of the file

3. **`index.html`** - ALL THREE DEVELOPERS  
   - Each developer adds their script/style includes
   - **Add in separate sections with comments**:
     ```html
     <!-- Round 4 Dev1: Pin Activities -->
     <link rel="stylesheet" href="css/activity-pin.css">
     <script src="js/activity-pin.js"></script>
     
     <!-- Round 4 Dev2: Complete Day -->
     <link rel="stylesheet" href="css/complete-day.css">
     <script src="js/complete-day.js"></script>
     
     <!-- Round 4 Dev3: Bulk Operations -->
     <link rel="stylesheet" href="css/bulk-operations.css">
     <script src="js/bulk-operations.js"></script>
     <script src="js/bulk-delete.js"></script>
     <script src="js/copy-tomorrow.js"></script>
     ```

## Dependencies Between Stories

1. **Story #91 (Complete Day) depends on Story #90 (Pin Activities)**
   - Complete Day needs to know which activities are pinned
   - Dev2 should wait for Dev1's pin field in the data model
   - Can develop UI in parallel, integrate pin logic later

2. **Story #92 (Bulk Operations) is independent**
   - Can be developed fully in parallel
   - No dependencies on other Round 4 work

## Recommended Development Order

1. **Day 1-2**: All developers create their implementation plans
2. **Day 3**: 
   - Dev1 implements pin data model first
   - Dev2 starts Complete Day UI (dialog, confirmation)
   - Dev3 starts bulk selection system
3. **Day 4-5**: 
   - Dev1 completes pin UI and bulk pin mode
   - Dev2 integrates with pin data for Complete Day logic
   - Dev3 completes bulk delete and copy features
4. **Day 6**: Integration and testing

## Communication Points

### Daily Sync Topics
- Dev1 should share pin data model structure early
- All devs coordinate on edit-mode-menu.js modifications
- Share any changes to activity data structure
- Report any blocking issues immediately

### Integration Testing
- Test pin + complete day workflow together
- Verify all edit menu actions work
- Check for any UI conflicts in edit mode
- Ensure database migrations compatible

## Risk Mitigation
- Create feature branches for each story
- Commit edit-mode-menu.js changes with clear comments
- Test integration points early
- Have fallback plan if conflicts arise