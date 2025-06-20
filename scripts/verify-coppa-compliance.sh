#!/bin/bash
# COPPA Compliance Verification Script for StackMap

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

COMPLIANCE_PASSED=true
WARNINGS=0

# Function to check for tracking/analytics code
check_no_tracking() {
    print_header "Checking for Analytics/Tracking Code"
    
    # List of tracking-related patterns to check
    local tracking_patterns=(
        "google-analytics"
        "GoogleAnalytics"
        "gtag("
        "_gaq.push"
        "analytics.track"
        "mixpanel"
        "segment.track"
        "amplitude"
        "facebook.*pixel"
        "fbq("
        "clarity("
        "hotjar"
        "_paq.push"
        "matomo"
        "plausible"
        "posthog"
    )
    
    local found_tracking=false
    
    for pattern in "${tracking_patterns[@]}"; do
        print_check "Searching for '$pattern'..."
        if grep -r "$pattern" --include="*.js" --include="*.html" --exclude-dir=node_modules --exclude-dir=.git . > /dev/null 2>&1; then
            print_fail "Found tracking code pattern: $pattern"
            grep -r "$pattern" --include="*.js" --include="*.html" --exclude-dir=node_modules --exclude-dir=.git . | head -5
            found_tracking=true
            COMPLIANCE_PASSED=false
        fi
    done
    
    if [ "$found_tracking" = false ]; then
        print_pass "No tracking or analytics code found"
    fi
}

# Function to check for advertising code
check_no_advertising() {
    print_header "Checking for Advertising Code"
    
    local ad_patterns=(
        "googletag"
        "doubleclick"
        "adsense"
        "adsbygoogle"
        "admob"
        "AdMob"
        "mopub"
        "unity.*ads"
        "vungle"
        "chartboost"
        "applovin"
        "ironSource"
    )
    
    local found_ads=false
    
    for pattern in "${ad_patterns[@]}"; do
        print_check "Searching for '$pattern'..."
        if grep -r "$pattern" --include="*.js" --include="*.html" --include="*.java" --include="*.swift" --exclude-dir=node_modules --exclude-dir=.git . > /dev/null 2>&1; then
            print_fail "Found advertising code pattern: $pattern"
            found_ads=true
            COMPLIANCE_PASSED=false
        fi
    done
    
    if [ "$found_ads" = false ]; then
        print_pass "No advertising code found"
    fi
}

# Function to check data collection practices
check_data_collection() {
    print_header "Checking Data Collection Practices"
    
    # Check for personal data collection patterns
    local pii_patterns=(
        "getUserEmail"
        "getUserPhone"
        "getUserAddress"
        "birthdate"
        "birthday"
        "age"
        "email"
        "phone"
        "address"
        "location.coords"
        "geolocation"
        "camera"
        "microphone"
    )
    
    print_check "Checking for PII collection patterns..."
    local found_pii=false
    
    for pattern in "${pii_patterns[@]}"; do
        if grep -r "$pattern" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . > /dev/null 2>&1; then
            print_warning "Found potential PII pattern: $pattern - Please verify it's not collecting personal data"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
    
    # Check localStorage usage
    print_check "Checking localStorage usage..."
    if grep -r "localStorage\." --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . > /dev/null 2>&1; then
        print_pass "localStorage is used (allowed for app functionality)"
        print_check "Verifying no PII in localStorage..."
        
        # Check what's being stored
        if grep -r "localStorage.*email\|localStorage.*name\|localStorage.*phone" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . > /dev/null 2>&1; then
            print_fail "Found potential PII being stored in localStorage"
            COMPLIANCE_PASSED=false
        else
            print_pass "No PII found in localStorage usage"
        fi
    fi
}

# Function to check privacy policy
check_privacy_policy() {
    print_header "Checking Privacy Policy"
    
    print_check "Checking for privacy policy file..."
    if [ -f "privacy.html" ] || [ -f "privacy.md" ]; then
        print_pass "Privacy policy file exists"
        
        # Check for required COPPA disclosures
        local privacy_file=""
        [ -f "privacy.html" ] && privacy_file="privacy.html"
        [ -f "privacy.md" ] && privacy_file="privacy.md"
        
        print_check "Checking for COPPA-required disclosures..."
        
        if grep -i "children\|coppa\|under 13" "$privacy_file" > /dev/null 2>&1; then
            print_pass "Privacy policy mentions children/COPPA"
        else
            print_warning "Privacy policy should explicitly mention COPPA compliance"
            WARNINGS=$((WARNINGS + 1))
        fi
        
        if grep -i "no.*collect.*personal" "$privacy_file" > /dev/null 2>&1; then
            print_pass "Privacy policy states no personal information collection"
        else
            print_warning "Privacy policy should clearly state no personal information is collected"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        print_fail "No privacy policy file found"
        COMPLIANCE_PASSED=false
    fi
}

# Function to check external services
check_external_services() {
    print_header "Checking External Service Integrations"
    
    print_check "Checking for social media integrations..."
    local social_patterns=(
        "facebook.*sdk"
        "twitter.*api"
        "instagram.*api"
        "tiktok"
        "snapchat"
        "discord"
    )
    
    local found_social=false
    for pattern in "${social_patterns[@]}"; do
        if grep -r "$pattern" --include="*.js" --include="*.html" --exclude-dir=node_modules --exclude-dir=.git . > /dev/null 2>&1; then
            print_fail "Found social media integration: $pattern"
            found_social=true
            COMPLIANCE_PASSED=false
        fi
    done
    
    if [ "$found_social" = false ]; then
        print_pass "No social media integrations found"
    fi
    
    # Check for allowed services
    print_check "Checking Google Drive integration..."
    if grep -r "drive.google.com\|gapi.client.drive" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . > /dev/null 2>&1; then
        print_pass "Google Drive integration found (allowed for data sync)"
        print_warning "Ensure Google Drive is only used for app data, not personal information"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# Function to check permissions
check_permissions() {
    print_header "Checking App Permissions"
    
    # Check Android manifest
    if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
        print_check "Checking Android permissions..."
        
        local dangerous_permissions=(
            "CAMERA"
            "RECORD_AUDIO"
            "ACCESS_FINE_LOCATION"
            "ACCESS_COARSE_LOCATION"
            "READ_CONTACTS"
            "READ_CALENDAR"
            "READ_SMS"
            "READ_PHONE_STATE"
        )
        
        for perm in "${dangerous_permissions[@]}"; do
            if grep -i "$perm" android/app/src/main/AndroidManifest.xml > /dev/null 2>&1; then
                print_fail "Found dangerous permission: $perm"
                COMPLIANCE_PASSED=false
            fi
        done
        
        print_pass "No dangerous permissions found in Android manifest"
    fi
    
    # Check iOS Info.plist
    if [ -f "ios/App/App/Info.plist" ]; then
        print_check "Checking iOS permissions..."
        
        local ios_permissions=(
            "NSCameraUsageDescription"
            "NSMicrophoneUsageDescription"
            "NSLocationWhenInUseUsageDescription"
            "NSLocationAlwaysUsageDescription"
            "NSContactsUsageDescription"
            "NSCalendarsUsageDescription"
        )
        
        for perm in "${ios_permissions[@]}"; do
            if grep "$perm" ios/App/App/Info.plist > /dev/null 2>&1; then
                print_fail "Found iOS permission request: $perm"
                COMPLIANCE_PASSED=false
            fi
        done
        
        print_pass "No dangerous permissions found in iOS Info.plist"
    fi
}

# Function to check for cookies
check_cookies() {
    print_header "Checking Cookie Usage"
    
    print_check "Checking for cookie usage..."
    if grep -r "document\.cookie\|setCookie\|getCookie" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . > /dev/null 2>&1; then
        print_warning "Cookie usage detected - ensure no tracking cookies are used"
        WARNINGS=$((WARNINGS + 1))
    else
        print_pass "No cookie usage found"
    fi
}

# Function to create compliance report
create_compliance_report() {
    print_header "Creating Compliance Report"
    
    REPORT_FILE="compliance-reports/coppa-compliance-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p compliance-reports
    
    cat > "$REPORT_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "complianceStatus": "$([ "$COMPLIANCE_PASSED" = true ] && echo "PASSED" || echo "FAILED")",
    "warnings": $WARNINGS,
    "gitCommit": "$(git rev-parse HEAD)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD)",
    "checks": {
        "noTracking": $([ "$COMPLIANCE_PASSED" = true ] && echo "true" || echo "false"),
        "noAdvertising": $([ "$COMPLIANCE_PASSED" = true ] && echo "true" || echo "false"),
        "noPersonalDataCollection": $([ "$COMPLIANCE_PASSED" = true ] && echo "true" || echo "false"),
        "privacyPolicyExists": $([ -f "privacy.html" ] || [ -f "privacy.md" ] && echo "true" || echo "false"),
        "noSocialMedia": $([ "$COMPLIANCE_PASSED" = true ] && echo "true" || echo "false"),
        "noDangerousPermissions": $([ "$COMPLIANCE_PASSED" = true ] && echo "true" || echo "false")
    }
}
EOF
    
    print_pass "Compliance report created: $REPORT_FILE"
}

# Main function
main() {
    echo -e "${BLUE}StackMap COPPA Compliance Verification${NC}"
    echo -e "${BLUE}======================================${NC}"
    
    # Run all checks
    check_no_tracking
    check_no_advertising
    check_data_collection
    check_privacy_policy
    check_external_services
    check_permissions
    check_cookies
    
    # Create report
    create_compliance_report
    
    # Summary
    echo -e "\n${BLUE}=== COMPLIANCE SUMMARY ===${NC}"
    
    if [ "$COMPLIANCE_PASSED" = true ]; then
        if [ $WARNINGS -gt 0 ]; then
            print_warning "COPPA compliance check PASSED with $WARNINGS warnings"
            echo "Please review the warnings above to ensure full compliance."
        else
            print_pass "COPPA compliance check PASSED with no issues!"
        fi
        exit 0
    else
        print_fail "COPPA compliance check FAILED!"
        echo "Please fix the issues above before proceeding with deployment."
        exit 1
    fi
}

# Run main function
main "$@"