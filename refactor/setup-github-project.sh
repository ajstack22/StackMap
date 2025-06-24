#!/bin/bash
# Setup GitHub Project Board and Issues via CLI

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is required but not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Please authenticate with GitHub first:"
    echo "Run: gh auth login"
    exit 1
fi

# Check for required scopes
echo "Checking GitHub CLI permissions..."
if ! gh auth status | grep -q "project"; then
    echo "GitHub CLI needs additional permissions for projects."
    echo "Please run: gh auth refresh -s project"
    exit 1
fi

echo "Setting up GitHub Project for StackMap..."

# Get repository owner and name
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "Repository: $REPO"

# Create Project (Projects V2)
echo "Creating project board..."
PROJECT_ID=$(gh api graphql -f query='
  mutation($ownerId: ID!, $title: String!) {
    createProjectV2(input: {ownerId: $ownerId, title: $title}) {
      projectV2 {
        id
        url
      }
    }
  }
' -f ownerId="$(gh api /repos/$REPO --jq .owner.node_id)" -f title="StackMap Development Board" --jq .data.createProjectV2.projectV2.id)

if [ -z "$PROJECT_ID" ]; then
    echo "Failed to create project. It might already exist."
    # Try to find existing project
    PROJECT_ID=$(gh project list --limit 100 --format json | jq -r '.projects[] | select(.title == "StackMap Development Board") | .id')
fi

echo "Project ID: $PROJECT_ID"

# Add fields to project (Status field with our columns)
echo "Setting up project columns..."

# Get field ID for Status
FIELD_ID=$(gh api graphql -f query='
  query($projectId: ID!) {
    node(id: $projectId) {
      ... on ProjectV2 {
        fields(first: 20) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }
' -f projectId="$PROJECT_ID" --jq '.data.node.fields.nodes[] | select(.name == "Status") | .id')

# Update Status field options
gh api graphql -f query='
  mutation($projectId: ID!, $fieldId: ID!) {
    updateProjectV2Field(input: {
      projectId: $projectId
      fieldId: $fieldId
      name: "Status"
    }) {
      field {
        ... on ProjectV2SingleSelectField {
          id
        }
      }
    }
  }
' -f projectId="$PROJECT_ID" -f fieldId="$FIELD_ID"

echo "Project board created successfully!"

# Create new issues
echo "Creating new GitHub issues..."

# Issue 1: Notification Strategies Research
gh issue create \
  --title "Research: Notification Strategies for ADHD/Executive Dysfunction Users" \
  --body "Research optimal notification patterns for users with ADHD and executive dysfunction, focusing on:

- **Optimal timing**: When to send task reminders without overwhelming
- **RSD-safe language**: Non-judgmental, encouraging notification text
- **Frequency thresholds**: Avoiding notification fatigue
- **Recovery patterns**: Re-engaging users who've been away

**Key Questions:**
- How to handle task reminders for time-blind users?
- What notification styles reduce anxiety vs increase it?
- How to balance helpfulness with avoiding nagging?
- Platform-specific notification capabilities and limits?

**Deliverables:**
1. Notification timing framework
2. Language templates for different notification types
3. Settings recommendations (user control vs smart defaults)
4. Implementation guidelines per platform

**Related:** This research will inform the notification system implementation." \
  --label "research,ux,accessibility,mobile-first-refactor"

# Issue 2: Time Perception & Task Aging Research
gh issue create \
  --title "Research: Time Perception & Visual Task Aging for ADHD Users" \
  --body "Research how ADHD users perceive task age and design visual indicators that inform without shaming.

**Focus Areas:**
- Time blindness patterns in ADHD
- Visual aging systems (color gradients, opacity, indicators)
- Emotional impact of seeing \"old\" tasks
- Behavioral patterns around task abandonment

**Key Questions:**
- How do users with time blindness understand \"3 days ago\"?
- What visual changes are helpful vs anxiety-inducing?
- When should old tasks roll over automatically?
- How to show age without implying failure?

**Deliverables:**
1. Aging indicator design framework
2. Non-shameful language for time descriptions
3. Interaction patterns for old tasks
4. Technical specs for implementing aging

**Related:** Connects to Today/Tomorrow view (#41) and task display systems." \
  --label "research,ux,accessibility,mobile-first-refactor"

# Issue 3: Capacitor iOS/Android Build Setup
gh issue create \
  --title "Set up Capacitor for iOS/Android native app distribution" \
  --body "Configure Capacitor to build and distribute native iOS and Android apps from our PWA.

**Requirements:**
- [ ] Configure Capacitor for iOS build
- [ ] Configure Capacitor for Android build  
- [ ] Set up app signing and certificates
- [ ] Create build scripts for CI/CD
- [ ] Test on real devices (iOS and Android)
- [ ] Document build and release process

**Success Criteria:**
- Can build and install on iOS devices
- Can build and install on Android devices
- Maintains all PWA functionality
- Proper app icons and splash screens
- Works offline like PWA

**Note:** Capacitor is already initialized but needs platform-specific setup." \
  --label "enhancement,mobile,infrastructure,mobile-first-refactor"

# Issue 4: Task Filtering & Search
gh issue create \
  --title "Implement task filtering and search functionality" \
  --body "Users need to quickly find specific tasks as their list grows.

**Requirements:**
- [ ] Search by task text (fuzzy matching)
- [ ] Filter by completion status
- [ ] Filter by date ranges
- [ ] Filter by attachments (has photo/voice)
- [ ] Save/quick access to common filters
- [ ] Maintain performance with large task lists

**UI/UX Considerations:**
- Simple, obvious search box
- One-tap filter presets
- Clear indicator when filters active
- Easy way to clear all filters

**Technical Notes:**
- Must work with SQLite storage
- Consider search indexing for performance
- Filters should persist across sessions" \
  --label "enhancement,ux,mobile-first-refactor"

# Issue 5: Bulk Task Operations
gh issue create \
  --title "Implement bulk task management features" \
  --body "Users with ADHD often get overwhelmed by many tasks and need bulk management options.

**Requirements:**
- [ ] Select multiple tasks (with visual feedback)
- [ ] Bulk complete tasks
- [ ] Bulk delete tasks  
- [ ] Bulk move to tomorrow
- [ ] Bulk clear old tasks (with confirmation)
- [ ] Select all/none shortcuts

**ADHD Considerations:**
- Prevent accidental bulk deletes (undo option)
- Clear visual feedback for selected items
- Simple selection mechanism (checkbox mode?)
- Confirmation for destructive actions
- Quick way to exit bulk mode

**Related:** Works with Today/Tomorrow view (#41)" \
  --label "enhancement,ux,mobile-first-refactor"

echo "Issues created successfully!"

# Add all issues to project
echo "Adding issues to project board..."

# Get all issue numbers
ISSUES=$(gh issue list --limit 100 --json number --jq '.[].number')

for ISSUE in $ISSUES; do
    echo "Adding issue #$ISSUE to project..."
    gh issue edit $ISSUE --add-project "StackMap Development Board"
done

echo "Setup complete!"
echo "View your project board at: https://github.com/$REPO/projects"