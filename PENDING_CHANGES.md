## Title: Fix Complete Day to always operate on today regardless of day view mode

### Bug Description:
When user navigated: Both Days → Tomorrow view → Complete Day, the Complete Day feature incorrectly operated on tomorrow's activities instead of today's activities.

**Root Cause:** DayManagementModal received `activities={activities}` which was derived from `currentDay`. When `currentDay='tomorrow'`, Complete Day received tomorrow's activities.

### The Fix:
**App.js** (lines 5469-5471):
```javascript
// Before:
activities={activities}  // Bug: uses currentDay, can be tomorrow
completedCount={activities.filter(a => a.completed).length}
totalCount={activities.length}

// After:
activities={users[currentUser]?.days?.today?.activities || []}
completedCount={(users[currentUser]?.days?.today?.activities || []).filter(a => a.completed).length}
totalCount={(users[currentUser]?.days?.today?.activities || []).length}
```

### Expected Behavior:
Complete Day is an end-of-day operation that should **ALWAYS** operate on today's activities, regardless of:
- Current day view mode (today/tomorrow/both days)
- Which user is being viewed
- Any other UI state

### Impact:
- ✅ Complete Day now consistently operates on today
- ✅ Works correctly when viewing tomorrow in Both Days mode
- ✅ Prevents accidental loss of tomorrow's activities
- ✅ Maintains correct activity flow (unpinned deleted, pinned kept & copied)

### Testing:
Will verify in qual:
1. Both Days mode → Tomorrow view → Complete Day shows today's activities
2. Normal today view → Complete Day still works correctly
3. Empty today + populated tomorrow → Complete Day handles correctly

### Deployment Date: [To be filled by deployment script]
