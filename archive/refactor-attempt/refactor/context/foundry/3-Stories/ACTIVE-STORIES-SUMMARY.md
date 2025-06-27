# Active Stories Summary

## Overview
These stories focus on bringing the refactor to feature parity with the legacy StackMap app, prioritizing core functionality that users depend on daily.

## Round 1 - Foundation Work
These stories can be developed in parallel with no file conflicts.

### Dev 1: Story #70 - Convert Tasks to Activities
**Priority**: CRITICAL - Blocks all UI work  
**Scope**: Rename "tasks" to "activities" throughout codebase  
**Key Work**: Database migration, storage keys, UI text, file renames  
**Time**: ~12 hours

### Dev 2: Story #71 - Today/Tomorrow Selector  
**Priority**: HIGH - Core navigation  
**Scope**: Add day selector UI with activity counts  
**Key Work**: Enhance today-tomorrow.js, create selector UI, integrate with activities  
**Time**: ~9 hours

### Dev 3: Story #79 - Activity Templates & Quick Add
**Priority**: HIGH - Major usability feature  
**Scope**: Fast way to add common activities from templates  
**Key Work**: Template UI, quick add flow, integrate with activity-library.js  
**Time**: ~10 hours

## Round 2 - Header Navigation System
These build on Round 1 and can be developed in parallel.

### Dev 1: Story #81 - Header User/Day Pill
**Priority**: HIGH - Primary context indicator  
**Scope**: Show user emoji + current day in header subtitle  
**Key Work**: Update subtitle to be clickable pill, connect to user/day events  
**Time**: ~6.5 hours

### Dev 2: Story #82 - Modal User/Day Selector
**Priority**: HIGH - Core navigation  
**Scope**: Modal that opens from pill click for switching users/days  
**Key Work**: Create modal UI, integrate with UserManager and TodayTomorrow  
**Time**: ~8.5 hours

### Dev 3: Story #83 - Edit Mode Menu
**Priority**: HIGH - Edit mode usability  
**Scope**: Centralized menu for all edit actions  
**Key Work**: Dropdown menu that appears in edit mode, connect to edit actions  
**Time**: ~8.5 hours

## Development Process

### For Each Story:
1. **Research Phase** (1.5-2 hours)
   - Study existing code
   - Understand integration points
   - Document findings

2. **Planning Phase** (1-2 hours)
   - Create detailed implementation plan
   - File-by-file change list
   - Submit to 4-PlanReview folder

3. **PM Review**
   - PM reviews plan
   - Clarifies requirements
   - Approves for development

4. **Implementation** (4-8 hours)
   - Follow approved plan exactly
   - Test incrementally
   - Handle edge cases

5. **Testing** (1-2 hours)
   - Verify all acceptance criteria
   - Test on mobile devices
   - Check for regressions

## Key Principles

1. **Research First**: Understand existing code before changing
2. **Plan Thoroughly**: Detailed plans prevent bugs and rework  
3. **No Assumptions**: Verify APIs exist before using
4. **Mobile First**: Design for constraints
5. **Incremental Progress**: Small, tested changes
6. **User Focus**: Maintain familiar UI patterns

## File Naming Convention
Stories: `r{round}_dev{developer}_story_{number}_{brief_description}.md`  
Plans: `r{round}_dev{developer}_story_{number}_plan.md`

## Success Metrics
- Zero regressions in existing functionality
- All acceptance criteria met
- Mobile-friendly implementation
- Code follows project patterns
- Comprehensive error handling

## Next Steps
1. Developers should start with research phase
2. Create plans in 4-PlanReview folder
3. Wait for PM approval before coding
4. Coordinate on shared integration points

Remember: We're modernizing the technology while preserving the user experience that families depend on.