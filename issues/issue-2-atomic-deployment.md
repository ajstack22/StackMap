# Issue: Implement atomic deployment structure to prevent downtime

## Problem
Current deployment directly overwrites production files, causing:
- Potential downtime during file transfer
- No ability to quickly rollback
- Risk of partial deployments
- The catastrophic rsync --delete incident that deleted entire directories

## Solution
Implement atomic deployments using symlinks and versioned releases directory.

## Implementation Details

### 1. Create Directory Structure
```bash
/home/stachblx/
├── releases/                    # All deployments
│   ├── 20240619_143022/        # Timestamped releases
│   ├── 20240619_102030/
│   └── 20240619_095045/
├── shared/                      # Shared between releases
│   ├── uploads/
│   ├── .well-known/            # SSL certs
│   └── logs/
└── public_html -> releases/20240619_143022  # Symlink to current
```

### 2. Deployment Script
```bash
#!/bin/bash
# deploy-atomic.sh

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="/home/stachblx/releases/$TIMESTAMP"
SHARED_DIR="/home/stachblx/shared"
PUBLIC_DIR="/home/stachblx/public_html"

# Create release directory
mkdir -p "$RELEASE_DIR"

# Deploy files (WITHOUT --delete flag!)
rsync -avz \
  --exclude='.git' \
  --exclude='.well-known' \
  --exclude='uploads' \
  --exclude='*.log' \
  ./ "$RELEASE_DIR/"

# Link shared directories
ln -s "$SHARED_DIR/uploads" "$RELEASE_DIR/uploads"
ln -s "$SHARED_DIR/.well-known" "$RELEASE_DIR/.well-known"

# Atomic switch
ln -sfn "$RELEASE_DIR" "$PUBLIC_DIR"

# Cleanup old releases (keep last 5)
cd /home/stachblx/releases
ls -t | tail -n +6 | xargs rm -rf
```

### 3. GitHub Actions Integration
```yaml
- name: Deploy atomically
  run: |
    ssh -p 21098 user@server 'bash -s' < deploy-atomic.sh
```

## Benefits
- Zero-downtime deployments
- Instant rollback capability
- Protection against partial deployments
- Preservation of user uploads and SSL certificates
- No more --delete disasters

## Testing Plan
1. Test script locally first
2. Deploy to staging with symlink
3. Verify symlink switching works
4. Test rollback procedure
5. Verify shared directories work

## Success Criteria
- [ ] Deployments have zero downtime
- [ ] Can rollback in <30 seconds
- [ ] Shared directories remain intact
- [ ] Old releases auto-cleanup
- [ ] No more missing directories

## References
- Research: [CICD_research.md lines 68-102]
- Capistrano-style deployments
- rsync disaster: 2025-06-19 production outage