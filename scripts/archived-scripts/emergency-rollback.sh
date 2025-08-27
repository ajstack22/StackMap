#!/bin/bash
# Emergency Rollback Script for Production
# Run this on the server when deployment fails

echo "🚨 EMERGENCY ROLLBACK SCRIPT"
echo "============================"

# Find the most recent backup
LATEST_BACKUP=$(ls -t ~/backups/prod-backup-*.tar.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ No backups found in ~/backups/"
    echo "Attempting to restore from Git instead..."
    cd ~/public_html
    git fetch origin
    git reset --hard origin/main
    echo "✅ Restored from Git"
else
    echo "Found backup: $LATEST_BACKUP"
    echo "Rolling back..."
    cd ~/
    tar -xzf "$LATEST_BACKUP"
    echo "✅ Rollback complete from: $LATEST_BACKUP"
fi

# Verify critical files exist
if [ -f ~/public_html/config/index.js ] && [ -f ~/public_html/sw.js ]; then
    echo "✅ Site verification passed"
else
    echo "❌ Critical files still missing!"
    echo "Manual intervention required"
fi