/**
 * Photo Viewer Component
 * Full-screen photo viewing with ADHD-optimized controls
 * Tap-based zoom, large buttons, swipe navigation
 */

(function(exports) {
    'use strict';
    
    // Configuration
    const VIEWER_CONFIG = {
        ZOOM_LEVELS: [1, 1.5, 2, 3],
        ZOOM_BUTTON_SIZE: 48,
        CLOSE_BUTTON_SIZE: 60,
        SWIPE_THRESHOLD: 50,
        ANIMATION_DURATION: 200
    };
    
    // Photo Viewer Constructor
    const PhotoViewer = function(options) {
        this.options = options || {};
        this.photos = [];
        this.currentIndex = 0;
        this.currentZoomIndex = 0;
        this.viewer = null;
        this.imageContainer = null;
        this.currentImage = null;
        this.isOpen = false;
        
        // Callbacks
        this.onClose = options.onClose || function() {};
        this.onPhotoChange = options.onPhotoChange || function() {};
        
        // Bind methods
        this._handleKeydown = this._handleKeydown.bind(this);
        this._handleResize = this._handleResize.bind(this);
    };
    
    PhotoViewer.prototype = {
        // Open viewer with photos
        open: function(photos, startIndex) {
            if (this.isOpen) return;
            
            this.photos = photos || [];
            this.currentIndex = startIndex || 0;
            this.currentZoomIndex = 0;
            this.isOpen = true;
            
            // Create viewer UI
            this._createViewer();
            
            // Load current photo
            this._loadPhoto(this.currentIndex);
            
            // Add event listeners
            this._attachEvents();
            
            // Focus for keyboard navigation
            this.viewer.focus();
        },
        
        // Close viewer
        close: function() {
            if (!this.isOpen) return;
            
            this.isOpen = false;
            
            // Remove event listeners
            this._detachEvents();
            
            // Remove viewer from DOM
            if (this.viewer && this.viewer.parentNode) {
                document.body.removeChild(this.viewer);
            }
            
            // Clear references
            this.viewer = null;
            this.imageContainer = null;
            this.currentImage = null;
            
            // Callback
            this.onClose();
        },
        
        // Create viewer DOM structure
        _createViewer: function() {
            const self = this;
            
            // Main container
            this.viewer = document.createElement('div');
            this.viewer.className = 'photo-viewer';
            this.viewer.setAttribute('role', 'dialog');
            this.viewer.setAttribute('aria-label', 'Photo viewer');
            this.viewer.setAttribute('tabindex', '-1');
            
            // Image container
            this.imageContainer = document.createElement('div');
            this.imageContainer.className = 'photo-viewer-image-container';
            
            // Current image
            this.currentImage = document.createElement('img');
            this.currentImage.className = 'photo-viewer-image';
            this.currentImage.style.transform = 'scale(1)';
            
            this.imageContainer.appendChild(this.currentImage);
            
            // Navigation dots (if multiple photos)
            if (this.photos.length > 1) {
                const dots = this._createNavigationDots();
                this.imageContainer.appendChild(dots);
            }
            
            // Zoom controls
            const zoomControls = this._createZoomControls();
            this.imageContainer.appendChild(zoomControls);
            
            this.viewer.appendChild(this.imageContainer);
            
            // Caption display
            this.captionDisplay = document.createElement('div');
            this.captionDisplay.className = 'photo-viewer-caption';
            this.viewer.appendChild(this.captionDisplay);
            
            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'photo-viewer-close';
            closeBtn.setAttribute('aria-label', 'Close viewer');
            closeBtn.innerHTML = '×';
            
            if (window.PhotoTouchHandler) {
                window.PhotoTouchHandler.addTapHandler(closeBtn, function() {
                    self.close();
                });
            } else {
                closeBtn.addEventListener('click', function() {
                    self.close();
                });
            }
            
            this.viewer.appendChild(closeBtn);
            
            // Navigation buttons (if multiple photos)
            if (this.photos.length > 1) {
                this._createNavigationButtons();
            }
            
            // Add swipe support
            this._setupSwipeNavigation();
            
            // Add to body
            document.body.appendChild(this.viewer);
        },
        
        // Create zoom controls
        _createZoomControls: function() {
            const self = this;
            const controls = document.createElement('div');
            controls.className = 'zoom-controls';
            
            // Zoom in button
            const zoomIn = document.createElement('button');
            zoomIn.className = 'zoom-in';
            zoomIn.setAttribute('aria-label', 'Zoom in');
            zoomIn.innerHTML = '+';
            
            // Zoom out button
            const zoomOut = document.createElement('button');
            zoomOut.className = 'zoom-out';
            zoomOut.setAttribute('aria-label', 'Zoom out');
            zoomOut.innerHTML = '−';
            
            // Add handlers
            if (window.PhotoTouchHandler) {
                window.PhotoTouchHandler.addTapHandler(zoomIn, function() {
                    self._zoomIn();
                });
                
                window.PhotoTouchHandler.addTapHandler(zoomOut, function() {
                    self._zoomOut();
                });
            } else {
                zoomIn.addEventListener('click', function() {
                    self._zoomIn();
                });
                
                zoomOut.addEventListener('click', function() {
                    self._zoomOut();
                });
            }
            
            controls.appendChild(zoomIn);
            controls.appendChild(zoomOut);
            
            return controls;
        },
        
        // Create navigation dots
        _createNavigationDots: function() {
            const self = this;
            const dotsContainer = document.createElement('div');
            dotsContainer.className = 'photo-viewer-dots';
            
            for (let i = 0; i < this.photos.length; i++) {
                const dot = document.createElement('button');
                dot.className = 'photo-viewer-dot';
                dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
                dot.setAttribute('data-index', i);
                
                if (i === this.currentIndex) {
                    dot.classList.add('active');
                }
                
                (function(index) {
                    if (window.PhotoTouchHandler) {
                        window.PhotoTouchHandler.addTapHandler(dot, function() {
                            self._goToPhoto(index);
                        });
                    } else {
                        dot.addEventListener('click', function() {
                            self._goToPhoto(index);
                        });
                    }
                })(i);
                
                dotsContainer.appendChild(dot);
            }
            
            return dotsContainer;
        },
        
        // Create navigation buttons
        _createNavigationButtons: function() {
            const self = this;
            
            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'photo-viewer-nav photo-viewer-prev';
            prevBtn.setAttribute('aria-label', 'Previous photo');
            prevBtn.innerHTML = '‹';
            
            if (window.PhotoTouchHandler) {
                window.PhotoTouchHandler.addTapHandler(prevBtn, function() {
                    self._previousPhoto();
                });
            } else {
                prevBtn.addEventListener('click', function() {
                    self._previousPhoto();
                });
            }
            
            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'photo-viewer-nav photo-viewer-next';
            nextBtn.setAttribute('aria-label', 'Next photo');
            nextBtn.innerHTML = '›';
            
            if (window.PhotoTouchHandler) {
                window.PhotoTouchHandler.addTapHandler(nextBtn, function() {
                    self._nextPhoto();
                });
            } else {
                nextBtn.addEventListener('click', function() {
                    self._nextPhoto();
                });
            }
            
            this.viewer.appendChild(prevBtn);
            this.viewer.appendChild(nextBtn);
        },
        
        // Setup swipe navigation
        _setupSwipeNavigation: function() {
            const self = this;
            let startX = 0;
            let startY = 0;
            let startTime = 0;
            
            this.imageContainer.addEventListener('touchstart', function(e) {
                const touch = e.changedTouches[0];
                startX = touch.pageX;
                startY = touch.pageY;
                startTime = Date.now();
            });
            
            this.imageContainer.addEventListener('touchend', function(e) {
                const touch = e.changedTouches[0];
                const deltaX = touch.pageX - startX;
                const deltaY = touch.pageY - startY;
                const deltaTime = Date.now() - startTime;
                
                // Quick swipe or long swipe
                const threshold = deltaTime < 300 ? 30 : VIEWER_CONFIG.SWIPE_THRESHOLD;
                
                // Horizontal swipe detection
                if (Math.abs(deltaX) > threshold && Math.abs(deltaY) < threshold) {
                    if (deltaX > 0) {
                        self._previousPhoto();
                    } else {
                        self._nextPhoto();
                    }
                }
            });
        },
        
        // Load photo by index
        _loadPhoto: function(index) {
            if (index < 0 || index >= this.photos.length) return;
            
            const self = this;
            const photo = this.photos[index];
            
            // Update current index
            this.currentIndex = index;
            
            // Reset zoom
            this.currentZoomIndex = 0;
            this._updateZoom();
            
            // Show loading state
            this.currentImage.style.opacity = '0';
            this.imageContainer.classList.add('photo-skeleton');
            
            // Update image source
            const sources = [];
            if (photo.fullUrl) sources.push(photo.fullUrl);
            if (photo.mediumUrl) sources.push(photo.mediumUrl);
            if (photo.localUri) sources.push(photo.localUri);
            
            let currentSourceIndex = 0;
            
            function tryNextSource() {
                if (currentSourceIndex >= sources.length) {
                    // All sources failed
                    self.imageContainer.classList.remove('photo-skeleton');
                    self.currentImage.alt = 'Failed to load photo';
                    return;
                }
                
                self.currentImage.src = sources[currentSourceIndex];
                currentSourceIndex++;
            }
            
            this.currentImage.onload = function() {
                // Success
                self.imageContainer.classList.remove('photo-skeleton');
                self.currentImage.style.transition = 'opacity 300ms ease-in';
                self.currentImage.style.opacity = '1';
                
                // Update alt text
                self.currentImage.alt = self._getPhotoDescription(photo);
            };
            
            this.currentImage.onerror = function() {
                tryNextSource();
            };
            
            // Start loading
            tryNextSource();
            
            // Update caption
            this._updateCaption(photo);
            
            // Update navigation dots
            this._updateNavigationDots();
            
            // Preload adjacent photos
            this._preloadAdjacent();
            
            // Callback
            this.onPhotoChange(photo, index);
        },
        
        // Navigate to specific photo
        _goToPhoto: function(index) {
            if (index !== this.currentIndex) {
                this._loadPhoto(index);
            }
        },
        
        // Previous photo
        _previousPhoto: function() {
            if (this.currentIndex > 0) {
                this._loadPhoto(this.currentIndex - 1);
            } else if (this.photos.length > 1) {
                // Wrap to last photo
                this._loadPhoto(this.photos.length - 1);
            }
        },
        
        // Next photo
        _nextPhoto: function() {
            if (this.currentIndex < this.photos.length - 1) {
                this._loadPhoto(this.currentIndex + 1);
            } else if (this.photos.length > 1) {
                // Wrap to first photo
                this._loadPhoto(0);
            }
        },
        
        // Zoom in
        _zoomIn: function() {
            if (this.currentZoomIndex < VIEWER_CONFIG.ZOOM_LEVELS.length - 1) {
                this.currentZoomIndex++;
                this._updateZoom();
            }
        },
        
        // Zoom out
        _zoomOut: function() {
            if (this.currentZoomIndex > 0) {
                this.currentZoomIndex--;
                this._updateZoom();
            }
        },
        
        // Update zoom level
        _updateZoom: function() {
            const scale = VIEWER_CONFIG.ZOOM_LEVELS[this.currentZoomIndex];
            this.currentImage.style.transform = `scale(${scale})`;
        },
        
        // Update caption display
        _updateCaption: function(photo) {
            if (photo.caption) {
                this.captionDisplay.textContent = photo.caption;
                this.captionDisplay.style.display = 'block';
            } else {
                this.captionDisplay.style.display = 'none';
            }
        },
        
        // Update navigation dots
        _updateNavigationDots: function() {
            const dots = this.viewer.querySelectorAll('.photo-viewer-dot');
            for (let i = 0; i < dots.length; i++) {
                if (i === this.currentIndex) {
                    dots[i].classList.add('active');
                } else {
                    dots[i].classList.remove('active');
                }
            }
        },
        
        // Preload adjacent photos
        _preloadAdjacent: function() {
            const self = this;
            
            // Preload next photo
            if (this.currentIndex < this.photos.length - 1) {
                this._preloadPhoto(this.currentIndex + 1);
            }
            
            // Preload previous photo
            if (this.currentIndex > 0) {
                this._preloadPhoto(this.currentIndex - 1);
            }
        },
        
        // Preload a single photo
        _preloadPhoto: function(index) {
            if (index < 0 || index >= this.photos.length) return;
            
            const photo = this.photos[index];
            const img = new Image();
            
            // Try to preload best quality available
            if (photo.fullUrl) {
                img.src = photo.fullUrl;
            } else if (photo.mediumUrl) {
                img.src = photo.mediumUrl;
            } else if (photo.localUri) {
                img.src = photo.localUri;
            }
        },
        
        // Get photo description
        _getPhotoDescription: function(photo) {
            const parts = [];
            
            // Category
            if (photo.category && window.PHOTO_CATEGORIES) {
                const category = window.PHOTO_CATEGORIES[photo.category];
                if (category) parts.push(category.label);
            } else {
                parts.push('Photo');
            }
            
            // Caption
            if (photo.caption) {
                parts.push(photo.caption);
            }
            
            // Position in set
            parts.push(`${this.currentIndex + 1} of ${this.photos.length}`);
            
            return parts.join(', ');
        },
        
        // Attach global events
        _attachEvents: function() {
            document.addEventListener('keydown', this._handleKeydown);
            window.addEventListener('resize', this._handleResize);
        },
        
        // Detach global events
        _detachEvents: function() {
            document.removeEventListener('keydown', this._handleKeydown);
            window.removeEventListener('resize', this._handleResize);
        },
        
        // Handle keyboard navigation
        _handleKeydown: function(e) {
            switch(e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this._previousPhoto();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this._nextPhoto();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    this._zoomIn();
                    break;
                case '-':
                case '_':
                    e.preventDefault();
                    this._zoomOut();
                    break;
            }
        },
        
        // Handle window resize
        _handleResize: function() {
            // Reset zoom on resize to prevent image going off-screen
            if (this.currentZoomIndex > 1) {
                this.currentZoomIndex = 0;
                this._updateZoom();
            }
        }
    };
    
    // Export
    exports.PhotoViewer = PhotoViewer;
    
})(window);