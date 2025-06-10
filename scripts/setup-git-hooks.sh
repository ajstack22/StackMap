#!/bin/bash

# Setup script to configure git hooks for StackMap

echo "🔧 Setting up StackMap git hooks..."

# Create symlink to git hooks
if [ -d ".git" ]; then
    # Remove existing hooks if they exist
    rm -f .git/hooks/pre-push
    rm -f .git/hooks/pre-commit
    
    # Create symlinks to our custom hooks
    ln -s ../../.githooks/pre-push .git/hooks/pre-push
    ln -s ../../.githooks/pre-commit .git/hooks/pre-commit
    
    echo "✅ Git hooks configured successfully!"
    echo ""
    echo "The pre-commit hook will:"
    echo "  - Run UAT tests before each commit"
    echo "  - Check for console.log statements"
    echo "  - Warn about large files (>1MB)"
    echo ""
    echo "The pre-push hook will:"
    echo "  - Run pre-deployment checks before pushing to main"
    echo "  - Validate all required files exist"
    echo "  - Check for common issues"
    echo "  - Ensure tests are passing"
    echo ""
else
    echo "❌ Error: Not in a git repository"
    exit 1
fi