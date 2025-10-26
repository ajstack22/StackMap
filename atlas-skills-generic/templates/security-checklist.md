# Security Checklist

## Authentication & Authorization
- [ ] Authentication required for sensitive operations
- [ ] Authorization checks in place (user permissions)
- [ ] Session management secure (timeout, secure cookies)
- [ ] Password requirements met (length, complexity)
- [ ] Multi-factor authentication available (if applicable)
- [ ] Brute force protection in place

## Input Validation
- [ ] All user input validated on server-side
- [ ] Input sanitized to prevent XSS
- [ ] SQL injection prevention (parameterized queries)
- [ ] File upload validation (type, size, content)
- [ ] URL validation and sanitization
- [ ] JSON/XML parsing safety

## Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] Sensitive data encrypted in transit (HTTPS)
- [ ] PII handled according to privacy policy
- [ ] Credentials never logged or displayed
- [ ] API keys/secrets in environment variables
- [ ] Database backups encrypted

## API Security
- [ ] Rate limiting implemented
- [ ] CORS configured correctly
- [ ] API authentication required
- [ ] Request size limits enforced
- [ ] Error messages don't leak sensitive info
- [ ] API versioning in place

## Frontend Security
- [ ] No sensitive data in client-side code
- [ ] XSS prevention (content sanitization)
- [ ] CSRF protection in place
- [ ] Secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Content Security Policy configured
- [ ] Subresource Integrity for CDN resources

## Code Security
- [ ] No hardcoded secrets or credentials
- [ ] Dependencies up to date (no known vulnerabilities)
- [ ] Code reviewed for security issues
- [ ] Minimal permissions principle followed
- [ ] Error handling doesn't expose stack traces
- [ ] Debug mode disabled in production

## Infrastructure Security
- [ ] HTTPS enforced (no HTTP)
- [ ] Security headers configured (HSTS, etc.)
- [ ] Database access restricted
- [ ] Firewall rules configured
- [ ] Environment variables secured
- [ ] Logs don't contain sensitive data

## Compliance
- [ ] GDPR compliance (if applicable)
- [ ] CCPA compliance (if applicable)
- [ ] HIPAA compliance (if applicable)
- [ ] SOC 2 requirements met (if applicable)
- [ ] Privacy policy updated
- [ ] Terms of service updated

## Testing
- [ ] Security tests written and passing
- [ ] Penetration testing completed (for critical features)
- [ ] Vulnerability scanning run
- [ ] Dependencies scanned for vulnerabilities
- [ ] Authentication flow tested
- [ ] Authorization edge cases tested

## Incident Response
- [ ] Security incident plan in place
- [ ] Logging configured for security events
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] Incident contacts identified

## Documentation
- [ ] Security considerations documented
- [ ] Threat model created (for critical features)
- [ ] Security review completed
- [ ] Known limitations documented
