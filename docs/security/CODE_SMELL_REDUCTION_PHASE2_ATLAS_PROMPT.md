# Atlas Prompt: Code Smell Reduction Phase 2 - Parallel Agent Execution

**Date:** 2025-10-02
**Workflow:** Atlas Standard (30-60 min) with Parallel Developer Agents
**Goal:** Reduce code smells from ~1,100-1,200 → ~700-900 (-300 to -500 smells)

## Context

**Phase 1 Complete:**
- ✅ Animation timing constants extracted (12+ magic numbers → ANIMATION_DURATION)
- ✅ Field accessor helpers created (35+ fallback chains → getActivityText/getActivityIcon)
- ✅ Result: 1,410 → ~1,100-1,200 smells (-200 to -300)

**Current State:**
- SonarCloud Maintainability: A rating
- 1,100-1,200 code smells remaining
- Most are: magic numbers, duplicate literals, missing JSDoc, long functions

---

## Phase 2 Strategy: Parallel Agent Execution

**Use 3 developer agents working in parallel on independent tasks:**

### Agent 1: Extract Layout & Spacing Constants
**Files:** App.js, modal components, card layouts
**Task:** Extract magic numbers for spacing, sizing, z-index values
**Estimated Impact:** -100 to -150 smells

**Target Patterns:**
```javascript
// Before:
style={{ padding: 16, marginTop: 20, zIndex: 1000 }}

// After:
import { SPACING, Z_INDEX } from '../constants/layout';
style={{ padding: SPACING.MD, marginTop: SPACING.LG, zIndex: Z_INDEX.MODAL }}
```

**Deliverables:**
1. Create `src/constants/spacing.js` with SPACING constants
2. Create `src/constants/zIndex.js` with Z_INDEX layers
3. Update 20-30 files with consistent spacing values
4. Add tests for new constants

---

### Agent 2: Extract Color & Theme Constants
**Files:** Inline styles across components
**Task:** Move hardcoded colors to theme constants
**Estimated Impact:** -80 to -120 smells

**Target Patterns:**
```javascript
// Before:
backgroundColor: '#E0E0E0'
color: '#666'
borderColor: '#d32f2f'

// After:
import { COLORS } from '../constants/colors';
backgroundColor: COLORS.GRAY_200
color: COLORS.GRAY_600
borderColor: COLORS.ERROR
```

**Deliverables:**
1. Create `src/constants/colors.js` with semantic color names
2. Update 15-25 files with color constants
3. Document color palette in comments
4. Add tests for color constants

---

### Agent 3: Add JSDoc Comments & Extract String Literals
**Files:** Utility functions, service methods
**Task:** Document complex functions and extract repeated strings
**Estimated Impact:** -120 to -230 smells

**Target Patterns:**
```javascript
// Before:
export const validateData = (data) => {
  if (!data) return { error: 'Invalid data' };
  // Complex logic...
};

// After:
const ERROR_MESSAGES = {
  INVALID_DATA: 'Invalid data',
  MISSING_FIELD: 'Required field missing',
};

/**
 * Validates imported data structure for sync operations
 * @param {Object} data - Data object to validate
 * @returns {{success: boolean, error?: string}} Validation result
 */
export const validateData = (data) => {
  if (!data) return { error: ERROR_MESSAGES.INVALID_DATA };
  // Complex logic...
};
```

**Deliverables:**
1. Add JSDoc to 30-50 functions missing documentation
2. Create `src/constants/messages.js` for repeated strings
3. Extract error messages, user-facing text
4. Add @param and @returns tags consistently

---

## Execution Instructions

**Run all 3 agents in parallel** using the Task tool with multiple invocations in a single message.

### Agent 1 Prompt:
```
You are Agent 1: Layout & Spacing Constants Extractor.

Your task is to extract magic numbers for spacing, sizing, and z-index values from the StackMap codebase.

RESEARCH PHASE:
1. Search for inline style objects with numeric spacing values (padding, margin, width, height, zIndex)
2. Identify the most common values (e.g., 8, 16, 20, 24, 48 for spacing)
3. Look for z-index values (1000, 9999, 10000, etc.)
4. Find patterns in App.js, modal components, and card layouts

IMPLEMENTATION PHASE:
1. Create src/constants/spacing.js with SPACING object:
   - XS: 4, SM: 8, MD: 16, LG: 20, XL: 24, XXL: 32, XXXL: 48
2. Create src/constants/zIndex.js with Z_INDEX layers:
   - BASE: 1, DROPDOWN: 1000, MODAL: 9999, TOAST: 10000
3. Update 20-30 files to use these constants
4. Create tests: src/constants/__tests__/spacing.test.js
5. Create tests: src/constants/__tests__/zIndex.test.js

CONSTRAINTS:
- Only modify files with 3+ instances of magic numbers
- Preserve existing functionality (behavior-preserving refactor)
- Add JSDoc comments explaining each constant
- Run 'npm run typecheck' to validate changes

DELIVERABLES:
Return a summary with:
- Number of files modified
- Number of magic numbers extracted
- List of new constant files created
- Test coverage for new constants
```

### Agent 2 Prompt:
```
You are Agent 2: Color & Theme Constants Extractor.

Your task is to extract hardcoded color values from inline styles and move them to semantic theme constants.

RESEARCH PHASE:
1. Search for hex color codes (#RRGGBB) in inline styles
2. Search for rgba() color values
3. Identify semantic groups (grays, errors, success, warnings, info)
4. Look for repeated color values across components

IMPLEMENTATION PHASE:
1. Create src/constants/colors.js with COLORS object:
   - Grays: GRAY_50 through GRAY_900
   - Semantic: PRIMARY, SECONDARY, ERROR, WARNING, SUCCESS, INFO
   - Text: TEXT_PRIMARY, TEXT_SECONDARY, TEXT_DISABLED
   - Borders: BORDER_LIGHT, BORDER_DARK
2. Document each color with HSL/RGB values in comments
3. Update 15-25 files to use color constants
4. Create tests: src/constants/__tests__/colors.test.js

CONSTRAINTS:
- Preserve exact color values (no color changes)
- Group by semantic meaning (not arbitrary names)
- Only extract colors used 2+ times
- Add JSDoc comments with use cases

DELIVERABLES:
Return a summary with:
- Number of unique colors extracted
- Number of files modified
- Color palette documentation
- Test coverage report
```

### Agent 3 Prompt:
```
You are Agent 3: JSDoc & String Literal Extractor.

Your task is to add JSDoc documentation to undocumented functions and extract repeated string literals.

RESEARCH PHASE:
1. Find functions missing JSDoc comments (use grep for 'export const' and 'export function')
2. Identify complex functions (>20 lines) without documentation
3. Search for repeated string literals (error messages, user-facing text)
4. Look in: src/utils/, src/services/, src/components/

IMPLEMENTATION PHASE:
1. Add JSDoc to 30-50 functions:
   - Add @description for function purpose
   - Add @param tags with types
   - Add @returns tag with type
   - Add @throws if applicable
2. Create src/constants/messages.js with MESSAGE groups:
   - ERROR_MESSAGES: Object with error keys
   - SUCCESS_MESSAGES: Success feedback
   - VALIDATION_MESSAGES: Form validation
3. Extract 20-40 repeated strings
4. Update files to use constants

CONSTRAINTS:
- Focus on public/exported functions first
- JSDoc must be accurate (not generic)
- Only extract strings used 2+ times
- Preserve existing error handling behavior

DELIVERABLES:
Return a summary with:
- Number of functions documented
- Number of string literals extracted
- List of files with JSDoc added
- Examples of improved documentation
```

---

## Parallel Execution Command

Use the Task tool with 3 invocations in a single message:

```javascript
// Agent 1: Layout & Spacing
Task({
  subagent_type: "developer",
  description: "Extract layout spacing constants",
  prompt: "[Agent 1 Prompt from above]"
})

// Agent 2: Color & Theme
Task({
  subagent_type: "developer",
  description: "Extract color theme constants",
  prompt: "[Agent 2 Prompt from above]"
})

// Agent 3: JSDoc & Strings
Task({
  subagent_type: "developer",
  description: "Add JSDoc and extract strings",
  prompt: "[Agent 3 Prompt from above]"
})
```

---

## Success Criteria

**Code Smells:**
- Target: 700-900 (from ~1,100-1,200)
- Reduction: -300 to -500 smells

**Quality Metrics:**
- ✅ All new constants have tests
- ✅ TypeScript type checking passes
- ✅ Zero breaking changes
- ✅ Existing tests still pass
- ✅ JSDoc coverage on 30-50 functions

**Deliverables:**
- 6 new constant files (spacing, zIndex, colors, messages + 4 test files)
- 50-80 files updated with constants
- 30-50 functions documented with JSDoc
- Complete summary report from each agent

---

## Integration Phase (After Agents Complete)

**Consolidation (5-10 min):**
1. Review agent outputs for conflicts
2. Ensure no duplicate constants across files
3. Run full test suite: `npm test`
4. Run type checking: `npm run typecheck`
5. Run lint: `npm run lint`

**Deployment:**
1. Update PENDING_CHANGES.md with combined summary
2. Run `./scripts/qual_deploy.sh`
3. Verify deployment success

---

## Risk Assessment

**Low Risk:**
- All changes are behavior-preserving refactors
- Constants extracted from existing values
- JSDoc is additive (no logic changes)

**Mitigation:**
- Each agent runs type checking before returning
- Full test suite run during integration
- Deployment script validates build

---

## Expected Timeline

- **Agent 1:** 15-20 min (spacing/zIndex constants)
- **Agent 2:** 15-20 min (color constants)
- **Agent 3:** 20-25 min (JSDoc + strings)
- **Integration:** 5-10 min (review + test)
- **Total:** 55-75 min (within Atlas Standard 30-60 min if agents run in parallel)

---

## Notes for Execution

1. **Use Claude's capability to call multiple tools in a single response** - Launch all 3 agents simultaneously
2. **Each agent works independently** - No file conflicts expected (different target files)
3. **Agents should NOT deploy** - Return results only, human integrates
4. **Agents should include file paths and line counts** in summaries

---

## Post-Execution: Phase 3 Planning

If successful, Phase 3 could tackle:
- Split large files (App.js, DataModal.js)
- Extract repeated JSX patterns into components
- Simplify complex functions with early returns
- Add unit tests for uncovered utils

**Target:** <500 code smells (SonarCloud gold standard)
