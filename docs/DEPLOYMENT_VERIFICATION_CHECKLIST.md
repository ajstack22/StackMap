# Deployment Verification Checklist

## Overview

This checklist ensures all changes are properly verified before production deployment. The CI/CD pipeline now includes a mandatory manual verification step between staging and production.

## Verification Process

### 1. Automatic Staging Deployment
When you push to main:
- Tests run automatically
- Code deploys to staging (`~/public_html/staging`)
- Pipeline pauses for manual verification

### 2. Manual Verification Steps

#### A. Access Staging Environment

Since web access to staging may not work, use SSH:

```bash
# Connect to server
ssh stackmap-cpanel

# Navigate to staging
cd ~/public_html/staging

# Check deployment timestamp
ls -la index.html

# View recent changes
git log --oneline -5
```

#### B. Local Testing of Staging Files

```bash
# Option 1: Download and test locally
scp -r stackmap-cpanel:~/public_html/staging ~/Desktop/staging-test

# Option 2: Use port forwarding
ssh -L 8080:localhost:8080 stackmap-cpanel
# Then in another terminal on the server:
cd ~/public_html/staging && python3 -m http.server 8080
# Access at: http://localhost:8080
```

### 3. Verification Checklist

#### For UI/Visual Changes:
- [ ] Component renders correctly
- [ ] Mobile responsiveness verified
- [ ] No console errors
- [ ] Animations/transitions work
- [ ] Touch targets are adequate (44px+)

#### For Functionality Changes:
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Error states display properly
- [ ] Data persists correctly
- [ ] Offline functionality maintained

#### For Bug Fixes:
- [ ] Original issue is resolved
- [ ] No regression in related features
- [ ] Fix works across different scenarios
- [ ] Tests added to prevent recurrence

#### For Performance Changes:
- [ ] Page load time acceptable
- [ ] No memory leaks
- [ ] Smooth scrolling/animations
- [ ] Service worker updates properly

#### For Drive Sync Changes:
- [ ] Sync completes without errors
- [ ] Data integrity maintained
- [ ] Conflict resolution works
- [ ] Offline changes sync properly

### 4. Special Cases - When Staging Test Can Be Skipped

Some changes cannot be effectively tested on staging:

#### Infrastructure Changes:
- GitHub Actions workflow updates
- Deployment script modifications
- Documentation updates
- Development tool changes

#### Verification for Non-Testable Changes:
1. Review code changes carefully
2. Ensure local tests pass
3. Document in PR/commit why staging test was skipped
4. Consider rolling deployment if risky

### 5. Approval Process

#### To Approve Deployment:
1. Go to GitHub Actions: https://github.com/ajstack22/StackMap/actions
2. Click on the running workflow
3. Click "Review deployments"
4. Select "staging-verification" environment
5. Add comment describing verification completed
6. Click "Approve and deploy"

#### To Reject Deployment:
1. Click "Reject"
2. Add comment explaining issues found
3. Fix issues and push new commit

### 6. Emergency Procedures

#### If Production Deploy Fails:
```bash
# Quick rollback
ssh stackmap-cpanel
cd ~/public_html
git reset --hard HEAD~1
```

#### If Staging Verification Reveals Critical Issues:
1. Do NOT approve production deployment
2. Fix issues locally
3. Push fixes to trigger new deployment
4. Re-verify on staging

## Verification Commands Reference

```bash
# Check what changed
diff -r ~/public_html/staging ~/public_html/

# Test specific file
cat ~/public_html/staging/path/to/file.js

# Check for errors in logs
grep -i error ~/public_html/staging/error_log

# Verify service worker version
grep "const CACHE_VERSION" ~/public_html/staging/sw.js

# Check file permissions
find ~/public_html/staging -type f -not -perm 644

# Verify no sensitive data
grep -r "password\|secret\|key" ~/public_html/staging/
```

## Best Practices

1. **Always verify** - Even small changes can have unexpected effects
2. **Test the actual fix** - Don't just check that files deployed
3. **Document verification** - Add comments when approving
4. **When in doubt, test more** - Better safe than sorry
5. **Use staging for real testing** - Not just a deployment checkpoint

## Automated Checks Still Running

Even with manual verification, these automated checks still run:
- Unit tests
- Integration tests  
- Linting
- Security scanning
- Build validation

Manual verification is IN ADDITION to these automated checks, not a replacement.