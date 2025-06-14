# StackMap Development Prompt Template

## Story/Bug: [TITLE HERE]

### Context
I'm working on StackMap, a visual routine management app for special needs children. This is a **vanilla JavaScript only** project with **zero dependencies** and **special needs accessibility as the top priority**.

### Task Description
The mechanism for changing the user icon is not working, it will not even change in the picker.

### Critical Constraints (MUST FOLLOW)
1. **NO ES6 imports** - Use script tags and window globals only
2. **NO frameworks** - Pure vanilla JavaScript only  
3. **NO new files** - Work within existing 30-file structure
4. **NO new CSS files** - Use existing modular CSS system only
5. **Special needs first** - 44px min touch targets, high contrast, predictable behavior

### Before Starting
Please follow this checklist:
- [ ] Review constraints.md for development rules
- [ ] Check component-inventory.md for existing functionality (don't recreate)
- [ ] Review css-module-map.md for where to add styles
- [ ] Check z-index-map.md if working with layering
- [ ] Review architecture.md for file dependencies

### Files I Need
Based on the task, please retrieve these files:
- [ ] Core files needed: [List specific files from component-inventory.md]
- [ ] CSS modules needed: [List specific CSS files from css-module-map.md]
- [ ] Related components: [List from components.js if needed]

### Implementation Requirements

#### Accessibility Requirements
- [ ] All touch targets ≥44px (motor accessibility)
- [ ] High contrast colors maintained
- [ ] ARIA labels for screen readers
- [ ] Predictable, consistent behavior
- [ ] No hover-only interactions

#### Code Patterns to Follow
- [ ] Use ComponentBuilder for DOM creation
- [ ] Follow existing event handling patterns (onclick attributes)
- [ ] Use window globals (no imports)
- [ ] Extend existing components, don't create new ones
- [ ] Add to existing CSS modules only

#### Testing Requirements
- [ ] Run `runAllTests()` before starting (establish baseline)
- [ ] Run relevant quick tests during development
- [ ] Achieve 100% test pass rate before completion
- [ ] Test on mobile for touch targets
- [ ] Verify no accessibility regressions

### Specific Implementation Details
[Add story-specific requirements here]

#### For UI Changes:
- [ ] Check which CSS module handles this element
- [ ] Use existing CSS variables for theming
- [ ] Follow BEM naming conventions
- [ ] Maintain responsive breakpoints (768px, 480px)

#### For Component Changes:
- [ ] Work within components.js only
- [ ] Follow existing component patterns
- [ ] Maintain special needs focus
- [ ] Preserve existing public APIs

#### For State Changes:
- [ ] Work through AppState (state.js)
- [ ] Maintain data persistence
- [ ] Follow existing state structure
- [ ] Test data integrity

### Success Criteria
- [ ] Feature/fix works as specified
- [ ] All existing tests pass (100% rate)
- [ ] Touch targets validated (≥44px)
- [ ] Works offline (core functionality)
- [ ] Mobile-first responsive design maintained
- [ ] No new files created
- [ ] No ES6 imports used
- [ ] No frameworks added

### Testing Protocol
```javascript
// Before starting:
runAllTests() // Must pass 100%

// During development:
quickTest("[relevant story]") // As needed
testAccessibility() // After UI changes

// Before completion:
runAllTests() // Must pass 100%
// Manual mobile testing for touch targets
```

### Notes
- Remember: This app serves special needs families who depend on reliability
- When in doubt, choose the simpler, more accessible solution
- If a constraint seems limiting, ask for vanilla JS alternatives
- Test with the mindset of a parent helping their special needs child

### Questions to Answer Before Implementation
1. How does this change help special needs children?
2. Will this work reliably offline?
3. Can parents understand and maintain this?
4. Does this follow all existing patterns?

---

**Please confirm you understand these requirements before proceeding with implementation.**