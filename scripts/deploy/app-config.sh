#!/bin/bash

# ============================================
# App Configuration File
# Central configuration for all app-specific values
# ============================================
#
# This file contains all app-specific constants used across
# the deployment system. To port to a new app, simply copy
# this file and modify the values below.
#
# NO OTHER FILES should contain hardcoded app-specific values!
#
# ============================================

# ============================================
# App Identity
# ============================================

# App name (used in display messages and file paths)
export APP_NAME="StackMap"
export APP_NAME_LOWER="stackmap"

# App display name (used in user-facing messages)
export APP_DISPLAY_NAME="StackMap"

# ============================================
# Domain and Web Configuration
# ============================================

# Primary domain (without protocol)
export APP_DOMAIN="stackmap.app"

# Full URLs by tier
export APP_URL_PROD="https://${APP_DOMAIN}"
export APP_URL_BETA="https://${APP_DOMAIN}/beta"
export APP_URL_STAGE="https://${APP_DOMAIN}/stage"
export APP_URL_QUAL="https://${APP_DOMAIN}/qual"

# API endpoints by tier
export APP_API_PROD="https://${APP_DOMAIN}/api"
export APP_API_BETA="https://${APP_DOMAIN}/beta/api"
export APP_API_STAGE="https://${APP_DOMAIN}/stage/api"
export APP_API_QUAL="https://${APP_DOMAIN}/qual/api"

# SSH configuration for web deployment
export APP_SSH_HOST="stackmap-cpanel"
export APP_SSH_WEBROOT="~/public_html"
export APP_SSH_QUAL_DIR="${APP_SSH_WEBROOT}/qual"
export APP_SSH_BETA_DIR="${APP_SSH_WEBROOT}/beta"
export APP_SSH_STAGE_DIR="${APP_SSH_WEBROOT}/stage"

# ============================================
# Mobile App Configuration
# ============================================

# iOS Bundle ID
export APP_IOS_BUNDLE_ID="com.stackmapnative"

# Android Package Name
export APP_ANDROID_PACKAGE="com.stackmapnative"

# iOS App Store Connect Configuration
export APP_IOS_APP_ID="6738623652"
export APP_IOS_TEAM_ID="XP94X9WQ9U"
export APP_IOS_API_KEY_ID="BJAC3957M4"
export APP_IOS_ISSUER_ID="69a6de8c-9ece-47e3-e053-5b8c7c11a4d1"
export APP_IOS_API_KEY_PATH="$HOME/.fastlane/AuthKey_${APP_IOS_API_KEY_ID}.p8"

# iOS Build Configuration
export APP_IOS_SCHEME="StackMapNative"
export APP_IOS_WORKSPACE="StackMapNative.xcworkspace"
export APP_IOS_PROJECT="StackMapNative.xcodeproj"

# Android Play Store Configuration
export APP_ANDROID_APP_ID="com.stackmapnative"
export APP_ANDROID_SERVICE_ACCOUNT_KEYCHAIN_NAME="stackmap-play-store-service-account"

# ============================================
# Build Artifact Paths
# ============================================

# iOS build paths (relative to project root)
export APP_IOS_BUILD_DIR="ios/build/release"
export APP_IOS_IPA_NAME="${APP_NAME}-Release.ipa"
export APP_IOS_IPA_PATH="${APP_IOS_BUILD_DIR}/${APP_IOS_IPA_NAME}"

# Android build paths (relative to project root)
export APP_ANDROID_BUILD_DIR="android/app/build/outputs"
export APP_ANDROID_AAB_PATH="${APP_ANDROID_BUILD_DIR}/bundle/release/app-release.aab"
export APP_ANDROID_APK_DEBUG_PATH="${APP_ANDROID_BUILD_DIR}/apk/debug/app-debug.apk"

# Web build paths (relative to project root)
export APP_WEB_BUILD_DIR="web/build"
export APP_WEB_INDEX_FILE="${APP_WEB_BUILD_DIR}/index.html"

# ============================================
# Deployment Lock Configuration
# ============================================

# Lock directory for preventing concurrent deployments
export APP_DEPLOYMENT_LOCK_DIR="/tmp/${APP_NAME_LOWER}-deployment.lock"

# Deployment state directory (for rollback tracking)
export APP_DEPLOYMENT_STATE_DIR=".deployment/state"

# ============================================
# Test Configuration
# ============================================

# Test simulator/device names
export APP_IOS_TEST_PHONE="iPhone 15 Pro Max"
export APP_IOS_TEST_TABLET="iPad Pro 12.9-inch"

# Android test configuration
export APP_ANDROID_TEST_MIN_SDK="21"

# ============================================
# Deployment Status Dashboard Configuration
# ============================================

# App Store Connect (for deep linking in status page)
export APP_STORE_CONNECT_APP_ID="${APP_IOS_APP_ID}"  # Uses iOS App ID

# Google Play Console (for deep linking in status page)
# Get this from Play Console URL: developers/{DEVELOPER_ID}/...
export PLAY_CONSOLE_DEVELOPER_ID="YOUR_DEVELOPER_ID_HERE"  # TODO: Update this
export PLAY_CONSOLE_APP_ID="${APP_ANDROID_PACKAGE}"  # Uses Android package name

# Status page behavior
export AUTO_OPEN_STATUS_PAGE=true  # Auto-open status page in browser after deployment
export STATUS_PAGE_AUTO_REFRESH=true  # Enable auto-refresh during deployment
export STATUS_PAGE_REFRESH_INTERVAL=5  # Seconds between page refreshes

# ============================================
# Version File Paths
# ============================================

export APP_PACKAGE_JSON="package.json"
export APP_JSON="app.json"
export APP_VERSION_JS="src/utils/version.js"

# ============================================
# Validation
# ============================================

# Validate configuration
validate_app_config() {
    local validation_failed=false

    # Check required variables are set
    local required_vars=(
        "APP_NAME"
        "APP_DOMAIN"
        "APP_IOS_BUNDLE_ID"
        "APP_ANDROID_PACKAGE"
        "APP_SSH_HOST"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "ERROR: Required configuration variable '$var' is not set" >&2
            validation_failed=true
        fi
    done

    # Validate domain format (no protocol)
    if [[ "$APP_DOMAIN" == http* ]]; then
        echo "ERROR: APP_DOMAIN should not include protocol (http/https)" >&2
        validation_failed=true
    fi

    # Validate bundle ID format
    if [[ ! "$APP_IOS_BUNDLE_ID" =~ ^[a-z0-9.]+$ ]]; then
        echo "WARNING: APP_IOS_BUNDLE_ID has unusual format: $APP_IOS_BUNDLE_ID" >&2
    fi

    if [[ ! "$APP_ANDROID_PACKAGE" =~ ^[a-z0-9.]+$ ]]; then
        echo "WARNING: APP_ANDROID_PACKAGE has unusual format: $APP_ANDROID_PACKAGE" >&2
    fi

    if [ "$validation_failed" = true ]; then
        return 1
    else
        return 0
    fi
}

# Validate SSH connectivity (optional check)
validate_ssh_connectivity() {
    if ! command -v ssh &> /dev/null; then
        echo "WARNING: ssh command not found, skipping connectivity check" >&2
        return 0
    fi

    if timeout 5 ssh -o ConnectTimeout=5 -o BatchMode=yes "$APP_SSH_HOST" "exit" 2>/dev/null; then
        echo "SSH connectivity to $APP_SSH_HOST: OK"
        return 0
    else
        echo "WARNING: Cannot connect to SSH host: $APP_SSH_HOST" >&2
        echo "This is required for web deployment" >&2
        return 1
    fi
}

# Display configuration summary
show_app_config() {
    echo "========================================="
    echo "App Configuration Summary"
    echo "========================================="
    echo "App Name:           $APP_NAME"
    echo "Domain:             $APP_DOMAIN"
    echo "iOS Bundle ID:      $APP_IOS_BUNDLE_ID"
    echo "Android Package:    $APP_ANDROID_PACKAGE"
    echo "SSH Host:           $APP_SSH_HOST"
    echo ""
    echo "URLs:"
    echo "  Production:       $APP_URL_PROD"
    echo "  Beta:             $APP_URL_BETA"
    echo "  Stage:            $APP_URL_STAGE"
    echo "  Qual:             $APP_URL_QUAL"
    echo "========================================="
}

# Export validation functions
export -f validate_app_config validate_ssh_connectivity show_app_config

# Auto-validate on source
if ! validate_app_config; then
    echo "ERROR: App configuration validation failed" >&2
    echo "Please check scripts/app-config.sh for errors" >&2
    return 1 2>/dev/null || exit 1
fi
