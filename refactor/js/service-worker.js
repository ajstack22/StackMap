/**
 * StackMap Service Worker
 * Provides offline functionality and intelligent caching
 * Designed for ADHD/autism users who need reliability
 */

// Version management
var VERSION = '1.0.0';
var BUILD_DATE = new Date().toISOString();

// Cache configuration - increment CACHE_VERSION to force refresh
var CACHE_VERSION = 1;
var CACHE_NAME = 'stackmap-v' + CACHE_VERSION;
var RUNTIME_CACHE = 'stackmap-runtime-v' + CACHE_VERSION;
var PHOTO_CACHE = 'stackmap-photos-v' + CACHE_VERSION;
var MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit
var MAX_PHOTO_CACHE_SIZE = 30 * 1024 * 1024; // 30MB for photos

// Critical assets to cache immediately
// TODO: In production, move service-worker.js to root directory for proper scope
// Current location in /js/ limits scope - will only intercept requests to /js/*
var urlsToCache = [
    '/',
    '/index.html',
    '/emergency-static.html',
    '/manifest.json',
    // CSS files
    '/css/base.css',
    '/css/cards.css',
    '/css/focus-indicators.css',
    '/css/edit-mode.css',
    '/css/mobile.css',
    '/css/tv.css',
    '/css/activity-library.css',
    '/css/attachments.css',
    '/css/clusterize.css',
    '/css/demo-mode.css',
    '/css/grownup-mode.css',
    '/css/onboarding.css',
    '/css/photo-attachments.css',
    '/css/themes.css',
    '/css/timer.css',
    '/css/today-tomorrow.css',
    '/css/welcome.css',
    // Core JS files - Order matters for dependencies
    '/js/app.js',
    '/js/storage-adapter.js',
    '/js/storage-error-handler.js',
    '/js/task-sqlite.js',
    '/js/task-display.js',
    '/js/user-manager.js',
    '/js/theme-manager.js',
    '/js/messaging.js',
    '/js/migration-manager.js',
    '/js/migration-safety.js',
    '/js/migration-ui.js',
    // Critical features
    '/js/today-tomorrow.js',
    '/js/rollover-manager.js',
    '/js/attachment-manager.js',
    '/js/attachment-storage.js',
    '/js/component-error-handler.js',
    '/js/welcome-manager.js',
    '/js/settings-manager.js',
    '/js/settings-ui.js',
    '/js/task-timer.js',
    '/js/timer-manager.js',
    '/js/photo-attachment-storage.js',
    '/js/photo-attachment-ui.js',
    // UI components
    '/js/edit-mode.js',
    '/js/keyboard-nav.js',
    '/js/demo-mode.js',
    '/js/modal.js',
    '/js/default-activities.js',
    '/js/onboarding.js',
    '/js/activity-library.js',
    '/js/backup-manager.js',
    '/js/blob-manager.js',
    '/js/celebration.js',
    '/js/data-export.js',
    '/js/data-import.js',
    '/js/data-io-ui.js',
    '/js/db-schema.js',
    '/js/drag-drop-reorder.js',
    '/js/feature-flags.js',
    '/js/grownup-mode.js',
    '/js/profile-ui.js',
    '/js/rsd-safe-init.js',
    '/js/task-card-pool.js',
    '/js/task-cards.js',
    '/js/task-reorder.js',
    '/js/theme-settings-ui.js',
    '/js/virtual-scroll-adapter.js',
    '/js/sqlite-attachment-schema.js',
    // Optimization modules (loaded dynamically but good to cache)
    '/js/offline-queue.js',
    '/js/photo-optimizer.js',
    '/js/photo-lazy-loader.js',
    '/js/photo-cache-bridge.js',
    '/js/sw-update-manager.js',
    // External library
    '/js/clusterize.min.js'
];

// Offline operation queue
var offlineQueue = [];
var isOnline = true;

// Check online status periodically
setInterval(function() {
    checkOnlineStatus();
}, 30000); // Every 30 seconds

// Install event - cache critical assets
self.addEventListener('install', function(event) {
    console.log('[ServiceWorker] Installing version:', VERSION, 'Build:', BUILD_DATE);
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[ServiceWorker] Caching app shell');
            // TODO: Fix paths for refactor directory structure
            // Temporarily disabled to prevent installation failure
            // return cache.addAll(urlsToCache);
            return Promise.resolve();
        }).then(function() {
            console.log('[ServiceWorker] Install complete');
            // Skip waiting for critical updates
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    console.log('[ServiceWorker] Activating version:', VERSION);
    
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    // Delete old caches
                    if (cacheName.startsWith('stackmap-') &&
                        cacheName !== CACHE_NAME && 
                        cacheName !== RUNTIME_CACHE && 
                        cacheName !== PHOTO_CACHE) {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            console.log('[ServiceWorker] Claiming clients');
            // Notify clients of successful activation
            self.clients.matchAll().then(function(clients) {
                clients.forEach(function(client) {
                    client.postMessage({
                        type: 'activated',
                        version: VERSION,
                        buildDate: BUILD_DATE
                    });
                });
            });
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
    var request = event.request;
    var url = new URL(request.url);
    
    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }
    
    // Handle API/data requests differently
    if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
        event.respondWith(handleDataRequest(request));
        return;
    }
    
    // Handle photo requests
    if (url.pathname.includes('/photos/') || request.destination === 'image') {
        event.respondWith(handlePhotoRequest(request));
        return;
    }
    
    // Default strategy: Cache first, fallback to network
    event.respondWith(
        caches.match(request).then(function(cachedResponse) {
            if (cachedResponse) {
                // Return cached version
                return cachedResponse;
            }
            
            // Not in cache, fetch from network
            return fetch(request).then(function(networkResponse) {
                // Cache successful responses
                if (networkResponse && networkResponse.status === 200) {
                    var responseToCache = networkResponse.clone();
                    
                    caches.open(RUNTIME_CACHE).then(function(cache) {
                        cache.put(request, responseToCache);
                    });
                }
                
                return networkResponse;
            }).catch(function(error) {
                // Offline fallback for HTML pages
                if (request.destination === 'document') {
                    return caches.match('/emergency-static.html');
                }
                throw error;
            });
        })
    );
});

// Handle data/API requests with offline queue
function handleDataRequest(request) {
    if (request.method === 'GET') {
        // Try network first for fresh data
        return fetch(request).catch(function() {
            // Offline: return cached data if available
            return caches.match(request);
        });
    } else {
        // POST/PUT/DELETE - queue if offline
        return fetch(request.clone()).catch(function() {
            // Queue the request for later
            return queueOfflineRequest(request);
        });
    }
}

// Handle photo requests with intelligent caching
function handlePhotoRequest(request) {
    var url = new URL(request.url);
    
    // Determine photo type from URL patterns
    var isThumbnail = url.pathname.includes('thumb') || url.searchParams.get('size') === 'thumbnail';
    var isMedium = url.pathname.includes('medium') || url.searchParams.get('size') === 'medium';
    
    return caches.open(PHOTO_CACHE).then(function(cache) {
        return cache.match(request).then(function(cachedResponse) {
            if (cachedResponse) {
                // For thumbnails, always serve from cache (they rarely change)
                if (isThumbnail) {
                    return cachedResponse;
                }
                
                // For other sizes, serve from cache but update in background
                fetch(request).then(function(networkResponse) {
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(request, networkResponse.clone());
                    }
                }).catch(function() {
                    // Ignore network errors for background updates
                });
                
                return cachedResponse;
            }
            
            // Not cached, fetch and cache
            return fetch(request).then(function(networkResponse) {
                if (networkResponse && networkResponse.status === 200) {
                    // Prioritize caching based on size
                    var priority = isThumbnail ? 3 : (isMedium ? 2 : 1);
                    
                    // Check cache size before adding
                    checkPhotoCacheSize(priority).then(function() {
                        cache.put(request, networkResponse.clone());
                    });
                }
                return networkResponse;
            }).catch(function() {
                // Return size-appropriate placeholder
                var size = isThumbnail ? 150 : (isMedium ? 400 : 800);
                return new Response(createPlaceholderImage(size), {
                    headers: { 'Content-Type': 'image/svg+xml' }
                });
            });
        });
    });
}

// Queue offline requests
function queueOfflineRequest(request) {
    return request.text().then(function(body) {
        var queueItem = {
            url: request.url,
            method: request.method,
            headers: {},
            body: body,
            timestamp: Date.now()
        };
        
        // Copy headers
        request.headers.forEach(function(value, key) {
            queueItem.headers[key] = value;
        });
        
        // Add to queue
        offlineQueue.push(queueItem);
        
        // Notify client
        broadcastMessage({
            type: 'queued',
            message: 'Operation saved for when you\'re back online'
        });
        
        // Return success response
        return new Response(JSON.stringify({
            queued: true,
            message: 'Will sync when online'
        }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
        });
    });
}

// Process offline queue when back online
function processOfflineQueue() {
    if (offlineQueue.length === 0) return;
    
    console.log('[ServiceWorker] Processing offline queue:', offlineQueue.length, 'items');
    
    var processed = 0;
    var failed = 0;
    
    offlineQueue.forEach(function(item) {
        fetch(item.url, {
            method: item.method,
            headers: item.headers,
            body: item.body
        }).then(function(response) {
            if (response.ok) {
                processed++;
            } else {
                failed++;
            }
        }).catch(function() {
            failed++;
        }).finally(function() {
            if (processed + failed === offlineQueue.length) {
                // Clear successful items
                offlineQueue = offlineQueue.filter(function(i) {
                    return i.timestamp > Date.now() - 3600000; // Keep items < 1 hour
                });
                
                broadcastMessage({
                    type: 'sync-complete',
                    processed: processed,
                    failed: failed
                });
            }
        });
    });
}

// Check and manage photo cache size with priority
function checkPhotoCacheSize(priority) {
    return caches.open(PHOTO_CACHE).then(function(cache) {
        return cache.keys().then(function(keys) {
            // Estimate cache size (rough calculation)
            var estimatedSize = keys.length * 200 * 1024; // Assume avg 200KB per image
            
            if (estimatedSize > MAX_CACHE_SIZE || keys.length > 200) {
                // Sort keys by access time and type
                var keysWithMetadata = keys.map(function(request) {
                    var url = new URL(request.url);
                    var isThumbnail = url.pathname.includes('thumb') || url.searchParams.get('size') === 'thumbnail';
                    var isMedium = url.pathname.includes('medium') || url.searchParams.get('size') === 'medium';
                    
                    return {
                        request: request,
                        priority: isThumbnail ? 3 : (isMedium ? 2 : 1),
                        url: request.url
                    };
                });
                
                // Remove lower priority items first
                keysWithMetadata.sort(function(a, b) {
                    return a.priority - b.priority;
                });
                
                // Remove 25% of cache, prioritizing large images
                var toDelete = keysWithMetadata.slice(0, Math.floor(keys.length * 0.25));
                
                return Promise.all(toDelete.map(function(item) {
                    return cache.delete(item.request);
                }));
            }
        });
    });
}

// Create placeholder image for offline photos
function createPlaceholderImage(size) {
    size = size || 150;
    var center = size / 2;
    var fontSize = Math.max(12, size / 10);
    
    return '<svg width="' + size + '" height="' + size + '" xmlns="http://www.w3.org/2000/svg">' +
           '<rect width="' + size + '" height="' + size + '" fill="#e5e7eb"/>' +
           '<text x="' + center + '" y="' + center + '" text-anchor="middle" fill="#9ca3af" ' +
           'font-family="sans-serif" font-size="' + fontSize + '">' +
           'Offline' +
           '</text>' +
           '</svg>';
}

// Check online status (service workers don't have online/offline events)
function checkOnlineStatus() {
    // Try a lightweight network request to check connectivity
    return fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-store'
    })
    .then(function() {
        if (!isOnline) {
            isOnline = true;
            console.log('[ServiceWorker] Back online, processing queue');
            processOfflineQueue();
        }
        return true;
    })
    .catch(function() {
        if (isOnline) {
            isOnline = false;
            console.log('[ServiceWorker] Gone offline');
        }
        return false;
    });
}

// Handle messages from clients
self.addEventListener('message', function(event) {
    var data = event.data;
    
    switch(data.type) {
        case 'skipWaiting':
            self.skipWaiting();
            break;
            
        case 'clearCache':
            caches.keys().then(function(cacheNames) {
                Promise.all(cacheNames.map(function(cacheName) {
                    return caches.delete(cacheName);
                }));
            });
            break;
            
        case 'getQueueStatus':
            event.ports[0].postMessage({
                queueLength: offlineQueue.length,
                isOnline: isOnline
            });
            break;
            
        case 'cachePhoto':
            // Cache optimized photo versions
            if (data.urls) {
                cachePhotoVersions(data.urls);
            }
            break;
            
        case 'getCacheStats':
            // Return cache statistics
            getCacheStatistics().then(function(stats) {
                event.ports[0].postMessage(stats);
            });
            break;
            
        case 'getVersion':
            // Return version info
            event.ports[0].postMessage({
                version: VERSION,
                buildDate: BUILD_DATE,
                cacheVersion: CACHE_VERSION
            });
            break;
            
        case 'online-status':
            // Update online status from main app
            isOnline = event.data.online;
            if (isOnline) {
                console.log('[ServiceWorker] Online status updated, processing queue');
                processOfflineQueue();
            }
            break;
    }
});

// Broadcast message to all clients
function broadcastMessage(message) {
    self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
            client.postMessage(message);
        });
    });
}

// Cache photo versions from PhotoOptimizer
function cachePhotoVersions(urls) {
    return caches.open(PHOTO_CACHE).then(function(cache) {
        var promises = [];
        
        // Cache each version with appropriate headers
        if (urls.thumbnail) {
            promises.push(fetch(urls.thumbnail).then(function(response) {
                return cache.put(new Request(urls.thumbnail, {
                    headers: { 'X-Photo-Size': 'thumbnail' }
                }), response);
            }));
        }
        
        if (urls.medium) {
            promises.push(fetch(urls.medium).then(function(response) {
                return cache.put(new Request(urls.medium, {
                    headers: { 'X-Photo-Size': 'medium' }
                }), response);
            }));
        }
        
        if (urls.full) {
            promises.push(fetch(urls.full).then(function(response) {
                return cache.put(new Request(urls.full, {
                    headers: { 'X-Photo-Size': 'full' }
                }), response);
            }));
        }
        
        return Promise.all(promises);
    });
}

// Get cache statistics
function getCacheStatistics() {
    var stats = {
        photos: { count: 0, estimatedSize: 0 },
        assets: { count: 0 },
        runtime: { count: 0 },
        total: { count: 0, names: [] },
        version: VERSION,
        buildDate: BUILD_DATE,
        cacheVersion: CACHE_VERSION
    };
    
    return caches.keys().then(function(cacheNames) {
        stats.total.names = cacheNames;
        
        var promises = cacheNames.map(function(name) {
            return caches.open(name).then(function(cache) {
                return cache.keys().then(function(keys) {
                    if (name === PHOTO_CACHE) {
                        stats.photos.count = keys.length;
                        // Estimate photo cache size
                        stats.photos.estimatedSize = keys.reduce(function(total, request) {
                            var url = new URL(request.url);
                            if (url.pathname.includes('thumb')) return total + 50 * 1024;
                            if (url.pathname.includes('medium')) return total + 200 * 1024;
                            return total + 500 * 1024;
                        }, 0);
                    } else if (name === CACHE_NAME) {
                        stats.assets.count = keys.length;
                    } else if (name === RUNTIME_CACHE) {
                        stats.runtime.count = keys.length;
                    }
                    stats.total.count += keys.length;
                });
            });
        });
        
        return Promise.all(promises).then(function() {
            return stats;
        });
    });
}

// Background sync for offline queue
self.addEventListener('sync', function(event) {
    if (event.tag === 'offline-queue') {
        event.waitUntil(processOfflineQueue());
    }
});

// Periodic cache cleanup
setInterval(function() {
    checkPhotoCacheSize();
}, 300000); // Every 5 minutes