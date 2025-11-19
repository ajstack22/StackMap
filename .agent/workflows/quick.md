---
description: Quick 2-phase workflow for trivial changes - typos, colors, config updates (5-15 min)
---

# Quick Workflow

**Perfect for:**

- UI text changes (typos, copy updates)
- Color/style tweaks (single value changes)
- Simple configuration updates
- Documentation fixes
- Single-line bug fixes

## Phase 1: Make Change

1. **Locate the code**

   - Use `grep_search` or `find_by_name` to find the relevant files.

2. **Make the change**

   - Update the single value/line.
   - Keep it simple. If it gets complex, switch to the **Standard** workflow.

3. **Verify locally**
   - Verify the change makes sense.
   - Check for typos.

### Rules

- ✅ Make ONE focused change
- ✅ Keep it under 5 minutes
- ❌ Do NOT change multiple unrelated things
- ❌ Do NOT add new logic

### StackMap Conventions

- **Field naming**: Use `text` and `icon` (not `name`/`emoji`).
- **Colors**: No gray text (`#000000` only).
- **Typography**: Use `<Typography>` component where possible.

## Phase 2: Deploy

1. **Update PENDING_CHANGES.md**

   - Add a brief entry describing your change.

2. **Deploy**

   - Run the deployment script.

   // turbo

   ```bash
   ./scripts/deploy.sh qual --all
   ```

3. **Verify**
   - Ensure the deployment script completes successfully.
