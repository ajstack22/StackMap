#!/bin/bash

# Setup script to configure git hooks for StackMap

echo "🔧 Setting up StackMap git hooks..."

# Create symlink to git hooks
if [ -d ".git" ]; then
    # Remove existing hooks if they exist
    rm -f .git/hooks/pre-push
    
    # Create symlink to our custom hooks
    ln -s ../../.githooks/pre-push .git/hooks/pre-push
    
    echo "✅ Git hooks configured successfully!"
    echo ""
    echo "The pre-push hook will now:"
    echo "  - Run pre-deployment checks before pushing to main"
    echo "  - Validate all required files exist"
    echo "  - Check for common issues"
    echo "  - Remind you to run UAT tests"
    echo ""
else
    echo "❌ Error: Not in a git repository"
    exit 1
fi