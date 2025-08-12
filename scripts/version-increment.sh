#!/bin/bash

# Shared version increment function
# This is sourced by other deployment scripts

# Function to increment version
increment_version() {
    # Get current version from package.json
    CURRENT_VERSION=$(grep '"version":' "$PROJECT_ROOT/package.json" | head -1 | cut -d'"' -f4)
    echo "📌 Current version: $CURRENT_VERSION"
    
    # Parse version parts (format: YYYY.MM.DD.BUILD)
    IFS='.' read -r YEAR MONTH DAY BUILD <<< "$CURRENT_VERSION"
    
    # Get current date with leading zeros
    CURRENT_DATE=$(date +"%Y.%m.%d")
    IFS='.' read -r NEW_YEAR NEW_MONTH NEW_DAY <<< "$CURRENT_DATE"
    
    # Ensure month and day have leading zeros
    NEW_MONTH=$(printf "%02d" $((10#$NEW_MONTH)))
    NEW_DAY=$(printf "%02d" $((10#$NEW_DAY)))
    
    # If it's a new day, reset build number to 1, otherwise increment
    if [[ "$YEAR.$MONTH.$DAY" == "$NEW_YEAR.$NEW_MONTH.$NEW_DAY" ]]; then
        NEW_BUILD=$((BUILD + 1))
    else
        NEW_BUILD=1
    fi
    
    # Create new version
    NEW_VERSION="$NEW_YEAR.$NEW_MONTH.$NEW_DAY.$NEW_BUILD"
    echo "📈 New version: $NEW_VERSION"
    
    # Update package.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PROJECT_ROOT/package.json"
        sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PROJECT_ROOT/app.json"
    else
        # Linux
        sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PROJECT_ROOT/package.json"
        sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PROJECT_ROOT/app.json"
    fi
    
    echo "✅ Version updated to $NEW_VERSION"
    
    # Export for use in calling scripts
    export NEW_VERSION
    export CURRENT_VERSION
}