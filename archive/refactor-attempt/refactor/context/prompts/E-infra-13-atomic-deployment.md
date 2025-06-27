# Issue #13: Implement Atomic Deployment Structure

## 🚨 CRITICAL: Development Process
1. **BEFORE IMPLEMENTING**: Post your DETAILED implementation plan to Issue #13 on GitHub for PM adversarial review
2. **AFTER COMPLETING**: Update Issue #13 with completion status for final adversarial review
3. **DO NOT MERGE**: Until PM completes adversarial review and approves
4. **THINK HARD**: This is SUPER IMPORTANT - broken deployments devastate ADHD users who depend on routine

## Problem Statement
Current deployment can leave the app in a broken state if interrupted. We need atomic deployments where:
- All files deploy together or not at all
- Zero downtime during deployment
- Instant rollback capability
- No mixed version states

## Why This Matters for ADHD Users
- **Routine disruption** triggers executive dysfunction
- **Broken app states** cause abandonment
- **Reliability** builds trust
- **Consistency** reduces cognitive load

## Current Problems
```bash
# Current risky deployment
scp -r dist/* server:/var/www/html/
# If this fails halfway, app is broken!
```

Problems:
- Files overwritten one by one
- Users might load mixed versions
- No rollback if something breaks
- Service worker cache conflicts

## Atomic Deployment Design

### Blue-Green Deployment Pattern
```
/var/www/
├── current -> releases/20240623-1234/  # Symlink
├── releases/
│   ├── 20240623-1234/  # Current release
│   ├── 20240623-1100/  # Previous release
│   └── 20240623-0900/  # Older release
└── shared/
    ├── uploads/         # Persistent user data
    └── config/          # Shared configuration
```

### Deployment Process
```bash
#!/bin/bash
# deploy.sh

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RELEASE_DIR="/var/www/releases/$TIMESTAMP"
CURRENT_LINK="/var/www/current"

# 1. Upload to new release directory
echo "Uploading release $TIMESTAMP..."
rsync -av --progress dist/ server:$RELEASE_DIR/

# 2. Verify upload integrity
echo "Verifying deployment..."
ssh server "cd $RELEASE_DIR && sha256sum -c checksums.txt"

# 3. Run smoke tests
echo "Running smoke tests..."
curl -f https://staging.stackmap.app/health || exit 1

# 4. Atomic switch
echo "Switching to new release..."
ssh server "ln -sfn $RELEASE_DIR $CURRENT_LINK"

# 5. Warm up caches
echo "Warming up caches..."
curl -s https://stackmap.app/ > /dev/null

echo "Deployment complete!"
```

## Implementation Requirements

### 1. Directory Structure Setup
```bash
# setup-atomic-deploy.sh
#!/bin/bash

# Create directory structure
mkdir -p /var/www/{releases,shared}
mkdir -p /var/www/shared/{uploads,config,logs}

# Set permissions
chown -R www-data:www-data /var/www
chmod -R 755 /var/www
```

### 2. Nginx Configuration
```nginx
server {
    server_name stackmap.app;
    root /var/www/current;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache busting for versioned assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        
        # Don't cache HTML
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK";
    }
    
    # Shared user uploads
    location /uploads {
        alias /var/www/shared/uploads;
    }
}
```

### 3. Rollback Script
```bash
#!/bin/bash
# rollback.sh

PREVIOUS=$(readlink /var/www/current | xargs dirname | xargs ls -t | sed -n '2p')
ROLLBACK_TO="/var/www/releases/$PREVIOUS"

echo "Rolling back to $PREVIOUS..."
ln -sfn $ROLLBACK_TO /var/www/current

# Clear caches
curl -X PURGE https://stackmap.app/

echo "Rollback complete!"
```

### 4. Cleanup Old Releases
```bash
#!/bin/bash
# cleanup-releases.sh

# Keep last 5 releases
cd /var/www/releases
ls -t | tail -n +6 | xargs rm -rf

echo "Cleaned up old releases"
```

## GitHub Actions Integration
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build
        run: |
          npm ci
          npm run build
          
      - name: Generate checksums
        run: |
          cd dist
          find . -type f -exec sha256sum {} \; > checksums.txt
          
      - name: Deploy atomically
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          eval $(ssh-agent -s)
          echo "$DEPLOY_KEY" | ssh-add -
          ./scripts/deploy.sh
          
      - name: Verify deployment
        run: |
          curl -f https://stackmap.app/health
          curl -f https://stackmap.app/ | grep -q "StackMap"
```

## Verification & Monitoring

### Health Checks
```javascript
// health.js - Add to app
window.HealthCheck = {
    version: BUILD_VERSION,
    timestamp: BUILD_TIMESTAMP,
    
    verify: async function() {
        const checks = {
            storage: await this.checkStorage(),
            api: await this.checkAPI(),
            assets: await this.checkAssets()
        };
        
        return {
            healthy: Object.values(checks).every(c => c),
            checks: checks,
            version: this.version
        };
    }
};
```

### Deployment Verification
```bash
# verify-deployment.sh
#!/bin/bash

# Check symlink
CURRENT=$(readlink /var/www/current)
echo "Current release: $CURRENT"

# Check critical files
CRITICAL_FILES="index.html js/app.js css/base.css"
for file in $CRITICAL_FILES; do
    if [ ! -f "/var/www/current/$file" ]; then
        echo "ERROR: Missing $file"
        exit 1
    fi
done

# Check permissions
if [ $(stat -c %U /var/www/current) != "www-data" ]; then
    echo "ERROR: Wrong ownership"
    exit 1
fi

echo "Deployment verified!"
```

## Definition of Done
- [ ] Atomic deployment script working
- [ ] Zero-downtime deployments
- [ ] Rollback completes in <30 seconds
- [ ] Health checks implemented
- [ ] Nginx configured correctly
- [ ] GitHub Actions integrated
- [ ] Monitoring alerts setup
- [ ] Documentation complete
- [ ] Team trained on process
- [ ] 5 successful deployments

## Monitoring & Alerts
```yaml
# monitoring.yml
checks:
  - name: Deployment Health
    url: https://stackmap.app/health
    interval: 60s
    
  - name: Version Consistency
    script: check-version.sh
    interval: 5m
    
alerts:
  - on: deployment_failed
    notify: [email, slack]
  - on: rollback_triggered  
    notify: [email, slack, pagerduty]
```

## Common Pitfalls
1. Don't forget to test symlink creation
2. Ensure temp directories are cleaned
3. Watch for permission issues
4. Clear CDN caches after deploy
5. Update service worker version

Remember: ADHD users need rock-solid reliability. Every failed deployment breaks trust!