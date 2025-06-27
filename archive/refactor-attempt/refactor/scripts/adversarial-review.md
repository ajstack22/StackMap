# Adversarial Review Script for Claude Code

## Quick Usage

Copy and paste this entire block into Claude Code when you need an adversarial review:

```
Please perform an adversarial code review of the recent changes in /refactor.

Review the changes from these 5 critical perspectives:

1. **Security Auditor**: Find XSS vulnerabilities, injection risks, unsafe external link handling, localStorage tampering possibilities, and Capacitor-specific security issues.

2. **Accessibility Expert**: Check for WCAG violations, missing ARIA labels, keyboard navigation breaks, screen reader issues, color contrast problems, and touch target sizes under 44px.

3. **Performance Engineer**: Identify memory leaks (especially event listeners), inefficient algorithms, unnecessary re-renders, blocking operations, large bundle sizes, and slow transitions.

4. **Chaos Engineer**: Find edge cases like rapid clicking, offline/online transitions, storage quota exceeded, concurrent operations, race conditions, platform-specific crashes, and TV remote navigation bugs.

5. **ADHD User Advocate**: Evaluate for consistency breaks, unpredictable behaviors, confusing transitions, loss of context, disrupted routines, and cognitive overload.

For each issue found, specify:
- Severity: CRITICAL (app breaks), HIGH (bad UX), MEDIUM (edge case), LOW (optimization)
- Affected platforms: Web/PWA/iOS/Android/TV
- Reproduction steps
- Suggested fix

Focus especially on:
- State management bugs
- Platform detection failures  
- Offline functionality breaks
- Navigation history issues
- CSS specificity conflicts
- Error handling gaps

After review, provide a summary table of all findings sorted by severity.
```

## Extended Review Template (for major features)

```
I've just implemented [FEATURE DESCRIPTION] in the /refactor directory.

Modified files:
- [LIST FILES]

Please conduct a thorough adversarial review examining:

### Security Review
- XSS attack vectors
- CSRF vulnerabilities  
- Insecure external communications
- Client-side validation bypasses
- Sensitive data exposure
- Capacitor bridge exploits

### Accessibility Review
- Keyboard navigation flow
- Screen reader announcements
- Focus management
- Color contrast ratios
- Touch target sizing
- Motion/animation safety

### Performance Review  
- Time to interactive
- Memory usage patterns
- Event listener cleanup
- Bundle size impact
- Render performance
- Network request optimization

### Reliability Review
- Offline scenarios
- Slow network handling
- Storage quota limits
- Concurrent user actions
- Platform-specific bugs
- Browser compatibility

### User Experience Review (ADHD focus)
- Consistency with existing patterns
- Predictability of actions
- Clear feedback mechanisms
- Distraction potential
- Cognitive load
- Error recovery paths

For critical issues, provide:
1. Detailed reproduction steps
2. Root cause analysis
3. Specific code fix
4. Test to prevent regression

Rate the overall implementation:
- 🔴 Blocked: Critical issues must be fixed
- 🟡 Conditional: High priority issues need resolution  
- 🟢 Approved: Only minor issues, can proceed
```

## Review Severity Guidelines

### CRITICAL (Must fix immediately)
- App crashes or won't load
- Data loss scenarios
- Security vulnerabilities
- Complete feature breakage
- Accessibility barriers

### HIGH (Fix before commit)
- Degraded user experience
- Platform-specific failures
- Performance regressions
- Partial feature breakage
- WCAG AA violations

### MEDIUM (Document and plan)
- Edge case bugs
- Minor performance issues
- Enhancement opportunities
- Non-critical warnings
- Style inconsistencies

### LOW (Track for later)
- Code style preferences
- Micro-optimizations
- Future-proofing suggestions
- Nice-to-have features
- Documentation gaps

## Example Review Response

```
## Adversarial Review Results

### Summary Table
| Severity | Issue | Platforms | Category |
|----------|-------|-----------|----------|
| CRITICAL | View transition loses form data | All | State Management |
| HIGH | No keyboard navigation on TV | TV | Accessibility |
| HIGH | Memory leak in event listeners | All | Performance |
| MEDIUM | Offline indicator not visible | Mobile | UX |
| LOW | Could use CSS custom property | All | Code Style |

### Critical Issues

#### 1. View transition loses form data
**Severity**: CRITICAL
**Platforms**: All
**Description**: When switching views, any unsaved form data is lost without warning
**Reproduction**:
1. Start typing in settings form
2. Click back button
3. Return to settings - data is gone

**Root Cause**: No state preservation in ViewController
**Fix**:
```javascript
// Add to ViewController
preserveFormState: function(viewId) {
  const forms = document.querySelectorAll(`#${viewId} form`);
  forms.forEach(form => {
    const formData = new FormData(form);
    this.savedState[viewId] = Object.fromEntries(formData);
  });
}
```

[Additional issues detailed...]
```

## Integration with Development Workflow

1. **Pre-commit**: Run adversarial review on all changes
2. **Feature complete**: Extended review for new features
3. **Before merge**: Final adversarial review
4. **Post-deployment**: Review any user-reported issues

Remember: The goal is to catch issues BEFORE they affect users with ADHD and executive function challenges who depend on StackMap's reliability.