#!/bin/bash
# Create GitHub Project using API directly

echo "Creating GitHub Project for StackMap..."

# Get repository info
REPO_INFO=$(gh repo view --json owner,name)
OWNER=$(echo $REPO_INFO | jq -r .owner.login)
REPO=$(echo $REPO_INFO | jq -r .name)

echo "Repository: $OWNER/$REPO"

# First, let's try to create a classic project (simpler than Projects V2)
echo "Creating project board..."

# Create a classic project board
PROJECT_RESPONSE=$(gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/$OWNER/$REPO/projects \
  -f name="StackMap Development Board" \
  -f body="Kanban board for StackMap development tasks")

if [ $? -eq 0 ]; then
    PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r .id)
    PROJECT_URL=$(echo $PROJECT_RESPONSE | jq -r .html_url)
    echo "✅ Project created successfully!"
    echo "Project URL: $PROJECT_URL"
    
    # Create columns
    echo "Creating columns..."
    
    for column in "Planning" "Ready" "Developing" "Closed"; do
        gh api \
          --method POST \
          -H "Accept: application/vnd.github+json" \
          /projects/$PROJECT_ID/columns \
          -f name="$column" > /dev/null
        echo "  ✓ Created column: $column"
    done
    
    echo ""
    echo "Project board created! Visit: $PROJECT_URL"
    echo ""
    echo "Note: Classic Projects have limited CLI support."
    echo "For better CLI integration, consider creating a Projects V2 board manually."
else
    echo "Failed to create project. You may need to:"
    echo "1. Enable Projects in your repository settings"
    echo "2. Create the project manually at: https://github.com/$OWNER/$REPO/projects"
fi