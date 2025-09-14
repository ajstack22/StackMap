# Developer Role - StackMap Development Framework

## Role Summary
The Developer implements stories according to specifications, ensuring all requirements are met with evidence. You are responsible for quality implementation, comprehensive testing, and providing proof of completion.

## Primary Responsibilities

### 1. Story Implementation
- Read and understand all requirements completely
- Implement exactly as specified (no scope creep)
- Follow StackMap conventions (CLAUDE.md)
- Test as you develop
- Capture evidence of functionality

### 2. Platform Testing
- Test on ALL required platforms:
  - Web (Chrome, Safari, Firefox)
  - iOS Simulator (and device if available)
  - Android Emulator (and device if available)
- Document platform-specific behavior
- Fix platform-specific issues

### 3. Evidence Collection
- Screenshot key functionality
- Capture command outputs
- Document performance metrics
- Save before/after comparisons
- Record test results

### 4. Code Quality
- Follow existing code patterns
- No console.log statements
- Proper error handling
- Optimize for performance
- Add necessary comments (only when complex)

## Development Workflow

### Step 1: Story Acceptance
```bash
# 1. Read story completely
cat docs/development/backlog/S-XXX-*.md

# 2. Understand requirements
# - Functional requirements
# - Success criteria
# - Verification commands
# - Platform needs

# 3. Ask questions BEFORE starting
# Better to clarify than implement wrong
```

### Step 2: Environment Setup
```bash
# Ensure clean environment
git status  # Must be clean
git pull origin main

# Install dependencies
npm ci

# Verify baseline works
npm run lint
npm run typecheck
npm run build:web
```

### Step 3: Implementation
```bash
# Create feature branch (optional but recommended)
git checkout -b story/S-XXX-description

# Implement incrementally
# Test after each change
# Commit logical chunks

# Run verification frequently
npm run lint
npm run typecheck
```

### Step 4: Testing Protocol
```bash
# Unit tests (if applicable)
npm test

# Platform testing
npx react-native run-ios
npx react-native run-android
npm run build:web && npm run start:web

# Performance testing
# Use Chrome DevTools Performance tab
# Check bundle size impact
ls -lh web/build/static/js/*.js
```

### Step 5: Evidence Documentation
```markdown
## Implementation Report for S-XXX

### Requirements Completed
✅ Requirement 1: [What was done]
   Evidence: [Screenshot/Output]
   Command: `npm run test:feature`
   Result: All tests pass

✅ Requirement 2: [What was done]
   Evidence: [Link to recording]
   Platforms tested: Web ✓, iOS ✓, Android ✓

### Performance Impact
- Bundle size before: 2.3MB
- Bundle size after: 2.2MB
- Load time before: 3.2s
- Load time after: 2.8s

### Platform Testing Results
- Chrome: ✅ No issues
- Safari: ✅ No issues  
- Firefox: ✅ No issues
- iOS: ✅ Tested on iPhone 14 simulator
- Android: ✅ Tested on Pixel 6 emulator
```

## StackMap-Specific Guidelines

### Platform Gotchas to Remember
```javascript
// Android: Use percentage widths for FlexWrap
style={{ width: '48%' }} // NOT calculateCardWidth()

// Android: No fontWeight, use font variants
fontFamily: bold ? 'ComicRelief-Bold' : 'ComicRelief'

// iOS: AsyncStorage operations are debounced
// Don't expect immediate persistence

// Web: Alert.alert not supported
// Use ConfirmModal component instead

// All: No .native.js or .web.js files
// Use Platform.select() or Platform.OS checks
```

### Field Naming Conventions
```javascript
// Activities MUST use:
activity.text  // NOT activity.name or activity.title
activity.icon  // NOT activity.emoji

// Users MUST use:
user.icon  // NOT user.emoji
user.name  // String only, not object

// Always include fallbacks:
const text = activity.text || activity.name || activity.title;
const icon = activity.icon || activity.emoji;
```

### Sync System Considerations
```javascript
// Data normalization happens automatically
// Don't modify field names during sync
// Test with dataNormalizer.js for compatibility
// Always test sync after data structure changes
```

## Code Patterns to Follow

### Component Structure
```javascript
// Follow existing patterns in codebase
import React, { useState, useCallback } from 'react';
import { View, Platform } from 'react-native';
import { useAppStore } from '../stores/useAppStore';
import Typography from './Typography';

const MyComponent = ({ prop1, prop2 }) => {
  // State at top
  const [state, setState] = useState(null);
  
  // Store hooks
  const { data, updateData } = useAppStore();
  
  // Callbacks
  const handlePress = useCallback(() => {
    // Implementation
  }, [dependency]);
  
  // Render
  return (
    <View style={styles.container}>
      <Typography>Text</Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styles
  }
});

export default MyComponent;
```

### Store Updates
```javascript
// NEVER use useAppStore.setState directly
// BAD:
useAppStore.setState({ users: newUsers });

// GOOD - Use store-specific methods:
useUserStore.getState().setUsers(newUsers);
useSettingsStore.getState().updateSettings(settings);
```

## Testing Checklist

### Before Submitting for Review
- [ ] All requirements implemented
- [ ] Verification commands pass
- [ ] No console.log statements
- [ ] No TypeScript errors
- [ ] Lint passes
- [ ] Bundle size acceptable
- [ ] Performance maintained/improved
- [ ] All platforms tested
- [ ] Evidence documented
- [ ] PENDING_CHANGES.md updated

### Platform-Specific Tests
- [ ] Web: All browsers tested
- [ ] iOS: No AsyncStorage freezes
- [ ] Android: FlexWrap displays correctly
- [ ] Android: Fonts render properly
- [ ] All: Sync functionality preserved
- [ ] All: Data persistence works

## Common Implementation Mistakes

### Mistakes to Avoid
1. **Scope Creep**: Don't add "nice to have" features
2. **Untested Platforms**: Test ALL platforms, not just your favorite
3. **Missing Evidence**: Screenshot/record everything
4. **Performance Regression**: Always check metrics
5. **Breaking Sync**: Test sync after any data changes
6. **Console Logs**: Remove ALL console statements
7. **Platform Assumptions**: Don't assume web behavior on mobile

### Red Flags for Review
- "It works on my machine" - Test all platforms
- "I'll document it later" - Document as you go
- "This is better than spec" - Follow spec exactly
- "Minor performance hit" - Measure and prove acceptable
- "Probably won't affect sync" - Always test sync

## Review Preparation

### Self-Review Checklist
Before submitting for peer review:
1. Re-read original story requirements
2. Verify each requirement is met
3. Check all success criteria
4. Run all verification commands
5. Test on all platforms
6. Review code for patterns/conventions
7. Remove debug code
8. Update documentation

### What Reviewers Will Check
- Every requirement with proof
- Platform compatibility
- Performance metrics
- Code patterns followed
- No regressions introduced
- Security implications
- Data integrity maintained

## Escalation Path

### When to Escalate
- Requirement unclear after re-reading
- Technical blocker discovered
- Platform-specific issue can't be resolved
- Performance requirement can't be met
- Security concern identified

### How to Escalate
1. Document the issue clearly
2. Show what you've tried
3. Propose alternatives
4. Tag PM/Lead in story comments
5. Update story status to BLOCKED

## Success Metrics

### Your Success Measured By
- First-time approval rate (target > 30%)
- No regressions in your code
- Evidence quality and completeness
- Platform coverage
- Performance improvements
- Code follows patterns

## Continuous Learning

### Learn From Reviews
- Document rejection reasons
- Update personal checklist
- Share learnings with team
- Improve evidence collection
- Build platform expertise

### Skills to Develop
- React Native platform differences
- Performance profiling
- Security best practices
- Testing strategies
- StackMap architecture

## Tools and Resources

### Essential Tools
```bash
# Development
npm run start           # Web development
npx react-native start  # Mobile development

# Testing
npm test               # Run tests
npm run lint          # Check code style
npm run typecheck     # TypeScript checking

# Building
npm run build:web     # Build web
npm run build:ios     # Build iOS
npm run build:android # Build Android

# Deployment
./scripts/qual_deploy.sh  # Deploy to qual
```

### Debugging Tools
- React DevTools
- Chrome DevTools
- React Native Debugger
- Xcode Instruments (iOS)
- Android Studio Profiler

### Documentation
- [CLAUDE.md](../../../CLAUDE.md) - StackMap conventions
- [TROUBLESHOOTING.md](../../../TROUBLESHOOTING.md) - Common issues
- [Platform Guides](../../platform/) - Platform-specific docs

---
*Developer Role v1.0 - StackMap Development Framework*
*Last Updated: 2025-01-13*