# StackMap Quarterly Package Review - Q4 2025

**Review Date:** 2025-11-27
**Reviewer:** Automated Review via Claude
**Package Version:** 2025.11.09.10
**Total Dependencies:** 1,531 packages (528 prod, 1,003 dev)

---

## Executive Summary

| Category | Status | Details |
|----------|--------|---------|
| License Compliance | ✅ PASS | All permissive licenses |
| Security Vulnerabilities | ⚠️ ACTION NEEDED | 2 vulnerabilities (1 high, 1 moderate) |
| Outdated Packages | ⚠️ REVIEW | 44 packages have updates available |
| Deprecated Packages | ⚠️ REVIEW | 8 deprecated packages identified |

---

## 1. License Compliance

### Summary
✅ **All licenses approved for production use**
❌ **No GPL/AGPL/LGPL/copyleft licenses found**

### License Breakdown (Production Dependencies)

| License | Count | Status |
|---------|-------|--------|
| MIT | 497 | ✅ Approved |
| ISC | 42 | ✅ Approved |
| BSD-3-Clause | 30 | ✅ Approved |
| Apache-2.0 | 16 | ✅ Approved |
| BSD-2-Clause | 11 | ✅ Approved |
| Unlicense | 2 | ✅ Approved |
| UNLICENSED | 1 | ℹ️ StackMap itself (private) |
| Python-2.0 | 1 | ✅ Approved |
| CC-BY-4.0 | 1 | ✅ Approved |
| 0BSD | 1 | ✅ Approved |
| CC0-1.0 | 1 | ✅ Approved |
| (MIT AND Zlib) | 1 | ✅ Approved |
| (MIT AND BSD-3-Clause) | 1 | ✅ Approved |
| MIT* | 1 | ✅ Approved |
| (Unlicense OR Apache-2.0) | 1 | ✅ Approved |
| (MIT OR CC0-1.0) | 1 | ✅ Approved |

### License Verdict
**Status:** ✅ **APPROVED** - All licenses are permissive and compatible with commercial use.

---

## 2. Security Vulnerabilities

### Current Vulnerabilities: 2

#### HIGH Severity (1)

| Package | Vulnerability | CVSS | Description |
|---------|---------------|------|-------------|
| node-forge@1.3.1 | GHSA-554w-wpv2-vw27 | 8.6 | ASN.1 Unbounded Recursion, OID Integer Truncation, and Validator Desynchronization |

**Dependency Chain:**
```
webpack-dev-server@5.2.2 → selfsigned@2.4.1 → node-forge@1.3.1
```

**Impact:** Development environment only (devDependency)
**Risk Level:** Low (not in production builds)
**Recommendation:** Update webpack-dev-server to latest version

#### MODERATE Severity (1)

| Package | Vulnerability | CVSS | Description |
|---------|---------------|------|-------------|
| body-parser@2.2.0 | GHSA-wqch-xfxh-vrr4 | 5.3 | DoS when URL encoding is used |

**Dependency Chain:**
```
express@5.1.0 → body-parser@2.2.0
```

**Impact:** Production server code
**Risk Level:** Moderate
**Recommendation:** Run `npm audit fix` to update to body-parser@2.2.1

### Remediation Steps
```bash
# Fix all vulnerabilities with available patches
npm audit fix

# Verify fixes
npm audit
```

---

## 3. Outdated Packages

### Critical Updates (Security/Major Versions)

| Package | Current | Latest | Priority | Notes |
|---------|---------|--------|----------|-------|
| react | 19.1.0 | 19.2.0 | 🔴 High | Core framework |
| react-native | 0.80.1 | 0.82.1 | 🔴 High | Core framework |
| react-dom | 19.1.0 | 19.2.0 | 🔴 High | Core framework |
| react-native-mmkv | 2.12.2 | 4.0.1 | 🔴 High | Major version (breaking changes likely) |
| react-native-get-random-values | 1.11.0 | 2.0.0 | 🟡 Medium | Major version |
| react-native-web | 0.20.0 | 0.21.2 | 🟡 Medium | Breaking changes possible |

### Build & Development Tools

| Package | Current | Latest | Priority |
|---------|---------|--------|----------|
| typescript | 5.0.4 | 5.9.3 | 🟡 Medium |
| webpack | 5.99.9 | 5.103.0 | 🟢 Low |
| webpack-dev-server | 5.2.2 | Latest | 🟡 Medium (fixes security issue) |
| prettier | 2.8.8 | 3.6.2 | 🟢 Low |
| eslint | 8.57.1 | 9.39.1 | 🟡 Medium |
| jest | 29.7.0 | 30.2.0 | 🟢 Low |

### React Native Ecosystem

| Package | Current | Latest | Priority |
|---------|---------|--------|----------|
| react-native-gesture-handler | 2.27.1 | 2.29.1 | 🟢 Low |
| react-native-svg | 15.12.0 | 15.15.0 | 🟢 Low |
| react-native-safe-area-context | 5.6.1 | 5.6.2 | 🟢 Low |
| react-native-vector-icons | 10.2.0 | 10.3.0 | 🟢 Low |
| react-native-vision-camera | 4.7.2 | 4.7.3 | 🟢 Low |
| react-native-qrcode-svg | 6.3.15 | 6.3.20 | 🟢 Low |
| @react-native-community/cli* | 19.1.2 | 20.0.2 | 🟡 Medium |

### Backend/Server

| Package | Current | Latest | Priority |
|---------|---------|--------|----------|
| mysql2 | 3.14.5 | 3.15.3 | 🟢 Low |
| redis | 5.8.3 | 5.10.0 | 🟢 Low |
| express-rate-limit | 8.1.0 | 8.2.1 | 🟢 Low |
| joi | 18.0.1 | 18.0.2 | 🟢 Low |

### Other

| Package | Current | Latest | Priority |
|---------|---------|--------|----------|
| emoji-datasource-apple | 15.1.2 | 16.0.0 | 🟢 Low |
| @babel/core | 7.27.7 | 7.28.5 | 🟢 Low |
| @babel/preset-env | 7.27.2 | 7.28.5 | 🟢 Low |
| @babel/runtime | 7.27.6 | 7.28.4 | 🟢 Low |
| glob | 11.1.0 | 13.0.0 | 🟡 Medium |
| node-fetch | 2.7.0 | 3.3.2 | 🟡 Medium |

---

## 4. Deprecated Packages

| Package | Status | Recommended Action |
|---------|--------|-------------------|
| react-native-document-picker@9.3.1 | Deprecated | Migrate to @react-native-documents/picker |
| @testing-library/jest-native@5.4.3 | Deprecated | Use built-in Jest matchers in @testing-library/react-native v12.4+ |
| glob@7.2.3 | Deprecated | Update to glob v9+ |
| inflight@1.0.6 | Deprecated | Use lru-cache instead |
| sourcemap-codec@1.4.8 | Deprecated | Use @jridgewell/sourcemap-codec |
| text-encoding@0.7.0 | Deprecated | No longer maintained |
| osenv@0.1.5 | Deprecated | No longer supported |
| read-package-json@2.1.2 | Deprecated | Use @npmcli/package-json |

---

## 5. Recommendations

### Immediate Actions (This Sprint)

1. **Fix Security Vulnerabilities**
   ```bash
   npm audit fix
   ```
   This will resolve the body-parser DoS vulnerability.

2. **Update Critical Packages**
   ```bash
   npm update react react-dom mysql2 redis joi express-rate-limit
   ```

### Short-Term (Next 2 Weeks)

3. **Update React Native Ecosystem**
   - Test react-native 0.82.1 in a feature branch
   - Update related @react-native/* packages together
   - Requires thorough mobile testing

4. **Migrate Deprecated Package**
   - Replace `react-native-document-picker` with `@react-native-documents/picker`
   - Follow migration guide: https://shorturl.at/QYT4t

5. **Update TypeScript**
   ```bash
   npm install typescript@5.9.3 --save-dev
   npm run typecheck
   ```

### Medium-Term (Next Quarter)

6. **Major Version Updates** (requires testing)
   - react-native-mmkv 2.x → 4.x (breaking changes)
   - react-native-get-random-values 1.x → 2.x
   - react-native-web 0.20 → 0.21
   - eslint 8.x → 9.x
   - prettier 2.x → 3.x

7. **Replace Deprecated Testing Library**
   - Migrate from @testing-library/jest-native to built-in matchers
   - See migration guide: https://callstack.github.io/react-native-testing-library/docs/migration/jest-matchers

### Long-Term

8. **Consider CI/CD Integration**
   - Add `npm audit --audit-level=high` to CI pipeline
   - Add license check to CI: `npm run license:verify`
   - Automated dependency update PRs (Dependabot/Renovate)

---

## 6. Version Pinning Review

### Currently Pinned (Review Recommended)

| Package | Pinned Version | Reason |
|---------|---------------|--------|
| @react-native/new-app-screen | 0.81.1 | Exact version |
| react | 19.1.0 | Exact version |
| react-native | 0.80.1 | Exact version |
| react-test-renderer | 19.1.0 | Exact version |
| @react-native/* (dev) | 0.80.1 | Exact versions |

**Recommendation:** Keep React and React Native pinned for stability; use ^ ranges for minor updates on other packages.

---

## 7. Scripts Available

The following npm scripts are available for ongoing compliance:

```bash
# Security audit
npm run security:audit          # Check for vulnerabilities
npm audit fix                   # Auto-fix vulnerabilities

# License compliance
npm run license:check           # Summary of all licenses
npm run license:report          # Generate CSV report
npm run license:verify          # Fail on copyleft licenses

# Code quality
npm run typecheck               # TypeScript validation
npm run lint                    # ESLint check
npm run check:all               # All checks combined
```

---

## Appendix: Full Outdated Package List

<details>
<summary>Click to expand full list</summary>

```
Package                                       Current   Wanted   Latest
@babel/core                                    7.27.7   7.28.5   7.28.5
@babel/preset-env                              7.27.2   7.28.5   7.28.5
@babel/preset-react                            7.27.1   7.28.5   7.28.5
@babel/runtime                                 7.27.6   7.28.4   7.28.4
@react-native-community/cli                    19.1.2   19.1.2   20.0.2
@react-native-community/cli-platform-android   19.1.2   19.1.2   20.0.2
@react-native-community/cli-platform-ios       19.1.2   19.1.2   20.0.2
@react-native/babel-preset                     0.80.1   0.80.1   0.82.1
@react-native/eslint-config                    0.80.1   0.80.1   0.82.1
@react-native/metro-config                     0.80.1   0.80.1   0.82.1
@react-native/new-app-screen                   0.81.1   0.81.1   0.82.1
@react-native/typescript-config                0.80.1   0.80.1   0.82.1
@types/jest                                   29.5.14  29.5.14   30.0.0
@types/react                                   19.1.8   19.2.7   19.2.7
babel-plugin-react-native-web                  0.20.0   0.20.0   0.21.2
emoji-datasource-apple                         15.1.2   15.1.2   16.0.0
eslint                                         8.57.1   8.57.1   9.39.1
eslint-plugin-react-hooks                       6.1.0    6.1.1    7.0.1
express-rate-limit                              8.1.0    8.2.1    8.2.1
glob                                           11.1.0   11.1.0   13.0.0
html-webpack-plugin                             5.6.4    5.6.5    5.6.5
jest                                           29.7.0   29.7.0   30.2.0
jest-environment-jsdom                         30.1.2   30.2.0   30.2.0
joi                                            18.0.1   18.0.2   18.0.2
mysql2                                         3.14.5   3.15.3   3.15.3
node-fetch                                      2.7.0    2.7.0    3.3.2
prettier                                        2.8.8    2.8.8    3.6.2
react                                          19.1.0   19.1.0   19.2.0
react-dom                                      19.1.0   19.2.0   19.2.0
react-native                                   0.80.1   0.80.1   0.82.1
react-native-gesture-handler                   2.27.1   2.29.1   2.29.1
react-native-get-random-values                 1.11.0   1.11.0    2.0.0
react-native-mmkv                              2.12.2   2.12.2    4.0.1
react-native-qrcode-svg                        6.3.15   6.3.20   6.3.20
react-native-safe-area-context                  5.6.1    5.6.2    5.6.2
react-native-svg                              15.12.0  15.15.0  15.15.0
react-native-vector-icons                      10.2.0   10.3.0   10.3.0
react-native-vision-camera                      4.7.2    4.7.3    4.7.3
react-native-web                               0.20.0   0.20.0   0.21.2
react-test-renderer                            19.1.0   19.1.0   19.2.0
redis                                           5.8.3   5.10.0   5.10.0
typescript                                      5.0.4    5.9.3    5.9.3
webpack                                        5.99.9  5.103.0  5.103.0
workbox-webpack-plugin                          7.3.0    7.4.0    7.4.0
```

</details>

---

## Review Sign-Off

| Item | Status |
|------|--------|
| License Compliance | ✅ Approved |
| Security Scan | ⚠️ 2 issues (fixable) |
| Dependency Health | ⚠️ Updates recommended |

**Next Review Date:** Q1 2026 (February 2026)

---

*Generated: 2025-11-27*
*Tool: npm audit, license-checker*
*Scope: All dependencies (production + development)*
