# Multi-Project Security Scanner Analysis

**Projects:** StackMap, SmilePile, Manylla
**Goal:** Maximize free tier security scanning across all projects
**Date:** 2025-10-02

---

## Executive Summary

**Recommendation:** Use **CodeQL + npm audit** on all projects. Skip Snyk due to free tier limitations.

| Scanner | Multi-Project Support | Recommendation |
|---------|----------------------|----------------|
| **CodeQL** | ✅ Unlimited | Use on ALL 3 projects |
| **npm audit** | ✅ Unlimited | Use on ALL 3 projects |
| **SonarCloud** | ✅ Unlimited | Use on ALL 3 projects |
| **Snyk** | ⚠️ Limited | Skip or use selectively |

---

## Detailed Analysis

### 1. CodeQL - ✅ **RECOMMENDED for ALL**

**Free Tier (Public Repos):**
- **Projects:** Unlimited
- **Scans:** Unlimited
- **Frequency:** Unlimited
- **Features:** Full enterprise features

**Per-Project Setup:**
- Single workflow file: `.github/workflows/codeql.yml`
- 2 minutes setup time per project
- Zero ongoing cost or limits

**Verdict:** 🟢 **USE ON ALL 3 PROJECTS**
- No restrictions whatsoever
- GitHub-native integration
- Best-in-class security scanning
- Copilot Autofix included (free on public repos)

---

### 2. npm audit - ✅ **RECOMMENDED for ALL**

**Free Tier:**
- **Projects:** Unlimited
- **Scans:** Unlimited
- **Cost:** $0 (built into npm)

**Per-Project Setup:**
- Add npm script: `"security:audit": "npm audit --audit-level=high"`
- Integrate into deployment script
- 5 minutes setup time per project

**Verdict:** 🟢 **USE ON ALL 3 PROJECTS**
- Built-in tool, no account needed
- Zero configuration overhead
- Fast and reliable

---

### 3. SonarCloud - ✅ **RECOMMENDED for ALL**

**Free Tier (Public Repos):**
- **Projects:** Unlimited
- **Analysis:** Unlimited
- **Features:** All quality metrics
- **Lines of Code:** Unlimited

**Per-Project Setup:**
- Create SonarCloud project (web UI)
- Add workflow file
- Configure sonar-project.properties
- 15 minutes setup time per project

**Verdict:** 🟢 **USE ON ALL 3 PROJECTS**
- Comprehensive code quality analysis
- Free for public repos forever
- Already set up on StackMap with A ratings

---

### 4. Snyk - ⚠️ **NOT RECOMMENDED for Multiple Projects**

**Free Tier Limitations:**

| Feature | Public Repos | Private Repos |
|---------|--------------|---------------|
| Tests | Unlimited* | 400/month (Open Source) |
| Frequency | Weekly | Weekly |
| Projects | "1-2 codebases"† | "1-2 codebases"† |
| Code Scans | 100/month | 100/month |

*Unlimited tests but weekly frequency
†Practical limitation mentioned in reviews

**Issues with Multiple Projects:**
1. **Designed for 1-2 codebases** (per their own documentation/reviews)
2. **100 code scans/month** shared across all projects
3. **Weekly scan frequency** (not daily/on-push like CodeQL)
4. **Account-level limits** (not per-project)

**Example Scenario:**
- 3 projects × 4 scans/week = 48 scans/month (within 100 limit)
- BUT: "1-2 codebase" limitation suggests issues with 3 projects
- Weekly scans only (vs. CodeQL's on-every-push)

**Verdict:** 🔴 **SKIP - Use CodeQL Instead**
- Free tier not designed for multiple projects
- CodeQL provides better coverage for free
- npm audit handles dependency scanning
- Avoid hitting free tier limits

---

## Recommended Stack for All 3 Projects

### Core Scanners (Use on ALL)
1. **CodeQL** - Security vulnerability scanning
2. **npm audit** - Dependency vulnerabilities
3. **SonarCloud** - Code quality & maintainability

### Setup Time Estimate
- **Per project:** 20-30 minutes
- **Total for 3 projects:** 60-90 minutes
- **Ongoing cost:** $0

### What Each Scanner Provides

**CodeQL:**
- SQL injection detection
- XSS vulnerabilities
- Path traversal issues
- Command injection
- Security misconfigurations

**npm audit:**
- Known vulnerabilities in dependencies
- CVE tracking
- Severity ratings (critical/high/moderate/low)
- Fix suggestions

**SonarCloud:**
- Code smells
- Bug detection
- Security hotspots
- Maintainability ratings
- Test coverage tracking
- Duplicate code detection

---

## Alternative: If You Still Want Snyk

### Option A: Snyk on 1 Primary Project Only
- Use on **StackMap** only (most active)
- CodeQL + npm audit on SmilePile & Manylla
- Stay within 100 scan/month limit

### Option B: Snyk Enterprise for Open Source
If **ANY** project has 10K+ GitHub stars:
- Apply for Snyk Secure Developer Program
- Get **free enterprise license**
- Unlimited everything
- Requires: 10K+ stars, non-corporate backed

---

## Coverage Comparison

| Security Area | CodeQL | npm audit | SonarCloud | Snyk |
|---------------|--------|-----------|------------|------|
| **Code Vulnerabilities** | ✅✅✅ | ❌ | ✅✅ | ✅✅✅ |
| **Dependency Vulns** | ❌ | ✅✅✅ | ❌ | ✅✅✅ |
| **Code Quality** | ❌ | ❌ | ✅✅✅ | ✅ |
| **License Issues** | ❌ | ✅ | ❌ | ✅✅ |
| **Container Scanning** | ❌ | ❌ | ❌ | ✅✅ |

**Coverage with CodeQL + npm audit + SonarCloud:**
- ✅ Code vulnerabilities (CodeQL, SonarCloud)
- ✅ Dependency vulnerabilities (npm audit)
- ✅ Code quality (SonarCloud)
- ✅ License issues (npm audit)
- ❌ Container scanning (not needed for React Native)

**Missing with Snyk excluded:** Container scanning (not needed for your stack)

---

## Implementation Plan

### Phase 1: StackMap (Already Complete ✅)
- [x] CodeQL configured
- [x] npm audit enhanced
- [x] SonarCloud active
- [x] Security dashboard created

### Phase 2: SmilePile
1. Copy `.github/workflows/codeql.yml` from StackMap
2. Add `security:audit` script to package.json
3. Integrate npm audit into deployment
4. Set up SonarCloud project
5. Create security dashboard

**Time:** 30 minutes

### Phase 3: Manylla
1. Copy `.github/workflows/codeql.yml` from StackMap
2. Add `security:audit` script to package.json
3. Integrate npm audit into deployment
4. Set up SonarCloud project
5. Create security dashboard

**Time:** 30 minutes

---

## Cost Analysis (Per Year)

| Scanner | 1 Project | 3 Projects | 10 Projects |
|---------|-----------|------------|-------------|
| **CodeQL** | $0 | $0 | $0 |
| **npm audit** | $0 | $0 | $0 |
| **SonarCloud** | $0 | $0 | $0 |
| **Snyk (if added)** | $0* | $300+† | $1,000+ |

*Free tier works for 1-2 projects
†Would likely need Team plan ($25/user/month × 12 months)

**Annual Savings by Skipping Snyk:** $300-1,000+

---

## Decision Matrix

### Choose CodeQL + npm audit + SonarCloud If:
- ✅ You have 2+ projects
- ✅ You want unlimited scanning
- ✅ You want zero ongoing costs
- ✅ You want on-push scanning (not just weekly)
- ✅ You want comprehensive coverage

### Add Snyk If:
- You have 10K+ GitHub stars (free enterprise)
- You need container scanning
- You have budget for paid tier ($25+/month)
- You only have 1-2 projects

---

## Conclusion

**For StackMap, SmilePile, and Manylla:**

✅ **USE:** CodeQL + npm audit + SonarCloud
❌ **SKIP:** Snyk (free tier too limited for 3 projects)

**Reasoning:**
1. CodeQL provides **better** security scanning than Snyk for free
2. npm audit handles dependency vulnerabilities
3. SonarCloud adds comprehensive quality analysis
4. All three scale to unlimited projects
5. Zero ongoing cost or limits
6. Better developer experience (on-push vs weekly)

**Next Steps:**
1. Keep StackMap configuration as-is
2. Remove Snyk workflow (optional, or keep for future)
3. Replicate CodeQL + npm audit to SmilePile
4. Replicate CodeQL + npm audit to Manylla
5. Set up SonarCloud for each project

---

## References

- [CodeQL Pricing](https://github.com/pricing) - Free for public repos
- [Snyk Free Tier](https://snyk.io/plans/) - Limited to 1-2 codebases
- [SonarCloud Pricing](https://sonarcloud.io/pricing) - Free for open source
- [npm audit Docs](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Built-in, free

---

*Last Updated: 2025-10-02*
*Recommendation: Exhaust free options (CodeQL + npm audit + SonarCloud) before considering paid tools*
