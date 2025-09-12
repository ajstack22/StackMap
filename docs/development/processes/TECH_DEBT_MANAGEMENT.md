# Tech Debt Management Process - StackMap

## Purpose
Systematically track, prioritize, and eliminate technical debt through structured story conversion and implementation.

## Current Tech Debt Overview

### Critical (P0) - Security/Data Integrity
- Missing test coverage for sync system
- No integration tests for data migration
- Unvalidated platform-specific workarounds

### High (P1) - Performance/Architecture  
- God objects: DataModal.js (2672 lines), ActivityLibrary.js (2212 lines)
- Missing React optimization (memo/callback)
- 570+ console.log statements in production
- Multiple overlapping encryption services

### Medium (P2) - Maintainability
- Deep import paths (../../../)
- Platform-specific hacks without abstraction
- Debug code in production
- Large bundle without code splitting

### Low (P3) - Code Quality
- TypeScript migration incomplete
- Inconsistent error handling
- Missing documentation
- Deprecated patterns

## Tech Debt Discovery

### During Development
```markdown
When you discover tech debt:
1. Document in code with comment:
   // TECH-DEBT: [Category] - [Description]
   // Impact: [Who/what is affected]
   // Effort: [S/M/L/XL]
   // Priority: [P0-P3]

2. Create draft in docs/development/tech-debt/:
   - Use template below
   - Include specific examples
   - Estimate effort
   - Define success criteria

3. Convert to story when ready:
   ./scripts/tech-debt-to-story.sh drafts/[debt-file].md
```

### During Review
- Peer Reviewer must flag tech debt
- Document but don't block if not critical
- Create follow-up story for resolution

### During Testing
- Performance regressions → P1 debt
- Flaky tests → P2 debt  
- Platform inconsistencies → P1 debt

## Tech Debt Template

```markdown
# Tech Debt: [Title]
## Category: [Performance/Security/Architecture/Quality]
## Priority: P[0-3]
## Discovered: [Date]
## Discovered By: [Role/Person]

### Description
[What is the problem?]

### Current Impact
- User impact: [How users are affected]
- Developer impact: [How development is slowed]
- System impact: [Performance/reliability effects]

### Examples
```javascript
// Specific code examples showing the problem
```

### Root Cause
[Why does this exist?]

### Proposed Solution
[High-level approach to fix]

### Success Criteria
- [ ] Specific measurable outcome
- [ ] Performance metric
- [ ] Test coverage metric

### Effort Estimate
- Development: [X days]
- Testing: [X days]
- Platforms affected: [Web/iOS/Android]

### Dependencies
- Must complete after: [Story/Epic]
- Must complete before: [Story/Epic]

### Rollback Risk
[Low/Medium/High] - [Why?]
```

## Prioritization Matrix

| Priority | Criteria | Action | Example |
|----------|----------|--------|---------|
| P0 | Security/Data loss risk | Fix immediately | Sync data corruption |
| P1 | User-facing performance | Next sprint | 20s iOS freeze |
| P2 | Developer velocity | Quarterly | God objects |
| P3 | Code quality | As capacity allows | Console.logs |

### Scoring Formula
```
Score = (User Impact × 3) + (Dev Impact × 2) + (Risk × 4) - (Effort × 1)

User Impact: 1-5 (5 = all users affected)
Dev Impact: 1-5 (5 = blocks all development)
Risk: 1-5 (5 = data loss possible)
Effort: 1-5 (5 = weeks of work)
```

## Conversion to Stories

### Automatic Conversion
```bash
# Convert draft to story
./scripts/tech-debt-to-story.sh drafts/god-objects.md

# This will:
# 1. Create story in backlog/
# 2. Add verification commands
# 3. Set priority
# 4. Archive draft
```

### Story Requirements
Tech debt stories must include:
1. Before/after metrics
2. Regression test plan
3. Platform test requirements
4. Rollback procedure
5. Success metrics

### Bundling Small Debts
Group related small items:
```markdown
# Story: Code Quality Cleanup Sprint
## Includes:
- Remove console.logs (2 hours)
- Fix ESLint warnings (3 hours)
- Remove commented code (1 hour)
- Update deprecated APIs (2 hours)
```

## Tracking and Reporting

### Weekly Tech Debt Review
```bash
# Generate report
./scripts/tech-debt-report.sh

# Outputs:
# - New debt discovered
# - Debt resolved
# - Debt trending
# - Priority changes
```

### Metrics to Track
- Debt discovery rate
- Debt resolution rate
- Average time to resolve
- Debt by category
- Debt by platform

### Dashboard Location
`docs/development/tech-debt/DASHBOARD.md`

## Implementation Guidelines

### For Performance Debt
1. Measure baseline metrics
2. Implement fix
3. Measure improvement
4. Must show 20%+ improvement

### For Architecture Debt
1. Create abstraction layer
2. Migrate incrementally
3. Maintain backward compatibility
4. Remove old code only after verification

### For Security Debt
1. Fix immediately if P0
2. Add tests to prevent recurrence
3. Audit similar code
4. Document in security log

### For Quality Debt
1. Bundle with related work
2. Use automated tools
3. Add linting rules
4. Update style guide

## Current Tech Debt Inventory

### P0 - Critical (Fix Immediately)
1. **Missing Sync Test Coverage**
   - File: src/services/syncService.js
   - Impact: Data loss possible
   - Effort: L (1 week)
   - Story: S-DEBT-001

### P1 - High (Next Sprint)
1. **God Object: DataModal.js**
   - File: src/components/DataModal.js (2672 lines)
   - Impact: Unmaintainable, slow
   - Effort: XL (2 weeks)
   - Story: S-DEBT-002

2. **iOS AsyncStorage Freeze**
   - File: src/stores/useAppStore.js
   - Impact: 20+ second freezes
   - Effort: M (3 days)
   - Story: S-DEBT-003

### P2 - Medium (Quarterly)
1. **Missing React Optimizations**
   - Files: 130+ components
   - Impact: Unnecessary re-renders
   - Effort: L (1 week)
   - Story: S-DEBT-004

2. **Console.log Cleanup**
   - Files: 31 files, 570+ instances
   - Impact: Bundle size, security
   - Effort: S (1 day)
   - Story: S-DEBT-005

### P3 - Low (As Capacity)
1. **TypeScript Migration**
   - Files: All .js files
   - Impact: Type safety
   - Effort: XL (ongoing)
   - Epic: E-DEBT-001

## Anti-Patterns to Avoid

### Don't:
- ❌ Fix debt without documenting
- ❌ Create more debt while fixing
- ❌ Ignore platform differences
- ❌ Skip regression testing
- ❌ Bundle unrelated debt

### Do:
- ✅ Measure before and after
- ✅ Test on all platforms
- ✅ Document why it existed
- ✅ Add tests to prevent recurrence
- ✅ Update documentation

## Success Metrics
- P0 debt = 0 always
- P1 debt < 5 items
- Debt resolution rate > discovery rate
- No debt older than 6 months
- Test coverage > 80%

---
*Process Version: 1.0 - StackMap Specific*
*Last Updated: 2025-01-13*