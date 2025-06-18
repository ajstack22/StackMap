# GitHub Issue: Grid Layout Bug

## Title: Grid layout showing 2 columns instead of 3 on desktop

## Labels: `bug`, `css`, `layout`

## Description:

### Bug Summary
The main site was showing 2 columns on desktop screens (1200px-1400px) instead of the expected 3 columns, while the demo site displayed correctly.

### Steps to Reproduce
1. Visit stackmap.app on a desktop browser
2. Set browser width between 1200px-1400px
3. Observe only 2 columns displayed instead of 3

### Expected Behavior
- 3 columns should display at 1200px+ width
- 2 columns at 600px-1200px
- 1 column below 600px

### Root Cause Analysis

**Commit that introduced the bug**: `ba8a4fe4` (Single-User-Mode Snapshot, June 4, 2025)

**What happened**:
1. `layout.css` had correct responsive breakpoints
2. `index.css` added duplicate `.main-container` rules that overrode them
3. CSS specificity and load order caused index.css rules to win

**Why demo worked**: Demo loads CSS files individually with layout.css AFTER index.css

### Fix Applied

**Commits**:
- `df7c7da`: Initial fix attempt
- `da2ac03`: Complete removal of conflicting rules  
- `e2a259e`: Cleanup of commented code
- `38237ad`: Service worker version bump

**Changes**:
- Removed 4 instances of `.main-container` rules from index.css
- Grid layout now controlled entirely by layout.css
- Service worker bumped to v1.6.1 for cache refresh

### Lessons Learned
1. Avoid duplicate CSS rules across files
2. Be careful with CSS load order and @import statements
3. Test in both development and production environments
4. The demo's different loading pattern can reveal CSS conflicts

### Prevention
- [ ] Add CSS linting to catch duplicate selectors
- [ ] Document which file controls which layout aspects
- [ ] Consider consolidating grid rules into a single file
- [ ] Add visual regression tests for layout breakpoints