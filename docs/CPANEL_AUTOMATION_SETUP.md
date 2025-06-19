# cPanel Deployment Automation Setup

## Overview

This guide helps you set up automated deployment from qual to production on your cPanel server.

## Option 1: Cron-based Automation (Recommended)

### Step 1: Upload Scripts to cPanel

1. Create a `scripts` directory in your home folder:
   ```bash
   mkdir -p ~/scripts
   mkdir -p ~/deployment-logs
   ```

2. Upload these scripts to `~/scripts/`:
   - `cpanel-deploy-to-prod.sh`
   - `cpanel-auto-deploy.sh`

3. Make them executable:
   ```bash
   chmod +x ~/scripts/*.sh
   ```

### Step 2: Set Up Cron Job

1. In cPanel, go to "Cron Jobs"
2. Add a new cron job:
   - **Frequency**: Every 5 minutes
   - **Command**: `/home/stachblx/scripts/cpanel-auto-deploy.sh`
   - **Minute**: `*/5`
   - **Hour**: `*`
   - **Day**: `*`
   - **Month**: `*`
   - **Weekday**: `*`

### Step 3: Trigger Deployment

From your local machine:
```bash
# Make the trigger script executable
chmod +x scripts/trigger-prod-deploy.sh

# Update SSH details in the script
nano scripts/trigger-prod-deploy.sh

# Run it
./scripts/trigger-prod-deploy.sh
```

Or manually via SSH:
```bash
# SSH to your server
ssh your-cpanel-user@your-server.com

# Create deployment flag
echo "Deploy to production" > /home/stachblx/public_html/qual/.deploy-to-prod

# Wait for cron to run (max 5 minutes)
```

## Option 2: GitHub Webhook Automation

### Step 1: Set Up Webhook Endpoint

1. Create a `deploy` directory in public_html:
   ```bash
   mkdir -p ~/public_html/deploy
   ```

2. Upload `cpanel-webhook-deploy.php` to this directory

3. Create a `.htaccess` file for security:
   ```apache
   <Files "webhook.php">
       Order Allow,Deny
       Allow from all
   </Files>
   
   # Block directory listing
   Options -Indexes
   ```

### Step 2: Configure GitHub Webhook

1. Go to your GitHub repository settings
2. Click "Webhooks" → "Add webhook"
3. **Payload URL**: `https://stackmap.app/deploy/webhook.php`
4. **Content type**: `application/json`
5. **Secret**: Generate a random string and add it to the PHP script
6. **Events**: Just the push event
7. **Active**: ✓

### Step 3: Use Deployment Tags in Commits

```bash
# Deploy to qual only (default)
git commit -m "Fix mobile styling"

# Deploy to qual AND production
git commit -m "Fix mobile styling [deploy:prod]"
```

## Option 3: Manual Script Execution

### For One-Time Cleanup and Deployment

1. SSH to your cPanel server
2. Run the deployment script manually:
   ```bash
   bash ~/scripts/cpanel-deploy-to-prod.sh
   ```

### Setting Up Aliases

Add to your `~/.bashrc`:
```bash
alias deploy-qual="cd /home/stachblx/public_html/qual && git pull"
alias deploy-prod="bash ~/scripts/cpanel-deploy-to-prod.sh"
alias check-deployment="tail -f ~/deployment-logs/deploy-*.log"
```

## Monitoring Deployments

### View Logs
```bash
# Latest deployment log
ls -t ~/deployment-logs/deploy-*.log | head -1 | xargs tail -f

# All deployment history
ls -la ~/deployment-logs/
```

### Set Up Email Notifications

Edit the deployment script and uncomment the mail line:
```bash
echo "StackMap deployed to production at $(date)" | mail -s "Deployment Success" your-email@example.com
```

## Security Considerations

1. **Webhook Security**:
   - Always use a secret token
   - Verify signatures
   - Use HTTPS only
   - Log all attempts

2. **File Permissions**:
   - Scripts: 755 (executable by owner)
   - Logs: 644 (readable by owner)
   - Keep scripts outside public_html

3. **Backup Retention**:
   - Script keeps last 10 backups
   - Adjust in the script if needed

## Troubleshooting

### Deployment Not Running
1. Check cron logs: `grep CRON /var/log/syslog`
2. Check deployment logs: `ls -la ~/deployment-logs/`
3. Test script manually: `bash -x ~/scripts/cpanel-auto-deploy.sh`

### Permission Issues
```bash
# Fix script permissions
chmod +x ~/scripts/*.sh

# Fix directory permissions
find ~/public_html/prod -type f -exec chmod 644 {} \;
find ~/public_html/prod -type d -exec chmod 755 {} \;
```

### Rsync Errors
- Ensure both directories exist
- Check disk space: `df -h`
- Verify rsync is installed: `which rsync`

## Clean Deployment from Scratch

If you need to completely clean and redeploy:

```bash
# Backup current production
tar -czf ~/backups/prod-manual-$(date +%Y%m%d).tar.gz -C ~/public_html/prod .

# Clean production
cd ~/public_html/prod
find . -mindepth 1 -not -name '.htaccess' -not -name '.well-known' -delete

# Deploy fresh from qual
rsync -av --delete ~/public_html/qual/ ~/public_html/prod/

# Set permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
```

## Next Steps

1. Choose your automation method
2. Set up the scripts on your cPanel server
3. Test with a non-critical change first
4. Monitor the logs
5. Adjust the scripts as needed for your workflow