#!/bin/bash
# Mobile Testing Script for StackMap

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Run web tests
run_web_tests() {
    print_status "Running web application tests..."
    
    if npm test; then
        print_success "Web tests passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_fail "Web tests failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Run Android tests
run_android_tests() {
    print_status "Running Android tests..."
    
    cd android
    
    # Run unit tests
    if ./gradlew test; then
        print_success "Android unit tests passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_fail "Android unit tests failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Run instrumented tests if device available
    if adb devices | grep -q "device$"; then
        print_status "Running Android instrumented tests..."
        if ./gradlew connectedAndroidTest; then
            print_success "Android instrumented tests passed"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_fail "Android instrumented tests failed"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        print_warning "No Android device connected, skipping instrumented tests"
    fi
    
    cd ..
}

# Run iOS tests
run_ios_tests() {
    print_status "Running iOS tests..."
    
    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_warning "iOS tests can only run on macOS"
        return
    fi
    
    cd ios/App
    
    # Run tests
    if xcodebuild test \
        -workspace App.xcworkspace \
        -scheme App \
        -destination 'platform=iOS Simulator,name=iPhone 14,OS=latest' \
        -quiet; then
        print_success "iOS tests passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_fail "iOS tests failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    cd ../..
}

# Run PWA tests
run_pwa_tests() {
    print_status "Running PWA compliance tests..."
    
    # Start local server
    print_status "Starting local server..."
    npx http-server -p 8080 &
    SERVER_PID=$!
    sleep 3
    
    # Run Lighthouse PWA audit
    print_status "Running Lighthouse PWA audit..."
    npx lighthouse http://localhost:8080 \
        --only-categories=pwa \
        --output=json \
        --output-path=./test-results/lighthouse-pwa.json \
        --chrome-flags="--headless" \
        --quiet
    
    # Check PWA score
    PWA_SCORE=$(node -p "require('./test-results/lighthouse-pwa.json').categories.pwa.score * 100")
    
    if (( $(echo "$PWA_SCORE >= 90" | bc -l) )); then
        print_success "PWA score: $PWA_SCORE%"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_fail "PWA score too low: $PWA_SCORE% (required: 90%)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Stop server
    kill $SERVER_PID
}

# Run COPPA compliance test
run_coppa_test() {
    print_status "Running COPPA compliance test..."
    
    if ./scripts/verify-coppa-compliance.sh; then
        print_success "COPPA compliance test passed"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_fail "COPPA compliance test failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# Run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    # Check bundle size
    print_status "Checking bundle sizes..."
    
    # Android APK size
    if [ -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
        APK_SIZE=$(ls -lh android/app/build/outputs/apk/release/app-release.apk | awk '{print $5}')
        print_status "Android APK size: $APK_SIZE"
        
        # Check if under 50MB (reasonable for a PWA wrapper)
        APK_SIZE_MB=$(ls -l android/app/build/outputs/apk/release/app-release.apk | awk '{print $5}')
        if [ $APK_SIZE_MB -lt 52428800 ]; then
            print_success "APK size is acceptable"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_warning "APK size is large: $APK_SIZE"
        fi
    fi
    
    # iOS app size would be checked here if on macOS
}

# Create test report
create_test_report() {
    print_status "Creating test report..."
    
    REPORT_FILE="test-results/mobile-test-report-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p test-results
    
    cat > "$REPORT_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "totalTests": $((TESTS_PASSED + TESTS_FAILED)),
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "gitCommit": "$(git rev-parse HEAD)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD)",
    "platform": {
        "os": "$(uname -s)",
        "node": "$(node -v)",
        "npm": "$(npm -v)"
    }
}
EOF
    
    print_status "Test report created: $REPORT_FILE"
}

# Main function
main() {
    print_status "Starting StackMap mobile test suite..."
    
    # Create test results directory
    mkdir -p test-results
    
    # Run all test suites
    run_web_tests
    run_coppa_test
    run_pwa_tests
    run_performance_tests
    
    # Platform-specific tests
    if [ -d "android" ]; then
        run_android_tests
    fi
    
    if [ -d "ios" ] && [[ "$OSTYPE" == "darwin"* ]]; then
        run_ios_tests
    fi
    
    # Create report
    create_test_report
    
    # Summary
    echo ""
    echo "================================"
    echo "Test Summary:"
    echo "  Passed: $TESTS_PASSED"
    echo "  Failed: $TESTS_FAILED"
    echo "================================"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "All tests passed!"
        exit 0
    else
        print_fail "Some tests failed!"
        exit 1
    fi
}

# Run main function
main "$@"