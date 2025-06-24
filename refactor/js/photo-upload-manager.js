/**
 * Photo Upload Manager
 * Handles rapid photo additions without crashes for ADHD users in hyperfocus
 * Implements queue management, memory monitoring, and optimistic UI
 */

class PhotoUploadManager {
    constructor() {
        // Queue configuration using native JavaScript
        this.uploadQueue = [];
        this.concurrency = 2;
        this.activeUploads = new Map();
        this.isProcessing = false;
        this.isPaused = false;
        
        // State tracking
        this.tempIdMap = new Map();
        this.completedUploads = new Set();
        
        // Memory monitoring
        this.memoryMonitor = null;
        this.memoryPressure = false;
        
        // Storage manager
        this.storageManager = null;
        
        // Retry manager
        this.retryManager = null;
        
        // Initialize components
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize memory monitor
            const MemoryPressureMonitor = window.MemoryPressureMonitor;
            if (MemoryPressureMonitor) {
                this.memoryMonitor = new MemoryPressureMonitor({
                    threshold: 0.8,
                    checkInterval: 1000,
                    onPressure: (pressure) => this.reduceQueuePressure(pressure),
                    onRecovery: (pressure) => this.restoreQueueCapacity(pressure)
                });
            }
            
            // Initialize storage manager
            const HybridStorageManager = window.HybridStorageManager;
            if (HybridStorageManager) {
                this.storageManager = new HybridStorageManager();
                await this.storageManager.initialize();
            }
            
            // Initialize retry manager
            const UploadRetryManager = window.UploadRetryManager;
            if (UploadRetryManager) {
                this.retryManager = new UploadRetryManager();
            }
            
            // Initialize crash recovery
            await this.initializeCrashRecovery();
            
            console.log('PhotoUploadManager initialized');
        } catch (error) {
            console.error('Failed to initialize PhotoUploadManager:', error);
        }
    }
    
    async addPhoto(imageData, metadata = {}) {
        // Generate temporary ID immediately
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        
        try {
            // Create optimistic UI entry (<100ms requirement)
            const optimisticEntry = await this.createOptimisticEntry(imageData, tempId);
            
            // Update UI immediately
            this.updateUI('photo-added', {
                id: tempId,
                preview: optimisticEntry.thumbnail,
                status: 'pending',
                progress: 0
            });
            
            // Calculate priority
            const priority = this.calculatePriority(metadata);
            
            // Add to queue
            const queueItem = {
                tempId,
                imageData,
                metadata,
                priority,
                addedAt: Date.now(),
                attempts: 0,
                status: 'queued'
            };
            
            this.uploadQueue.push(queueItem);
            this.uploadQueue.sort((a, b) => b.priority - a.priority);
            
            // Process queue
            this.processQueue();
            
            return { tempId, queued: true };
            
        } catch (error) {
            // Never lose the photo - save to recovery storage
            return this.handleUploadFailure(tempId, imageData, error);
        }
    }
    
    async createOptimisticEntry(imageData, tempId) {
        const startTime = Date.now();
        
        try {
            // Generate thumbnail immediately (target: <50ms)
            const thumbnail = await this.generateQuickThumbnail(imageData);
            
            // Save to temporary storage if available
            if (this.storageManager) {
                await this.storageManager.saveTempPhoto({
                    id: tempId,
                    thumbnail,
                    timestamp: Date.now(),
                    status: 'pending'
                });
            }
            
            const elapsed = Date.now() - startTime;
            if (elapsed > 50) {
                console.warn(`Thumbnail generation took ${elapsed}ms (target: 50ms)`);
            }
            
            return { thumbnail, tempId };
            
        } catch (error) {
            console.error('Failed to create optimistic entry:', error);
            // Return placeholder on error
            return { 
                thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iMzIiIHk9IjM2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjE2Ij7wn5O4PC90ZXh0Pjwvc3ZnPg==',
                tempId 
            };
        }
    }
    
    async generateQuickThumbnail(imageData) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // Set canvas to thumbnail size
            canvas.width = 64;
            canvas.height = 64;
            
            img.onload = () => {
                try {
                    // Calculate crop for square thumbnail
                    const size = Math.min(img.width, img.height);
                    const x = (img.width - size) / 2;
                    const y = (img.height - size) / 2;
                    
                    // Draw cropped and scaled image
                    ctx.drawImage(img, x, y, size, size, 0, 0, 64, 64);
                    
                    // Convert to data URL
                    const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(thumbnail);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = reject;
            
            // Load image data
            if (imageData instanceof Blob) {
                img.src = URL.createObjectURL(imageData);
            } else if (typeof imageData === 'string') {
                img.src = imageData;
            } else {
                reject(new Error('Invalid image data type'));
            }
        });
    }
    
    async processQueue() {
        // Prevent concurrent processing
        if (this.isProcessing || this.isPaused) return;
        
        this.isProcessing = true;
        
        try {
            while (this.uploadQueue.length > 0 && this.activeUploads.size < this.concurrency) {
                // Get next item from queue
                const queueItem = this.uploadQueue.shift();
                if (!queueItem) break;
                
                // Check if already completed (deduplication)
                if (this.completedUploads.has(queueItem.tempId)) {
                    continue;
                }
                
                // Start processing
                this.processPhotoUpload(queueItem);
            }
        } finally {
            this.isProcessing = false;
        }
    }
    
    async processPhotoUpload(queueItem) {
        const { tempId, imageData, metadata } = queueItem;
        
        try {
            // Track active upload
            this.activeUploads.set(tempId, {
                startTime: Date.now(),
                progress: 0,
                controller: new AbortController(),
                queueItem
            });
            
            // Update status
            this.updateUI('upload-started', { id: tempId });
            
            // Step 1: Prepare image data with streaming
            const preparedData = await this.prepareImageStream(imageData);
            
            // Step 2: Save metadata to SQLite (fast)
            let photoRecord = null;
            if (this.storageManager) {
                photoRecord = await this.storageManager.savePhotoMetadata(
                    tempId, 
                    metadata,
                    preparedData.thumbnail
                );
            }
            
            // Step 3: Stream upload with progress
            const uploadResult = await this.streamUpload(
                preparedData,
                tempId,
                photoRecord?.photoId || tempId
            );
            
            // Step 4: Finalize and update UI
            await this.finalizeUpload(tempId, photoRecord?.photoId || tempId, uploadResult);
            
            // Mark as completed
            this.completedUploads.add(tempId);
            
            // Remove from active uploads
            this.activeUploads.delete(tempId);
            
            // Process next in queue
            this.processQueue();
            
            return { success: true, photoId: photoRecord?.photoId || tempId };
            
        } catch (error) {
            console.error(`Upload failed for ${tempId}:`, error);
            
            // Remove from active uploads
            this.activeUploads.delete(tempId);
            
            // Intelligent retry with backoff
            if (this.retryManager && queueItem.attempts < 3) {
                queueItem.attempts++;
                return this.retryManager.retryUpload(tempId, imageData, metadata, error, queueItem.attempts);
            } else {
                return this.handleUploadFailure(tempId, imageData, error);
            }
        }
    }
    
    async prepareImageStream(imageData) {
        // Basic preparation for now - full streaming in Phase 3
        const blob = imageData instanceof Blob ? 
            imageData : 
            await this.imageDataToBlob(imageData);
        
        // Generate thumbnail if not already done
        const thumbnail = await this.generateQuickThumbnail(blob);
        
        return {
            blob,
            thumbnail,
            totalSize: blob.size,
            mimeType: blob.type || 'image/jpeg'
        };
    }
    
    async streamUpload(preparedData, tempId, photoId) {
        // Simplified upload for now - full streaming in Phase 3
        const { blob } = preparedData;
        
        // Simulate progress updates
        for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            this.updateProgress(tempId, progress);
        }
        
        // Save full image if storage manager available
        if (this.storageManager) {
            const filePath = await this.storageManager.saveFullImage(photoId, blob);
            return { success: true, filePath };
        }
        
        return { success: true };
    }
    
    updateProgress(tempId, progress) {
        // Update active upload tracking
        const activeUpload = this.activeUploads.get(tempId);
        if (activeUpload) {
            activeUpload.progress = progress;
        }
        
        // Emit progress event
        this.updateUI('upload-progress', { 
            id: tempId, 
            progress: Math.round(progress) 
        });
    }
    
    async finalizeUpload(tempId, photoId, uploadResult) {
        // Update UI to show completion
        this.updateUI('upload-complete', {
            tempId,
            photoId,
            result: uploadResult
        });
        
        // Clean up temporary storage if needed
        if (this.storageManager) {
            await this.storageManager.cleanupTempPhoto(tempId);
        }
    }
    
    calculatePriority(metadata) {
        let priority = 0;
        
        // Higher priority for certain metadata
        if (metadata.urgent) priority += 10;
        if (metadata.important) priority += 5;
        if (metadata.taskId) priority += 3;
        
        // Lower priority for recovery uploads
        if (metadata.isRecovery) priority -= 5;
        
        return priority;
    }
    
    reduceQueuePressure(pressure) {
        console.log('Memory pressure detected:', pressure);
        
        // Reduce concurrency under memory pressure
        this.concurrency = 1;
        this.memoryPressure = true;
        
        // Pause queue temporarily
        this.pauseQueue();
        
        // Resume with reduced capacity after delay
        setTimeout(() => {
            this.resumeQueue();
        }, 1000);
    }
    
    restoreQueueCapacity(pressure) {
        console.log('Memory pressure relieved:', pressure);
        
        // Restore normal concurrency
        this.concurrency = 2;
        this.memoryPressure = false;
        
        // Resume processing if paused
        if (this.isPaused) {
            this.resumeQueue();
        }
    }
    
    pauseQueue() {
        this.isPaused = true;
        
        // Emit pause event
        this.updateUI('queue-paused', {
            reason: 'memory-pressure',
            activeCount: this.activeUploads.size
        });
    }
    
    resumeQueue() {
        this.isPaused = false;
        
        // Emit resume event
        this.updateUI('queue-resumed', {
            queueLength: this.uploadQueue.length
        });
        
        // Process queue
        this.processQueue();
    }
    
    async handleUploadFailure(tempId, imageData, error) {
        console.error(`Handling upload failure for ${tempId}:`, error);
        
        // Save to recovery storage
        if (this.storageManager) {
            await this.storageManager.savePhotoForRecovery({
                tempId,
                imageData,
                error: error.message,
                timestamp: Date.now()
            });
        }
        
        // Update UI with error
        this.updateUI('upload-error', {
            id: tempId,
            error: error.name || 'UnknownError',
            message: error.message,
            recoverable: true
        });
        
        return { 
            success: false, 
            tempId,
            error: error.message,
            recoverable: true 
        };
    }
    
    async initializeCrashRecovery() {
        // Check for unfinished uploads from previous session
        if (this.storageManager) {
            const orphanedUploads = await this.storageManager.getOrphanedUploads();
            
            if (orphanedUploads.length > 0) {
                console.log(`Found ${orphanedUploads.length} orphaned uploads`);
                
                // Re-queue orphaned uploads
                for (const upload of orphanedUploads) {
                    this.addPhoto(upload.imageData, {
                        ...upload.metadata,
                        isRecovery: true
                    });
                }
            }
        }
    }
    
    updateUI(event, data) {
        // Emit custom event for UI updates
        window.dispatchEvent(new CustomEvent('photo-upload-' + event, {
            detail: data
        }));
        
        // Also emit generic event
        window.dispatchEvent(new CustomEvent('photo-upload-update', {
            detail: { event, data }
        }));
    }
    
    async imageDataToBlob(imageData) {
        if (imageData instanceof Blob) {
            return imageData;
        }
        
        // Handle data URL
        if (typeof imageData === 'string' && imageData.startsWith('data:')) {
            const response = await fetch(imageData);
            return response.blob();
        }
        
        // Handle base64
        if (typeof imageData === 'string') {
            const response = await fetch(`data:image/jpeg;base64,${imageData}`);
            return response.blob();
        }
        
        throw new Error('Unsupported image data type');
    }
    
    // Public API methods
    
    getQueueStatus() {
        return {
            queueLength: this.uploadQueue.length,
            activeUploads: this.activeUploads.size,
            concurrency: this.concurrency,
            isPaused: this.isPaused,
            memoryPressure: this.memoryPressure
        };
    }
    
    getUploadProgress(tempId) {
        const activeUpload = this.activeUploads.get(tempId);
        return activeUpload ? activeUpload.progress : null;
    }
    
    cancelUpload(tempId) {
        const activeUpload = this.activeUploads.get(tempId);
        if (activeUpload && activeUpload.controller) {
            activeUpload.controller.abort();
            this.activeUploads.delete(tempId);
            
            // Update UI
            this.updateUI('upload-cancelled', { id: tempId });
            
            return true;
        }
        
        // Remove from queue if not started
        const queueIndex = this.uploadQueue.findIndex(item => item.tempId === tempId);
        if (queueIndex !== -1) {
            this.uploadQueue.splice(queueIndex, 1);
            
            // Update UI
            this.updateUI('upload-cancelled', { id: tempId });
            
            return true;
        }
        
        return false;
    }
    
    retryUpload(tempId) {
        // Find in completed uploads
        if (this.completedUploads.has(tempId)) {
            console.log('Upload already completed:', tempId);
            return false;
        }
        
        // Trigger retry through UI event
        this.updateUI('retry-requested', { id: tempId });
        
        return true;
    }
}

// Export
window.PhotoUploadManager = PhotoUploadManager;