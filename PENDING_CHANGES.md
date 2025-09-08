# Pending Changes

## Title: Critical Security Response - npm Supply Chain Attack Mitigation

### Changes Made:
- **CRITICAL SECURITY**: Responded to active npm supply chain attack affecting color-convert, color-name, debug, error-ex, and is-arrayish packages
- Attack discovered on 2025-09-08 with malware advisories published at 14:26-15:20 UTC
- Removed compromised node_modules entirely
- Reinstalled all packages using `npm install --before 2025-09-08T00:00:00Z` to get pre-attack versions
- Verified no suspicious processes or network connections
- Fixed CSP headers in .htaccess files to allow Google Fonts for Material Icons
- Updated VectorIcons.web.js to handle CSP restrictions with local font fallback

