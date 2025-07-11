# StackMap Deployment Scripts

This directory contains scripts to enforce deployment best practices and ensure quality releases.

## Important Update (January 2025)

The build process has been updated to keep build files in `web/build/` instead of copying them to the root directory. This prevents clutter and maintains a cleaner project structure.

### Key Changes:

1. **Build Output**: `npm run build:web` now outputs files to `web/build/` only
2. **No Root Copies**: Files like `index.html` and `bundle.*.js` are no longer copied to the project root
3. **Deployment Process**: The cPanel deployment now handles files from `web/build/` correctly

### Deployment Flow:

1. **Local Build**: Run `npm run build:web` - creates files in `web/build/`
2. **Git Commit**: Commit the `web/build/` directory changes
3. **Push to GitHub**: `git push origin main`
4. **Automatic Deployment**: 
   - GitHub webhook triggers cPanel to pull changes
   - `cpanel-post-pull.sh` copies files from `web/build/` to the qual root
   - Files are then available at https://stackmap.app/qual/

### Scripts Updated:

- `build-web.sh` - No longer copies to root, keeps files in `web/build/`
- `cpanel-webhook.php` - Now runs post-pull script after git pull
- `cpanel-post-pull.sh` - NEW: Handles copying from `web/build/` to qual root on cPanel

## Quick Start

After cloning the repository, run:
```bash
bash scripts/setup-git-hooks.sh
```

This sets up git hooks that will validate your code before pushing to main.

## Available Scripts

### 🔍 `pre-deploy-check.sh`
Validates that your code is ready for deployment:
- Checks all required files exist
- Validates no syntax errors
- Ensures no uncommitted changes
- Checks for security issues
- Reminds you to run UAT tests

**Usage:**
```bash
bash scripts/pre-deploy-check.sh
```

### 🚀 `deploy.sh`
Complete deployment workflow that:
- Runs all pre-deployment checks
- Updates service worker cache version
- Guides you through the deployment process
- Provides post-deployment checklist

**Usage:**
```bash
bash scripts/deploy.sh
```

### 🔧 `setup-git-hooks.sh`
Configures git hooks for the repository:
- Sets up pre-push validation
- Ensures deployment standards are met
- Prevents accidental bad pushes to main

**Usage:**
```bash
bash scripts/setup-git-hooks.sh
```

## Deployment Workflow

1. **Make your changes** and test locally
2. **Run UAT tests** at `tests/test-runner.html`
3. **Commit your changes** to git
4. **Run deployment script**: `bash scripts/deploy.sh`
5. **Follow post-deployment checklist**

## Git Hooks

The pre-push hook will:
- Run automatically when pushing to main
- Execute pre-deployment checks
- Prevent push if checks fail
- Can be bypassed with `--no-verify` (not recommended)

## Adding New Checks

To add new validation:
1. Edit `pre-deploy-check.sh`
2. Add your check function
3. Update the summary section
4. Document in this README

## Troubleshooting

### "Permission denied" error
```bash
chmod +x scripts/*.sh
```

### Git hook not running
```bash
bash scripts/setup-git-hooks.sh
```

### Bypassing checks (emergency only)
```bash
git push --no-verify
```

## Best Practices

1. **Always run tests** before deploying
2. **Never bypass checks** unless absolutely necessary
3. **Document new validation** when adding checks
4. **Keep scripts updated** with new requirements
5. **Run setup script** after cloning repo