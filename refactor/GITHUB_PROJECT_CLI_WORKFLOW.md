# GitHub Project CLI Workflow

## Prerequisites
```bash
# Install GitHub CLI if not already installed
brew install gh  # macOS
# or see: https://cli.github.com/

# Authenticate
gh auth login
```

## Common Project Commands

### View Projects
```bash
# List all projects in repo
gh project list

# View specific project
gh project view [PROJECT_NUMBER]

# View as table with issues
gh project view [PROJECT_NUMBER] --format table
```

### Create Issues
```bash
# Create issue with labels
gh issue create \
  --title "Task title" \
  --body "Task description" \
  --label "enhancement,mobile-first-refactor"

# Create from file
gh issue create --body-file task-description.md
```

### Work with Issues
```bash
# List all issues
gh issue list

# View specific issue
gh issue view 24

# Add issue to project
gh issue edit 24 --add-project "StackMap Development Board"

# Update issue status
gh issue edit 24 --add-label "in-progress"
```

### Project Board Management
```bash
# View board status
gh project field-list [PROJECT_NUMBER]

# Update issue status in project
gh project item-edit --id [ITEM_ID] --field-id [FIELD_ID] --project-id [PROJECT_ID] --single-select-option-id [OPTION_ID]
```

## Simplified Workflow Commands

### Quick Status Update
```bash
# Move issue to "Developing"
gh issue edit 56 --remove-label "planning" --add-label "developing"

# Close issue
gh issue close 24 --comment "Completed and tested"
```

### Bulk Operations
```bash
# List issues by label
gh issue list --label "research"

# Add multiple issues to project
for i in 24 41 53; do
  gh issue edit $i --add-project "StackMap Development Board"
done
```

### Search and Filter
```bash
# Find issues by keyword
gh issue list --search "SQLite"

# Filter by assignee and label
gh issue list --assignee @me --label "in-progress"

# Show closed issues
gh issue list --state closed
```

## Daily Workflow Example

```bash
# 1. Check what's in progress
gh issue list --label "developing"

# 2. Pick next task from ready
gh issue list --label "ready" --limit 5

# 3. Start working on issue
gh issue edit 58 --add-label "developing" --remove-label "ready"

# 4. Add comments as you work
gh issue comment 58 --body "Started implementation, found edge case..."

# 5. Complete and close
gh issue close 58 --comment "✅ Implementation complete, all tests passing"
```

## Project Board via API

For more complex operations, use the GraphQL API:

```bash
# Get project details
gh api graphql -f query='
  query {
    repository(owner: "OWNER", name: "REPO") {
      projectsV2(first: 10) {
        nodes {
          title
          id
          items(first: 100) {
            nodes {
              content {
                ... on Issue {
                  number
                  title
                }
              }
            }
          }
        }
      }
    }
  }'
```

## VS Code Integration

You can also use GitHub Projects directly in VS Code:
1. Install "GitHub Pull Requests and Issues" extension
2. Sign in to GitHub
3. Use Command Palette: "GitHub Issues: Focus on Issues View"
4. Drag and drop issues between project columns

## Tips

1. **Create aliases** for common commands:
   ```bash
   alias ghib="gh issue list --label 'developing'"
   alias ghir="gh issue list --label 'ready'"
   ```

2. **Use templates** for consistent issue creation:
   ```bash
   gh issue create --template research.md
   ```

3. **Combine with other tools**:
   ```bash
   # Open all developing issues in browser
   gh issue list --label "developing" --json number --jq '.[].number' | xargs -I {} gh issue view {} --web
   ```

This gives you full CLI control over your GitHub Project board!