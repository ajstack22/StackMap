# Claude Development Workflow

## Before Making Changes

1. **Always update PENDING_CHANGES.md** with:
   - A clear, concise title
   - Detailed list of changes made
   - Files affected
   - Impact/benefits of the changes

## Format for PENDING_CHANGES.md

```markdown
# Pending Changes

## Title: [Brief description of the main change]

### Changes Made:

1. **Component/Feature Name** (`path/to/file`)
   - What was changed
   - Why it was changed
   
2. **Another Component** (`path/to/file`)
   - Details of changes

### Impact:
- User-facing benefits
- Performance improvements
- Bug fixes
- Developer experience improvements
```

## Deployment Process

When running `./scripts/deploy-all.sh`:
- The script will automatically use the title from PENDING_CHANGES.md for the commit message
- The full content becomes the commit body
- After successful commit, PENDING_CHANGES.md is cleared to a template
- This creates meaningful git history

## Benefits

- Git history shows actual changes, not generic timestamps
- Easy to track what was deployed when
- Better collaboration and code review
- Helps with debugging and rollbacks