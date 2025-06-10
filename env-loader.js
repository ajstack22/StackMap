// Environment variable loader for StackMap
// This file should be loaded before other scripts in index.html
// For production, set these values directly in your hosting environment

// In development, you can set these values here temporarily
// But DO NOT commit actual credentials to version control
(function() {
    // Check if running in development or test environments
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname.includes('qual') || 
                  window.location.search.includes('dev=1');
    
    // Check if on test subdomains
    const isTestDomain = window.location.hostname === 'stackmap.app' && 
                        (window.location.pathname.startsWith('/mu') || 
                         window.location.pathname.startsWith('/dev'));
    
    if (isDev || isTestDomain) {
        // Development values - replace with your actual credentials
        // Better approach: use a local .env.local file and a build process
        window.STACKMAP_GOOGLE_CLIENT_ID = '';
        window.STACKMAP_GOOGLE_API_KEY = '';
        
        console.warn('StackMap: Running in development mode. Google Drive sync disabled until API credentials are configured.');
        console.warn('To enable Google Drive sync:');
        console.warn('1. Get credentials from https://console.cloud.google.com/');
        console.warn('2. Set window.STACKMAP_GOOGLE_CLIENT_ID and window.STACKMAP_GOOGLE_API_KEY in env-loader.js');
        console.warn('3. Do NOT commit credentials to version control');
    }
    
    // Production environments should set these as actual environment variables
    // and inject them during the build/deployment process
    
    // For production without a build process, you can set them here
    // Replace with your actual Google OAuth credentials
    
    // IMPORTANT: Add your Google OAuth credentials here
    // Get these from https://console.cloud.google.com/
    // 1. Create/select project
    // 2. Enable Google Drive API
    // 3. Create OAuth 2.0 Client ID (Web application)
    // 4. Add https://stackmap.app to Authorized JavaScript origins
    // 5. Add https://stackmap.app to Authorized redirect URIs
    
    if (!window.STACKMAP_GOOGLE_CLIENT_ID) {
        window.STACKMAP_GOOGLE_CLIENT_ID = '801001508845-59jevf4piac2cg3g9q6srjb297sd4hbr.apps.googleusercontent.com'; // Replace with your Client ID
    }
    if (!window.STACKMAP_GOOGLE_API_KEY) {
        window.STACKMAP_GOOGLE_API_KEY = 'AIzaSyD8D106PcgbDC2ZLAST5j1o73k2OrE2V0M'; // Replace with your API Key
    }
})();