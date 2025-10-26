# Deployment Process - Example Template

Copy to `.atlas/deployment.md` and customize for your project.

## Overview

This document describes the deployment process for [Your Project Name].

**Key Principles:**
- Automated deployment via CI/CD
- Multiple environments for testing
- Zero-downtime deployments
- Rollback capability
- Quality gates enforced

## Environments

### Development
- **Purpose**: Local development and testing
- **Access**: All developers
- **Data**: Local/mock data
- **Deploy**: Automatic on save (hot reload)
- **URL**: `http://localhost:3000`

### Staging
- **Purpose**: Pre-production testing and QA
- **Access**: Development team + QA
- **Data**: Anonymized production data
- **Deploy**: Automatic on merge to `main`
- **URL**: `https://staging.example.com`

### Production
- **Purpose**: Live application for end users
- **Access**: All users
- **Data**: Production data
- **Deploy**: Manual approval after staging tests pass
- **URL**: `https://example.com`

## Deployment Pipeline

```
Code → Push → CI/CD → Tests → Build → Deploy
                ↓
         [Quality Gates]
         - Lint
         - Type check
         - Unit tests
         - Integration tests
         - Security scan
```

## Quality Gates

All deployments must pass:

1. **Linting** - Code style checks
   ```bash
   npm run lint
   ```

2. **Type Checking** - TypeScript validation
   ```bash
   npm run typecheck
   ```

3. **Unit Tests** - 80%+ coverage
   ```bash
   npm test
   ```

4. **Integration Tests** - Key workflows
   ```bash
   npm run test:integration
   ```

5. **Build** - Application builds successfully
   ```bash
   npm run build
   ```

6. **Security Scan** - No critical vulnerabilities
   ```bash
   npm audit --production
   ```

## Deployment Steps

### To Staging (Automatic)

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push to remote**
   ```bash
   git push origin feature/my-feature
   ```

4. **Create Pull Request**
   - GitHub/GitLab/etc. UI
   - Add description
   - Request reviewers

5. **Wait for CI checks**
   - All tests must pass
   - Code review approved
   - No merge conflicts

6. **Merge to main**
   - Merging triggers automatic deployment to staging
   - CI/CD runs full pipeline
   - Deploys if all checks pass

7. **Verify in staging**
   - Test key workflows
   - Check for errors
   - Verify changes visible

### To Production (Manual Approval)

1. **Ensure staging is stable**
   - All features tested
   - No critical bugs
   - Performance acceptable

2. **Create release tag**
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.2.3 -m "Release version 1.2.3"
   git push origin v1.2.3
   ```

3. **Trigger production deployment**
   - Option A: CI/CD auto-deploys on tag
   - Option B: Manual approval in CI/CD UI
   - Option C: Run deployment script
     ```bash
     npm run deploy:production
     ```

4. **Wait for deployment**
   - Monitor CI/CD logs
   - Watch for errors
   - Deployment typically takes 5-10 minutes

5. **Verify production**
   - Smoke tests
   - Check monitoring dashboards
   - Verify no error spikes

6. **Update changelog**
   ```bash
   # Update CHANGELOG.md
   ## [1.2.3] - 2025-01-15
   ### Added
   - New feature description

   ### Fixed
   - Bug fix description
   ```

7. **Notify stakeholders**
   - Post in Slack/Teams
   - Send release notes
   - Update status page

## Rollback Procedure

If issues are detected in production:

### Quick Rollback (< 5 minutes)

1. **Trigger rollback in CI/CD**
   ```bash
   # Option A: Via CI/CD UI
   # Click "Rollback" button

   # Option B: Via CLI
   npm run rollback:production
   ```

2. **Verify rollback**
   - Check application is working
   - Monitor error rates
   - Confirm previous version running

### Manual Rollback (if CI/CD unavailable)

1. **Deploy previous tag**
   ```bash
   git checkout v1.2.2  # Previous stable version
   npm run deploy:production -- --force
   ```

2. **Verify rollback**
   - Test key functionality
   - Check error logs
   - Monitor user reports

3. **Investigate issue**
   - Review deployment logs
   - Check error tracking
   - Identify root cause

## Version Management

### Versioning Scheme

Using Semantic Versioning (semver): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

**Examples:**
- `1.0.0` → `1.0.1`: Bug fix
- `1.0.1` → `1.1.0`: New feature
- `1.1.0` → `2.0.0`: Breaking change

### Updating Version

```bash
# Patch version (bug fix)
npm version patch

# Minor version (new feature)
npm version minor

# Major version (breaking change)
npm version major

# This automatically:
# - Updates package.json
# - Creates git commit
# - Creates git tag
```

## Release Checklist

Before deploying to production:

### Code Quality
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No linting errors
- [ ] Type checking passes
- [ ] No console.log statements

### Documentation
- [ ] CHANGELOG.md updated
- [ ] Version number updated
- [ ] README updated (if needed)
- [ ] API docs updated (if applicable)

### Testing
- [ ] Tested in staging
- [ ] Manual QA completed
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Accessibility checked

### Security
- [ ] No new vulnerabilities
- [ ] Secrets not committed
- [ ] Authentication working
- [ ] Authorization correct

### Infrastructure
- [ ] Database migrations ready
- [ ] Environment variables set
- [ ] CDN cache invalidated (if needed)
- [ ] Third-party services notified (if needed)

### Communication
- [ ] Stakeholders notified
- [ ] Release notes prepared
- [ ] Support team briefed
- [ ] Status page updated (if needed)

## Monitoring

After deployment, monitor:

### Application Metrics
- Response time
- Error rate
- Request rate
- CPU/Memory usage

### Business Metrics
- User signups
- Conversion rate
- Feature usage
- Revenue (if applicable)

### Tools
- Application monitoring: [New Relic/DataDog/etc.]
- Error tracking: [Sentry/Rollbar/etc.]
- Analytics: [Google Analytics/Mixpanel/etc.]
- Logs: [Papertrail/Loggly/etc.]

## Troubleshooting

### Deployment Fails

**Check:**
1. CI/CD logs for error messages
2. Build artifacts are created
3. All quality gates pass
4. Environment variables set correctly

**Common Issues:**
- Test failures: Fix tests and re-deploy
- Build errors: Check dependencies
- Timeout: Increase deployment timeout
- Permission errors: Check credentials

### Production Issues

**Immediate Actions:**
1. Check error tracking (Sentry/etc.)
2. Check application logs
3. Check monitoring dashboards
4. Check user reports

**If Critical:**
1. Rollback immediately
2. Notify team
3. Investigate in staging
4. Fix and re-deploy

## CI/CD Configuration

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to staging
        run: npm run deploy:staging

  deploy-production:
    needs: test
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        run: npm run deploy:production
```

## Emergency Contacts

In case of production issues:

- **DevOps Lead**: [Name] - [Email] - [Phone]
- **Engineering Manager**: [Name] - [Email] - [Phone]
- **On-Call Engineer**: Check PagerDuty/OpsGenie

## Additional Resources

- CI/CD Dashboard: [URL]
- Error Tracking: [URL]
- Monitoring: [URL]
- Status Page: [URL]
- Runbook: [Link to detailed runbook]

---

## Customization Notes

**Adapt this template:**
1. Replace placeholder URLs and names
2. Add your actual CI/CD configuration
3. Document your specific tools
4. Include team-specific processes
5. Add emergency procedures
6. Link to runbooks

**Keep it updated:**
- Review quarterly
- Update after process changes
- Add lessons learned
- Remove outdated information
