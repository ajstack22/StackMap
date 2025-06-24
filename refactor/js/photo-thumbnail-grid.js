/**
 * Photo Thumbnail Grid Component
 * Displays photos in optimized 3x2 grid with 64x64px thumbnails
 * Implements ADHD-friendly UI with proper touch targets
 */

(function(exports) {
    'use strict';
    
    // Configuration
    const GRID_CONFIG = {
        MAX_VISIBLE: 6,        // Maximum photos shown
        COLUMNS: 3,            // Grid columns
        ROWS: 2,              // Grid rows
        THUMBNAIL_SIZE: 64,    // Thumbnail size in pixels
        TOUCH_TARGET: 48,     // Minimum touch target
        SPACING: 16           // Grid spacing
    };
    
    // Touch handler for cross-browser compatibility
    const TouchHandler = {
        addTapHandler: function(element, handler) {
            let touched = false;
            
            // Touch events
            element.addEventListener('touchstart', function(e) {
                touched = true;
                e.preventDefault(); // Prevent ghost clicks
            });
            
            element.addEventListener('touchend', function(e) {
                if (touched) {
                    handler(e);
                    touched = false;
                }
            });
            
            // Mouse events as fallback
            element.addEventListener('click', function(e) {
                if (!touched) {
                    handler(e);
                }
            });
            
            // Pointer events for modern browsers
            if (window.PointerEvent) {
                element.addEventListener('pointerdown', function(e) {
                    if (e.pointerType === 'touch') {
                        touched = true;
                        e.preventDefault();
                    }
                });
            }
        }
    };
    
    // Photo states helper
    const PhotoStates = {
        // Create loading placeholder
        createLoadingElement: function() {
            const element = document.createElement('div');
            element.className = 'photo-item photo-skeleton';
            element.innerHTML = '<div class="photo-loading-text">Loading...</div>';
            return element;
        },
        
        // Create error placeholder
        createErrorElement: function(error) {
            const element = document.createElement('div');
            element.className = 'photo-item photo-error';
            element.setAttribute('role', 'img');
            element.setAttribute('aria-label', 'Failed to load photo');
            
            const errorText = document.createElement('div');
            errorText.textContent = 'Failed';
            element.appendChild(errorText);
            
            // Retry button
            const retryBtn = document.createElement('button');
            retryBtn.className = 'photo-retry-button';
            retryBtn.textContent = 'Retry';
            retryBtn.setAttribute('aria-label', 'Retry loading photo');
            
            element.appendChild(retryBtn);
            
            return element;
        },
        
        // Handle image load errors with retry logic
        handleImageError: function(img, photo, onRetry) {
            const self = this;
            let retryCount = 0;
            const maxRetries = 3;
            
            function attemptLoad() {
                retryCount++;
                
                // Try medium size on first retry
                if (retryCount === 1 && photo.mediumUrl) {
                    img.src = photo.mediumUrl;
                }
                // Try thumbnail on second retry
                else if (retryCount === 2 && photo.thumbnailUrl) {
                    img.src = photo.thumbnailUrl;
                }
                // Show error state
                else if (retryCount >= maxRetries) {
                    const errorElement = self.createErrorElement();
                    img.parentNode.replaceChild(errorElement, img);
                    
                    // Setup retry handler
                    const retryBtn = errorElement.querySelector('.photo-retry-button');
                    TouchHandler.addTapHandler(retryBtn, function() {
                        if (onRetry) onRetry();
                    });
                }
            }
            
            function setupImageHandlers(image) {
                image.onerror = attemptLoad;
                image.onload = function() {
                    // Success - remove skeleton
                    const container = image.parentNode;
                    if (container && container.classList.contains('photo-skeleton')) {
                        container.classList.remove('photo-skeleton');
                    }
                };
            }
            
            setupImageHandlers(img);
            return attemptLoad;
        }
    };
    
    // Photo Thumbnail Grid Constructor
    const PhotoThumbnailGrid = function(container, options) {
        this.container = container;
        this.options = options || {};
        this.photos = [];
        this.onPhotoTap = options.onPhotoTap || function() {};
        this.onAddPhoto = options.onAddPhoto || function() {};
        this.onPhotoAction = options.onPhotoAction || function() {};
    };
    
    PhotoThumbnailGrid.prototype = {
        // Create the grid with photos
        createGrid: function(photos, maxPhotos) {
            const self = this;
            maxPhotos = maxPhotos || GRID_CONFIG.MAX_VISIBLE;
            
            // Clear existing content
            this.container.innerHTML = '';
            this.container.className = 'photo-grid';
            
            // Store photos
            this.photos = photos || [];
            
            // Check if we should use progressive disclosure
            let useProgressive = false;
            let visibleLimit = maxPhotos;
            
            if (window.PhotoDensityControl) {
                visibleLimit = window.PhotoDensityControl.getVisibleLimit();
                useProgressive = window.PhotoDensityControl.shouldShowProgressive(this.photos.length);
                
                if (useProgressive) {
                    maxPhotos = Math.min(visibleLimit, maxPhotos);
                }
            }
            
            // Render visible photos
            const visiblePhotos = this.photos.slice(0, maxPhotos);
            visiblePhotos.forEach(function(photo, index) {
                const element = self.createThumbnail(photo, index);
                self.container.appendChild(element);
            });
            
            // Add placeholders for empty slots (only if not using progressive)
            if (!useProgressive) {
                const emptySlots = Math.min(maxPhotos - visiblePhotos.length, 
                                         GRID_CONFIG.MAX_VISIBLE - visiblePhotos.length);
                
                for (let i = 0; i < emptySlots; i++) {
                    const placeholder = self.createPlaceholder();
                    self.container.appendChild(placeholder);
                }
            }
            
            // Add progressive disclosure controls if needed
            if (useProgressive && window.PhotoDensityControl) {
                const progressiveUI = window.PhotoDensityControl.createProgressiveUI(
                    this.container.parentNode,
                    this.photos,
                    this
                );
                
                if (progressiveUI) {
                    this.container.appendChild(progressiveUI);
                }
            } else if (this.photos.length > maxPhotos) {
                // Show simple overflow indicator
                const overflow = this.createOverflowIndicator(this.photos.length - maxPhotos);
                self.container.appendChild(overflow);
            }
            
            return this.container;
        },
        
        // Create individual thumbnail
        createThumbnail: function(photo, index) {
            const self = this;
            const isPrimary = index === 0;
            
            // Container
            const element = document.createElement('div');
            element.className = `photo-item${isPrimary ? ' photo-primary' : ''}`;
            element.setAttribute('data-photo-id', photo.id);
            
            // Initially show skeleton
            element.classList.add('photo-skeleton');
            
            // Thumbnail container
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'photo-thumbnail-container';
            
            // Apply category color
            if (photo.category && window.PHOTO_CATEGORIES) {
                const category = window.PHOTO_CATEGORIES[photo.category];
                if (category) {
                    thumbnailContainer.style.borderColor = category.color;
                    thumbnailContainer.setAttribute('data-category', photo.category);
                }
            }
            
            // Thumbnail image
            const thumbnail = document.createElement('img');
            thumbnail.className = 'photo-thumbnail';
            thumbnail.alt = this._getPhotoDescription(photo);
            thumbnail.setAttribute('role', 'img');
            
            // Touch target overlay
            const touchTarget = document.createElement('div');
            touchTarget.className = 'photo-touch-target';
            touchTarget.setAttribute('role', 'button');
            touchTarget.setAttribute('tabindex', '0');
            touchTarget.setAttribute('aria-label', `View ${thumbnail.alt}`);
            
            // Add tap handler
            TouchHandler.addTapHandler(touchTarget, function() {
                self.onPhotoTap(photo, index);
            });
            
            // Keyboard support
            touchTarget.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    self.onPhotoTap(photo, index);
                }
            });
            
            thumbnailContainer.appendChild(thumbnail);
            thumbnailContainer.appendChild(touchTarget);
            element.appendChild(thumbnailContainer);
            
            // Load image
            this._loadThumbnail(thumbnail, photo, element);
            
            // Caption if exists
            if (photo.caption) {
                const caption = document.createElement('div');
                caption.className = 'photo-caption-display';
                caption.textContent = photo.caption;
                element.appendChild(caption);
            }
            
            // Action buttons
            const actions = this._createActions(photo);
            element.appendChild(actions);
            
            return element;
        },
        
        // Create placeholder for empty slot
        createPlaceholder: function() {
            const self = this;
            const placeholder = document.createElement('div');
            placeholder.className = 'photo-placeholder';
            
            const addButton = document.createElement('button');
            addButton.className = 'photo-add-button';
            addButton.setAttribute('aria-label', 'Add photo');
            addButton.innerHTML = '<span class="photo-add-icon">+</span>';
            
            TouchHandler.addTapHandler(addButton, function() {
                self.onAddPhoto();
            });
            
            placeholder.appendChild(addButton);
            
            // Hint text
            const hint = document.createElement('div');
            hint.className = 'photo-hint';
            hint.textContent = this._getUploadHint();
            placeholder.appendChild(hint);
            
            return placeholder;
        },
        
        // Create overflow indicator
        createOverflowIndicator: function(count) {
            const overflow = document.createElement('div');
            overflow.className = 'photo-overflow-indicator';
            overflow.textContent = `+${count} more`;
            return overflow;
        },
        
        // Load thumbnail with progressive enhancement
        _loadThumbnail: function(img, photo, container) {
            const self = this;
            
            // Use PhotoLoader if available for better memory management
            if (window.PhotoLoader) {
                window.PhotoLoader.loadImage(img, photo, {
                    priority: 'normal',
                    onLoad: function(stats) {
                        // Success - remove skeleton
                        container.classList.remove('photo-skeleton');
                        
                        // Log performance
                        if (stats && stats.loadTime < 500) {
                            console.log(`Photo loaded within target: ${Math.round(stats.loadTime)}ms`);
                        }
                    },
                    onError: function(error) {
                        // Show error state
                        container.classList.remove('photo-skeleton');
                        const errorElement = PhotoStates.createErrorElement();
                        
                        // Add retry handler
                        const retryBtn = errorElement.querySelector('.photo-retry-button');
                        TouchHandler.addTapHandler(retryBtn, function() {
                            // Replace error with new thumbnail and retry
                            const newContainer = self.createThumbnail(photo, 0);
                            errorElement.parentNode.replaceChild(newContainer, errorElement);
                        });
                        
                        container.parentNode.replaceChild(errorElement, container);
                    }
                });
            } else {
                // Fallback to simple loading
                const sources = [];
                if (photo.thumbnailUrl) sources.push(photo.thumbnailUrl);
                if (photo.mediumUrl) sources.push(photo.mediumUrl);
                if (photo.fullUrl) sources.push(photo.fullUrl);
                if (photo.localUri) sources.push(photo.localUri);
                
                if (sources.length === 0) {
                    // No source available
                    container.classList.remove('photo-skeleton');
                    const errorElement = PhotoStates.createErrorElement();
                    container.parentNode.replaceChild(errorElement, container);
                    return;
                }
                
                // Try loading from best source
                let currentIndex = 0;
                
                function tryNextSource() {
                    if (currentIndex >= sources.length) {
                        // All sources failed
                        container.classList.remove('photo-skeleton');
                        const errorElement = PhotoStates.createErrorElement();
                        
                        // Add retry handler
                        const retryBtn = errorElement.querySelector('.photo-retry-button');
                        TouchHandler.addTapHandler(retryBtn, function() {
                            // Replace error with new thumbnail and retry
                            const newContainer = self.createThumbnail(photo, 0);
                            errorElement.parentNode.replaceChild(newContainer, errorElement);
                        });
                        
                        container.parentNode.replaceChild(errorElement, container);
                        return;
                    }
                    
                    img.src = sources[currentIndex];
                    currentIndex++;
                }
                
                img.onload = function() {
                    // Success - remove skeleton
                    container.classList.remove('photo-skeleton');
                };
                
                img.onerror = function() {
                    // Try next source
                    tryNextSource();
                };
                
                // Start loading
                tryNextSource();
            }
        },
        
        // Create action buttons
        _createActions: function(photo) {
            const self = this;
            const actions = document.createElement('div');
            actions.className = 'photo-actions';
            
            // View button
            const viewBtn = this._createActionButton('view', 'View full size');
            TouchHandler.addTapHandler(viewBtn, function() {
                self.onPhotoAction('view', photo);
            });
            actions.appendChild(viewBtn);
            
            // Edit button
            const editBtn = this._createActionButton('edit', 'Edit caption');
            TouchHandler.addTapHandler(editBtn, function() {
                self.onPhotoAction('edit', photo);
            });
            actions.appendChild(editBtn);
            
            // Delete button
            const deleteBtn = this._createActionButton('delete', 'Delete photo');
            TouchHandler.addTapHandler(deleteBtn, function() {
                self.onPhotoAction('delete', photo);
            });
            actions.appendChild(deleteBtn);
            
            return actions;
        },
        
        // Create action button
        _createActionButton: function(type, label) {
            const button = document.createElement('button');
            button.className = `photo-action-button photo-action-${type}`;
            button.setAttribute('aria-label', label);
            
            // Add icon based on type
            switch(type) {
                case 'view':
                    button.innerHTML = '👁';
                    break;
                case 'edit':
                    button.innerHTML = '✏️';
                    break;
                case 'delete':
                    button.innerHTML = '🗑';
                    break;
            }
            
            return button;
        },
        
        // Get photo description for accessibility
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
            
            // Upload status
            if (photo.uploadStatus === 'pending') {
                parts.push('pending upload');
            }
            
            return parts.join(', ');
        },
        
        // Get upload hint based on photo count
        _getUploadHint: function() {
            const remaining = GRID_CONFIG.MAX_VISIBLE - this.photos.length;
            if (remaining <= 0) return 'Grid full';
            
            return `Add up to ${remaining} more`;
        },
        
        // Update a single photo in the grid
        updatePhoto: function(photoId, updates) {
            const photoElement = this.container.querySelector(`[data-photo-id="${photoId}"]`);
            if (!photoElement) return;
            
            // Find photo data
            const photo = this.photos.find(function(p) { return p.id === photoId; });
            if (!photo) return;
            
            // Apply updates
            Object.keys(updates).forEach(function(key) {
                photo[key] = updates[key];
            });
            
            // Update caption if changed
            if (updates.caption !== undefined) {
                let captionEl = photoElement.querySelector('.photo-caption-display');
                if (updates.caption) {
                    if (!captionEl) {
                        captionEl = document.createElement('div');
                        captionEl.className = 'photo-caption-display';
                        photoElement.appendChild(captionEl);
                    }
                    captionEl.textContent = updates.caption;
                } else if (captionEl) {
                    captionEl.remove();
                }
            }
            
            // Update category color if changed
            if (updates.category !== undefined) {
                const container = photoElement.querySelector('.photo-thumbnail-container');
                if (container && window.PHOTO_CATEGORIES) {
                    const category = window.PHOTO_CATEGORIES[updates.category];
                    if (category) {
                        container.style.borderColor = category.color;
                        container.setAttribute('data-category', updates.category);
                    }
                }
            }
        },
        
        // Refresh the entire grid
        refresh: function(photos) {
            this.createGrid(photos || this.photos);
        },
        
        // Get current photo count
        getPhotoCount: function() {
            return this.photos.length;
        },
        
        // Check if grid is full
        isFull: function() {
            return this.photos.length >= GRID_CONFIG.MAX_VISIBLE;
        }
    };
    
    // Export
    exports.PhotoThumbnailGrid = PhotoThumbnailGrid;
    exports.PhotoTouchHandler = TouchHandler;
    exports.PhotoStates = PhotoStates;
    
})(window);