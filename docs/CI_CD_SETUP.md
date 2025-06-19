# StackMap CI/CD Setup Guide

## Overview

This guide covers the complete CI/CD pipeline setup for StackMap, including:
- GitHub Actions for automated testing and deployment
- cPanel Git integration
- SSH key authentication
- Webhook-based instant deployments

## Architecture

```
GitHub (main branch) 
    ↓
GitHub Actions (test & validate)
    ↓
Deploy to Qual (staging)
    ↓
Test Qual Environment
    ↓
Deploy to Production (with approval)
    ↓
Verify Production
```

## Setup Instructions

### 1. SSH Key Authentication (✅ Already Complete)

Your SSH key is already set up and working. The key is located at:
- Private key: `~/.ssh/id_rsa_cpanel`
- Public key: Added to server's `~/.ssh/authorized_keys`

### 2. GitHub Secrets Setup

Run the setup script to configure GitHub secrets:

```bash
./scripts/setup-ci-cd.sh
```

Or manually add these secrets in GitHub:
- Go to Settings → Secrets and variables → Actions
- Add these repository secrets:
  - `CPANEL_HOST`: 199.188.200.57
  - `CPANEL_USER`: stachblx
  - `CPANEL_PORT`: 21098
  - `CPANEL_SSH_KEY`: Contents of `~/.ssh/id_rsa_cpanel`

### 3. cPanel Configuration

The `.cpanel.yml` file has been fixed to deploy to the correct directory.

Current configuration:
- Repository location: `/home/stachblx/qual`
- Production location: `/home/stachblx/public_html`

### 4. GitHub Actions Workflow

The workflow file `.github/workflows/deploy.yml` provides:

1. **Automatic Testing**: Runs on every push to main
2. **Qual Deployment**: Deploys to staging automatically
3. **Production Deployment**: Requires manual approval
4. **Verification**: Tests both environments after deployment

### 5. Webhook Setup (Optional)

For instant deployments without GitHub Actions:

1. Upload `scripts/cpanel-webhook.php` to your server:
   ```bash
   scp scripts/cpanel-webhook.php stackmap-cpanel:~/public_html/webhook.php
   ```

2. Set webhook secret on server:
   ```bash
   ssh stackmap-cpanel
   echo "export GITHUB_WEBHOOK_SECRET='your-secret-here'" >> ~/.bashrc
   ```

3. Add webhook in GitHub:
   - Go to Settings → Webhooks → Add webhook
   - URL: `https://stackmap.app/webhook.php`
   - Content type: `application/json`
   - Secret: Same as above
   - Events: Just the push event

## Deployment Flow

### Automatic Deployment (Recommended)

1. Push to main branch:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. GitHub Actions automatically:
   - Runs tests
   - Deploys to qual
   - Waits for production approval

3. Approve production deployment:
   - Go to Actions tab
   - Click on the workflow run
   - Approve production deployment

### Manual Deployment

1. Deploy to qual:
   ```bash
   ssh stackmap-cpanel "cd ~/qual && git pull origin main"
   ```

2. Test qual environment:
   ```bash
   curl -I https://stackmap.app/qual/
   ```

3. Deploy to production:
   ```bash
   ssh stackmap-cpanel "rsync -av --delete ~/qual/ ~/public_html/"
   ```

## Monitoring

### Check Deployment Status

```bash
# View qual deployment logs
ssh stackmap-cpanel "tail -f ~/deployment-logs/qual-deploy.log"

# View production deployment logs
ssh stackmap-cpanel "tail -f ~/deployment-logs/prod-deploy.log"

# View webhook logs (if using webhooks)
ssh stackmap-cpanel "tail -f ~/deployment-logs/webhook.log"
```

### Rollback Procedure

If something goes wrong:

```bash
# Quick rollback to previous version
ssh stackmap-cpanel "cd ~/qual && git reset --hard HEAD~1"
ssh stackmap-cpanel "rsync -av --delete ~/qual/ ~/public_html/"
```

## Environment URLs

- **Production**: https://stackmap.app
- **Qual/Staging**: https://stackmap.app/qual/
- **GitHub Actions**: https://github.com/ajstack22/StackMap/actions

## Security Notes

1. SSH key is password-protected on the server
2. GitHub webhook uses signature verification
3. Production deployment requires manual approval
4. All deployment logs are kept for audit

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection
ssh -vv stackmap-cpanel

# Check SSH key permissions
ls -la ~/.ssh/id_rsa_cpanel
# Should be 600 (read/write for owner only)
```

### Git Pull Failures
```bash
# Check Git status
ssh stackmap-cpanel "cd ~/qual && git status"

# Reset if needed
ssh stackmap-cpanel "cd ~/qual && git reset --hard origin/main"
```

### Deployment Not Working
1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Ensure SSH key has correct permissions
4. Check server disk space: `ssh stackmap-cpanel "df -h"`

## Best Practices

1. **Always test locally first**
2. **Use meaningful commit messages**
3. **Review GitHub Actions logs**
4. **Monitor qual before approving production**
5. **Keep backups before major changes**

## Quick Commands Reference

```bash
# Deploy to qual
ssh stackmap-cpanel "cd ~/qual && git pull"

# Deploy to production
ssh stackmap-cpanel "rsync -av --delete ~/qual/ ~/public_html/"

# Check deployment status
ssh stackmap-cpanel "ls -la ~/qual/index.html ~/public_html/index.html"

# View recent commits
ssh stackmap-cpanel "cd ~/qual && git log --oneline -5"

# Emergency rollback
ssh stackmap-cpanel "cd ~/qual && git reset --hard HEAD~1 && rsync -av --delete ~/qual/ ~/public_html/"
```