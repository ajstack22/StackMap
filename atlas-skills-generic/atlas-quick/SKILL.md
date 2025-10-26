---
name: atlas-quick
description: Quick 2-phase workflow for trivial changes - typos, colors, config updates (5-15 min)
---

# Atlas Quick Workflow

## When to Use This Skill

**Perfect for:**
- UI text changes (typos, copy updates)
- Color/style tweaks (single value changes)
- Simple configuration updates
- Documentation fixes
- Single-line bug fixes

**Time estimate**: 5-15 minutes

**Success criteria**:
- Change deployed in < 15 minutes
- Tests pass
- No rollbacks

## The 2 Phases

```
Phase 1: Make Change  → Locate, change, verify
Phase 2: Deploy       → Test + deploy via your deployment process
```

---

## Phase 1: Make Change

**Goal**: Locate the code, make the change, verify locally.

### Steps:

1. **Locate the code**
   ```bash
   # Find file by name
   find src/ -name "*filename*"

   # Find file by content
   grep -r "text to find" src/
   ```

2. **Make the change**
   - Update the single value/line
   - Keep it simple - if it's getting complex, escalate to Iterative or Standard

3. **Verify locally**
   - If UI change: Check visually
   - If config: Verify value makes sense
   - If text: Check for typos

### Quick Workflow Rules:

**DO:**
- ✅ Make ONE focused change
- ✅ Verify change is visible/working
- ✅ Keep it under 5 minutes

**DON'T:**
- ❌ Change multiple unrelated things
- ❌ Add new logic
- ❌ Modify multiple files
- ❌ Skip verification

### Project-Specific Considerations:

Even for quick changes, follow your project conventions:

**Check for `.atlas/conventions.md`:**
If your project has this file, review relevant sections:
- Field naming conventions
- Code style requirements
- Design system rules
- Platform-specific gotchas

**Common conventions to verify:**
```javascript
// Example: Field naming (customize for your project)
// ✅ Use project's standard field names
user.displayName = "John"

// ❌ Don't use deprecated field names
user.username = "John"  // If your project prefers displayName

// Example: Colors (customize for your project)
// ✅ Use project's color system
color: theme.colors.primary

// ❌ Don't use hard-coded colors if project has theme system
color: '#007AFF'

// Example: Typography (customize for your project)
// ✅ Use project's typography component
<Typography variant="body">Hello</Typography>

// ⚠️ Acceptable for quick change if no typography system
<Text style={{ fontFamily: 'System' }}>Hello</Text>
```

### Examples:

**Example 1: Fix typo**
```javascript
// Before
<Text>Wellcome to our app</Text>

// After
<Text>Welcome to our app</Text>
```

**Example 2: Change color**
```javascript
// Before
backgroundColor: '#0000FF'  // Bright blue

// After
backgroundColor: '#007AFF'  // iOS blue
```

**Example 3: Update timeout**
```javascript
// Before
const API_TIMEOUT = 30000  // 30 seconds

// After
const API_TIMEOUT = 60000  // 60 seconds
```

---

## Phase 2: Deploy

**Goal**: Run tests and deploy via your deployment process.

### Steps:

1. **Update your changelog/release notes**

   If your project uses a changelog file (e.g., `CHANGELOG.md`, `PENDING_CHANGES.md`):
   ```markdown
   ## Title: Fix welcome message typo
   ### Changes Made:
   - Fixed typo: "Wellcome" → "Welcome"
   ```

2. **Run quick validation**

   Adjust commands based on your project:
   ```bash
   # Type checking (if using TypeScript)
   npm run typecheck
   # OR
   tsc --noEmit

   # Linting (if configured)
   npm run lint
   # OR
   eslint src/

   # If tests are fast enough, run them
   npm test
   ```

3. **Deploy using your project's deployment script**

   Replace with your actual deployment command:
   ```bash
   # Examples (use your project's command):
   npm run deploy:dev
   # OR
   ./scripts/deploy.sh dev
   # OR
   make deploy-dev
   # OR
   git push origin develop
   ```

### Deployment Checklist:

**Pre-deployment:**
- [ ] Changelog/release notes updated (if applicable)
- [ ] Type checking passes (if applicable)
- [ ] Linting passes (if applicable)
- [ ] Change verified locally

**Deployment:**
- [ ] Use your project's deployment script (not manual commit)
- [ ] Deploy to dev/staging environment first
- [ ] Check deployment output for errors

**Post-deployment:**
- [ ] No errors in deployment output
- [ ] Change visible in deployed environment
- [ ] Tests pass (if run by deployment script)

### When to Skip Tests:

For truly trivial changes (typos, doc updates), you MAY skip running tests locally if:
- ✅ Change is pure text/documentation
- ✅ No code logic affected
- ✅ Deployment script will run tests anyway

**However**: If your deployment script runs tests, they'll catch any issues regardless.

---

## Escalation Criteria

**Escalate to Iterative workflow if:**
- Change works but you want peer validation
- Making multiple related changes
- Want quality review cycle

**Escalate to Standard workflow if:**
- Change affects multiple files
- Tests fail (need to add new tests)
- Edge cases emerge during implementation
- Not sure if change is correct

### How to Escalate:

```
"Escalating to [Iterative|Standard] workflow. [REASON]"
```

Then restart from Phase 1 of new tier.

---

## Common Quick Workflow Tasks

### 1. Text Changes

**Use case**: Fix typos, update copy, change labels

**Pattern**:
```bash
# Find the text
grep -r "old text" src/

# Change it
# (Update in editor)

# Verify
# (Visual check in app)

# Deploy
[your deployment command]
```

**Time**: 5-10 minutes

---

### 2. Color Changes

**Use case**: Update colors, adjust styles

**Pattern**:
```bash
# Find color usage
grep -r "#0000FF" src/

# Change it
backgroundColor: '#007AFF'

# Verify colors follow design system
# Deploy
[your deployment command]
```

**Time**: 5-10 minutes

---

### 3. Config Updates

**Use case**: Change timeouts, URLs, feature flags

**Pattern**:
```bash
# Find config
grep -r "TIMEOUT" src/config/

# Change value
const API_TIMEOUT = 60000

# Verify value makes sense
# Deploy
[your deployment command]
```

**Time**: 5 minutes

---

### 4. Documentation Updates

**Use case**: Update README, comments, docs

**Pattern**:
```bash
# Update documentation file directly
# No tests needed for pure docs

# Deploy
[your deployment command]
```

**Time**: 5 minutes

---

## Anti-Patterns (Don't Do This)

### ❌ Anti-Pattern 1: Making Multiple Changes

```
"Fix typo in welcome text AND update button color AND adjust padding"
```

**Problem**: No longer a quick change. Each change has different risk.

**Solution**: Escalate to Iterative or make separate Quick changes.

---

### ❌ Anti-Pattern 2: Adding Logic

```
"Change timeout from 30s to 60s AND add retry logic"
```

**Problem**: "Add retry logic" is not trivial.

**Solution**: Escalate to Standard workflow.

---

### ❌ Anti-Pattern 3: Modifying Multiple Files

```
"Update button text in 5 components"
```

**Problem**: Multiple files = higher risk, needs review.

**Solution**: Escalate to Standard workflow (or make 5 separate Quick changes if truly independent).

---

### ❌ Anti-Pattern 4: Skipping Verification

```
Make change → Deploy immediately without checking
```

**Problem**: Might deploy broken change.

**Solution**: Always verify locally first.

---

## Quick Workflow Checklist

Use this checklist for every Quick workflow:

### Phase 1: Make Change
- [ ] Found the file quickly (< 2 minutes)
- [ ] Change is ONE focused thing
- [ ] No logic changes
- [ ] No new files created
- [ ] Verified change locally
- [ ] Project conventions followed (check `.atlas/conventions.md`)

### Phase 2: Deploy
- [ ] Changelog/release notes updated (if applicable)
- [ ] Type checking passes (if ran)
- [ ] Deployed using project's deployment script
- [ ] No deployment errors
- [ ] Change visible in environment

### Red Flags (Escalate if ANY are true):
- ⚠️ Took > 5 minutes to locate code
- ⚠️ Need to modify multiple files
- ⚠️ Tests failing
- ⚠️ Not sure if change is correct
- ⚠️ Need to add new logic
- ⚠️ Cross-platform implications

---

## Example: Complete Quick Workflow

### Task: "Fix typo in error message"

#### Phase 1: Make Change (3 minutes)

**Step 1: Locate**
```bash
grep -r "Opertaion faild" src/
# Found: src/services/api/apiClient.js:142
```

**Step 2: Change**
```javascript
// Before (line 142)
throw new Error('Opertaion faild due to network error')

// After
throw new Error('Operation failed due to network error')
```

**Step 3: Verify**
```bash
# Quick type check (if applicable)
npm run typecheck
# ✅ Pass
```

#### Phase 2: Deploy (2 minutes)

**Step 1: Update changelog (if applicable)**
```markdown
## Title: Fix typo in API error message
### Changes Made:
- Fixed typo: "Opertaion faild" → "Operation failed"
```

**Step 2: Deploy**
```bash
npm run deploy:dev

# Output:
# ✅ Linting: Pass
# ✅ Type checking: Pass
# ✅ Tests: Pass (15/15)
# ✅ Build: Success
# ✅ Deployed: dev.example.com
```

**Total time: 5 minutes** ✅

---

## When NOT to Use Quick Workflow

**Don't use Quick if:**
- Change affects > 1 file → Use **Iterative or Standard**
- Need to add tests → Use **Standard**
- Not sure about impact → Use **Standard**
- Security-related → Use **Standard or Full**
- Cross-platform concerns → Use **Standard**
- Need review/validation → Use **Iterative**

**Default rule**: When in doubt, use Standard workflow instead.

---

## Success Indicators

### You've succeeded when:
- ✅ Deployed in < 15 minutes
- ✅ Tests pass (if ran)
- ✅ No rollbacks needed
- ✅ Change works as expected
- ✅ No side effects

### You should have escalated if:
- ⚠️ Took > 15 minutes
- ⚠️ Found edge cases
- ⚠️ Tests failed
- ⚠️ Needed to change multiple files
- ⚠️ Uncertain about correctness

---

## Quick Reference

### Quick Workflow Commands:
```bash
# Find code
grep -r "search term" src/
find src/ -name "*filename*"

# Verify (adjust for your project)
npm run typecheck    # Type checking
npm run lint         # Linting
npm test             # Tests

# Deploy (use your project's command)
[your deployment command]
```

### Time Allocation:
- **Phase 1**: 3-10 minutes (locate + change + verify)
- **Phase 2**: 2-5 minutes (deploy)
- **Total**: 5-15 minutes

### Decision:
- **1 file, trivial, no logic** → Quick ✅
- **2+ files, validation needed** → Iterative
- **Logic changes, tests needed** → Standard

---

## Customization for Your Project

To customize this workflow for your project:

1. **Create `.atlas/conventions.md`** with your standards
2. **Update deployment commands** in Phase 2 to match your scripts
3. **Adjust validation commands** to match your tooling
4. **Define your changelog format** (if using one)
5. **Document platform-specific rules** (if applicable)

Example `.atlas/conventions.md` section for Quick workflow:
```markdown
## Quick Workflow Conventions

### Deployment
- Command: `./deploy.sh dev`
- Always update: `CHANGELOG.md`
- Pre-deployment: Run `npm run lint && npm test`

### Code Style
- Use ESLint config (no manual formatting)
- Field naming: camelCase for JS, snake_case for DB
- Colors: Only use values from `src/theme/colors.js`

### When to Escalate
- If touching > 1 file
- If tests fail
- If change affects API contracts
```

---

## Summary

The Quick workflow is for **trivial changes only**. It's fast because:
- No research phase (you know where the code is)
- No planning phase (change is obvious)
- No review phase (tests cover it)

**Use it often** for small fixes, but **escalate quickly** if anything feels non-trivial.

Remember: It's better to start with Quick and escalate than to skip phases in Standard workflow.
