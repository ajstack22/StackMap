# Documentation Audit & Cleanup Prompt

## Purpose
Use this prompt to systematically evaluate and clean up documentation folders to ensure they provide accurate, current information without polluting LLM context with obsolete or misleading content.

## Prompt Template

---

Please evaluate all documentation files in the `/docs/troubleshooting` base directory and ensure they are current based on the actual codebase implementation. I want to make sure there isn't obsolete or incorrect information muddying up LLM context.

Please follow this systematic process:

### Phase 1: Discovery & Analysis

1. **List all files** in the target directory
2. **Create a todo list** to track your review of each file
3. For each document, evaluate:
   - Is the content still relevant to the current codebase?
   - Does it describe features/architectures that actually exist?
   - Are code examples and patterns still valid?
   - Does it reference the correct technology stack?
   - Are file paths and structure references accurate?

### Phase 2: Validation Against Codebase

For each document, verify claims by:
1. **Check if referenced files/components exist** using Grep/Glob
2. **Verify code patterns** are actually used in the codebase
3. **Confirm technology stack** matches package.json and actual imports
4. **Validate data structures** against actual implementation
5. **Test if procedures/scripts** mentioned still work

### Phase 3: Categorization

Classify each document into one of these categories:

#### DELETE (Completely Obsolete)
- Describes removed features or abandoned architectures
- References wrong technology stack (e.g., Capacitor when using React Native)
- Planning/research documents for completed decisions
- Historical documents with no current value
- Completely incorrect implementation details

#### UPDATE (Partially Incorrect)
- Core concepts valid but details outdated
- Correct patterns but wrong specifics
- Missing recent changes or refactors
- Needs disclaimer about being guidelines vs requirements
- Contains mix of current and obsolete information

#### KEEP (Still Valuable)
- Accurately describes current implementation
- Provides valuable context or history
- Contains migration/compatibility information
- Documents important decisions or tradeoffs
- Meta-documentation (like audit reports)

### Phase 4: Create Evaluation Report

Create an evaluation report (`[FOLDER_NAME]_EVALUATION.md`) containing:

1. **Executive Summary**
   - Percentage of obsolete documentation
   - Main types of issues found
   - Impact on LLM context

2. **Files to DELETE**
   - List each file with:
     - Brief description of what it documents
     - Why it's obsolete
     - What confusion it might cause

3. **Files to UPDATE**
   - List each file with:
     - What's incorrect
     - What needs updating
     - Priority level (High/Medium/Low)

4. **Files to KEEP**
   - List valuable documents
   - Why they're still relevant

5. **Recommendations**
   - Immediate actions (delete obsolete files)
   - Short-term updates needed
   - Long-term documentation improvements

### Phase 5: Execute Recommendations

After review, execute on the recommendations:

1. **Delete obsolete files** immediately
2. **Update incorrect files** with:
   - Disclaimers where appropriate (e.g., "These are guidelines, not requirements")
   - Corrected information
   - References to current documentation
3. **Create new documentation** if needed:
   - Current architecture overview
   - Updated implementation guides
   - Correct data structures

### Phase 6: Verification

After cleanup:
1. List remaining files
2. Confirm obsolete content is removed
3. Note any files that need future attention

## Key Areas to Check

### Technology Stack Mismatches
- Web-only vs React Native
- Capacitor vs React Native
- Old build systems vs current
- Deprecated dependencies

### Architectural Discrepancies
- Monolithic vs modular stores
- Old component hierarchies
- Removed services or features
- Changed data flows

### Implementation Differences
- Code patterns no longer used
- Incorrect file paths
- Wrong data structures
- Obsolete API endpoints

### Process/Workflow Issues
- Outdated deployment procedures
- Old testing approaches
- Removed scripts or tools
- Changed development workflows

## Common Red Flags

Look for these indicators of obsolete documentation:

1. **Technology References**
   - "browser", "HTML", "DOM" in a React Native app
   - "Capacitor", "Cordova" when not in package.json
   - Build tools not in current setup

2. **File Paths**
   - References to non-existent directories
   - Old file naming conventions
   - Moved or renamed components

3. **Data Structures**
   - Fields that don't exist in current stores
   - Old state management patterns
   - Deprecated data formats

4. **Features**
   - Functionality that was planned but never built
   - Removed features still documented
   - Different implementation than described

5. **Dates/Versions**
   - Documents marked with old dates
   - Version numbers that don't match
   - "TODO" or "PLANNED" for old items

## Sample Usage

```
Please evaluate all documentation files in the `/docs/deployment` directory and ensure they are current based on the actual codebase implementation. I want to make sure there isn't obsolete or incorrect information muddying up LLM context.
```

## Expected Outcomes

After using this prompt, you should have:
1. ✅ Removed all obsolete documentation
2. ✅ Updated partially incorrect files
3. ✅ Clear evaluation report for future reference
4. ✅ Documentation that accurately reflects current implementation
5. ✅ Improved LLM context quality

## Tips for Effective Audits

1. **Be aggressive about deletion** - Obsolete docs are worse than no docs
2. **Check actual code** - Don't trust documentation claims
3. **Look for patterns** - Similar issues often appear across files
4. **Consider the reader** - Will an LLM be misled by this?
5. **Document your changes** - The evaluation report helps future audits

---

## Folders to Audit

Priority order for documentation cleanup:

1. `/docs/architecture` ✅ (Completed Aug 23, 2025)
2. `/docs/platform` ✅ (Completed Aug 23, 2025)
3. `/docs/deployment` ✅ (Completed Aug 23, 2025)
4. `/docs/features` ✅ (Completed Aug 23, 2025)
5. `/docs/sync` ✅ (Completed Aug 23, 2025)
6. `/docs/testing` - ✅ (Completed Aug 23, 2025)
7. `/docs/onboarding` ✅ (Completed Aug 23, 2025)
8. `/docs/troubleshooting` next

Use this prompt for each folder to ensure comprehensive cleanup.