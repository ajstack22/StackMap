#!/bin/bash

echo "🧹 StackMap Deep Directory Cleanup"
echo "=================================="
echo
echo "This will remove unnecessary files and directories to clean up the repository."
echo "Make sure you have committed any important changes!"
echo
read -p "Continue with cleanup? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 1
fi

echo
echo "Starting cleanup..."

# iOS Build Artifacts
echo "🗑️  Removing iOS build artifacts..."
rm -rf "ios/StackMapNative 2025-07-04 12-03-01/"
rm -rf "ios/StackMapNative 2025-07-04 12-22-55/"
rm -rf "ios/StackMapNative 2025-07-04 12-24-52/"
rm -rf "ios/StackMapNative 2025-07-04 12-27-55/"
rm -rf "ios/StackMapNative 2025-07-04 12-39-31/"
rm -rf "ios/StackMapNative 2025-07-04 19-14-43/"
rm -rf "ios/StackMapNative 2025-07-04 20-55-59/"
rm -rf "ios/StackMapNative 2025-07-04 21-04-29/"
rm -rf "ios/StackMapNative 2025-07-04 21-12-13/"
rm -rf "ios/StackMapNative 2025-07-04 21-12-47/"
rm -rf "ios/StackMapNative 2025-07-04 21-13-09/"
rm -rf "ios/StackMapNative 2025-07-04 21-38-10/"
rm -rf "ios/StackMapNative 2025-07-06 10-34-12/"
rm -f "ios/Build StackMapNative_2025-07-04T13-55-42.txt"
rm -rf ios/build/

# Android Build Artifacts
echo "🗑️  Removing Android build artifacts..."
rm -rf android/app/build/
rm -rf android/build/
rm -rf android/.gradle/
rm -rf android/.kotlin/

# Archive and Backups
echo "🗑️  Removing archive and backup directories..."
rm -rf archive/
rm -rf backups/

# Test Reports
echo "🗑️  Removing old test reports..."
rm -rf tests/reports/
rm -rf test-results/

# Old Sync Implementations
echo "🗑️  Removing old sync directories..."
rm -rf sync/
rm -rf manyla/

# Deployment Scripts Archive
echo "🗑️  Removing archived scripts..."
rm -rf scripts/archive/

# Build Logs
echo "🗑️  Removing build logs..."
rm -rf logs/

# Empty Directories
echo "🗑️  Removing empty directories..."
rmdir vendor/ 2>/dev/null
rmdir image_library/ 2>/dev/null

# Test Data
echo "🗑️  Removing test data..."
rm -rf emulator-downloads/

# Misc Files
echo "🗑️  Removing miscellaneous files..."
rm -f snap.js
rm -f privacy.html
rm -f support.html
rm -f qual-htaccess
rm -f gradle.properties  # This should be in android/
rm -f verify-deployment.sh  # Old script
rm -f fix-deployment.sh  # Old script
rm -f emergency-fix-repo.sh  # Old script
rm -f manual-deploy-qual.sh  # Old script
rm -f deploy-web.sh  # Old script
rm -f deploy-to-qual.sh  # Old script
rm -f upload-missing-files.sh  # One-time script

# Old deployment test files
rm -f api/sync/test_deploy.php
rm -f api/sync/test_endpoint.php
rm -f api/sync/debug_share_api.php
rm -f api/sync/debug_shares.php
rm -f api/sync/debug_access.php
rm -f api/sync/test_access.php
rm -f api/sync/test_access_share.php
rm -f api/sync/test_db_connection.php
rm -f api/sync/test_db_simple.php
rm -f api/sync/test_share_access.php
rm -f api/sync/access_share_standalone.php

# Documentation archive
echo "🗑️  Removing archived documentation..."
rm -rf docs/archive/

# Count space saved
echo
echo "✅ Cleanup complete!"
echo
echo "Space saved (approximate):"
du -sh . 2>/dev/null | awk '{print "Current size: " $1}'
echo
echo "Files/directories removed:"
echo "- iOS build artifacts (13 builds)"
echo "- Android build directories"
echo "- Archive and backup directories"
echo "- Test reports (100+ files)"
echo "- Old sync implementations"
echo "- Archived scripts"
echo "- Build logs"
echo "- Miscellaneous test files"
echo
echo "Remember to:"
echo "1. Run 'git add -A' to stage deletions"
echo "2. Commit the changes"
echo "3. Push to remote"