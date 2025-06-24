/**
 * Safe Migration Controller
 * Central controller that coordinates all migration components
 * Implements Story #34 requirements for bulletproof data safety
 */

(function() {
    'use strict';
    
    class SafeMigrationController {
        constructor() {
            this.orchestrator = null;
            this.enhancedSafety = null;
            this.shadowMigrator = null;
            this.ui = null;
            
            // Migration state
            this.currentMigration = null;
            this.rollbackRequested = false;
            
            // Initialize components
            this.init();
        }
        
        /**
         * Initialize all migration components
         */
        init() {
            console.log('[SafeMigrationController] Initializing migration system...');
            
            // Initialize components
            this.orchestrator = new window.FailSafeMigrationOrchestrator();
            this.enhancedSafety = new window.EnhancedMigrationSafety();
            this.shadowMigrator = new window.ShadowTableMigrator();
            
            // UI will be initialized by DOM ready event
            if (window.migrationUI) {
                this.ui = window.migrationUI;
            }
            
            // Bind global handlers
            window.migrationController = this;
            
            console.log('[SafeMigrationController] Migration system ready');
        }
        
        /**
         * Execute a safe migration with all protections
         */
        async executeSafeMigration(version, migrationConfig) {
            console.log(`[SafeMigrationController] Starting migration to version ${version}`);
            
            if (this.currentMigration) {
                throw new Error('Migration already in progress');
            }
            
            this.currentMigration = {
                version: version,
                config: migrationConfig,
                startTime: Date.now()
            };
            
            try {
                // Show UI
                if (this.ui) {
                    this.ui.showProgress('preflight', 0);
                }
                
                // Phase 1: Enhanced pre-flight checks
                const preflightResults = await this.performEnhancedPreflightChecks();
                if (!preflightResults.canProceed) {
                    throw new Error(preflightResults.reason);
                }
                
                // Phase 2: Canary migration test
                if (this.enhancedSafety.canarySettings.enabled) {
                    if (this.ui) {
                        this.ui.showProgress('canary', 0);
                    }
                    
                    const canaryResult = await this.performCanaryTest(migrationConfig);
                    if (!canaryResult.success) {
                        throw new Error('Canary migration failed - aborting to protect your data');
                    }
                }
                
                // Phase 3: Execute main migration with orchestrator
                const migrationOperation = async () => {
                    // Use shadow tables for zero downtime if applicable
                    if (migrationConfig.useShadowTables) {
                        return await this.shadowMigrator.performZeroDowntimeMigration(migrationConfig);
                    } else {
                        return await this.performStandardMigration(migrationConfig);
                    }
                };
                
                const result = await this.orchestrator.executeMigration(
                    version,
                    migrationOperation,
                    { showRollback: true }
                );
                
                // Phase 4: Post-migration verification
                if (this.ui) {
                    this.ui.showProgress('verification', 90);
                }
                
                await this.performPostMigrationVerification();
                
                // Success!
                if (this.ui) {
                    this.ui.showProgress('complete', 100);
                }
                
                // Record success telemetry
                this.recordMigrationSuccess(result);
                
                return result;
                
            } catch (error) {
                console.error('[SafeMigrationController] Migration failed:', error);
                
                // Show error UI
                if (this.ui) {
                    this.ui.showError(error, {
                        showRollback: false // Already rolled back
                    });
                }
                
                // Record failure telemetry
                this.recordMigrationFailure(error);
                
                throw error;
                
            } finally {
                this.currentMigration = null;
                this.rollbackRequested = false;
            }
        }
        
        /**
         * Perform enhanced pre-flight checks
         */
        async performEnhancedPreflightChecks() {
            console.log('[SafeMigrationController] Running enhanced pre-flight checks...');
            
            // Update UI
            if (this.ui) {
                this.ui.showProgress('preflight', 20);
            }
            
            // Run comprehensive checks
            const results = await this.enhancedSafety.performPreflightChecks({
                requireNetwork: false, // Don't require network for local migrations
                overrideBattery: false // Strict battery requirements
            });
            
            // Update UI with results
            if (this.ui) {
                this.ui.showProgress('preflight', 100);
            }
            
            // Log any warnings
            if (results.warnings.length > 0) {
                console.warn('[SafeMigrationController] Pre-flight warnings:', results.warnings);
            }
            
            return results;
        }
        
        /**
         * Perform canary migration test
         */
        async performCanaryTest(migrationConfig) {
            console.log('[SafeMigrationController] Running canary migration test...');
            
            const canaryMigration = async (data, options) => {
                // Test migration on sample data
                if (migrationConfig.canaryTest) {
                    return await migrationConfig.canaryTest(data, options);
                }
                
                // Default: just verify data can be transformed
                for (const item of data) {
                    if (migrationConfig.transform) {
                        await migrationConfig.transform(item);
                    }
                }
                
                return { success: true };
            };
            
            const result = await this.enhancedSafety.performCanaryMigration(canaryMigration);
            
            if (this.ui) {
                this.ui.showProgress('canary', 100);
            }
            
            return result;
        }
        
        /**
         * Perform standard migration (non-shadow table)
         */
        async performStandardMigration(config) {
            console.log('[SafeMigrationController] Performing standard migration...');
            
            if (this.ui) {
                this.ui.showProgress('backup', 0);
            }
            
            // Create comprehensive backup
            const backup = await this.createComprehensiveBackup();
            
            if (this.ui) {
                this.ui.showProgress('backup', 100);
            }
            
            // Execute migration steps
            if (this.ui) {
                this.ui.showProgress('migration', 0);
            }
            
            const steps = config.steps || [];
            const totalSteps = steps.length;
            
            for (let i = 0; i < totalSteps; i++) {
                const step = steps[i];
                
                // Check for rollback request
                if (this.rollbackRequested) {
                    throw new Error('Migration cancelled by user');
                }
                
                // Execute step
                await this.executeStep(step);
                
                // Update progress
                const progress = ((i + 1) / totalSteps) * 100;
                if (this.ui) {
                    this.ui.showProgress('migration', progress);
                }
            }
            
            return {
                success: true,
                backup: backup,
                stepsCompleted: totalSteps
            };
        }
        
        /**
         * Execute a single migration step
         */
        async executeStep(step) {
            console.log(`[SafeMigrationController] Executing step: ${step.name || 'unnamed'}`);
            
            const startTime = performance.now();
            
            try {
                if (step.execute) {
                    await step.execute();
                } else if (typeof step === 'function') {
                    await step();
                }
                
                const duration = performance.now() - startTime;
                console.log(`[SafeMigrationController] Step completed in ${duration}ms`);
                
            } catch (error) {
                console.error(`[SafeMigrationController] Step failed:`, error);
                throw new Error(`Migration step failed: ${step.name || 'unnamed'} - ${error.message}`);
            }
        }
        
        /**
         * Create comprehensive backup
         */
        async createComprehensiveBackup() {
            console.log('[SafeMigrationController] Creating comprehensive backup...');
            
            const backup = {
                id: `migration_backup_${Date.now()}`,
                timestamp: Date.now(),
                version: await this.getDatabaseVersion(),
                data: {}
            };
            
            // Backup all data types
            if (window.StorageAdapter) {
                // Tasks
                const tasksJson = await window.StorageAdapter.getItem('stackmap_tasks');
                backup.data.tasks = tasksJson ? JSON.parse(tasksJson) : [];
                
                // Settings
                backup.data.settings = {};
                const settingKeys = ['theme', 'preferences', 'user'];
                for (const key of settingKeys) {
                    backup.data.settings[key] = await window.StorageAdapter.getItem(key);
                }
                
                // Metadata
                backup.data.metadata = {
                    taskCount: backup.data.tasks.length,
                    storageType: window.StorageAdapter.getStorageType()
                };
            }
            
            // Store backup
            if (window.BackupManager) {
                await window.BackupManager.createBackup({
                    type: 'migration',
                    data: backup
                });
            } else {
                // Fallback to localStorage
                localStorage.setItem(backup.id, JSON.stringify(backup));
            }
            
            return backup;
        }
        
        /**
         * Perform post-migration verification
         */
        async performPostMigrationVerification() {
            console.log('[SafeMigrationController] Verifying migration success...');
            
            // Run integrity checks again
            const integrity = await this.enhancedSafety.performComprehensiveIntegrityCheck();
            if (!integrity.passed) {
                throw new Error('Post-migration integrity check failed');
            }
            
            // Verify critical operations still work
            await this.verifyCriticalOperations();
            
            console.log('[SafeMigrationController] Migration verified successfully');
        }
        
        /**
         * Verify critical operations
         */
        async verifyCriticalOperations() {
            const tests = [
                // Can read tasks
                async () => {
                    if (window.StorageAdapter) {
                        const tasks = await window.StorageAdapter.getItem('stackmap_tasks');
                        if (tasks === null) throw new Error('Cannot read tasks');
                    }
                },
                
                // Can write test data
                async () => {
                    const testKey = `test_${Date.now()}`;
                    if (window.StorageAdapter) {
                        await window.StorageAdapter.setItem(testKey, 'test');
                        const value = await window.StorageAdapter.getItem(testKey);
                        await window.StorageAdapter.removeItem(testKey);
                        if (value !== 'test') throw new Error('Write/read test failed');
                    }
                }
            ];
            
            for (const test of tests) {
                await test();
            }
        }
        
        /**
         * Handle rollback request from user
         */
        async requestRollback() {
            console.log('[SafeMigrationController] User requested rollback');
            
            // Confirm with user
            const confirmed = await this.confirmRollback();
            if (!confirmed) return;
            
            this.rollbackRequested = true;
            
            // The orchestrator will handle the actual rollback
            // This just sets the flag
        }
        
        /**
         * Confirm rollback with user
         */
        async confirmRollback() {
            // If we have a nice modal system
            if (window.Modal) {
                return new Promise(resolve => {
                    window.Modal.show({
                        title: 'Cancel Update?',
                        message: 'Your tasks are safe. The update will be cancelled and everything will stay as it was.',
                        buttons: [
                            {
                                text: 'Continue Update',
                                primary: true,
                                action: () => resolve(false)
                            },
                            {
                                text: 'Cancel Update',
                                action: () => resolve(true)
                            }
                        ]
                    });
                });
            }
            
            // Fallback to confirm
            return confirm('Cancel the update? Your tasks are safe and will stay as they are.');
        }
        
        /**
         * Dismiss error UI
         */
        dismiss() {
            if (this.ui) {
                this.ui.hide();
            }
        }
        
        /**
         * Get current database version
         */
        async getDatabaseVersion() {
            if (window.StorageAdapter) {
                return await window.StorageAdapter.getItem('db_version') || '1';
            }
            return '1';
        }
        
        /**
         * Record migration success telemetry
         */
        recordMigrationSuccess(result) {
            const telemetry = {
                event: 'migration_success',
                version: this.currentMigration?.version,
                duration: Date.now() - (this.currentMigration?.startTime || 0),
                ...this.enhancedSafety.telemetry.data
            };
            
            console.log('[SafeMigrationController] Migration success:', telemetry);
            
            // Send to analytics if available
            if (window.analytics) {
                window.analytics.track('migration_success', telemetry);
            }
        }
        
        /**
         * Record migration failure telemetry
         */
        recordMigrationFailure(error) {
            const telemetry = {
                event: 'migration_failure',
                version: this.currentMigration?.version,
                duration: Date.now() - (this.currentMigration?.startTime || 0),
                error: error.message,
                rollbackTime: this.orchestrator?.metrics?.rollbackTime,
                ...this.enhancedSafety.telemetry.data
            };
            
            console.log('[SafeMigrationController] Migration failure:', telemetry);
            
            // Send to analytics if available
            if (window.analytics) {
                window.analytics.track('migration_failure', telemetry);
            }
        }
        
        /**
         * Check if migration is needed
         */
        async checkMigrationNeeded() {
            const currentVersion = await this.getDatabaseVersion();
            const targetVersion = window.STACKMAP_DB_VERSION || '2';
            
            return currentVersion < targetVersion;
        }
        
        /**
         * Auto-run migration if needed (call from app init)
         */
        async autoMigrate() {
            try {
                const needed = await this.checkMigrationNeeded();
                if (!needed) {
                    console.log('[SafeMigrationController] No migration needed');
                    return;
                }
                
                // Define migration configuration
                const config = {
                    useShadowTables: false, // Start with standard migration
                    steps: [
                        {
                            name: 'Update schema',
                            execute: async () => {
                                // Migration logic here
                                console.log('[SafeMigrationController] Updating schema...');
                            }
                        },
                        {
                            name: 'Update version',
                            execute: async () => {
                                if (window.StorageAdapter) {
                                    await window.StorageAdapter.setItem('db_version', '2');
                                }
                            }
                        }
                    ]
                };
                
                // Execute migration
                await this.executeSafeMigration('2', config);
                
            } catch (error) {
                console.error('[SafeMigrationController] Auto-migration failed:', error);
                // Don't throw - let app continue with current version
            }
        }
    }
    
    // Export to global scope
    window.SafeMigrationController = SafeMigrationController;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.safeMigrationController = new SafeMigrationController();
        });
    } else {
        window.safeMigrationController = new SafeMigrationController();
    }
    
})();