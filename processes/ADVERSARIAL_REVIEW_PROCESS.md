# Adversarial Review Process - StackMap

## Purpose
Rigorous validation of individual story implementations through adversarial review between Developer and Peer Reviewer roles.

## When to Use
- Any non-trivial story requiring quality assurance
- Bug fixes that touch critical systems (sync, data structures, deployment)
- Platform-specific implementations
- Performance optimizations
- Security-related changes

## Process Overview

### Phase 1: Story Assignment
1. Developer receives story from backlog
2. Story must include:
   - Clear requirements with edge cases
   - Success metrics with specific commands
   - Platform testing requirements
   - Regression test checklist

### Phase 2: Implementation
**Developer Responsibilities:**
1. Implement all requirements exactly as specified
2. Test on ALL required platforms:
   - Web (Chrome, Safari, Firefox)
   - iOS Simulator
   - Android Emulator
   - Physical devices if specified
3. Run verification commands and document results
4. Self-review against success metrics
5. Create implementation report with evidence

### Phase 3: Adversarial Review
**Peer Reviewer Responsibilities:**
1. **Assume implementation is broken** until proven otherwise
2. Test every claim with actual commands
3. Try to break the implementation:
   - Edge cases
   - Platform differences
   - Performance degradation
   - Security vulnerabilities
   - Data corruption scenarios
4. Demand evidence for all assertions
5. Check for regressions in unrelated areas

### Phase 4: Iteration
1. Peer Reviewer documents ALL issues found
2. Developer fixes issues with evidence
3. Repeat until no issues found
4. Maximum 3 iterations before escalation

### Phase 5: Approval
**Approval Criteria:**
- ✅ All requirements implemented and verified
- ✅ All platforms tested with evidence
- ✅ No regressions found
- ✅ Performance metrics maintained or improved
- ✅ Security review passed
- ✅ Code follows StackMap conventions (CLAUDE.md)

## Verification Commands

### Standard Verification Suite
```bash
# Linting and type checking
npm run lint
npm run typecheck

# Build verification
npm run build:web
npm run build:android
npm run build:ios

# Test suite (when available)
npm test

# Bundle size check
ls -lh web/build/static/js/*.js

# Performance metrics
# Web: Chrome DevTools Lighthouse
# Mobile: Platform-specific profilers
```

### Platform-Specific Verification
```bash
# Web deployment test
./scripts/qual_deploy.sh --web --skip-tests
curl https://qual.stackmap.app

# Android test
npx react-native run-android
# Check for FlexWrap issues, font rendering

# iOS test
npx react-native run-ios
# Check for AsyncStorage freezes, modal constraints
```

### Sync System Verification
```bash
# Test sync functionality
# 1. Create test data on device A
# 2. Generate sync code
# 3. Import on device B
# 4. Verify data integrity
# 5. Make changes on both devices
# 6. Verify conflict resolution
```

## Review Templates

### Developer Implementation Report
```markdown
## Story: [Story ID and Title]
## Developer: [Role/Name]
## Date: [YYYY-MM-DD]

### Requirements Completed
- [ ] Requirement 1: [Evidence/Command output]
- [ ] Requirement 2: [Evidence/Command output]
- [ ] Edge case handling: [Evidence]

### Platform Testing
- [ ] Web (Chrome): [Test results]
- [ ] Web (Safari): [Test results]
- [ ] iOS Simulator: [Test results]
- [ ] Android Emulator: [Test results]

### Performance Impact
- Bundle size before: [Size]
- Bundle size after: [Size]
- Load time impact: [Metrics]

### Regression Testing
- [ ] Sync functionality: [Test results]
- [ ] Data persistence: [Test results]
- [ ] Platform features: [Test results]
```

### Peer Reviewer Report
```markdown
## Story: [Story ID and Title]
## Reviewer: [Role/Name]
## Review Date: [YYYY-MM-DD]

### Issues Found
1. **[Issue Title]**
   - Description: [What's broken]
   - Reproduction: [Exact steps]
   - Evidence: [Command output/Screenshot]
   - Severity: [Critical/High/Medium/Low]

### Tests Performed
- [ ] All requirements verified independently
- [ ] Edge cases tested
- [ ] Platform differences checked
- [ ] Performance regression tested
- [ ] Security implications reviewed

### Decision
[ ] APPROVED - All criteria met
[ ] REJECTED - Issues must be fixed
[ ] ESCALATE - Needs architectural review
```

## Escalation Path
1. After 3 iterations without approval → PM review
2. Architecture concerns → Tech Lead review
3. Security issues → Immediate stop, security review
4. Data corruption risk → Immediate stop, backup and review

## Common Failure Points

### StackMap-Specific Issues
- ❌ Not testing Android FlexWrap with percentage widths
- ❌ Using fontWeight on Android (must use font variants)
- ❌ Not debouncing AsyncStorage on iOS
- ❌ Using wrong field names (text vs name, icon vs emoji)
- ❌ Not testing sync with field normalization
- ❌ Creating .native.js or .web.js files (forbidden)
- ❌ Leaving console.log statements
- ❌ Not updating PENDING_CHANGES.md

## Success Metrics
- First-time approval rate > 30%
- No production incidents from approved stories
- Average review cycles ≤ 2
- No regressions in 95% of stories

## Special Considerations

### For Sync System Changes
- Must test with 100+ activities
- Must test offline/online transitions
- Must verify encryption/decryption
- Must test conflict resolution

### For Platform Changes
- Must test on physical devices
- Must verify against platform gotchas in CLAUDE.md
- Must check bundle size impact

### For Data Structure Changes
- Must test migration from old structure
- Must verify field normalization
- Must test sync compatibility

---
*Process Version: 1.0 - StackMap Specific*
*Based on Manylla Framework*
*Last Updated: 2025-01-13*