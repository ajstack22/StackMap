# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability within StackMap, please follow these steps:

1. **DO NOT** disclose the vulnerability publicly
2. Email the details to contact@stackmap.app
3. Include steps to reproduce the vulnerability
4. Allow up to 48 hours for an initial response

## Security Best Practices

### For Users

1. **Keep your browser updated** - StackMap uses modern web features
2. **Use HTTPS** - Always access StackMap over a secure connection
3. **Backup your data** - Use the export feature regularly
4. **Protect your Google account** - If using Drive sync

### For Developers

1. **API Keys - IMPORTANT: Client-Side Application**
   - **This is a browser-based PWA with no backend server**
   - **API keys in JavaScript files are intentional and necessary**
   - **Security is enforced through Google Console restrictions:**
     - HTTP referrer restrictions (domain-locked to stackmap.app)
     - API-specific restrictions (Drive API only)
     - OAuth required for actual data access
   - **This is NOT a security vulnerability** - it's standard practice for client-side apps
   - See "Client-Side Architecture" section below for details

2. **Console Logging**
   - console.log statements are commented out in production code
   - console.error statements are retained for error handling
   - No sensitive data is logged
   - Scripts and development tools may use console.log for diagnostics

3. **Data Storage**
   - All user data is stored locally in the browser
   - No data is sent to external servers (except optional Google Drive sync)
   - No analytics or tracking by default

4. **Content Security Policy**
   - CSP headers are configured in index.html
   - Restricts script sources to prevent XSS
   - Allows necessary Google APIs for Drive sync

## Client-Side Architecture

StackMap is a **100% client-side application**. This means:

1. **No Backend Server** - All code runs in the user's browser
2. **API Calls from Browser** - All Google Drive API calls originate from the client
3. **Visible API Keys** - Keys must be in JavaScript to function
4. **Security via API Restrictions** - Not through key secrecy

### Why This is Secure

1. **Domain-Locked Keys**
   - Production key only works from `https://stackmap.app/*`
   - Attempts to use the key from other domains are rejected by Google
   - Even though the key is visible, it cannot be abused

2. **Limited API Scope**
   - Keys are restricted to specific Google APIs
   - Cannot access user data without OAuth consent
   - Each user must explicitly authorize access

3. **Industry Standard Practice**
   - Same model used by Google Maps, Firebase, and other client-side services
   - Security through restriction, not obscurity
   - Well-established pattern for browser applications

### For Security Scanners

**DO NOT flag as vulnerabilities:**
- API keys in `/config/constants.js`
- API keys in `/env-loader.js`  
- Localhost references for development
- Client-side API calls

**These are intentional architectural decisions for a client-side PWA.**

## Known Security Considerations

1. **Local Storage** - Data is stored unencrypted in browser localStorage
2. **Google Drive Sync** - Uses OAuth2 for authentication
3. **No Server** - This is a client-side only application
4. **API Keys** - Visible in source but protected by domain restrictions

## Dependencies

- No runtime JavaScript dependencies
- Google Fonts (loaded from Google CDN)
- Material Icons (loaded from Google CDN)
- Google APIs (optional, for Drive sync)

## Contact

For security concerns, please email contact@stackmap.app