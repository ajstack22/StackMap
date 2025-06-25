/**
 * Migration Integration Fixes
 * Integrates EnhancedMigrationSafety with FailSafeMigrationOrchestrator
 * Addresses PM review requirement #6
 */

(function() {
    'use strict';
    
    // Get the fixed orchestrator
    const FixedOrchestrator = window.FailSafeMigrationOrchestrator;
    
    class IntegratedMigrationOrchestrator extends FixedOrchestrator {
        constructor() {
            super();
            
            // CRITICAL FIX #6: Integrate EnhancedMigrationSafety
            this.enhancedSafety = new window.EnhancedMigrationSafety();
            
            // Network state monitoring
            this.networkState = {
                online: navigator.onLine,
                type: this.getNetworkType()
            };
            
            // Setup network monitoring
            this.setupNetworkMonitoring();
            
            // Foreign keys state
            this.foreignKeysEnabled = false;
        }
        
        /**
         * Override performPreflightChecks to use EnhancedMigrationSafety
         */
        async performPreflightChecks(options) {
            console.log('[IntegratedMigrationOrchestrator] Using enhanced pre-flight checks');
            
            // Report progress
            this.reportProgress('preflight', 10, { step: 'Starting checks' });
            
            // Use the enhanced safety checks
            const enhancedResults = await this.enhancedSafety.performPreflightChecks(options);
            
            // Convert to orchestrator format
            const checks = {
                canProceed: enhancedResults.canProceed,
                reason: enhancedResults.errors.join('; ') || null,
                details: {
                    ...enhancedResults.checks,
                    warnings: enhancedResults.warnings,
                    errors: enhancedResults.errors
                }
            };
            
            // Additional network check
            if (!this.networkState.online && options.requireNetwork) {
                checks.canProceed = false;
                checks.reason = 'Network connection required but device is offline';
            }
            
            // Enable foreign keys if using SQLite
            if (window.TaskSQLite && window.TaskSQLite.isReady) {
                await this.enableForeignKeys();
            }
            
            this.reportProgress('preflight', 100, { 
                step: 'Checks complete',
                passed: checks.canProceed 
            });
            
            return checks;
        }
        
        /**
         * Use enhanced battery check
         */
        async checkBatteryLevel() {
            return await this.enhancedSafety.performEnhancedBatteryCheck();
        }
        
        /**
         * Use enhanced integrity check
         */
        async checkDatabaseIntegrity() {
            return await this.enhancedSafety.performComprehensiveIntegrityCheck();
        }
        
        /**
         * CRITICAL FIX #10: Enable foreign keys before checks
         */
        async enableForeignKeys() {
            if (!this.foreignKeysEnabled && window.TaskSQLite && window.TaskSQLite.isReady) {
                try {
                    await window.TaskSQLite.executeQuery('PRAGMA foreign_keys = ON');
                    this.foreignKeysEnabled = true;
                    console.log('[IntegratedMigrationOrchestrator] Foreign keys enabled');
                } catch (error) {
                    console.error('[IntegratedMigrationOrchestrator] Failed to enable foreign keys:', error);
                }
            }
        }
        
        /**
         * Setup network state monitoring
         */
        setupNetworkMonitoring() {
            window.addEventListener('online', () => {
                this.networkState.online = true;
                this.networkState.type = this.getNetworkType();
                console.log('[IntegratedMigrationOrchestrator] Network online');
            });
            
            window.addEventListener('offline', () => {
                this.networkState.online = false;
                console.log('[IntegratedMigrationOrchestrator] Network offline');
                
                // If migration in progress and requires network, abort
                if (this.currentMigration && this.currentMigration.requiresNetwork) {
                    console.error('[IntegratedMigrationOrchestrator] Network lost during migration');
                    if (this.abortController) {
                        this.abortController.abort();
                    }
                }
            });
        }
        
        /**
         * Get network connection type
         */
        getNetworkType() {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                return {
                    type: connection.effectiveType || connection.type || 'unknown',
                    downlink: connection.downlink || 0,
                    rtt: connection.rtt || 0
                };
            }
            return { type: 'unknown' };
        }
        
        /**
         * Override executeMigration to add canary testing
         */
        async executeMigration(version, operation, options = {}) {
            // Run canary test first if enabled
            if (this.enhancedSafety.canarySettings.enabled && !options.skipCanary) {
                this.reportProgress('canary', 0, { step: 'Preparing canary test' });
                
                const canaryResult = await this.enhancedSafety.performCanaryMigration(operation);
                
                if (!canaryResult.success) {
                    throw new Error(`Canary migration failed: ${canaryResult.errors.join(', ')}`);
                }
                
                this.reportProgress('canary', 100, { 
                    step: 'Canary test passed',
                    rowsTested: canaryResult.rowsTested 
                });
            }
            
            // Continue with main migration
            return await super.executeMigration(version, operation, options);
        }
        
        /**
         * Implement memory-aware batch sizing
         */
        async determineBatchSize() {
            const memoryCheck = await this.checkMemoryAvailability();
            
            // Use enhanced safety's dynamic batch sizing
            this.enhancedSafety.adjustBatchSize(memoryCheck);
            
            return this.enhancedSafety.batchSettings.currentSize || 1000;
        }
        
        /**
         * Enhanced telemetry with both systems
         */
        recordTelemetry(event, data) {
            // Combine telemetry from both systems
            const combinedTelemetry = {
                event: event,
                timestamp: Date.now(),
                orchestrator: {
                    version: this.currentMigration?.version,
                    duration: Date.now() - (this.currentMigration?.startTime || 0),
                    metrics: this.metrics
                },
                enhancedSafety: this.enhancedSafety.telemetry.data,
                ...data
            };
            
            console.log('[IntegratedMigrationOrchestrator] Telemetry:', combinedTelemetry);
            
            // Send to analytics if available
            if (window.analytics) {
                window.analytics.track(event, combinedTelemetry);
            }
            
            return combinedTelemetry;
        }
        
        /**
         * Create canary backup for testing
         */
        async createCanaryBackup(sampleData) {
            const backup = {
                id: `canary_backup_${Date.now()}`,
                timestamp: Date.now(),
                data: sampleData,
                checksum: await this.calculateChecksum(JSON.stringify(sampleData))
            };
            
            // Store temporarily in memory
            this._canaryBackup = backup;
            
            return backup;
        }
        
        /**
         * Verify canary migration results
         */
        async verifyCanaryMigration(originalData, backup) {
            const results = {
                success: true,
                reason: null
            };
            
            try {
                // Verify data integrity
                const currentChecksum = await this.calculateChecksum(JSON.stringify(originalData));
                
                if (currentChecksum !== backup.checksum) {
                    // Check if transformation was expected
                    const transformedChecksum = await this.calculateChecksum(
                        JSON.stringify(originalData.map(item => ({ ...item, migrated: true })))
                    );
                    
                    if (transformedChecksum === currentChecksum) {
                        // Data was transformed as expected
                        results.success = true;
                    } else {
                        results.success = false;
                        results.reason = 'Unexpected data transformation';
                    }
                }
                
            } catch (error) {
                results.success = false;
                results.reason = error.message;
            }
            
            return results;
        }
        
        /**
         * Perform integrity check with optimizations for large DBs
         */
        async executeSQLiteIntegrityCheck() {
            if (!window.TaskSQLite || !window.TaskSQLite.isReady) {
                return { ok: true, details: 'SQLite not initialized' };
            }
            
            // For large databases, use quick_check instead of full integrity_check
            const dbSize = await this.getDatabaseSize();
            const isLargeDB = dbSize > 100 * 1024 * 1024; // 100MB
            
            const checkType = isLargeDB ? 'quick_check' : 'integrity_check';
            
            try {
                const startTime = performance.now();
                const result = await window.TaskSQLite.executeQuery(`PRAGMA ${checkType}`);
                const duration = performance.now() - startTime;
                
                console.log(`[IntegratedMigrationOrchestrator] ${checkType} completed in ${duration}ms`);
                
                return {
                    ok: result && result[0] && result[0][checkType] === 'ok',
                    details: result,
                    duration: duration,
                    checkType: checkType
                };
            } catch (error) {
                return { 
                    ok: false, 
                    error: error.message,
                    checkType: checkType 
                };
            }
        }
        
        /**
         * Constant-time comparison for checksums (security fix)
         */
        secureCompareChecksums(a, b) {
            if (a.length !== b.length) return false;
            
            let result = 0;
            for (let i = 0; i < a.length; i++) {
                result |= a.charCodeAt(i) ^ b.charCodeAt(i);
            }
            
            return result === 0;
        }
        
        /**
         * Verify data checksums with secure comparison
         */
        async verifyDataChecksums() {
            const results = await this.enhancedSafety.verifyCriticalDataChecksums();
            
            // Re-verify with secure comparison
            for (const dataType in results.checksums) {
                const checksum = results.checksums[dataType];
                if (checksum.stored && checksum.current) {
                    checksum.matches = this.secureCompareChecksums(checksum.current, checksum.stored);
                }
            }
            
            return results;
        }
    }
    
    // Replace the global class
    window.FailSafeMigrationOrchestrator = IntegratedMigrationOrchestrator;
    
    // Create integrated controller
    if (window.SafeMigrationController) {
        const OriginalController = window.SafeMigrationController;
        
        class IntegratedMigrationController extends OriginalController {
            init() {
                console.log('[IntegratedMigrationController] Initializing with integrated orchestrator');
                
                // Use integrated orchestrator
                this.orchestrator = new IntegratedMigrationOrchestrator();
                this.enhancedSafety = this.orchestrator.enhancedSafety;
                this.shadowMigrator = new window.ShadowTableMigrator();
                
                if (window.migrationUI) {
                    this.ui = window.migrationUI;
                }
                
                window.migrationController = this;
                
                console.log('[IntegratedMigrationController] Migration system ready with all fixes');
            }
        }
        
        // Replace the global controller
        window.SafeMigrationController = IntegratedMigrationController;
        
        // Re-initialize if already created
        if (window.safeMigrationController) {
            window.safeMigrationController = new IntegratedMigrationController();
        }
    }
    
})();