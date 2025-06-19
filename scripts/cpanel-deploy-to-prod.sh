#!/bin/bash

# cPanel Server Deployment Script - Qual to Prod
# This script should be placed on your cPanel server and run via cron or manually

# Configuration
QUAL_PATH="/home/stachblx/qual"
PROD_PATH="/home/stachblx/public_html"
LOG_DIR="/home/stachblx/deployment-logs"
BACKUP_DIR="/home/stachblx/backups"

# Create directories if they don't exist
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

# Logging
LOG_FILE="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "================================================"
echo "StackMap Deployment: Qual → Production"
echo "Date: $(date)"
echo "================================================"

# 1. Verify qual directory exists and has content
if [ ! -d "$QUAL_PATH" ]; then
    echo "❌ ERROR: Qual directory not found at $QUAL_PATH"
    exit 1
fi

if [ ! -f "$QUAL_PATH/index.html" ]; then
    echo "❌ ERROR: index.html not found in qual - deployment may be incomplete"
    exit 1
fi

# 2. Create backup of current production
echo "📦 Creating backup of current production..."
BACKUP_FILE="$BACKUP_DIR/prod-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$BACKUP_FILE" -C "$PROD_PATH" . 2>/dev/null || echo "Note: First deployment, no existing prod to backup"
echo "✅ Backup created: $BACKUP_FILE"

# 3. Test the qual site
echo "🧪 Testing qual site..."
QUAL_URL="https://stackmap.app/qual"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$QUAL_URL")
if [ "$HTTP_STATUS" != "200" ]; then
    echo "⚠️  WARNING: Qual site returned HTTP $HTTP_STATUS"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# 4. Sync qual to prod with cleanup
echo "🚀 Syncing qual to production..."
rsync -av --delete \
    --exclude='.htaccess' \
    --exclude='error_log' \
    --exclude='.well-known' \
    --exclude='*.log' \
    "$QUAL_PATH/" "$PROD_PATH/"

RSYNC_STATUS=$?
if [ $RSYNC_STATUS -ne 0 ]; then
    echo "❌ ERROR: Rsync failed with status $RSYNC_STATUS"
    exit 1
fi

# 5. Set proper permissions
echo "🔐 Setting permissions..."
find "$PROD_PATH" -type f -exec chmod 644 {} \;
find "$PROD_PATH" -type d -exec chmod 755 {} \;

# 6. Clear any caches
echo "🧹 Clearing caches..."
# If you use Cloudflare or other CDN, add cache purge here
# Example: curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE/purge_cache"

# 7. Verify deployment
echo "✔️  Verifying deployment..."
PROD_URL="https://stackmap.app"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Production site is responding correctly"
else
    echo "❌ WARNING: Production site returned HTTP $HTTP_STATUS"
fi

# 8. Update deployment timestamp
echo "$(date)" > "$PROD_PATH/.last-deployment"

# 9. Cleanup old backups (keep last 10)
echo "🧹 Cleaning old backups..."
ls -t "$BACKUP_DIR"/prod-backup-*.tar.gz | tail -n +11 | xargs -r rm

echo ""
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE"
echo "================================================"
echo "Production URL: https://stackmap.app"
echo "Backup saved: $BACKUP_FILE"
echo "Log file: $LOG_FILE"
echo ""

# Optional: Send notification
# echo "StackMap deployed to production at $(date)" | mail -s "Deployment Success" your-email@example.com