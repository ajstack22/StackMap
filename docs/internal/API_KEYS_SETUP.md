# Setting Up Google Drive API Keys for StackMap

## Architecture Context
**StackMap is a 100% client-side PWA with no backend server.** This means:
- API keys must be embedded in the JavaScript code
- All API calls originate from the user's browser
- Security is enforced through Google Console restrictions, not key secrecy
- This is standard practice for client-side applications (like Google Maps, Firebase, etc.)

## Security Notice
The API keys in the codebase are **intentionally visible** and **properly secured through domain restrictions**. This is NOT a security vulnerability - it's the correct implementation for a client-side application.

## Setup Instructions

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API for your project

### 2. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost` (for local development)
   - Your production domain (e.g., `https://yourdomain.com`)
5. Add authorized redirect URIs if needed
6. Save your Client ID

### 3. Create an API Key
1. Click "Create Credentials" > "API key"
2. Restrict the key to your domains
3. Restrict the key to Google Drive API only

### 4. Configure StackMap

#### For Local Development:
Edit `env-loader.js` and add your credentials:
```javascript
window.STACKMAP_GOOGLE_CLIENT_ID = 'your-client-id-here';
window.STACKMAP_GOOGLE_API_KEY = 'your-api-key-here';
```

**IMPORTANT**: Do NOT commit these changes to version control!

#### For Production:
Set these as environment variables in your hosting platform:
- `STACKMAP_GOOGLE_CLIENT_ID`
- `STACKMAP_GOOGLE_API_KEY`

Then inject them into your HTML during the build/deployment process.

### 5. Domain Restrictions (Recommended)
1. In Google Cloud Console, edit your API key
2. Under "Application restrictions", select "HTTP referrers"
3. Add your allowed domains:
   - `http://localhost/*` (for development)
   - `https://yourdomain.com/*` (for production)

## Alternative: Run Without Google Drive
StackMap works perfectly fine without Google Drive sync. The app will automatically disable sync features if no API credentials are provided.

## Security Best Practices
1. Never commit API keys to version control
2. Use environment variables for production
3. Restrict API keys to specific domains
4. Regularly rotate your credentials
5. Monitor usage in Google Cloud Console