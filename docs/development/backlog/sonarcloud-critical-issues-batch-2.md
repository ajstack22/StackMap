# Atlas Workflow: SonarCloud Critical Issues - Batch 2

## Quick Start Prompt

```
Fix the remaining 5 SonarCloud CRITICAL issues using complexity reduction techniques. Use Atlas Standard workflow.

Issues to fix:
1. fileProcessingUtils.js:305 - Complexity 18 (limit: 15)
2. syncOperationUtils.js:415 - Complexity 17 (limit: 15)
3. CategoryActions.js:221 - Function nesting >4 levels
4. DataImport.js:89 - Complexity 24 (limit: 15)
5. ImportConfirmation.js:42 - Complexity 17 (limit: 15)

Apply the same refactoring patterns from Batch 1:
- Extract helper functions for complexity reduction
- Use configuration-driven approaches
- Extract nested components to reduce nesting
- Ensure all changes are behavior-preserving
- Maintain 100% test coverage

Target: 0 CRITICAL issues, reduce complexity by 60-70%
```

## Context

**Previous Success (Batch 1)**:
- Fixed 1 BLOCKER + 3 CRITICAL issues
- Reduced complexity by 60-70%
- 1,965 tests passing (no regressions)
- All changes behavior-preserving

**Current Status**:
- Blockers: 0 ✅
- Critical: 5 (down from 20)
- All in different files than Batch 1

## Issue Details

### 1. fileProcessingUtils.js:305 - Complexity 18
**Rule**: javascript:S3776 (Cognitive Complexity)
**Current**: 18 | **Target**: ≤15
**Approach**: Extract validation, processing, and error handling into separate functions

### 2. syncOperationUtils.js:415 - Complexity 17
**Rule**: javascript:S3776 (Cognitive Complexity)
**Current**: 17 | **Target**: ≤15
**Approach**: Break down sync operation logic into focused helper functions

### 3. CategoryActions.js:221 - Function Nesting >4
**Rule**: javascript:S2004 (Function Nesting Depth)
**Current**: >4 levels | **Target**: ≤4 levels
**Approach**: Extract nested callbacks into named functions or components

### 4. DataImport.js:89 - Complexity 24 (HIGHEST)
**Rule**: javascript:S3776 (Cognitive Complexity)
**Current**: 24 | **Target**: ≤15
**Priority**: HIGH - 60% over limit
**Approach**: Split import flow into multiple stages (validate → parse → transform → store)

### 5. ImportConfirmation.js:42 - Complexity 17
**Rule**: javascript:S3776 (Cognitive Complexity)
**Current**: 17 | **Target**: ≤15
**Approach**: Extract conflict resolution logic and UI state management

## Recommended Priority Order

1. **DataImport.js:89** (complexity 24) - Highest complexity, most impact
2. **CategoryActions.js:221** (nesting >4) - Pattern from successful Batch 1
3. **fileProcessingUtils.js:305** (complexity 18)
4. **ImportConfirmation.js:42** (complexity 17)
5. **syncOperationUtils.js:415** (complexity 17)

## Success Criteria

- [ ] All 5 CRITICAL issues resolved
- [ ] No new CRITICAL or BLOCKER issues introduced
- [ ] All existing tests passing (1,965+)
- [ ] Code coverage maintained or improved
- [ ] All changes behavior-preserving
- [ ] Cognitive complexity reduced by 60-70% per function
- [ ] Deployed to QUAL successfully

## Expected Outcome

**SonarCloud Metrics After**:
- Blockers: 0 (maintained)
- Critical: 0 (from 5)
- Technical Debt: ~13,000 min (from 14,706 min, -12% reduction)
- Code Smells: ~1,850-1,900 (minor reduction expected)

## Atlas Standard Workflow Phases

### 1. Research Phase
- Read all 5 files at the specified lines
- Understand the complexity sources
- Identify refactoring patterns that worked in Batch 1

### 2. Plan Phase
- Create extraction strategy for each function
- Map helper functions to extract
- Identify shared patterns across files

### 3. Implement Phase
- Fix in priority order (highest complexity first)
- Run tests after each fix
- Ensure behavior preservation

### 4. Review Phase
- Validate complexity reduction with tests
- Check for new issues introduced
- Verify all edge cases covered

### 5. Deploy Phase
- Update PENDING_CHANGES.md
- Run `./scripts/qual_deploy.sh`
- Verify SonarCloud metrics

## Lessons from Batch 1

✅ **What Worked**:
- Configuration-driven approaches (FIELD_MAPPINGS pattern)
- Extracting focused helper functions (8 functions from pullData)
- Component extraction for nesting issues (React.memo components)
- Prioritizing by risk (lowest risk first)

✅ **Refactoring Patterns**:
- **For Complexity**: Extract into orchestrator + helpers
- **For Nesting**: Extract components with clear props
- **For Validation**: Separate validation from business logic
- **For Error Handling**: Centralize error handling logic

## Testing Strategy

```bash
# Test specific files after changes
npm test -- --testPathPattern="(fileProcessingUtils|syncOperationUtils|CategoryActions|DataImport|ImportConfirmation)"

# Full test suite
npm test

# Verify SonarCloud
./scripts/sonar-analysis.sh
```

## Related Documentation

- Previous fix: `/docs/development/backlog/sonarcloud-critical-issues-batch-1.md` (if exists)
- Commit: `99db1876` - SonarCloud Critical Issues Resolution - Blocker & Complexity Fixes
- Atlas Framework: `/atlas/docs/WORKFLOW_TIERS.md`
- Project Guide: `/CLAUDE.md`

## Estimated Effort

**Time**: 1-2 hours (Standard workflow)
**Complexity**: Medium
**Risk**: Low (proven patterns from Batch 1)
**Dependencies**: None

---

**Created**: 2025-10-03
**Status**: Backlog
**Priority**: Medium
**Type**: Technical Debt / Code Quality
**Atlas Workflow**: Standard
