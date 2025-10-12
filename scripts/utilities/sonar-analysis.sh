#!/bin/bash

# SonarCloud Analysis Script for StackMap
set -e

echo "🔍 SonarCloud Code Quality Analysis for StackMap"
echo "================================================"

# Check if SONAR_TOKEN is set
if [ -z "$SONAR_TOKEN" ]; then
    # Try to load from Manylla env file first
    if [ -f "$HOME/.manylla-env" ]; then
        source "$HOME/.manylla-env"
    elif [ -f "$HOME/.stackmap-env" ]; then
        source "$HOME/.stackmap-env"
    fi

    # Check again after loading
    if [ -z "$SONAR_TOKEN" ]; then
        echo "⚠️  SONAR_TOKEN not set"
        echo "Set it with: export SONAR_TOKEN='your-token'"
        echo "Or create ~/.manylla-env with: SONAR_TOKEN=\"your-token\""
        exit 1
    fi
fi

# Get git information for version
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')

echo "📌 Branch: $GIT_BRANCH"
echo "📌 Commit: $GIT_COMMIT"

# Run tests with coverage if available
if [ -f "package.json" ] && grep -q "test:coverage" package.json; then
    echo "📊 Generating test coverage..."
    npm run test:coverage 2>/dev/null || echo "ℹ️  No test coverage available"
fi

# Run SonarCloud analysis
echo "☁️  Sending analysis to SonarCloud..."
sonar-scanner \
  -Dsonar.token="$SONAR_TOKEN" \
  -Dsonar.projectVersion="$GIT_COMMIT" \
  -Dsonar.branch.name="$GIT_BRANCH"

echo "✅ Analysis complete!"
echo "📊 View results at: https://sonarcloud.io/project/overview?id=ajstack22_stackmap"
echo ""
echo "📈 Quality metrics available at:"
echo "   - Code Smells: https://sonarcloud.io/project/issues?id=ajstack22_stackmap&resolved=false&types=CODE_SMELL"
echo "   - Bugs: https://sonarcloud.io/project/issues?id=ajstack22_stackmap&resolved=false&types=BUG"
echo "   - Security: https://sonarcloud.io/project/security_hotspots?id=ajstack22_stackmap"