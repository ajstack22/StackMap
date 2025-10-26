# Quality Gates Documentation

## Overview

StackMap's deployment system includes comprehensive quality gates that run before deployment to ensure code quality, security, and compliance. The gates are tier-specific, with increasingly strict requirements as code moves from qual → stage → beta → prod.

## Quality Gates

### 1. **NPM Security Audit** 🔒

Scans for known security vulnerabilities in dependencies.

**Checks:**
- Critical vulnerabilities
- High-severity vulnerabilities
- Moderate vulnerabilities
- Low vulnerabilities

**Output Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 NPM Security Audit Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Vulnerabilities: 5

Breakdown by Severity:
  Critical: 1
  High: 2
  Moderate: 2
  Low: 0

Critical/High Vulnerabilities:
  • axios: critical - Arbitrary Code Execution
  • lodash: high - Prototype Pollution

Full report saved: /tmp/stackmap-audit-1234567.json
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Tier Behavior:**
- **QUAL:** Warnings only (non-blocking)
- **STAGE:** Blocks on critical/high (blocking)
- **BETA:** Blocks on critical/high (blocking)
- **PROD:** Blocks on critical/high (blocking)

**Fix Command:** `npm audit fix --force`

---

### 2. **ESLint Code Quality** 📝

Checks code quality and style consistency.

**Checks:**
- Syntax errors
- Code style violations
- Potential bugs
- Best practice violations

**Output Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 ESLint Code Quality Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Issues: 15

  Errors: 5
  Warnings: 10

Sample Issues (first 15 lines):
  src/App.js:45:10 - error - 'useState' is not defined
  src/utils/helper.js:12:3 - warning - Unexpected console statement

Full report saved: /tmp/stackmap-eslint-1234567.txt
Fix with: npm run lint -- --fix
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Tier Behavior:**
- **QUAL:** Warnings only (non-blocking)
- **STAGE:** Warnings only (non-blocking)
- **BETA:** Blocks on errors (blocking)
- **PROD:** Blocks on errors (blocking)

**Fix Command:** `npm run lint -- --fix`

---

### 3. **TypeScript Type Check** 🔷

Validates TypeScript types for type safety.

**Checks:**
- Type errors
- Missing type definitions
- Type mismatches
- Incompatible assignments

**Output Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔷 TypeScript Type Check Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type Errors: 10

Sample Errors (first 20 lines):
src/components/DataModal.js(34,39): error TS2339: Property 'share' does not exist on type '{}'.
src/components/DataModal.js(67,41): error TS2339: Property 'userId' does not exist on type '{}'.

Full report saved: /tmp/stackmap-typecheck-1234567.txt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Tier Behavior:**
- **QUAL:** Warnings only (non-blocking)
- **STAGE:** Warnings only (non-blocking)
- **BETA:** Warnings only (non-blocking)
- **PROD:** Blocks on errors (blocking)

**Fix:** Address type errors in the code

---

### 4. **Open Source License Check** 📜

Validates that dependencies use approved open source licenses.

**Checks:**
- License types for all dependencies
- Restricted licenses (GPL, AGPL, LGPL, SSPL)
- License compatibility

**Output Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📜 Open Source License Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
├─ MIT: 496
├─ ISC: 41
├─ BSD-3-Clause: 30
├─ Apache-2.0: 15
├─ BSD-2-Clause: 11
└─ Others: 8

✅ No restricted licenses found (GPL, AGPL, LGPL, SSPL)
Full report saved: /tmp/stackmap-licenses-1234567.txt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Tier Behavior:**
- **QUAL:** Warnings only (non-blocking)
- **STAGE:** Warnings only (non-blocking)
- **BETA:** Warnings only (non-blocking)
- **PROD:** Blocks on restricted licenses (blocking)

**Fix:** Replace packages with restricted licenses

**Setup:** `npm install -g license-checker`

---

### 5. **SonarQube Code Analysis** 📊

Comprehensive code quality analysis with SonarCloud.

**Checks:**
- Code smells
- Bugs
- Security hotspots
- Technical debt
- Code coverage
- Complexity metrics

**Output Example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SonarQube Code Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analyzing commit: 46740951
Uploading coverage data...
Analysis complete!

View results at:
https://sonarcloud.io/project/overview?id=ajstack22_stackmap

Quality metrics:
  • Code Smells: https://sonarcloud.io/project/issues?id=ajstack22_stackmap&types=CODE_SMELL
  • Bugs: https://sonarcloud.io/project/issues?id=ajstack22_stackmap&types=BUG
  • Security: https://sonarcloud.io/project/security_hotspots?id=ajstack22_stackmap
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Tier Behavior:**
- **QUAL:** Informational only (non-blocking)
- **STAGE:** Informational only (non-blocking)
- **BETA:** Informational only (non-blocking)
- **PROD:** Informational only (non-blocking)

**Setup:**
1. Install SonarScanner: https://docs.sonarqube.org/latest/analyzing-source-code/scanners/sonarscanner/
2. Set SONAR_TOKEN: `export SONAR_TOKEN='your-token'`
3. Or create `~/.stackmap-env` with `SONAR_TOKEN="your-token"`

---

## Tier-Specific Behavior Summary

| Quality Gate | QUAL | STAGE | BETA | PROD |
|--------------|------|-------|------|------|
| **NPM Audit (Critical/High)** | ⚠️ Warning | ❌ Blocking | ❌ Blocking | ❌ Blocking |
| **ESLint Errors** | ⚠️ Warning | ⚠️ Warning | ❌ Blocking | ❌ Blocking |
| **TypeScript Errors** | ⚠️ Warning | ⚠️ Warning | ⚠️ Warning | ❌ Blocking |
| **Restricted Licenses** | ⚠️ Warning | ⚠️ Warning | ⚠️ Warning | ❌ Blocking |
| **SonarQube** | ℹ️ Info | ℹ️ Info | ℹ️ Info | ℹ️ Info |

**Legend:**
- ❌ **Blocking** - Deployment fails if check fails
- ⚠️ **Warning** - Shows warning but allows deployment
- ℹ️ **Info** - Informational only, never blocks

---

## Disabling Quality Gates

Quality gates run by default. To disable for a specific deployment:

```bash
# Edit scripts/deploy/lib/validation.sh
# Change run_full_validation call to:
run_full_validation "$tier" false  # false = disable quality gates
```

**Note:** Not recommended for beta/prod deployments!

---

## Standalone Quality Check

Run all quality gates without deploying:

```bash
bash -c '
source scripts/deploy/lib/common.sh
source scripts/deploy/lib/quality-gates.sh
run_all_quality_gates qual  # or stage, beta, prod
'
```

Run individual gates:

```bash
# NPM Audit
bash -c 'source scripts/deploy/lib/common.sh && source scripts/deploy/lib/quality-gates.sh && run_npm_audit qual false'

# ESLint
bash -c 'source scripts/deploy/lib/common.sh && source scripts/deploy/lib/quality-gates.sh && run_eslint qual false'

# TypeScript
bash -c 'source scripts/deploy/lib/common.sh && source scripts/deploy/lib/quality-gates.sh && run_typescript_check qual false'

# Licenses
bash -c 'source scripts/deploy/lib/common.sh && source scripts/deploy/lib/quality-gates.sh && run_license_check qual false'

# SonarQube
bash -c 'source scripts/deploy/lib/common.sh && source scripts/deploy/lib/quality-gates.sh && run_sonarqube_analysis qual false'
```

---

## NPM Scripts for Quality Checks

Available npm scripts:

```bash
# Security
npm run security:audit           # NPM audit (high+ only)
npm run security:snyk            # Snyk security scan
npm run security:all             # Both audits

# Linting
npm run lint                     # Run ESLint
npm run lint -- --fix            # Auto-fix issues

# Type Checking
npm run typecheck                # Run TypeScript check
npm run typecheck:watch          # Watch mode

# All checks
npm run check:all                # Lint + TypeScript + method checks

# Licenses
npm run license:check            # Summary
npm run license:report           # Full CSV report
npm run license:verify           # Check for restricted

# Code Quality
npm run sonar                    # SonarQube analysis
npm run quality                  # Alias for sonar
```

---

## Continuous Integration

Quality gates are automatically run during deployment:

1. **Pre-deployment validation** runs all quality gates
2. **Tier-specific blocking** determines if deployment proceeds
3. **Reports** are saved to `/tmp/stackmap-*` for review
4. **Status dashboard** shows quality gate results

---

## Troubleshooting

### "jq: command not found"
Install jq for JSON parsing:
```bash
brew install jq  # macOS
apt-get install jq  # Linux
```

### "license-checker: command not found"
Install globally:
```bash
npm install -g license-checker
```

### "sonar-scanner: command not found"
Install from: https://docs.sonarqube.org/latest/analyzing-source-code/scanners/sonarscanner/

### "SONAR_TOKEN not set"
Create `~/.stackmap-env`:
```bash
echo 'SONAR_TOKEN="your-token-here"' > ~/.stackmap-env
```

---

## Best Practices

1. **Run quality checks locally** before pushing
2. **Fix critical/high security issues** immediately
3. **Address linting errors** before beta
4. **Review license compliance** for new dependencies
5. **Monitor SonarQube metrics** for code quality trends
6. **Keep dependencies updated** to avoid security issues

---

## Related Documentation

- [Deployment Guide](./README.md)
- [Testing Guide](../testing/simple-testing-guide.md)
- [Four-Tier Strategy](./FOUR_TIER_ARCHITECTURE.md)
- [Security Best Practices](../security/README.md)
