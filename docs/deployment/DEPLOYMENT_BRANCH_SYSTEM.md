# 🚀 StackMap Modern Deployment System

## Overview
We're transitioning to a clean, git-based deployment system that separates source code from build artifacts.

## 🎯 The Problem We're Solving
- **Current Issue**: Build files mixed with source code in main branch
- **Result**: Messy git history, large repo, conflicts with .gitignore
- **Solution**: Separate deployment branches for build artifacts

## 📋 New Deployment Architecture

```
main branch (source only)
    ↓ build
deploy-qual branch (build artifacts)
    ↓ test
deploy-prod branch (production)
```

## 🚀 Quick Start

### Deploy to Qual (Staging)
```bash
./scripts/deploy-with-tracking.sh qual
```

### Deploy to Production
```bash
./scripts/deploy-with-tracking.sh prod
```

### View Deployment History
```bash
./scripts/deploy-with-tracking.sh history
```

## 📝 Detailed Workflow

### 1. Development (main branch)
- Write code
- Commit changes
- Push to GitHub
- NO build files in main branch

### 2. Deploy to Qual
```bash
# Automatically:
# - Validates git state
# - Builds production bundle
# - Creates deploy-qual branch
# - Copies files to root
# - Commits with metadata
# - Pushes to server
./scripts/deploy-with-tracking.sh qual
```

### 3. Test on Qual
- Visit https://stackmap.app/qual/
- Test all features
- Verify everything works

### 4. Deploy to Production
```bash
# After testing on qual:
./scripts/deploy-with-tracking.sh prod
```

## 🔧 One-Time Server Setup

### For Qual Server
```bash
# SSH into server
ssh stackmap-cpanel

# Navigate to qual directory
cd ~/public_html/qual

# Switch to deployment branch
git fetch origin
git checkout -b deploy-qual origin/deploy-qual
git branch --set-upstream-to=origin/deploy-qual
```

## ✅ Benefits

1. **Clean main branch**: Only source code, no build artifacts
2. **Git best practices**: Generated files stay out of source control
3. **Full audit trail**: Every deployment is a git commit
4. **Easy rollback**: Just reset to previous deploy commit
5. **No .gitignore conflicts**: Build files aren't in main branch
6. **Smaller repo**: Build artifacts don't accumulate in history

## 🚫 What NOT to Do

- ❌ Don't commit build files to main branch
- ❌ Don't manually copy files to server
- ❌ Don't edit files directly on server
- ❌ Don't skip qual testing
- ❌ Don't modify deployment branches manually

## 📊 Deployment Metadata

Each deployment commit includes:
- Timestamp
- Source commit hash
- Source commit message
- Build environment (NODE_ENV)
- Package version

Example commit message:
```
Deploy to qual: 2025-01-13_14:30:00

Source: main@a1b2c3d
Message: Fix sync performance issue
Build: NODE_ENV=production
Version: 2025.08.13.2
```

## 🔄 Rollback Process

### Quick Rollback
```bash
# On server, revert to previous deployment
ssh stackmap-cpanel
cd ~/public_html/qual
git reset --hard HEAD~1
```

### Rollback to Specific Deployment
```bash
# Find the commit you want
git log --oneline origin/deploy-qual

# Reset to that commit
git reset --hard <commit-hash>
```

## 🎯 Future: GitHub Actions

Next phase will automate this with GitHub Actions:
- Push to main → Automatic qual deployment
- Manual approval → Production deployment
- Automated testing before deployment
- Slack/Discord notifications

## 📚 Related Documentation

- [OLD: README_DEPLOYMENT.md](./README_DEPLOYMENT.md) - Previous manual process
- [OLD: DO_NOT_IGNORE_BUILD_FILES.md](./DO_NOT_IGNORE_BUILD_FILES.md) - No longer needed
- [scripts/simple-deploy.sh](./scripts/simple-deploy.sh) - Still used for prod rsync

## 🆘 Troubleshooting

### "No deployment history found"
The deploy branches don't exist yet. Run your first deployment to create them.

### "Permission denied" on server
Check SSH key is configured: `ssh stackmap-cpanel "echo Connected"`

### Build files still in main branch
1. Remove them: `git rm index.html bundle.*.js manifest.json ...`
2. Update .gitignore to exclude them
3. Commit: `git commit -m "Remove build artifacts from main"`

### Server still pulling from main
Run the one-time server setup to switch to deploy-qual branch

## ✨ Summary

This new system gives us:
- **Professional deployment process**
- **Clean git history**
- **Full deployment tracking**
- **Easy rollbacks**
- **No more .gitignore conflicts**

Start using it today with:
```bash
./scripts/deploy-with-tracking.sh qual
```