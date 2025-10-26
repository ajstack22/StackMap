# Atlas Tier Selection Guide

## Visual Decision Matrix

| Question | Quick | Iterative | Standard | Full |
|----------|-------|-----------|----------|------|
| **Files affected?** | 1 | 1-2 | 2-5 | 6+ |
| **Logic changes?** | No | Simple | Yes | Complex |
| **Need validation?** | No | Yes | Yes | Yes |
| **Need research/planning?** | No | No | Yes | Yes |
| **Security implications?** | No | No | Maybe | Yes |
| **Cross-platform?** | No | No | Maybe | Yes |
| **Formal requirements?** | No | No | No | Yes |
| **Risk of breaking changes?** | Zero | Low | Low-Med | High |

## Detailed Tier Criteria

### 🟢 Quick Workflow (5-15 minutes)

**Use when ALL of these are true:**
- ✅ Change affects 1 file only
- ✅ No logic changes (text, colors, config only)
- ✅ Zero risk of side effects
- ✅ Existing tests cover it
- ✅ Takes < 5 minutes to understand
- ✅ No validation needed

**Examples:**
- "Change button color from blue to green"
- "Fix typo in error message"
- "Update welcome text"
- "Change API timeout from 30s to 60s"

**Anti-examples (use higher tier):**
- "Change button color AND update hover state" → Iterative (needs validation)
- "Fix typo in sync logic" → Standard (affects logic)

---

### 🔵 Iterative Workflow (15-30 minutes)

**Use when MOST of these are true:**
- ✅ Affects 1-2 files
- ✅ Simple/straightforward change
- ✅ Needs quality validation
- ✅ Don't need research/planning
- ✅ Want peer review cycle
- ✅ Low risk but want eyes on it

**Examples:**
- "Improve button spacing on login screen"
- "Adjust card padding for better hierarchy"
- "Extract validation logic into helper function"
- "Add loading spinner to sync button"

**Anti-examples:**
- "Improve button spacing" but affects 5 components → Standard
- "Just change padding to 16px" → Quick (no validation needed)

---

### 🟡 Standard Workflow (30-60 minutes) ⭐ DEFAULT

**Use when MOST of these are true:**
- ✅ Affects 2-5 files
- ✅ Some logic changes
- ✅ Low-medium risk
- ✅ Needs new tests
- ✅ Requires design thinking

**Examples:**
- "Fix null pointer when user syncs with empty list"
- "Add confirmation dialog before deleting activities"
- "Extract photo validation into utility class"
- "Implement retry logic for failed sync"

**This is the DEFAULT tier** - when in doubt, use Standard.

---

### 🔴 Full Workflow (2-4 hours)

**Use when ANY of these are true:**
- ✅ Affects 6+ files OR creates new module
- ✅ Complex logic/state management
- ✅ Security implications
- ✅ Cross-platform coordination required
- ✅ Needs formal requirements
- ✅ High risk of breaking changes

**Examples:**
- "Implement dark mode with persistence"
- "Add end-to-end encryption for sync"
- "Migrate database from SQLite to Realm"
- "Implement photo attachments system"

---

## Common Scenarios

### Scenario: "Fix a bug"

**Questions to ask:**
1. How many files affected?
   - 1 file → Quick or Iterative
   - 2-5 files → Standard
   - 6+ files → Full

2. Do I understand the root cause?
   - Yes, trivial fix → Quick
   - Yes, needs validation → Iterative
   - Need to investigate → Standard
   - Complex root cause analysis → Full

3. Security/data integrity implications?
   - None → Quick/Iterative/Standard
   - Yes → Standard or Full

**Examples:**
- "Typo in error message" → Quick
- "Button alignment off by 2px" → Iterative (validate visual)
- "Null pointer on empty array" → Standard
- "Authentication bypass vulnerability" → Full

---

### Scenario: "Add a feature"

**Questions to ask:**
1. How many new files/components?
   - 0-1 files → Iterative or Standard
   - 2-5 files → Standard
   - 6+ files → Full

2. Cross-platform considerations?
   - No → Quick/Iterative/Standard
   - Yes → Standard or Full

3. Needs formal requirements?
   - No → Quick/Iterative/Standard
   - Yes → Full

**Examples:**
- "Add tooltip to button" → Iterative
- "Add confirmation dialog" → Standard
- "Add photo attachments with sync" → Full

---

### Scenario: "Refactor code"

**Questions to ask:**
1. Scope of refactor?
   - Single function → Iterative
   - Single file/class → Standard
   - Multiple modules → Full

2. Behavior changes?
   - No (pure refactor) → Iterative or Standard
   - Yes (behavior changes too) → Standard or Full

3. Need to maintain backwards compatibility?
   - No → Iterative or Standard
   - Yes → Standard or Full

**Examples:**
- "Extract helper function" → Iterative
- "Refactor sync service into modules" → Full

---

## Escalation Decision Points

### During Quick Workflow:
**Escalate to Iterative if:**
- Change works but you want validation
- Simple change but want peer eyes

**Escalate to Standard if:**
- Found multiple files need changes
- Tests fail, need new test cases
- Edge cases emerge

### During Iterative Workflow:
**Escalate to Standard if:**
- Change expands beyond 2 files
- Need research to understand requirements
- Complex edge cases require planning

### During Standard Workflow:
**Escalate to Full if:**
- Scope expands to 6+ files
- Security concerns emerge during review
- Formal requirements become necessary
- Cross-platform issues more complex than expected

---

## Special Cases

### Documentation-Only Changes
- **Single doc file**: Quick
- **Multiple doc files**: Iterative
- **New documentation system**: Standard or Full

### Test-Only Changes
- **Add 1-2 tests**: Quick or Iterative
- **Refactor test suite**: Standard
- **New testing framework**: Full

### Configuration Changes
- **Simple config value**: Quick
- **Multi-file config update**: Iterative or Standard
- **Infrastructure/deployment config**: Standard (use devops agent)

### Hotfixes (Production Bugs)
- **Trivial fix, high certainty**: Quick (with extra testing)
- **Complex fix**: Standard (minimum - don't skip phases)
- **Security hotfix**: Full (even if small - security requires rigor)

---

## Tier Selection Checklist

Before selecting tier, answer these questions:

1. **Scope**: How many files? ______
2. **Complexity**: Trivial / Simple / Moderate / Complex
3. **Risk**: Zero / Low / Medium / High
4. **Validation needed**: Yes / No
5. **Research needed**: Yes / No
6. **Formal requirements needed**: Yes / No
7. **Security implications**: Yes / No
8. **Cross-platform**: Yes / No

**Scoring:**
- All "trivial/zero/no" → **Quick**
- Mostly "simple/low/no" + "validation yes" → **Iterative**
- Mix of "moderate/medium/yes" → **Standard** ⭐
- Multiple "complex/high/yes" → **Full**

---

## Pro Tips

1. **Start conservative**: Can always escalate, hard to de-escalate
2. **When uncertain**: Use Standard (the safe default)
3. **Time boxing**: If research takes > 15 min in Quick/Iterative, escalate to Standard
4. **Scope creep**: If task grows during implementation, escalate immediately
5. **First time**: Doing something new? Add +1 tier (Quick→Iterative, Standard→Full)

---

## Success Metrics

Track your tier selection accuracy:

- **Correct tier**: Task completes within expected timeframe, no surprises
- **Under-tiered**: Task took longer, needed escalation, found unexpected complexity
- **Over-tiered**: Task finished much faster than expected, phases felt unnecessary

**Goal**: 90%+ correct tier selection after first month using Atlas.
