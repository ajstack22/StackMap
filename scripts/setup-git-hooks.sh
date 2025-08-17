#!/bin/bash

# Setup Git hooks for better code quality
# This script creates a pre-commit hook that runs checks before commits

echo "🔧 Setting up Git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

echo "🔍 Running pre-commit checks..."

# Check for merge conflict markers
if git diff --cached --name-only | xargs grep -E "^(<<<<<<<|=======|>>>>>>>)" 2>/dev/null; then
    echo "❌ Merge conflict markers detected!"
    echo "Please resolve conflicts before committing."
    exit 1
fi

# Check for console.log in staged files (warning only)
CONSOLE_COUNT=$(git diff --cached --name-only --diff-filter=ACM | grep -E "\.(js|ts|tsx)$" | xargs grep -c "console\.log" 2>/dev/null | awk '{s+=$1} END {print s}')
if [ "$CONSOLE_COUNT" -gt "0" ]; then
    echo "⚠️  Warning: $CONSOLE_COUNT console.log statements in staged files"
fi

# Check for debugger statements (blocking)
if git diff --cached --name-only --diff-filter=ACM | grep -E "\.(js|ts|tsx)$" | xargs grep -E "^\s*debugger" 2>/dev/null; then
    echo "❌ Debugger statements detected!"
    echo "Please remove debugger statements before committing."
    exit 1
fi

# Run lint on staged files only (if lint errors, block commit)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E "\.(js|ts|tsx)$")
if [ -n "$STAGED_FILES" ]; then
    echo "- Running lint check on staged files..."
    npx eslint $STAGED_FILES 2>&1 | tee /tmp/pre-commit-lint.txt
    if grep -E "^\s+[0-9]+:[0-9]+\s+error\s" /tmp/pre-commit-lint.txt > /dev/null; then
        echo ""
        echo "❌ Lint errors found in staged files!"
        echo "Please fix errors before committing."
        exit 1
    fi
fi

echo "✅ Pre-commit checks passed!"
EOF

# Make hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks setup complete!"
echo ""
echo "The pre-commit hook will now:"
echo "  • Block commits with merge conflict markers"
echo "  • Block commits with debugger statements"
echo "  • Block commits with lint errors"
echo "  • Warn about console.log statements"
echo ""
echo "To bypass hooks in emergency: git commit --no-verify"