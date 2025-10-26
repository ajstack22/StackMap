#!/bin/bash

# deploy-all.sh - Generic deployment wrapper
# Customizable deployment script for any project

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Configuration file
CONFIG_FILE="$PROJECT_ROOT/.atlas/deployment-config.sh"

# Usage information
usage() {
    echo -e "${BLUE}Usage:${NC} $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  dev         Deploy to development"
    echo "  staging     Deploy to staging"
    echo "  prod        Deploy to production"
    echo ""
    echo "Options:"
    echo "  --skip-tests       Skip test execution"
    echo "  --skip-build       Skip build step"
    echo "  --force            Force deployment (skip confirmations)"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging"
    echo "  $0 prod --force"
    echo ""
    echo "Configuration:"
    echo "  Create .atlas/deployment-config.sh to customize deployment"
    echo "  See atlas-skills/atlas-agent-devops/SKILL.md for details"
    echo ""
    exit 1
}

# Load project configuration
load_configuration() {
    if [ -f "$CONFIG_FILE" ]; then
        echo -e "${GREEN}✓${NC} Loading project configuration from .atlas/deployment-config.sh"
        source "$CONFIG_FILE"
    else
        echo -e "${YELLOW}Warning:${NC} No .atlas/deployment-config.sh found"
        echo "Using default deployment: npm run deploy"
        echo ""
        echo "To customize, create .atlas/deployment-config.sh with:"
        echo "  run_deployment() { ... }"
        echo ""

        # Define default deployment function
        run_deployment() {
            local env="$1"
            echo "Running default deployment: npm run deploy"
            npm run deploy "$env"
        }
    fi
}

# Validate changelog exists (optional - customize as needed)
validate_changelog() {
    local changelog_file="$PROJECT_ROOT/CHANGELOG.md"

    # Allow customization of changelog file
    if [ ! -z "$CHANGELOG_FILE" ]; then
        changelog_file="$PROJECT_ROOT/$CHANGELOG_FILE"
    fi

    if [ -f "$changelog_file" ]; then
        if [ -s "$changelog_file" ]; then
            echo -e "${GREEN}✓${NC} Changelog found: $changelog_file"
            return 0
        fi
    fi

    # Changelog optional - just warn
    echo -e "${YELLOW}Warning:${NC} Changelog not found or empty: $changelog_file"
    echo "Consider updating changelog before deployment"
}

# Run quality gates
run_quality_gates() {
    local skip_tests="$1"
    local skip_build="$2"

    echo ""
    echo -e "${BLUE}Running quality gates...${NC}"

    # Tests
    if [ "$skip_tests" != "true" ]; then
        if [ ! -z "$TEST_COMMAND" ]; then
            echo -e "${BLUE}Running tests:${NC} $TEST_COMMAND"
            if eval "$TEST_COMMAND"; then
                echo -e "${GREEN}✓${NC} Tests passed"
            else
                echo -e "${RED}✗${NC} Tests failed"
                exit 1
            fi
        else
            echo -e "${YELLOW}Skipping tests (no TEST_COMMAND configured)${NC}"
        fi
    else
        echo -e "${YELLOW}Skipping tests (--skip-tests)${NC}"
    fi

    # Linting
    if [ ! -z "$LINT_COMMAND" ]; then
        echo -e "${BLUE}Running linter:${NC} $LINT_COMMAND"
        if eval "$LINT_COMMAND"; then
            echo -e "${GREEN}✓${NC} Linting passed"
        else
            echo -e "${RED}✗${NC} Linting failed"
            exit 1
        fi
    fi

    # Type checking
    if [ ! -z "$TYPECHECK_COMMAND" ]; then
        echo -e "${BLUE}Running type checking:${NC} $TYPECHECK_COMMAND"
        if eval "$TYPECHECK_COMMAND"; then
            echo -e "${GREEN}✓${NC} Type checking passed"
        else
            echo -e "${RED}✗${NC} Type checking failed"
            exit 1
        fi
    fi

    # Build
    if [ "$skip_build" != "true" ]; then
        if [ ! -z "$BUILD_COMMAND" ]; then
            echo -e "${BLUE}Running build:${NC} $BUILD_COMMAND"
            if eval "$BUILD_COMMAND"; then
                echo -e "${GREEN}✓${NC} Build succeeded"
            else
                echo -e "${RED}✗${NC} Build failed"
                exit 1
            fi
        else
            echo -e "${YELLOW}Skipping build (no BUILD_COMMAND configured)${NC}"
        fi
    else
        echo -e "${YELLOW}Skipping build (--skip-build)${NC}"
    fi

    echo ""
}

# Check git state for production
check_git_state() {
    local env="$1"

    # Only enforce clean git for production (customize as needed)
    if [ "$env" != "prod" ] && [ "$env" != "production" ]; then
        return 0
    fi

    if [ ! -z "$(git status --porcelain)" ]; then
        echo -e "${RED}Error:${NC} Working directory not clean"
        echo "Production deployments require a clean git state"
        echo ""
        echo "Uncommitted changes:"
        git status --short
        echo ""
        echo "Either commit your changes or deploy to dev/staging first"
        exit 1
    fi

    echo -e "${GREEN}✓${NC} Git state is clean"
}

# Print environment information
print_environment_info() {
    local env="$1"

    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Deploying to: ${YELLOW}${env^^}${NC}"
    echo -e "${BLUE}========================================${NC}"

    case "$env" in
        dev|development)
            echo -e "Purpose:    ${GREEN}Development and testing${NC}"
            echo -e "Frequency:  ${GREEN}Multiple times per day${NC}"
            echo -e "Git State:  ${GREEN}Any${NC}"
            ;;
        staging|stage)
            echo -e "Purpose:    ${YELLOW}Pre-production validation${NC}"
            echo -e "Frequency:  ${YELLOW}Before production release${NC}"
            echo -e "Git State:  ${YELLOW}Clean recommended${NC}"
            ;;
        prod|production)
            echo -e "Purpose:    ${RED}Production release${NC}"
            echo -e "Frequency:  ${RED}Controlled releases${NC}"
            echo -e "Git State:  ${RED}Clean required${NC}"
            ;;
        *)
            echo -e "Purpose:    ${BLUE}Custom environment${NC}"
            ;;
    esac
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Main deployment function
deploy() {
    local env="$1"
    local skip_tests="$2"
    local skip_build="$3"
    local force="$4"

    # Validate environment
    if [ -z "$env" ]; then
        echo -e "${RED}Error:${NC} No environment specified"
        usage
    fi

    # Print environment information
    print_environment_info "$env"

    # Load configuration
    load_configuration

    # Validate prerequisites
    echo -e "${BLUE}Validating prerequisites...${NC}"
    validate_changelog
    check_git_state "$env"
    echo ""

    # Confirm deployment for production
    if [ "$env" = "prod" ] || [ "$env" = "production" ]; then
        if [ "$force" != "true" ]; then
            echo -e "${YELLOW}WARNING:${NC} You are about to deploy to ${RED}PRODUCTION${NC}"
            echo -e "${YELLOW}This will affect live users.${NC}"
            read -p "Continue? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                echo -e "${YELLOW}Deployment cancelled${NC}"
                exit 0
            fi
        fi
    fi

    # Run quality gates
    run_quality_gates "$skip_tests" "$skip_build"

    # Execute deployment
    echo -e "${BLUE}Executing deployment to ${env}...${NC}"
    echo ""

    if run_deployment "$env"; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✓ Deployment to ${env^^} succeeded${NC}"
        echo -e "${GREEN}========================================${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}✗ Deployment to ${env^^} failed${NC}"
        echo -e "${RED}========================================${NC}"
        exit 1
    fi
}

# Parse arguments
if [ $# -eq 0 ]; then
    usage
fi

ENVIRONMENT="$1"
shift

SKIP_TESTS="false"
SKIP_BUILD="false"
FORCE="false"

while [ $# -gt 0 ]; do
    case "$1" in
        --skip-tests)
            SKIP_TESTS="true"
            ;;
        --skip-build)
            SKIP_BUILD="true"
            ;;
        --force)
            FORCE="true"
            ;;
        *)
            echo -e "${RED}Error:${NC} Unknown option '$1'"
            usage
            ;;
    esac
    shift
done

# Execute deployment
deploy "$ENVIRONMENT" "$SKIP_TESTS" "$SKIP_BUILD" "$FORCE"
