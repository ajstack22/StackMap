#!/bin/bash

# Backlog Management Script for StackMap
# Automatically creates technical debt stories from deployment checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKLOG_DIR="$PROJECT_ROOT/docs/development/backlog"

# Create backlog directory if it doesn't exist
mkdir -p "$BACKLOG_DIR"

# Function to generate story ID (S-DEBT-XXX format)
generate_story_id() {
    # Find the highest existing S-DEBT number
    highest=0
    if ls "$BACKLOG_DIR"/S-DEBT-*.md 2>/dev/null | grep -q .; then
        highest=$(ls "$BACKLOG_DIR"/S-DEBT-*.md | sed 's/.*S-DEBT-\([0-9]\+\)\.md/\1/' | sort -n | tail -1)
    fi

    # Increment and format with leading zeros
    next=$((highest + 1))
    printf "S-DEBT-%03d" "$next"
}

# Function to create a backlog story
create_backlog_story() {
    local title="$1"
    local description="$2"
    local details="$3"
    local priority="${4:-Low}"  # Default to Low priority
    local effort="${5:-Small}"  # Default to Small effort

    local story_id=$(generate_story_id)
    local filename="$BACKLOG_DIR/${story_id}.md"
    local date=$(date +"%Y-%m-%d")

    cat > "$filename" << EOF
# ${story_id}: ${title}

**Created**: ${date}
**Priority**: ${priority}
**Effort**: ${effort}
**Type**: Technical Debt
**Status**: Backlog

## Description
${description}

## Details
${details}

## Acceptance Criteria
- [ ] Issue has been resolved
- [ ] Tests pass without warnings
- [ ] No regression in functionality

## Technical Notes
- Auto-generated from deployment check on ${date}
- Detected during: \`./scripts/qual_deploy.sh\`

---
*Auto-generated technical debt story*
EOF

    echo "$story_id"
}

# Function to check if similar story already exists
story_exists() {
    local pattern="$1"
    grep -l "$pattern" "$BACKLOG_DIR"/*.md 2>/dev/null | head -1
}

# Handle different types of issues
case "$1" in
    typescript)
        # TypeScript warnings
        error_count="$2"
        if [ "$error_count" -gt 0 ]; then
            # Check if similar story exists
            existing=$(story_exists "TypeScript type errors")
            if [ -z "$existing" ]; then
                story_id=$(create_backlog_story \
                    "Fix TypeScript Type Errors" \
                    "The codebase has $error_count TypeScript errors that should be resolved to improve type safety." \
                    "Run \`npm run typecheck\` to see all errors. These are non-critical but should be fixed as part of the ongoing TypeScript migration." \
                    "Medium" \
                    "Medium")
                echo "Created backlog story: $story_id"
            else
                echo "Similar story already exists: $(basename "$existing")"
            fi
        fi
        ;;

    todos)
        # TODO comments
        todo_count="$2"
        if [ "$todo_count" -gt 0 ]; then
            existing=$(story_exists "TODO/FIXME comments")
            if [ -z "$existing" ]; then
                # Get sample TODOs for the story
                todo_samples=$(grep -r "TODO\\|FIXME" src/ --include="*.js" --include="*.ts" --include="*.tsx" 2>/dev/null | head -5 | sed 's/^/  - /')

                story_id=$(create_backlog_story \
                    "Address TODO/FIXME Comments" \
                    "The codebase contains $todo_count TODO/FIXME comments that represent incomplete work or needed improvements." \
                    "Sample TODOs found:\n$todo_samples\n\nRun \`grep -r 'TODO\\|FIXME' src/\` to see all occurrences." \
                    "Low" \
                    "Large")
                echo "Created backlog story: $story_id"
            else
                echo "Similar story already exists: $(basename "$existing")"
            fi
        fi
        ;;

    prettier)
        # Prettier formatting issues
        if [ "$2" = "failed" ]; then
            existing=$(story_exists "Prettier formatting")
            if [ -z "$existing" ]; then
                story_id=$(create_backlog_story \
                    "Fix Code Formatting Issues" \
                    "Some files are not properly formatted according to Prettier rules." \
                    "Run \`npm run prettier\` to automatically fix all formatting issues." \
                    "Low" \
                    "Small")
                echo "Created backlog story: $story_id"
            else
                echo "Similar story already exists: $(basename "$existing")"
            fi
        fi
        ;;

    bundle)
        # Bundle size warning
        size="$2"
        if [ -n "$size" ]; then
            existing=$(story_exists "Bundle size optimization")
            if [ -z "$existing" ]; then
                story_id=$(create_backlog_story \
                    "Optimize Bundle Size" \
                    "The web bundle size ($size) exceeds the recommended 5MB limit." \
                    "Consider:\n- Code splitting with dynamic imports\n- Tree shaking unused dependencies\n- Analyzing bundle with webpack-bundle-analyzer\n- Lazy loading heavy components" \
                    "Medium" \
                    "Large")
                echo "Created backlog story: $story_id"
            else
                echo "Similar story already exists: $(basename "$existing")"
            fi
        fi
        ;;

    list)
        # List all backlog stories
        echo "📋 Current Technical Debt Backlog:"
        echo "=================================="
        if ls "$BACKLOG_DIR"/S-DEBT-*.md 2>/dev/null | grep -q .; then
            for story in "$BACKLOG_DIR"/S-DEBT-*.md; do
                basename "$story" .md
                grep "^# " "$story" | sed 's/^# /  /'
                grep "^**Priority**:" "$story" | sed 's/^/  /'
                echo ""
            done
        else
            echo "No technical debt stories in backlog"
        fi
        ;;

    clean)
        # Remove old/resolved stories
        echo "Cleaning resolved backlog stories..."
        # This would need implementation based on your workflow
        echo "Feature not yet implemented"
        ;;

    *)
        echo "Usage: $0 {typescript|todos|prettier|bundle|list|clean} [args]"
        echo ""
        echo "Examples:"
        echo "  $0 typescript 42        # Create story for 42 TypeScript errors"
        echo "  $0 todos 15            # Create story for 15 TODO comments"
        echo "  $0 prettier failed     # Create story for prettier issues"
        echo "  $0 bundle 6.2MB        # Create story for large bundle"
        echo "  $0 list                # List all backlog stories"
        exit 1
        ;;
esac