# Claude Development Guide for StackMap Refactor

## Core Development Philosophy

### Be Extremely Thorough
- Always think 5 steps down the line before implementing
- Consider how each change affects Web, PWA, iOS, Android, and TV platforms
- Anticipate edge cases: offline scenarios, slow networks, older devices
- Document decisions and rationale in code comments

### Availability and Stability are Paramount
- The app MUST work reliably for users with ADHD/executive function challenges
- Consistency matters more than features - routine disruption is unacceptable
- Every change should enhance stability, never compromise it
- If something doesn't work, roll back immediately

## Claude Code Best Practices for This Project

### 1. Test-Driven Development (TDD) First

```javascript
// ALWAYS write tests first
// Example: Before implementing a new view controller method
describe('ViewController', () => {
  it('should transition between views without breaking state', () => {
    // Test implementation
  });
  
  it('should maintain navigation history on web platform', () => {
    // Test implementation
  });
  
  it('should handle rapid view switches without memory leaks', () => {
    // Test implementation
  });
});
```

### 2. Research-Plan-Implement Methodology

#### Phase 1: Research (No code changes)
```
1. Analyze existing patterns in /refactor
2. Check platform-specific requirements
3. Review accessibility guidelines
4. Verify offline functionality impact
```

#### Phase 2: Plan (Document approach)
```
1. Create detailed implementation plan
2. List verification steps
3. Identify rollback points
4. Document platform-specific considerations
```

#### Phase 3: Implement (With continuous verification)
```
1. Make incremental changes
2. Test on multiple platforms after each change
3. Verify no regressions
4. Commit only stable code
```

### 3. Platform-Specific Testing Checklist

Before ANY commit, verify:
- [ ] Web browser (Chrome, Safari, Firefox)
- [ ] PWA installation and offline mode
- [ ] iOS Capacitor app (if available)
- [ ] Android Capacitor app (if available)
- [ ] TV navigation with arrow keys
- [ ] Accessibility (screen reader, keyboard navigation)

### 4. Cost-Effective Development Patterns

#### Batch Related Changes
```javascript
// Good: Single context for related changes
// Update all view transitions at once
ViewController.show(), ViewController.hide(), ViewController.transition()

// Bad: Multiple contexts for related work
// Update show(), commit, update hide(), commit...
```

#### Clear Context When Switching Topics
```
/clear
"Now working on storage implementation..."
```

#### Use Specific, Structured Prompts
```xml
<task>
  <objective>Implement offline storage for tasks</objective>
  <constraints>
    - Must work on all platforms
    - Must handle quota exceeded gracefully
    - Must not lose data on app update
  </constraints>
  <verification>
    - Test with 1000+ tasks
    - Test quota limits
    - Test migration from old format
  </verification>
</task>
```

### 5. CLAUDE.md Integration

This file should be referenced for:
- Coding style guidelines
- Platform-specific patterns
- Testing requirements
- Build/deploy commands

Key sections to maintain:
```markdown
## Commands
- Test: `npm test`
- Lint: `npm run lint`
- Build Android: `npx cap sync && npx cap run android`
- Build iOS: `npx cap sync && npx cap run ios`

## Style Guidelines
- Mobile-first CSS
- Safe ES6 features only
- 44px minimum touch targets
- Platform detection before adaptation
```

### 6. Error Handling Philosophy

```javascript
// ALWAYS handle errors gracefully
try {
  // Attempt operation
} catch (error) {
  // 1. Log for debugging
  console.error('Storage save failed:', error);
  
  // 2. Fallback behavior
  this.handleStorageFailure(data);
  
  // 3. User notification (if critical)
  this.notifyUser('Changes saved locally only');
  
  // 4. Never break the app
  return false; // Indicate failure without crashing
}
```

### 7. Performance Considerations

For ADHD/special needs users:
- Instant feedback (< 100ms for user actions)
- No jarring transitions
- Predictable behavior
- Clear loading states
- Graceful degradation

```javascript
// Good: Immediate visual feedback
button.addEventListener('click', (e) => {
  e.target.classList.add('active'); // Instant
  performAction().then(() => {
    e.target.classList.remove('active');
  });
});
```

### 8. Documentation Requirements

Every significant function needs:
```javascript
/**
 * Switches between app views with platform-appropriate transitions
 * @param {string} viewId - Target view identifier
 * @param {Object} options - Transition options
 * @param {boolean} options.animate - Enable transition animation
 * @param {boolean} options.updateHistory - Update browser history
 * @returns {boolean} Success status
 * 
 * Platform behaviors:
 * - Web: Updates URL hash, supports back button
 * - Mobile: Stack-based navigation
 * - TV: Maintains focus state
 */
```

### 9. Common Pitfalls to Avoid

1. **Don't assume platform capabilities**
   ```javascript
   // Bad
   window.history.pushState(...) // Fails in some Capacitor contexts
   
   // Good
   if (Platform.supportsHistory()) {
     window.history.pushState(...)
   }
   ```

2. **Don't create new CSS files**
   - Use existing structure: base.css, mobile.css, tv.css
   - Add to existing files rather than creating new ones

3. **Don't use unsupported ES6 features**
   - No const/let - Use var (Android 5 crashes!)
   - No arrow functions - Use function() {}
   - No async/await - Use Promises
   - No classes - Use constructor functions
   - No for...of - Use traditional for loops
   - No optional chaining
   - No nullish coalescing

4. **Don't forget offline scenarios**
   - Every network request needs offline handling
   - Cache critical data locally
   - Show appropriate offline states

### 10. Adversarial Code Review Process

**CRITICAL**: Every significant change must undergo adversarial review before commit. This is not optional.

#### Step 1: Self-Review Checklist
Before requesting adversarial review, ensure:
- [ ] All tests pass
- [ ] Lint passes with no warnings
- [ ] Manual testing completed on all platforms
- [ ] No console errors or warnings
- [ ] Performance metrics acceptable (< 100ms response)

#### Step 2: Adversarial Review Request
Use this structured prompt for thorough review:

```xml
<adversarial-review>
  <context>
    <changes>Summary of changes made</changes>
    <files>List of modified files</files>
    <testing>Testing performed</testing>
  </context>
  
  <review-personas>
    <security-auditor>
      Find security vulnerabilities, XSS risks, injection points
    </security-auditor>
    
    <accessibility-expert>
      Check WCAG compliance, screen reader support, keyboard navigation
    </accessibility-expert>
    
    <performance-engineer>
      Identify bottlenecks, memory leaks, inefficient algorithms
    </performance-engineer>
    
    <chaos-engineer>
      Find edge cases: offline, quota exceeded, rapid clicks, race conditions
    </chaos-engineer>
    
    <user-advocate>
      Evaluate from ADHD/special needs perspective: consistency, predictability
    </user-advocate>
  </review-personas>
  
  <specific-concerns>
    - Platform-specific bugs (iOS, Android, TV)
    - Offline functionality breaks
    - State management issues
    - Memory leaks from event listeners
    - CSS specificity conflicts
  </specific-concerns>
</adversarial-review>
```

#### Step 3: Review Response Handling

For each issue found:
1. **Assess severity**: Critical (breaks app), High (degrades experience), Medium (edge case), Low (optimization)
2. **Fix or document**: Critical/High must be fixed, Medium/Low can be documented for later
3. **Re-test**: After fixes, run through platform tests again
4. **Re-review**: If Critical/High issues found, request another adversarial review

#### Example Adversarial Review Session

```javascript
// Original code
ViewController.show = function(viewId) {
  document.getElementById(viewId).classList.remove('hidden');
  this.currentView = viewId;
};

// Adversarial Review Findings:
// 1. [CRITICAL] No null check - crashes if viewId doesn't exist
// 2. [HIGH] Previous view not hidden - multiple views visible
// 3. [HIGH] No platform-specific handling
// 4. [MEDIUM] No transition animation consideration
// 5. [MEDIUM] History state not managed

// Fixed code after review
ViewController.show = function(viewId, options) {
  options = options || {};
  
  // Fix 1: Null check
  const newView = document.getElementById(viewId);
  if (!newView) {
    console.error('View not found:', viewId);
    return false;
  }
  
  // Fix 2: Hide previous view
  if (this.currentView) {
    const oldView = document.getElementById(this.currentView);
    if (oldView) oldView.classList.add('hidden');
  }
  
  // Show new view
  newView.classList.remove('hidden');
  
  // Fix 3: Platform handling
  if (Platform.isWeb() && options.updateHistory !== false) {
    // Fix 5: Manage history
    history.pushState({view: viewId}, '', '#' + viewId);
  }
  
  this.currentView = viewId;
  return true;
};
```

### 11. Verification Commands

Run these before AND after adversarial review:
```bash
# Local testing
npm test
npm run lint

# Platform testing
npx cap sync
npx cap run android
npx cap run ios

# Manual verification
- Open /refactor/index.html in browser
- Test all navigation paths
- Verify offline functionality
- Check TV navigation
```

## Remember

> "Be extremely thorough, always think 5 steps down the line. The availability and stability of our app are paramount. Pay great attention to the changes you make. Have a defendable reason for why you chose to try the things you are trying. If you change something and it does not work, change it back immediately."

This is not just development - it's building a critical tool for users who depend on consistency and reliability. Every decision should prioritize their needs over technical elegance or feature complexity.