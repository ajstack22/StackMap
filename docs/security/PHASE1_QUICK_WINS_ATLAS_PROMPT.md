# Atlas Prompt: Phase 1 Security Quick Wins

## Task Overview
Implement 4 high-ROI security enhancements to increase codebase confidence from 85% to 95% with minimal effort.

**Use Atlas Standard workflow for this task.**

---

## Atlas Workflow Directive

**Workflow Tier:** Standard (30-60 minutes)
**Complexity:** Medium (configuration + validation)
**Risk:** Low (non-breaking additions)
**Reversibility:** High (can disable/remove easily)

---

## Objective

Add 4 automated security validation layers:
1. **GitHub Dependabot** - Automatic dependency updates
2. **gitleaks** - Git history secret scanning (one-time)
3. **ESLint Security Plugins** - Enhanced code linting
4. **License Checker** - Compliance validation

**Goal:** Increase confidence to 95% with 50 minutes of effort, $0 cost

---

## Context

**Current State:**
- ✅ CodeQL: 0 critical/high vulnerabilities
- ✅ SonarCloud: A ratings
- ✅ npm audit: 0 vulnerabilities
- ✅ Test coverage: 36.5%
- **Confidence Level:** 85%

**Gaps:**
- ❌ No automated dependency updates
- ❌ Git history never scanned for secrets
- ❌ Basic ESLint without security rules
- ❌ No license compliance checking

**Desired State:**
- ✅ All dependencies auto-updated weekly
- ✅ Git history verified clean of secrets
- ✅ Security-focused linting active
- ✅ License compliance automated
- **Confidence Level:** 95%

---

## Phase 1 Tasks (Atlas Standard Workflow)

### 1. Research Phase (5-10 min)

**Investigate current state:**

```bash
# Check if Dependabot already exists
ls -la .github/dependabot.yml

# Check current ESLint plugins
grep -A 10 "plugins" .eslintrc.js

# Check for gitleaks installation
which gitleaks || brew list gitleaks

# Check for license-checker
which license-checker || npm list -g license-checker
```

**Document findings:**
- Dependabot status
- Current ESLint plugins
- Available tools
- Current license usage

---

### 2. Plan Phase (5-10 min)

**Implementation order:**
1. Dependabot setup (safest, no code changes)
2. gitleaks scan (read-only, no changes)
3. License checker (read-only)
4. ESLint security plugins (requires npm install)

**Risk assessment:**
- Dependabot: Low (can disable anytime)
- gitleaks: None (read-only scan)
- License checker: None (read-only)
- ESLint: Low (only affects linting)

---

### 3. Implementation Phase (30-40 min)

#### Task 3.1: Enable GitHub Dependabot ✅ (5 min)

**Create:** `.github/dependabot.yml`

```yaml
version: 2
updates:
  # Enable npm dependency updates
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 5
    reviewers:
      - "ajstack22"
    labels:
      - "dependencies"
      - "security"
    # Group patch updates together
    groups:
      patch-updates:
        update-types:
          - "patch"
    # Ignore major version bumps for now (too risky)
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
    commit-message:
      prefix: "deps"
      include: "scope"
```

**Test:**
```bash
# Commit and push
git add .github/dependabot.yml
git commit -m "Enable Dependabot for automated dependency updates"
git push

# Verify in GitHub UI
# Settings → Security → Dependabot
```

**Expected Result:**
- Dependabot appears in GitHub Security tab
- Will create PRs for outdated dependencies on Monday
- Patch updates grouped together

---

#### Task 3.2: Scan Git History for Secrets ✅ (10 min)

**Install gitleaks (if not installed):**
```bash
# macOS
brew install gitleaks

# Linux
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
tar -xzf gitleaks_8.18.0_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

**Create gitleaks config (optional):**
`.gitleaks.toml`
```toml
title = "StackMap gitleaks config"

[allowlist]
description = "Allowlist for false positives"
paths = [
    '''node_modules/''',
    '''\.git/''',
]

# Ignore test fixtures
regexes = [
    '''test-token''',
    '''mock-key''',
    '''example\.com''',
]
```

**Run scan:**
```bash
# Full scan of entire history
gitleaks detect --source . --verbose --report-path gitleaks-report.json

# If secrets found, use --redact to hide values
gitleaks detect --source . --verbose --redact --report-path gitleaks-report.json
```

**Review results:**
```bash
# Check report
cat gitleaks-report.json | jq '.'

# Count findings
cat gitleaks-report.json | jq 'length'

# If clean (0 findings)
echo "✅ No secrets found in git history"

# If secrets found
echo "⚠️  Secrets found - review gitleaks-report.json"
```

**Document results in:** `docs/security/gitleaks-scan-results.md`

**If secrets found:**
1. Review each finding
2. Determine if actually sensitive
3. Rotate any real secrets
4. Add false positives to .gitleaks.toml allowlist
5. Consider using git-filter-repo to remove from history (CAUTION)

---

#### Task 3.3: Add ESLint Security Plugins ✅ (20 min)

**Install security plugins:**
```bash
npm install --save-dev \
  eslint-plugin-security \
  eslint-plugin-no-secrets \
  eslint-plugin-react-hooks
```

**Update .eslintrc.js:**

Read current config first, then merge in these additions:

```javascript
module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:security/recommended',
  ],
  plugins: [
    'security',
    'no-secrets',
    'react-hooks',
  ],
  rules: {
    // Security rules
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'warn',

    // Prevent secrets in code
    'no-secrets/no-secrets': ['error', {
      'tolerance': 4.5,  // Adjust sensitivity
      'ignoreContent': ['^REACT_APP_', '^PUBLIC_'],
    }],

    // React hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Additional security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

**Test the new rules:**
```bash
# Run linter
npm run lint

# Check for new errors
npm run lint 2>&1 | grep -E "security/|no-secrets/"

# Fix auto-fixable issues
npm run lint -- --fix

# Document remaining issues
npm run lint > docs/security/eslint-security-report.txt
```

**Review and fix critical issues:**
- `security/detect-unsafe-regex` - MUST fix
- `security/detect-eval-with-expression` - MUST fix
- `no-secrets/no-secrets` - Review each, may be false positive

**Allow some warnings for now:**
- `security/detect-object-injection` - Common pattern, review later
- `security/detect-possible-timing-attacks` - Low risk, review later

---

#### Task 3.4: License Compliance Check ✅ (10 min)

**Install license-checker:**
```bash
npm install -g license-checker
```

**Run compliance check:**
```bash
# Check all dependencies
license-checker --production --summary

# Detailed report
license-checker --production --json > docs/security/licenses.json

# Check for problematic licenses
license-checker --production \
  --failOn 'GPL;AGPL;LGPL;SSPL;OSL;EPL;EUPL;MPL' \
  --summary

# Create human-readable report
license-checker --production \
  --csv \
  --out docs/security/licenses.csv
```

**Add to package.json scripts:**
```json
{
  "scripts": {
    "license:check": "license-checker --production --summary",
    "license:report": "license-checker --production --csv --out docs/security/licenses.csv",
    "license:verify": "license-checker --production --failOn 'GPL;AGPL;LGPL;SSPL'"
  }
}
```

**Review results:**
```bash
# Check summary
npm run license:check

# Look for issues
npm run license:verify

# Review CSV report
open docs/security/licenses.csv  # or cat on Linux
```

**Document findings:**

Create `docs/security/license-compliance-report.md`:
```markdown
# License Compliance Report

**Date:** 2025-10-02
**Total Dependencies:** [COUNT]

## Summary
- MIT: [COUNT] ✅
- Apache-2.0: [COUNT] ✅
- BSD-3-Clause: [COUNT] ✅
- ISC: [COUNT] ✅
- 0BSD: [COUNT] ✅
- Unlicense: [COUNT] ✅

## Problematic Licenses
[None found / List any GPL/AGPL]

## Action Items
[None / List packages to replace]

## Approved for Production: ✅ YES / ❌ NO
```

**If problematic licenses found:**
1. Identify the package
2. Check if it's actually used (tree-shake?)
3. Find MIT-licensed alternative
4. Document exception if unavoidable

---

### 4. Review Phase (10-15 min)

**Checklist:**

**Dependabot:**
- [ ] `.github/dependabot.yml` exists
- [ ] Appears in GitHub Settings → Security
- [ ] Schedule set to weekly
- [ ] Reviewers configured

**gitleaks:**
- [ ] Scan completed successfully
- [ ] Results documented
- [ ] No secrets found OR secrets reviewed
- [ ] False positives documented in .gitleaks.toml

**ESLint Security:**
- [ ] Plugins installed (check package.json)
- [ ] Rules configured in .eslintrc.js
- [ ] Linter runs without critical errors
- [ ] Security issues documented

**License Checker:**
- [ ] Tool installed and working
- [ ] Report generated
- [ ] No GPL/AGPL/copyleft licenses
- [ ] Scripts added to package.json

**Overall:**
- [ ] All changes committed
- [ ] Documentation created
- [ ] No breaking changes
- [ ] Ready to deploy

---

### 5. Deploy Phase (5-10 min)

**Update PENDING_CHANGES.md:**

```markdown
## Security Enhancement - Phase 1 Quick Wins

### Changes Made:

**GitHub Dependabot Enabled:**
- Automated weekly dependency updates
- Security vulnerability auto-patching
- Grouped patch updates to reduce PR noise
- Major version updates disabled (manual review required)

**Git History Secret Scan:**
- Scanned entire git history with gitleaks
- [X] secrets found / No secrets found
- Results documented in docs/security/gitleaks-scan-results.md
- [Any actions taken]

**ESLint Security Plugins:**
- Added eslint-plugin-security for vulnerability detection
- Added eslint-plugin-no-secrets to prevent secret commits
- Added eslint-plugin-react-hooks for React best practices
- [X] new security rules active
- Critical issues fixed, warnings documented

**License Compliance:**
- Scanned all production dependencies
- [X] dependencies analyzed
- All licenses approved (MIT, Apache, BSD)
- No GPL/copyleft licenses found
- Report: docs/security/licenses.csv

### Expected Impact:
- Automated security: Dependabot monitors 100% of dependencies
- Historical validation: Git history verified clean
- Prevention: Security linting catches issues pre-commit
- Compliance: License risks identified and mitigated
- Confidence increase: 85% → 95%

### Deployment Date: [To be set by qual_deploy.sh]
```

**Commit all changes:**
```bash
# Add all new files
git add .github/dependabot.yml
git add .gitleaks.toml  # if created
git add docs/security/gitleaks-scan-results.md
git add docs/security/eslint-security-report.txt
git add docs/security/licenses.csv
git add docs/security/license-compliance-report.md
git add .eslintrc.js
git add package.json
git add package-lock.json
git add PENDING_CHANGES.md

# Commit
git commit -m "Add Phase 1 security quick wins

Dependabot, gitleaks, ESLint security, license compliance

- Enabled Dependabot for weekly automated dependency updates
- Scanned git history for secrets (gitleaks)
- Added ESLint security plugins (security, no-secrets, react-hooks)
- Verified license compliance (all approved)

Confidence level: 85% → 95%
Cost: $0
Time: 50 minutes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Deploy
./scripts/qual_deploy.sh --web
```

---

## Success Criteria

**Phase 1 Complete When:**
- [x] Dependabot enabled and visible in GitHub
- [x] gitleaks scan completed with documented results
- [x] ESLint security plugins installed and configured
- [x] License compliance verified and documented
- [x] All critical ESLint security errors fixed
- [x] Documentation created for all 4 tasks
- [x] Changes deployed to qual

---

## Expected Time Breakdown

| Phase | Task | Estimated | Actual |
|-------|------|-----------|--------|
| Research | Current state | 5-10 min | |
| Planning | Implementation order | 5-10 min | |
| Implement | Dependabot | 5 min | |
| Implement | gitleaks | 10 min | |
| Implement | ESLint security | 20 min | |
| Implement | License checker | 10 min | |
| Review | Validate all tasks | 10-15 min | |
| Deploy | Commit and deploy | 5-10 min | |
| **TOTAL** | **50-70 min** | |

---

## Potential Issues & Solutions

### Issue: gitleaks finds many false positives
**Solution:**
```toml
# Add to .gitleaks.toml
[allowlist]
regexes = [
    '''test-key-\d+''',
    '''mock.*token''',
    '''example-secret''',
]
```

### Issue: ESLint security rules too noisy
**Solution:**
```javascript
// Downgrade to warnings temporarily
'security/detect-object-injection': 'warn',
'security/detect-possible-timing-attacks': 'off',
```

### Issue: License checker fails on unknown license
**Solution:**
```bash
# Check the package manually
npm view <package-name> license

# If safe, add to custom format
license-checker --production --customPath custom-format.json
```

### Issue: Dependabot creates too many PRs
**Solution:**
```yaml
# In dependabot.yml, reduce frequency
schedule:
  interval: "monthly"  # Instead of weekly

# Or group more updates
groups:
  all-patches:
    update-types: ["patch", "minor"]
```

---

## Quality Gates

**Must Pass:**
- ✅ Dependabot configuration valid (GitHub accepts it)
- ✅ gitleaks scan completes (exit code 0 or documented findings)
- ✅ ESLint runs without critical errors
- ✅ No GPL/AGPL licenses in production dependencies

**Should Pass:**
- ⚠️ All ESLint security warnings reviewed
- ⚠️ gitleaks finds 0 secrets (or all explained)
- ⚠️ License report shows 100% approved licenses

**Nice to Have:**
- 📝 Dependabot creates first PR within 1 week
- 📝 ESLint auto-fix cleans up some issues
- 📝 License report exported to CSV

---

## Post-Implementation Monitoring

### Week 1
- [ ] Check Dependabot created PRs
- [ ] Review any security alerts
- [ ] Monitor ESLint warnings in CI

### Monthly
- [ ] Review Dependabot PR history
- [ ] Re-run license checker
- [ ] Check for new ESLint security rules

### Quarterly
- [ ] Re-run gitleaks (new commits)
- [ ] Review and update .gitleaks.toml allowlist
- [ ] Audit Dependabot configuration

---

## Related Documentation

- [Confidence Building Strategy](./CONFIDENCE_BUILDING_STRATEGY.md) - Full strategy
- [Security Dashboard](./SECURITY_DASHBOARD.md) - Current status
- [CodeQL Results](./CODEQL_FIRST_SCAN_RESULTS.md) - Existing scans

---

## Future Enhancements (Phase 2)

After Phase 1 stabilizes:
- TypeScript strict mode
- Increase test coverage to 50%
- Bundle analysis
- Complexity analysis
- Performance monitoring
- API security testing

---

## Atlas Workflow Notes

**Tier:** Standard Workflow ✅
**Complexity:** Medium (4 tools, minimal code changes)
**Risk:** Low (mostly read-only, easy to revert)
**Reversibility:** High (disable Dependabot, remove plugins)

**Quality Gates:**
- All tools must run successfully
- Documentation must be complete
- No breaking changes to build
- At least one scan result documented

**Agent Usage:** General-purpose agent recommended
- Can run commands autonomously
- Can create/edit files
- Can commit changes
- Can generate reports

---

*Generated: 2025-10-02*
*Atlas Framework: Standard Workflow*
*Estimated Time: 50-70 minutes*
*Confidence Gain: +10% (85% → 95%)*
