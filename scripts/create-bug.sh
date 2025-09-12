#!/bin/bash

# Create a new bug report
# Usage: ./scripts/create-bug.sh "Bug Title" P[0-3] [Severity]
# Example: ./scripts/create-bug.sh "iOS AsyncStorage Freeze" P0 Critical

set -e

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 \"Bug Title\" P[0-3] [Severity]"
    echo "Severity: Critical, High, Medium, Low"
    exit 1
fi

TITLE="$1"
PRIORITY="$2"
SEVERITY="${3:-Medium}"

# Validate priority
if [[ ! "$PRIORITY" =~ ^P[0-3]$ ]]; then
    echo "Error: Priority must be P0, P1, P2, or P3"
    exit 1
fi

# Generate bug ID
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BUG_ID="B-${TIMESTAMP}"

# Create filename
FILENAME=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
FILEPATH="docs/development/bugs/active/${BUG_ID}-${FILENAME}.md"

# Create bug report
cat > "$FILEPATH" << EOF
# Bug: $TITLE
## ID: $BUG_ID
## Priority: $PRIORITY
## Severity: $SEVERITY
## Status: Open
## Reported: $(date +%Y-%m-%d)
## Reporter: [Name/Role]

## Summary
[Brief description of the bug]

## Environment
- Platform: [Web/iOS/Android/All]
- Version: [App version]
- Device: [Device model if mobile]
- OS: [OS version]
- Browser: [If web]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Error Messages
\`\`\`
[Any error messages or console output]
\`\`\`

## Screenshots/Videos
[Attach if available]

## Impact
### User Impact
- Affected users: [Percentage/count]
- Workaround available: [Yes/No]
- Workaround: [If yes, describe]

### Business Impact
- Feature affected: [Which feature]
- Revenue impact: [If applicable]
- Customer complaints: [Count if known]

## Root Cause Analysis
[Once identified]

## Proposed Solution
[High-level approach]

## Verification Steps
\`\`\`bash
# Commands to verify fix
npm run test
# Platform-specific verification
\`\`\`

## Related Issues
- Related bugs: [Bug IDs]
- Related stories: [Story IDs]

## Notes
[Additional context]

---
*Bug Report v1.0 - StackMap*
EOF

echo "🐛 Created bug report: $FILEPATH"
echo "📝 Bug ID: $BUG_ID"
echo "🎯 Priority: $PRIORITY"
echo "⚠️  Severity: $SEVERITY"
echo ""
echo "Next steps:"
echo "1. Fill in the bug details"
echo "2. Add reproduction steps"
echo "3. Assign to developer for investigation"
echo "4. Move to bugs/resolved/ when fixed"