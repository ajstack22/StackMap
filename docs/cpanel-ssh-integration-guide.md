# cPanel SSH Integration Guide for StackMap

## Overview
This guide provides everything needed to work with the cPanel SSH integration for the StackMap project. The integration enables automated deployments, backups, and server management through SSH connection to the cPanel hosting environment.

## SSH Connection Configuration

### Connection Alias
The project uses an SSH alias `stackmap-cpanel` configured in `~/.ssh/config`:

```bash
Host stackmap-cpanel
    HostName your-server.com
    Port 22
    User stachblx
```

### Setting Up SSH Access

1. **Create SSH config file** (if it doesn't exist):
```bash
mkdir -p ~/.ssh
touch ~/.ssh/config
chmod 600 ~/.ssh/config
```

2. **Add the StackMap cPanel configuration**:
```bash
cat >> ~/.ssh/config << 'EOF'
Host stackmap-cpanel
    HostName [YOUR_CPANEL_SERVER]
    Port 22
    User stachblx
EOF
```

3. **Set up SSH key authentication** (recommended):
```bash
# Generate SSH key if needed
ssh-keygen -t rsa -b 4096 -f ~/.ssh/stackmap_cpanel_rsa

# Add to SSH config
echo "    IdentityFile ~/.ssh/stackmap_cpanel_rsa" >> ~/.ssh/config

# Copy public key to server
ssh-copy-id -i ~/.ssh/stackmap_cpanel_rsa.pub stackmap-cpanel
```

4. **Test connection**:
```bash
ssh stackmap-cpanel
```

## Server Directory Structure

```
~/                              # Home directory
├── public_html/               # Web root
│   ├── index.html            # Production files
│   ├── bundle.js             # Production bundle
│   ├── qual/                 # Staging/QA environment
│   │   ├── index.html
│   │   └── bundle.js
│   ├── api/                  # Production API
│   │   └── sync/
│   └── qual/api/             # Staging API
│       └── sync/
├── backups/                   # Deployment backups
│   └── prod-before-deploy-*.tar.gz
└── .last-deployment-timestamp # Rollback tracking
```

## Deployment Scripts Integration

### Key Scripts Using SSH

1. **qual_deploy.sh** - Deploys to staging environment
2. **prod_deploy.sh** - Deploys to production
3. **deploy-with-tracking.sh** - Branch-based deployment system

### How SSH is Used in Deployments

#### Web Deployment (Staging/Qual)
```bash
# From qual_deploy.sh (line 354)
"$SCRIPT_DIR/deploy-with-tracking.sh" qual
```

#### Production Deployment
```bash
# From prod_deploy.sh (lines 104-120)
ssh stackmap-cpanel << 'EOF'
    cd ~/public_html
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    tar -czf ~/backups/prod-before-deploy-$TIMESTAMP.tar.gz . \
        --exclude='qual' --exclude='demo' --exclude='backups'
    echo $TIMESTAMP > ~/.last-deployment-timestamp
    rsync -av --exclude='.git' --exclude='error_log' \
        --exclude='.htaccess' --exclude='qual' --exclude='demo' qual/ .
EOF
```

#### Rollback Mechanism
```bash
# From prod_deploy.sh (lines 126-147)
ssh stackmap-cpanel << EOF
    cd ~/public_html
    tar -xzf ~/backups/prod-before-deploy-$TIMESTAMP.tar.gz
EOF
```

## Common SSH Commands Used

### Backup Creation
```bash
ssh stackmap-cpanel "cd ~/public_html && tar -czf ~/backups/backup-$(date +%Y%m%d).tar.gz ."
```

### File Synchronization
```bash
# Push files to server
rsync -avz --exclude='.git' ./web/build/ stackmap-cpanel:~/public_html/qual/

# Pull files from server
rsync -avz stackmap-cpanel:~/public_html/qual/ ./backup/
```

### Remote Command Execution
```bash
# Check disk usage
ssh stackmap-cpanel "df -h ~/public_html"

# List recent backups
ssh stackmap-cpanel "ls -lht ~/backups | head -10"

# Check deployment status
ssh stackmap-cpanel "cat ~/.last-deployment-timestamp"
```

## API Endpoints

### Production
- URL: `https://stackmap.app/api/sync`
- Path on server: `~/public_html/api/sync/`

### Staging (Qual)
- URL: `https://stackmap.app/qual/api/sync`
- Path on server: `~/public_html/qual/api/sync/`

## Deployment Workflow

### 1. Staging Deployment
```bash
./scripts/qual_deploy.sh
```
- Auto-commits changes
- Increments version
- Runs tests and security audit
- Deploys to `~/public_html/qual/`

### 2. Production Deployment
```bash
./scripts/prod_deploy.sh web
```
- Creates backup of current production
- Syncs qual to production
- Stores rollback timestamp

### 3. Full Production Deploy (Web + Mobile)
```bash
./scripts/prod_deploy.sh all
```
- Deploys web to production
- Builds Android AAB
- Prepares iOS for archive

### 4. Rollback (if needed)
```bash
./scripts/prod_deploy.sh rollback
```
- Restores from last backup
- Uses timestamp tracking

## Security Considerations

1. **Never commit SSH credentials** to the repository
2. **Use SSH keys** instead of passwords
3. **Restrict SSH access** by IP if possible
4. **Regular key rotation** - update SSH keys periodically
5. **Backup before deployment** - automatic in prod_deploy.sh

## Troubleshooting

### Connection Issues

#### "Permission denied"
- Check username is correct (`stachblx`)
- Verify SSH key is added to server
- Ensure correct permissions: `chmod 600 ~/.ssh/config`

#### "Connection refused"
- Verify port number (default 22)
- Check if SSH is enabled in cPanel
- Firewall may be blocking connection

#### "Host key verification failed"
- First connection to server
- Type `yes` when prompted to add host key

### Deployment Issues

#### Files not updating
```bash
# Clear server cache
ssh stackmap-cpanel "cd ~/public_html && rm -rf .cache"

# Force sync
rsync -avz --delete --exclude='.git' ./web/build/ stackmap-cpanel:~/public_html/qual/
```

#### Rollback not working
```bash
# Check available backups
ssh stackmap-cpanel "ls -la ~/backups/"

# Manual rollback
ssh stackmap-cpanel "cd ~/public_html && tar -xzf ~/backups/[backup-file]"
```

## Quick Reference

### Essential Commands
```bash
# Connect to server
ssh stackmap-cpanel

# Deploy to staging
./scripts/qual_deploy.sh

# Deploy to production
./scripts/prod_deploy.sh web

# Full deploy (web + mobile)
./scripts/prod_deploy.sh all

# Rollback production
./scripts/prod_deploy.sh rollback

# Check server status
ssh stackmap-cpanel "cd ~/public_html && ls -la"

# View recent deployments
ssh stackmap-cpanel "ls -lht ~/backups | head -5"

# Monitor disk usage
ssh stackmap-cpanel "df -h ~"
```

### File Paths on Server
- Production web: `~/public_html/`
- Staging web: `~/public_html/qual/`
- Backups: `~/backups/`
- API endpoints: `~/public_html/api/` and `~/public_html/qual/api/`

## Integration with CI/CD

The SSH integration can be automated with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
deploy:
  steps:
    - name: Setup SSH
      run: |
        mkdir -p ~/.ssh
        echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/stackmap_cpanel_rsa
        chmod 600 ~/.ssh/stackmap_cpanel_rsa
        echo "${{ secrets.SSH_CONFIG }}" > ~/.ssh/config
        chmod 600 ~/.ssh/config
    
    - name: Deploy to Staging
      run: ./scripts/qual_deploy.sh
    
    - name: Deploy to Production
      if: github.ref == 'refs/heads/main'
      run: ./scripts/prod_deploy.sh web
```

## Additional Resources

- [SSH Setup Guide](./setup/SSH_SETUP_GUIDE.md) - Detailed SSH setup instructions
- [Deployment README](./deployment/README.md) - Complete deployment documentation
- [CLAUDE.md](../CLAUDE.md) - Project development guide with deployment commands

## Contact & Support

For SSH access issues or server configuration questions:
1. Check cPanel SSH Access section
2. Contact hosting provider support
3. Review server welcome email for connection details

## Notes for External Projects

When adapting this for another project:

1. **Update SSH alias** - Change `stackmap-cpanel` to your project name
2. **Modify paths** - Update `~/public_html` to match your server structure
3. **Adjust deployment scripts** - Modify rsync excludes and paths
4. **Update API endpoints** - Change URLs to match your domain
5. **Test thoroughly** - Always test on staging before production
6. **Set up backups** - Ensure backup directory exists: `mkdir -p ~/backups`