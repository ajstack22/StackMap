// StackMap Development Tools
// Helper functions for cache management and debugging

window.StackMapDev = {
    
    // Clear all caches and storage
    clearAll: async function() {
        try {
            // Clear service worker caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
                console.log('✅ Service Worker caches cleared');
            }
            
            // Clear localStorage
            localStorage.clear();
            console.log('✅ localStorage cleared');
            
            // Clear sessionStorage
            sessionStorage.clear();
            console.log('✅ sessionStorage cleared');
            
            // Clear IndexedDB (if used)
            if ('indexedDB' in window) {
                // StackMap specific databases
                const dbsToDelete = ['StackMapDB', 'stackmap-data'];
                for (const dbName of dbsToDelete) {
                    try {
                        await new Promise((resolve, reject) => {
                            const deleteReq = indexedDB.deleteDatabase(dbName);
                            deleteReq.onsuccess = () => resolve();
                            deleteReq.onerror = () => resolve(); // Don't fail if DB doesn't exist
                        });
                    } catch (e) {
                        // Ignore errors for non-existent databases
                    }
                }
                console.log('✅ IndexedDB cleared');
            }
            
            // Unregister service worker
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(reg => reg.unregister()));
                console.log('✅ Service Worker unregistered');
            }
            
            console.log('🎉 All caches and storage cleared! Refresh the page for clean start.');
            return true;
        } catch (error) {
            console.error('❌ Error clearing caches:', error);
            return false;
        }
    },
    
    // Force reload without cache
    hardReload: function() {
        window.location.reload(true);
    },
    
    // Add cache busting parameters to current URL
    cacheBust: function() {
        const url = new URL(window.location);
        url.searchParams.set('nocache', '1');
        url.searchParams.set('v', Date.now());
        window.location.href = url.toString();
    },
    
    // Toggle debug mode
    toggleDebug: function() {
        const url = new URL(window.location);
        if (url.searchParams.has('debug')) {
            url.searchParams.delete('debug');
        } else {
            url.searchParams.set('debug', '1');
        }
        window.location.href = url.toString();
    },
    
    // Show cache status
    showCacheStatus: async function() {
        console.group('📊 StackMap Cache Status');
        
        // Service Worker status
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            console.log('Service Worker:', registration ? 'Registered' : 'Not registered');
            if (registration) {
                console.log('SW State:', registration.active?.state || 'inactive');
            }
        }
        
        // Cache storage
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log('Cache Names:', cacheNames);
            for (const cacheName of cacheNames) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();
                console.log(`Cache "${cacheName}":`, requests.length, 'items');
            }
        }
        
        // Local storage
        console.log('localStorage items:', localStorage.length);
        console.log('sessionStorage items:', sessionStorage.length);
        
        console.groupEnd();
    },
    
    // Quick access methods
    cc: function() { return this.clearAll(); },      // Short for clear all
    hr: function() { return this.hardReload(); },    // Short for hard reload
    cb: function() { return this.cacheBust(); },     // Short for cache bust
    status: function() { return this.showCacheStatus(); }
};

// Add keyboard shortcuts for development
if (window.location.hostname === 'localhost' || window.location.hostname.includes('qual')) {
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+R - Hard reload
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            e.preventDefault();
            StackMapDev.hardReload();
        }
        
        // Ctrl+Shift+C - Clear all caches
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            StackMapDev.clearAll();
        }
        
        // Ctrl+Shift+D - Toggle debug mode
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            StackMapDev.toggleDebug();
        }
    });
    
    // Welcome message for developers
    console.log(`
🛠️  StackMap Development Tools Loaded
    
Quick Commands:
• StackMapDev.clearAll() or StackMapDev.cc() - Clear all caches
• StackMapDev.hardReload() or StackMapDev.hr() - Force reload
• StackMapDev.cacheBust() or StackMapDev.cb() - Add cache busting params
• StackMapDev.showCacheStatus() or StackMapDev.status() - Show cache info

Keyboard Shortcuts:
• Ctrl+Shift+R - Hard reload
• Ctrl+Shift+C - Clear all caches  
• Ctrl+Shift+D - Toggle debug mode

URL Parameters:
• ?nocache=1 - Disable caching
• ?debug=1 - Show debug info
• ?clearcache=1 - Clear storage on load
    `);
}

// Auto-load in development
if (window.location.search.includes('devtools=1')) {
    StackMapDev.showCacheStatus();
}