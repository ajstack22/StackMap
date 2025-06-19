#!/bin/bash

# Auto-deployment script for cPanel
# Can be run via cron to automatically promote qual to prod

# Configuration
QUAL_PATH="/home/stachblx/qual"
PROD_PATH="/home/stachblx/public_html"
FLAG_FILE="$QUAL_PATH/.deploy-to-prod"
LOG_FILE="/home/stachblx/deployment-logs/auto-deploy.log"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if deployment flag exists
if [ ! -f "$FLAG_FILE" ]; then
    # No deployment needed
    exit 0
fi

log "Deployment flag found, starting auto-deployment"

# Get deployment message if any
DEPLOY_MSG=$(cat "$FLAG_FILE" 2>/dev/null || echo "Auto-deployment")
log "Deployment message: $DEPLOY_MSG"

# Remove flag file
rm -f "$FLAG_FILE"

# Run the deployment script
/home/stachblx/scripts/cpanel-deploy-to-prod.sh

if [ $? -eq 0 ]; then
    log "✅ Auto-deployment completed successfully"
    
    # Optional: Send notification
    # echo "StackMap auto-deployed: $DEPLOY_MSG" | mail -s "Auto-deployment Success" your-email@example.com
else
    log "❌ Auto-deployment failed"
fi