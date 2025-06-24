#!/bin/bash
# Foundry Workflow Manager - Issue-based workflow

FOUNDRY_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show current status
status() {
    echo -e "${GREEN}=== Foundry Workflow Status ===${NC}"
    echo ""
    
    # Check each folder
    for folder in "1-ResearchPrompt" "2-ResearchReports" "3-Stories" "4-PlanReview" "5-ReadyToDevelop" "6-CodeReview" "7-Completed"; do
        count=$(ls -1 "$FOUNDRY_DIR/$folder" 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)" | wc -l | tr -d ' ')
        if [ "$count" -gt 0 ]; then
            echo -e "${YELLOW}$folder${NC}: $count active items"
            ls -1 "$FOUNDRY_DIR/$folder" 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)" | sed 's/^/  - /'
        else
            echo "$folder: empty"
        fi
        echo ""
    done
}

# Function to move file to next stage
advance() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "Usage: advance <filename> <from-stage>"
        echo "Stages: 1-ResearchPrompt, 2-ResearchReports, 3-Stories, 4-PlanReview, 5-ReadyToDevelop, 6-CodeReview, 7-Completed"
        return
    fi
    
    FILE="$1"
    FROM="$2"
    
    # Determine next stage
    case "$FROM" in
        "1-ResearchPrompt")
            TO="2-ResearchReports"
            ;;
        "2-ResearchReports")
            TO="3-Stories"
            ;;
        "3-Stories")
            TO="4-PlanReview"
            ;;
        "4-PlanReview")
            TO="5-ReadyToDevelop"
            echo -e "${BLUE}Note: PM should perform adversarial review before moving to ReadyToDevelop${NC}"
            ;;
        "5-ReadyToDevelop")
            TO="6-CodeReview"
            ;;
        "6-CodeReview")
            TO="7-Completed"
            echo -e "${BLUE}Note: PM should perform adversarial code review before marking as completed${NC}"
            ;;
        "7-Completed")
            TO="archive"
            ;;
        *)
            echo -e "${RED}Unknown stage: $FROM${NC}"
            return
            ;;
    esac
    
    # Move the file
    if [ -f "$FOUNDRY_DIR/$FROM/$FILE" ]; then
        if [ "$TO" = "archive" ]; then
            mkdir -p "$FOUNDRY_DIR/7-Completed/archive"
            mv "$FOUNDRY_DIR/$FROM/$FILE" "$FOUNDRY_DIR/7-Completed/archive/"
            echo -e "${GREEN}✓ Archived $FILE${NC}"
        else
            mv "$FOUNDRY_DIR/$FROM/$FILE" "$FOUNDRY_DIR/$TO/"
            echo -e "${GREEN}✓ Moved $FILE from $FROM to $TO${NC}"
        fi
    else
        echo -e "${RED}File not found: $FROM/$FILE${NC}"
    fi
}

# Function to archive completed work
archive() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "Usage: archive <filename> <stage>"
        return
    fi
    
    FILE="$1"
    STAGE="$2"
    
    if [ -f "$FOUNDRY_DIR/$STAGE/$FILE" ]; then
        mkdir -p "$FOUNDRY_DIR/$STAGE/archive"
        mv "$FOUNDRY_DIR/$STAGE/$FILE" "$FOUNDRY_DIR/$STAGE/archive/"
        echo -e "${GREEN}✓ Archived $FILE in $STAGE${NC}"
    else
        echo -e "${RED}File not found: $STAGE/$FILE${NC}"
    fi
}

# Function to create a new item
new() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "Usage: new <issue-number> <short-description>"
        echo "Example: new 62 notification-strategies"
        echo "Creates: 62-notification-strategies.md in 1-ResearchPrompt/"
        return
    fi
    
    ISSUE="$1"
    DESC="$2"
    FILENAME="${ISSUE}-${DESC}.md"
    FILE="$FOUNDRY_DIR/1-ResearchPrompt/${FILENAME}"
    
    if [ -f "$FILE" ]; then
        echo -e "${RED}File already exists: ${FILENAME}${NC}"
        return
    fi
    
    # Check if issue exists in GitHub
    echo "Checking GitHub issue #${ISSUE}..."
    ISSUE_TITLE=$(gh issue view $ISSUE --json title --jq .title 2>/dev/null)
    
    if [ -z "$ISSUE_TITLE" ]; then
        echo -e "${YELLOW}Warning: Could not find GitHub issue #${ISSUE}${NC}"
        echo "Make sure to create the issue first!"
        ISSUE_TITLE="[Issue Title]"
    else
        echo -e "${GREEN}Found issue: ${ISSUE_TITLE}${NC}"
    fi
    
    cat > "$FILE" << EOF
# Research Prompt: ${ISSUE_TITLE}

**GitHub Issue**: #${ISSUE}
**File**: ${FILENAME}

## Context
[Provide background information from the GitHub issue]

## Research Questions
1. [Primary question from issue]
2. [Secondary question]
3. [Additional questions]

## Target Audience
- ADHD users with [specific challenges]
- Additional neurodivergent considerations

## Expected Deliverables
- Concrete recommendations for [specific aspect]
- Implementation guidelines
- Platform-specific considerations
- Edge cases and failure modes

## Success Criteria
- Research provides actionable specifications
- Addresses ADHD-specific needs
- Includes competitive analysis
- Has clear do's and don'ts

## Timeline
[When is this needed by]

## Related Work
- [Link to existing features]
- [Related research]
- [Other GitHub issues]

## Notes
[Any constraints, assumptions, or additional context]
EOF
    
    echo -e "${GREEN}✓ Created new research prompt: ${FILENAME}${NC}"
    echo "Edit: $FILE"
    echo ""
    echo "Next steps:"
    echo "1. Edit the research prompt with specific questions"
    echo "2. When researcher completes it, they'll create ${FILENAME} in 2-ResearchReports/"
}

# Function to show PM round tasks
round() {
    echo -e "${GREEN}=== PM Round Tasks ===${NC}"
    echo ""
    
    # 1. Check for issues needing research
    echo -e "${YELLOW}1. Submit research requests if needed:${NC}"
    echo "   Check GitHub issues that need research"
    echo "   Use: $0 new <issue-number> <description>"
    echo ""
    
    # 2. Review research reports
    RESEARCH_COUNT=$(ls -1 "$FOUNDRY_DIR/2-ResearchReports" 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)" | wc -l | tr -d ' ')
    if [ "$RESEARCH_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}2. Review research and create stories:${NC}"
        ls -1 "$FOUNDRY_DIR/2-ResearchReports" 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)" | sed 's/^/   - /'
        echo "   Create story in 3-Stories/ for each"
        echo "   Then: $0 archive <file> 2-ResearchReports"
    else
        echo -e "${BLUE}2. No research reports to review${NC}"
    fi
    echo ""
    
    # 3. Review plans
    PLAN_COUNT=$(ls -1 "$FOUNDRY_DIR/4-PlanReview" 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)" | wc -l | tr -d ' ')
    if [ "$PLAN_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}3. Adversarial plan reviews needed:${NC}"
        ls -1 "$FOUNDRY_DIR/4-PlanReview" 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)" | sed 's/^/   - /'
        echo "   Review and update plans, then:"
        echo "   $0 advance <file> 4-PlanReview"
    else
        echo -e "${BLUE}3. No plans to review${NC}"
    fi
    echo ""
    
    # 4. Review code
    CODE_COUNT=$(ls -1 "$FOUNDRY_DIR/6-CodeReview" 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)" | wc -l | tr -d ' ')
    if [ "$CODE_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}4. Adversarial code reviews needed:${NC}"
        ls -1 "$FOUNDRY_DIR/6-CodeReview" 2>/dev/null | grep -v -E "(archive|TEMPLATE|\.DS_Store)" | sed 's/^/   - /'
        echo "   Review implementation, then:"
        echo "   $0 advance <file> 6-CodeReview"
    else
        echo -e "${BLUE}4. No code to review${NC}"
    fi
}

# Main menu
case "$1" in
    "status"|"s")
        status
        ;;
    "round"|"r")
        round
        ;;
    "advance"|"a")
        advance "$2" "$3"
        ;;
    "archive")
        archive "$2" "$3"
        ;;
    "new"|"n")
        new "$2" "$3"
        ;;
    *)
        echo "Foundry Workflow Manager - Issue-based workflow"
        echo ""
        echo "Commands:"
        echo "  round (r)                    - Show PM's round tasks"
        echo "  status (s)                   - Show all workflow status"
        echo "  new (n) <issue#> <desc>      - Create new research prompt"
        echo "  advance (a) <file> <stage>   - Move file to next stage"
        echo "  archive <file> <stage>       - Archive completed file"
        echo ""
        echo "Examples:"
        echo "  $0 new 62 notification-strategies"
        echo "  $0 advance 62-notification-strategies.md 4-PlanReview"
        echo "  $0 archive 53-photo-optimization.md 7-Completed"
        echo ""
        echo "Workflow:"
        echo "  1-ResearchPrompt → 2-ResearchReports → 3-Stories →"
        echo "  4-PlanReview → 5-ReadyToDevelop → 6-CodeReview → 7-Completed"
        echo ""
        echo "File naming: <issue#>-<description>.md"
        ;;
esac