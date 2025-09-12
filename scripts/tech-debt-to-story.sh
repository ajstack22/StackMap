#!/bin/bash

# Convert tech debt documentation to actionable story
# Usage: ./scripts/tech-debt-to-story.sh docs/development/tech-debt/drafts/[debt-file].md
# Example: ./scripts/tech-debt-to-story.sh docs/development/tech-debt/drafts/god-objects.md

set -e

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 path/to/debt-file.md"
    exit 1
fi

DEBT_FILE="$1"

if [ ! -f "$DEBT_FILE" ]; then
    echo "Error: File not found: $DEBT_FILE"
    exit 1
fi

# Extract information from debt file
TITLE=$(grep "^# Tech Debt:" "$DEBT_FILE" | sed 's/# Tech Debt: //')
PRIORITY=$(grep "^## Priority:" "$DEBT_FILE" | sed 's/## Priority: //')
CATEGORY="Debt"

# Generate story ID
TIMESTAMP=$(date +%Y%m%d%H%M%S)
STORY_ID="S-DEBT-${TIMESTAMP}"

# Create filename
FILENAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
STORY_PATH="docs/development/backlog/${STORY_ID}-${FILENAME}.md"

# Create story header
cat > "$STORY_PATH" << EOF
# Story: Resolve Tech Debt - $TITLE
## ID: $STORY_ID
## Priority: $PRIORITY
## Category: Technical Debt
## Estimated Effort: [Update based on debt analysis]

## Problem Statement
This story addresses technical debt identified in the codebase that is impacting system maintainability, performance, or reliability.

EOF

# Append debt content, transforming it to story format
echo "## Original Tech Debt Analysis" >> "$STORY_PATH"
cat "$DEBT_FILE" >> "$STORY_PATH"

# Add story-specific sections
cat >> "$STORY_PATH" << 'EOF'

## Requirements
### Debt Resolution Requirements
- [ ] Root cause addressed, not just symptoms
- [ ] No new debt introduced
- [ ] Performance maintained or improved
- [ ] All platforms tested
- [ ] Documentation updated

## Success Criteria
### Verification Commands
```bash
# Standard verification
npm run lint
npm run typecheck
npm run build:web

# Debt-specific verification
# [Add specific commands based on debt type]
```

### Before/After Metrics
- [ ] Metric documented before changes
- [ ] Metric improved after changes
- [ ] No regressions in other areas

## Testing Plan
### Regression Testing
- [ ] Existing functionality maintained
- [ ] Performance benchmarks met
- [ ] Platform compatibility verified

## Rollback Plan
### Risk Level: [Assess based on debt]
### Rollback Steps:
1. Git revert if issues found
2. Redeploy previous version
3. Document lessons learned

## Review Checklist
### For Developer
- [ ] Debt fully resolved
- [ ] Tests added to prevent recurrence
- [ ] Documentation updated
- [ ] No new debt introduced

### For Peer Reviewer
- [ ] Verify debt is actually resolved
- [ ] Check for new debt introduction
- [ ] Confirm performance impact
- [ ] Validate test coverage

---
*Converted from Tech Debt: $(date +%Y-%m-%d)*
EOF

# Archive original debt file
ARCHIVE_DIR="docs/development/tech-debt/archived"
mkdir -p "$ARCHIVE_DIR"
mv "$DEBT_FILE" "$ARCHIVE_DIR/$(basename "$DEBT_FILE")"

echo "✅ Converted tech debt to story: $STORY_PATH"
echo "📝 Story ID: $STORY_ID"
echo "🎯 Priority: $PRIORITY"
echo "📦 Archived debt file to: $ARCHIVE_DIR"
echo ""
echo "Next steps:"
echo "1. Review and update effort estimate"
echo "2. Add specific verification commands"
echo "3. Add to BACKLOG.md"
echo "4. Assign to developer when ready"