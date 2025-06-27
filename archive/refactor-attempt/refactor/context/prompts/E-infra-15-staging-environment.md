# Issue #15: Create Staging Environment

## 🚨 CRITICAL: Development Process
1. **BEFORE IMPLEMENTING**: Post your DETAILED implementation plan to Issue #15 on GitHub for PM adversarial review
2. **AFTER COMPLETING**: Update Issue #15 with completion status for final adversarial review
3. **DO NOT MERGE**: Until PM completes adversarial review and approves
4. **THINK HARD**: This is SUPER IMPORTANT - testing in production traumatizes users with ADHD

## Problem Statement
We need a staging environment that exactly mirrors production for testing changes before they affect real users. This prevents:
- Breaking changes reaching users
- Data loss from untested migrations
- Performance regressions
- Accessibility breakage

## Requirements

### Environment Parity
Staging must match production:
- Same server configuration
- Same database version
- Same deployment process
- Same monitoring
- Different data (no real user data)

### Access Control
- Password protected
- Not indexed by search engines
- Separate from production data
- Clear visual indicator it's staging

## Infrastructure Setup

### 1. Subdomain Configuration
```
staging.stackmap.app
├── Same codebase as production
├── Separate database
├── Separate file storage
└── Basic auth protection
```

### 2. Server Setup
```bash
# Create staging directories
mkdir -p /var/www/staging/{current,releases,shared}
mkdir -p /var/www/staging/shared/{uploads,config,logs}

# Set permissions
chown -R www-data:www-data /var/www/staging
chmod -R 755 /var/www/staging
```

### 3. Nginx Configuration
```nginx
# /etc/nginx/sites-available/staging.stackmap.app
server {
    listen 443 ssl http2;
    server_name staging.stackmap.app;
    root /var/www/staging/current;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/staging.stackmap.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.stackmap.app/privkey.pem;
    
    # Basic authentication
    auth_basic "Staging Environment";
    auth_basic_user_file /etc/nginx/.htpasswd-staging;
    
    # Prevent search engine indexing
    add_header X-Robots-Tag "noindex, nofollow" always;
    
    # Visual indicator header
    add_header X-Environment "staging" always;
    
    # Same location blocks as production
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /health {
        auth_basic off; # Allow health checks without auth
        return 200 "OK - Staging";
    }
}
```

### 4. Database Setup
```sql
-- Create staging database
CREATE DATABASE stackmap_staging;
CREATE USER 'stackmap_staging'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON stackmap_staging.* TO 'stackmap_staging'@'localhost';
FLUSH PRIVILEGES;

-- Copy schema (not data) from production
mysqldump -d stackmap_prod | mysql stackmap_staging
```

### 5. Environment Configuration
```javascript
// config/staging.js
module.exports = {
    environment: 'staging',
    database: {
        host: 'localhost',
        name: 'stackmap_staging',
        user: 'stackmap_staging',
        password: process.env.STAGING_DB_PASSWORD
    },
    storage: {
        uploads: '/var/www/staging/shared/uploads'
    },
    features: {
        debugMode: true,
        verboseLogging: true,
        testAccounts: true
    }
};
```

## Staging-Specific Features

### 1. Visual Indicator
```css
/* Staging indicator banner */
.staging-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #ff9800;
    color: white;
    text-align: center;
    padding: 8px;
    z-index: 9999;
    font-weight: bold;
}

.staging-banner::before {
    content: "🚧 STAGING ENVIRONMENT - Not Real Data 🚧";
}
```

```javascript
// Add to app initialization
if (window.location.hostname === 'staging.stackmap.app') {
    const banner = document.createElement('div');
    banner.className = 'staging-banner';
    document.body.prepend(banner);
}
```

### 2. Test Data Generation
```javascript
// scripts/generate-staging-data.js
const TestData = {
    users: [
        { id: 'test_user_1', name: 'Test User 1', email: 'test1@example.com' },
        { id: 'test_user_2', name: 'Test User 2', email: 'test2@example.com' }
    ],
    
    generateTasks: function(userId, count = 50) {
        return Array.from({length: count}, (_, i) => ({
            id: `test_task_${userId}_${i}`,
            user_id: userId,
            title: `Test Task ${i}`,
            completed: Math.random() > 0.7,
            timeframe: ['today', 'tomorrow', 'later'][Math.floor(Math.random() * 3)]
        }));
    }
};
```

### 3. Debug Tools
```javascript
// Staging-only debug panel
if (ENV.isStaging) {
    window.StagingTools = {
        clearData: () => localStorage.clear(),
        simulateError: () => { throw new Error('Test error'); },
        fillStorage: () => { /* Fill to quota */ },
        slowNetwork: () => { /* Throttle requests */ },
        offlineMode: () => { /* Force offline */ }
    };
}
```

## Deployment Pipeline

### Staging Deployment
```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  push:
    branches: [develop, staging/*]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v3
      
      - name: Build for staging
        env:
          NODE_ENV: staging
        run: |
          npm ci
          npm run build:staging
          
      - name: Run tests
        run: npm test
        
      - name: Deploy to staging
        env:
          STAGING_DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}
        run: |
          ./scripts/deploy.sh staging
          
      - name: Run smoke tests
        run: |
          curl -f https://staging.stackmap.app/health
          npm run test:e2e -- --baseUrl=https://staging.stackmap.app
```

### Production Deployment Gate
```yaml
# Production requires staging approval
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  staging-check:
    runs-on: ubuntu-latest
    steps:
      - name: Verify staging deployment
        run: |
          STAGING_VERSION=$(curl -s https://staging.stackmap.app/version.json | jq -r .version)
          COMMIT_VERSION=$(git rev-parse HEAD)
          if [ "$STAGING_VERSION" != "$COMMIT_VERSION" ]; then
            echo "ERROR: This version not tested in staging!"
            exit 1
          fi
          
  deploy:
    needs: staging-check
    # ... production deployment
```

## Testing Procedures

### Staging Test Checklist
Before promoting to production:
- [ ] All unit tests pass
- [ ] E2E tests pass on staging
- [ ] Manual smoke test completed
- [ ] Performance metrics acceptable
- [ ] No console errors
- [ ] Accessibility audit passes
- [ ] Data migrations tested
- [ ] Rollback tested

### Automated Staging Tests
```javascript
// e2e/staging-tests.js
describe('Staging Environment Tests', () => {
    it('shows staging banner', async () => {
        await page.goto('https://staging.stackmap.app');
        const banner = await page.$('.staging-banner');
        expect(banner).toBeTruthy();
    });
    
    it('requires authentication', async () => {
        const response = await fetch('https://staging.stackmap.app');
        expect(response.status).toBe(401);
    });
    
    it('uses test data only', async () => {
        // Verify no production data
    });
});
```

## Definition of Done
- [ ] Staging subdomain configured
- [ ] Basic auth protection working
- [ ] Separate database created
- [ ] Visual staging indicator
- [ ] Test data generated
- [ ] Deployment pipeline working
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Team has access credentials
- [ ] First successful deployment

## Access Management
```bash
# Create staging users
htpasswd -c /etc/nginx/.htpasswd-staging admin
htpasswd /etc/nginx/.htpasswd-staging developer
htpasswd /etc/nginx/.htpasswd-staging tester

# Share credentials securely
# Store in password manager
# Rotate quarterly
```

## Success Metrics
- Zero production bugs from untested changes
- All changes tested in staging first
- <5 minute staging deployment
- 100% e2e test pass rate
- No real user data in staging

Remember: Testing on real users with ADHD is unethical. Staging protects vulnerable users!