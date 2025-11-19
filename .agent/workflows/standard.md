---
description: Standard 5-phase workflow for most development tasks - bugs, small features, refactors (30-60 min)
---

# Standard Workflow

**Perfect for (80% of tasks):**

- Bug fixes (2-5 files affected)
- Small features (clear requirements)
- Code refactoring
- Test additions
- Logic changes with moderate complexity

## Phase 1: Research

1. **Find related files**

   - Use `grep_search` to find relevant code patterns and component usage.

2. **Understand implementation**

   - Read the main files involved.
   - Trace data flow and identify dependencies.
   - Note platform-specific code (iOS vs Android vs Web).

3. **Identify impacts**
   - Which stores are affected? (`useUserStore`, `useSettingsStore`, etc.)
   - Verify field naming conventions (`text`/`icon`).
   - Check `CLAUDE.md` for platform gotchas.

## Phase 2: Plan

1. **Design solution**

   - Create a plan for your changes.
   - List the files you will modify.

2. **StackMap Planning Rules**
   - **Stores**: Use store-specific methods (e.g., `useUserStore.getState().setUsers()`), NEVER `useAppStore.setState`.
   - **Fields**: Read with fallbacks (`text || name`, `icon || emoji`), write canonical (`text`, `icon`).
   - **Platform**: Ensure shared code works on iOS, Android, and Web.

## Phase 3: Implement

1. **Implement changes**

   - Make changes file-by-file.
   - Add comments for complex logic.

2. **Update tests**

   - Add or update tests for new functionality.
   - Ensure edge cases are covered.

3. **Verify locally**

   - Run type checking and tests.

   ```bash
   npm run typecheck
   npm test
   ```

## Phase 4: Review

**Self-Review Checklist:**

- [ ] **Store Updates**: Used `useUserStore.getState().setUsers()` (not `useAppStore.setState`).
- [ ] **Field Naming**: Used `text`/`icon` (not `name`/`emoji`).
- [ ] **Fallbacks**: Included fallbacks when reading fields.
- [ ] **Typography**: Used `Typography` component (not direct fontWeight).
- [ ] **Colors**: No gray text (use `#000`).
- [ ] **Platform**: Shared code works on all platforms.
- [ ] **Tests**: Tests pass and cover edge cases.

## Phase 5: Deploy

1. **Update PENDING_CHANGES.md**

   - Add a clear title and list of changes.

2. **Deploy**

   - Run the deployment script.

   // turbo

   ```bash
   ./scripts/deploy.sh qual --all
   ```

3. **Verify**
   - Check deployment output for errors.
   - Ensure version incremented.
