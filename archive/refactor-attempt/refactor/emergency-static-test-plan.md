# Emergency Static HTML - Phase 1 Test Plan

## Test Coverage for emergency-static.html

### 1. Zero JavaScript Tests
- [ ] Disable JavaScript completely in browser
- [ ] Verify page renders correctly
- [ ] Verify button link works
- [ ] Verify all text is readable
- [ ] Verify styling applies correctly

### 2. Accessibility Tests
- [ ] Keyboard navigation (Tab to button)
- [ ] Autofocus lands on main button
- [ ] Screen reader announces content properly
- [ ] Focus indicators visible (3px outline)
- [ ] Color contrast meets WCAG AA (4.5:1)

### 3. Sensory Preference Tests
- [ ] Dark mode renders correctly
- [ ] High contrast mode works
- [ ] Reduced motion removes transitions
- [ ] Print view shows offline message

### 4. Device/Browser Tests
- [ ] Android 5.1 with Chrome 44
- [ ] iOS Safari (oldest supported)
- [ ] Desktop Chrome/Firefox/Safari
- [ ] TV browser (1920px viewport)
- [ ] Mobile viewport (320px)

### 5. Stress Scenario Tests
- [ ] 80px minimum touch target verified
- [ ] Text remains readable at 200% zoom
- [ ] Page loads under 1 second
- [ ] Works in private/incognito mode
- [ ] Works with ad blockers

### 6. Content Tests
- [ ] 8th grade reading level
- [ ] Positive, calming language
- [ ] No "ERROR" or "FAILED" text
- [ ] Clear next steps
- [ ] Contact info visible

### 7. Edge Case Tests
- [ ] Cookies disabled
- [ ] localStorage disabled
- [ ] Offline/airplane mode
- [ ] Very slow connection (2G)
- [ ] Browser extensions interference

## Test Results Template

**Device**: [Device name and OS version]
**Browser**: [Browser and version]
**Test Date**: [Date]

| Test | Pass/Fail | Notes |
|------|-----------|-------|
| Renders without JS | | |
| Button clickable | | |
| Autofocus works | | |
| Dark mode | | |
| Touch target size | | |
| Reading level | | |

**Screenshots**: [Attach screenshots]
**Issues Found**: [List any issues]
**Recommendations**: [Suggested fixes]