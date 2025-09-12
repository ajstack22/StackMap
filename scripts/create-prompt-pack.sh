#!/bin/bash

# Create Prompt Pack Script for StackMap
# Creates standardized prompt packs with consistent structure
# Usage: ./scripts/create-prompt-pack.sh [priority] [name]
#   priority: 01-critical, 02-high, 03-medium, 04-low
#   name: descriptive name (will be slugified)

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PROMPTS_DIR="$PROJECT_ROOT/docs/prompts"
ACTIVE_DIR="$PROMPTS_DIR/active"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to slugify text
slugify() {
    echo "$1" | iconv -t ascii//TRANSLIT | sed -E 's/[^a-zA-Z0-9]+/-/g' | sed -E 's/^-+|-+$//g' | tr '[:upper:]' '[:lower:]'
}

# Function to get next story ID
get_next_story_id() {
    local max_id=0
    
    # Check active directory
    if [ -d "$ACTIVE_DIR" ]; then
        for file in "$ACTIVE_DIR"/*.md; do
            if [ -f "$file" ]; then
                # Extract story ID from filename (format: PP-SSS-name.md)
                local story_id=$(basename "$file" | sed -E 's/^[0-9]{2}-([0-9]{3})-.*/\1/')
                if [[ "$story_id" =~ ^[0-9]+$ ]] && [ "$story_id" -gt "$max_id" ]; then
                    max_id=$story_id
                fi
            fi
        done
    fi
    
    # Check archive directory
    if [ -d "$PROMPTS_DIR/archive" ]; then
        for file in "$PROMPTS_DIR/archive"/*.md; do
            if [ -f "$file" ]; then
                local story_id=$(basename "$file" | sed -E 's/^[0-9]{2}-([0-9]{3})-.*/\1/')
                if [[ "$story_id" =~ ^[0-9]+$ ]] && [ "$story_id" -gt "$max_id" ]; then
                    max_id=$story_id
                fi
            fi
        done
    fi
    
    # Return next ID
    echo $(printf "%03d" $((max_id + 1)))
}

# Check arguments
if [ "$#" -eq 0 ]; then
    echo -e "${BLUE}Interactive Prompt Pack Creation${NC}"
    echo ""
    
    # Get priority
    echo "Select priority level:"
    echo "  1) 01-critical - Production issues, blocking bugs"
    echo "  2) 02-high     - Major functionality, UX issues"
    echo "  3) 03-medium   - Enhancements, tech debt"
    echo "  4) 04-low      - Nice-to-have, cleanup"
    read -p "Choice (1-4): " priority_choice
    
    case $priority_choice in
        1) PRIORITY="01-critical" ;;
        2) PRIORITY="02-high" ;;
        3) PRIORITY="03-medium" ;;
        4) PRIORITY="04-low" ;;
        *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
    esac
    
    # Get name
    read -p "Enter descriptive name: " NAME
    
elif [ "$#" -eq 2 ]; then
    PRIORITY=$1
    NAME=$2
else
    echo "Usage: $0 [priority] [name]"
    echo "  priority: 01-critical, 02-high, 03-medium, 04-low"
    echo "  name: descriptive name for the prompt pack"
    exit 1
fi

# Validate priority
if [[ ! "$PRIORITY" =~ ^(01-critical|02-high|03-medium|04-low)$ ]]; then
    echo -e "${RED}Error: Invalid priority. Must be: 01-critical, 02-high, 03-medium, 04-low${NC}"
    exit 1
fi

# Get priority number
PRIORITY_NUM=$(echo "$PRIORITY" | cut -d'-' -f1)

# Get next story ID
STORY_ID=$(get_next_story_id)

# Create filename
SLUG=$(slugify "$NAME")
FILENAME="${PRIORITY_NUM}-${STORY_ID}-${SLUG}.md"
FILEPATH="$ACTIVE_DIR/$FILENAME"

# Check if file already exists
if [ -f "$FILEPATH" ]; then
    echo -e "${RED}Error: File already exists: $FILEPATH${NC}"
    exit 1
fi

# Create the prompt pack
cat > "$FILEPATH" << 'EOF'
# Prompt Pack: [TITLE]

## Metadata
- **Priority**: [PRIORITY]
- **Story ID**: [STORY_ID]
- **Created**: [DATE]
- **Status**: Pending
- **Assigned To**: Unassigned

## Objective
[Clear description of what needs to be accomplished]

## Context
[Why this work is important, what problem it solves, user impact]

## Requirements
### Functional Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### Non-Functional Requirements
- [ ] Performance: [specific metrics if applicable]
- [ ] Accessibility: [specific requirements]
- [ ] Cross-platform: Works on Web, iOS, Android

## Technical Approach
[Suggested technical approach, files to modify, patterns to follow]

### Files to Modify
- `src/components/...` - [what changes]
- `src/screens/...` - [what changes]

### Key Considerations
- Platform-specific gotchas from CLAUDE.md
- Existing patterns to follow
- Dependencies or blockers

## Acceptance Criteria
- [ ] Feature works as specified
- [ ] No TypeScript files (must be .js/.jsx only)
- [ ] No platform-specific files (.native.js, .web.js)
- [ ] Passes `npm run lint`
- [ ] Passes `npm run typecheck`
- [ ] Works on all platforms (Web, iOS, Android)
- [ ] Documentation updated

## Testing Requirements
### Manual Testing
- [ ] Test on Web browser
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Test with different theme colors
- [ ] Test offline behavior if applicable

### Edge Cases
- [ ] Empty state
- [ ] Maximum data
- [ ] Network failure
- [ ] Rapid user actions

## Documentation Requirements
- [ ] Update relevant files in `/docs/`
- [ ] Update PENDING_CHANGES.md with changes
- [ ] Add inline code comments for complex logic
- [ ] Update CLAUDE.md if new patterns introduced

## Definition of Done
- [ ] All requirements met
- [ ] All acceptance criteria passed
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Code reviewed (if critical)
- [ ] Ready for deployment

## Notes
[Any additional context, links to discussions, related issues]

---
*Prompt Pack System v1.0 - StackMap*
EOF

# Replace placeholders
sed -i '' "s/\[TITLE\]/$NAME/g" "$FILEPATH"
sed -i '' "s/\[PRIORITY\]/$PRIORITY/g" "$FILEPATH"
sed -i '' "s/\[STORY_ID\]/$STORY_ID/g" "$FILEPATH"
sed -i '' "s/\[DATE\]/$(date '+%Y-%m-%d %H:%M')/g" "$FILEPATH"

echo -e "${GREEN}✅ Created prompt pack: $FILEPATH${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo "  Priority: $PRIORITY"
echo "  Story ID: $STORY_ID"
echo "  Filename: $FILENAME"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Edit the file to add specific requirements"
echo "  2. Assign to appropriate role (DEV/PR/ADMIN)"
echo "  3. Track progress using manage-prompt-packs.sh"