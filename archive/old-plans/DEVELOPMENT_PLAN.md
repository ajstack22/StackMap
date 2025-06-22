# CI/CD Development Plan - 3 Developer Team

## Team Assignment & Launch Prompts

### Developer A: Infrastructure & Deployment Lead
**Focus:** FTP deployment migration and atomic deployment structure
**Issues:** #12, #13

### Developer B: Build Pipeline Specialist  
**Focus:** Fix npm hanging and implement pre-deployment checks
**Issues:** #14, #17

### Developer C: Environment & Recovery Systems
**Focus:** Staging environment and rollback system
**Issues:** #15, #16

---

## Week 1: Critical Fixes (Stop the Bleeding)

### Developer A - Day 1-3
**Issue #12: FTP Deployment Migration**

**Launch Prompt:**
```
I need to replace our failing SSH-based GitHub Actions deployment with FTP-Deploy-Action for StackMap. Current workflow is in .github/workflows/deploy-fast.yml which uses SSH on port 21098 to deploy to NameCheap cPanel hosting. 

Context:
- SSH deployments are timing out and failing authentication
- Need to use SamKirkland/FTP-Deploy-Action@v4.3.5
- Must preserve .well-known directory (SSL certificates)
- Must exclude node_modules, tests, docs, scripts
- Server details will be in GitHub secrets

Please:
1. Update deploy-fast.yml to use FTP instead of SSH
2. Create a test workflow file for dry-run testing
3. Document what GitHub secrets need to be added
4. Ensure critical directories are excluded from deployment
```

### Developer B - Day 1-3
**Issue #14: Fix npm Hanging**

**Launch Prompt:**
```
Our GitHub Actions workflow hangs for 30+ minutes on 'npm ci' when installing dependencies. This is blocking all deployments. The issue is primarily Puppeteer downloading Chromium.

Current setup:
- Using Node 18 with npm
- package.json has puppeteer in devDependencies
- Tests don't actually run in CI (we skip them)

Please fix the npm install step by:
1. Adding memory limit (NODE_OPTIONS)
2. Skipping Puppeteer Chromium download
3. Using --prefer-offline and --no-audit flags
4. Implementing proper npm caching
5. Consider skipping devDependencies entirely if tests don't run

The fix should reduce install time from 30+ minutes to under 3 minutes.
```

### Developer C - Day 1-3
**Research & Planning Only**

**Launch Prompt:**
```
I need a detailed plan for creating a staging environment for StackMap on NameCheap cPanel hosting. We need staging.stackmap.app as a subdomain.

Research and document:
1. Step-by-step cPanel subdomain creation process
2. Directory structure for staging vs production
3. How to password-protect staging
4. Environment detection in JavaScript
5. DNS propagation timeline

Don't implement yet, just create a comprehensive plan with screenshots/examples where helpful.
```

---

## Week 1: Critical Fixes (Day 4-5)

### Developer A - Day 4-5
**Testing FTP Deployment**

**Launch Prompt:**
```
The FTP deployment workflow has been created. Now I need comprehensive testing before we switch from SSH.

Please create:
1. A test script that verifies FTP connection using the same action
2. A checklist of all critical files/directories to verify post-deployment
3. A rollback plan if FTP deployment fails
4. Documentation on how to manually deploy via FTP client as emergency backup

Test on a non-critical directory first, then staging (once Dev C sets it up).
```

### Developer B - Day 4-5
**Optimize Build Process**

**Launch Prompt:**
```
Now that npm install is fixed, optimize the entire build process for our static site.

Current process:
- Install dependencies
- No actual build step (static files)
- Deploy everything except excluded directories

Optimize by:
1. Creating a proper build artifact (only deployable files)
2. Using GitHub Actions artifacts to pass between jobs
3. Separating build from deploy jobs
4. Adding file size checks to prevent deploying bloated builds
5. Implementing build caching where possible
```

### Developer C - Day 4-5
**Issue #15: Create Staging Environment**

**Launch Prompt:**
```
Implement the staging environment plan for staging.stackmap.app on cPanel.

Steps needed:
1. Create subdomain in cPanel (document with screenshots)
2. Set up directory structure: /home/stachblx/staging.stackmap.app/
3. Add .htaccess for password protection
4. Create staging-specific configuration
5. Update GitHub Actions to deploy to staging first
6. Add manual approval gate before production

Provide:
- Setup documentation
- .htaccess template
- GitHub workflow modifications
- Testing checklist
```

---

## Week 2: Foundation Building

### Developer A - Day 1-3
**Issue #13: Atomic Deployment Structure**

**Launch Prompt:**
```
Implement atomic deployment structure using symlinks to achieve zero-downtime deployments.

Current structure: Files deployed directly to /home/stachblx/public_html/
Target structure: 
- /releases/20240620_143022/ (timestamped releases)
- /shared/ (uploads, logs, .well-known)
- /public_html -> symlink to current release

Create:
1. Deployment script that creates timestamped release directories
2. Symlink switching logic (atomic operation)
3. Shared directory linking for persistent data
4. Cleanup script to keep only last 5 releases
5. Integration with FTP deployment workflow

The deployment should have zero downtime and enable instant rollback by switching symlinks.
```

### Developer B - Day 1-3
**Issue #17: Pre-deployment Validation**

**Launch Prompt:**
```
Create comprehensive pre-deployment validation to prevent broken deployments from reaching production.

Validation script should check:
1. All critical files exist (index.html, sw.js, manifest.json, etc.)
2. JavaScript syntax is valid (using node -c)
3. No missing imports or broken paths
4. Service worker version is incremented
5. Disk space is available (>15% free)
6. File permissions are correct
7. .htaccess syntax is valid

Also create post-deployment health checks:
- HTTP status checks for key endpoints
- Console error detection
- Performance baseline checks

Integrate into GitHub Actions workflow to fail deployment if validation fails.
```

### Developer C - Day 1-3
**Staging Deployment Pipeline**

**Launch Prompt:**
```
Complete the staging deployment pipeline with automated testing.

Requirements:
1. Every push to main deploys to staging automatically
2. Run automated tests against staging URL
3. Visual regression testing setup (at least screenshots)
4. Performance testing (page load time)
5. Manual approval gate with checklist
6. Slack/email notification when staging is ready
7. Auto-cleanup of old staging deployments

Create GitHub Actions workflow that enforces staging validation before production.
```

---

## Week 2: Foundation Building (Day 4-5)

### Developer A - Day 4-5
**Atomic Deployment Testing**

**Launch Prompt:**
```
Test and refine the atomic deployment system.

Testing needed:
1. Simulate partial deployment failure - verify rollback works
2. Test symlink switching under load
3. Verify shared directories maintain state
4. Test cleanup of old releases
5. Document manual atomic deployment process
6. Create troubleshooting guide

Fix any issues found and ensure zero-downtime is actually achieved.
```

### Developer B - Day 4-5
**CI/CD Pipeline Integration**

**Launch Prompt:**
```
Integrate all components into a cohesive CI/CD pipeline.

Tasks:
1. Combine build optimization with validation
2. Ensure artifacts flow correctly between jobs
3. Add deployment status badges to README
4. Create deployment dashboard/status page
5. Add metrics collection (deployment time, success rate)
6. Document the complete pipeline flow

The pipeline should be reliable and provide clear feedback at each stage.
```

### Developer C - Day 4-5
**Issue #16: Rollback System (Part 1)**

**Launch Prompt:**
```
Begin implementing the one-click rollback system.

Create rollback.php with:
1. Authentication system (not just password in code)
2. List of available releases with metadata
3. Current release indicator
4. One-click rollback functionality
5. Backup creation before rollback
6. Activity logging
7. Mobile-responsive design

Security requirements:
- HTTPS enforcement
- Session management
- IP whitelisting option
- Rate limiting

Start with core functionality, we'll add UI polish in week 3.
```

---

## Week 3: Safety & Polish

### Developer A - Day 1-2
**Production Hardening**

**Launch Prompt:**
```
Harden the deployment system for production use.

Tasks:
1. Add deployment locks to prevent concurrent deployments
2. Implement deployment queue system
3. Add automatic rollback on health check failure
4. Create deployment runbook for emergencies
5. Add monitoring and alerting
6. Document break-glass procedures

Ensure the system can handle edge cases and failures gracefully.
```

### Developer B - Day 1-2
**Performance & Monitoring**

**Launch Prompt:**
```
Add comprehensive monitoring and performance tracking to the deployment pipeline.

Implement:
1. Deployment metrics dashboard
2. Performance regression detection
3. Bundle size tracking
4. Error rate monitoring pre/post deployment
5. Automated rollback triggers based on metrics
6. Integration with monitoring services

Create alerts for:
- Deployment failures
- Performance degradation
- Error rate spikes
- Disk space issues
```

### Developer C - Day 1-2
**Issue #16: Rollback System (Part 2)**

**Launch Prompt:**
```
Complete and polish the rollback system.

Final features:
1. Beautiful, intuitive UI
2. Deployment comparison view
3. One-click deployment promotion (staging to prod)
4. Rollback scheduling (auto-rollback at specific time)
5. API endpoint for programmatic rollback
6. Integration with monitoring (auto-rollback on errors)
7. Complete security audit

Deploy to a protected URL and create user documentation.
```

---

## Week 3: Final Integration (Day 3-5)

### All Developers - Collaborative Phase

**Launch Prompt for Team Lead (any developer):**
```
Coordinate final integration and testing of the complete CI/CD system.

Tasks to divide among team:
1. End-to-end testing of complete pipeline
2. Load testing the deployment process
3. Disaster recovery testing
4. Documentation review and updates
5. Creating training materials
6. Migration plan from old to new system
7. Rollback procedures for the migration itself

Deliverables:
- Complete runbook
- Training videos/screenshots
- Migration checklist
- Go-live plan
- Post-migration monitoring plan
```

---

## Success Criteria & Metrics

### Week 1 Success:
- [ ] FTP deployments working (< 3 min)
- [ ] npm install fixed (< 3 min)
- [ ] Staging environment accessible

### Week 2 Success:
- [ ] Zero-downtime deployments proven
- [ ] Validation catching issues before production
- [ ] Rollback system functional

### Week 3 Success:
- [ ] < 30 second rollbacks demonstrated
- [ ] 99%+ deployment success rate
- [ ] Complete documentation
- [ ] Team trained on new system

---

## Emergency Procedures During Development

If production breaks during migration:
1. Use manual FTP client to restore
2. Keep backup of working deployment ready
3. Document all issues for post-mortem
4. Have rollback commands ready
5. Communicate status immediately

---

## Post-Implementation

1. Week 4: Monitor and refine
2. Week 5: Performance optimization
3. Week 6: Advanced features (blue-green, canary)
4. Ongoing: Regular disaster recovery drills