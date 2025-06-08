// Environment variable loader for StackMap
// This file should be loaded before other scripts in index.html
// For production, set these values directly in your hosting environment

// In development, you can set these values here temporarily
// But DO NOT commit actual credentials to version control
(function() {
    // Check if running in development
    const isDev = window.location.hostname === 'localhost' || 
                  window.location.hostname.includes('qual') || 
                  window.location.search.includes('dev=1');
    
    if (isDev) {
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
})();