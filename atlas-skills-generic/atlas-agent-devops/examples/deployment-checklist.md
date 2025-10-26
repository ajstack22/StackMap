# Deployment Checklist

## Pre-Deployment
- [ ] All changes committed (for staging/production)
- [ ] Changelog updated with changes
- [ ] Tests pass locally: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run typecheck` (if applicable)
- [ ] Build succeeds locally: `npm run build`
- [ ] Correct environment selected
- [ ] Team notified (for production)

## Deployment Execution
- [ ] Quality gates passed (tests, linting, type checking, build)
- [ ] Version incremented correctly (if applicable)
- [ ] Deployment succeeded (no errors in output)
- [ ] Artifacts generated successfully

## Post-Deployment
- [ ] Deployment verified on target environment
- [ ] Smoke test performed (basic functionality works)
- [ ] No critical errors in logs
- [ ] Rollback plan ready (if needed)
- [ ] Team notified of completion

## Environment-Specific Checks

### Development
- [ ] Tested locally
- [ ] Database migrations run (if needed)
- [ ] Environment variables configured

### Staging
- [ ] Clean git state (recommended)
- [ ] Internal team notified
- [ ] Staging environment accessible
- [ ] Database backed up (if migrations)
- [ ] API endpoints updated (if changed)
- [ ] Integration tests pass

### Production
- [ ] Clean git state verified
- [ ] Validated in staging first
- [ ] Production monitoring ready
- [ ] Rollback plan prepared
- [ ] Database backed up
- [ ] Team on standby for issues
- [ ] Release notes published
- [ ] Stakeholders notified

## Platform-Specific Checks

### Web Application
- [ ] Bundle size reasonable (check for large increases)
- [ ] Assets uploaded to CDN (if applicable)
- [ ] Cache invalidated (if using CDN)
- [ ] SSL certificate valid
- [ ] DNS configured correctly

### Mobile Application
- [ ] iOS build uploaded to TestFlight/App Store
- [ ] Android build uploaded to Play Console
- [ ] Version number incremented
- [ ] Release notes added to app store listing
- [ ] Screenshots/metadata updated (if changed)

### API/Backend
- [ ] Database migrations run successfully
- [ ] API versioning maintained (if applicable)
- [ ] Health check endpoint responding
- [ ] Load balancer configured
- [ ] Auto-scaling configured (if applicable)

## Security Checks

### All Environments
- [ ] Secrets not committed to git
- [ ] Environment variables configured correctly
- [ ] API keys rotated (if needed)
- [ ] SSL/TLS enabled
- [ ] Security headers configured

### Production Only
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Access logs enabled
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] Backup encryption enabled

## Monitoring & Observability

### Setup
- [ ] Application logs accessible
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring configured (APM)
- [ ] Uptime monitoring configured
- [ ] Alerts configured for critical issues

### Post-Deployment
- [ ] Error rates stable or decreased
- [ ] Response times stable or improved
- [ ] No spike in 4xx/5xx errors
- [ ] No memory leaks detected
- [ ] CPU usage normal

## Communication

### Pre-Deployment (Production)
- [ ] Email sent to stakeholders
- [ ] Slack announcement posted
- [ ] Maintenance window communicated (if downtime expected)
- [ ] On-call team notified

### Post-Deployment (Production)
- [ ] Success notification sent
- [ ] Release notes shared
- [ ] Known issues documented
- [ ] Support team briefed

### Failure (Any Environment)
- [ ] Immediate notification sent
- [ ] Incident management started
- [ ] Rollback initiated (if needed)
- [ ] Post-mortem scheduled

## Rollback Checklist (If Needed)

### Preparation
- [ ] Previous version identified
- [ ] Rollback command ready
- [ ] Database state verified
- [ ] Team notified of rollback

### Execution
- [ ] Application rolled back
- [ ] Database rolled back (if migrations were run)
- [ ] Cache cleared
- [ ] Verification tests pass

### Post-Rollback
- [ ] Issue documented
- [ ] Post-mortem created
- [ ] Fix planned
- [ ] Stakeholders notified

## Notes

Use this checklist as a starting point. Customize for your specific project needs.

**Tips:**
- Keep this checklist updated as your deployment process evolves
- Use a copy of this checklist for each deployment
- Archive completed checklists for audit trail
- Review checklist after incidents to improve process
