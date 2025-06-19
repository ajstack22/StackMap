# Issue: Create staging environment for safe pre-production testing

## Problem
Currently deploying directly to production without testing, causing:
- Material Icons breaking in production
- JavaScript syntax errors going live
- No way to preview changes
- No confidence in deployments
- Multiple production incidents

## Solution
Set up staging.stackmap.app subdomain with identical environment to production.

## Implementation Details

### 1. Create Subdomain in cPanel
- Log into cPanel
- Go to "Subdomains"
- Create: `staging.stackmap.app`
- Document root: `/home/stachblx/staging.stackmap.app`

### 2. Directory Structure
```
/home/stachblx/
├── public_html/              # Production (stackmap.app)
├── staging.stackmap.app/     # Staging subdomain
├── releases/
│   ├── production/
│   └── staging/
└── shared/
    ├── production/
    └── staging/
```

### 3. Update GitHub Actions Workflow
```yaml
deploy-staging:
  runs-on: ubuntu-latest
  needs: build
  
  steps:
  - name: Deploy to Staging
    uses: SamKirkland/FTP-Deploy-Action@v4.3.5
    with:
      server: ${{ secrets.FTP_SERVER }}
      username: ${{ secrets.FTP_USERNAME }}
      password: ${{ secrets.FTP_PASSWORD }}
      local-dir: ./
      server-dir: staging.stackmap.app/
      
  - name: Test Staging Deployment
    run: |
      # Wait for deployment
      sleep 30
      
      # Test staging site
      response=$(curl -s -o /dev/null -w "%{http_code}" https://staging.stackmap.app)
      if [ $response -ne 200 ]; then
        echo "Staging deployment failed: HTTP $response"
        exit 1
      fi

deploy-production:
  runs-on: ubuntu-latest
  needs: deploy-staging
  environment: production  # Requires manual approval
  
  steps:
  - name: Deploy to Production
    # Only after staging is verified
```

### 4. Staging Configuration
Create `staging.stackmap.app/.htaccess`:
```apache
# Password protect staging
AuthType Basic
AuthName "Staging Environment"
AuthUserFile /home/stachblx/.htpasswds/staging.stackmap.app
Require valid-user

# Same rules as production
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
</IfModule>
```

### 5. Environment Detection
Add to JavaScript:
```javascript
const IS_STAGING = window.location.hostname === 'staging.stackmap.app';
if (IS_STAGING) {
  document.title = '[STAGING] ' + document.title;
  console.log('Running in STAGING environment');
}
```

## Benefits
- Test all changes before production
- Catch errors early
- Preview for stakeholders
- Confidence in deployments
- Identical environment to production

## Testing Plan
1. Deploy current production to staging
2. Verify staging matches production
3. Test deployment pipeline
4. Add password protection
5. Document access credentials

## Success Criteria
- [ ] staging.stackmap.app is accessible
- [ ] Deployment to staging works
- [ ] Manual approval required for production
- [ ] Staging is password protected
- [ ] Environment indicator visible

## References
- Research: [CICD_research.md lines 214-233]
- Material Icons production incident
- JavaScript syntax error incident