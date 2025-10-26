#!/bin/bash

# deploy-all.sh - Wrapper around master deployment script
# Simplifies multi-tier deployments and provides color-coded output

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Master deployment script
DEPLOY_SCRIPT="$PROJECT_ROOT/scripts/deploy.sh"

# Usage information
usage() {
    echo -e "${BLUE}Usage:${NC} $0 [tier] [options]"
    echo ""
    echo "Tiers:"
    echo "  qual      Deploy to QUAL (development testing)"
    echo "  stage     Deploy to STAGE (internal validation)"
    echo "  beta      Deploy to BETA (closed beta testing)"
    echo "  prod      Deploy to PROD (public release)"
    echo ""
    echo "Options:"
    echo "  --all           Deploy all platforms (default)"
    echo "  --web           Deploy web only"
    echo "  --ios           Deploy iOS only"
    echo "  --android       Deploy Android only"
    echo "  --ios-device    Deploy iOS to physical device (QUAL only)"
    echo ""
    echo "Examples:"
    echo "  $0 qual --all"
    echo "  $0 beta --ios --android"
    echo "  $0 prod --web"
    echo ""
    exit 1
}

# Validate PENDING_CHANGES.md exists
validate_pending_changes() {
    if [ ! -f "$PROJECT_ROOT/PENDING_CHANGES.md" ]; then
        echo -e "${RED}Error:${NC} PENDING_CHANGES.md not found"
        echo "Please create PENDING_CHANGES.md with your deployment changes:"
        echo ""
        echo "## Title: [Descriptive title]"
        echo "### Changes Made:"
        echo "- [Change 1]"
        echo "- [Change 2]"
        echo ""
        exit 1
    fi

    # Check if file has content (more than just whitespace)
    if [ ! -s "$PROJECT_ROOT/PENDING_CHANGES.md" ]; then
        echo -e "${RED}Error:${NC} PENDING_CHANGES.md is empty"
        echo "Please add deployment changes to PENDING_CHANGES.md"
        exit 1
    fi

    echo -e "${GREEN}✓${NC} PENDING_CHANGES.md found and has content"
}

# Validate master deployment script exists
validate_deploy_script() {
    if [ ! -f "$DEPLOY_SCRIPT" ]; then
        echo -e "${RED}Error:${NC} Master deployment script not found at $DEPLOY_SCRIPT"
        exit 1
    fi

    if [ ! -x "$DEPLOY_SCRIPT" ]; then
        echo -e "${YELLOW}Warning:${NC} Making deployment script executable"
        chmod +x "$DEPLOY_SCRIPT"
    fi

    echo -e "${GREEN}✓${NC} Master deployment script found"
}

# Print tier information
print_tier_info() {
    local tier="$1"

    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Deploying to: ${YELLOW}${tier^^}${NC}"
    echo -e "${BLUE}========================================${NC}"

    case "$tier" in
        qual)
            echo -e "Purpose:    ${GREEN}Development testing${NC}"
            echo -e "API:        ${GREEN}qual-api.stackmap.app${NC}"
            echo -e "Database:   ${GREEN}Qual DB${NC}"
            echo -e "Platforms:  ${GREEN}Web + Mobile${NC}"
            echo -e "Git State:  ${GREEN}Uncommitted OK${NC}"
            echo -e "Frequency:  ${GREEN}Multiple/day${NC}"
            ;;
        stage)
            echo -e "Purpose:    ${YELLOW}Internal validation${NC}"
            echo -e "API:        ${YELLOW}qual-api.stackmap.app${NC}"
            echo -e "Database:   ${YELLOW}Qual DB${NC}"
            echo -e "Platforms:  ${YELLOW}Mobile only${NC}"
            echo -e "Git State:  ${YELLOW}Uncommitted OK${NC}"
            echo -e "Frequency:  ${YELLOW}Before beta${NC}"
            ;;
        beta)
            echo -e "Purpose:    ${YELLOW}Closed beta testing${NC}"
            echo -e "API:        ${YELLOW}beta-api.stackmap.app${NC}"
            echo -e "Database:   ${YELLOW}Prod DB${NC}"
            echo -e "Platforms:  ${YELLOW}Web + Mobile${NC}"
            echo -e "Git State:  ${RED}Clean required${NC}"
            echo -e "Frequency:  ${YELLOW}1-2/week${NC}"
            ;;
        prod)
            echo -e "Purpose:    ${RED}Public release${NC}"
            echo -e "API:        ${RED}api.stackmap.app${NC}"
            echo -e "Database:   ${RED}Prod DB${NC}"
            echo -e "Platforms:  ${RED}Web + Mobile${NC}"
            echo -e "Git State:  ${RED}Clean required${NC}"
            echo -e "Frequency:  ${RED}Weekly/bi-weekly${NC}"
            ;;
    esac
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

# Main deployment function
deploy() {
    local tier="$1"
    shift
    local options="$@"

    # Validate tier
    case "$tier" in
        qual|stage|beta|prod)
            ;;
        *)
            echo -e "${RED}Error:${NC} Invalid tier '$tier'"
            usage
            ;;
    esac

    # Print tier information
    print_tier_info "$tier"

    # Validate prerequisites
    echo -e "${BLUE}Validating prerequisites...${NC}"
    validate_pending_changes
    validate_deploy_script
    echo ""

    # Confirm deployment for BETA/PROD
    if [ "$tier" = "beta" ] || [ "$tier" = "prod" ]; then
        echo -e "${YELLOW}WARNING:${NC} You are about to deploy to ${RED}${tier^^}${NC}"
        echo -e "${YELLOW}This requires a clean git state.${NC}"
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
    fi

    # Execute deployment via master script
    echo -e "${BLUE}Executing deployment...${NC}"
    echo -e "${BLUE}Command:${NC} $DEPLOY_SCRIPT $tier $options"
    echo ""

    if "$DEPLOY_SCRIPT" "$tier" $options; then
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}✓ Deployment to ${tier^^} succeeded${NC}"
        echo -e "${GREEN}========================================${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}✗ Deployment to ${tier^^} failed${NC}"
        echo -e "${RED}========================================${NC}"
        exit 1
    fi
}

# Check arguments
if [ $# -eq 0 ]; then
    usage
fi

# Parse tier and options
TIER="$1"
shift
OPTIONS="$@"

# If no options provided, default to --all
if [ -z "$OPTIONS" ]; then
    OPTIONS="--all"
fi

# Execute deployment
deploy "$TIER" $OPTIONS
