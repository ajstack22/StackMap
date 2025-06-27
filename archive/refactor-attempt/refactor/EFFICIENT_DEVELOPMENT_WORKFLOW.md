# Efficient Development Workflow for StackMap Refactor

## Overview
This workflow combines Claude Code best practices with adversarial review to maximize efficiency while ensuring quality for our ADHD/special needs users.

## Quick Start Checklist

```bash
cd refactor
code .  # Open in VS Code with Claude extension
```

1. **Read context files** (5 min):
   - `CLAUDE.md` - Auto-loaded reference
   - `CONTEXT_RULES.md` - What to do/avoid
   - `docs/architecture.md` - Technical decisions

2. **Use slash commands**:
   - `/review` - Adversarial code review
   - `/test-all` - Run all tests
   - `/check-platforms` - Platform verification

## Development Workflow

### 1. Research Phase (No code changes)
```
"I need to understand how [FEATURE] should work in our mobile-first architecture. Please analyze:
- Current patterns in /refactor
- Platform-specific considerations
- Accessibility requirements
- Special needs user impact"
```

### 2. Plan Phase (Document approach)
```
"Based on the research, create an implementation plan for [FEATURE] that includes:
- Step-by-step approach
- Platform-specific adaptations
- Test cases to write first
- Potential edge cases"
```

### 3. TDD Implementation Phase
```
"Let's implement [FEATURE] using TDD:
1. Write failing tests for expected behavior
2. Implement minimal code to pass tests
3. Refactor for clarity and performance
4. Ensure all platforms supported"
```

### 4. Adversarial Review Phase
```
/review
```
Or manually:
```
"Please perform an adversarial review focusing on [SPECIFIC CONCERNS]"
```

### 5. Fix and Verify Phase
Address all CRITICAL and HIGH issues:
```
"Fix the issues found in the adversarial review, starting with CRITICAL issues"
```

Then verify:
```
/test-all
/check-platforms
```

## Cost-Saving Strategies

### 1. Batch Related Work
```
"Let's work on the entire navigation system:
- View controller improvements
- History management
- Focus handling
- TV navigation"
```

### 2. Clear Context Between Features
```
/clear
"Now moving to storage implementation..."
```

### 3. Use Specific Prompts
```xml
<task>
  <feature>Offline task storage</feature>
  <requirements>
    - Store up to 1000 tasks
    - Handle quota gracefully
    - Sync when online
  </requirements>
  <constraints>
    - Must work on all platforms
    - No data loss on update
    - Sub-100ms read time
  </constraints>
</task>
```

## Common Workflows

### Adding a New View
1. Update `index.html` with new view div
2. Add navigation in `app.js`
3. Style in `base.css`
4. Test TV navigation
5. Run `/review`

### Implementing Storage Feature
1. Write storage tests first
2. Implement with quota handling
3. Add offline indicators
4. Test on all platforms
5. Run `/review` with chaos engineering focus

### Fixing Cross-Platform Bug
1. Reproduce on affected platform
2. Add test that catches the bug
3. Fix with platform detection
4. Verify fix doesn't break others
5. Run `/check-platforms`

## Quality Gates

### Before Starting Feature
- [ ] Read relevant architecture docs
- [ ] Check existing patterns
- [ ] Plan platform adaptations

### Before Committing
- [ ] All tests pass
- [ ] Lint clean
- [ ] Manual platform tests
- [ ] Adversarial review complete
- [ ] CRITICAL/HIGH issues fixed

### Before Merging
- [ ] Final `/review`
- [ ] Documentation updated
- [ ] CLAUDE.md updated if needed
- [ ] Tested on real devices

## Red Flags to Avoid

1. **"Let me just quickly..."** - Always plan first
2. **"Works on my machine"** - Test all platforms
3. **"We'll fix that later"** - Fix CRITICAL/HIGH now
4. **"Users won't do that"** - They will (chaos engineering)
5. **"Close enough"** - Not for special needs users

## Success Metrics

- **Zero crashes** across all platforms
- **Sub-100ms** user interaction response
- **100% offline capable**
- **Zero accessibility barriers**
- **Consistent behavior** everywhere

## Remember

Every line of code affects users who depend on StackMap for daily functioning. We build with:

1. **Extreme reliability** - It must work
2. **Predictable behavior** - No surprises
3. **Defensive coding** - Expect the unexpected
4. **Accessibility first** - Not an afterthought
5. **Performance matters** - Slow = unusable

Use the tools and processes we've built. They're designed to catch issues before they impact users while keeping development efficient and costs manageable.