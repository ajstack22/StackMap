#!/bin/bash

# ============================================
# Quality Gate Validation Functions
# Comprehensive quality checks for deployment
# ============================================

# Source common functions if not already loaded
if [ -z "$(type -t log_info)" ]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
    source "$SCRIPT_DIR/lib/common.sh"
fi

# App config is loaded via common.sh, ensure it's available
if [ -z "$APP_NAME" ]; then
    echo "ERROR: App configuration not loaded" >&2
    exit 1
fi

# ============================================
# Quality Gate: NPM Audit (Security)
# ============================================

run_npm_audit() {
    local tier="${1:-qual}"
    local fail_on_high="${2:-false}"  # Only fail on high+ vulnerabilities for beta/prod

    log_step "Running NPM Security Audit..."

    local project_root=$(get_project_root)
    cd "$project_root"

    # Create temporary file for full audit output
    local audit_file="/tmp/stackmap-audit-$(date +%s).json"

    # Run audit and capture full JSON output
    if npm audit --json > "$audit_file" 2>&1; then
        local audit_exit=0
    else
        local audit_exit=$?
    fi

    # Parse results
    local critical=$(jq -r '.metadata.vulnerabilities.critical // 0' "$audit_file" 2>/dev/null || echo "0")
    local high=$(jq -r '.metadata.vulnerabilities.high // 0' "$audit_file" 2>/dev/null || echo "0")
    local moderate=$(jq -r '.metadata.vulnerabilities.moderate // 0' "$audit_file" 2>/dev/null || echo "0")
    local low=$(jq -r '.metadata.vulnerabilities.low // 0' "$audit_file" 2>/dev/null || echo "0")
    local total=$(jq -r '.metadata.vulnerabilities.total // 0' "$audit_file" 2>/dev/null || echo "0")

    # Display results
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔒 NPM Security Audit Results"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ "$total" = "0" ]; then
        log_success "No vulnerabilities found!"
        echo ""
        rm -f "$audit_file"
        return 0
    fi

    echo "Total Vulnerabilities: $total"
    echo ""
    echo "Breakdown by Severity:"

    if [ "$critical" != "0" ]; then
        echo -e "  ${RED}Critical: $critical${NC}"
    else
        echo -e "  ${GREEN}Critical: $critical${NC}"
    fi

    if [ "$high" != "0" ]; then
        echo -e "  ${RED}High: $high${NC}"
    else
        echo -e "  ${GREEN}High: $high${NC}"
    fi

    if [ "$moderate" != "0" ]; then
        echo -e "  ${YELLOW}Moderate: $moderate${NC}"
    else
        echo -e "  ${GREEN}Moderate: $moderate${NC}"
    fi

    echo -e "  ${BLUE}Low: $low${NC}"

    # Show top vulnerabilities if present
    if [ "$critical" != "0" ] || [ "$high" != "0" ]; then
        echo ""
        echo "Critical/High Vulnerabilities:"
        jq -r '.vulnerabilities | to_entries[] | select(.value.severity == "critical" or .value.severity == "high") | "  • \(.key): \(.value.severity) - \(.value.via[0].title // "Unknown")"' "$audit_file" 2>/dev/null | head -10 || echo "  (Details unavailable)"
    fi

    echo ""
    echo "Full report saved: $audit_file"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Tier-specific failure handling
    local critical_and_high=$((critical + high))

    if [ "$fail_on_high" = "true" ] && [ $critical_and_high -gt 0 ]; then
        log_error "Found $critical_and_high critical/high vulnerabilities"
        log_info "Fix with: npm audit fix --force"
        return 1
    elif [ $critical_and_high -gt 0 ]; then
        log_warning "Found $critical_and_high critical/high vulnerabilities (non-blocking for $tier)"
        return 0
    else
        log_success "No critical or high vulnerabilities"
        return 0
    fi
}

# ============================================
# Quality Gate: ESLint (Code Quality)
# ============================================

run_eslint() {
    local tier="${1:-qual}"
    local fail_on_error="${2:-false}"

    log_step "Running ESLint Code Quality Check..."

    local project_root=$(get_project_root)
    cd "$project_root"

    # Run eslint with custom output
    local eslint_output="/tmp/stackmap-eslint-$(date +%s).txt"

    if npm run lint > "$eslint_output" 2>&1; then
        local eslint_exit=0
    else
        local eslint_exit=$?
    fi

    # Parse results (eslint outputs errors/warnings at end)
    local errors=$(grep -E "✖ [0-9]+ problems? \([0-9]+ errors?" "$eslint_output" | grep -oE "[0-9]+ errors?" | grep -oE "[0-9]+" || echo "0")
    local warnings=$(grep -E "✖ [0-9]+ problems? \([0-9]+ errors?, [0-9]+ warnings?\)" "$eslint_output" | grep -oE "[0-9]+ warnings?" | grep -oE "[0-9]+" || echo "0")
    local total=$(grep -E "✖ [0-9]+ problems?" "$eslint_output" | grep -oE "[0-9]+" | head -1 || echo "0")

    # If we got zero parsed but eslint failed, there might be errors
    if [ $eslint_exit -ne 0 ] && [ "$total" = "0" ]; then
        errors="unknown"
        warnings="unknown"
        total="unknown"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 ESLint Code Quality Results"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ $eslint_exit -eq 0 ]; then
        log_success "No linting issues found!"
        echo ""
        rm -f "$eslint_output"
        return 0
    fi

    echo "Total Issues: $total"
    echo ""

    if [ "$errors" != "0" ] && [ "$errors" != "unknown" ]; then
        echo -e "  ${RED}Errors: $errors${NC}"
    else
        echo -e "  ${GREEN}Errors: ${errors:-0}${NC}"
    fi

    if [ "$warnings" != "0" ] && [ "$warnings" != "unknown" ]; then
        echo -e "  ${YELLOW}Warnings: $warnings${NC}"
    else
        echo -e "  ${GREEN}Warnings: ${warnings:-0}${NC}"
    fi

    # Show sample issues
    echo ""
    echo "Sample Issues (first 15 lines):"
    head -15 "$eslint_output" | grep -E "error|warning|✖" || echo "  (No issues to display)"

    echo ""
    echo "Full report saved: $eslint_output"
    echo "Fix with: npm run lint -- --fix"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Tier-specific failure handling
    if [ "$fail_on_error" = "true" ] && [ "$errors" != "0" ]; then
        log_error "ESLint found $errors errors"
        return 1
    else
        log_warning "ESLint found issues (non-blocking for $tier)"
        return 0
    fi
}

# ============================================
# Quality Gate: TypeScript Check
# ============================================

run_typescript_check() {
    local tier="${1:-qual}"
    local fail_on_error="${2:-false}"

    log_step "Running TypeScript Type Check..."

    local project_root=$(get_project_root)
    cd "$project_root"

    # Check if TypeScript is configured
    if [ ! -f "tsconfig.json" ]; then
        log_info "TypeScript not configured, skipping"
        return 0
    fi

    local typecheck_output="/tmp/stackmap-typecheck-$(date +%s).txt"

    if npm run typecheck > "$typecheck_output" 2>&1; then
        local typecheck_exit=0
    else
        local typecheck_exit=$?
    fi

    # Count errors
    local errors=$(grep -c "error TS" "$typecheck_output" 2>/dev/null || echo "0")

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔷 TypeScript Type Check Results"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ $typecheck_exit -eq 0 ]; then
        log_success "No type errors found!"
        echo ""
        rm -f "$typecheck_output"
        return 0
    fi

    echo "Type Errors: $errors"
    echo ""
    echo "Sample Errors (first 20 lines):"
    head -20 "$typecheck_output" | grep "error TS" || echo "  (No errors to display)"

    echo ""
    echo "Full report saved: $typecheck_output"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Tier-specific failure handling
    if [ "$fail_on_error" = "true" ] && [ $typecheck_exit -ne 0 ]; then
        log_error "TypeScript check failed with $errors errors"
        return 1
    else
        log_warning "TypeScript found issues (non-blocking for $tier)"
        return 0
    fi
}

# ============================================
# Quality Gate: License Check
# ============================================

run_license_check() {
    local tier="${1:-qual}"
    local fail_on_restricted="${2:-false}"

    log_step "Running Open Source License Check..."

    local project_root=$(get_project_root)
    cd "$project_root"

    # Check if license-checker is available
    if ! command -v license-checker &> /dev/null; then
        log_warning "license-checker not installed, skipping"
        log_info "Install with: npm install -g license-checker"
        return 0
    fi

    local license_output="/tmp/stackmap-licenses-$(date +%s).txt"

    # Run license check
    license-checker --production --summary > "$license_output" 2>&1

    # Check for restricted licenses
    local restricted_output="/tmp/stackmap-restricted-$(date +%s).txt"
    if license-checker --production --json 2>/dev/null | jq -r 'to_entries[] | select(.value.licenses | tostring | test("GPL|AGPL|LGPL|SSPL")) | "\(.key): \(.value.licenses)"' > "$restricted_output" 2>/dev/null; then
        local restricted_count=$(wc -l < "$restricted_output" | tr -d ' ')
    else
        local restricted_count=0
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📜 Open Source License Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Display summary
    cat "$license_output"

    echo ""

    if [ "$restricted_count" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found $restricted_count packages with restricted licenses:${NC}"
        cat "$restricted_output"
        echo ""
    else
        log_success "No restricted licenses found (GPL, AGPL, LGPL, SSPL)"
    fi

    echo "Full report saved: $license_output"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Tier-specific failure handling
    if [ "$fail_on_restricted" = "true" ] && [ "$restricted_count" -gt 0 ]; then
        log_error "Found $restricted_count packages with restricted licenses"
        return 1
    else
        return 0
    fi
}

# ============================================
# Quality Gate: SonarQube Analysis
# ============================================

run_sonarqube_analysis() {
    local tier="${1:-qual}"
    local fail_on_gate="${2:-false}"

    log_step "Running SonarQube Code Analysis..."

    local project_root=$(get_project_root)
    cd "$project_root"

    # Check if sonar-scanner is available
    if ! command -v sonar-scanner &> /dev/null; then
        log_warning "sonar-scanner not installed, skipping"
        log_info "Install from: https://docs.sonarqube.org/latest/analyzing-source-code/scanners/sonarscanner/"
        return 0
    fi

    # Check if SONAR_TOKEN is set
    if [ -z "$SONAR_TOKEN" ]; then
        # Try to load from env files
        if [ -f "$HOME/.manylla-env" ]; then
            source "$HOME/.manylla-env"
        elif [ -f "$HOME/.stackmap-env" ]; then
            source "$HOME/.stackmap-env"
        fi

        if [ -z "$SONAR_TOKEN" ]; then
            log_warning "SONAR_TOKEN not set, skipping SonarQube analysis"
            log_info "Set with: export SONAR_TOKEN='your-token'"
            return 0
        fi
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 SonarQube Code Analysis"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Run analysis via utility script
    if [ -f "$project_root/scripts/utilities/sonar-analysis.sh" ]; then
        "$project_root/scripts/utilities/sonar-analysis.sh" || log_warning "SonarQube analysis completed with warnings"
    else
        log_warning "SonarQube analysis script not found"
    fi

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Always succeed for now (SonarQube gate checking requires API integration)
    return 0
}

# ============================================
# Run All Quality Gates
# ============================================

run_all_quality_gates() {
    local tier="${1:-qual}"

    log_header "🎯 Quality Gate Validation"

    local gates_failed=false

    # Determine which gates should be blocking based on tier
    local fail_security=false
    local fail_lint=false
    local fail_types=false
    local fail_licenses=false
    local fail_sonar=false

    case "$tier" in
        qual)
            # Qual: Nothing blocking (warnings only)
            ;;
        stage)
            # Stage: Security blocking
            fail_security=true
            ;;
        beta)
            # Beta: Security and critical linting blocking
            fail_security=true
            fail_lint=true
            ;;
        prod)
            # Prod: Everything blocking
            fail_security=true
            fail_lint=true
            fail_types=true
            fail_licenses=true
            ;;
    esac

    echo ""
    log_info "Running quality gates for tier: $(echo "$tier" | tr '[:lower:]' '[:upper:]')"
    echo ""

    # Run each quality gate
    run_npm_audit "$tier" "$fail_security" || gates_failed=true
    run_eslint "$tier" "$fail_lint" || gates_failed=true
    run_typescript_check "$tier" "$fail_types" || gates_failed=true
    run_license_check "$tier" "$fail_licenses" || gates_failed=true
    run_sonarqube_analysis "$tier" "$fail_sonar" || gates_failed=true

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ "$gates_failed" = true ]; then
        log_error "Quality gate validation FAILED"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 1
    else
        log_success "Quality gate validation PASSED"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 0
    fi
}

# Export functions
export -f run_npm_audit run_eslint run_typescript_check
export -f run_license_check run_sonarqube_analysis
export -f run_all_quality_gates
