# Undo Command Fix

## Date: 2025-06-24

### UndoManager Command Constructor Error Fixed

## Issue: UndoManager.constructor.Command is not a constructor ✅

**Error Message**: 
```
Uncaught TypeIssue: UndoManager.constructor.Command is not a constructor
```

**Files Modified**:
1. `/refactor/js/undo-manager.js`
2. `/refactor/js/commands/task-commands.js`

**Root Cause**: 
The task-commands.js file was trying to access the Command class using `UndoManager.constructor.Command`, but `window.UndoManager` is an instance of the UndoManager class, not the class itself.

**Fix Applied**:

1. In `undo-manager.js`, exported the Command class separately:
```javascript
// Export as singleton instance
window.UndoManager = new UndoManager();
// Also export the Command class for creating commands
window.UndoCommand = UndoManager.Command;
```

2. In `task-commands.js`, updated all references from:
```javascript
return new UndoManager.constructor.Command({...})
```
To:
```javascript
return new window.UndoCommand({...})
```

This fix was applied to all 7 occurrences in the file.

## Testing

After this fix:
- The undo system should initialize without errors
- Task operations (add, edit, delete, complete) should be undoable
- The 30-second golden window for undo should work correctly

The app should now run without any Command constructor errors.