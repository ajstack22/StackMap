#!/bin/bash

# StackMap GitHub Automation Setup Script
# This script sets up GitHub automation for neurodivergent-friendly development

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 StackMap GitHub Automation Setup${NC}"
echo "===================================="

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub${NC}"
    echo "Running: gh auth login"
    gh auth login
fi

REPO_OWNER=$(gh repo view --json owner -q .owner.login)
REPO_NAME=$(gh repo view --json name -q .name)

echo -e "${GREEN}✅ Repository: ${REPO_OWNER}/${REPO_NAME}${NC}"

# Create labels
echo -e "\n${BLUE}📏 Creating labels...${NC}"

# Priority labels
gh label create "P0-critical" --description "Must be fixed immediately" --color "FF0000" || true
gh label create "P1-high" --description "High priority" --color "FFA500" || true
gh label create "P2-medium" --description "Medium priority" --color "FFFF00" || true

# Neurodivergent-specific labels
gh label create "neurodivergent" --description "Affects neurodivergent users" --color "7B68EE" || true
gh label create "accessibility" --description "Accessibility improvement or fix" --color "0366D6" || true
gh label create "sensory" --description "Sensory overload or comfort issue" --color "FF69B4" || true
gh label create "cognitive-load" --description "Cognitive complexity issue" --color "98FB98" || true
gh label create "adhd" --description "ADHD-specific issue or feature" --color "FFB6C1" || true
gh label create "autism" --description "Autism-specific issue or feature" --color "DDA0DD" || true
gh label create "anxiety" --description "Causes or relates to anxiety" --color "F0E68C" || true

# Technical labels
gh label create "ES5" --description "ES5 compatibility" --color "2E8B57" || true
gh label create "animation" --description "Animation or motion related" --color "00CED1" || true
gh label create "contrast" --description "Color contrast issue" --color "8B4513" || true
gh label create "offline" --description "Offline functionality" --color "708090" || true
gh label create "performance" --description "Performance optimization" --color "FF1493" || true

# Platform labels
gh label create "android" --description "Android specific" --color "3DDC84" || true
gh label create "ios" --description "iOS specific" --color "000000" || true
gh label create "chromebook" --description "Chromebook specific" --color "4285F4" || true
gh label create "tv" --description "TV interface" --color "8A2BE2" || true

echo -e "${GREEN}✅ Labels created${NC}"

# Create milestones
echo -e "\n${BLUE}🎯 Creating milestones...${NC}"

MILESTONES=(
    "v0.1 - ES5 Compatibility|Migrate all code to ES5 for Android 5+ support|2024-02-01"
    "v0.2 - Core Navigation|Implement simplified navigation for neurodivergent users|2024-02-15"
    "v0.3 - Offline Storage|Build offline-first storage with CRDT sync|2024-03-01"
    "v0.4 - Accessibility|Comprehensive accessibility features|2024-03-15"
    "v0.5 - Family Features|Multi-user support with COPPA compliance|2024-04-01"
    "v0.6 - TV Interface|Voice-controlled TV interface|2024-04-15"
    "v0.7 - Migration Support|Safe migration from old architecture|2024-05-01"
    "v0.8 - Advanced Views|Mind maps and visual representations|2024-05-15"
)

for milestone in "${MILESTONES[@]}"; do
    IFS='|' read -r title description due_date <<< "$milestone"
    gh api repos/${REPO_OWNER}/${REPO_NAME}/milestones \
        --method POST \
        -f title="$title" \
        -f description="$description" \
        -f due_on="${due_date}T00:00:00Z" \
        2>/dev/null || echo "Milestone '$title' already exists"
done

echo -e "${GREEN}✅ Milestones created${NC}"

# Create project board
echo -e "\n${BLUE}📋 Creating project board...${NC}"

# Create project (GitHub Projects v2)
PROJECT_ID=$(gh api graphql -f query='
  mutation($ownerId: ID!, $title: String!) {
    createProjectV2(input: {ownerId: $ownerId, title: $title}) {
      projectV2 {
        id
      }
    }
  }
' -f ownerId="$(gh api user -q .node_id)" -f title="StackMap Neurodivergent-First Refactor" -q .data.createProjectV2.projectV2.id 2>/dev/null || echo "")

if [ -n "$PROJECT_ID" ]; then
    echo -e "${GREEN}✅ Project board created${NC}"
    
    # Add fields to project
    echo -e "\n${BLUE}Adding custom fields to project...${NC}"
    
    # Add Priority field
    gh api graphql -f query='
      mutation($projectId: ID!, $name: String!) {
        addProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          name: $name,
          dataType: SINGLE_SELECT,
          singleSelectOptions: ["P0-critical", "P1-high", "P2-medium", "P3-low"]
        }) {
          projectV2Field {
            id
          }
        }
      }
    ' -f projectId="$PROJECT_ID" -f name="Priority" 2>/dev/null || true
    
    # Add Complexity field
    gh api graphql -f query='
      mutation($projectId: ID!, $name: String!) {
        addProjectV2ItemFieldValue(input: {
          projectId: $projectId,
          name: $name,
          dataType: NUMBER
        }) {
          projectV2Field {
            id
          }
        }
      }
    ' -f projectId="$PROJECT_ID" -f name="Cognitive Complexity" 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Project board may already exist${NC}"
fi

# Set up branch protection
echo -e "\n${BLUE}🔒 Setting up branch protection...${NC}"

gh api repos/${REPO_OWNER}/${REPO_NAME}/branches/main/protection \
    --method PUT \
    --field required_status_checks='{"strict":true,"contexts":["ES5 Compatibility Check","Accessibility Validation","Sensory Pattern Detection"]}' \
    --field enforce_admins=false \
    --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
    --field restrictions=null \
    --field allow_force_pushes=false \
    --field allow_deletions=false \
    2>/dev/null || echo -e "${YELLOW}⚠️  Branch protection may already be configured${NC}"

# Create initial issues
echo -e "\n${BLUE}📝 Creating initial high-priority issues...${NC}"

# Create P0 critical issues
ISSUES=(
    "P0-critical|ES5|Migrate all JavaScript to ES5 syntax|Remove all ES6+ features (arrow functions, const/let, template literals, classes) to support Android 5.1+ WebView|v0.1 - ES5 Compatibility"
    "P0-critical|accessibility,sensory|Implement sensory-aware notification system|Build notification system that respects sensory preferences with batching and intensity controls|v0.4 - Accessibility"
    "P0-critical|security|Add noopener/noreferrer to external links|Security fix to prevent window.opener attacks on all external links|"
    "P0-critical|android,ES5|Downgrade to Capacitor 4.x for Android 5.1+ support|Capacitor 5+ requires Android 6+, must downgrade to v4 for broader compatibility|v0.1 - ES5 Compatibility"
    "P0-critical|family,privacy|Implement COPPA compliance|Ensure full COPPA compliance for users under 13 with parental controls|v0.5 - Family Features"
)

for issue in "${ISSUES[@]}"; do
    IFS='|' read -r labels title description milestone <<< "$issue"
    
    # Create issue
    if [ -n "$milestone" ]; then
        gh issue create \
            --title "$title" \
            --body "$description" \
            --label "$labels" \
            --milestone "$milestone" \
            2>/dev/null && echo -e "${GREEN}✅ Created: $title${NC}" || echo -e "${YELLOW}⚠️  Issue may exist: $title${NC}"
    else
        gh issue create \
            --title "$title" \
            --body "$description" \
            --label "$labels" \
            2>/dev/null && echo -e "${GREEN}✅ Created: $title${NC}" || echo -e "${YELLOW}⚠️  Issue may exist: $title${NC}"
    fi
done

# Create webhook for Slack/Discord notifications (optional)
echo -e "\n${BLUE}🔔 Setting up webhooks...${NC}"
echo -e "${YELLOW}Note: Add webhook URL to GitHub Secrets as NOTIFICATION_WEBHOOK_URL${NC}"

# Create accessibility team
echo -e "\n${BLUE}👥 Creating teams...${NC}"
echo "Run these commands to create teams (requires org admin):"
echo "gh api orgs/${REPO_OWNER}/teams --method POST -f name='accessibility-team' -f description='Neurodivergent accessibility advocates'"
echo "gh api orgs/${REPO_OWNER}/teams --method POST -f name='sensory-reviewers' -f description='Sensory safety reviewers'"

# Summary
echo -e "\n${GREEN}✨ Setup Complete!${NC}"
echo "=================="
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review and merge the workflow files in .github/workflows/"
echo "2. Configure project board columns manually"
echo "3. Add team members to the accessibility teams"
echo "4. Run initial accessibility audit: npm run audit:accessibility"
echo "5. Set up monitoring dashboards for sensory issues"
echo ""
echo -e "${YELLOW}Remember: Neurodivergent-first design benefits everyone!${NC}"

# Generate quick reference card
cat > github-automation-quick-reference.md << 'EOF'
# GitHub Automation Quick Reference

## Workflow Files
- `.github/workflows/es5-compatibility.yml` - ES5 syntax checking
- `.github/workflows/accessibility-validation.yml` - WCAG + neurodivergent checks
- `.github/workflows/sensory-pattern-detection.yml` - Sensory safety scanning
- `.github/workflows/cross-platform-testing.yml` - Multi-device testing
- `.github/workflows/project-automation.yml` - Project board automation

## Key Labels
- `P0-critical` - Immediate action required
- `neurodivergent` - Affects ND users
- `sensory` - Sensory overload issue
- `accessibility` - General a11y issue
- `cognitive-load` - Too complex

## Milestones
1. v0.1 - ES5 Compatibility
2. v0.2 - Core Navigation  
3. v0.3 - Offline Storage
4. v0.4 - Accessibility
5. v0.5 - Family Features
6. v0.6 - TV Interface
7. v0.7 - Migration Support
8. v0.8 - Advanced Views

## CLI Commands

### Create issue with labels and milestone
```bash
gh issue create \
  --title "Issue title" \
  --body "Description" \
  --label "P1-high,accessibility" \
  --milestone "v0.4 - Accessibility"
```

### View sensory issues
```bash
gh issue list --label "sensory"
```

### Check workflow status
```bash
gh workflow view "Accessibility Validation"
```

### Run workflow manually
```bash
gh workflow run "Cross-Platform Testing" -f platforms="android,chromebook"
```

### Create PR with template
```bash
gh pr create --fill --template=.github/pull_request_template.md
```

## Project Board Automation Rules
- P0-critical → "In Progress" automatically
- accessibility/neurodivergent → "Accessibility Review"
- sensory → "Urgent - Sensory"
- Closed issues → "Done"
EOF

echo -e "\n${GREEN}📄 Created github-automation-quick-reference.md${NC}"