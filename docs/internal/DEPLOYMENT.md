# StackMap Deployment Guide

## cPanel Git Deployment Setup

### Prerequisites
1. cPanel hosting with Git Version Control feature enabled
2. SSH access to your hosting account (optional but recommended)
3. Your StackMap repository cloned/forked to your GitHub account

### Step 1: Configure cPanel Git Repository

1. Log into your cPanel account
2. Navigate to **Files** → **Git Version Control**
3. Click **Create** to set up a new repository
4. Fill in the form:
   - **Clone URL**: `https://github.com/yourusername/StackMap.git`
   - **Repository Path**: `/home/username/repositories/stackmap`
   - **Repository Name**: StackMap
5. Click **Create**

### Step 2: Configure Deployment Path

1. After creating the repository, click **Manage** next to it
2. Click the **Deploy** tab
3. Set **Deploy Path** to: `/home/username/public_html/` (or your desired subdirectory)
4. Click **Update**

### Step 3: Update .cpanel.yml

The `.cpanel.yml` file in this repository is configured for automatic deployment. You need to update the `DEPLOYPATH` variable:

```yaml
- export DEPLOYPATH=/home/username/public_html/
```

Replace `username` with your actual cPanel username.

If deploying to a subdirectory (e.g., stackmap.yourdomain.com):
```yaml
- export DEPLOYPATH=/home/username/public_html/stackmap/
```

### Step 4: Initial Deployment

1. In cPanel Git Version Control, click **Manage** → **Pull or Deploy**
2. Click **Deploy HEAD Commit**
3. Wait for deployment to complete

### Step 5: Configure Web Server (if needed)

Create or update `.htaccess` in your deployment directory:

```apache
# Enable service worker
<IfModule mod_headers.c>
    Header set Service-Worker-Allowed "/"
</IfModule>

# Security headers
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"

# Cache control for static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/svg+xml "access plus 1 month"
    ExpiresByType text/css "access plus 1 week"
    ExpiresByType application/javascript "access plus 1 week"
</IfModule>

# Compress text files
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json
</IfModule>
```

## Alternative Deployment Methods

### Manual Deployment Script

If you prefer manual deployment or your host doesn't support cPanel Git:

1. Create `deploy.sh` on your server:

```bash
#!/bin/bash
REPO_URL="https://github.com/yourusername/StackMap.git"
DEPLOY_PATH="/home/username/public_html/"
TEMP_PATH="/tmp/stackmap-deploy"

# Clone repository
rm -rf $TEMP_PATH
git clone $REPO_URL $TEMP_PATH

# Copy files to deployment path
cp -R $TEMP_PATH/* $DEPLOY_PATH
cp $TEMP_PATH/.htaccess $DEPLOY_PATH 2>/dev/null || :

# Clean up
rm -rf $DEPLOY_PATH/.git
rm -rf $DEPLOY_PATH/context
rm -rf $DEPLOY_PATH/backups
rm -rf $DEPLOY_PATH/Screenshots
rm -f $DEPLOY_PATH/.cpanel.yml
rm -f $DEPLOY_PATH/README.md
rm -f $DEPLOY_PATH/.gitignore
rm -f $DEPLOY_PATH/update.py
rm -f $DEPLOY_PATH/DEPLOYMENT.md

# Set permissions
find $DEPLOY_PATH -type f -exec chmod 644 {} \;
find $DEPLOY_PATH -type d -exec chmod 755 {} \;

# Clean up temp
rm -rf $TEMP_PATH

echo "Deployment complete!"
```

2. Make it executable: `chmod +x deploy.sh`
3. Run it: `./deploy.sh`

### Using GitHub Actions

Create `.github/workflows/deploy.yml` for automated deployment:

```yaml
name: Deploy to cPanel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to cPanel
      uses: SamKirkland/FTP-Deploy-Action@4.3.0
      with:
        server: ${{ secrets.FTP_SERVER }}
        username: ${{ secrets.FTP_USERNAME }}
        password: ${{ secrets.FTP_PASSWORD }}
        exclude: |
          **/.git*
          **/.git*/**
          **/node_modules/**
          **/context/**
          **/backups/**
          **/Screenshots/**
          .cpanel.yml
          README.md
          update.py
          DEPLOYMENT.md
```

## Post-Deployment Checklist

1. ✅ Verify index.html loads correctly
2. ✅ Test service worker registration (check browser DevTools)
3. ✅ Verify manifest.json is accessible
4. ✅ Test PWA installation
5. ✅ Check all images and icons load
6. ✅ Test data persistence (create a card, refresh)
7. ✅ Verify multi-user functionality
8. ✅ Test export/import features
9. ✅ Check responsive design on mobile

## Troubleshooting

### Service Worker Not Registering
- Ensure HTTPS is enabled (required for service workers)
- Check console for errors
- Verify sw.js is accessible at root path

### Images/Icons Not Loading
- Check file permissions (should be 644)
- Verify paths in manifest.json are correct
- Ensure all icon files were uploaded

### Data Not Persisting
- Check browser localStorage limits
- Verify no JavaScript errors in console
- Test in incognito/private mode

### 404 Errors
- Ensure .htaccess allows access to all file types
- Check that all files were uploaded
- Verify no typos in file paths

## Security Considerations

1. Always use HTTPS
2. Keep sensitive files out of public_html
3. Regularly update dependencies
4. Monitor access logs
5. Use strong cPanel passwords
6. Enable two-factor authentication

## Support

For deployment issues specific to StackMap, please check:
- [GitHub Issues](https://github.com/ajstack22/StackMap/issues)
- cPanel documentation for your hosting provider
- Your hosting provider's support