# DBR (Debug Battle Review) Process

## Overview
The Debug Battle Review (DBR) process is a systematic troubleshooting methodology inspired by Adversarial Peer Review. It uses three distinct personas to approach bugs from different angles, ensuring thorough investigation and creative problem-solving.

## The Three Personas

### 1. 🔍 Detective (Root Cause Investigator)
**Role:** Methodically investigate the bug's root cause
**Mindset:** "Every bug leaves evidence. Follow the trail."

**Responsibilities:**
- Gather all symptoms and evidence
- Create hypotheses about root causes
- Design experiments to test theories
- Document the investigation path
- Use browser DevTools, logging, and debugging tools
- Compare working vs broken states
- Trace execution flow

**Output Format:**
```markdown
## Detective Investigation
### Evidence Collected:
- [List all observed symptoms]
- [Browser DevTools findings]
- [Console logs/errors]

### Hypotheses:
1. [Theory 1 with supporting evidence]
2. [Theory 2 with supporting evidence]

### Experiments Conducted:
- [Test 1]: [Result]
- [Test 2]: [Result]

### Most Likely Cause:
[Your conclusion based on evidence]
```

### 2. 🔧 Mechanic (Solution Implementation)
**Role:** Fix the bug with minimal side effects
**Mindset:** "Fix it right, not just fast."

**Responsibilities:**
- Implement targeted fixes based on Detective's findings
- Ensure backward compatibility
- Minimize code changes
- Test fixes across all platforms
- Consider edge cases
- Document why the fix works

**Output Format:**
```markdown
## Mechanic's Fix
### Diagnosis:
[What's broken and why]

### Repair Plan:
1. [Step 1 with file/line]
2. [Step 2 with file/line]

### Implementation:
```[language]
// File: [path]
// Before:
[old code]

// After:
[new code]

// Reasoning: [why this fixes it]
```

### Side Effects Considered:
- [Potential issue 1]: [Mitigation]
- [Potential issue 2]: [Mitigation]

### Testing Checklist:
- [ ] Original bug fixed
- [ ] No regression in [area]
- [ ] Works on all platforms
```

### 3. 🎯 Sniper (Precision Validator)
**Role:** Verify the fix and prevent regression
**Mindset:** "One shot, one kill. No collateral damage."

**Responsibilities:**
- Confirm the bug is actually fixed
- Check for regressions
- Verify across different scenarios
- Write tests to prevent recurrence
- Challenge the fix if inadequate
- Ensure clean implementation

**Output Format:**
```markdown
## Sniper's Validation
### Target Confirmation:
- Original Bug Status: [Fixed/Partially Fixed/Not Fixed]
- Evidence: [How verified]

### Regression Check:
- [Component 1]: ✅ No regression
- [Component 2]: ⚠️ [Issue found]

### Edge Cases Tested:
- [Scenario 1]: [Result]
- [Scenario 2]: [Result]

### Test Coverage:
```[language]
// Regression test to add
[test code]
```

### Final Assessment:
[APPROVED/REJECTED/NEEDS REVISION]
[Reasoning]
```

## DBR Execution Flow

### Phase 1: Investigation Sprint (10 minutes)
**Detective leads:**
1. Reproduce the bug consistently
2. Collect all available evidence
3. Form initial hypotheses
4. Run quick experiments

### Phase 2: Fix Development (10 minutes)
**Mechanic leads:**
1. Review Detective's findings
2. Design minimal fix
3. Implement solution
4. Document changes

### Phase 3: Validation Round (10 minutes)
**Sniper leads:**
1. Test the fix thoroughly
2. Check for side effects
3. Verify across platforms
4. Approve or reject

### Phase 4: Iteration (if needed)
If Sniper rejects, cycle back with new information:
- Detective: Investigate why fix failed
- Mechanic: Adjust approach
- Sniper: Re-validate

## Bug Complexity Levels

### Level 1: Surface Bug
- Clear error messages
- Obvious cause
- Single file fix
- Use standard DBR

### Level 2: Deep Bug
- Hidden symptoms
- Multiple potential causes
- Multi-file changes
- Use extended DBR with longer phases

### Level 3: Heisenbug
- Intermittent/environment-specific
- Race conditions
- Platform-specific
- Use DBR with environmental controls

### Level 4: Architectural Bug
- Design flaw
- Requires refactoring
- Multiple systems affected
- Use DBR with Architecture Review

## Success Metrics
- **Speed**: Bug fixed within 30 minutes
- **Quality**: No regressions introduced
- **Coverage**: Test prevents recurrence
- **Documentation**: Clear explanation of cause and fix

## Example Session

```markdown
# DBR Session: Activity Card Layout Bug

## Round 1
### 🔍 Detective:
Evidence: Cards showing in 2 columns, 450px width exceeds 375px constraint
Hypothesis: Parent container has display:flex with row direction
Experiment: Inspect computed styles... Found: inherited flex-direction:row from parent

### 🔧 Mechanic:
Fix: Override parent flex with explicit flexDirection:'column'
Location: LibraryActivityGrid.js line 167
Implementation: Added activityListContainer wrapper

### 🎯 Sniper:
Test Result: Bug persists
Assessment: REJECTED - Width still 450px
Recommendation: Investigate CSS cascade

## Round 2
### 🔍 Detective:
New Evidence: react-native-web generating conflicting classes
CSS priority issue detected...
[continues]
```

## Tips for Success
1. **Don't skip personas** - Each provides unique value
2. **Time-box phases** - Prevents analysis paralysis
3. **Document everything** - Future you will thank you
4. **Test incrementally** - Verify each small change
5. **Stay systematic** - Follow the process even when frustrated

## When to Use DBR
- Bug has resisted 2+ fix attempts
- Critical production issues
- Intermittent/hard-to-reproduce bugs
- When you need to understand, not just fix
- Training junior developers in debugging