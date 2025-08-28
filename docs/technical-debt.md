# Technical Debt Log

This document tracks known technical debt and issues that need future investigation or resolution.

## P0 - Critical Issues

### Webpack Cache Invalidation Failure (2025-08-28)

**Issue**: Webpack filesystem cache can silently fail to invalidate when source files change, causing old code to be bundled in production builds.

**Discovery**: During sync data loss fix, changes to `syncServiceV2.js` were not being included in production bundle despite successful builds. The protection code (`_justJoinedSync` flag) was present in source but missing from bundle.

**Impact**: Critical bug fixes may not be deployed even after successful builds, leading to production issues persisting despite fixes being merged.

**Current Mitigation**:
1. Webpack cache temporarily disabled (`cache: false`) during critical fixes
2. Added verification step: `grep -c "_justJoinedSync" web/build/bundle.*.js`
3. Clean build environment before critical deployments: `rm -rf node_modules/.cache .babel-cache web/build`
4. Re-enabled cache with explicit version bumping in `webpack.config.js`

**Permanent Solution Needed**:
- Investigate webpack cache invalidation mechanism
- Add automated build verification to deployment pipeline
- Consider content hash verification for critical files
- Implement pre-deployment smoke tests to verify critical code is present

**Related Files**:
- `webpack.config.js`
- `scripts/qual_deploy.sh` (should add verification)
- `scripts/prod_deploy.sh` (should add verification)

---

## P1 - High Priority

_Currently empty_

## P2 - Medium Priority

_Currently empty_

## P3 - Low Priority

_Currently empty_

---

## Resolution Template

When resolving technical debt, update the entry with:
- **Resolved Date**: YYYY-MM-DD
- **Solution**: Brief description of the fix
- **PR/Commit**: Link to the pull request or commit hash