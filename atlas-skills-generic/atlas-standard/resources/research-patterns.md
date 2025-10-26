# Research Patterns for Standard Workflow

## Quick Command Reference

### Finding Files

```bash
# Find files by name pattern
find src/ -name "*pattern*"
find src/ -name "*Component*"

# Find files containing text
grep -r "functionName" src/
grep -r "ComponentName" src/

# Find imports of a module
grep -r "import.*ModuleName" src/

# Find usage of a specific function
grep -r "\.functionName\(" src/
```

### Understanding Component Usage

```bash
# Find where a component is imported
grep -r "import.*ComponentName" src/

# Find where a component is used
grep -r "<ComponentName" src/
grep -r "ComponentName\(" src/

# Find prop usage
grep -r "propName=" src/components/
```

### Finding State/Store Usage

```bash
# Find state management usage (adapt to your system)
grep -r "useState" src/
grep -r "useContext" src/
grep -r "useDispatch\|useSelector" src/  # Redux
grep -r "useStore" src/  # Zustand

# Find specific state updates
grep -r "setState\|dispatch\|mutate" src/
```

### Platform-Specific Code

```bash
# Find platform-specific files (if multi-platform)
find src/ -name "*.web.js"
find src/ -name "*.mobile.js"
find src/ -name "*.native.js"

# Find platform detection code
grep -r "platform" src/ -i
grep -r "userAgent" src/
```

## Research Patterns by Task Type

### Pattern 1: Bug Fix Research

**Goal**: Understand the bug and find all affected code

**Steps:**
1. **Reproduce the bug** (if possible)
   - Note the exact steps to trigger
   - Observe the error message/behavior
   - Check console/logs for errors

2. **Find the entry point**
   ```bash
   # Search for error messages
   grep -r "exact error text" src/

   # Search for the component/module where bug occurs
   grep -r "ModuleName\|ComponentName" src/
   ```

3. **Trace the data flow**
   - Where does the data come from? (API? Store? Props?)
   - Where is it transformed?
   - Where is it used?

4. **Find similar patterns**
   - How is this handled elsewhere?
   - Are there similar bugs already fixed?
   ```bash
   git log --grep="similar bug" --oneline
   ```

**Example: "User profile fails to load"**
```bash
# 1. Find profile-related code
grep -r "profile\|Profile" src/

# 2. Find API call
grep -r "api.*profile\|fetch.*profile" src/

# 3. Find state management
grep -r "profile" src/store/ src/state/

# 4. Check for error handling
grep -r "catch\|error" src/services/api/profileService.js

# Result: Found missing error handling in profileService.js
```

---

### Pattern 2: Feature Addition Research

**Goal**: Understand where to add the feature and what patterns to follow

**Steps:**
1. **Find similar features**
   ```bash
   # If adding "modal dialog", find existing modals
   grep -r "Modal\|Dialog" src/components/

   # If adding "button", find existing button patterns
   grep -r "Button" src/components/
   ```

2. **Understand the pattern**
   - How are similar features structured?
   - What props/parameters do they accept?
   - How do they integrate with state/data?

3. **Identify integration points**
   - Where will this feature be used?
   - What data does it need?
   - What actions does it trigger?

**Example: "Add confirmation dialog before delete"**
```bash
# 1. Find existing confirmation patterns
grep -r "confirm\|Confirm" src/

# 2. Find delete functionality
grep -r "delete\|Delete\|remove\|Remove" src/

# 3. Check how confirmations are currently handled
grep -r "window.confirm\|confirmDialog" src/

# Result: Found ConfirmDialog component in /src/components/common/
# Usage pattern: Show dialog → User confirms → Execute action
```

---

### Pattern 3: Refactoring Research

**Goal**: Understand the current implementation before refactoring

**Steps:**
1. **Map the current structure**
   ```bash
   # Find all files in the module
   find src/services/module/ -type f

   # Find all imports of the module
   grep -r "import.*module" src/
   ```

2. **Understand dependencies**
   ```bash
   # What does this module import?
   grep "^import" src/services/module/index.js

   # What imports this module?
   grep -r "from.*module" src/
   ```

3. **Find all usage points**
   ```bash
   # Find all calls to functions in this module
   grep -r "moduleName\.\w\+(" src/
   ```

4. **Check for tests**
   ```bash
   find tests/ -name "*module*"
   find src/ -name "*.test.js" -o -name "*.spec.js" | xargs grep -l "module"
   ```

**Example: "Refactor API service into smaller modules"**
```bash
# 1. Find API service files
find src/services/api/ -type f

# 2. Find all imports
grep -r "import.*apiService" src/

# 3. Find all function calls
grep -r "apiService\.\w\+(" src/

# 4. Check tests
grep -r "apiService" tests/

# Result: apiService.js has 20 functions, used in 12 files
# Plan: Split into userApi.js, productApi.js, authApi.js
```

---

### Pattern 4: Platform-Specific Research

**Goal**: Understand platform differences before making changes

**Steps:**
1. **Check for platform-specific files**
   ```bash
   # Find platform splits
   find src/ -name "*.web.js" -o -name "*.native.js" -o -name "*.mobile.js"

   # Find the specific component
   find src/ -name "ComponentName.*"
   ```

2. **Find platform detection code**
   ```bash
   grep -r "platform\|Platform" src/components/ComponentName.js
   grep -r "userAgent\|navigator" src/
   ```

3. **Check documentation for platform gotchas**
   - Review project docs for platform-specific rules
   - Check for known issues or limitations

4. **Test on all platforms if shared code**

**Example: "Update responsive layout"**
```bash
# 1. Find layout component files
find src/components/ -name "*Layout*"

# Result: Layout.js (shared), Layout.web.js, Layout.mobile.js

# 2. Check for responsive code
grep -r "media\|breakpoint\|responsive" src/components/Layout*

# 3. Check for platform detection
grep -r "width\|height\|dimensions" src/components/Layout*

# Decision: Need to update both web and mobile-specific files
```

---

### Pattern 5: State Management Research

**Goal**: Understand state management before modifying

**Steps:**
1. **Identify state management system**
   ```bash
   # Check package.json for clues
   grep "redux\|zustand\|mobx\|recoil" package.json

   # Find state management files
   find src/ -name "*store*" -o -name "*state*" -o -name "*reducer*"
   ```

2. **Find state definition**
   ```bash
   # Find where state is defined
   grep -r "createStore\|createSlice\|atom\|signal" src/

   # Find state usage
   grep -r "useSelector\|useStore\|useState" src/
   ```

3. **Find update methods**
   ```bash
   # Find how state is updated
   grep -r "dispatch\|setState\|mutate" src/

   # Find specific update patterns
   grep -r "action\|reducer" src/
   ```

4. **Check for selectors/getters**
   ```bash
   # Find data access patterns
   grep -r "selector\|getter\|compute" src/
   ```

**Example: "Update user preferences"**
```bash
# 1. Find state management
ls src/store/ src/state/

# 2. Find preferences state
grep -r "preferences\|Preferences" src/store/

# 3. Find update methods
grep -r "updatePreferences\|setPreferences" src/

# 4. Find usage
grep -r "usePreferences\|preferences" src/

# Result: Use userStore.updatePreferences(newPrefs)
```

---

## Generic Research Checklists

### For Data/State Changes:

- [ ] Which state management system? (Redux, Zustand, Context, etc.)
- [ ] Which update pattern to use?
- [ ] Are there naming conventions?
- [ ] Need validation or normalization?
- [ ] Backward compatibility needed?

### For UI Changes:

- [ ] Component library being used?
- [ ] Design system guidelines?
- [ ] Accessibility requirements?
- [ ] Responsive design considerations?
- [ ] Browser/platform compatibility?

### For API/Backend Changes:

- [ ] Authentication patterns?
- [ ] Error handling conventions?
- [ ] Data validation requirements?
- [ ] Rate limiting considerations?
- [ ] Caching strategy?

### For Cross-Platform Changes:

- [ ] Platform-specific files?
- [ ] Platform detection needed?
- [ ] Feature detection vs browser detection?
- [ ] Polyfills or fallbacks needed?
- [ ] Testing on all target platforms?

---

## Advanced Research Techniques

### Git History Research

```bash
# Find when a file was last changed
git log --oneline -- src/path/to/file.js

# Find commits related to a feature
git log --grep="feature name" --oneline

# See what changed in a specific commit
git show COMMIT_HASH

# Find who changed a specific line (blame)
git blame src/path/to/file.js | grep "specific code"

# Find when a bug was introduced (bisect)
git bisect start
git bisect bad HEAD
git bisect good LAST_KNOWN_GOOD_COMMIT
# Test each commit until bug found
```

### Dependency Research

```bash
# Find what a file imports
head -50 src/path/to/file.js | grep "^import"

# Find what imports a specific module
grep -r "import.*ModuleName" src/

# Check package.json for dependencies
grep "package-name" package.json

# Check if a package is actually used
grep -r "packageName" src/

# Find unused dependencies
npx depcheck
```

### Performance Research

```bash
# Find console statements (shouldn't be in production)
grep -r "console\.\(log\|warn\|error\)" src/

# Find large files
find src/ -type f -exec wc -l {} \; | sort -rn | head -20

# Find duplicate code patterns
grep -r "function functionName" src/ | wc -l

# Find TODO/FIXME comments
grep -r "TODO\|FIXME\|HACK" src/
```

### Security Research

```bash
# Find potential security issues
grep -r "eval\|innerHTML\|dangerouslySetInnerHTML" src/

# Find hardcoded secrets (be careful!)
grep -r "password\|secret\|api_key\|token" src/ | grep -v "node_modules"

# Find SQL queries (check for injection risks)
grep -r "SELECT\|INSERT\|UPDATE\|DELETE" src/

# Find file system operations
grep -r "fs\.\|readFile\|writeFile" src/
```

---

## Research Output Template

After research, document your findings:

```markdown
## Research Findings

### Files to Modify:
- /path/to/file1.js - [what needs to change]
- /path/to/file2.js - [what needs to change]
- /path/to/test.js - [new tests needed]

### Current Implementation:
[Brief description of how it currently works]

### Patterns Found:
[Similar implementations or patterns to follow]

### Dependencies:
- External: [npm packages, APIs, etc.]
- Internal: [modules, components, utilities]

### Potential Issues:
- [Risk or consideration 1]
- [Risk or consideration 2]

### Platform Considerations:
[Any platform-specific notes, if applicable]

### State Management:
- System: [Redux, Context, etc.]
- Update pattern: [how to update state]
- Naming: [conventions to follow]
```

---

## When to Stop Researching

**Research is complete when you can answer:**
1. Which files need to change?
2. What needs to change in each file?
3. What pattern/approach to follow?
4. What tests to add?
5. What edge cases to consider?
6. What risks exist?

**Time box**: If research takes > 15 minutes for a Standard workflow task, consider:
- Breaking into smaller tasks
- Escalating to Full workflow
- Asking for help/guidance

---

## Common Research Mistakes

### Mistake 1: Incomplete Research
**Problem**: Jumping to implementation without understanding the full scope

**Solution**: Use the checklists above, don't skip steps

### Mistake 2: Over-Research
**Problem**: Spending too long researching instead of implementing

**Solution**: Time-box research to 10-15 minutes, start implementing with what you know

### Mistake 3: Not Checking for Existing Patterns
**Problem**: Reinventing solutions that already exist in the codebase

**Solution**: Always grep for similar features first

### Mistake 4: Ignoring Tests
**Problem**: Not checking existing tests or test patterns

**Solution**: Always find and review relevant tests during research

---

Use these patterns as starting points. Adapt based on your specific project structure and needs!
