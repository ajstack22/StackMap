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

1. **API Keys**
   - Never commit API keys to the repository
   - Use environment variables (.env file)
   - Follow the setup guide in `.env.example`

2. **Console Logging**
   - The codebase includes console.log statements for debugging
   - These do not log sensitive data
   - Consider removing for production deployments

3. **Data Storage**
   - All user data is stored locally in the browser
   - No data is sent to external servers (except optional Google Drive sync)
   - No analytics or tracking by default

4. **Content Security Policy**
   - CSP headers are configured in index.html
   - Restricts script sources to prevent XSS
   - Allows necessary Google APIs for Drive sync

## Known Security Considerations

1. **Local Storage** - Data is stored unencrypted in browser localStorage
2. **Google Drive Sync** - Uses OAuth2 for authentication
3. **No Server** - This is a client-side only application

## Dependencies

- No runtime JavaScript dependencies
- Google Fonts (loaded from Google CDN)
- Material Icons (loaded from Google CDN)
- Google APIs (optional, for Drive sync)

## Contact

For security concerns, please email contact@stackmap.app