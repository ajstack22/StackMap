# cPanel Git Version Control Guide for StackMap

## Overview
With the `.cpanel.yml` file in place, you can use cPanel's Git Version Control to easily pull updates from your GitHub repository.

## Initial Setup (One-time)

1. **Login to cPanel**
2. **Navigate to "Git Version Control"** (under Files section)
3. **Click "Create"**
4. **Fill in the form:**
   - Clone URL: `https://github.com/yourusername/StackMap.git`
   - Repository Path: `/home/yourusername/repositories/stackmap`
   - Repository Name: `StackMap`
   - Branch: `main`
5. **Click "Create"**

## Pulling Updates

### Method 1: Through cPanel Interface

1. **Go to "Git Version Control"** in cPanel
2. **Find your StackMap repository**
3. **Click "Manage"**
4. **Click "Pull or Deploy"**
5. **Click "Update from Remote"** to pull latest changes
6. **Click "Deploy HEAD Commit"** to deploy the changes

The `.cpanel.yml` file will automatically:
- Copy files to your public_html/qual directory
- Remove all development/documentation files
- Set proper permissions

### Method 2: Manual Update Check

1. In the repository list, you'll see a status indicator
2. If it shows "Behind" with a number, updates are available
3. Click the repository to manage and deploy

## What Happens During Deployment

The `.cpanel.yml` file executes these tasks:
1. Copies all files to `/home/stachblx/public_html/qual`
2. Removes non-production files:
   - Git files (.git, .gitignore)
   - Documentation (README, LICENSE, etc.)
   - Development files (tests, scripts, node_modules)
   - Context files and debug scripts
3. Sets proper permissions (644 for files, 755 for directories)

## Updating Your Repository

1. **Make changes locally**
2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```
3. **Go to cPanel Git Version Control**
4. **Pull and deploy the updates**

## Troubleshooting

### Updates not showing?
- Ensure you pushed to the correct branch (main)
- Click "Update from Remote" to fetch latest changes
- Check that `.cpanel.yml` is in your repository

### Deployment fails?
- Check the deployment log in cPanel
- Verify the DEPLOYPATH in `.cpanel.yml` is correct
- Ensure file permissions are correct

### Need to rollback?
- In Git Version Control, click on your repository
- Go to "History"
- Find the previous commit
- Click "Deploy" next to that commit

## Best Practices

1. **Always test locally first**
2. **Update service worker version** when making significant changes
3. **Clear browser cache** after deployment
4. **Check the live site** immediately after deployment
5. **Keep your `.cpanel.yml` updated** as you add new file types to exclude