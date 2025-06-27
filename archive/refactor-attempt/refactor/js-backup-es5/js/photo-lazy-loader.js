/**
 * Photo Lazy Loader
 * Implements viewport-based progressive image loading
 * Optimized for memory-constrained devices
 */

(function() {
    'use strict';
    
    const PhotoLazyLoader = {
        // Configuration
        config: {
            rootMargin: '50px', // Start loading 50px before visible
            threshold: 0.01,
            fadeInDuration: 300,
            blurRadius: 20,
            maxConcurrentLoads: 2
        },
        
        // State
        observer: null,
        loadingQueue: [],
        activeLoads: 0,
        loadedImages: new Set(),
        
        /**
         * Initialize lazy loader
         */
        init: function() {
            const self = this;
            
            // Check for IntersectionObserver support
            if (!('IntersectionObserver' in window)) {
                console.warn('IntersectionObserver not supported, loading all images');
                self.loadAllImages();
                return;
            }
            
            // Create observer
            self.observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        self.queueImageLoad(entry.target);
                    }
                });
            }, {
                rootMargin: self.config.rootMargin,
                threshold: self.config.threshold
            });
            
            // Start observing existing images
            self.observeImages();
            
            // Watch for new images
            self.watchForNewImages();
        },
        
        /**
         * Observe all lazy images
         */
        observeImages: function() {
            const self = this;
            const images = document.querySelectorAll('[data-lazy-src]');
            
            images.forEach(function(img) {
                if (!self.loadedImages.has(img)) {
                    self.observer.observe(img);
                    self.setupPlaceholder(img);
                }
            });
        },
        
        /**
         * Setup placeholder with blur effect
         */
        setupPlaceholder: function(img) {
            const self = this;
            
            // Get thumbnail source
            const thumbnailSrc = img.getAttribute('data-lazy-thumbnail');
            if (!thumbnailSrc) return;
            
            // Create wrapper if needed
            let wrapper = img.parentElement;
            if (!wrapper.classList.contains('lazy-image-wrapper')) {
                wrapper = document.createElement('div');
                wrapper.className = 'lazy-image-wrapper';
                wrapper.style.cssText = 'position:relative;overflow:hidden;' +
                    'background:#f3f4f6;display:inline-block;';
                
                img.parentNode.insertBefore(wrapper, img);
                wrapper.appendChild(img);
            }
            
            // Set thumbnail as background with blur
            wrapper.style.backgroundImage = `url(${thumbnailSrc})`;
            wrapper.style.backgroundSize = 'cover';
            wrapper.style.backgroundPosition = 'center';
            wrapper.style.filter = `blur(${self.config.blurRadius}px)`;
            
            // Hide main image until loaded
            img.style.opacity = '0';
            img.style.transition = `opacity ${self.config.fadeInDuration}ms ease-in-out`;
        },
        
        /**
         * Queue image for loading
         */
        queueImageLoad: function(img) {
            const self = this;
            
            // Skip if already loaded or queued
            if (self.loadedImages.has(img) || 
                self.loadingQueue.some(function(item) { return item.img === img; })) {
                return;
            }
            
            // Stop observing this image
            self.observer.unobserve(img);
            
            // Add to queue
            self.loadingQueue.push({
                img: img,
                priority: self.calculatePriority(img)
            });
            
            // Sort by priority
            self.loadingQueue.sort(function(a, b) {
                return b.priority - a.priority;
            });
            
            // Process queue
            self.processLoadingQueue();
        },
        
        /**
         * Calculate loading priority based on position
         */
        calculatePriority: function(img) {
            const rect = img.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Higher priority for images closer to viewport center
            const centerY = viewportHeight / 2;
            const centerX = viewportWidth / 2;
            
            const distanceY = Math.abs(rect.top + rect.height / 2 - centerY);
            const distanceX = Math.abs(rect.left + rect.width / 2 - centerX);
            
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            // Normalize to 0-100 scale (closer = higher priority)
            const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
            return Math.round((1 - distance / maxDistance) * 100);
        },
        
        /**
         * Process loading queue
         */
        processLoadingQueue: function() {
            const self = this;
            
            while (self.activeLoads < self.config.maxConcurrentLoads && 
                   self.loadingQueue.length > 0) {
                const item = self.loadingQueue.shift();
                self.loadImage(item.img);
            }
        },
        
        /**
         * Load image progressively
         */
        loadImage: function(img) {
            const self = this;
            self.activeLoads++;
            
            const sources = {
                thumbnail: img.getAttribute('data-lazy-thumbnail'),
                medium: img.getAttribute('data-lazy-medium'),
                full: img.getAttribute('data-lazy-src')
            };
            
            // Determine which size to load based on display size
            const displayWidth = img.offsetWidth || parseInt(img.getAttribute('width')) || 300;
            let srcToLoad = sources.full;
            
            if (displayWidth <= 200 && sources.medium) {
                srcToLoad = sources.medium;
            }
            
            // Load the image
            const tempImg = new Image();
            
            tempImg.onload = function() {
                self.onImageLoaded(img, tempImg.src);
                self.activeLoads--;
                self.processLoadingQueue();
            };
            
            tempImg.onerror = function() {
                self.onImageError(img);
                self.activeLoads--;
                self.processLoadingQueue();
            };
            
            tempImg.src = srcToLoad;
        },
        
        /**
         * Handle successful image load
         */
        onImageLoaded: function(img, src) {
            const self = this;
            
            // Set source
            img.src = src;
            
            // Remove lazy attributes
            img.removeAttribute('data-lazy-src');
            img.removeAttribute('data-lazy-medium');
            img.removeAttribute('data-lazy-thumbnail');
            
            // Fade in
            requestAnimationFrame(function() {
                img.style.opacity = '1';
                
                // Remove blur from wrapper after fade
                const wrapper = img.parentElement;
                if (wrapper && wrapper.classList.contains('lazy-image-wrapper')) {
                    setTimeout(function() {
                        wrapper.style.filter = 'none';
                        wrapper.style.backgroundImage = 'none';
                    }, self.config.fadeInDuration);
                }
            });
            
            // Mark as loaded
            self.loadedImages.add(img);
            
            // Dispatch event
            img.dispatchEvent(new CustomEvent('lazyloaded', {
                detail: { src: src }
            }));
        },
        
        /**
         * Handle image load error
         */
        onImageError: function(img) {
            const self = this;
            
            // Show error placeholder
            img.src = `data:image/svg+xml;base64,${btoa(
    '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="200" height="200" fill="#f3f4f6"/>' +
    '<text x="100" y="100" text-anchor="middle" fill="#9ca3af" ' +
    'font-family="sans-serif" font-size="14">Image unavailable</text>' +
    '</svg>'
)}`;
            
            // Fade in even for error
            img.style.opacity = '1';
            
            // Mark as loaded (to prevent retry)
            self.loadedImages.add(img);
            
            // Dispatch error event
            img.dispatchEvent(new CustomEvent('lazyerror'));
        },
        
        /**
         * Watch for dynamically added images
         */
        watchForNewImages: function() {
            const self = this;
            
            // Use MutationObserver if available
            if ('MutationObserver' in window) {
                const observer = new MutationObserver(function(mutations) {
                    let hasNewImages = false;
                    
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach(function(node) {
                                if (node.nodeType === 1) { // Element node
                                    if (node.hasAttribute('data-lazy-src') ||
                                        node.querySelector('[data-lazy-src]')) {
                                        hasNewImages = true;
                                    }
                                }
                            });
                        }
                    });
                    
                    if (hasNewImages) {
                        self.observeImages();
                    }
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        },
        
        /**
         * Load all images (fallback for no IntersectionObserver)
         */
        loadAllImages: function() {
            const self = this;
            const images = document.querySelectorAll('[data-lazy-src]');
            
            images.forEach(function(img) {
                const src = img.getAttribute('data-lazy-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-lazy-src');
                }
            });
        },
        
        /**
         * Force load specific image
         */
        loadImage: function(img) {
            const self = this;
            
            if (img && img.hasAttribute('data-lazy-src')) {
                self.queueImageLoad(img);
            }
        },
        
        /**
         * Update observer configuration
         */
        updateConfig: function(newConfig) {
            const self = this;
            
            Object.assign(self.config, newConfig);
            
            // Recreate observer with new config
            if (self.observer) {
                self.observer.disconnect();
                self.init();
            }
        },
        
        /**
         * Get loading statistics
         */
        getStats: function() {
            const self = this;
            
            return {
                loaded: self.loadedImages.size,
                queued: self.loadingQueue.length,
                active: self.activeLoads,
                observed: document.querySelectorAll('[data-lazy-src]').length
            };
        },
        
        /**
         * Pause loading
         */
        pause: function() {
            const self = this;
            
            if (self.observer) {
                self.observer.disconnect();
            }
        },
        
        /**
         * Resume loading
         */
        resume: function() {
            const self = this;
            
            self.observeImages();
            self.processLoadingQueue();
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            PhotoLazyLoader.init();
        });
    } else {
        PhotoLazyLoader.init();
    }
    
    // Expose API
    window.PhotoLazyLoader = PhotoLazyLoader;
})();