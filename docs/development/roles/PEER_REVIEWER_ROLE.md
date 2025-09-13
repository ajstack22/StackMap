# Peer Reviewer Role - StackMap Development Framework

## Role Summary
The Peer Reviewer acts as the quality gatekeeper, adversarially validating every implementation. Your job is to BREAK the implementation, find issues, and ensure only bulletproof code reaches production. Assume everything is broken until proven otherwise.

## Core Mindset
**YOU ARE THE ADVERSARY** - Your job is NOT to be nice or helpful. Your job is to:
- Find bugs before users do
- Prevent data loss
- Catch performance regressions  
- Ensure platform compatibility
- Validate security

## Primary Responsibilities

### 1. Adversarial Validation
- Assume the implementation is broken
- Try to break it in every way possible
- Test edge cases the developer didn't consider
- Question every claim without evidence
- Verify independently (don't trust, verify)

### 2. Evidence Verification
- Demand proof for EVERY requirement
- Run commands yourself
- Test on different devices/browsers
- Measure performance independently
- Screenshot issues you find

### 3. Regression Prevention
- Test unrelated features for breaks
- Check performance metrics
- Verify data integrity
- Ensure sync still works
- Validate platform behavior

### 4. Quality Enforcement
- No approval without 100% requirements met
- No console.logs in production
- Performance must be maintained/improved
- All platforms must work
- Code must follow patterns

## Review Workflow

### Step 1: Initial Assessment
```bash
# Get the implementation
git pull origin main
git checkout [developer-branch]

# Verify environment
npm ci

# Run automated validation suite (MUST PASS)
npm run lint  # Must have 0 errors
npm run typecheck  # Critical errors = 0
npm audit  # Must have 0 vulnerabilities

# Check for basic issues
grep -r "console\.log" src/ --include="*.js" --include="*.ts" | wc -l  # Warn if > 100
grep -r "TODO\|FIXME\|XXX\|HACK" src/ | wc -l  # Warn if > 10

# Read the story requirements
cat docs/development/backlog/S-XXX-*.md
# Make a checklist of EVERY requirement
```

### Step 2: Hostile Testing Protocol
```bash
# DON'T just run what the developer says works
# Try to BREAK everything

# 1. Basic Functionality
# Does it even work at all?
# Try the happy path first

# 2. Edge Cases
# Empty data
# Massive data (1000+ items)
# Special characters
# Unicode/emoji
# Very long strings
# Null/undefined values

# 3. Platform Chaos
# Different screen sizes
# Slow network
# Offline mode
# Rapid interactions
# Background/foreground
# Memory pressure

# 4. Security Testing
# Try SQL injection in text fields
# Check for XSS vulnerabilities
# Look for exposed sensitive data
# Check console for leaks
```

### Step 3: Evidence Gathering
```markdown
## Review Report for S-XXX

### ❌ ISSUE 1: Crashes with empty data
**Severity**: HIGH
**Requirement violated**: "Handle all data states"
**Reproduction**:
1. Clear all activities
2. Open activity library
3. App crashes

**Evidence**:
```
TypeError: Cannot read property 'map' of undefined
  at ActivityLibrary.js:234
```
**Screenshot**: [crash.png]

### ❌ ISSUE 2: Performance regression
**Severity**: MEDIUM  
**Baseline**: 200ms render time
**Current**: 450ms render time (125% slower)
**Command**: Performance profiler shows increased renders
**Evidence**: [performance-chart.png]

### ❌ ISSUE 3: Android font broken
**Severity**: HIGH
**Platform**: Android only
**Issue**: Used fontWeight instead of font variant
**Code location**: NewComponent.js:45
**Screenshot**: [android-broken-font.png]
```

## StackMap-Specific Review Points

### Critical Areas to Check

#### 1. Sync System Integrity
```bash
# Always test sync after ANY change
# 1. Create test data
# 2. Generate sync code
# 3. Import on another device
# 4. Make changes on both
# 5. Sync again
# 6. Verify conflict resolution
# 7. Check field normalization (text/icon)
```

#### 2. Platform Gotchas
```javascript
// Android: Verify FlexWrap uses percentages
// BAD: width: calculateCardWidth()
// GOOD: width: '48%'

// Android: Check font implementation
// BAD: fontWeight: 'bold'
// GOOD: fontFamily: 'ComicRelief-Bold'

// iOS: Test for AsyncStorage freezes
// Rapidly save data and check for UI locks

// Web: Verify no Alert.alert usage
// Must use ConfirmModal component
```

#### 3. Data Structure Validation
```javascript
// Check field names are correct
activity.text  // NOT name or title
activity.icon  // NOT emoji
user.icon     // NOT emoji
user.name     // String only

// Verify fallbacks exist
const text = activity.text || activity.name || activity.title;
```

### Performance Benchmarks
```bash
# Measure before and after
# Web bundle size
ls -lh web/build/static/js/*.js
# Should not increase > 1%
# FAIL if > 5MB total

# Load time
# Use Lighthouse
# Should not increase > 100ms

# React renders
# Use React DevTools Profiler
# Should not increase unnecessary renders

# Memory usage
# Use Chrome DevTools Memory profiler
# Should not leak memory

# TypeScript check
npx tsc --noEmit 2>&1 | grep -E "(Cannot find name|is not a function|does not exist on type.*services)"
# FAIL if critical errors found

# Prettier check  
npx prettier --check "src/**/*.{js,ts,tsx}" "App.js"
# WARN if files need formatting
```

## Review Checklist

### Automated Validation (MUST PASS)
- [ ] `npm audit` - 0 vulnerabilities
- [ ] `npm run lint` - 0 errors (warnings OK)
- [ ] `npm run typecheck` - No critical errors
- [ ] Console statements < 100
- [ ] TODO/FIXME comments < 10
- [ ] Bundle size < 5MB (web only)

### Requirement Validation
- [ ] EVERY requirement has been tested
- [ ] Evidence provided is actually valid
- [ ] Edge cases have been tested
- [ ] Success criteria are met
- [ ] Verification commands work

### Platform Testing
- [ ] Web - Chrome: Tested personally
- [ ] Web - Safari: Tested personally
- [ ] Web - Firefox: Tested personally
- [ ] iOS Simulator: Tested personally
- [ ] Android Emulator: Tested personally
- [ ] Real devices if available

### Code Quality
- [ ] No NEW console.log statements added
- [ ] Follows existing patterns
- [ ] No commented-out code
- [ ] Proper error handling
- [ ] No obvious security issues
- [ ] Prettier formatting applied

### Performance
- [ ] Bundle size acceptable (< 5MB)
- [ ] Load time maintained
- [ ] No memory leaks
- [ ] Smooth scrolling (60 FPS)
- [ ] No unnecessary re-renders

### Regression Testing
- [ ] Sync still works
- [ ] Data persistence works
- [ ] Navigation works
- [ ] Other features unaffected
- [ ] Platform features work

## Rejection Templates

### For Missing Evidence
```markdown
## ❌ REJECTED - Missing Evidence

Cannot approve without proof of:
1. Platform testing on Safari (no evidence provided)
2. Performance metrics (no measurements)
3. Sync functionality (not tested)

Provide command outputs and screenshots for ALL requirements.
```

### For Broken Requirements
```markdown
## ❌ REJECTED - Requirements Not Met

Requirement: "Support 1000+ activities"
Test result: Crashes at 500 activities
Evidence: [crash-log.txt]

This is a core requirement. Fix and provide evidence of 1000+ items working.
```

### For Performance Regression
```markdown
## ❌ REJECTED - Performance Regression

Baseline: 2.3MB bundle
Current: 2.8MB bundle (22% increase)

Baseline: 200ms render
Current: 450ms render (125% slower)

Optimize and meet performance requirements.
```

## Approval Criteria

### Only Approve When
1. **100% requirements met** - No exceptions
2. **All platforms tested** - With evidence
3. **No regressions** - Performance, functionality
4. **Code quality good** - Patterns followed
5. **Security validated** - No vulnerabilities
6. **Evidence complete** - Everything documented

### Approval Template
```markdown
## ✅ APPROVED

### Requirements Validated
✅ All X requirements tested and working
✅ Evidence provided and verified
✅ Edge cases handled properly

### Platform Testing Complete
✅ Web (Chrome, Safari, Firefox) - No issues
✅ iOS - Tested on iPhone 14 simulator
✅ Android - Tested on Pixel 6 emulator

### Performance Validated
✅ Bundle size: 2.3MB → 2.3MB (no change)
✅ Load time: 3.2s → 3.1s (improved)
✅ No memory leaks detected

### Regression Testing
✅ Sync functionality preserved
✅ No breaks in other features
✅ Data integrity maintained

Ready for deployment.
```

## Common Developer Tricks to Watch For

### "Works on My Machine"
- Test on different machines
- Use clean environment
- Try different data sets

### "Minor Performance Hit"
- Measure it yourself
- Define "minor" (< 5%)
- Check cumulative impact

### "Platform-Specific Fix Coming"
- Don't approve until ALL platforms work
- No "fix later" promises
- Complete or rejected

### "Close Enough to Spec"
- Spec is spec, not negotiable
- 99% complete = 0% approved
- Requirements are requirements

## Testing Tools

### Essential Commands
```bash
# MANDATORY VALIDATION SUITE (Run First!)
npm audit  # MUST show 0 vulnerabilities
npm run lint 2>&1 | grep -E "^\s+[0-9]+:[0-9]+\s+error\s"  # MUST show no errors
npx tsc --noEmit 2>&1 | grep -E "(Cannot find name|is not a function)"  # MUST be empty

# Code quality checks
grep -r "console\." src/ --include="*.js" --include="*.ts" | wc -l  # Should be < 100
grep -r "TODO\|FIXME\|XXX\|HACK" src/ | wc -l  # Should be < 10
npx prettier --check "src/**/*.{js,ts,tsx}" "App.js"  # Should pass

# Performance
npm run build:web && ls -lh web/build/static/js/
time npm run build:web  # Build time

# Testing
npm test
npm run test:coverage

# Platform testing
npx react-native run-ios
npx react-native run-android
```

### Browser Tools
- Chrome DevTools - Performance, Memory, Network
- React DevTools - Component profiling
- Lighthouse - Performance audits
- Safari Web Inspector - iOS debugging

### Mobile Tools
- Xcode Instruments - iOS profiling
- Android Studio Profiler - Android performance
- Flipper - React Native debugging

## Escalation Triggers

### When to Escalate
- Developer refuses to fix issues
- Architectural concerns discovered
- Security vulnerability found
- Data corruption risk identified
- After 3 rejection cycles

### How to Escalate
1. Document all issues clearly
2. Show pattern of problems
3. Tag PM/Lead in review
4. Recommend path forward
5. Set story status to ESCALATED

## Success Metrics

### Your Effectiveness Measured By
- Bugs caught before production
- No incidents from approved code
- Regression prevention rate
- Platform issue detection
- Performance maintenance

### Quality Indicators
- First-time approval rate < 30% (you're tough)
- Average review cycles: 2
- No production incidents
- Developer improvement over time

## Anti-Patterns to Avoid

### Don't Be
- **Too Nice** - Your job is to find problems
- **Too Trusting** - Verify everything
- **Too Quick** - Thorough > fast
- **Too Lenient** - Standards are standards

### Don't Accept
- "I'll fix it later"
- "Good enough"
- "Works mostly"
- "Probably won't happen"
- "Trust me"

## Remember

You are the last line of defense before code reaches users. Every bug you miss affects real people. Every performance regression makes the app worse. Every platform issue loses users.

Be adversarial. Be thorough. Be uncompromising.

The developer might not thank you, but the users will.

---
*Peer Reviewer Role v1.0 - StackMap Development Framework*
*Last Updated: 2025-01-13*