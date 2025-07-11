#!/bin/bash
# Script to pull changes from cPanel to local development

echo "🔄 StackMap - Pull from cPanel"
echo "=============================="

# Configuration - Update these with your details
CPANEL_HOST="your-domain.com"
CPANEL_USER="your-cpanel-username"
CPANEL_PATH="/home/$CPANEL_USER/public_html/stackmap"
LOCAL_BACKUP_DIR="backups/cpanel-pull-$(date +%Y%m%d-%H%M%S)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if rsync is installed
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}Error: rsync is not installed${NC}"
    echo "Install with: brew install rsync (macOS) or apt-get install rsync (Linux)"
    exit 1
fi

# Create backup of current local files
echo -e "${YELLOW}Creating backup of local files...${NC}"
mkdir -p "$LOCAL_BACKUP_DIR"
cp -r . "$LOCAL_BACKUP_DIR/" 2>/dev/null

# Files/folders to exclude from sync
EXCLUDE_LIST=(
    ".git"
    ".gitignore"
    ".env"
    "*.log"
    "error_log"
    ".DS_Store"
    "Thumbs.db"
    ".ftpquota"
    ".well-known"
    "cgi-bin"
    ".htaccess" # Be careful with this, you might want to sync it
    "node_modules"
    "backups"
)

# Build exclude parameters
EXCLUDE_PARAMS=""
for item in "${EXCLUDE_LIST[@]}"; do
    EXCLUDE_PARAMS="$EXCLUDE_PARAMS --exclude=$item"
done

echo -e "${YELLOW}Pulling files from cPanel...${NC}"
echo "From: $CPANEL_USER@$CPANEL_HOST:$CPANEL_PATH"
echo "To: Current directory"

# Dry run first to show what will be synced
echo -e "\n${YELLOW}Performing dry run...${NC}"
rsync -avz --dry-run $EXCLUDE_PARAMS \
    "$CPANEL_USER@$CPANEL_HOST:$CPANEL_PATH/" \
    .

echo -e "\n${YELLOW}Do you want to proceed with the sync? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    # Actual sync
    echo -e "\n${GREEN}Syncing files...${NC}"
    rsync -avz --progress $EXCLUDE_PARAMS \
        "$CPANEL_USER@$CPANEL_HOST:$CPANEL_PATH/" \
        .
    
    echo -e "\n${GREEN}✅ Pull complete!${NC}"
    echo -e "${YELLOW}Backup saved to: $LOCAL_BACKUP_DIR${NC}"
    
    # Show what changed
    echo -e "\n${YELLOW}Changed files:${NC}"
    git status --short
else
    echo -e "${RED}Sync cancelled${NC}"
    rm -rf "$LOCAL_BACKUP_DIR"
fi

echo -e "\n${YELLOW}Tips:${NC}"
echo "- Review changes with: git diff"
echo "- Restore backup with: cp -r $LOCAL_BACKUP_DIR/* ."
echo "- Update service worker version if needed"