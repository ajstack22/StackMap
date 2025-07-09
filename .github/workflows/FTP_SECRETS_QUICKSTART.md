# FTP Deployment Quick Start

## Required GitHub Secrets

Add these secrets to your repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example |
|------------|-------------|---------|
| `FTP_SERVER` | FTP server hostname | `ftp.yourdomain.com` |
| `FTP_USERNAME` | cPanel username | `yourcpaneluser` |
| `FTP_PASSWORD` | cPanel password | `your-password` |

## Quick Test

1. Add the secrets above
2. Go to Actions → "FTP Deploy Test (Dry Run)"
3. Click "Run workflow" → Select target (qual/prod) → Run
4. Check the logs to verify connection

## Deployment

The deployment will automatically run when you push to the `main` branch:
- First deploys to `/public_html/qual/`
- Then deploys to `/public_html/`
- Preserves `.well-known/` directory for SSL

## What's Excluded

- Development files (node_modules, tests, docs)
- Git files and GitHub workflows
- Build artifacts and logs
- iOS/Android wrapper code
- Marketing assets

## Troubleshooting

**Connection refused**: Check FTP_SERVER (no `ftp://` prefix)  
**Authentication failed**: Verify username/password in cPanel  
**Path not found**: Ensure directories exist on server  

## Need Help?

See full documentation: [FTP_DEPLOYMENT_SETUP.md](./FTP_DEPLOYMENT_SETUP.md)