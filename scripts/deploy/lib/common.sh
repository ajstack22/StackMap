#!/bin/bash

# ============================================
# Common Deployment Library Functions
# Shared utilities for all deployment scripts
# ============================================

# Load app configuration
SCRIPT_DIR_COMMON="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$SCRIPT_DIR_COMMON/app-config.sh" ]; then
    source "$SCRIPT_DIR_COMMON/app-config.sh"
else
    echo "ERROR: app-config.sh not found at $SCRIPT_DIR_COMMON/app-config.sh" >&2
    exit 1
fi

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export MAGENTA='\033[0;35m'
export CYAN='\033[0;36m'
export NC='\033[0m' # No Color

# ============================================
# Logging Functions
# ============================================

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo -e "${MAGENTA}→ $1${NC}"
}

log_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

log_section() {
    echo ""
    echo "========================================="
    echo "$1"
    echo "========================================="
}

# ============================================
# Project Path Functions
# ============================================

get_project_root() {
    # This function should be called after SCRIPT_DIR is set
    # Returns the absolute path to the project root
    if [ -n "$PROJECT_ROOT" ]; then
        echo "$PROJECT_ROOT"
    else
        # SCRIPT_DIR is now in scripts/deploy/, so go up two levels to reach project root
        echo "$(dirname "$(dirname "$SCRIPT_DIR")")"
    fi
}

get_scripts_dir() {
    if [ -n "$SCRIPT_DIR" ]; then
        echo "$SCRIPT_DIR"
    else
        echo "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    fi
}

# ============================================
# Version Management Functions
# ============================================

get_current_version() {
    local project_root=$(get_project_root)
    grep '"version":' "$project_root/package.json" | head -1 | cut -d'"' -f4
}

get_version_date() {
    # Extract date from version format: YYYY.MM.DD.BUILD
    local version=$(get_current_version)
    # Remove beta suffix if present
    version="${version%-beta}"
    # Extract YYYY.MM.DD
    echo "$version" | cut -d'.' -f1-3
}

get_version_build() {
    # Extract build number from version format: YYYY.MM.DD.BUILD
    local version=$(get_current_version)
    # Remove beta suffix if present
    version="${version%-beta}"
    # Extract BUILD
    echo "$version" | cut -d'.' -f4
}

is_beta_version() {
    local version="${1:-$(get_current_version)}"
    [[ "$version" == *"-beta"* ]]
}

# ============================================
# Timestamp Functions
# ============================================

get_timestamp() {
    date +"%Y-%m-%d %H:%M:%S"
}

get_timestamp_compact() {
    date +"%Y%m%d-%H%M%S"
}

get_date_compact() {
    date +"%Y-%m-%d"
}

# ============================================
# User Confirmation Functions
# ============================================

confirm_deployment() {
    local tier="$1"
    local platforms="$2"

    echo ""
    log_warning "You are about to deploy to: $(echo "$tier" | tr '[:lower:]' '[:upper:]')"
    echo "$platforms"
    echo ""

    read -p "Continue with deployment? (y/N) " -n 1 -r
    echo

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled by user"
        exit 0
    fi
}

confirm_action() {
    local message="$1"

    read -p "$message (y/N) " -n 1 -r
    echo

    [[ $REPLY =~ ^[Yy]$ ]]
}

# ============================================
# File Existence Checks
# ============================================

check_file_exists() {
    local file_path="$1"
    local description="${2:-File}"

    if [ -f "$file_path" ]; then
        log_success "$description found: $file_path"
        return 0
    else
        log_error "$description not found: $file_path"
        return 1
    fi
}

check_dir_exists() {
    local dir_path="$1"
    local description="${2:-Directory}"

    if [ -d "$dir_path" ]; then
        log_success "$description found: $dir_path"
        return 0
    else
        log_error "$description not found: $dir_path"
        return 1
    fi
}

# ============================================
# Command Existence Checks
# ============================================

check_command_exists() {
    local command="$1"
    local description="${2:-$command}"

    if command -v "$command" &> /dev/null; then
        log_success "$description is available"
        return 0
    else
        log_error "$description is not installed"
        return 1
    fi
}

# ============================================
# Git Functions
# ============================================

get_git_branch() {
    git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"
}

get_git_commit() {
    git rev-parse --short HEAD 2>/dev/null || echo "unknown"
}

get_git_status_clean() {
    # Returns 0 if git status is clean, 1 if there are changes
    if [[ -z $(git status --porcelain) ]]; then
        return 0
    else
        return 1
    fi
}

# ============================================
# Interactive Git Functions
# ============================================

is_interactive() {
    # Check if we're in an interactive terminal
    # Returns 0 if interactive, 1 if non-interactive (CI/CD)
    if [ -t 0 ] && [ -t 1 ]; then
        return 0  # Interactive
    else
        return 1  # Non-interactive
    fi
}

commit_uncommitted_changes() {
    local tier="$1"
    local commit_message="${2:-Automated commit for $tier deployment}"

    log_step "Committing changes..."

    # Add all changes
    if ! git add -A; then
        log_error "Failed to stage changes"
        return 1
    fi

    # Create commit with deployment message
    local full_message="$commit_message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    if ! git commit -m "$full_message"; then
        log_error "Failed to commit changes"
        return 1
    fi

    log_success "Changes committed successfully"

    # Ask about pushing
    if is_interactive; then
        if confirm_action "Push changes to remote?"; then
            log_step "Pushing to remote..."
            if git push; then
                log_success "Changes pushed to remote"
            else
                log_warning "Push failed - you may need to push manually later"
            fi
        else
            log_info "Skipping push - remember to push changes later"
        fi
    fi

    return 0
}

handle_uncommitted_changes() {
    local tier="$1"
    local require_clean="${2:-false}"  # Whether clean status is required

    # Check if there are uncommitted changes
    if get_git_status_clean; then
        return 0  # No uncommitted changes
    fi

    # Show what's changed
    log_warning "Uncommitted changes detected:"
    echo ""
    git status --short
    echo ""

    # In CI/CD or if not required to be clean, just warn
    if ! is_interactive; then
        if [ "$require_clean" = "true" ]; then
            log_error "Cannot proceed with uncommitted changes in non-interactive mode"
            return 1
        else
            log_warning "Proceeding with uncommitted changes (non-interactive mode)"
            return 0
        fi
    fi

    # Interactive mode - ask user what to do
    echo "Options:"
    echo "  1) Commit and continue"
    echo "  2) Continue without committing"
    echo "  3) Cancel deployment"
    echo ""

    read -p "Choose an option (1-3): " -n 1 -r
    echo

    case $REPLY in
        1)
            # Get custom commit message
            echo ""
            read -p "Enter commit message (or press Enter for default): " custom_message

            if [ -z "$custom_message" ]; then
                custom_message="Pre-deployment changes for $tier"
            fi

            if commit_uncommitted_changes "$tier" "$custom_message"; then
                log_success "Changes committed, continuing deployment"
                return 0
            else
                log_error "Failed to commit changes"
                return 1
            fi
            ;;
        2)
            if [ "$require_clean" = "true" ]; then
                log_error "Cannot proceed with uncommitted changes for $tier deployment"
                log_info "Beta and production deployments require a clean git state"
                return 1
            else
                log_warning "Continuing with uncommitted changes"
                return 0
            fi
            ;;
        3)
            log_info "Deployment cancelled by user"
            exit 0
            ;;
        *)
            log_error "Invalid option"
            return 1
            ;;
    esac
}

# ============================================
# Platform Detection
# ============================================

is_macos() {
    [[ "$OSTYPE" == "darwin"* ]]
}

is_linux() {
    [[ "$OSTYPE" == "linux-gnu"* ]]
}

# ============================================
# Text Formatting
# ============================================

format_duration() {
    local total_seconds=$1
    local minutes=$((total_seconds / 60))
    local seconds=$((total_seconds % 60))

    if [ $minutes -gt 0 ]; then
        echo "${minutes}m ${seconds}s"
    else
        echo "${seconds}s"
    fi
}

# ============================================
# Array Utilities
# ============================================

array_contains() {
    local element="$1"
    shift
    local array=("$@")

    for item in "${array[@]}"; do
        if [ "$item" = "$element" ]; then
            return 0
        fi
    done
    return 1
}

# ============================================
# Initialization
# ============================================

# Set common variables if not already set
if [ -z "$DEPLOYMENT_START_TIME" ]; then
    export DEPLOYMENT_START_TIME=$(date +%s)
fi

# ============================================
# Deployment Locking Functions
# Prevents concurrent deployments
# Cross-platform implementation using mkdir (works on macOS and Linux)
# ============================================

LOCK_DIR="${APP_DEPLOYMENT_LOCK_DIR}"

acquire_deployment_lock() {
    local tier="$1"
    local max_wait=30
    local waited=0

    log_step "Acquiring deployment lock..."

    # Try to acquire lock using atomic mkdir
    # mkdir will fail if directory already exists (atomic operation)
    while ! mkdir "$LOCK_DIR" 2>/dev/null; do
        # Lock is held by another process
        if [ $waited -eq 0 ]; then
            log_warning "Another deployment is in progress"
            log_info "Lock directory: $LOCK_DIR"
            echo ""

            # Try to read lock info if available
            if [ -f "$LOCK_DIR/info" ]; then
                echo "Current deployment info:"
                cat "$LOCK_DIR/info" 2>/dev/null || true
                echo ""
            fi
        fi

        # Check if we've waited too long
        if [ $waited -ge $max_wait ]; then
            log_error "Could not acquire deployment lock after ${max_wait}s"
            echo ""
            log_info "If you're sure no deployment is running:"
            log_info "  1. Check for running deployment processes: ps aux | grep deploy"
            log_info "  2. Check lock PID: cat $LOCK_DIR/pid"
            log_info "  3. Remove lock directory: rm -rf $LOCK_DIR"
            log_info "  4. Try deployment again"
            exit 1
        fi

        # Wait and retry
        if [ $waited -eq 0 ]; then
            log_info "Waiting for lock (timeout: ${max_wait}s)..."
        fi
        sleep 1
        waited=$((waited + 1))
    done

    # Lock acquired - write deployment metadata
    echo "$$" > "$LOCK_DIR/pid"
    cat > "$LOCK_DIR/info" << EOF
tier=$tier
pid=$$
user=$USER
started=$(date)
hostname=$(hostname)
EOF

    log_success "Deployment lock acquired"
}

release_deployment_lock() {
    # Remove lock directory if it exists
    if [ -d "$LOCK_DIR" ]; then
        # Verify this is our lock (check PID)
        if [ -f "$LOCK_DIR/pid" ]; then
            local lock_pid=$(cat "$LOCK_DIR/pid" 2>/dev/null || echo "unknown")
            if [ "$lock_pid" = "$$" ] || [ "$lock_pid" = "unknown" ]; then
                rm -rf "$LOCK_DIR" 2>/dev/null || true
                log_info "Deployment lock released"
            else
                log_warning "Lock held by different process (PID: $lock_pid), not releasing"
            fi
        else
            # No PID file, safe to remove
            rm -rf "$LOCK_DIR" 2>/dev/null || true
            log_info "Deployment lock released"
        fi
    fi
}

# Export all functions
export -f log_info log_success log_warning log_error log_step log_header log_section
export -f get_project_root get_scripts_dir
export -f get_current_version get_version_date get_version_build is_beta_version
export -f get_timestamp get_timestamp_compact get_date_compact
export -f confirm_deployment confirm_action
export -f check_file_exists check_dir_exists check_command_exists
export -f get_git_branch get_git_commit get_git_status_clean
export -f is_interactive commit_uncommitted_changes handle_uncommitted_changes
export -f is_macos is_linux
export -f format_duration array_contains
export -f acquire_deployment_lock release_deployment_lock
