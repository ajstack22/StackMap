/**
 * Photo Upload Memory Fixes - The Final 5%
 * Adds iOS-specific memory detection and progressive thumbnails
 */

(function() {
    'use strict';
    
    // Override the memory pressure monitor with iOS-specific detection
    if (window.MemoryPressureMonitor) {
        const originalCheckMemoryPressure = window.MemoryPressureMonitor.prototype.checkMemoryPressure;
        
        window.MemoryPressureMonitor.prototype.checkMemoryPressure = async function() {
            // iOS Safari doesn't have performance.memory, use heuristics
            if (/iPhone|iPad/.test(navigator.userAgent) && !('memory' in performance)) {
                return this.checkMemoryPressureIOS();
            }
            
            // Fall back to original implementation
            return originalCheckMemoryPressure.call(this);
        };
        
        // iOS-specific memory pressure detection
        window.MemoryPressureMonitor.prototype.checkMemoryPressureIOS = function() {
            // Count active images and estimate memory usage
            const images = document.querySelectorAll('img');
            const activeUploads = window.photoUploadManager?.activeUploads?.size || 0;
            const photoElements = document.querySelectorAll('.photo-item').length;
            
            // Estimate memory usage
            let estimatedMB = 0;
            
            // Each image element ~2MB overhead
            estimatedMB += images.length * 2;
            
            // Each active upload ~5MB (thumbnail + processing)
            estimatedMB += activeUploads * 5;
            
            // Each photo element ~1MB (DOM + styles)
            estimatedMB += photoElements * 1;
            
            // Add base app overhead
            estimatedMB += 10;
            
            // iOS crashes around 23MB on older devices
            const threshold = 20; // Safe limit
            const pressure = estimatedMB / threshold;
            
            // Log for debugging
            console.log('[MemoryMonitor] iOS pressure check:', {
                estimatedMB,
                pressure,
                images: images.length,
                uploads: activeUploads,
                photos: photoElements
            });
            
            return Math.min(pressure, 1.0);
        };
    }
    
    // Add progressive thumbnail generation
    if (window.PhotoUploadManager) {
        window.PhotoUploadManager.prototype.generateProgressiveThumbnail = async function(imageData) {
            const startTime = performance.now();
            
            // Phase 1: Ultra-fast preview (target <20ms)
            const instantPreview = await this.generateThumbnail(imageData, {
                size: 32,
                quality: 0.1,
                timeout: 20
            });
            
            // Return immediately for UI update
            const result = { 
                thumbnail: instantPreview, 
                isProgressive: true 
            };
            
            // Phase 2: Better quality in background
            requestIdleCallback(() => {
                this.generateThumbnail(imageData, {
                    size: 64,
                    quality: 0.7,
                    timeout: 200
                }).then(betterThumbnail => {
                    // Update UI with better thumbnail
                    this.updateThumbnail(result.tempId, betterThumbnail);
                }).catch(() => {
                    // Silent fail - we have the instant preview
                });
            });
            
            const elapsed = performance.now() - startTime;
            console.log(`[Progressive Thumbnail] Initial generated in ${elapsed.toFixed(1)}ms`);
            
            return result;
        };
        
        // Override thumbnail generation to use progressive version
        const originalGenerateQuickThumbnail = window.PhotoUploadManager.prototype.generateQuickThumbnail;
        
        window.PhotoUploadManager.prototype.generateQuickThumbnail = function(imageData) {
            // For large images, use progressive generation
            if (imageData.size > 5 * 1024 * 1024) { // 5MB+
                return this.generateProgressiveThumbnail(imageData);
            }
            
            // Fall back to original for smaller images
            if (originalGenerateQuickThumbnail) {
                return originalGenerateQuickThumbnail.call(this, imageData);
            }
            
            // Default implementation if original missing
            return this.generateThumbnail(imageData, {
                size: 64,
                quality: 0.7,
                timeout: 50
            });
        };
        
        // Thumbnail generation with timeout
        window.PhotoUploadManager.prototype.generateThumbnail = async function(imageData, options = {}) {
            const {
                size = 64,
                quality = 0.7,
                timeout = 50
            } = options;
            
            return new Promise((resolve, reject) => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                // Set timeout
                const timeoutId = setTimeout(() => {
                    img.src = ''; // Cancel load
                    reject(new Error('Thumbnail generation timeout'));
                }, timeout);
                
                img.onload = () => {
                    clearTimeout(timeoutId);
                    
                    // Calculate dimensions
                    const aspectRatio = img.width / img.height;
                    let width = size;
                    let height = size;
                    
                    if (aspectRatio > 1) {
                        height = size / aspectRatio;
                    } else {
                        width = size * aspectRatio;
                    }
                    
                    // Set canvas size
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Draw scaled image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to data URL
                    const thumbnail = canvas.toDataURL('image/jpeg', quality);
                    
                    // Clean up
                    img.src = '';
                    canvas.width = 0;
                    canvas.height = 0;
                    
                    resolve(thumbnail);
                };
                
                img.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error('Failed to load image'));
                };
                
                // Convert to object URL for loading
                if (imageData instanceof Blob) {
                    img.src = URL.createObjectURL(imageData);
                } else if (typeof imageData === 'string') {
                    img.src = imageData;
                } else {
                    reject(new Error('Invalid image data type'));
                }
            });
        };
    }
    
    // Fix temp ID generation race condition
    window.TempIdGenerator = class TempIdGenerator {
        constructor() {
            this.counter = 0;
            this.lastTimestamp = 0;
        }
        
        generate() {
            const timestamp = Date.now();
            
            // Ensure uniqueness even in same millisecond
            if (timestamp === this.lastTimestamp) {
                this.counter++;
            } else {
                this.counter = 0;
                this.lastTimestamp = timestamp;
            }
            
            // Add performance.now() for microsecond precision
            const microtime = Math.floor(performance.now() * 1000);
            
            return `temp_${timestamp}_${this.counter}_${microtime}_${Math.random().toString(36).slice(2)}`;
        }
    };
    
    // Global instance
    window.tempIdGenerator = new window.TempIdGenerator();
    
    // Override PhotoUploadManager to use the fixed generator
    if (window.PhotoUploadManager) {
        const originalAddPhoto = window.PhotoUploadManager.prototype.addPhoto;
        
        window.PhotoUploadManager.prototype.addPhoto = async function(imageData, metadata = {}) {
            // Use the fixed temp ID generator
            const tempId = window.tempIdGenerator.generate();
            
            // Create optimistic UI entry (<100ms requirement)
            const optimisticEntry = await this.createOptimisticEntry(imageData, tempId);
            
            // Continue with original logic...
            if (originalAddPhoto) {
                // Inject the tempId into the original method
                this.currentTempId = tempId;
                return originalAddPhoto.call(this, imageData, metadata);
            }
            
            // Fallback implementation
            this.updateUI('photo-added', {
                id: tempId,
                preview: optimisticEntry.thumbnail,
                status: 'pending',
                progress: 0
            });
            
            return this.uploadQueue.add(
                async () => this.processPhotoUpload(imageData, tempId, metadata),
                { priority: this.calculatePriority(metadata) }
            ).catch(error => {
                return this.handleUploadFailure(tempId, imageData, error);
            });
        };
    }
    
    console.log('[Photo Upload Fixes] iOS memory detection and progressive thumbnails loaded');
})();