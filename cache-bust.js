// Cache Busting Utility for StackMap Development
// Automatically adds version parameters to CSS and JS files

(function() {
    'use strict';
    
    // Get current timestamp for cache busting
    const cacheVersion = Date.now();
    
    // Development mode detection (change this based on your setup)
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.includes('qual') ||
                         window.location.search.includes('dev=1');
    
    // Only apply cache busting in development or when forced
    if (isDevelopment || window.location.search.includes('nocache=1')) {
        
        // Cache bust CSS files
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            if (link.href && !link.href.includes('googleapis.com')) {
                const url = new URL(link.href);
                url.searchParams.set('v', cacheVersion);
                link.href = url.toString();
            }
        });
        
        // Cache bust JS files (apply to script tags that will be loaded)
        document.querySelectorAll('script[src]').forEach(script => {
            if (script.src && !script.src.includes('googleapis.com') && !script.src.includes('accounts.google.com')) {
                const url = new URL(script.src);
                url.searchParams.set('v', cacheVersion);
                script.src = url.toString();
            }
        });
        
        // Add cache busting to manifest and service worker
        const manifest = document.querySelector('link[rel="manifest"]');
        if (manifest) {
            const url = new URL(manifest.href);
            url.searchParams.set('v', cacheVersion);
            manifest.href = url.toString();
        }
        
        // Force service worker update
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.update();
                });
            });
        }
        
        // Clear localStorage and sessionStorage in development
        if (window.location.search.includes('clearcache=1')) {
            localStorage.clear();
            sessionStorage.clear();
            console.log('🗑️ Local storage cleared for fresh start');
        }
        
        // Add visual indicator for cache-busted mode
        console.log('🚀 Cache busting active - v' + cacheVersion);
        
        // Add a small indicator to the page
        if (window.location.search.includes('debug=1')) {
            const indicator = document.createElement('div');
            indicator.textContent = 'DEV v' + cacheVersion.toString().slice(-6);
            indicator.style.cssText = `
                position: fixed;
                top: 5px;
                right: 5px;
                background: rgba(255, 0, 0, 0.8);
                color: white;
                padding: 2px 6px;
                font-size: 10px;
                border-radius: 3px;
                z-index: 9999;
                font-family: monospace;
            `;
            document.body.appendChild(indicator);
        }
    }
})();