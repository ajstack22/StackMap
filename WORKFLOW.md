# StackMap Development Workflow

## Our Optimized Workflow

### 1. **Start with an Issue**
```bash
# Quick issue creation
gh issue create --title "Brief description" --body "Details" --label "bug"

# Or create in GitHub web UI for more detail
```

### 2. **Make Changes**
```bash
# Reference the issue in commits
git add .
git commit -m "Fix: Brief description (#123)

- Detailed explanation of what changed
- Why this approach was taken
- Any side effects to watch for"
```

### 3. **Run Checks Before Push**
```bash
# Our pre-commit hook runs automatically, but you can also:
bash .githooks/pre-commit

# Check for CSS conflicts
grep -r "\.main-container" styles/ | grep -v "layout.css"
```

### 4. **Push with Documentation**
```bash
git push

# If major feature/fix, immediately create issue to document it
gh issue create --title "Document: Feature X" --body "## What was added..."
```

### 5. **Deploy with Checklist**
- Follow `.github/DEPLOYMENT_CHECKLIST.md`
- Always bump service worker version
- Test in demo first

### 6. **Tag Releases**
```bash
# After successful deployment
git tag -a v1.6.x -m "Feature: X, Fix: Y"
git push --tags
```

## Preventing Issues Like the Grid Bug

### CSS Changes
1. **Check for duplicates** before adding new rules
2. **Document which file controls what**:
   - `layout.css` - Grid and responsive breakpoints
   - `cards.css` - Card styling
   - `index.css` - Imports only, no layout rules

3. **Test both** main site and demo after CSS changes

### JavaScript Changes  
1. **Remove console.logs** before committing
2. **Test in incognito** to catch cache issues
3. **Check syntax** in browser console

### Before Major Changes
1. **Create issue** describing the planned change
2. **Check existing code** to understand current implementation
3. **Document decisions** in commit messages

## Quick Commands

```bash
# See recent changes to a file
git log -p styles/index.css

# Find when something was added
git blame styles/index.css | grep "main-container"

# Check what changed in a commit
git show abc123

# Find commits that mention something
git log --grep="grid"
```

## Benefits of This Workflow

1. **Traceable** - Every change linked to an issue
2. **Documented** - Clear commit messages explain why
3. **Preventable** - Pre-commit checks catch issues
4. **Reversible** - Tagged releases for easy rollback
5. **Fast** - No PR approval delays

This gives us the rigor of a formal process without the slowdown!