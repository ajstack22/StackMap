#!/bin/bash

echo "🔧 Setting up StackMap Test Framework..."

# Ensure git hooks are configured
echo "Configuring git hooks..."
git config core.hooksPath .githooks

# Make hooks executable
chmod +x .githooks/pre-commit
chmod +x .githooks/pre-push

# Create necessary directories
echo "Creating test directories..."
mkdir -p tests/stories
mkdir -p tests/reports
mkdir -p tests/framework

# Make test runner executable
chmod +x tests/test-runner-enhanced.js

echo "✅ Test framework setup complete!"
echo ""
echo "Available commands:"
echo "  npm test              - Run all tests"
echo "  npm run test:stories  - Run story tests only"
echo "  npm run test:browser  - Run tests in browser"
echo "  npm run precommit     - Run pre-commit checks manually"
echo "  npm run prepush       - Run pre-push validation manually"
echo ""
echo "Test in browser:"
echo "  open tests/test-runner-enhanced.html"
echo ""
echo "Git hooks are now active:"
echo "  - Pre-commit: Runs tests and blocks commit on failure"
echo "  - Pre-push: Full validation before pushing to remote"