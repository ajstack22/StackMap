# Atlas Prompt: Multi-Scanner Security Setup - Phase 1

## Task Overview
Set up multiple independent code quality and security scanners to build confidence in the StackMap codebase. This follows the Atlas **Standard Workflow** for infrastructure improvements.

---

## Atlas Workflow Directive

**Use Atlas Standard workflow for this task.**

This is a **30-60 minute** infrastructure task that requires:
- Research existing scanner configurations
- Plan scanner integration
- Implement scanner setup
- Review results and document findings
- Update deployment pipeline

---

## Objective

Add 3 independent security/quality scanners to complement SonarCloud:
1. **CodeQL** (GitHub Security Scanner)
2. **Snyk** (Dependency Security)
3. **npm audit** (Built-in vulnerability scanner)

**Goal:** Provide multiple independent validations of code quality to build confidence for release.

---

## Context

**Current State:**
- ✅ SonarCloud: A ratings (Reliability, Security, Maintainability)
- ✅ 0 bugs, 0 vulnerabilities
- ✅ All CRITICAL/MAJOR issues fixed
- ⚠️ Single data point for quality validation

**Desired State:**
- 4 independent scanners running automatically
- Documented quality reports from each
- Clear pass/fail criteria
- Integrated into CI/CD pipeline

---

## Phase 1 Tasks (Atlas Standard Workflow)

### 1. Research Phase (15-20 min)

**Investigate:**
- Check if CodeQL is already configured in `.github/workflows/`
- Check if Snyk is already set up
- Review existing npm audit usage
- Check for any existing security scan results
- Identify current package.json scripts for security

**Commands to run:**
```bash
# Check existing GitHub workflows
ls -la .github/workflows/

# Check for Snyk config
ls -la .snyk* snyk.* 2>/dev/null

# Run npm audit to see current state
npm audit

# Check package.json for existing scripts
grep -E "audit|snyk|security" package.json
```

**Document findings in:** `docs/security/scanner-research-findings.md`

---

### 2. Plan Phase (10-15 min)

**Create implementation plan:**

1. **CodeQL Setup**
   - Create `.github/workflows/codeql.yml`
   - Configure for JavaScript/TypeScript
   - Set scan frequency (push to main, PRs, weekly)
   - Define security query suites

2. **Snyk Setup**
   - Install Snyk CLI: `npm install -g snyk` (if needed)
   - Authenticate: `snyk auth` (if not already)
   - Run initial scan: `npx snyk test`
   - Create `.snyk` policy file if needed
   - Add to package.json scripts

3. **npm audit**
   - Configure audit levels (critical, high, moderate)
   - Add to deployment script checks
   - Document acceptable thresholds

4. **Documentation**
   - Create security dashboard document
   - Define pass/fail criteria for each scanner
   - Document how to interpret results

**Output:** Create `docs/security/scanner-implementation-plan.md`

---

### 3. Implementation Phase (60-90 min)

#### Task 3.1: CodeQL Setup

**Create:** `.github/workflows/codeql.yml`

```yaml
name: "CodeQL Security Analysis"

on:
  push:
    branches: [ main, deploy-qual, deploy-prod ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 6 * * 1'  # Weekly on Monday at 6am UTC

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [ 'javascript' ]

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: ${{ matrix.language }}
        queries: security-extended,security-and-quality

    - name: Autobuild
      uses: github/codeql-action/autobuild@v3

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
      with:
        category: "/language:${{matrix.language}}"
```

**Commit message:**
```
Add CodeQL security scanning workflow

- Scans JavaScript/TypeScript for security vulnerabilities
- Runs on push to main branches and PRs
- Weekly scheduled scans
- Uses security-extended query suite

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Task 3.2: Snyk Setup

**Steps:**
1. Run initial scan:
   ```bash
   npx snyk test --severity-threshold=high
   ```

2. Create `.snyk` policy file (if issues found):
   ```yaml
   # Snyk (https://snyk.io) policy file
   version: v1.25.0

   # Ignore specific vulnerabilities (with justification)
   ignore: {}

   # Patch vulnerabilities
   patch: {}
   ```

3. Add to `package.json`:
   ```json
   "scripts": {
     "security:snyk": "snyk test --severity-threshold=high",
     "security:audit": "npm audit --audit-level=high",
     "security:all": "npm run security:audit && npm run security:snyk"
   }
   ```

4. Add to `.github/workflows/security.yml`:
   ```yaml
   name: "Security Scanning"

   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]
     schedule:
       - cron: '0 0 * * 0'  # Weekly on Sunday

   jobs:
     security:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '18'

         - name: Install dependencies
           run: npm ci

         - name: Run npm audit
           run: npm audit --audit-level=high
           continue-on-error: true

         - name: Run Snyk security scan
           uses: snyk/actions/node@master
           env:
             SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
           with:
             args: --severity-threshold=high
           continue-on-error: true
   ```

**Commit message:**
```
Add Snyk dependency security scanning

- Scans for vulnerable dependencies
- Checks high/critical severity issues
- Weekly scheduled scans
- Added npm scripts for local testing

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Task 3.3: npm audit Integration

**Update:** `scripts/qual_deploy.sh`

Add after the existing security checks:

```bash
echo "- Running npm audit security check..."
if ! npm audit --audit-level=high --production; then
    echo "⚠️  Found high/critical vulnerabilities in dependencies"
    echo "   Review with: npm audit"
    echo "   Fix with: npm audit fix"
    echo "   Continuing deployment (vulnerabilities are non-blocking but should be reviewed)..."
fi
```

**Commit message:**
```
Integrate npm audit into deployment pipeline

- Checks for high/critical vulnerabilities before deployment
- Non-blocking but warns developers
- Production dependencies only

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

#### Task 3.4: Create Security Dashboard

**Create:** `docs/security/SECURITY_DASHBOARD.md`

```markdown
# StackMap Security Dashboard

## Scanner Status

### 🔍 Active Scanners (4)

| Scanner | Status | Last Run | Findings | Rating |
|---------|--------|----------|----------|--------|
| **SonarCloud** | ✅ Active | [Date] | 0 bugs, 0 vulnerabilities | A |
| **CodeQL** | ✅ Active | [Date] | [Results] | - |
| **Snyk** | ✅ Active | [Date] | [Results] | - |
| **npm audit** | ✅ Active | [Date] | [Results] | - |

---

## Quality Gate Criteria

### Release Blockers ❌
- **Critical/High vulnerabilities:** 0
- **Critical bugs:** 0
- **Security rating:** A or B

### Release Warnings ⚠️
- **Medium vulnerabilities:** < 5
- **Code smells:** < 2000
- **Test coverage:** > 35%

### Non-Blocking 📝
- **Low vulnerabilities:** Any
- **Minor code smells:** Any
- **Info-level findings:** Any

---

## Current Results

### SonarCloud (Updated: [Date])
- **Reliability:** A ✅
- **Security:** A ✅
- **Maintainability:** A ✅
- **Bugs:** 0 ✅
- **Vulnerabilities:** 0 ✅
- **Code Smells:** 1,410 ⚠️
- **Coverage:** 36.5% ✅

### CodeQL (Updated: [Date])
- **Status:** [Pending first run]
- **Critical:** [TBD]
- **High:** [TBD]
- **Medium:** [TBD]

### Snyk (Updated: [Date])
- **Status:** [Pending first run]
- **Critical:** [TBD]
- **High:** [TBD]
- **Dependencies scanned:** [TBD]

### npm audit (Updated: [Date])
- **Status:** [Pending first run]
- **Critical:** [TBD]
- **High:** [TBD]
- **Total vulnerabilities:** [TBD]

---

## How to Run Scans Locally

### All Scans
```bash
npm run security:all
```

### Individual Scans
```bash
# npm audit
npm audit --audit-level=high

# Snyk
npx snyk test --severity-threshold=high

# SonarCloud (requires token)
sonar-scanner -Dsonar.token=$SONAR_TOKEN
```

---

## Interpreting Results

### CodeQL
- **Critical/High:** Must fix before release
- **Medium:** Review and document decision
- **Low:** Fix when convenient

### Snyk
- **Direct dependencies:** High priority to fix
- **Transitive dependencies:** May need workarounds
- **No fix available:** Document and monitor

### npm audit
- **Fix available:** Run `npm audit fix`
- **Breaking change:** Review manually
- **No fix:** Check Snyk for alternatives

---

## Last Updated
[Date] - Initial dashboard creation
```

**Commit message:**
```
Create security scanning dashboard

- Centralized security status tracking
- Quality gate criteria defined
- Instructions for running scans
- Ready for population with results

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### 4. Review Phase (15-20 min)

**Run all scans and document results:**

```bash
# Run CodeQL (via GitHub Actions - check results)
# Visit: https://github.com/[username]/StackMap/security/code-scanning

# Run Snyk
npx snyk test --severity-threshold=high > docs/security/snyk-results.txt

# Run npm audit
npm audit --audit-level=high > docs/security/npm-audit-results.txt

# Update SECURITY_DASHBOARD.md with actual results
```

**Review checklist:**
- [ ] CodeQL workflow runs successfully
- [ ] Snyk scan completes (document any findings)
- [ ] npm audit results documented
- [ ] SECURITY_DASHBOARD.md updated with real data
- [ ] All critical/high issues documented or fixed
- [ ] Pass/fail criteria applied

---

### 5. Deploy Phase (10-15 min)

**Update PENDING_CHANGES.md:**

```markdown
## Security Scanner Suite - Phase 1 Setup

### Changes Made:

**CodeQL Security Scanning:**
- Added GitHub Actions workflow for automated security analysis
- Scans JavaScript/TypeScript for vulnerabilities
- Runs on push to main, PRs, and weekly schedule
- Uses security-extended query suite

**Snyk Dependency Scanning:**
- Integrated Snyk for dependency vulnerability scanning
- Added npm scripts for local testing
- GitHub Actions workflow for automated scans
- High/critical severity threshold

**npm audit Integration:**
- Added to deployment pipeline (qual_deploy.sh)
- Checks for high/critical vulnerabilities
- Non-blocking warnings for developer awareness

**Documentation:**
- Created SECURITY_DASHBOARD.md for centralized tracking
- Defined quality gate criteria
- Added scan instructions for local development

**Expected Impact:**
- 4 independent security validations
- Automated ongoing monitoring
- Increased confidence in code quality
- Industry-standard security practices

### Deployment Date: [To be set by qual_deploy.sh]
```

**Commit and deploy:**
```bash
# All changes should already be committed individually
# Update version and deploy to qual
./scripts/qual_deploy.sh --web
```

---

## Success Criteria

**Phase 1 Complete When:**
- [x] CodeQL workflow created and running
- [x] Snyk scan configured and executed
- [x] npm audit integrated into deployment
- [x] SECURITY_DASHBOARD.md created with results
- [x] All scans run successfully (or issues documented)
- [x] Deployed to qual environment
- [x] Documentation updated

---

## Expected Time Breakdown

| Phase | Estimated Time | Actual Time |
|-------|---------------|-------------|
| Research | 15-20 min | |
| Planning | 10-15 min | |
| Implementation | 60-90 min | |
| Review | 15-20 min | |
| Deploy | 10-15 min | |
| **TOTAL** | **110-160 min (2-3 hours)** | |

---

## Atlas Workflow Notes

**Tier:** Standard Workflow
**Complexity:** Medium (infrastructure + configuration)
**Risk:** Low (non-blocking additions)
**Reversibility:** High (can remove workflows easily)

**Quality Gates:**
- All workflows must run without errors
- Documentation must be complete and accurate
- At least one successful run of each scanner
- Results must be reviewed and documented

---

## Related Documentation

- [Atlas Standard Workflow](../../docs/ATLAS_QUICK_REFERENCE.md)
- [Security Policy](./SECURITY.md)
- [Deployment Guide](../deployment/README.md)
- [SonarCloud Setup](./SONARCLOUD_STATUS.md)

---

## Future Work (Phase 2)

After Phase 1 completion:
- Add DeepSource or Codacy for additional validation
- Create automated security report generation
- Set up security alerts in Slack/email
- Integrate with GitHub Security Advisories
- Add dependency update automation (Dependabot)

---

*Generated: 2025-10-02*
*Atlas Framework: Standard Workflow*
