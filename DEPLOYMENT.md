# StackMap Deployment Guide - THE OFFICIAL METHOD

**Last Updated**: June 19, 2025  
**Status**: THIS IS THE ONLY APPROVED DEPLOYMENT METHOD

## 🚨 CRITICAL: Read This First

All other deployment documentation is **DEPRECATED**. This is the **ONLY** approved deployment process for StackMap.

## Deployment Flow

```
Local Development → GitHub → [AUTO] → Qual (Staging) → [MANUAL] → Production
```

## Automated Deployment Process

### 🤖 Automatic: Push to Main = Deploy to Qual
- Every push to `main` branch automatically deploys to staging
- No manual steps required
- GitHub Actions handles everything
- Check status at: https://github.com/ajstack22/StackMap/actions

### 🔴 Manual: Deploy to Production
1. Go to: https://github.com/ajstack22/StackMap/actions/workflows/deploy-production.yml
2. Click "Run workflow"
3. Type "deploy" to confirm
4. Click "Run workflow"

## Step-by-Step Deployment Process

### 1. Local Development
```bash
# Make your changes locally
# Test thoroughly with:
npm run serve
# or
python -m http.server 5500
```

### 2. Push to GitHub
```bash
# Commit your changes
git add .
git commit -m "Your descriptive commit message"

# Push to main branch
git push origin main
```

### 3. Deploy to Qual (Staging)
```bash
# SSH into server and pull latest code
ssh stackmap-cpanel "cd ~/public_html/qual && git pull origin main"

# Or use this helper command from your local machine:
./scripts/deploy-to-qual.sh
```

### 4. Test on Qual
- Visit https://stackmap.app/qual/
- Test all functionality
- Check browser console for errors
- Test on mobile devices

### 5. Deploy to Production
```bash
# Run the official deployment script
./scripts/deploy-qual-to-prod.sh
```

This script will:
- ✅ Verify qual is working
- ✅ Create a backup of production  
- ✅ Deploy code to production
- ✅ Update service worker cache
- ✅ Verify deployment success
- ✅ Provide rollback instructions

## Environment URLs

- **Local**: http://localhost:5500
- **Qual/Staging**: https://stackmap.app/qual/
- **Production**: https://stackmap.app/

## SSH Access

SSH is already configured. Use:
```bash
ssh stackmap-cpanel
```

## Emergency Rollback

If something goes wrong:
```bash
# The deployment script will give you the exact rollback command
# It will look like:
ssh stackmap-cpanel "cd ~ && tar -xzf ~/backups/production-TIMESTAMP.tar.gz"
```

## What NOT to Do

❌ **DO NOT** use GitHub Actions for deployment  
❌ **DO NOT** deploy directly to production without testing on qual  
❌ **DO NOT** use FTP unless it's an emergency  
❌ **DO NOT** remove console.log statements (causes syntax errors)  
❌ **DO NOT** create new deployment methods  

## File Locations on Server

- **Production**: `/home/stachblx/public_html/`
- **Qual/Staging**: `/home/stachblx/public_html/qual/`
- **Demo**: `/home/stachblx/public_html/demo/`
- **Backups**: `/home/stachblx/backups/`

## Git Remotes

Both qual and production use:
```
git@github.com:ajstack22/StackMap.git
```

## Troubleshooting

### Qual not accessible?
1. Check if files exist: `ssh stackmap-cpanel "ls -la ~/public_html/qual/"`
2. Check git status: `ssh stackmap-cpanel "cd ~/public_html/qual && git status"`

### Production deployment failed?
1. Check the backup location provided by the script
2. Use the rollback command provided
3. Investigate what went wrong in qual

### SSH not working?
- SSH config is at: `~/.ssh/config`
- Host alias: `stackmap-cpanel`
- Port: 21098

## The Golden Rules

1. **Always test on qual first**
2. **Use the official deployment script**
3. **Never skip the qual testing step**
4. **Keep it simple - no complex CI/CD**

## Why This Method?

- ✅ Simple and reliable
- ✅ Always have a backup
- ✅ Can see exactly what's deployed
- ✅ Easy rollback
- ✅ No complex automation to break
- ✅ Full control over timing

---

**Remember**: When in doubt, test on qual first!