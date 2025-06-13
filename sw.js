// Service Worker for StackMap PWA
// Version: 1.2.2
// Last Updated: 2025-06-10

const CACHE_NAME = 'stackmap-v1.2.2-2025-06-12-preserve-scroll';
const RUNTIME_CACHE = 'stackmap-runtime';
const GOOGLE_FONTS_CACHE = 'stackmap-fonts';

// Core files that should always be cached
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Additional assets to cache
const STATIC_ASSETS = [
  '/app/StackMapApp.js',
  '/app/PreferencesManager.js',
  '/components.js',
  '/state.js',
  '/renderer.js',
  '/drive-sync.js',
  '/env-loader.js',
  '/data/default-activities.js',
  '/data/emoji-list.js',
  '/data/emoji-names.js',
  '/js/HybridPanelManager.js',
  '/js/CelebrationManager.js',
  '/components/DraggableDrawer.js',
  '/components/ModernDaySelector.js',
  '/components/ModernUserSelector.js',
  '/config/constants.js',
  '/config/index.js',
  '/config/themes.js',
  '/utils/security.js',
  // All CSS modules
  '/styles/index.css',
  '/styles/animations.css',
  '/styles/base.css',
  '/styles/buttons.css',
  '/styles/cards.css',
  '/styles/celebrations.css',
  '/styles/data-panel.css',
  '/styles/data-panel-animations.css',
  '/styles/draggable-drawer.css',
  '/styles/fab.css',
  '/styles/forms.css',
  '/styles/hybrid-panels.css',
  '/styles/layout.css',
  '/styles/modals.css',
  '/styles/responsive.css',
  '/styles/selectors.css',
  '/styles/splash-screen.css',
  '/styles/sync-modal.css',
  '/styles/utilities.css',
  '/styles/variables.css',
  // All icons
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-384.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  // console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // console.log('[SW] Caching core assets');
      return cache.addAll(CORE_ASSETS);
    }).then(() => {
      // Force the waiting service worker to become active
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  // console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old version caches but keep runtime and fonts caches
          if (cacheName.startsWith('stackmap-v') && cacheName !== CACHE_NAME) {
            // console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Cache additional static assets in background
      caches.open(CACHE_NAME).then((cache) => {
        cache.addAll(STATIC_ASSETS).catch((err) => {
          // console.log('[SW] Failed to cache some static assets:', err);
        });
      });
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle Google Fonts separately
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(handleGoogleFonts(request));
    return;
  }
  
  // Skip external requests (except fonts)
  if (url.origin !== location.origin) {
    return;
  }
  
  // Use stale-while-revalidate for all app resources
  event.respondWith(staleWhileRevalidate(request));
});

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch fresh version in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    // Update cache with fresh version if successful
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // If network fails and no cache, show offline page
    if (!cachedResponse && request.mode === 'navigate') {
      return cache.match('/offline.html');
    }
    return cachedResponse;
  });
  
  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Handle Google Fonts with long-term caching
async function handleGoogleFonts(request) {
  const cache = await caches.open(GOOGLE_FONTS_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // console.log('[SW] Font fetch failed:', error);
    return new Response('', { status: 404 });
  }
}

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for data persistence (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-user-data') {
    event.waitUntil(syncUserData());
  }
});

async function syncUserData() {
  // This would sync local changes to server when online
  // console.log('[SW] Background sync triggered');
  // Implementation would depend on your backend
}