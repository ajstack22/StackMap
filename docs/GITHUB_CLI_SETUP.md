# GitHub CLI Setup and Usage

## Installation Location
The GitHub CLI (`gh`) is installed at: `/opt/homebrew/bin/gh`

## Version
```
gh version 2.74.1 (2025-06-10)
```

## Common Commands

### Creating Issues
```bash
# Basic issue creation
/opt/homebrew/bin/gh issue create --repo ajstack22/StackMap --title "Issue Title" --body "Issue description"

# With labels (only use existing labels)
/opt/homebrew/bin/gh issue create --repo ajstack22/StackMap --title "Issue Title" --body "Issue description" --label "bug" --label "mobile"
```

### Available Labels
Based on recent usage, these labels exist in the repository:
- `bug` - For bugs and fixes
- `mobile` - For mobile-related issues
- `enhancement` - For new features
- `pwa` - For PWA-specific items
- `android` - For Android-specific items
- `ios` - For iOS-specific items
- `twa` - For Trusted Web Activity items
- `swift` - For Swift/iOS development
- `marketing` - For store metadata/marketing
- `content` - For content creation

Note: Labels like `ui`, `high-priority` do not exist and will cause errors.

### Viewing Issues
```bash
# List all issues
/opt/homebrew/bin/gh issue list --repo ajstack22/StackMap

# View specific issue
/opt/homebrew/bin/gh issue view 10 --repo ajstack22/StackMap

# List issues with specific label
/opt/homebrew/bin/gh issue list --repo ajstack22/StackMap --label mobile
```

### Working with Pull Requests
```bash
# Create PR
/opt/homebrew/bin/gh pr create --repo ajstack22/StackMap

# List PRs
/opt/homebrew/bin/gh pr list --repo ajstack22/StackMap
```

## Troubleshooting

### "command not found: gh"
The `gh` command is not in the default PATH. Always use the full path:
```bash
/opt/homebrew/bin/gh
```

Or add to your shell profile:
```bash
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Authentication
If you get authentication errors:
```bash
/opt/homebrew/bin/gh auth login
```

### Label Errors
Only use labels that exist in the repository. To see available labels:
```bash
/opt/homebrew/bin/gh label list --repo ajstack22/StackMap
```

## Recent Issues Created
- Issue #10: Mobile UI: Activity cards not centered, appear shifted right
  - URL: https://github.com/ajstack22/StackMap/issues/10
  - Labels: bug, mobile