# Deployment Strategy

## Environments

### Development
- Purpose: Local testing and rapid iteration
- URL: http://localhost:3000
- Database: Local dev database
- Git State: Any (uncommitted changes OK)
- Frequency: Multiple times per day
- Command: `npm run dev`

### Staging
- Purpose: Pre-production validation
- URL: https://staging.example.com
- Database: Staging database (mirrors production)
- Git State: Clean (committed changes only)
- Frequency: Before each production release
- Command: `./.atlas/scripts/deploy.sh staging`

### Production
- Purpose: Live application serving real users
- URL: https://example.com
- Database: Production database
- Git State: Clean and tagged
- Frequency: Weekly or as needed
- Command: `./.atlas/scripts/deploy.sh production`

## Quality Gates

All deployments must pass:
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Changelog updated (CHANGELOG.md)
- [ ] Code review approved (for production)

## Version Strategy

Using semantic versioning: MAJOR.MINOR.PATCH
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

Versions tracked in:
- package.json (npm version)
- Git tags (vMAJOR.MINOR.PATCH)

## Rollback Procedure

If deployment fails:
1. Identify issue from logs
2. Revert to previous version: `git revert [commit]`
3. Deploy previous version: `./.atlas/scripts/deploy.sh [env]`
4. Notify team
5. Create post-mortem document

## Deployment Commands

### Development
```bash
npm run dev
# or
npm run start
```

### Staging
```bash
./.atlas/scripts/deploy.sh staging
```

### Production
```bash
./.atlas/scripts/deploy.sh production
# Requires: Clean git state, all tests pass, changelog updated
```

## Platform-Specific Notes

### Web Application
- Build output: `dist/` directory
- Deployment: SCP to server or container deployment
- Assets: Static files served from CDN

### Mobile Application (if applicable)
- iOS: TestFlight for staging, App Store for production
- Android: Play Console Internal Testing for staging, Production for release
- Build variants: Debug (development), Release (staging/production)

### API/Backend (if applicable)
- Container deployment (Docker, Kubernetes)
- Database migrations run before deployment
- Health checks required before traffic routing

## Monitoring

### Post-Deployment Monitoring
- Error rates (should remain stable or decrease)
- Response times (should not increase significantly)
- User sessions (verify no drops)
- Critical flows (login, checkout, etc.)

### Alerting
- Set up alerts for:
  - Error rate > 5%
  - Response time > 2s
  - Service downtime
  - Failed health checks

## Security Considerations

### Secrets Management
- Store in environment variables (not in code)
- Use secret management service (AWS Secrets Manager, Vault, etc.)
- Rotate secrets regularly

### Access Control
- Staging: Development team
- Production: DevOps team + authorized personnel
- Audit log of all production deployments

### Code Signing (mobile)
- iOS: Certificates managed via Fastlane Match
- Android: Keystore stored securely (not in git)

## Deployment Frequency

### Development
- Continuous: Every commit (CI/CD)
- Or: Multiple times per day (manual)

### Staging
- Before each production release
- After significant feature completion
- For testing major changes

### Production
- Weekly scheduled releases
- Or: As needed for critical fixes
- Avoid deployments on Fridays (unless critical)

## Approval Process

### Development
- No approval required
- Deployed by any developer

### Staging
- Approval by: Tech lead or senior developer
- Review: Code review required

### Production
- Approval by: Tech lead + Product manager
- Review: Code review + QA sign-off
- Documentation: Changelog updated + release notes

## Communication

### Pre-Deployment
- Staging: Slack message to #engineering
- Production: Email to all stakeholders + Slack announcement

### Post-Deployment
- Success: Brief status update
- Failure: Immediate notification + incident management
- Post-mortem: For production failures

## Backup & Recovery

### Database Backups
- Automated daily backups
- Manual backup before major migrations
- Test restore procedure quarterly

### Application State
- Tag releases in git (vMAJOR.MINOR.PATCH)
- Keep previous N releases available
- Document rollback procedure

### Data Migration
- Run migrations in staging first
- Verify data integrity post-migration
- Keep rollback migration scripts
