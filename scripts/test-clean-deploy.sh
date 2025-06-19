#!/bin/bash
# Test clean deployment process with dry run
# This shows exactly what would be deployed without actually doing it

set -e

echo "🧪 StackMap Clean Deployment Dry Run"
echo "===================================="
echo ""

# Configuration
TEMP_DIR="deploy-test-temp"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test deployment
test_deployment() {
    local TARGET=$1
    local TARGET_DIR=$2
    
    echo "📋 Testing deployment to $TARGET"
    echo "Target directory: $TARGET_DIR"
    echo ""
    
    # Create temporary deployment package
    rm -rf $TEMP_DIR
    mkdir -p $TEMP_DIR
    
    echo "Creating deployment package..."
    
    # Copy files with exclusions (quiet mode)
    rsync -a \
        --exclude='.git*' \
        --exclude='node_modules' \
        --exclude='tests' \
        --exclude='docs' \
        --exclude='scripts' \
        --exclude='.github' \
        --exclude='package-lock.json' \
        --exclude='README.md' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='mobile-launch-issues' \
        --exclude='ios-wrapper' \
        --exclude='store-assets' \
        --exclude='issues' \
        --exclude='launch-prompts' \
        --exclude='context/CICD_research.md' \
        --exclude='DEVELOPMENT_PLAN.md' \
        --exclude='FTP_*' \
        --exclude='*.sh' \
        --exclude=$TEMP_DIR \
        ./ $TEMP_DIR/ 2>/dev/null
    
    # Additional exclusions for production
    if [ "$TARGET" == "production" ]; then
        rm -rf $TEMP_DIR/qual 2>/dev/null || true
        rm -rf $TEMP_DIR/.well-known 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Package created${NC}"
    echo ""
    
    # Analysis
    echo "📊 Deployment Analysis:"
    echo "======================"
    
    # Count files
    TOTAL_FILES=$(find $TEMP_DIR -type f | wc -l | tr -d ' ')
    TOTAL_DIRS=$(find $TEMP_DIR -type d | wc -l | tr -d ' ')
    TOTAL_SIZE=$(du -sh $TEMP_DIR 2>/dev/null | cut -f1)
    
    echo "Total files: $TOTAL_FILES"
    echo "Total directories: $TOTAL_DIRS"
    echo "Total size: $TOTAL_SIZE"
    echo ""
    
    # Show what would be deployed
    echo "📁 Directories that would be created:"
    find $TEMP_DIR -type d -not -path $TEMP_DIR | head -20 | sed "s|$TEMP_DIR/|  |g"
    if [ $(find $TEMP_DIR -type d | wc -l) -gt 20 ]; then
        echo "  ... and $(($(find $TEMP_DIR -type d | wc -l) - 20)) more"
    fi
    echo ""
    
    echo "📄 Files that would be uploaded:"
    find $TEMP_DIR -type f | head -20 | sed "s|$TEMP_DIR/|  |g"
    if [ $TOTAL_FILES -gt 20 ]; then
        echo "  ... and $(($TOTAL_FILES - 20)) more"
    fi
    echo ""
    
    # Check for critical files
    echo "🔍 Critical files check:"
    CRITICAL_FILES=("index.html" "sw.js" "manifest.json" "state.js" "app/StackMapApp.js")
    ALL_GOOD=true
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$TEMP_DIR/$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${RED}✗${NC} $file - MISSING!"
            ALL_GOOD=false
        fi
    done
    echo ""
    
    # Files that would be excluded
    echo "❌ Files/directories excluded from deployment:"
    echo "  .git/ (and all git files)"
    echo "  node_modules/"
    echo "  tests/"
    echo "  scripts/"
    echo "  .github/"
    echo "  docs/"
    echo "  issues/"
    echo "  launch-prompts/"
    echo "  All .sh files"
    echo "  All .log files"
    if [ "$TARGET" == "production" ]; then
        echo -e "  ${YELLOW}qual/ (preserved on server)${NC}"
        echo -e "  ${YELLOW}.well-known/ (preserved on server)${NC}"
    fi
    echo ""
    
    # Warnings
    if [ "$TARGET" == "production" ]; then
        echo -e "${YELLOW}⚠️  Production deployment warnings:${NC}"
        echo "  - Will DELETE all files on server not in this package"
        echo "  - Except: qual/ and .well-known/ directories"
        echo "  - Make sure qual is tested first!"
    fi
    
    # Summary
    echo ""
    echo "📝 Deployment Summary:"
    echo "===================="
    if [ "$ALL_GOOD" = true ]; then
        echo -e "${GREEN}✅ All critical files present${NC}"
        echo -e "${GREEN}✅ Deployment package is valid${NC}"
    else
        echo -e "${RED}❌ Missing critical files!${NC}"
        echo -e "${RED}❌ DO NOT DEPLOY - fix issues first${NC}"
    fi
    
    # Clean up
    rm -rf $TEMP_DIR
}

# Main menu
echo "Select deployment target to test:"
echo "1) Qual deployment"
echo "2) Production deployment"
echo "3) Test both"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        test_deployment "qual" "/public_html/qual/"
        ;;
    2)
        test_deployment "production" "/public_html/"
        ;;
    3)
        test_deployment "qual" "/public_html/qual/"
        echo ""
        echo "Press Enter to test production deployment..."
        read
        test_deployment "production" "/public_html/"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🏁 Dry run complete!"
echo ""
echo "Next steps:"
echo "1. Review the analysis above"
echo "2. Fix any missing files or issues"
echo "3. Run actual deployment when ready"