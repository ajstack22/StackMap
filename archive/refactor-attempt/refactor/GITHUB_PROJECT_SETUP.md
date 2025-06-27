# GitHub Project Setup Guide

## Quick Setup (Easiest)

### 1. First, grant GitHub CLI the required permissions:
```bash
gh auth refresh -s project
```

### 2. Create Project via Web (Recommended)
1. Go to your GitHub repository
2. Click "Projects" tab
3. Click "New project" → "Board" template
4. Name it "StackMap Development Board"
5. Create columns: Planning, Ready, Developing, Closed

### 3. Create Issues via CLI
```bash
# Create all 5 new issues at once
./create-issues.sh
```

### 4. Add Issues to Project
```bash
# After creating the project, get its number (usually 1)
gh project list

# Add all issues to project
for issue in 24 27 41 53 56 57 58 59 60 61; do
  gh issue edit $issue --add-project 1
done
```

## Alternative: Full CLI Setup

If you prefer doing everything via CLI:

```bash
# 1. Grant permissions
gh auth refresh -s project,write:org

# 2. Create project (this is complex with GraphQL)
# First, get your user ID
USER_ID=$(gh api user --jq .node_id)

# Create the project
gh api graphql -f query="
mutation {
  createProjectV2(input: {ownerId: \"$USER_ID\", title: \"StackMap Development Board\"}) {
    projectV2 {
      id
      url
    }
  }
}"

# 3. The rest remains the same
```

## Simpler Script for Issue Creation Only

Since project creation via CLI is complex, here's a script that just creates the issues: