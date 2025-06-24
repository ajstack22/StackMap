/**
 * Memory Pressure Monitor
 * Detects and responds to memory pressure to prevent crashes
 * Especially important for iOS devices with strict memory limits
 */

class MemoryPressureMonitor {
    constructor(options = {}) {
        // Configuration
        this.threshold = options.threshold || 0.8; // 80% memory usage
        this.checkInterval = options.checkInterval || 1000; // Check every second
        this.onPressure = options.onPressure || (() => {});
        this.onRecovery = options.onRecovery || (() => {});
        
        // State
        this.isUnderPressure = false;
        this.lastCheck = 0;
        this.checkTimer = null;
        this.memoryHistory = [];
        this.maxHistorySize = 10;
        
        // Device-specific limits
        this.deviceMemoryLimit = this.detectDeviceMemoryLimit();
        
        // Start monitoring
        this.startMonitoring();
    }
    
    async checkMemoryPressure() {
        try {
            const usage = await this.calculateMemoryUsage();
            
            // Add to history for trend analysis
            this.memoryHistory.push({
                usage,
                timestamp: Date.now()
            });
            
            // Keep history size limited
            if (this.memoryHistory.length > this.maxHistorySize) {
                this.memoryHistory.shift();
            }
            
            // Check against threshold
            if (usage > this.threshold && !this.isUnderPressure) {
                this.isUnderPressure = true;
                this.handlePressureDetected(usage);
            } else if (usage < (this.threshold - 0.1) && this.isUnderPressure) {
                // Hysteresis to prevent flapping
                this.isUnderPressure = false;
                this.handlePressureRelieved(usage);
            }
            
            // Emit status update
            this.emitMemoryStatus(usage);
            
            return usage;
            
        } catch (error) {
            console.warn('Memory check failed:', error);
            return 0.5; // Safe default
        }
    }
    
    async calculateMemoryUsage() {
        // Method 1: Performance Memory API (Chrome/Edge)
        if (this.hasPerformanceMemory()) {
            return this.getPerformanceMemoryUsage();
        }
        
        // Method 2: Estimate based on active photo uploads
        const photoUsage = this.estimatePhotoMemoryUsage();
        if (photoUsage > 0) {
            return photoUsage;
        }
        
        // Method 3: Navigator.deviceMemory estimation
        if (this.hasDeviceMemory()) {
            return this.estimateDeviceMemoryUsage();
        }
        
        // Method 4: Heuristic based on platform
        return this.getPlatformBasedEstimate();
    }
    
    hasPerformanceMemory() {
        return 'memory' in performance && 
               performance.memory && 
               performance.memory.usedJSHeapSize > 0;
    }
    
    getPerformanceMemoryUsage() {
        const memory = performance.memory;
        const used = memory.usedJSHeapSize;
        const total = memory.jsHeapSizeLimit;
        
        // Calculate usage ratio
        const usage = used / total;
        
        // Log for debugging
        console.debug('Memory usage (Performance API):', {
            used: `${Math.round(used / 1024 / 1024)}MB`,
            total: `${Math.round(total / 1024 / 1024)}MB`,
            usage: `${Math.round(usage * 100)}%`
        });
        
        return usage;
    }
    
    estimatePhotoMemoryUsage() {
        // Get photo upload manager if available
        const photoManager = window.photoUploadManager;
        if (!photoManager) return 0;
        
        const status = photoManager.getQueueStatus();
        const activeCount = status.activeUploads;
        const queuedCount = status.queueLength;
        
        // Estimate memory usage
        // Active uploads: ~40MB per photo (uncompressed)
        // Queued: ~5MB per photo (thumbnail + metadata)
        const activeMB = activeCount * 40;
        const queuedMB = queuedCount * 5;
        const totalMB = activeMB + queuedMB;
        
        // Calculate usage based on device limit
        const usage = totalMB / this.deviceMemoryLimit;
        
        console.debug('Memory usage (Photo estimate):', {
            active: `${activeCount} photos (${activeMB}MB)`,
            queued: `${queuedCount} photos (${queuedMB}MB)`,
            total: `${totalMB}MB`,
            usage: `${Math.round(usage * 100)}%`
        });
        
        return usage;
    }
    
    hasDeviceMemory() {
        return 'deviceMemory' in navigator && navigator.deviceMemory > 0;
    }
    
    estimateDeviceMemoryUsage() {
        const deviceGB = navigator.deviceMemory;
        const deviceMB = deviceGB * 1024;
        
        // Estimate current usage based on various factors
        let estimatedMB = 0;
        
        // Base browser usage
        estimatedMB += 100; // 100MB base
        
        // DOM size estimate
        const domNodes = document.getElementsByTagName('*').length;
        estimatedMB += domNodes * 0.001; // ~1KB per DOM node
        
        // Image elements
        const images = document.getElementsByTagName('img');
        estimatedMB += images.length * 2; // ~2MB per displayed image
        
        // Active photo uploads
        const photoManager = window.photoUploadManager;
        if (photoManager) {
            const status = photoManager.getQueueStatus();
            estimatedMB += status.activeUploads * 40;
        }
        
        const usage = Math.min(estimatedMB / deviceMB, 1);
        
        console.debug('Memory usage (Device estimate):', {
            device: `${deviceGB}GB`,
            estimated: `${estimatedMB}MB`,
            usage: `${Math.round(usage * 100)}%`
        });
        
        return usage;
    }
    
    getPlatformBasedEstimate() {
        // Conservative estimate based on platform
        const platform = this.detectPlatform();
        
        // Check for memory pressure indicators
        let pressureScore = 0;
        
        // Check if images are failing to load
        const images = document.getElementsByTagName('img');
        for (let img of images) {
            if (img.naturalWidth === 0 && img.complete) {
                pressureScore += 0.1;
            }
        }
        
        // Check for slow performance
        if (this.memoryHistory.length > 2) {
            const recent = this.memoryHistory.slice(-3);
            const avgTime = recent.reduce((sum, item) => sum + item.timestamp, 0) / recent.length;
            if (Date.now() - avgTime > this.checkInterval * 2) {
                pressureScore += 0.2;
            }
        }
        
        // Platform-specific base estimate
        const baseEstimate = {
            'ios': 0.6,      // iOS is more aggressive
            'android': 0.5,  // Android varies
            'desktop': 0.3   // Desktop has more memory
        }[platform] || 0.5;
        
        return Math.min(baseEstimate + pressureScore, 1);
    }
    
    detectPlatform() {
        const ua = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        if (platform.includes('iphone') || platform.includes('ipad') || 
            ua.includes('iphone') || ua.includes('ipad')) {
            return 'ios';
        } else if (platform.includes('android') || ua.includes('android')) {
            return 'android';
        } else {
            return 'desktop';
        }
    }
    
    detectDeviceMemoryLimit() {
        const platform = this.detectPlatform();
        
        // Conservative limits by platform
        const limits = {
            'ios': 100,      // 100MB safe limit for iOS
            'android': 200,  // 200MB safe limit for Android
            'desktop': 500   // 500MB safe limit for desktop
        };
        
        let limit = limits[platform] || 200;
        
        // Adjust based on device memory if available
        if ('deviceMemory' in navigator && navigator.deviceMemory > 0) {
            const deviceGB = navigator.deviceMemory;
            if (deviceGB <= 2) {
                limit *= 0.5; // Half the limit for low-memory devices
            } else if (deviceGB >= 8) {
                limit *= 2; // Double for high-memory devices
            }
        }
        
        console.log(`Memory limit set to ${limit}MB for ${platform}`);
        return limit;
    }
    
    handlePressureDetected(usage) {
        console.warn('Memory pressure detected:', {
            usage: `${Math.round(usage * 100)}%`,
            threshold: `${Math.round(this.threshold * 100)}%`
        });
        
        // Call registered callback
        this.onPressure(usage);
        
        // Emit event
        window.dispatchEvent(new CustomEvent('memory-pressure', {
            detail: {
                level: usage,
                threshold: this.threshold,
                isUnderPressure: true
            }
        }));
        
        // Take immediate action
        this.triggerMemoryCleanup();
    }
    
    handlePressureRelieved(usage) {
        console.log('Memory pressure relieved:', {
            usage: `${Math.round(usage * 100)}%`,
            threshold: `${Math.round(this.threshold * 100)}%`
        });
        
        // Call registered callback
        this.onRecovery(usage);
        
        // Emit event
        window.dispatchEvent(new CustomEvent('memory-pressure', {
            detail: {
                level: usage,
                threshold: this.threshold,
                isUnderPressure: false
            }
        }));
    }
    
    triggerMemoryCleanup() {
        // Request garbage collection if available (non-standard)
        if (window.gc) {
            window.gc();
        }
        
        // Clear image caches
        const images = document.getElementsByTagName('img');
        for (let img of images) {
            if (img.src && img.src.startsWith('blob:')) {
                // Don't revoke active upload previews
                const isActiveUpload = img.closest('.photo-item:not(.upload-complete)');
                if (!isActiveUpload) {
                    URL.revokeObjectURL(img.src);
                }
            }
        }
        
        // Clear old data from memory history
        if (this.memoryHistory.length > 5) {
            this.memoryHistory = this.memoryHistory.slice(-5);
        }
        
        // Emit cleanup event for other components
        window.dispatchEvent(new CustomEvent('memory-cleanup-requested'));
    }
    
    emitMemoryStatus(usage) {
        window.dispatchEvent(new CustomEvent('memory-status', {
            detail: {
                usage: usage,
                usagePercent: Math.round(usage * 100),
                isUnderPressure: this.isUnderPressure,
                deviceLimit: this.deviceMemoryLimit,
                platform: this.detectPlatform()
            }
        }));
    }
    
    startMonitoring() {
        // Initial check
        this.checkMemoryPressure();
        
        // Schedule regular checks
        this.checkTimer = setInterval(() => {
            this.checkMemoryPressure();
        }, this.checkInterval);
        
        // Listen for visibility changes to pause when hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseMonitoring();
            } else {
                this.resumeMonitoring();
            }
        });
        
        console.log('Memory pressure monitoring started');
    }
    
    pauseMonitoring() {
        if (this.checkTimer) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
    }
    
    resumeMonitoring() {
        if (!this.checkTimer) {
            this.startMonitoring();
        }
    }
    
    stopMonitoring() {
        this.pauseMonitoring();
        this.memoryHistory = [];
        this.isUnderPressure = false;
        console.log('Memory pressure monitoring stopped');
    }
    
    // Testing helper
    async simulatePressure(level) {
        console.log('Simulating memory pressure:', level);
        const mockUsage = level;
        
        if (mockUsage > this.threshold && !this.isUnderPressure) {
            this.isUnderPressure = true;
            this.handlePressureDetected(mockUsage);
        }
        
        return mockUsage;
    }
    
    // Public API
    getStatus() {
        const latestCheck = this.memoryHistory[this.memoryHistory.length - 1];
        return {
            isUnderPressure: this.isUnderPressure,
            currentUsage: latestCheck ? latestCheck.usage : 0,
            threshold: this.threshold,
            deviceLimit: this.deviceMemoryLimit,
            platform: this.detectPlatform(),
            history: this.memoryHistory.map(item => ({
                usage: Math.round(item.usage * 100),
                timestamp: item.timestamp
            }))
        };
    }
    
    setThreshold(threshold) {
        this.threshold = Math.max(0.1, Math.min(1, threshold));
        console.log('Memory threshold updated to:', this.threshold);
    }
}

// Export
window.MemoryPressureMonitor = MemoryPressureMonitor;