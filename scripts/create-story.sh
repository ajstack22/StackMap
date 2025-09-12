#!/bin/bash

# Create a new story from template
# Usage: ./scripts/create-story.sh "Story Title" P[0-3] [Category]
# Example: ./scripts/create-story.sh "Fix Android Font Rendering" P1 Bug

set -e

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 \"Story Title\" P[0-3] [Category]"
    echo "Categories: Feature, Bug, Debt, Performance, Security"
    exit 1
fi

TITLE="$1"
PRIORITY="$2"
CATEGORY="${3:-Feature}"

# Validate priority
if [[ ! "$PRIORITY" =~ ^P[0-3]$ ]]; then
    echo "Error: Priority must be P0, P1, P2, or P3"
    exit 1
fi

# Generate story ID
TIMESTAMP=$(date +%Y%m%d%H%M%S)
CATEGORY_PREFIX=$(echo "$CATEGORY" | cut -c1-4 | tr '[:lower:]' '[:upper:]')
STORY_ID="S-${CATEGORY_PREFIX}-${TIMESTAMP}"

# Create filename
FILENAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
FILEPATH="docs/development/backlog/${STORY_ID}-${FILENAME}.md"

# Create story from template
cp docs/development/templates/story-template.md "$FILEPATH"

# Update story with provided information
sed -i '' "s/\[Title\]/$TITLE/g" "$FILEPATH"
sed -i '' "s/S-\[CATEGORY\]-\[NUMBER\]/$STORY_ID/g" "$FILEPATH"
sed -i '' "s/P\[0-3\]/$PRIORITY/g" "$FILEPATH"
sed -i '' "s/\[Feature\/Bug\/Debt\/Performance\/Security\]/$CATEGORY/g" "$FILEPATH"

echo "✅ Created story: $FILEPATH"
echo "📝 Story ID: $STORY_ID"
echo "🎯 Priority: $PRIORITY"
echo "📂 Category: $CATEGORY"
echo ""
echo "Next steps:"
echo "1. Edit the story to add requirements and details"
echo "2. Add to BACKLOG.md in priority order"
echo "3. Assign to developer when ready to implement"