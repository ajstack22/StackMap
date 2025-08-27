#!/bin/bash

# Script to set up GitHub features using GitHub CLI
# Requires: gh (GitHub CLI) to be installed and authenticated

echo "🚀 Setting up GitHub features for StackMap..."

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"

# Create labels
echo ""
echo "📌 Creating labels..."

# Bug/Feature labels
gh label create "bug" --description "Something isn't working" --color "d73a4a" 2>/dev/null
gh label create "enhancement" --description "New feature or request" --color "a2eeef" 2>/dev/null
gh label create "documentation" --description "Improvements or additions to documentation" --color "0075ca" 2>/dev/null

# Priority labels
gh label create "priority: high" --description "High priority" --color "FF0000" 2>/dev/null
gh label create "priority: medium" --description "Medium priority" --color "FFA500" 2>/dev/null
gh label create "priority: low" --description "Low priority" --color "00FF00" 2>/dev/null

# Type labels
gh label create "performance" --description "Performance improvements" --color "FBCA04" 2>/dev/null
gh label create "accessibility" --description "Accessibility improvements" --color "7B55D7" 2>/dev/null
gh label create "mobile" --description "Mobile-specific issues" --color "5319E7" 2>/dev/null
gh label create "sync" --description "Sync-related issues" --color "1D76DB" 2>/dev/null

# Status labels
gh label create "good first issue" --description "Good for newcomers" --color "7057ff" 2>/dev/null
gh label create "help wanted" --description "Extra attention is needed" --color "008672" 2>/dev/null
gh label create "wontfix" --description "This will not be worked on" --color "ffffff" 2>/dev/null

# Other labels
gh label create "dependencies" --description "Pull requests that update a dependency file" --color "0366d6" 2>/dev/null
gh label create "automated" --description "Automated PRs (dependabot, etc)" --color "0366d6" 2>/dev/null

echo "✅ Labels created"

# Create first milestone
echo ""
echo "🎯 Creating milestone..."
gh api repos/:owner/:repo/milestones \
  --method POST \
  -f title="Phase 4: Conflict Resolution" \
  -f description="Implement field-level conflict resolution for sync" \
  -f due_on="2025-07-01T00:00:00Z" \
  2>/dev/null && echo "✅ Milestone created" || echo "⚠️  Milestone might already exist"

# Create example issues
echo ""
echo "📋 Creating example issues..."

# Create bug issue from our grid layout problem
gh issue create \
  --title "Grid layout showing 2 columns instead of 3 on desktop" \
  --body-file GRID_LAYOUT_BUG_ISSUE.md \
  --label "bug,styles" \
  2>/dev/null && echo "✅ Bug issue created" || echo "⚠️  Issue might already exist"

# Create feature issue for Phase 4
gh issue create \
  --title "Implement field-level conflict resolution" \
  --body "## Description
Implement smart conflict resolution when the same data is modified on multiple devices.

## Requirements
- Detect conflicts at field level, not just document level
- Show conflict UI when conflicts detected
- Allow user to choose which version to keep
- Merge non-conflicting changes automatically

## Technical Approach
- Track field-level changes in operation log
- Compare timestamps and device IDs
- Implement three-way merge for compatible changes" \
  --label "enhancement,sync,priority: high" \
  --milestone "Phase 4: Conflict Resolution" \
  2>/dev/null && echo "✅ Feature issue created" || echo "⚠️  Issue might already exist"

echo ""
echo "🎉 GitHub setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to Settings > Branches to set up branch protection"
echo "2. Go to Projects to create a project board"
echo "3. Create your first release at Releases > Create new release"
echo ""
echo "To run this script again: bash scripts/setup-github.sh"