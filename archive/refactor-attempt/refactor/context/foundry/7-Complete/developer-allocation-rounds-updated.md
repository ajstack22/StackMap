# Developer Allocation - Updated Rounds

## Round 1 (Current - In Progress)
**Theme: Core Activity System Foundation**

### Developer 1: Convert Tasks to Activities (#70)
- Files: task-sqlite.js, task-cards.js, task-display.js
- No conflicts with other developers

### Developer 2: Add Today/Tomorrow Selector (#71)
- Files: today-tomorrow.js (existing), header components
- No conflicts with other developers

### Developer 3: Activity Templates Quick Add (#79)
- Files: activity-library.js, default-activities.js, quick-add-ui.js (new)
- No conflicts with other developers

---

## Round 2 (Next)
**Theme: Header Navigation & Menu System**

### Developer 1: Unified Header Navigation (#81)
- Files: app.js (header section), header-navigation.js (new), css/header.css (new)
- Creates foundation for menu system

### Developer 2: Left Menu - Activities (#82)
- Files: menu-left.js (new), css/menu-left.css (new)
- Depends on #81 being started but can develop in parallel

### Developer 3: Right Menu - Settings (#83)
- Files: menu-right.js (new), css/menu-right.css (new)
- Depends on #81 being started but can develop in parallel

---

## Round 3
**Theme: Interactive Elements & Polish**

### Developer 1: Combined User/Day Switcher (#84)
- Files: user-day-switcher.js (new), css/switcher-modal.css (new)
- Integrates with header from #81

### Developer 2: Menu Sliding System (#85)
- Files: slide-menu.js (new), css/slide-menu.css (new)
- Foundation for #82 and #83 animations

### Developer 3: Activity Card Completion System (#72)
- Files: activity-completion.js (new), celebration.js integration
- No conflicts with menu work

---

## Round 4
**Theme: Core Workflows**

### Developer 1: Pin/Keep Activities System (#73)
- Files: pin-activities.js (new), storage updates
- No conflicts

### Developer 2: Complete Day Workflow (#74)
- Files: complete-day.js (new), rollover-manager.js updates
- No conflicts

### Developer 3: Visual Card Library (#75)
- Files: visual-card-library.js (new), card-browser-ui.js (new)
- No conflicts

---

## Round 5
**Theme: Final Features**

### Developer 1: Card Categories & Organization (#76)
- Files: card-categories.js (new), category filters
- No conflicts

### Developer 2: Grownup Mode Integration (#77)
- Files: grownup-mode.js updates, menu integrations
- Light touch on existing files

### Developer 3: Activity Progress Tracking (#78)
- Files: progress-tracker.js (new), analytics integration
- No conflicts

---

## Round 6
**Theme: Onboarding & Polish**

### Developer 1: Onboarding Flow Update (#80)
- Files: onboarding.js updates, welcome screens
- Can work independently

### Developer 2: Performance optimizations
- Review and optimize all new components
- No file conflicts

### Developer 3: Accessibility audit
- Add ARIA labels, keyboard navigation fixes
- Light touches across multiple files

---

## Key Benefits of This Organization:

1. **Round 2 Focus**: Entire round dedicated to navigation system
   - All three developers working on related but non-conflicting parts
   - Creates cohesive header/menu system in one sprint

2. **No File Conflicts**: Each developer has their own files
   - New files created where possible
   - Existing file modifications isolated

3. **Logical Dependencies**: 
   - Header (#81) provides foundation for menus
   - Sliding system (#85) can be built alongside menus
   - User/day switcher (#84) integrates after header complete

4. **Parallel Development**: All developers can work simultaneously
   - Clear boundaries between work
   - Minimal coordination needed

5. **Testing Friendly**: Each round produces testable features
   - Round 2: Complete navigation system
   - Round 3: Interactive elements
   - Round 4: Core workflows