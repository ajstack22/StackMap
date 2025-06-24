// Photo Attachment UI Module
// Implements ADHD-optimized photo UI with touch targets and grid layout

(function(exports) {
    'use strict';

    // UI Configuration
    const UI_CONFIG = {
        TOUCH_TARGET_MIN: 48,      // Minimum touch target size
        TOUCH_TARGET_CRITICAL: 60, // Critical control size
        GRID_COLUMNS: 3,           // Mobile grid columns
        GRID_GAP: 16,              // Standard spacing
        STRESS_MODE_GAP: 24,       // Increased spacing for stress mode
        ZOOM_LEVELS: [1, 2],       // Available zoom levels
        ANIMATION_DURATION: 200,   // Standard animation duration
        HESITATION_THRESHOLD: 2000,// 2 seconds hesitation indicates stress
        ERROR_THRESHOLD: 3         // 3 errors in 30 seconds indicates stress
    };
    
    // Make configs available globally
    if (!window.PHOTO_CONFIG) {
        window.PHOTO_CONFIG = {
            MAX_PHOTOS_PER_TASK: 3,
            MAX_VISIBLE_PHOTOS: 6,
            MAX_CAPTION_LENGTH: 50
        };
    }
    
    if (!window.PHOTO_CATEGORIES) {
        window.PHOTO_CATEGORIES = {
            memory_aid: { color: '#4A90E2', label: 'Reference' },
            before: { color: '#7ED321', label: 'Before' },
            after: { color: '#9013FE', label: 'After' },
            progress: { color: '#F5A623', label: 'Progress' }
        };
    }

    // Photo Attachment UI Manager
    class PhotoAttachmentUI {
        constructor(storage) {
            this.storage = storage;
            this.currentTask = null;
            this.photos = [];
            this.selectedPhoto = null;
            this.stressDetector = new StressDetector();
            this.settings = this._loadSettings();
            this.thumbnailGrid = null;
            this.photoViewer = null;
            this.init();
        }
        // Initialize UI components
        init() {
            this._createStyles();
            this._setupEventListeners();
            this._applySettings();
            this._setupLazyLoading();
            this._initializeCacheBridge();
        }

        // Setup global event listeners
        _setupEventListeners() {
            // Re-setup lazy loading when view changes
            document.addEventListener('viewchange', () => {
                this._setupLazyLoading();
            });
            
            // Handle orientation changes
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this._refreshPhotoDisplay();
                }, 100);
            });
            
            // Listen for offline queue updates
            if (window.OfflineQueue) {
                window.addEventListener('online', () => {
                    this._syncPendingPhotos();
                });
            }
        }

        // Create photo attachment UI for a task
        createAttachmentUI(taskId, container) {
            this.currentTask = taskId;
            this.container = container;
            
            // Load existing photos
            this.storage.getPhotosForTask(taskId, (photos) => {
                this.photos = photos;
                this._renderUI(container);
                
                // Preload photos for offline access
                if (window.PhotoCacheBridge && photos.length > 0) {
                    const photoIds = photos.map(photo => photo.id).filter(Boolean);
                    
                    if (photoIds.length > 0) {
                        window.PhotoCacheBridge.preloadCriticalPhotos(photoIds);
                    }
                }
            });
        }

        // Render the complete UI
        _renderUI(container) {
            // Clear container
            container.innerHTML = '';
            container.className = 'photo-attachment-container';
            
            // Create grid container
            const gridContainer = document.createElement('div');
            container.appendChild(gridContainer);
            
            // Initialize thumbnail grid with new component
            if (window.PhotoThumbnailGrid) {
                this.thumbnailGrid = new window.PhotoThumbnailGrid(gridContainer, {
                    onPhotoTap: (photo, index) => {
                        this._viewPhoto(photo, index);
                    },
                    onAddPhoto: () => {
                        this._triggerPhotoSelection();
                    },
                    onPhotoAction: (action, photo) => {
                        switch(action) {
                            case 'view':
                                this._viewPhoto(photo);
                                break;
                            case 'edit':
                                this._editPhoto(photo);
                                break;
                            case 'delete':
                                this._deletePhoto(photo.id);
                                break;
                        }
                    }
                });
                
                // Create the grid
                this.thumbnailGrid.createGrid(this.photos, window.PHOTO_CONFIG.MAX_VISIBLE_PHOTOS);
            } else {
                // Fallback to old implementation
                const grid = this._createPhotoGrid();
                container.appendChild(grid);
            }
            
            // Add controls
            const controls = this._createControls();
            container.appendChild(controls);
            
            // Apply stress mode if active
            if (this.stressDetector.isStressMode) {
                container.classList.add('stress-mode');
            }
        }

        // Create photo grid
        _createPhotoGrid() {
            const grid = document.createElement('div');
            grid.className = 'photo-grid';
            
            // Render existing photos
            this.photos.forEach((photo, index) => {
                if (index < window.PHOTO_CONFIG.MAX_VISIBLE_PHOTOS) {
                    const photoElement = this._createPhotoElement(photo, index === 0);
                    grid.appendChild(photoElement);
                }
            });
            
            // Add placeholder slots
            const emptySlots = window.PHOTO_CONFIG.MAX_PHOTOS_PER_TASK - this.photos.length;
            for (let i = 0; i < emptySlots && this.photos.length + i < window.PHOTO_CONFIG.MAX_VISIBLE_PHOTOS; i++) {
                const placeholder = this._createPlaceholder();
                grid.appendChild(placeholder);
            }
            
            // Show overflow indicator
            if (this.photos.length > window.PHOTO_CONFIG.MAX_VISIBLE_PHOTOS) {
                const overflow = document.createElement('div');
                overflow.className = 'photo-overflow-indicator';
                overflow.textContent = `+${this.photos.length - window.PHOTO_CONFIG.MAX_VISIBLE_PHOTOS} more`;
                grid.appendChild(overflow);
            }
            
            return grid;
        }

        // Create individual photo element
        _createPhotoElement(photo, isPrimary) {
            const element = document.createElement('div');
            element.className = `photo-item${isPrimary ? ' photo-primary' : ''}`;
            element.setAttribute('data-photo-id', photo.id);
            
            // Thumbnail container
            const thumbnailContainer = document.createElement('div');
            thumbnailContainer.className = 'photo-thumbnail-container';
            
            // Thumbnail image
            const thumbnail = document.createElement('img');
            thumbnail.className = 'photo-thumbnail';
            thumbnail.alt = this._getPhotoDescription(photo);
            thumbnail.setAttribute('role', 'img');
            
            // Use optimized photo loading
            if (photo.optimized) {
                // Set up progressive loading with PhotoLazyLoader
                thumbnail.setAttribute('data-lazy-src', photo.fullUrl || photo.localUri);
                thumbnail.setAttribute('data-lazy-medium', photo.mediumUrl);
                thumbnail.setAttribute('data-lazy-thumbnail', photo.thumbnailUrl);
                
                // Show blur placeholder immediately
                if (photo.thumbnailUrl) {
                    thumbnailContainer.style.backgroundImage = `url(${photo.thumbnailUrl})`;
                    thumbnailContainer.style.backgroundSize = 'cover';
                    thumbnailContainer.style.filter = 'blur(5px)';
                }
            } else {
                // Fallback: Load thumbnail with lazy loading
                this._loadThumbnail(photo.id, (thumbnailData) => {
                    if (thumbnailData) {
                        thumbnail.setAttribute('data-lazy-src', thumbnailData);
                    } else {
                        thumbnail.setAttribute('data-lazy-src', photo.localUri);
                    }
                });
            }
            
            // Category border
            const category = window.PHOTO_CATEGORIES[photo.category];
            if (category) {
                thumbnailContainer.style.borderColor = category.color;
                thumbnailContainer.setAttribute('data-category', photo.category);
            }
            
            thumbnailContainer.appendChild(thumbnail);
            element.appendChild(thumbnailContainer);
            
            // Caption
            if (photo.caption) {
                const caption = document.createElement('div');
                caption.className = 'photo-caption-display';
                caption.textContent = photo.caption;
                element.appendChild(caption);
            }
            
            // Action buttons
            const actions = document.createElement('div');
            actions.className = 'photo-actions';
            
            // View button
            const viewBtn = this._createActionButton('view', 'View', () => {
                this._viewPhoto(photo);
            });
            actions.appendChild(viewBtn);
            
            // Edit button
            const editBtn = this._createActionButton('edit', 'Edit', () => {
                this._editPhoto(photo);
            });
            actions.appendChild(editBtn);
            
            // Delete button
            const deleteBtn = this._createActionButton('delete', 'Delete', () => {
                this._deletePhoto(photo.id);
            });
            actions.appendChild(deleteBtn);
            
            element.appendChild(actions);
            
            // Touch interaction
            this._setupPhotoInteractions(element, photo);
            
            return element;
        }

        // Create placeholder for empty photo slot
        _createPlaceholder() {
            const placeholder = document.createElement('div');
            placeholder.className = 'photo-placeholder';
            
            const addButton = document.createElement('button');
            addButton.className = 'photo-add-button';
            addButton.setAttribute('aria-label', 'Add photo');
            addButton.innerHTML = '<span class="photo-add-icon">+</span>';
            
            addButton.addEventListener('click', () => {
                this._triggerPhotoSelection();
            });
            
            placeholder.appendChild(addButton);
            
            // Hint text
            const hint = document.createElement('div');
            hint.className = 'photo-hint';
            hint.textContent = this.storage.getUploadHint(this.photos.length);
            placeholder.appendChild(hint);
            
            return placeholder;
        }

        // Create action button
        _createActionButton(type, label, onClick) {
            const button = document.createElement('button');
            button.className = `photo-action-button photo-action-${type}`;
            button.setAttribute('aria-label', label);
            button.addEventListener('click', onClick);
            
            // Track interactions for stress detection
            button.addEventListener('click', () => {
                this.stressDetector.recordInteraction();
            });
            
            return button;
        }

        // Create control panel
        _createControls() {
            const controls = document.createElement('div');
            controls.className = 'photo-controls';
            
            // Upload status
            const status = document.createElement('div');
            status.className = 'photo-upload-status';
            status.textContent = this._getUploadStatus();
            controls.appendChild(status);
            
            return controls;
        }

        // Setup photo touch interactions
        _setupPhotoInteractions(element, photo) {
            let lastTap = 0;
            
            // Double-tap for zoom
            element.addEventListener('click', (e) => {
                const currentTime = Date.now();
                const tapDelay = currentTime - lastTap;
                
                // Track tap delays for stress detection
                this.stressDetector.recordTapDelay(tapDelay);
                
                if (tapDelay < 300) {
                    // Double tap detected
                    e.preventDefault();
                    this._toggleZoom(photo);
                }
                
                lastTap = currentTime;
            });
            
            // Long press for options
            let pressTimer;
            element.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    this._showPhotoOptions(photo);
                }, 500);
            });
            
            element.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });
            
            element.addEventListener('touchmove', () => {
                clearTimeout(pressTimer);
            });
        }

        // Toggle zoom on photo
        _toggleZoom(photo) {
            // Open photo viewer with zoom capability
            this._viewPhoto(photo);
        }

        // View photo in full screen
        _viewPhoto(photo, index) {
            // Use new PhotoViewer component if available
            if (window.PhotoViewer) {
                if (!this.photoViewer) {
                    this.photoViewer = new window.PhotoViewer({
                        onClose: () => {
                            // Viewer closed
                        },
                        onPhotoChange: (photo, index) => {
                            // Photo changed
                        }
                    });
                }
                
                // Open viewer with all photos, starting at specified index
                const startIndex = typeof index === 'number' ? index : this.photos.indexOf(photo);
                this.photoViewer.open(this.photos, startIndex);
            } else {
                // Fallback to old implementation
                const viewer = document.createElement('div');
                viewer.className = 'photo-viewer';
                
                // Image container
                const imageContainer = document.createElement('div');
                imageContainer.className = 'photo-viewer-image-container';
                
                const image = document.createElement('img');
                
                // Use optimized version if available
                if (photo.optimized && photo.fullUrl) {
                    image.src = photo.fullUrl;
                } else {
                    image.src = photo.localUri;
                }
                
                image.alt = this._getPhotoDescription(photo);
                
                // Show loading state
                image.style.opacity = '0';
                image.onload = () => {
                    image.style.transition = 'opacity 300ms ease-in';
                    image.style.opacity = '1';
                };
                
                imageContainer.appendChild(image);
                
                // Zoom controls
                const zoomControls = this._createZoomControls(image);
                imageContainer.appendChild(zoomControls);
                
                viewer.appendChild(imageContainer);
                
                // Caption display
                if (photo.caption) {
                    const captionDisplay = document.createElement('div');
                    captionDisplay.className = 'photo-viewer-caption';
                    captionDisplay.textContent = photo.caption;
                    viewer.appendChild(captionDisplay);
                }
                
                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.className = 'photo-viewer-close';
                closeBtn.setAttribute('aria-label', 'Close viewer');
                closeBtn.textContent = '×';
                closeBtn.addEventListener('click', () => {
                    document.body.removeChild(viewer);
                });
                viewer.appendChild(closeBtn);
                
                // Keyboard navigation
                viewer.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        document.body.removeChild(viewer);
                    }
                });
                
                document.body.appendChild(viewer);
                
                // Focus for keyboard events
                viewer.focus();
            }
        }

        // Create zoom controls
        _createZoomControls(image) {
            const controls = document.createElement('div');
            controls.className = 'zoom-controls';
            
            let currentZoom = 1;
            
            // Zoom in button
            const zoomIn = document.createElement('button');
            zoomIn.className = 'zoom-in';
            zoomIn.setAttribute('aria-label', 'Zoom in');
            zoomIn.textContent = '+';
            zoomIn.addEventListener('click', () => {
                currentZoom = Math.min(currentZoom * 1.5, 3);
                image.style.transform = `scale(${currentZoom})`;
            });
            
            // Zoom out button
            const zoomOut = document.createElement('button');
            zoomOut.className = 'zoom-out';
            zoomOut.setAttribute('aria-label', 'Zoom out');
            zoomOut.textContent = '−';
            zoomOut.addEventListener('click', () => {
                currentZoom = Math.max(currentZoom / 1.5, 1);
                image.style.transform = `scale(${currentZoom})`;
            });
            
            controls.appendChild(zoomIn);
            controls.appendChild(zoomOut);
            
            return controls;
        }

        // Edit photo caption
        _editPhoto(photo) {
            const modal = document.createElement('div');
            modal.className = 'photo-edit-modal';
            
            const content = document.createElement('div');
            content.className = 'photo-edit-content';
            
            // Title
            const title = document.createElement('h3');
            title.textContent = 'Edit Photo';
            content.appendChild(title);
            
            // Caption input
            const captionGroup = document.createElement('div');
            captionGroup.className = 'photo-caption-group';
            
            const captionLabel = document.createElement('label');
            captionLabel.textContent = 'Caption:';
            captionLabel.setAttribute('for', 'photo-caption-input');
            captionGroup.appendChild(captionLabel);
            
            const captionInput = document.createElement('input');
            captionInput.type = 'text';
            captionInput.id = 'photo-caption-input';
            captionInput.className = 'photo-caption-input';
            captionInput.placeholder = 'Brief description (optional)';
            captionInput.maxLength = window.PHOTO_CONFIG.MAX_CAPTION_LENGTH;
            captionInput.value = photo.caption || '';
            captionGroup.appendChild(captionInput);
            
            const captionHint = document.createElement('span');
            captionHint.className = 'caption-hint';
            captionHint.textContent = `${captionInput.value.length}/${window.PHOTO_CONFIG.MAX_CAPTION_LENGTH}`;
            captionGroup.appendChild(captionHint);
            
            captionInput.addEventListener('input', (e) => {
                captionHint.textContent = `${e.target.value.length}/${window.PHOTO_CONFIG.MAX_CAPTION_LENGTH}`;
            });
            
            content.appendChild(captionGroup);
            
            // Category selection
            const categoryGroup = document.createElement('div');
            categoryGroup.className = 'photo-category-group';
            
            const categoryLabel = document.createElement('label');
            categoryLabel.textContent = 'Category:';
            categoryGroup.appendChild(categoryLabel);
            
            const categorySelect = document.createElement('div');
            categorySelect.className = 'photo-category-select';
            
            Object.keys(window.PHOTO_CATEGORIES).forEach(key => {
                const option = document.createElement('button');
                option.className = `photo-category-option${photo.category === key ? ' selected' : ''}`;
                option.setAttribute('data-category', key);
                option.style.borderColor = window.PHOTO_CATEGORIES[key].color;
                option.textContent = window.PHOTO_CATEGORIES[key].label;
                
                option.addEventListener('click', () => {
                    categorySelect.querySelectorAll('.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                    option.classList.add('selected');
                });
                
                categorySelect.appendChild(option);
            });
            
            categoryGroup.appendChild(categorySelect);
            content.appendChild(categoryGroup);
            
            // Action buttons
            const actions = document.createElement('div');
            actions.className = 'photo-edit-actions';
            
            const saveBtn = document.createElement('button');
            saveBtn.className = 'photo-save-button';
            saveBtn.textContent = 'Save';
            saveBtn.addEventListener('click', () => {
                const newCaption = captionInput.value;
                const selectedCategory = categorySelect.querySelector('.selected');
                
                if (selectedCategory) {
                    photo.category = selectedCategory.getAttribute('data-category');
                }
                
                this.storage.updateCaption(photo.id, newCaption, (result) => {
                    if (result.success) {
                        photo.caption = newCaption;
                        document.body.removeChild(modal);
                        this._refreshUI();
                    }
                });
            });
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'photo-cancel-button';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            
            actions.appendChild(cancelBtn);
            actions.appendChild(saveBtn);
            content.appendChild(actions);
            
            modal.appendChild(content);
            document.body.appendChild(modal);
            
            // Focus caption input
            captionInput.focus();
        }

        // Delete photo
        _deletePhoto(photoId) {
            if (confirm('Delete this photo?')) {
                // Clean up memory if using PhotoOptimizer
                if (window.PhotoOptimizer) {
                    window.PhotoOptimizer.revokeObjectUrl(`photo_${photoId}`);
                    window.PhotoOptimizer.revokeObjectUrl(`thumb_${photoId}`);
                    window.PhotoOptimizer.revokeObjectUrl(`medium_${photoId}`);
                }
                
                this.storage.deletePhoto(photoId, (result) => {
                    if (result.success) {
                        this._refreshUI();
                    } else if (window.OfflineQueue) {
                        // Queue deletion for offline sync
                        window.OfflineQueue.queueOperation({
                            type: 'deletePhoto',
                            method: 'DELETE',
                            endpoint: `/api/photos/${photoId}`,
                            data: { photoId: photoId }
                        });
                        
                        // Still remove from UI optimistically
                        this.photos = this.photos.filter(p => p.id !== photoId);
                        this._refreshUI();
                    }
                });
            }
        }

        // Trigger photo selection
        _triggerPhotoSelection() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            
            input.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this._handlePhotoSelection(files);
            });
            
            input.click();
        }

        // Handle photo selection
        _handlePhotoSelection(files) {
            const remaining = window.PHOTO_CONFIG.MAX_PHOTOS_PER_TASK - this.photos.length;
            
            if (files.length > remaining) {
                alert(`You can only add ${remaining} more photo(s)`);
                files = files.slice(0, remaining);
            }
            
            // Show processing indicator
            this._showProcessingIndicator(true);
            let processed = 0;
            const errors = [];
            
            // Use PhotoUploadManager for non-blocking uploads
            if (window.photoUploadManager) {
                files.forEach(async file => {
                    try {
                        // Add photo through upload manager (non-blocking)
                        await window.photoUploadManager.addPhoto(file, {
                            taskId: this.currentTask,
                            source: 'user-selection'
                        });
                        
                        processed++;
                        if (processed === files.length) {
                            this._handlePhotoProcessingComplete(errors);
                        }
                    } catch (error) {
                        errors.push(`${file.name}: ${error.message || 'Upload failed'}`);
                        processed++;
                        if (processed === files.length) {
                            this._handlePhotoProcessingComplete(errors);
                        }
                    }
                });
            } else {
                // Fallback to PhotoOptimizer or basic processing
                files.forEach(file => {
                    // Validate image first
                    if (window.PhotoOptimizer) {
                        const validation = window.PhotoOptimizer.validateImage(file);
                        if (!validation.valid) {
                            errors.push(`${file.name}: ${validation.errors.join(', ')}`);
                            processed++;
                            if (processed === files.length) {
                                this._handlePhotoProcessingComplete(errors);
                            }
                            return;
                        }
                    }
                    
                    // Process with PhotoOptimizer if available
                    if (window.PhotoOptimizer) {
                        window.PhotoOptimizer.processImage(file, (error, result) => {
                            if (error) {
                                errors.push(`${file.name}: ${error.message}`);
                            } else {
                                // Create photo data with optimized versions
                                const photoData = {
                                    filename: file.name,
                                    size: file.size,
                                    mimeType: file.type,
                                    optimized: true,
                                    originalBlob: result.original,
                                    mediumBlob: result.medium,
                                    thumbnailBlob: result.thumbnail,
                                    metadata: result.metadata
                                };
                                
                                // Save to storage with offline queue support
                                this._savePhotoWithQueue(photoData);
                            }
                            
                            processed++;
                            if (processed === files.length) {
                                this._handlePhotoProcessingComplete(errors);
                            }
                        });
                    } else {
                        // LAST RESORT: Read as data URL without optimization
                        // This can freeze the browser with large images!
                        console.warn('[PhotoAttachmentUI] Using blocking FileReader as last resort');
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const photoData = {
                                uri: e.target.result,
                                filename: file.name,
                                size: file.size,
                                mimeType: file.type
                            };
                            
                            this.storage.addPhoto(this.currentTask, photoData, (result) => {
                                if (!result.success) {
                                    errors.push(`${file.name}: ${result.error}`);
                                    this.stressDetector.recordError();
                                }
                                
                                processed++;
                                if (processed === files.length) {
                                    this._handlePhotoProcessingComplete(errors);
                                }
                            });
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        }
        
        // Save photo with offline queue support
        _savePhotoWithQueue(photoData) {
            // Convert blobs to data URLs for storage
            this._convertBlobsToDataUrls(photoData, (convertedData) => {
                // Try to save immediately
                this.storage.addPhoto(this.currentTask, convertedData, (result) => {
                    if (result.success) {
                        // Update photo with server ID if returned
                        if (result.photoId) {
                            convertedData.id = result.photoId;
                        }
                    } else if (window.OfflineQueue) {
                        // Queue for later if offline
                        window.OfflineQueue.queueOperation({
                            type: 'savePhoto',
                            method: 'POST',
                            endpoint: '/api/photos',
                            data: {
                                taskId: this.currentTask,
                                photo: convertedData
                            }
                        });
                    } else {
                        this.stressDetector.recordError();
                    }
                });
            });
        }
        
        // Convert blobs to data URLs for storage
        _convertBlobsToDataUrls(photoData, callback) {
            const converted = {
                filename: photoData.filename,
                size: photoData.size,
                mimeType: photoData.mimeType,
                optimized: photoData.optimized,
                metadata: photoData.metadata
            };
            
            let conversions = 0;
            let toConvert = 0;
            
            // Count conversions needed
            if (photoData.originalBlob) toConvert++;
            if (photoData.mediumBlob) toConvert++;
            if (photoData.thumbnailBlob) toConvert++;
            
            // Convert each blob
            if (photoData.thumbnailBlob && window.PhotoOptimizer) {
                window.PhotoOptimizer.blobToDataUrl(photoData.thumbnailBlob, (error, dataUrl) => {
                    if (!error) converted.thumbnailUrl = dataUrl;
                    conversions++;
                    if (conversions === toConvert) callback(converted);
                });
            }
            
            if (photoData.mediumBlob && window.PhotoOptimizer) {
                window.PhotoOptimizer.blobToDataUrl(photoData.mediumBlob, (error, dataUrl) => {
                    if (!error) converted.mediumUrl = dataUrl;
                    conversions++;
                    if (conversions === toConvert) callback(converted);
                });
            }
            
            if (photoData.originalBlob && window.PhotoOptimizer) {
                window.PhotoOptimizer.blobToDataUrl(photoData.originalBlob, (error, dataUrl) => {
                    if (!error) converted.fullUrl = dataUrl;
                    conversions++;
                    if (conversions === toConvert) callback(converted);
                });
            }
            
            // If no conversions needed, return immediately
            if (toConvert === 0) {
                callback(converted);
            }
        }
        
        // Handle photo processing completion
        _handlePhotoProcessingComplete(errors) {
            this._showProcessingIndicator(false);
            
            if (errors.length > 0) {
                alert(`Some photos could not be added:\n${errors.join('\n')}`);
            }
            
            this._refreshUI();
        }
        
        // Show/hide processing indicator
        _showProcessingIndicator(show) {
            const indicator = document.querySelector('.photo-processing-indicator');
            if (indicator) {
                indicator.style.display = show ? 'block' : 'none';
            }
        }

        // Load thumbnail from cache
        _loadThumbnail(photoId, callback) {
            const transaction = this.storage.db.transaction(['thumbnails'], 'readonly');
            const store = transaction.objectStore('thumbnails');
            const request = store.get(photoId);
            
            request.onsuccess = () => {
                const thumbnail = request.result;
                callback(thumbnail ? thumbnail.data : null);
            };
            
            request.onerror = () => {
                callback(null);
            };
        }

        // Get photo description for accessibility
        _getPhotoDescription(photo) {
            const status = photo.uploadStatus === 'uploaded' ? 'uploaded' : 'pending upload';
            const category = window.PHOTO_CATEGORIES[photo.category]?.label || 'photo';
            return `${category}, ${photo.caption || 'no description'}, ${status}`;
        }

        // Get upload status summary
        _getUploadStatus() {
            const pending = this.photos.filter(p => p.uploadStatus === 'pending').length;
            
            if (pending === 0) {
                return 'All photos uploaded';
            }
            
            return `${pending} photo(s) waiting to upload`;
        }

        // Refresh UI
        _refreshUI() {
            if (this.thumbnailGrid) {
                // Use new grid refresh method
                this.thumbnailGrid.refresh(this.photos);
            } else {
                // Fallback to full re-render
                const container = document.querySelector('.photo-attachment-container');
                if (container && this.currentTask) {
                    this.createAttachmentUI(this.currentTask, container);
                }
            }
        }

        // Load user settings
        _loadSettings() {
            const saved = localStorage.getItem('photoSettings');
            if (saved) {
                return JSON.parse(saved);
            }
            
            return {
                density: 'normal',
                animations: !this._prefersReducedMotion(),
                highContrast: false
            };
        }

        // Apply user settings
        _applySettings() {
            const body = document.body;
            
            // Density
            body.setAttribute('data-photo-density', this.settings.density);
            
            // Animations
            if (!this.settings.animations) {
                body.classList.add('reduce-photo-animations');
            }
            
            // High contrast
            if (this.settings.highContrast) {
                body.classList.add('photo-high-contrast');
            }
        }

        // Check for reduced motion preference
        _prefersReducedMotion() {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        // Create dynamic styles
        _createStyles() {
            // Styles are defined in photo-attachments.css
            // This method can be used for dynamic style adjustments
        }

        // Lazy load thumbnails as they come into view
        _lazyLoadThumbnails() {
            const thumbnails = this.container ? this.container.querySelectorAll('.photo-thumbnail[data-src]') : [];
            
            thumbnails.forEach(thumb => {
                if (this._isInViewport(thumb)) {
                    const src = thumb.getAttribute('data-src');
                    thumb.src = src;
                    thumb.removeAttribute('data-src');
                }
            });
        }

        // Check if element is in viewport
        _isInViewport(element) {
            const rect = element.getBoundingClientRect();
            return (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= window.innerHeight &&
                rect.right <= window.innerWidth
            );
        }
        
        // Initialize cache bridge for photo optimization
        _initializeCacheBridge() {
            // PhotoCacheBridge auto-initializes, but we can preload critical photos
            if (window.PhotoCacheBridge && this.currentTask && this.photos.length > 0) {
                const photoIds = this.photos.map(photo => photo.id).filter(Boolean);
                
                if (photoIds.length > 0) {
                    window.PhotoCacheBridge.preloadCriticalPhotos(photoIds);
                }
            }
        }

        // Setup lazy loading observers
        _setupLazyLoading() {
            // Use PhotoLazyLoader if available
            if (window.PhotoLazyLoader) {
                // PhotoLazyLoader auto-initializes and observes images
                // Just need to trigger observation for any new images
                window.PhotoLazyLoader.observeImages();
            } else if ('IntersectionObserver' in window) {
                // Fallback to basic implementation
                const observer = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const thumb = entry.target;
                            const src = thumb.getAttribute('data-src');
                            if (src) {
                                thumb.src = src;
                                thumb.removeAttribute('data-src');
                                observer.unobserve(thumb);
                            }
                        }
                    });
                }, {
                    rootMargin: '50px' // Load 50px before entering viewport
                });
                
                // Observe all thumbnails
                const thumbnails = document.querySelectorAll('.photo-thumbnail[data-src]');
                thumbnails.forEach(thumb => {
                    observer.observe(thumb);
                });
            } else {
                // Fallback for older browsers
                window.addEventListener('scroll', () => {
                    this._lazyLoadThumbnails();
                });
                window.addEventListener('resize', () => {
                    this._lazyLoadThumbnails();
                });
                
                // Initial load
                this._lazyLoadThumbnails();
            }
        }
        
        // Sync pending photos when coming online
        _syncPendingPhotos() {
            if (window.OfflineQueue) {
                const status = window.OfflineQueue.getStatus();
                if (status.pending > 0) {
                    console.log(`Syncing ${status.pending} pending photos...`);
                    window.OfflineQueue.processQueue();
                }
            }
        }
        
        // Refresh photo display without full UI refresh
        _refreshPhotoDisplay() {
            // Update only the photo grid
            const grid = document.querySelector('.photo-grid');
            if (grid && this.currentTask) {
                this.storage.getPhotosForTask(this.currentTask, (photos) => {
                    this.photos = photos;
                    const newGrid = this._createPhotoGrid();
                    grid.parentNode.replaceChild(newGrid, grid);
                    
                    // Re-setup lazy loading for new images
                    this._setupLazyLoading();
                });
            }
        }
    }

    // Stress Detector
    class StressDetector {
        constructor() {
            this.metrics = {
                errors: [],
                tapDelays: [],
                lastReset: Date.now()
            };
            this.isStressMode = false;
        }

        recordError() {
            this.metrics.errors.push(Date.now());
            this._checkStressLevel();
        }

        recordTapDelay(delay) {
            this.metrics.tapDelays.push(delay);
            if (this.metrics.tapDelays.length > 10) {
                this.metrics.tapDelays.shift();
            }
            this._checkStressLevel();
        }

        recordInteraction() {
            // Reset timer on successful interaction
            this.metrics.lastReset = Date.now();
        }

        _checkStressLevel() {
            // Check recent errors
            const recentErrors = this.metrics.errors.filter(e => e > Date.now() - 30000).length;
            
            // Calculate average hesitation
            let avgHesitation = 0;
            if (this.metrics.tapDelays.length > 0) {
                const sum = this.metrics.tapDelays.reduce((a, b) => a + b, 0);
                avgHesitation = sum / this.metrics.tapDelays.length;
            }
            
            // Determine if stressed
            const wasStressed = this.isStressMode;
            this.isStressMode = recentErrors >= UI_CONFIG.ERROR_THRESHOLD || 
                               avgHesitation > UI_CONFIG.HESITATION_THRESHOLD;
            
            // Activate/deactivate stress mode
            if (this.isStressMode && !wasStressed) {
                this._activateStressMode();
            } else if (!this.isStressMode && wasStressed) {
                this._deactivateStressMode();
            }
        }

        _activateStressMode() {
            document.body.classList.add('photo-stress-mode');
            console.log('Photo stress mode activated');
        }

        _deactivateStressMode() {
            document.body.classList.remove('photo-stress-mode');
            console.log('Photo stress mode deactivated');
        }
    }

    // Export
    exports.PhotoAttachmentUI = PhotoAttachmentUI;

})(window);