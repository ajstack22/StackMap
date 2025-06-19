#!/bin/bash

# StackMap Repository Cleanup Script
# Created: 2025-06-19
# Purpose: Clean up unnecessary files from the repository

echo "🧹 StackMap Repository Cleanup Script"
echo "===================================="
echo ""

# Create backup directory with timestamp
BACKUP_DIR="cleanup-backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Function to safely move files to backup
backup_and_remove() {
    local file="$1"
    if [ -e "$file" ]; then
        echo "  - Moving: $file"
        # Create directory structure in backup
        local dir=$(dirname "$file")
        mkdir -p "$BACKUP_DIR/$dir"
        mv "$file" "$BACKUP_DIR/$file"
    else
        echo "  - Skipping (not found): $file"
    fi
}

echo ""
echo "🗑️  Step 1: Cleaning test outputs and reports..."
echo "------------------------------------------------"

# Test reports
backup_and_remove "tests/reports"
backup_and_remove "localhost_2025-06-18_14-16-58.report.html"
backup_and_remove "lighthouse-pwa-report.html"
backup_and_remove "lighthouse-report.json"

echo ""
echo "🗑️  Step 2: Moving test HTML files from root..."
echo "------------------------------------------------"

# Test HTML files
backup_and_remove "test-compression.html"
backup_and_remove "test-delta-sync.html"
backup_and_remove "test-granular-sync.html"
backup_and_remove "test-operation-log.html"
backup_and_remove "test-operation-tracking.html"
backup_and_remove "test-sync-queue.html"
backup_and_remove "test-offline-sync.html"
backup_and_remove "test-initial-sync.html"

echo ""
echo "🗑️  Step 3: Archiving deployment notes..."
echo "------------------------------------------------"

# Create archive directory for historical docs
ARCHIVE_DIR="docs/archive/deployment-history"
mkdir -p "$ARCHIVE_DIR"

# Move deployment notes to archive
for file in URGENT_SYNTAX_FIX.md FINAL_SYNTAX_FIX.md CRITICAL_FIXES_DEPLOYED.md \
           DEPLOYMENT_NOTES_2024_12_18.md DEPLOYMENT_READY_2025-06-18.md \
           PHASE3_DEPLOYMENT_NOTES.md PHASE3_DEPLOYMENT_CHECKLIST.md; do
    if [ -e "$file" ]; then
        echo "  - Archiving: $file"
        mv "$file" "$ARCHIVE_DIR/"
    fi
done

echo ""
echo "🗑️  Step 4: Cleaning up other files..."
echo "------------------------------------------------"

# Other cleanup
backup_and_remove "context/cleanup.md"
backup_and_remove "deploy-checklist.txt"

echo ""
echo "📝 Step 5: Updating .gitignore..."
echo "------------------------------------------------"

# Check if patterns already exist in .gitignore
add_to_gitignore() {
    local pattern="$1"
    if ! grep -q "^$pattern$" .gitignore; then
        echo "$pattern" >> .gitignore
        echo "  - Added: $pattern"
    else
        echo "  - Already exists: $pattern"
    fi
}

# Add test report patterns
add_to_gitignore "tests/reports/"
add_to_gitignore "*.report.html"
add_to_gitignore "lighthouse-*.html"
add_to_gitignore "lighthouse-*.json"
add_to_gitignore "test-*.html"

echo ""
echo "📊 Step 6: Creating cleanup summary..."
echo "------------------------------------------------"

# Create summary file
SUMMARY_FILE="$BACKUP_DIR/cleanup-summary.txt"
cat > "$SUMMARY_FILE" << EOF
StackMap Repository Cleanup Summary
===================================
Date: $(date)
Backup Directory: $BACKUP_DIR

Files Cleaned:
-------------
EOF

# List all files in backup
find "$BACKUP_DIR" -type f -not -name "cleanup-summary.txt" | sed "s|$BACKUP_DIR/||" >> "$SUMMARY_FILE"

echo "  - Summary created: $SUMMARY_FILE"

echo ""
echo "✅ Cleanup Complete!"
echo ""
echo "📋 Summary:"
echo "  - Backup created in: $BACKUP_DIR"
echo "  - Deployment notes archived to: $ARCHIVE_DIR"
echo "  - .gitignore updated with new patterns"
echo ""
echo "⚠️  Notes:"
echo "  - Screenshots directory was NOT removed (review manually)"
echo "  - demo-mushroom-kingdom.json was NOT removed (may be needed)"
echo "  - dev-tools.js and releases/ should be reviewed separately"
echo ""
echo "🔄 Next steps:"
echo "  1. Review the backup directory: $BACKUP_DIR"
echo "  2. Run 'git status' to see changes"
echo "  3. Commit the cleanup: git add -A && git commit -m 'Clean up repository files'"
echo "  4. If everything looks good, you can delete: rm -rf $BACKUP_DIR"