#!/bin/bash
# Create GitHub Projects V2 Board

echo "Creating GitHub Projects V2 board..."

# Get user node ID
USER_NODE_ID=$(gh api graphql -f query='query { viewer { id } }' --jq .data.viewer.id)
echo "User ID: $USER_NODE_ID"

# Create the project
echo "Creating project..."
PROJECT_RESPONSE=$(gh api graphql -f query='
mutation($ownerId: ID!, $title: String!) {
  createProjectV2(input: {
    ownerId: $ownerId,
    title: $title
  }) {
    projectV2 {
      id
      number
      url
    }
  }
}' -f ownerId="$USER_NODE_ID" -f title="StackMap Development Board")

PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r .data.createProjectV2.projectV2.id)
PROJECT_NUMBER=$(echo $PROJECT_RESPONSE | jq -r .data.createProjectV2.projectV2.number)
PROJECT_URL=$(echo $PROJECT_RESPONSE | jq -r .data.createProjectV2.projectV2.url)

if [ "$PROJECT_ID" != "null" ]; then
    echo "✅ Project created successfully!"
    echo "Project Number: $PROJECT_NUMBER"
    echo "Project URL: $PROJECT_URL"
    echo ""
    echo "The project has been created! You can now:"
    echo "1. Visit the project at: $PROJECT_URL"
    echo "2. Set up Status field with columns (Planning, Ready, Developing, Closed)"
    echo "3. Run ./create-issues.sh to create the issues"
    echo "4. Add issues to the project with: gh issue edit [NUMBER] --add-project $PROJECT_NUMBER"
else
    echo "Failed to create project. Error:"
    echo $PROJECT_RESPONSE | jq .
fi