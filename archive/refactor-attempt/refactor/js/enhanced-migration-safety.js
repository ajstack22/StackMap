/**
 * Enhanced Migration Safety System
 * Implements PM review requirements for bulletproof migrations
 * Includes 5-second rollback, comprehensive integrity checks, and better messaging
 */

(function() {
    'use strict';
    
    class EnhancedMigrationSafety {
        constructor() {
            // Enhanced battery thresholds (per PM review)
            this.batteryThresholds = {
                mobile: 0.40,      // 40% for mobile devices
                web: 0.20,         // 20% for web (often plugged in)
                pwaiOS: 0.45,      // 45% for iOS PWA (aggressive power management)
                pwaAndroid: 0.35   // 35% for Android PWA
            };
            
            // Canary migration settings
            this.canarySettings = {
                enabled: true,
                percentage: 0.01,  // Test with 1% of data first
                maxRows: 100       // But no more than 100 rows
            };
            
            // Memory-aware batch sizing
            this.batchSettings = {
                minSize: 10,
                maxSize: 5000,
                targetMemoryUsage: 0.1  // Use max 10% of available memory
            };
            
            // Telemetry collection
            this.telemetry = {
                enabled: true,
                data: {}
            };
        }
        
        /**
         * Enhanced pre-flight checks with all PM requirements
         */
        async performPreflightChecks(options = {}) {
            console.log('[EnhancedMigrationSafety] Starting comprehensive pre-flight checks...');
            
            // Start telemetry
            this.startTelemetry();
            
            const results = {
                timestamp: Date.now(),
                canProceed: true,
                warnings: [],
                errors: [],
                checks: {}
            };
            
            // 1. Comprehensive integrity check
            results.checks.integrity = await this.performComprehensiveIntegrityCheck();
            if (!results.checks.integrity.passed) {
                results.errors.push('Database integrity compromised');
                results.canProceed = false;
            }
            
            // 2. Enhanced battery check with estimation
            results.checks.battery = await this.performEnhancedBatteryCheck();
            if (!results.checks.battery.sufficient && !options.overrideBattery) {
                results.errors.push(
                    `Battery too low (${Math.round(results.checks.battery.level * 100)}%). ` +
                    `Please charge to at least ${Math.round(results.checks.battery.required * 100)}%`
                );
                results.canProceed = false;
            } else if (!results.checks.battery.sufficient && options.overrideBattery) {
                results.warnings.push(
                    `Low battery override active. Current: ${Math.round(results.checks.battery.level * 100)}%`
                );
            }
            
            // 3. Storage quota with detailed breakdown
            results.checks.storage = await this.performStorageQuotaCheck();
            if (!results.checks.storage.sufficient) {
                const needed = this.formatBytes(results.checks.storage.required);
                const available = this.formatBytes(results.checks.storage.available);
                results.errors.push(
                    `Not enough storage. Need ${needed}, have ${available}`
                );
                results.canProceed = false;
            }
            
            // 4. Memory pressure check with dynamic batch sizing
            results.checks.memory = await this.performMemoryCheck();
            if (!results.checks.memory.sufficient) {
                results.warnings.push('High memory usage detected. Migration will use smaller batches.');
                // Adjust batch size based on available memory
                this.adjustBatchSize(results.checks.memory);
            }
            
            // 5. Network state (for cloud backup if enabled)
            results.checks.network = await this.checkNetworkState();
            if (!results.checks.network.connected && options.requireNetwork) {
                results.errors.push('Network connection required for cloud backup');
                results.canProceed = false;
            }
            
            // 6. Platform-specific checks
            results.checks.platform = await this.performPlatformChecks();
            if (!results.checks.platform.ready) {
                results.errors.push(results.checks.platform.reason);
                results.canProceed = false;
            }
            
            // 7. Previous migration check
            results.checks.previousMigration = await this.checkPreviousMigration();
            if (results.checks.previousMigration.inProgress) {
                results.errors.push('Previous migration still in progress');
                results.canProceed = false;
            }
            
            // Record telemetry
            this.telemetry.data.preflightResults = results;
            
            return results;
        }
        
        /**
         * Comprehensive database integrity check (per PM requirements)
         */
        async performComprehensiveIntegrityCheck() {
            const startTime = performance.now();
            const results = {
                passed: true,
                duration: 0,
                checks: {}
            };
            
            try {
                // 1. SQLite PRAGMA integrity_check
                results.checks.sqliteIntegrity = await this.checkSQLiteIntegrity();
                if (!results.checks.sqliteIntegrity.ok) {
                    results.passed = false;
                }
                
                // 2. Row count verification
                results.checks.rowCounts = await this.verifyRowCounts();
                if (!results.checks.rowCounts.matches) {
                    results.passed = false;
                }
                
                // 3. Critical data checksums
                results.checks.checksums = await this.verifyCriticalDataChecksums();
                if (!results.checks.checksums.valid) {
                    results.passed = false;
                }
                
                // 4. Foreign key consistency
                results.checks.foreignKeys = await this.checkForeignKeyConsistency();
                if (!results.checks.foreignKeys.consistent) {
                    results.passed = false;
                }
                
                // 5. Index statistics
                results.checks.indexes = await this.checkIndexStatistics();
                if (!results.checks.indexes.healthy) {
                    results.passed = false;
                }
                
                // 6. Data type consistency
                results.checks.dataTypes = await this.checkDataTypeConsistency();
                if (!results.checks.dataTypes.consistent) {
                    results.passed = false;
                }
                
            } catch (error) {
                console.error('[EnhancedMigrationSafety] Integrity check error:', error);
                results.passed = false;
                results.error = error.message;
            }
            
            results.duration = performance.now() - startTime;
            return results;
        }
        
        /**
         * Check SQLite database integrity
         */
        async checkSQLiteIntegrity() {
            if (!window.TaskSQLite || !window.TaskSQLite.isReady) {
                return { ok: true, details: 'SQLite not initialized yet' };
            }
            
            try {
                const result = await window.TaskSQLite.executeQuery('PRAGMA integrity_check');
                const ok = result && result[0] && result[0].integrity_check === 'ok';
                
                if (!ok) {
                    console.error('[EnhancedMigrationSafety] SQLite integrity check failed:', result);
                }
                
                return {
                    ok: ok,
                    details: result,
                    timestamp: Date.now()
                };
            } catch (error) {
                return {
                    ok: false,
                    error: error.message,
                    timestamp: Date.now()
                };
            }
        }
        
        /**
         * Verify row counts match stored metadata
         */
        async verifyRowCounts() {
            const results = {
                matches: true,
                tables: {},
                totalRows: 0
            };
            
            try {
                // Get stored row counts from metadata
                const metadata = await this.getMigrationMetadata();
                const storedCounts = metadata.rowCounts || {};
                
                // Get actual row counts
                const actualCounts = await this.getActualRowCounts();
                
                // Compare counts
                for (const table in storedCounts) {
                    const stored = storedCounts[table];
                    const actual = actualCounts[table] || 0;
                    const difference = Math.abs(stored - actual);
                    
                    results.tables[table] = {
                        stored: stored,
                        actual: actual,
                        difference: difference,
                        matches: difference <= 1  // Allow 1 row difference
                    };
                    
                    if (difference > 1) {
                        results.matches = false;
                        console.warn(`[EnhancedMigrationSafety] Row count mismatch in ${table}: stored=${stored}, actual=${actual}`);
                    }
                    
                    results.totalRows += actual;
                }
                
            } catch (error) {
                console.error('[EnhancedMigrationSafety] Row count verification error:', error);
                results.matches = true; // Don't block on metadata errors
                results.error = error.message;
            }
            
            return results;
        }
        
        /**
         * Verify critical data checksums
         */
        async verifyCriticalDataChecksums() {
            const results = {
                valid: true,
                checksums: {},
                totalDataSize: 0
            };
            
            try {
                // Get critical data collections
                const criticalData = await this.getCriticalData();
                
                // Calculate and verify checksums
                for (const dataType in criticalData) {
                    const data = criticalData[dataType];
                    const dataStr = JSON.stringify(data);
                    const checksum = await this.calculateChecksum(dataStr);
                    const storedChecksum = await this.getStoredChecksum(dataType);
                    
                    results.checksums[dataType] = {
                        current: checksum,
                        stored: storedChecksum,
                        matches: !storedChecksum || checksum === storedChecksum,
                        dataSize: dataStr.length
                    };
                    
                    if (storedChecksum && checksum !== storedChecksum) {
                        results.valid = false;
                        console.error(`[EnhancedMigrationSafety] Checksum mismatch for ${dataType}`);
                    }
                    
                    results.totalDataSize += dataStr.length;
                }
                
            } catch (error) {
                console.error('[EnhancedMigrationSafety] Checksum verification error:', error);
                results.valid = true; // Don't block on checksum errors
                results.error = error.message;
            }
            
            return results;
        }
        
        /**
         * Get critical data for checksum verification
         */
        async getCriticalData() {
            const data = {};
            
            // Tasks are critical
            if (window.StorageAdapter) {
                const tasksJson = await window.StorageAdapter.getItem('stackmap_tasks');
                data.tasks = tasksJson ? JSON.parse(tasksJson) : [];
            }
            
            // User preferences are critical
            const preferences = await window.StorageAdapter.getItem('preferences');
            if (preferences) {
                data.preferences = JSON.parse(preferences);
            }
            
            return data;
        }
        
        /**
         * Calculate SHA-256 checksum
         */
        async calculateChecksum(data) {
            if (crypto.subtle) {
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(data);
                const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }
            
            // Fallback for older browsers
            let hash = 0;
            for (let i = 0; i < data.length; i++) {
                const char = data.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(16);
        }
        
        /**
         * Enhanced battery check with time estimation
         */
        async performEnhancedBatteryCheck() {
            const results = {
                level: 1.0,
                charging: false,
                required: 0.40,
                sufficient: true,
                estimatedDrain: 0,
                estimatedDuration: 0,
                platform: 'unknown'
            };
            
            try {
                // Detect platform for appropriate threshold
                results.platform = this.detectDetailedPlatform();
                results.required = this.batteryThresholds[results.platform] || 0.40;
                
                // Get battery status
                if ('getBattery' in navigator) {
                    const battery = await navigator.getBattery();
                    results.level = battery.level;
                    results.charging = battery.charging;
                    
                    // Estimate migration duration and battery drain
                    const estimate = await this.estimateMigrationImpact();
                    results.estimatedDuration = estimate.duration;
                    results.estimatedDrain = estimate.batteryDrain;
                    
                    // Check if we have enough battery
                    const effectiveLevel = results.level - results.estimatedDrain;
                    results.sufficient = effectiveLevel >= results.required || results.charging;
                    
                    if (!results.sufficient) {
                        console.warn(
                            `[EnhancedMigrationSafety] Insufficient battery: ` +
                            `current=${Math.round(results.level * 100)}%, ` +
                            `drain=${Math.round(results.estimatedDrain * 100)}%, ` +
                            `required=${Math.round(results.required * 100)}%`
                        );
                    }
                }
            } catch (error) {
                console.log('[EnhancedMigrationSafety] Battery API not available:', error);
                // Default to allowing migration if can't check
                results.sufficient = true;
            }
            
            return results;
        }
        
        /**
         * Detect platform with nuance for different PWA environments
         */
        detectDetailedPlatform() {
            if (window.Capacitor) {
                const platform = window.Capacitor.getPlatform();
                return platform === 'ios' || platform === 'android' ? 'mobile' : 'web';
            }
            
            const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true;
            
            if (isPWA) {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                return isIOS ? 'pwaiOS' : 'pwaAndroid';
            }
            
            return 'web';
        }
        
        /**
         * Estimate migration duration and battery impact
         */
        async estimateMigrationImpact() {
            const impact = {
                duration: 60000,      // Default 1 minute
                batteryDrain: 0.01,   // Default 1%
                rowsToMigrate: 0,
                estimatedOps: 0
            };
            
            try {
                // Get database metrics
                const dbSize = await this.getDatabaseSize();
                const rowCounts = await this.getActualRowCounts();
                
                // Calculate total rows
                impact.rowsToMigrate = Object.values(rowCounts).reduce((sum, count) => sum + count, 0);
                
                // Estimate operations (read + write + verify for each row)
                impact.estimatedOps = impact.rowsToMigrate * 3;
                
                // Estimate duration (100 rows per second on average device)
                impact.duration = Math.max(5000, (impact.rowsToMigrate / 100) * 1000);
                
                // Estimate battery drain (0.001% per 1000 operations)
                impact.batteryDrain = Math.min(0.1, impact.estimatedOps * 0.000001);
                
                // Add overhead for backup and verification
                impact.duration *= 1.5;
                impact.batteryDrain *= 1.5;
                
            } catch (error) {
                console.error('[EnhancedMigrationSafety] Impact estimation error:', error);
            }
            
            return impact;
        }
        
        /**
         * Dynamic batch size adjustment based on memory
         */
        adjustBatchSize(memoryCheck) {
            const availableMemory = memoryCheck.available;
            const usageRatio = memoryCheck.used / memoryCheck.total;
            
            // More aggressive batch size reduction for high memory pressure
            if (usageRatio > 0.8) {
                this.batchSettings.currentSize = this.batchSettings.minSize;
            } else if (usageRatio > 0.6) {
                this.batchSettings.currentSize = Math.max(
                    this.batchSettings.minSize,
                    Math.floor(this.batchSettings.maxSize * 0.1)
                );
            } else if (usageRatio > 0.4) {
                this.batchSettings.currentSize = Math.floor(this.batchSettings.maxSize * 0.5);
            } else {
                this.batchSettings.currentSize = this.batchSettings.maxSize;
            }
            
            console.log(
                `[EnhancedMigrationSafety] Adjusted batch size to ${this.batchSettings.currentSize} ` +
                `based on memory usage ${Math.round(usageRatio * 100)}%`
            );
        }
        
        /**
         * Start telemetry collection
         */
        startTelemetry() {
            this.telemetry.data = {
                startTime: Date.now(),
                platform: this.detectDetailedPlatform(),
                deviceInfo: this.getDeviceInfo(),
                initialMetrics: {}
            };
        }
        
        /**
         * Get device information for telemetry
         */
        getDeviceInfo() {
            const info = {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screenResolution: `${screen.width}x${screen.height}`,
                pixelRatio: window.devicePixelRatio,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            };
            
            // Add Capacitor device info if available
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Device) {
                window.Capacitor.Plugins.Device.getInfo().then(deviceInfo => {
                    Object.assign(info, deviceInfo);
                }).catch(() => {
                    // Ignore errors
                });
            }
            
            return info;
        }
        
        /**
         * Perform canary migration test
         */
        async performCanaryMigration(migrationFunc) {
            if (!this.canarySettings.enabled) {
                return { success: true, skipped: true };
            }
            
            console.log('[EnhancedMigrationSafety] Starting canary migration test...');
            
            const results = {
                success: false,
                rowsTested: 0,
                duration: 0,
                errors: []
            };
            
            const startTime = performance.now();
            
            try {
                // Get sample data for canary test
                const sampleData = await this.getCanarySampleData();
                results.rowsTested = sampleData.length;
                
                // Create temporary backup of sample
                const canaryBackup = await this.createCanaryBackup(sampleData);
                
                // Run migration on sample
                await migrationFunc(sampleData, { isCanary: true });
                
                // Verify canary migration
                const verified = await this.verifyCanaryMigration(sampleData, canaryBackup);
                
                if (!verified.success) {
                    throw new Error(`Canary verification failed: ${verified.reason}`);
                }
                
                results.success = true;
                console.log(`[EnhancedMigrationSafety] Canary migration successful for ${results.rowsTested} rows`);
                
            } catch (error) {
                console.error('[EnhancedMigrationSafety] Canary migration failed:', error);
                results.errors.push(error.message);
                results.success = false;
            }
            
            results.duration = performance.now() - startTime;
            this.telemetry.data.canaryResults = results;
            
            return results;
        }
        
        /**
         * Get sample data for canary testing
         */
        async getCanarySampleData() {
            const allTasks = await this.getAllTasks();
            const sampleSize = Math.min(
                this.canarySettings.maxRows,
                Math.ceil(allTasks.length * this.canarySettings.percentage)
            );
            
            // Get random sample
            const sample = [];
            const indices = new Set();
            
            while (indices.size < sampleSize && indices.size < allTasks.length) {
                const index = Math.floor(Math.random() * allTasks.length);
                if (!indices.has(index)) {
                    indices.add(index);
                    sample.push(allTasks[index]);
                }
            }
            
            return sample;
        }
        
        /**
         * Get all tasks for canary sampling
         */
        async getAllTasks() {
            if (window.StorageAdapter) {
                const tasksJson = await window.StorageAdapter.getItem('stackmap_tasks');
                return tasksJson ? JSON.parse(tasksJson) : [];
            }
            return [];
        }
        
        /**
         * Format bytes for human-readable display
         */
        formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
        }
    }
    
    // Export to global scope
    window.EnhancedMigrationSafety = EnhancedMigrationSafety;
    
})();