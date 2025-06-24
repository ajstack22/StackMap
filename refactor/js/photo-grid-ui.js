/**
 * Photo Grid UI Component
 * Provides instant visual feedback for photo uploads with ADHD-optimized UI
 * Part of the race condition prevention system
 */

class PhotoGridUI {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element '${containerId}' not found`);
        }
        
        // Configuration
        this.config = {
            maxPhotos: options.maxPhotos || 50,
            thumbnailSize: options.thumbnailSize || 64,
            touchTargetSize: options.touchTargetSize || 48,
            animationDuration: options.animationDuration || 200,
            progressUpdateInterval: options.progressUpdateInterval || 500,
            enableHaptics: options.enableHaptics !== false,
            enableSounds: options.enableSounds !== false,
            ...options
        };
        
        // State
        this.photoItems = new Map();
        this.selectedPhotos = new Set();
        this.isMultiSelectMode = false;
        
        // Upload manager reference
        this.uploadManager = null;
        
        // Initialize
        this.initialize();
    }
    
    initialize() {
        // Create grid structure
        this.createGridStructure();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize upload manager connection
        this.connectToUploadManager();
        
        // Apply initial styles
        this.applyStyles();
        
        console.log('PhotoGridUI initialized');
    }
    
    createGridStructure() {
        // Clear existing content
        this.container.innerHTML = '';
        
        // Create grid container
        const gridWrapper = document.createElement('div');
        gridWrapper.className = 'photo-grid-wrapper';
        gridWrapper.innerHTML = `
            <div class="photo-grid-header">
                <div class="photo-count">
                    <span class="count-current">0</span> / <span class="count-max">${this.config.maxPhotos}</span> photos
                </div>
                <div class="photo-actions">
                    <button class="add-photo-btn" aria-label="Add photo">
                        <span class="icon">📷</span>
                        <span class="label">Add</span>
                    </button>
                    <button class="select-mode-btn" aria-label="Toggle selection mode" hidden>
                        <span class="icon">☑️</span>
                        <span class="label">Select</span>
                    </button>
                </div>
            </div>
            <div class="photo-grid" role="grid" aria-label="Photo gallery">
                <!-- Photo items will be inserted here -->
            </div>
            <div class="photo-grid-status" role="status" aria-live="polite">
                <!-- Status messages appear here -->
            </div>
        `;
        
        this.container.appendChild(gridWrapper);
        
        // Cache important elements
        this.gridElement = gridWrapper.querySelector('.photo-grid');
        this.statusElement = gridWrapper.querySelector('.photo-grid-status');
        this.countElement = gridWrapper.querySelector('.count-current');
        this.addButton = gridWrapper.querySelector('.add-photo-btn');
        this.selectButton = gridWrapper.querySelector('.select-mode-btn');
    }
    
    applyStyles() {
        // Inject styles if not already present
        if (!document.getElementById('photo-grid-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'photo-grid-styles';
            styleSheet.textContent = this.getStyles();
            document.head.appendChild(styleSheet);
        }
    }
    
    getStyles() {
        return `
            .photo-grid-wrapper {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                padding: 1rem;
                background: var(--surface-color, #f8f9fa);
                border-radius: 12px;
                min-height: 200px;
            }
            
            .photo-grid-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
            }
            
            .photo-count {
                font-size: 0.875rem;
                color: var(--text-secondary, #666);
            }
            
            .photo-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .photo-actions button {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.5rem 1rem;
                border: none;
                background: var(--primary-color, #4CAF50);
                color: white;
                border-radius: 8px;
                font-size: 0.875rem;
                cursor: pointer;
                transition: all ${this.config.animationDuration}ms ease;
                min-height: ${this.config.touchTargetSize}px;
                min-width: ${this.config.touchTargetSize}px;
            }
            
            .photo-actions button:hover {
                background: var(--primary-hover, #45a049);
                transform: translateY(-1px);
            }
            
            .photo-actions button:active {
                transform: translateY(0);
            }
            
            .photo-actions button[hidden] {
                display: none;
            }
            
            .photo-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(${this.config.thumbnailSize}px, 1fr));
                gap: 0.5rem;
                min-height: ${this.config.thumbnailSize * 2}px;
                padding: 0.5rem;
            }
            
            .photo-item {
                position: relative;
                aspect-ratio: 1;
                background: var(--photo-bg, #f0f0f0);
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: all ${this.config.animationDuration}ms ease;
                animation: photoItemAppear ${this.config.animationDuration}ms ease-out;
            }
            
            @keyframes photoItemAppear {
                from {
                    opacity: 0;
                    transform: scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }
            
            .photo-item.upload-pending {
                opacity: 0.7;
            }
            
            .photo-item.upload-complete {
                opacity: 1;
            }
            
            .photo-item.upload-error {
                border: 2px solid var(--error-color, #f44336);
            }
            
            .photo-item.selected {
                border: 3px solid var(--primary-color, #4CAF50);
                transform: scale(0.95);
            }
            
            .photo-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .photo-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: rgba(0, 0, 0, 0.2);
                overflow: hidden;
            }
            
            .photo-progress-bar {
                height: 100%;
                background: var(--primary-color, #4CAF50);
                transition: width ${this.config.progressUpdateInterval}ms ease;
                will-change: width;
            }
            
            .photo-status {
                position: absolute;
                top: 4px;
                right: 4px;
                width: 24px;
                height: 24px;
                background: rgba(255, 255, 255, 0.9);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .photo-grid-status {
                min-height: 2rem;
                padding: 0.5rem;
                text-align: center;
                font-size: 0.875rem;
                color: var(--text-secondary, #666);
                opacity: 0;
                transition: opacity ${this.config.animationDuration}ms ease;
            }
            
            .photo-grid-status.visible {
                opacity: 1;
            }
            
            .photo-grid-status.success {
                color: var(--success-color, #4CAF50);
            }
            
            .photo-grid-status.error {
                color: var(--error-color, #f44336);
            }
            
            /* Accessibility */
            .photo-item:focus {
                outline: 2px solid var(--focus-color, #2196F3);
                outline-offset: 2px;
            }
            
            /* Reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .photo-item,
                .photo-actions button,
                .photo-progress-bar {
                    transition: none;
                    animation: none;
                }
            }
            
            /* Safe mode overrides */
            .safe-mode .photo-item {
                animation: none;
                transition: none;
            }
            
            .safe-mode .photo-actions button {
                min-height: 60px;
                min-width: 60px;
                font-size: 1rem;
            }
        `;
    }
    
    setupEventListeners() {
        // Add photo button
        this.addButton.addEventListener('click', () => {
            this.triggerPhotoAdd();
        });
        
        // Select mode button
        this.selectButton.addEventListener('click', () => {
            this.toggleSelectMode();
        });
        
        // Grid click delegation
        this.gridElement.addEventListener('click', (e) => {
            const photoItem = e.target.closest('.photo-item');
            if (photoItem) {
                this.handlePhotoClick(photoItem);
            }
        });
        
        // Keyboard navigation
        this.gridElement.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Upload events
        window.addEventListener('photo-upload-photo-added', (e) => {
            this.handlePhotoAdded(e.detail);
        });
        
        window.addEventListener('photo-upload-upload-started', (e) => {
            this.handleUploadStarted(e.detail);
        });
        
        window.addEventListener('photo-upload-upload-progress', (e) => {
            this.handleUploadProgress(e.detail);
        });
        
        window.addEventListener('photo-upload-upload-complete', (e) => {
            this.handleUploadComplete(e.detail);
        });
        
        window.addEventListener('photo-upload-upload-error', (e) => {
            this.handleUploadError(e.detail);
        });
        
        window.addEventListener('memory-pressure', (e) => {
            this.handleMemoryPressure(e.detail);
        });
    }
    
    connectToUploadManager() {
        // Connect to the upload manager if available
        if (window.PhotoUploadManager) {
            this.uploadManager = window.photoUploadManager || new window.PhotoUploadManager();
            window.photoUploadManager = this.uploadManager;
        }
    }
    
    triggerPhotoAdd() {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.capture = 'environment'; // Prefer rear camera on mobile
        
        input.addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            // Check limit
            const currentCount = this.photoItems.size;
            const allowedCount = Math.min(files.length, this.config.maxPhotos - currentCount);
            
            if (allowedCount < files.length) {
                this.showStatus(`Can only add ${allowedCount} more photos`, 'error');
            }
            
            // Process files
            for (let i = 0; i < allowedCount; i++) {
                await this.addPhotoFile(files[i]);
            }
        });
        
        // Trigger file selection
        input.click();
    }
    
    async addPhotoFile(file) {
        if (!this.uploadManager) {
            console.error('Upload manager not available');
            return;
        }
        
        try {
            // Add to upload manager
            const result = await this.uploadManager.addPhoto(file, {
                source: 'file-input',
                timestamp: Date.now()
            });
            
            // Success feedback
            if (this.config.enableHaptics && navigator.vibrate) {
                navigator.vibrate(50);
            }
            
        } catch (error) {
            console.error('Failed to add photo:', error);
            this.showStatus('Failed to add photo', 'error');
        }
    }
    
    handlePhotoAdded(detail) {
        const { id, preview, status } = detail;
        
        // Create photo item
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item upload-pending';
        photoItem.dataset.photoId = id;
        photoItem.tabIndex = 0;
        photoItem.role = 'gridcell';
        photoItem.setAttribute('aria-label', `Photo ${id.slice(0, 8)}`);
        
        photoItem.innerHTML = `
            <img src="${preview}" alt="Photo preview" loading="lazy">
            <div class="photo-progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                <div class="photo-progress-bar" style="width: 0%"></div>
            </div>
            <div class="photo-status">⏳</div>
        `;
        
        // Add to grid
        this.gridElement.appendChild(photoItem);
        
        // Store reference
        this.photoItems.set(id, {
            element: photoItem,
            status: 'pending',
            progress: 0
        });
        
        // Update count
        this.updatePhotoCount();
        
        // Show select button if we have photos
        if (this.photoItems.size > 0) {
            this.selectButton.hidden = false;
        }
        
        // Announce to screen readers
        this.announce(`Photo added. ${this.photoItems.size} of ${this.config.maxPhotos} photos.`);
    }
    
    handleUploadStarted(detail) {
        const { id } = detail;
        const item = this.photoItems.get(id);
        
        if (item) {
            item.status = 'uploading';
            item.element.querySelector('.photo-status').textContent = '📤';
        }
    }
    
    handleUploadProgress(detail) {
        const { id, progress } = detail;
        const item = this.photoItems.get(id);
        
        if (item) {
            item.progress = progress;
            const progressBar = item.element.querySelector('.photo-progress-bar');
            const progressContainer = item.element.querySelector('.photo-progress');
            
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
                progressContainer.setAttribute('aria-valuenow', progress);
            }
            
            // Update status icon at milestones
            if (progress >= 50 && progress < 100) {
                item.element.querySelector('.photo-status').textContent = '⏳';
            }
        }
    }
    
    handleUploadComplete(detail) {
        const { tempId, photoId } = detail;
        const item = this.photoItems.get(tempId);
        
        if (item) {
            item.status = 'complete';
            item.photoId = photoId;
            
            // Update UI
            item.element.classList.remove('upload-pending');
            item.element.classList.add('upload-complete');
            item.element.querySelector('.photo-status').textContent = '✅';
            
            // Hide progress bar
            const progressContainer = item.element.querySelector('.photo-progress');
            if (progressContainer) {
                progressContainer.style.opacity = '0';
                setTimeout(() => progressContainer.remove(), this.config.animationDuration);
            }
            
            // Success feedback
            if (this.config.enableHaptics && navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
            }
            
            this.showStatus('Photo uploaded successfully', 'success', 2000);
        }
    }
    
    handleUploadError(detail) {
        const { id, error, recoverable } = detail;
        const item = this.photoItems.get(id);
        
        if (item) {
            item.status = 'error';
            item.error = error;
            
            // Update UI
            item.element.classList.add('upload-error');
            item.element.querySelector('.photo-status').textContent = recoverable ? '⚠️' : '❌';
            
            // Show appropriate message
            const message = recoverable ? 
                'Upload paused - will retry automatically' : 
                'Upload failed - tap to retry';
            
            this.showStatus(message, 'error', 3000);
        }
    }
    
    handlePhotoClick(photoItem) {
        const photoId = photoItem.dataset.photoId;
        const item = this.photoItems.get(photoId);
        
        if (!item) return;
        
        if (this.isMultiSelectMode) {
            // Toggle selection
            this.togglePhotoSelection(photoId, photoItem);
        } else if (item.status === 'error') {
            // Retry failed upload
            this.retryUpload(photoId);
        } else if (item.status === 'complete') {
            // View full photo
            this.viewPhoto(photoId);
        }
    }
    
    togglePhotoSelection(photoId, photoItem) {
        if (this.selectedPhotos.has(photoId)) {
            this.selectedPhotos.delete(photoId);
            photoItem.classList.remove('selected');
            photoItem.setAttribute('aria-selected', 'false');
        } else {
            this.selectedPhotos.add(photoId);
            photoItem.classList.add('selected');
            photoItem.setAttribute('aria-selected', 'true');
        }
        
        // Update UI based on selection
        this.updateSelectionUI();
    }
    
    toggleSelectMode() {
        this.isMultiSelectMode = !this.isMultiSelectMode;
        
        if (!this.isMultiSelectMode) {
            // Clear selections
            this.selectedPhotos.clear();
            this.photoItems.forEach((item, id) => {
                item.element.classList.remove('selected');
                item.element.setAttribute('aria-selected', 'false');
            });
        }
        
        // Update button
        this.selectButton.querySelector('.icon').textContent = 
            this.isMultiSelectMode ? '✅' : '☑️';
        this.selectButton.querySelector('.label').textContent = 
            this.isMultiSelectMode ? 'Done' : 'Select';
        
        this.announce(this.isMultiSelectMode ? 'Selection mode on' : 'Selection mode off');
    }
    
    updateSelectionUI() {
        const count = this.selectedPhotos.size;
        if (count > 0) {
            this.showStatus(`${count} photo${count !== 1 ? 's' : ''} selected`, 'info', 1000);
        }
    }
    
    handleKeyboardNavigation(e) {
        const focusedItem = document.activeElement;
        if (!focusedItem.classList.contains('photo-item')) return;
        
        const items = Array.from(this.gridElement.querySelectorAll('.photo-item'));
        const currentIndex = items.indexOf(focusedItem);
        let nextIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowLeft':
                nextIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowRight':
                nextIndex = Math.min(items.length - 1, currentIndex + 1);
                break;
            case 'ArrowUp':
                // Calculate items per row
                const itemsPerRow = Math.floor(this.gridElement.clientWidth / this.config.thumbnailSize);
                nextIndex = Math.max(0, currentIndex - itemsPerRow);
                break;
            case 'ArrowDown':
                const itemsPerRowDown = Math.floor(this.gridElement.clientWidth / this.config.thumbnailSize);
                nextIndex = Math.min(items.length - 1, currentIndex + itemsPerRowDown);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.handlePhotoClick(focusedItem);
                return;
            default:
                return;
        }
        
        if (nextIndex !== currentIndex) {
            e.preventDefault();
            items[nextIndex].focus();
        }
    }
    
    handleMemoryPressure(detail) {
        if (detail.isUnderPressure) {
            // Reduce quality of new uploads
            this.showStatus('Optimizing for performance...', 'info', 2000);
            
            // Could implement: reduce thumbnail quality, pause animations, etc.
        }
    }
    
    retryUpload(photoId) {
        if (this.uploadManager) {
            this.uploadManager.retryUpload(photoId);
            this.showStatus('Retrying upload...', 'info', 1500);
        }
    }
    
    viewPhoto(photoId) {
        // Emit event for photo viewer
        window.dispatchEvent(new CustomEvent('view-photo', {
            detail: { photoId }
        }));
    }
    
    showStatus(message, type = 'info', duration = 3000) {
        this.statusElement.textContent = message;
        this.statusElement.className = `photo-grid-status visible ${type}`;
        
        // Clear existing timeout
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }
        
        // Auto-hide after duration
        if (duration > 0) {
            this.statusTimeout = setTimeout(() => {
                this.statusElement.classList.remove('visible');
            }, duration);
        }
    }
    
    updatePhotoCount() {
        this.countElement.textContent = this.photoItems.size;
    }
    
    announce(message) {
        // For screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }
    
    // Public methods
    
    getPhotoCount() {
        return this.photoItems.size;
    }
    
    getSelectedPhotos() {
        return Array.from(this.selectedPhotos);
    }
    
    clearSelection() {
        this.selectedPhotos.clear();
        this.photoItems.forEach((item) => {
            item.element.classList.remove('selected');
            item.element.setAttribute('aria-selected', 'false');
        });
    }
    
    removePhoto(photoId) {
        const item = this.photoItems.get(photoId);
        if (item) {
            // Animate out
            item.element.style.opacity = '0';
            item.element.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                item.element.remove();
                this.photoItems.delete(photoId);
                this.selectedPhotos.delete(photoId);
                this.updatePhotoCount();
                
                // Hide select button if no photos
                if (this.photoItems.size === 0) {
                    this.selectButton.hidden = true;
                }
            }, this.config.animationDuration);
        }
    }
    
    destroy() {
        // Clean up event listeners
        window.removeEventListener('photo-upload-photo-added', this.handlePhotoAdded);
        window.removeEventListener('photo-upload-upload-started', this.handleUploadStarted);
        window.removeEventListener('photo-upload-upload-progress', this.handleUploadProgress);
        window.removeEventListener('photo-upload-upload-complete', this.handleUploadComplete);
        window.removeEventListener('photo-upload-upload-error', this.handleUploadError);
        window.removeEventListener('memory-pressure', this.handleMemoryPressure);
        
        // Clear timeouts
        if (this.statusTimeout) {
            clearTimeout(this.statusTimeout);
        }
        
        // Clear DOM
        this.container.innerHTML = '';
        
        // Clear references
        this.photoItems.clear();
        this.selectedPhotos.clear();
    }
}

// Export
window.PhotoGridUI = PhotoGridUI;