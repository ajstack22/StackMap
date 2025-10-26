#!/bin/bash
# Deployment Configuration
# Source this file in deployment scripts

# Project Information
export PROJECT_NAME="YourProject"
export PROJECT_TYPE="web"  # web, mobile, backend, etc.

# Version Configuration
export VERSION_FILE="package.json"  # or version.txt, setup.py, etc.
export CHANGELOG_FILE="CHANGELOG.md"

# Build Configuration
export BUILD_COMMAND="npm run build"
export TEST_COMMAND="npm test"
export LINT_COMMAND="npm run lint"

# Environment Configuration
export ENVIRONMENTS=("dev" "staging" "prod")
export DEFAULT_ENVIRONMENT="dev"

# Development Environment
export DEV_URL=""
export DEV_DEPLOY_COMMAND=""
export DEV_BRANCH="develop"

# Staging Environment
export STAGING_URL=""
export STAGING_DEPLOY_COMMAND=""
export STAGING_BRANCH="main"

# Production Environment
export PROD_URL=""
export PROD_DEPLOY_COMMAND=""
export PROD_BRANCH="main"

# Quality Gates
export REQUIRE_TESTS="true"
export REQUIRE_LINT="true"
export REQUIRE_CHANGELOG="true"
export MIN_TEST_COVERAGE="80"

# Notification Configuration
export SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
export NOTIFICATION_ENABLED="false"

# Rollback Configuration
export ENABLE_ROLLBACK="true"
export KEEP_PREVIOUS_BUILDS="3"

# Logging
export LOG_DIRECTORY="logs"
export LOG_LEVEL="info"  # debug, info, warn, error

# Functions
get_current_version() {
  if [ -f "$VERSION_FILE" ]; then
    if [[ "$VERSION_FILE" == *.json ]]; then
      grep -o '"version": *"[^"]*"' "$VERSION_FILE" | cut -d'"' -f4
    else
      cat "$VERSION_FILE"
    fi
  else
    echo "unknown"
  fi
}

bump_version() {
  local bump_type=$1  # patch, minor, major

  # Customize for your project type
  case "$PROJECT_TYPE" in
    web|mobile)
      npm version "$bump_type" --no-git-tag-version
      ;;
    python)
      # Use bump2version or similar
      echo "Version bumping not configured for Python"
      return 1
      ;;
    *)
      echo "Unknown project type for version bumping"
      return 1
      ;;
  esac
}

send_notification() {
  local message=$1
  local environment=$2

  if [ "$NOTIFICATION_ENABLED" != "true" ]; then
    return 0
  fi

  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"[$environment] $message\"}"
  fi
}

export -f get_current_version
export -f bump_version
export -f send_notification
