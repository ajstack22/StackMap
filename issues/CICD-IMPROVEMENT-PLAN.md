# CI/CD Improvement Plan - Issue Templates

## Meta Issue: Complete CI/CD Overhaul for NameCheap Stellar Hosting

### Issue Title: [META] Implement Production-Ready CI/CD Pipeline with FTP Deployments and Rollback System

**Labels:** `enhancement`, `critical`, `deployment`, `infrastructure`

**Description:**
Our current CI/CD pipeline has critical flaws causing production outages. This meta-issue tracks the complete overhaul based on comprehensive research findings.

**Current Problems:**
- [ ] npm ci hangs for 30+ minutes in GitHub Actions
- [ ] rsync --delete caused complete production outage
- [ ] No staging environment
- [ ] No rollback mechanism
- [ ] SSH-based deployments unreliable on NameCheap

**Tracked Issues:**
- [ ] #1 Switch from SSH to FTP-based deployments
- [ ] #2 Implement atomic deployment structure
- [ ] #3 Fix npm hanging issues in GitHub Actions
- [ ] #4 Create staging environment with subdomain
- [ ] #5 Build one-click rollback system
- [ ] #6 Add pre-deployment validation checks

---

## Issue #1: Switch from SSH to FTP-based deployments

**Title:** Replace SSH deployments with FTP-Deploy-Action for reliability

**Labels:** `bug`, `deployment`, `high-priority`

**Description:**
Research shows FTP deployments are significantly more reliable than SSH on NameCheap Stellar hosting due to SSH implementation issues on port 21098.

**Acceptance Criteria:**
- [ ] Remove SSH-based deployment from deploy-fast.yml
- [ ] Implement FTP-Deploy-Action v4.3.5
- [ ] Store FTP credentials in GitHub secrets
- [ ] Test deployment to staging first
- [ ] Document FTP setup process

**Implementation:**
```yaml
- name: Deploy via FTP
  uses: SamKirkland/FTP-Deploy-Action@v4.3.5
  with:
    server: ${{ secrets.FTP_SERVER }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    local-dir: ./dist/
    server-dir: public_html/
```

**References:**
- [CICD_research.md lines 105-212]
- Current SSH failures in GitHub Actions

---

## Issue #2: Implement atomic deployment structure

**Title:** Create atomic deployment system with symlinks to prevent downtime

**Labels:** `enhancement`, `deployment`, `architecture`

**Description:**
Implement releases directory structure with symlink switching to enable instant rollbacks and zero-downtime deployments.

**Acceptance Criteria:**
- [ ] Create /releases directory structure
- [ ] Implement deployment script with symlinks
- [ ] Add automatic cleanup (keep last 5 releases)
- [ ] Exclude critical directories (.well-known, cgi-bin)
- [ ] Test atomic switching

**Directory Structure:**
```
/home/stachblx/
├── public_html/ -> releases/current (symlink)
├── releases/
│   ├── 20240619_143022/
│   ├── 20240619_102030/
│   └── current -> 20240619_143022 (symlink)
└── shared/
    ├── uploads/
    └── .well-known/
```

**References:**
- [CICD_research.md lines 68-102]
- rsync disaster from 2025-06-19

---

## Issue #3: Fix npm hanging issues in GitHub Actions

**Title:** Optimize npm install to prevent 30+ minute hangs

**Labels:** `bug`, `performance`, `github-actions`

**Description:**
npm ci hangs indefinitely when installing Puppeteer due to Chromium download and memory issues.

**Acceptance Criteria:**
- [ ] Add NODE_OPTIONS for memory limit
- [ ] Skip Puppeteer Chromium download
- [ ] Add --prefer-offline flag
- [ ] Implement proper caching
- [ ] Reduce build time to <3 minutes

**Implementation:**
```yaml
- name: Install dependencies
  run: |
    export NODE_OPTIONS="--max-old-space-size=8192"
    npm ci --prefer-offline --no-audit --progress=false
  env:
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true
```

**References:**
- [CICD_research.md lines 9-63]
- Multiple failed deployments due to npm hanging

---

## Issue #4: Create staging environment with subdomain

**Title:** Set up staging.stackmap.app for pre-production testing

**Labels:** `enhancement`, `infrastructure`, `testing`

**Description:**
Create proper staging environment to test deployments before production.

**Acceptance Criteria:**
- [ ] Create staging subdomain in cPanel
- [ ] Set up staging directory structure
- [ ] Configure deployment pipeline for staging
- [ ] Add staging environment in GitHub
- [ ] Document staging access

**Tasks:**
1. Create subdomain in cPanel
2. Set up directory: `/home/stachblx/staging.stackmap.app/`
3. Add staging job to GitHub Actions
4. Require manual approval for production

**References:**
- [CICD_research.md lines 214-233]
- Current lack of staging causing direct production issues

---

## Issue #5: Build one-click rollback system

**Title:** Implement web-based rollback interface for instant recovery

**Labels:** `enhancement`, `deployment`, `recovery`

**Description:**
Create rollback.php interface to instantly revert to previous deployments without SSH access.

**Acceptance Criteria:**
- [ ] Create rollback.php with authentication
- [ ] List available releases with timestamps
- [ ] One-click rollback functionality
- [ ] Automatic backup before rollback
- [ ] Clear opcache after rollback

**Security Requirements:**
- Password protection
- IP whitelist (optional)
- Activity logging
- HTTPS only

**References:**
- [CICD_research.md lines 235-352]
- Production outage requiring 30+ minute manual recovery

---

## Issue #6: Add pre-deployment validation checks

**Title:** Implement comprehensive pre-deployment health checks

**Labels:** `enhancement`, `testing`, `reliability`

**Description:**
Add validation to prevent broken deployments from reaching production.

**Acceptance Criteria:**
- [ ] Check disk space (fail if >85%)
- [ ] Verify critical files exist
- [ ] Test staging site responds with 200
- [ ] Validate .htaccess syntax
- [ ] Check service worker loads

**Implementation:**
```bash
# Check critical files
for file in index.html sw.js config/index.js; do
  if [ ! -f "$file" ]; then
    echo "ERROR: Missing critical file: $file"
    exit 1
  fi
done

# Test staging
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://staging.stackmap.app)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "ERROR: Staging returned $HTTP_CODE"
  exit 1
fi
```

**References:**
- [CICD_research.md lines 373-404]
- Complete production failure due to missing files

---

## Implementation Priority

1. **Week 1:** Issues #1 & #3 (Fix immediate problems)
2. **Week 2:** Issues #2 & #4 (Implement proper structure)
3. **Week 3:** Issues #5 & #6 (Add safety mechanisms)

## Success Metrics

- Deployment time: <3 minutes (currently 30+ minutes)
- Rollback time: <30 seconds (currently 30+ minutes)
- Failed deployments: 0% (currently ~40%)
- Downtime during deployment: 0 seconds (currently varies)

## Additional Notes

All changes should be tested in this order:
1. Local development
2. GitHub Actions (build only)
3. Staging deployment
4. Production deployment (with approval)

Emergency contacts and rollback procedures should be documented in a RUNBOOK.md file.