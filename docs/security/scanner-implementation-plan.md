# Security Scanner Implementation Plan

**Date:** 2025-10-02
**Workflow:** Atlas Standard
**Phase:** Planning

---

## Implementation Overview

### Goals
1. Add 3 independent security scanners (CodeQL, Snyk, npm audit enhancement)
2. Create automated CI/CD security pipeline
3. Document results in centralized dashboard
4. Establish quality gate criteria

### Timeline
- **Total Estimated Time:** 110-160 minutes (2-3 hours)
- **Target Completion:** Same day

---

## Task Breakdown

### Task 1: GitHub Workflows Infrastructure
**Time:** 10 minutes

**Actions:**
1. Create `.github/workflows/` directory structure
2. Verify directory permissions
3. Prepare for workflow files

**Deliverable:** Empty workflows directory ready for YAML files

---

### Task 2: CodeQL Security Scanning
**Time:** 20-30 minutes

**Actions:**
1. Create `.github/workflows/codeql.yml`
2. Configure for JavaScript/TypeScript analysis
3. Set triggers:
   - Push to main, deploy-qual, deploy-prod
   - Pull requests to main
   - Weekly schedule (Monday 6am UTC)
4. Use `security-extended` and `security-and-quality` query suites

**Dependencies:**
- None (GitHub native, no authentication needed)

**Testing:**
- Will trigger on first push after creation
- Manual trigger via GitHub Actions UI

**Deliverable:** Working CodeQL workflow file

---

### Task 3: Snyk Dependency Scanning
**Time:** 30-40 minutes

**Actions:**
1. Create `.github/workflows/security.yml` for Snyk + npm audit
2. Add npm scripts to package.json:
   - `security:snyk`
   - `security:all`
3. Create `.snyk` policy file (if needed based on scan results)
4. Document Snyk setup requirements

**Dependencies:**
- SNYK_TOKEN GitHub secret (user must configure)
- Snyk free tier account

**Testing:**
- Local test: `npx snyk test --severity-threshold=high`
- GitHub Actions test after secret configuration

**Note:** Workflow will use `continue-on-error: true` to prevent blocking

**Deliverable:**
- Working Snyk workflow (pending token)
- npm scripts for local scanning
- Documentation for token setup

---

### Task 4: npm audit Enhancement
**Time:** 15-20 minutes

**Actions:**
1. Update package.json scripts:
   - Change `security:audit` threshold from `moderate` to `high`
2. Add npm audit to `scripts/qual_deploy.sh`:
   - Check high/critical vulnerabilities
   - Non-blocking (warning only)
   - Production dependencies only
3. Add to security.yml workflow

**Dependencies:**
- None (built into npm)

**Testing:**
- Run locally: `npm audit --audit-level=high`
- Test deployment script

**Deliverable:**
- Enhanced npm audit integration
- Deployment pipeline check

---

### Task 5: Security Dashboard
**Time:** 20-30 minutes

**Actions:**
1. Create `docs/security/SECURITY_DASHBOARD.md`
2. Define quality gate criteria:
   - **Blockers:** Critical/high vulnerabilities, critical bugs
   - **Warnings:** Medium vulnerabilities, code smell count
   - **Non-blocking:** Low issues, minor smells
3. Add scan instructions
4. Create results table structure
5. Add interpretation guidelines

**Dependencies:**
- Initial scan results to populate

**Deliverable:** Complete security dashboard template

---

### Task 6: Initial Scans & Documentation
**Time:** 20-30 minutes

**Actions:**
1. Run npm audit locally and document results
2. Run Snyk test locally (if authenticated)
3. Trigger CodeQL via git push
4. Update SECURITY_DASHBOARD.md with real data
5. Document any findings or issues

**Testing:**
- All three scanners must complete successfully
- Results must be documented

**Deliverable:**
- Populated dashboard with initial results
- Security scan result files

---

## Implementation Order

### Sequence
1. **GitHub Infrastructure** (Task 1) - Required for all workflows
2. **CodeQL** (Task 2) - No dependencies, can run immediately
3. **npm audit** (Task 4) - Simple, no auth needed
4. **Snyk** (Task 3) - May need user intervention for token
5. **Dashboard** (Task 5) - Needs results from scans
6. **Review** (Task 6) - Final validation

### Parallel Opportunities
- Tasks 2, 3, 4 can be implemented in parallel after Task 1
- Task 5 can be started while scans are running
- Task 6 requires completion of all previous tasks

---

## Quality Gate Criteria

### Must Have Before Deploy
- [ ] CodeQL workflow file created and valid YAML
- [ ] npm audit integrated into deployment script
- [ ] Snyk workflow created (even if token pending)
- [ ] SECURITY_DASHBOARD.md created
- [ ] At least one successful npm audit run documented

### Nice to Have
- [ ] CodeQL first scan completed
- [ ] Snyk authenticated and scanned
- [ ] All scanners showing green status

### Can Complete Post-Deploy
- [ ] Snyk token configuration (requires GitHub secrets access)
- [ ] First CodeQL automated scan (triggers on push)
- [ ] Weekly scheduled scan testing

---

## Risk Assessment

### Low Risk Items ✅
- CodeQL setup (GitHub native, well-documented)
- npm audit (already partially implemented)
- Documentation creation

### Medium Risk Items ⚠️
- Snyk authentication (requires external account)
- GitHub Actions first-time setup (may have permission issues)
- Workflow YAML syntax errors

### Mitigation Strategies
- Use `continue-on-error: true` for Snyk to prevent blocking
- Validate YAML syntax before committing
- Document Snyk setup requirements for user
- Test npm audit locally before deploying

---

## Rollback Plan

### If Issues Arise
1. **CodeQL fails:** Remove workflow file, no impact on code
2. **Snyk fails:** Already non-blocking, document token requirement
3. **npm audit breaks deploy:** Make check conditional on flag
4. **GitHub Actions errors:** Disable workflows via GitHub UI

### Quick Rollback
```bash
# Remove workflows
rm -rf .github/workflows/

# Revert package.json changes
git checkout HEAD -- package.json

# Revert deployment script
git checkout HEAD -- scripts/qual_deploy.sh
```

---

## Success Criteria

### Phase 1 Complete When:
- [x] All workflow files created and committed
- [x] npm audit integrated into deployment
- [x] Security dashboard created and populated
- [x] At least one successful scan from each tool (or documented why pending)
- [x] Quality gate criteria defined
- [x] Documentation complete

### Deliverables Checklist:
- [ ] `.github/workflows/codeql.yml`
- [ ] `.github/workflows/security.yml`
- [ ] `docs/security/SECURITY_DASHBOARD.md`
- [ ] `docs/security/scanner-research-findings.md` ✅
- [ ] `docs/security/scanner-implementation-plan.md` ✅
- [ ] Updated `package.json` with security scripts
- [ ] Updated `scripts/qual_deploy.sh` with npm audit
- [ ] Updated `PENDING_CHANGES.md`

---

## Post-Implementation Tasks

### User Actions Required
1. **Snyk Setup:**
   - Create account at snyk.io
   - Generate API token
   - Add SNYK_TOKEN to GitHub repository secrets

2. **First Scan Review:**
   - Check CodeQL results in GitHub Security tab
   - Review any findings from npm audit
   - Review any findings from Snyk

3. **Ongoing Monitoring:**
   - Review security dashboard weekly
   - Act on critical/high findings immediately
   - Update dashboard after each scan

---

## Related Files

### Will Create
- `.github/workflows/codeql.yml`
- `.github/workflows/security.yml`
- `docs/security/SECURITY_DASHBOARD.md`
- `docs/security/scanner-research-findings.md` ✅
- `docs/security/scanner-implementation-plan.md` ✅

### Will Modify
- `package.json` (add security scripts)
- `scripts/qual_deploy.sh` (add npm audit check)
- `PENDING_CHANGES.md` (deployment notes)

### Will Reference
- `docs/security/SONARCLOUD_STATUS.md` (existing scanner)
- `docs/deployment/README.md` (deployment context)

---

**Planning Complete:** Ready for Implementation Phase
