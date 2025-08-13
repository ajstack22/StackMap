# StackMap Deployment System
**Last Updated:** 2025-01-13

## Current System: Branch-Based Deployment

We use separate branches for deployment to avoid mixing build artifacts with source code.

### Quick Commands
- Deploy to Qual: `./scripts/deploy-with-tracking.sh qual`
- Deploy to Prod: `./scripts/deploy-with-tracking.sh prod`
- View History: `./scripts/deploy-with-tracking.sh history`

### How It Works
1. Source code lives in `main` branch (no build files)
2. Build artifacts go to `deploy-qual` and `deploy-prod` branches
3. Servers pull from deployment branches, not main
4. Every deployment is a git commit with full metadata

### Why This System
- Prevents accumulation of old bundle files (had 87 before!)
- Keeps git history clean
- Enables easy rollback
- Maintains GitHub-based deployment (no direct server edits)

## Deployment Process

### To Qual (Staging)
```bash
# Ensure you're on main with no uncommitted changes
git status

# Deploy to qual
./scripts/deploy-with-tracking.sh qual
```

This will:
1. Validate git state
2. Build production bundle
3. Switch to deploy-qual branch
4. Copy current build files to root
5. Commit with metadata
6. Push to origin/deploy-qual
7. Trigger server pull

### To Production
```bash
# First test on qual
./scripts/deploy-with-tracking.sh qual

# Then deploy to production
./scripts/deploy-with-tracking.sh prod
```

## Server Configuration

Servers are configured to pull from deployment branches:
- Qual server: tracks `origin/deploy-qual`
- Prod server: tracks `origin/deploy-prod`

## Rollback

Each deployment is a git commit, so rollback is simple:
```bash
# View deployment history
./scripts/deploy-with-tracking.sh history

# On server, rollback to previous deployment
ssh stackmap-cpanel "cd ~/public_html/qual && git reset --hard <commit-hash>"
```

## Troubleshooting

### Build files appearing in main branch
Check .gitignore includes:
- `/bundle.*.js`
- `/index.html`
- `/manifest.json`
- `/service-worker.js`

### Deployment not updating
1. Verify server is on correct branch: `ssh stackmap-cpanel "cd ~/public_html/qual && git branch --show-current"`
2. Should show `deploy-qual` not `main`
3. If not, run setup: `ssh stackmap-cpanel "cd ~/public_html/qual && git checkout deploy-qual"`

### Need to force rebuild
Make a small change (like version bump) to trigger new webpack hash

## Legacy System (Deprecated)

Previously, build files were committed to main branch because:
- Files in .gitignore caused 403 errors on server
- Led to 87+ old bundle files accumulating
- Mixed source with build artifacts

See [DEPLOYMENT_BRANCH_SYSTEM.md](./DEPLOYMENT_BRANCH_SYSTEM.md) for migration details.