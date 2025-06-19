# FTP Deployment Setup for StackMap

## Overview
This guide explains how to configure FTP deployment for StackMap using GitHub Actions, replacing the failing SSH-based deployment.

## Required GitHub Secrets

Add the following secrets to your GitHub repository:

### 1. FTP_SERVER
- **Description**: Your NameCheap cPanel FTP server hostname
- **Example**: `ftp.yourdomain.com` or `server123.web-hosting.com`
- **How to find**: Check your NameCheap cPanel or hosting welcome email

### 2. FTP_USERNAME
- **Description**: Your cPanel FTP username
- **Example**: `yourusername` or `cpanelusername`
- **Note**: This is usually your cPanel username, not an email address

### 3. FTP_PASSWORD
- **Description**: Your cPanel FTP password
- **Example**: `your-secure-password`
- **Important**: Use your cPanel password or create a specific FTP user in cPanel

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact names above

## Deployment Workflows

### 1. Main Deployment (`deploy-ftp.yml`)
- Automatically deploys to qual and prod on push to main branch
- Preserves `.well-known` directory for SSL certificates
- Excludes development files and directories

### 2. Test Deployment (`deploy-ftp-test.yml`)
- Manual trigger for dry-run testing
- Shows what files would be deployed
- Tests FTP connection without actual deployment

## Excluded Files/Directories

The following are excluded from deployment:
- `.git` and git-related files
- `node_modules/`
- `tests/`
- `docs/`
- `scripts/`
- `.github/`
- `package-lock.json`
- `README.md`
- Log files (`*.log`)
- `.DS_Store`
- `mobile-launch-issues/`
- `ios-wrapper/`
- `store-assets/`
- `.well-known/` (production only, preserved)
- `qual/` (production only)

## Testing the Deployment

1. **Run the dry-run test first:**
   ```
   Go to Actions → FTP Deploy Test (Dry Run) → Run workflow
   ```

2. **Check the output** to ensure:
   - Correct files are being deployed
   - Excluded directories are properly filtered
   - Connection to FTP server works

3. **Deploy to qual first** before production

## Migration from SSH

The new FTP deployment:
- ✅ More reliable than SSH on port 21098
- ✅ Works with standard NameCheap cPanel hosting
- ✅ Preserves SSL certificates in `.well-known`
- ✅ Supports incremental updates
- ✅ Has built-in retry mechanism

## Troubleshooting

### FTP Connection Failed
- Verify FTP_SERVER is correct (no `ftp://` prefix)
- Check username/password in cPanel
- Ensure FTP is enabled in cPanel

### Files Not Uploading
- Check file permissions in cPanel
- Verify server directory paths
- Look at workflow logs for specific errors

### SSL Certificate Issues
- `.well-known` directory is preserved
- Never use `dangerous-clean-slate: true` on production

## Support

For issues with:
- **GitHub Actions**: Check workflow logs
- **FTP Access**: Contact NameCheap support
- **StackMap**: Create an issue in the repository