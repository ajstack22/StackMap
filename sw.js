// StackMap Service Worker - Offline Support for Special Needs Families
const CACHE_NAME = 'stackmap-v1.0.3-' + Date.now(); // Dynamic versioning for development
const OFFLINE_URL = '/offline.html';

// Development mode detection
const isDevelopment = self.location.hostname === 'localhost' || 
                     self.location.hostname.includes('qual') ||
                     self.location.search.includes('dev=1');

// Files to cache for offline use - essential for routine continuity
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/config.js',
  '/state.js',
  '/components.js',
  '/renderer.js',
  '/drive-sync.js',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Blog files
  '/blog.html',
  '/blog/blog-data.js',
  '/blog/blog-renderer.js',
  '/blog/blog-styles.css',
  // Google Fonts (cache these if using web fonts)
  'https://fonts.googleapis.com/css2?family=Comic+Relief:wght@400;700&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('StackMap Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching essential files for offline use');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('StackMap Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // In development mode, bypass cache for CSS and JS files for easier development
  if (isDevelopment && (event.request.url.includes('.css') || event.request.url.includes('.js') || event.request.url.includes('cache-bust'))) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle navigation requests (page loads)
  if (event.request.mode === 'navigate') {
    // Special handling for blog route
    if (event.request.url.includes('/blog')) {
      event.respondWith(
        fetch('/blog.html')
          .catch(() => {
            return caches.match('/blog.html');
          })
      );
      return;
    }
    
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline, serve cached version or offline page
          return caches.match('/') || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Handle all other requests with cache-first strategy
  // This ensures routines work offline - critical for special needs
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream
            const responseToCache = response.clone();

            // Add successful responses to cache for future offline use
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('Fetch failed, serving offline content:', error);
            
            // For failed requests, try to serve something useful from cache
            if (event.request.destination === 'image') {
              // Serve a default icon for failed image loads
              return caches.match('/icon-192.png');
            }
            
            // For other failed requests, let them fail gracefully
            throw error;
          });
      })
  );
});

// Background sync for Google Drive when connection restored
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync-drive') {
    console.log('Background sync triggered for Google Drive');
    event.waitUntil(
      // This would trigger a sync when connection is restored
      // The main app will handle the actual Drive sync
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'BACKGROUND_SYNC',
            action: 'sync-drive'
          });
        });
      })
    );
  }
});

// Handle push notifications (future feature for routine reminders)
self.addEventListener('push', event => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Time for your next routine activity!',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200], // Gentle vibration pattern
    tag: 'routine-reminder',
    requireInteraction: false, // Don't require user interaction (gentle approach)
    actions: [
      {
        action: 'view',
        title: 'Open StackMap',
        icon: '/icon-192.png'
      },
      {
        action: 'dismiss',
        title: 'Later',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('StackMap Routine Helper', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        // Check if app is already open
        for (let client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if not already open
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
  // 'dismiss' action just closes the notification (no action needed)
});