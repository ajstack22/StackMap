# Issue #16: Build One-Click Rollback System

## 🚨 CRITICAL: Development Process
1. **BEFORE IMPLEMENTING**: Post your DETAILED implementation plan to Issue #16 on GitHub for PM adversarial review
2. **AFTER COMPLETING**: Update Issue #16 with completion status for final adversarial review
3. **DO NOT MERGE**: Until PM completes adversarial review and approves
4. **THINK HARD**: This is SUPER IMPORTANT - when things break, ADHD users need immediate relief

## Problem Statement
When a deployment breaks production, we need instant rollback capability. For ADHD users experiencing a broken app:
- Every minute of downtime increases anxiety
- Broken routines trigger executive dysfunction  
- Trust erodes quickly
- Recovery must be FAST

## Requirements

### Rollback Capabilities
1. **One-click rollback** - Single command or button
2. **<30 second execution** - Near instant
3. **Data safety** - Never lose user data
4. **Cache clearing** - Ensure users get rolled-back version
5. **Automatic detection** - Rollback on critical errors

## System Design

### 1. Release Tracking
```javascript
// releases.json - Track deployment history
{
  "releases": [
    {
      "version": "2024.06.23.1",
      "commit": "abc123",
      "timestamp": "2024-06-23T12:00:00Z",
      "deployer": "github-actions",
      "status": "active",
      "health": "healthy"
    },
    {
      "version": "2024.06.23.0",
      "commit": "def456",
      "timestamp": "2024-06-23T08:00:00Z",
      "deployer": "github-actions",
      "status": "previous",
      "health": "healthy"
    }
  ]
}
```

### 2. Rollback Script
```bash
#!/bin/bash
# rollback.sh - One-click rollback

set -e

# Configuration
RELEASES_DIR="/var/www/releases"
CURRENT_LINK="/var/www/current"
RELEASES_JSON="/var/www/shared/releases.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Starting rollback...${NC}"

# Get current and previous releases
CURRENT=$(readlink $CURRENT_LINK | xargs basename)
PREVIOUS=$(jq -r '.releases[] | select(.status=="previous") | .version' $RELEASES_JSON)

if [ -z "$PREVIOUS" ]; then
    echo -e "${RED}❌ No previous release found!${NC}"
    exit 1
fi

echo -e "Current release: ${RED}$CURRENT${NC}"
echo -e "Rolling back to: ${GREEN}$PREVIOUS${NC}"

# Confirm rollback
read -p "Proceed with rollback? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 1
fi

# Create pre-rollback backup
echo "Creating safety backup..."
cp $RELEASES_JSON "$RELEASES_JSON.backup-$(date +%s)"

# Perform rollback
echo "Switching symlink..."
ln -sfn "$RELEASES_DIR/$PREVIOUS" "$CURRENT_LINK"

# Update releases.json
echo "Updating release status..."
jq --arg current "$CURRENT" --arg previous "$PREVIOUS" '
  .releases |= map(
    if .version == $previous then .status = "active"
    elif .version == $current then .status = "rolled-back"
    else .status = "inactive" end
  )
' $RELEASES_JSON > $RELEASES_JSON.tmp && mv $RELEASES_JSON.tmp $RELEASES_JSON

# Clear caches
echo "Clearing caches..."
# CloudFlare
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
     -H "Authorization: Bearer $CF_API_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'

# Service worker update
echo "Forcing service worker update..."
echo "self.skipWaiting();" >> "$RELEASES_DIR/$PREVIOUS/sw.js"

# Nginx reload
echo "Reloading web server..."
sudo nginx -s reload

# Verify rollback
echo "Verifying rollback..."
sleep 2
ACTIVE_VERSION=$(curl -s https://stackmap.app/version.json | jq -r .version)
if [ "$ACTIVE_VERSION" == "$PREVIOUS" ]; then
    echo -e "${GREEN}✅ Rollback successful!${NC}"
    
    # Send notifications
    ./scripts/notify.sh "Rollback completed to version $PREVIOUS"
else
    echo -e "${RED}❌ Rollback verification failed!${NC}"
    exit 1
fi

# Log rollback
echo "{
  \"event\": \"rollback\",
  \"from\": \"$CURRENT\",
  \"to\": \"$PREVIOUS\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"user\": \"$USER\"
}" >> /var/www/shared/logs/rollback.log

echo -e "${GREEN}🎉 Rollback complete!${NC}"
```

### 3. Automated Rollback Triggers
```javascript
// health-monitor.js - Auto-rollback on failures
const HealthMonitor = {
    threshold: {
        errorRate: 0.1,      // 10% error rate
        responseTime: 5000,  // 5 second response
        availability: 0.95   // 95% uptime
    },
    
    checkInterval: 60000, // 1 minute
    
    async monitor() {
        const metrics = await this.collectMetrics();
        
        if (this.shouldRollback(metrics)) {
            console.error('Critical thresholds exceeded, triggering rollback');
            await this.triggerRollback();
        }
    },
    
    shouldRollback(metrics) {
        return metrics.errorRate > this.threshold.errorRate ||
               metrics.responseTime > this.threshold.responseTime ||
               metrics.availability < this.threshold.availability;
    },
    
    async triggerRollback() {
        // Execute rollback script
        exec('/var/www/scripts/rollback.sh --auto --skip-confirm');
        
        // Alert team
        await this.sendAlert({
            severity: 'critical',
            message: 'Automatic rollback triggered',
            metrics: metrics
        });
    }
};
```

### 4. Web UI for Rollback
```html
<!-- Admin panel rollback interface -->
<div class="rollback-panel">
    <h2>🚨 Emergency Rollback</h2>
    
    <div class="current-status">
        <p>Current Version: <span id="current-version"></span></p>
        <p>Health: <span id="health-status"></span></p>
    </div>
    
    <div class="rollback-options">
        <button id="rollback-btn" class="btn-danger">
            🔄 Rollback to Previous Version
        </button>
        
        <select id="version-select">
            <!-- Populated with available versions -->
        </select>
        <button id="rollback-specific-btn">
            Rollback to Selected
        </button>
    </div>
    
    <div class="rollback-log">
        <!-- Real-time rollback progress -->
    </div>
</div>
```

```javascript
// Rollback UI handler
document.getElementById('rollback-btn').addEventListener('click', async () => {
    if (!confirm('Are you sure? This will rollback to the previous version.')) {
        return;
    }
    
    const response = await fetch('/api/rollback', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    });
    
    // Stream progress
    const reader = response.body.getReader();
    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        
        const text = new TextDecoder().decode(value);
        updateRollbackLog(text);
    }
});
```

### 5. Database Rollback Handling
```sql
-- Always use migrations that can be rolled back
-- UP migration
ALTER TABLE tasks ADD COLUMN new_field VARCHAR(255);

-- DOWN migration (for rollback)
ALTER TABLE tasks DROP COLUMN new_field;
```

```bash
# Database rollback safety
if [ -f "$RELEASES_DIR/$PREVIOUS/db/rollback.sql" ]; then
    echo "Rolling back database changes..."
    mysql stackmap < "$RELEASES_DIR/$PREVIOUS/db/rollback.sql"
fi
```

## Testing Rollback

### Rollback Test Scenarios
```bash
#!/bin/bash
# test-rollback.sh

# 1. Test normal rollback
./deploy.sh staging
./rollback.sh
verify_version "previous"

# 2. Test with active users
simulate_traffic &
./rollback.sh
verify_no_errors

# 3. Test cache clearing
check_cdn_cache
./rollback.sh  
verify_cache_cleared

# 4. Test auto-rollback
simulate_high_errors
wait_for_auto_rollback
verify_rolled_back
```

## Monitoring & Alerts

### Rollback Notifications
```javascript
const RollbackNotifier = {
    channels: ['email', 'slack', 'sms'],
    
    async notify(event) {
        const message = {
            title: '🚨 Rollback Executed',
            body: `Rolled back from ${event.from} to ${event.to}`,
            severity: 'critical',
            actions: [
                'Check application health',
                'Review deployment logs',
                'Verify user impact'
            ]
        };
        
        await Promise.all(
            this.channels.map(ch => this.send(ch, message))
        );
    }
};
```

### Post-Rollback Checklist
```markdown
## Post-Rollback Actions
- [ ] Verify site is accessible
- [ ] Check error rates returned to normal
- [ ] Confirm critical features working
- [ ] Review what caused the issue
- [ ] Update status page
- [ ] Communicate with users
- [ ] Schedule post-mortem
```

## Definition of Done
- [ ] One-click rollback script working
- [ ] <30 second rollback time
- [ ] Auto-rollback on errors
- [ ] Web UI for admins
- [ ] Cache clearing integrated
- [ ] Database rollback safe
- [ ] Monitoring configured
- [ ] Team trained on process
- [ ] Runbook documented
- [ ] Tested in staging

## Success Metrics
- Rollback execution time: <30 seconds
- Zero data loss during rollback
- 100% cache clear success
- Auto-detection accuracy >95%
- Team response time <5 minutes

Remember: When ADHD users encounter a broken app, every second counts. Fast rollback = preserved trust!