# FTP Deployment Setup Guide

## Required GitHub Secrets

To use the new FTP-based deployment workflows, you need to add the following secrets to your GitHub repository:

### 1. FTP_SERVER
- **Description**: Your NameCheap FTP server hostname
- **Example**: `ftp.yourdomain.com` or `162.241.24.107`
- **Where to find**: 
  - Log into cPanel
  - Look for "FTP Accounts" section
  - The server address is usually shown there
  - Or check your NameCheap hosting welcome email

### 2. FTP_USERNAME
- **Description**: Your FTP username for cPanel
- **Example**: `stackmap` or `yourusername@stackmap.app`
- **Where to find**: 
  - cPanel → FTP Accounts
  - Usually your cPanel username or main FTP account
  - May include domain suffix (e.g., `@stackmap.app`)

### 3. FTP_PASSWORD
- **Description**: Your FTP password
- **Security Note**: Use a strong, unique password
- **Where to find/set**: 
  - cPanel → FTP Accounts → Change Password
  - Or use your cPanel password if it's the main account

## How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret:
   - Name: `FTP_SERVER`
   - Secret: Your FTP server address
   - Click "Add secret"
6. Repeat for `FTP_USERNAME` and `FTP_PASSWORD`

## Testing the Deployment

### 1. Test with Dry Run
```bash
# Go to Actions tab in GitHub
# Run "Test FTP Deploy (Dry Run)" workflow
# Select environment: qual or production
# Check the logs to see what would be deployed
```

### 2. Deploy to Qual First
- The workflow automatically deploys to qual environment first
- Located at: `public_html/qual/`
- Test at: `https://stackmap.app/qual/`

### 3. Production Deployment
- Only happens after successful qual deployment
- Requires manual approval (environment protection)
- Located at: `public_html/`
- Live at: `https://stackmap.app/`

## Important Notes

### Excluded Directories/Files
The following are NEVER deployed:
- `.well-known/` (SSL certificates - preserved)
- `node_modules/`
- `tests/`, `test/`
- `docs/`, `documentation/`
- `scripts/`
- Test files (`*.test.js`, `*.spec.js`)
- Coverage reports
- Environment files (`.env*`)
- README files
- Package lock files
- OS files (`.DS_Store`, `Thumbs.db`)
- Git files and directories

### FTP vs SSH Comparison
- **FTP Port**: Usually 21 (standard FTP) or 22 (SFTP)
- **SSH Port**: Was using 21098 (non-standard)
- **Authentication**: Username/password instead of SSH key
- **Compatibility**: Better support on shared hosting

### Troubleshooting

1. **Connection Timeout**
   - Check FTP_SERVER is correct
   - Verify no firewall blocking port 21
   - Try IP address instead of hostname

2. **Authentication Failed**
   - Verify FTP_USERNAME format (with or without @domain)
   - Reset FTP password in cPanel
   - Check for special characters in password

3. **Upload Failures**
   - Check disk space quota
   - Verify file permissions
   - Look for .htaccess upload restrictions

4. **Missing Files**
   - Review exclude patterns
   - Check `dry-run` output first
   - Verify source files exist in repository

## Rollback Procedure

If deployment fails:
1. Previous SSH workflow created backups in `~/backups/`
2. With FTP, consider keeping manual backups before major deploys
3. Can use cPanel File Manager to restore previous versions
4. Or redeploy a previous commit through GitHub Actions