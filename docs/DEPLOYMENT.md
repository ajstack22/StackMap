# StackMap Deployment Guide

## Overview

Simple deployment process for StackMap on Namecheap hosting.

## Deployment Workflow

```
Local Development → GitHub → Qual (staging) → Production
```

## Step-by-Step Process

### 1. Build and Commit Locally

```bash
# Build the web app
npm run build:web

# Add and commit changes
git add .
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

### 2. Deploy to Qual (Staging)

1. Log into your Namecheap hosting control panel
2. Navigate to Git Version Control (or SSH into server)
3. Pull latest changes from GitHub
4. Verify the site works at: https://stackmap.app/qual/

### 3. Deploy to Production

Once tested on qual, promote to production:

```bash
# SSH into your server and run:
cd ~/scripts
./simple-deploy.sh deploy
```

This will:
- Backup current production
- Copy everything from qual to production
- Preserve .htaccess and server configs

### 4. Rollback (if needed)

If something goes wrong:

```bash
# SSH into your server and run:
cd ~/scripts
./simple-deploy.sh rollback
```

## Important Files

- `web/build/` - Built web application files
- `privacy.html` - Privacy policy page (for app stores)
- `support.html` - Support page (for app stores)
- `.htaccess` - Server configuration (preserved during deployment)

## URLs

- **Production**: https://stackmap.app/
- **Staging (Qual)**: https://stackmap.app/qual/
- **GitHub**: https://github.com/ajstack22/StackMap

## Notes

- Always test on qual before deploying to production
- The build process includes all necessary files in `web/build/`
- Git hooks for testing have been removed for smoother commits
- Backups are stored on the server before each deployment

## Troubleshooting

If qual doesn't update after git pull:
1. Check that files exist in `web/build/` directory
2. Manually copy files from repository to qual directory if needed
3. Clear browser cache when testing

## DO NOT

- Deploy directly to production without testing on qual first
- Create complex deployment systems
- Modify this simple process without good reason