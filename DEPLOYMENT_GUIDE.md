# StackMap Deployment Guide

## cPanel Deployment Instructions

### Prerequisites
- cPanel access with File Manager
- FTP client (optional, for bulk upload)
- Git access on cPanel (if available)

### Method 1: cPanel File Manager (Simple)

1. **Login to cPanel**
   - Access your cPanel dashboard
   - Navigate to "File Manager"

2. **Navigate to Public Directory**
   - Go to `public_html` or your domain's document root
   - Create a backup of existing files if needed

3. **Upload Files**
   - Click "Upload" in File Manager
   - Select all StackMap files and folders:
     - All `.html` files
     - All `.js` files  
     - All directories (`app/`, `components/`, `styles/`, etc.)
     - `manifest.json`
     - All icon files
     - `.htaccess` (if you have one)
   - **DO NOT upload**:
     - `.git/` directory
     - `.gitignore`
     - `README.md`, `LICENSE`, etc. (documentation files)
     - `dev-tools.js` (optional, for production)

4. **Set Permissions**
   - All files: 644
   - All directories: 755

### Method 2: Git Deployment (Recommended)

1. **SSH into your server**
   ```bash
   ssh username@yourdomain.com
   ```

2. **Navigate to public directory**
   ```bash
   cd public_html
   ```

3. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/stackmap.git .
   ```

4. **Remove non-production files**
   ```bash
   rm -rf .git README.md LICENSE CONTRIBUTING.md SECURITY.md docs/
   ```

### Method 3: FTP Upload

1. **Connect via FTP**
   - Host: Your domain or IP
   - Username: Your cPanel username
   - Password: Your cPanel password
   - Port: 21 (or as specified)

2. **Upload files to public_html**
   - Transfer all production files
   - Skip documentation and development files

### Post-Deployment Steps

1. **Test the deployment**
   - Visit https://yourdomain.com
   - Check browser console for errors
   - Test offline functionality
   - Verify service worker registration

2. **Clear caches**
   - Clear browser cache
   - If using Cloudflare, purge cache

3. **Update DNS (if needed)**
   - Point domain to cPanel server
   - Add SSL certificate if not present

### Important Files Checklist

✅ **Required for Production:**
- `index.html`
- `offline.html`
- `manifest.json`
- `sw.js`
- `browserconfig.xml`
- All `.js` files in `app/`, `components/`, `js/`
- All `.css` files in `styles/`
- All icon files (`.png`)
- `data/` directory
- `config/` directory
- `utils/` directory

❌ **Exclude from Production:**
- `.git/` directory
- Documentation files (`.md`)
- `dev-tools.js` (optional)
- `.env` file (if exists)
- Any backup files

### Troubleshooting

**Service Worker not registering:**
- Ensure HTTPS is enabled
- Check file paths are correct
- Clear browser cache

**404 errors:**
- Verify all files uploaded
- Check `.htaccess` for rewrite rules
- Ensure proper file permissions

**Google Drive sync not working:**
- Add your domain to Google Console
- Update OAuth redirect URIs
- Check CSP headers

### Security Checklist

- [ ] HTTPS enabled
- [ ] No sensitive files uploaded
- [ ] Proper file permissions set
- [ ] `.env` not uploaded
- [ ] Documentation files excluded

## Quick Deploy Script

If you have SSH access, create this script:

```bash
#!/bin/bash
# deploy.sh

echo "Deploying StackMap..."

# Backup current version
cp -r public_html public_html_backup_$(date +%Y%m%d)

# Pull latest changes
cd public_html
git pull origin main

# Remove non-production files
rm -rf .git docs/ README.md LICENSE CONTRIBUTING.md SECURITY.md

# Set permissions
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

echo "Deployment complete!"
```

### Environment Variables

If using Google Drive sync, create `.env` file:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_API_KEY=your_api_key
GOOGLE_APP_ID=your_app_id
```

Remember to:
1. Never commit `.env` to git
2. Set up these values in your cPanel environment
3. Update `env-loader.js` if needed

---

For automated deployment, consider using:
- GitHub Actions with cPanel deployment action
- cPanel's Git Version Control
- CI/CD pipeline with your hosting provider