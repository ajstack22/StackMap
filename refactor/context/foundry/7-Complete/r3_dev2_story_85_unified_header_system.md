# Story #85: Unified Header System with Day Integration

## Story Overview
**Round**: 3  
**Developer**: 2  
**Priority**: High - Core navigation enhancement

## Background
Story #71 implemented a day selector, and Story #81 planned a header pill. We need to create a unified header system that integrates both the day selector and user information in a cohesive way. Instead of duplicating day selection in multiple places, we should enhance the existing implementation.

## User Story
As a user, I want a clear header that shows my current context (user and day) and allows me to easily switch between users while the existing day selector handles day switching.

## Acceptance Criteria
- [ ] Header shows current user emoji and name
- [ ] Header shows current day context
- [ ] Clicking user area opens user switcher
- [ ] Day selector remains separate (already implemented)
- [ ] Header updates when user changes
- [ ] Header updates when day changes
- [ ] Mobile-optimized layout
- [ ] Integrates with existing day-selector.js

## Research Requirements
Before creating your plan, research:

1. **Existing Components**:
   - Study `js/unified-header.js` 
   - Study `js/day-selector.js` implementation
   - Check current header structure in index.html
   - Review UserManager API

2. **Current Header State**:
   - What's already in the header?
   - How is the day selector positioned?
   - Available space for user info

3. **Integration Points**:
   - How day-selector.js works
   - UserManager events
   - Current event system

4. **Visual Design**:
   - Header layout on mobile
   - Touch target requirements
   - Accessibility needs

## Implementation Approach

### Enhance Existing Header
Instead of creating a new pill system, enhance the unified header to:
1. Show user context clearly
2. Make user area clickable for switching
3. Keep day selector as separate component (already works well)

### User Switcher Modal
Create a simple modal for user switching that:
1. Shows all available users
2. Highlights current user
3. One-click to switch and close
4. Mobile-friendly grid layout

## Key Differences from Original R2 Story
- Don't duplicate day selection (already in day-selector.js)
- Focus on user switching only
- Integrate with existing components rather than replacing
- Simpler implementation that leverages R1 work

## Definition of Done
- [ ] Header shows current user clearly
- [ ] User switcher modal implemented
- [ ] Click user area to open switcher
- [ ] Seamless integration with day selector
- [ ] All events properly connected
- [ ] Mobile responsive
- [ ] No regressions

## Time Estimate
- Research: 1.5 hours
- Implementation: 4 hours
- Testing: 1.5 hours

---
Note: This story adapts the original R2 Story #81/#82 concepts to work with the already-implemented day selector from R1.