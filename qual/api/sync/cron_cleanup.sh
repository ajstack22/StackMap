#!/bin/bash

# StackMap Sync Data Cleanup Cron Script
# Add to crontab to run daily at 3 AM:
# 0 3 * * * /home/stachblx/public_html/api/sync/cron_cleanup.sh

# Change to script directory
cd "$(dirname "$0")"

# Run cleanup with PHP CLI
/usr/bin/php cleanup.php >> cleanup_cron.log 2>&1

# Keep only last 30 days of logs
find . -name "cleanup.log" -mtime +30 -delete
find . -name "cleanup_errors.log" -mtime +30 -delete
find . -name "cleanup_cron.log" -mtime +30 -delete

# Optional: Send email on error
if [ $? -ne 0 ]; then
    echo "StackMap sync cleanup failed on $(date)" | mail -s "StackMap Cleanup Error" your-email@example.com
fi