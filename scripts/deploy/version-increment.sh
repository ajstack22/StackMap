#!/bin/bash

# Shared version increment function
# This is sourced by other deployment scripts

# ============================================
# VERSION SUFFIX FUNCTIONS (Beta Support)
# ============================================

# Function to add beta suffix to version
# Usage: add_beta_suffix "2025.10.10.1" -> "2025.10.10.1-beta"
add_beta_suffix() {
    local version=$1
    # Don't add suffix if it already has one
    if [[ "$version" == *"-beta"* ]]; then
        echo "$version"
    else
        echo "${version}-beta"
    fi
}

# Function to remove beta suffix from version
# Usage: remove_beta_suffix "2025.10.10.1-beta" -> "2025.10.10.1"
remove_beta_suffix() {
    local version=$1
    echo "${version%-beta}"
}

# Function to check if version has beta suffix
# Usage: if is_beta_version "2025.10.10.1-beta"; then ...
is_beta_version() {
    local version=$1
    [[ "$version" == *"-beta" ]]
}

# ============================================
# VERSION INCREMENT FUNCTION
# ============================================

# Function to increment version
increment_version() {
    # Get current version from package.json
    CURRENT_VERSION=$(grep '"version":' "$PROJECT_ROOT/package.json" | head -1 | cut -d'"' -f4)
    echo "📌 Current version: $CURRENT_VERSION"

    # Strip beta suffix if present before incrementing
    VERSION_WITHOUT_SUFFIX=$(remove_beta_suffix "$CURRENT_VERSION")

    # Parse version parts (format: YYYY.MM.DD.BUILD)
    IFS='.' read -r YEAR MONTH DAY BUILD <<< "$VERSION_WITHOUT_SUFFIX"
    
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

    # Escape special characters in CURRENT_VERSION for sed (handles beta suffix)
    ESCAPED_CURRENT_VERSION=$(echo "$CURRENT_VERSION" | sed 's/[-.]/\\&/g')

    # Update package.json and app.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/\"version\": \"$ESCAPED_CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PROJECT_ROOT/package.json"
        sed -i '' "s/\"version\": \"$ESCAPED_CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PROJECT_ROOT/app.json"
        # Also update version.js for web builds
        if [ -f "$PROJECT_ROOT/src/utils/version.js" ]; then
            sed -i '' "s/BUILD_VERSION = '[^']*'/BUILD_VERSION = '$NEW_VERSION'/" "$PROJECT_ROOT/src/utils/version.js"
        fi
    else
        # Linux
        sed -i "s/\"version\": \"$ESCAPED_CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PROJECT_ROOT/package.json"
        sed -i "s/\"version\": \"$ESCAPED_CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PROJECT_ROOT/app.json"
        # Also update version.js for web builds
        if [ -f "$PROJECT_ROOT/src/utils/version.js" ]; then
            sed -i "s/BUILD_VERSION = '[^']*'/BUILD_VERSION = '$NEW_VERSION'/" "$PROJECT_ROOT/src/utils/version.js"
        fi
    fi
    
    echo "✅ Version updated to $NEW_VERSION"
    
    # Export for use in calling scripts
    export NEW_VERSION
    export CURRENT_VERSION
}