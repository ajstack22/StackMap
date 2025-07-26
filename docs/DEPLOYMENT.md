# StackMap Deployment Guide

> **Last Updated**: 2024-12-28  
> **CRITICAL**: Read [DO_NOT_IGNORE_BUILD_FILES.md](../DO_NOT_IGNORE_BUILD_FILES.md) to avoid 403 errors!

## Overview

Simple deployment process for StackMap on Namecheap hosting.

## Deployment Workflow

```
Local Development → GitHub → Qual (staging) → Production
```

## ⚠️ CRITICAL REQUIREMENTS

### Build Files MUST Be in Git
The most common deployment error is 403 Forbidden. This happens when:
- Build files are in .gitignore
- After git pull, there's no index.html on the server
- **Solution**: Ensure these files are committed to git:
  - index.html
  - bundle.*.js  
  - manifest.json
  - service-worker.js
  - All other build outputs

## Step-by-Step Process

### 1. Build and Prepare Files

```bash
# Build with production settings
NODE_ENV=production npm run build:web

# CRITICAL: Copy build files to repository root for qual
cp web/build/*.* .
cp -r web/build/fonts .
cp -r web/build/icons .

# Verify files are NOT ignored
git status # Should show the build files
```

### 2. Commit and Push

```bash
# Add ALL files including build outputs
git add -A
git commit -m "Your commit message"
git push origin main
```

### 3. Deploy to Qual (Staging)

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