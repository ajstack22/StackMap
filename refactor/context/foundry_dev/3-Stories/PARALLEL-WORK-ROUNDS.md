# Parallel Work Rounds - No File Conflicts

## Round 1: Foundation (Can be done in parallel)
These three can be worked on simultaneously with zero file overlap:

### Slot A: Terminology Update
**Story #70: Convert Tasks to Activities**
- Files: task-*.js → activity-*.js (renaming)
- New files created, old ones renamed
- No conflicts with other work

### Slot B: Day Selector UI
**Story #71: Today/Tomorrow Selector**
- New file: `js/day-selector.js`
- Updates: `index.html` (add component)
- Updates: `css/base.css` (new styles)
- Isolated new component

### Slot C: Templates System  
**Story #79: Activity Templates**
- New file: `js/activity-templates.js`
- New file: `data/default-templates.js`
- Updates: `css/base.css` (template styles)
- Completely separate system

---

## Round 2: Core Features (After Round 1)
These three can be worked on simultaneously:

### Slot A: Card Numbering
**Story #72: Card Numbering**
- Updates: `js/activity-cards.js` (add numbers)
- Updates: `css/base.css` (number styles)
- Focused on display logic

### Slot B: Pin System
**Story #74: Pin/Keep Activities**
- Updates: `js/activity-sqlite.js` (add pinned field)
- Updates: `js/activity-display.js` (pin UI)
- Updates: `css/base.css` (pin styles)
- Database and UI changes

### Slot C: User Separation
**Story #76: Per-User Storage**
- Updates: `js/activity-sqlite.js` (user queries)
- Updates: `js/user-manager.js` (activity filtering)
- Backend focused

---

## Round 3: Advanced Features
These three can be worked on simultaneously:

### Slot A: Complete Day
**Story #73: Complete Day**
- New file: `js/complete-day.js`
- Updates: `js/activity-display.js` (add button)
- Depends on pinning from Round 2

### Slot B: Time Mode
**Story #75: Time Display Mode**
- Updates: `js/activity-display.js` (sort logic)
- Updates: `js/settings-manager.js` (mode pref)
- Display logic changes

### Slot C: Mobile Edit Mode
**Story #78: Mobile Edit Enhancement**
- New file: `js/edit-mode-mobile.js`
- Updates: `css/mobile.css` (mobile styles)
- Updates: `js/gesture-manager.js` (swipes)
- Mobile-specific enhancements

---

## Round 4: Final Integration
Single story that ties everything together:

**Story #77: Daily Reset System**
- Updates: `js/app.js` (reset check)
- Updates: `js/activity-sqlite.js` (reset logic)
- Touches many systems, best done last

---

## File Conflict Matrix

| Story | Key Files | Can Parallel With |
|-------|-----------|-------------------|
| #70 | Renames all task-*.js files | #71, #79 (Round 1) |
| #71 | NEW: day-selector.js | #70, #79 (Round 1) |
| #79 | NEW: activity-templates.js | #70, #71 (Round 1) |
| #72 | activity-cards.js | #74, #76 (Round 2) |
| #74 | activity-sqlite.js, activity-display.js | #72, #76 (Round 2) |
| #76 | activity-sqlite.js, user-manager.js | #72, #74 (Round 2) |
| #73 | NEW: complete-day.js | #75, #78 (Round 3) |
| #75 | activity-display.js, settings | #73, #78 (Round 3) |
| #78 | NEW: edit-mode-mobile.js | #73, #75 (Round 3) |
| #77 | app.js, activity-sqlite.js | None (Round 4) |

## Development Commands

### Round 1 (Start all three):
```bash
# Terminal 1
claude-code --task "Implement story #70"

# Terminal 2  
claude-code --task "Implement story #71"

# Terminal 3
claude-code --task "Implement story #79"
```

### Round 2 (After Round 1 completes):
```bash
# Terminal 1
claude-code --task "Implement story #72"

# Terminal 2
claude-code --task "Implement story #74"

# Terminal 3
claude-code --task "Implement story #76"
```

And so on...