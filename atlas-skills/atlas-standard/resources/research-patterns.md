# Research Patterns for Standard Workflow

## Quick Command Reference

### Finding Files

```bash
# Find files by name pattern
find src/ -name "*sync*"
find src/ -name "*Activity*"

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

# Find where a component is used in JSX
grep -r "<ComponentName" src/

# Find prop usage
grep -r "propName=" src/components/
```

### Finding State/Store Usage

```bash
# Find store usage
grep -r "useAppStore" src/
grep -r "useUserStore" src/
grep -r "useSettingsStore" src/
grep -r "useLibraryStore" src/

# Find specific store method calls
grep -r "setUsers(" src/
grep -r "updateSettings(" src/
```

### Platform-Specific Code

```bash
# Find platform-specific files
find src/ -name "*.native.js"
find src/ -name "*.web.js"
find src/ -name "*.ios.js"
find src/ -name "*.android.js"

# Find Platform.OS checks
grep -r "Platform\.OS ===" src/
grep -r "Platform\.select" src/
```

## Research Patterns by Task Type

### Pattern 1: Bug Fix Research

**Goal**: Understand the bug and find all affected code

**Steps:**
1. **Reproduce the bug** (if possible)
   - Note the exact steps to trigger
   - Observe the error message/behavior
   - Check console for errors

2. **Find the entry point**
   ```bash
   # Search for error messages
   grep -r "exact error text" src/

   # Search for the component/screen where bug occurs
   grep -r "ScreenName" src/
   ```

3. **Trace the data flow**
   - Where does the data come from? (Store? API? Props?)
   - Where is it transformed?
   - Where is it displayed/used?

4. **Find similar patterns**
   - How is this handled elsewhere?
   - Are there similar bugs already fixed?
   ```bash
   git log --grep="similar bug" --oneline
   ```

**Example: "Activity icon lost during sync"**
```bash
# 1. Find sync code
grep -r "sync" src/services/

# 2. Find icon handling
grep -r "\.icon" src/services/sync/

# 3. Find conflict resolution
grep -r "resolveConflict" src/

# 4. Check store updates
grep -r "setUsers\|setActivities" src/services/sync/

# Result: Found syncService.js uses Object.assign (overwrites nested fields)
```

---

### Pattern 2: Feature Addition Research

**Goal**: Understand where to add the feature and what patterns to follow

**Steps:**
1. **Find similar features**
   ```bash
   # If adding "confirmation dialog", find existing dialogs
   grep -r "ConfirmModal\|Dialog" src/components/

   # If adding "button", find existing button patterns
   grep -r "Button" src/components/
   ```

2. **Understand the pattern**
   - How are similar features structured?
   - What props do they accept?
   - How do they integrate with stores?

3. **Identify integration points**
   - Where will this feature be used?
   - What data does it need?
   - What actions does it trigger?

**Example: "Add confirmation before delete"**
```bash
# 1. Find existing confirmation patterns
grep -r "ConfirmModal" src/

# 2. Find delete logic
grep -r "deleteActivity\|removeActivity" src/

# 3. Check ConfirmModal usage
grep -r "<ConfirmModal" src/

# Result: Found ConfirmModal in /src/components/Modals/ConfirmModal.js
# Usage pattern: Show modal → User confirms → Call delete function
```

---

### Pattern 3: Refactoring Research

**Goal**: Understand the current implementation before refactoring

**Steps:**
1. **Map the current structure**
   ```bash
   # Find all files in the module
   find src/services/sync/ -type f

   # Find all imports of the module
   grep -r "import.*sync" src/
   ```

2. **Understand dependencies**
   ```bash
   # What does this module import?
   grep "^import" src/services/sync/syncService.js

   # What imports this module?
   grep -r "syncService" src/ | grep import
   ```

3. **Find all usage points**
   ```bash
   # Find all calls to functions in this module
   grep -r "syncService\." src/
   ```

4. **Check for tests**
   ```bash
   find tests/ -name "*sync*"
   find src/ -name "*.test.js" | xargs grep -l "sync"
   ```

**Example: "Refactor sync service into modules"**
```bash
# 1. Find sync service files
find src/services/sync/ -type f

# 2. Find all imports of syncService
grep -r "import.*syncService" src/

# 3. Find all function calls
grep -r "syncService\.\w\+(" src/

# 4. Check tests
grep -r "syncService" tests/

# Result: syncService.js has 15 functions, used in 8 files
# Plan: Split into syncQueue.js, syncConflict.js, syncNetwork.js
```

---

### Pattern 4: Platform-Specific Research

**Goal**: Understand platform differences before making changes

**Steps:**
1. **Check for platform-specific files**
   ```bash
   # Find platform splits
   find src/ -name "*.native.js" -o -name "*.web.js"

   # Find the specific component
   find src/ -name "ComponentName.*"
   ```

2. **Find Platform.OS checks**
   ```bash
   grep -r "Platform\.OS" src/components/ComponentName.js
   grep -r "Platform\.select" src/components/ComponentName.js
   ```

3. **Check CLAUDE.md for gotchas**
   - Android: FlexWrap, font variants
   - iOS: AsyncStorage freezes, NetInfo disabled
   - Web: 3-column layout, no Alert.alert

4. **Test on all platforms if shared code**

**Example: "Update card layout"**
```bash
# 1. Find card component files
find src/components/ -name "*Card*"

# Result: Card.js (shared), Card.native.js, Card.web.js

# 2. Check platform-specific code
grep -r "Platform\.OS" src/components/Card.js

# 3. Review CLAUDE.md
# Android: FlexWrap cards MUST use 48% widths
# Web: 3-column uses 31%, 2-column uses 48%

# Decision: Need to update both Card.native.js and Card.web.js
```

---

### Pattern 5: Store/State Research

**Goal**: Understand state management before modifying

**Steps:**
1. **Identify which store**
   ```bash
   # Find store usage
   grep -r "useAppStore\|useUserStore\|useSettingsStore\|useLibraryStore" src/
   ```

2. **Find store definition**
   ```bash
   # Look in store files
   ls -la src/stores/

   # Find specific store
   grep -r "create.*Store" src/stores/
   ```

3. **Find update methods**
   ```bash
   # Find store methods
   grep "^\s*\w\+:" src/stores/useUserStore.js

   # Find method usage
   grep -r "setUsers\|updateUser" src/
   ```

4. **Check for selectors**
   ```bash
   # Find how data is selected
   grep -r "useUserStore(state => state\." src/
   ```

**Example: "Update user icon"**
```bash
# 1. Find user store
ls src/stores/useUserStore.js

# 2. Find update methods
grep "^\s*set\|^\s*update" src/stores/useUserStore.js
# Found: setUsers(), updateUser(), setCurrentUser()

# 3. Find current usage
grep -r "setUsers(" src/

# 4. Check field naming
grep -r "user\.icon\|user\.emoji" src/

# Result: Use useUserStore.getState().updateUser(id, { icon: newIcon })
```

---

## StackMap-Specific Research Checklists

### For Data/State Changes:

- [ ] Which store? (`useAppStore`, `useUserStore`, `useSettingsStore`, `useLibraryStore`)
- [ ] Which update method? (`setUsers`, `updateSettings`, etc.)
- [ ] Field naming correct? (Activities: `text`/`icon`, Users: `name`/`icon`)
- [ ] Need fallbacks? (Reading: `text || name || title`)
- [ ] Check `/src/utils/dataNormalizer.js`

### For UI Changes:

- [ ] Platform-specific files? (`.native.js`, `.web.js`)
- [ ] Platform-specific code? (`Platform.OS`, `Platform.select`)
- [ ] Typography component used? (Don't use `fontWeight` directly)
- [ ] Color accessibility? (No gray text, use #000)
- [ ] Layout rules? (Android: 48% widths for FlexWrap, Web: 31%/48%/100%)

### For Sync Changes:

- [ ] Check `/src/services/sync/syncService.js`
- [ ] Conflict resolution affected? (`resolveConflict()`)
- [ ] Encryption/decryption affected? (NaCl functions)
- [ ] Field naming preserved? (`text`, `icon` not `name`, `emoji`)
- [ ] Store updates correct? (Use store methods, not `setState`)

### For Cross-Platform Changes:

- [ ] Check CLAUDE.md for platform gotchas
- [ ] Android FlexWrap rules followed?
- [ ] iOS AsyncStorage debouncing considered?
- [ ] Web 3-column layout preserved?
- [ ] No platform-specific APIs in shared code? (Alert.alert, etc.)

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
```

### Dependency Research

```bash
# Find what a file imports
head -30 src/path/to/file.js | grep "^import"

# Find what imports a specific module
grep -r "import.*ModuleName" src/

# Check package.json for dependencies
grep "package-name" package.json

# Check if a package is used
grep -r "packageName" src/
```

### Performance Research

```bash
# Find console.log statements (shouldn't be in production)
grep -r "console\.log" src/

# Find large files
find src/ -type f -exec wc -l {} \; | sort -rn | head -20

# Find duplicate code patterns
grep -r "function similarName" src/
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

### Platform Considerations:
- iOS: [any iOS-specific notes]
- Android: [any Android-specific notes]
- Web: [any Web-specific notes]

### Store/State:
- Store: [which store]
- Update method: [which method to use]
- Field naming: [correct field names]

### Risks:
- [Potential risk 1]
- [Potential risk 2]

### Dependencies:
- [External dependencies]
- [Internal module dependencies]
```

---

## When to Stop Researching

**Research is complete when you can answer:**
1. ✅ Which files need to change?
2. ✅ What needs to change in each file?
3. ✅ What pattern/approach to follow?
4. ✅ What tests to add?
5. ✅ What platform-specific considerations exist?
6. ✅ What store/state changes are needed?

**Time box**: If research takes > 15 minutes, consider escalating to Full workflow (may need deeper architectural analysis).

---

Use these patterns as a starting point. Adapt based on your specific task!
