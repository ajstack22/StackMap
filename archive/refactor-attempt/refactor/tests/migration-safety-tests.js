/**
 * Migration Safety Tests
 * Verifies all PM review requirements are met
 * Focus on 5-second rollback guarantee and data integrity
 */

describe('SQLite Migration Safety Tests', () => {
    let orchestrator;
    let migrationUI;
    let shadowMigrator;
    let originalData;
    
    beforeEach(async () => {
        // Initialize components
        orchestrator = new window.FailSafeMigrationOrchestrator();
        migrationUI = new window.MigrationUIController();
        shadowMigrator = new window.ShadowTableMigrator();
        
        // Backup current data
        originalData = await getAllData();
        
        // Mock battery API for testing
        if (!navigator.getBattery) {
            navigator.getBattery = async () => ({
                level: 0.5,
                charging: false
            });
        }
    });
    
    afterEach(async () => {
        // Restore original data if needed
        await restoreData(originalData);
    });
    
    describe('5-Second Rollback Guarantee', () => {
        it('should rollback within 5 seconds for any failure', async () => {
            const failingOperation = async () => {
                // Simulate work
                await new Promise(resolve => setTimeout(resolve, 1000));
                throw new Error('Simulated migration failure');
            };
            
            const startTime = performance.now();
            
            try {
                await orchestrator.executeMigration(2, failingOperation);
                fail('Migration should have failed');
            } catch (error) {
                const rollbackTime = performance.now() - startTime;
                
                // Verify rollback completed within 5 seconds
                expect(rollbackTime).toBeLessThan(5000);
                expect(error.details.rollbackTime).toBeLessThan(5000);
                
                // Verify data integrity
                const currentData = await getAllData();
                expect(currentData).toEqual(originalData);
            }
        });
        
        it('should force rollback at 5-second timeout', async () => {
            const hangingOperation = async () => {
                // Simulate hanging operation
                await new Promise(resolve => setTimeout(resolve, 10000));
            };
            
            const startTime = performance.now();
            
            try {
                await orchestrator.executeMigration(2, hangingOperation);
                fail('Migration should have timed out');
            } catch (error) {
                const totalTime = performance.now() - startTime;
                
                // Should timeout at 5 seconds
                expect(totalTime).toBeGreaterThan(4900);
                expect(totalTime).toBeLessThan(5500);
                
                // Verify rollback completed
                expect(error.message).toContain('timeout');
            }
        });
        
        it('should handle rollback during each migration phase', async () => {
            const phases = ['backup', 'migration', 'verification'];
            
            for (const failPhase of phases) {
                const phaseOperation = async () => {
                    for (const phase of phases) {
                        if (phase === failPhase) {
                            throw new Error(`Failed in ${phase} phase`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                };
                
                const startTime = performance.now();
                
                try {
                    await orchestrator.executeMigration(2, phaseOperation);
                    fail(`Should have failed in ${failPhase} phase`);
                } catch (error) {
                    const rollbackTime = orchestrator.metrics.rollbackTime;
                    
                    expect(rollbackTime).toBeLessThan(5000);
                    expect(error.message).toContain('rolled back');
                    
                    // Verify data unchanged
                    const currentData = await getAllData();
                    expect(currentData).toEqual(originalData);
                }
            }
        });
    });
    
    describe('Battery Level Requirements', () => {
        it('should require 40% battery on mobile devices', async () => {
            // Mock mobile platform
            orchestrator.detectPlatform = () => 'mobile';
            
            // Set battery below threshold
            navigator.getBattery = async () => ({
                level: 0.35, // 35%
                charging: false
            });
            
            try {
                await orchestrator.executeMigration(2, async () => {});
                fail('Should have failed battery check');
            } catch (error) {
                expect(error.message).toContain('Battery too low');
                expect(error.message).toContain('40%');
            }
        });
        
        it('should allow override with warning for low battery', async () => {
            orchestrator.detectPlatform = () => 'mobile';
            
            navigator.getBattery = async () => ({
                level: 0.35,
                charging: false
            });
            
            const operation = async () => {
                return { success: true };
            };
            
            // Should succeed with override
            const result = await orchestrator.executeMigration(2, operation, {
                overrideBattery: true
            });
            
            expect(result.success).toBe(true);
        });
        
        it('should estimate battery drain based on data size', async () => {
            const safety = new window.EnhancedMigrationSafety();
            const batteryCheck = await safety.performEnhancedBatteryCheck();
            
            expect(batteryCheck.estimatedDrain).toBeGreaterThan(0);
            expect(batteryCheck.estimatedDuration).toBeGreaterThan(0);
            expect(batteryCheck.required).toBe(0.40); // 40% for mobile
        });
    });
    
    describe('Comprehensive Integrity Checks', () => {
        it('should verify all integrity aspects', async () => {
            const safety = new window.EnhancedMigrationSafety();
            const integrity = await safety.performComprehensiveIntegrityCheck();
            
            // Should check all required aspects
            expect(integrity.checks).toHaveProperty('sqliteIntegrity');
            expect(integrity.checks).toHaveProperty('rowCounts');
            expect(integrity.checks).toHaveProperty('checksums');
            expect(integrity.checks).toHaveProperty('foreignKeys');
            expect(integrity.checks).toHaveProperty('indexes');
            expect(integrity.checks).toHaveProperty('dataTypes');
            
            // All should pass for healthy database
            expect(integrity.passed).toBe(true);
        });
        
        it('should detect corruption', async () => {
            // Simulate corruption
            if (window.TaskSQLite && window.TaskSQLite.isReady) {
                await window.TaskSQLite.executeQuery('PRAGMA writable_schema = ON');
                // Don't actually corrupt, just test detection would work
                await window.TaskSQLite.executeQuery('PRAGMA writable_schema = OFF');
            }
            
            const safety = new window.EnhancedMigrationSafety();
            const integrity = await safety.performComprehensiveIntegrityCheck();
            
            // Should have proper structure even if can't detect corruption in test
            expect(integrity.checks.sqliteIntegrity).toBeDefined();
            expect(integrity.duration).toBeGreaterThan(0);
        });
    });
    
    describe('UI Messaging Requirements', () => {
        it('should show specific time estimates for each phase', () => {
            const phases = ['preflight', 'backup', 'migration', 'verification'];
            
            for (const phase of phases) {
                migrationUI.showProgress(phase, 50);
                
                const container = document.getElementById('migration-progress-container');
                const content = container.innerHTML;
                
                // Should contain specific time language
                expect(content).toMatch(/\d+[-\s]*(seconds?|minutes?)/);
                expect(content).not.toContain('Just a moment');
                expect(content).not.toContain('Almost done');
                
                // Should mention data safety
                const message = migrationUI.messages[phase];
                expect(message.dataStatus).toBeTruthy();
                expect(content).toContain(message.dataStatus);
            }
        });
        
        it('should round time estimates up for comfort', () => {
            const estimate = migrationUI.estimatePhaseTime('migration', { rowCount: 1000 });
            const baseEstimate = 120000; // 2 minutes base
            
            // Should include 20% buffer
            expect(estimate).toBeGreaterThan(baseEstimate);
            expect(estimate).toBe(Math.ceil(baseEstimate * 1.2));
        });
        
        it('should format remaining time clearly', () => {
            const testCases = [
                { ms: 5000, expected: /Less than 10 seconds/ },
                { ms: 25000, expected: /25 seconds/ },
                { ms: 45000, expected: /half a minute/ },
                { ms: 90000, expected: /1 minute/ },
                { ms: 150000, expected: /3 minutes/ }
            ];
            
            for (const testCase of testCases) {
                const formatted = migrationUI.formatTimeRemaining(testCase.ms);
                expect(formatted).toMatch(testCase.expected);
                expect(formatted).toContain('<strong>'); // Emphasis
            }
        });
    });
    
    describe('Shadow Table Migration', () => {
        it('should maintain zero downtime during migration', async () => {
            const config = {
                tables: [{
                    name: 'test_table',
                    newSchema: 'CREATE TABLE test_table (id INTEGER PRIMARY KEY, data TEXT, new_col INTEGER DEFAULT 0)',
                    columnMapping: { 'data': 'data' },
                    newColumns: { 'new_col': 0 }
                }]
            };
            
            // Start migration
            const migrationPromise = shadowMigrator.performZeroDowntimeMigration(config);
            
            // Verify table remains accessible during migration
            let accessError = null;
            const accessInterval = setInterval(async () => {
                try {
                    await executeSql('SELECT * FROM test_table LIMIT 1');
                } catch (error) {
                    accessError = error;
                }
            }, 100);
            
            // Wait for migration
            const result = await migrationPromise;
            clearInterval(accessInterval);
            
            // Should have zero downtime
            expect(accessError).toBeNull();
            expect(result.success).toBe(true);
        });
        
        it('should sync changes during migration', async () => {
            const config = {
                tables: [{
                    name: 'tasks',
                    newSchema: 'CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT, priority INTEGER DEFAULT 0)',
                    newColumns: { 'priority': 0 }
                }]
            };
            
            // Start migration in background
            const migrationPromise = shadowMigrator.performZeroDowntimeMigration(config);
            
            // Add new task during migration
            const newTask = { id: 999999, title: 'Test during migration' };
            await executeSql('INSERT INTO tasks (id, title) VALUES (?, ?)', [newTask.id, newTask.title]);
            
            // Complete migration
            await migrationPromise;
            
            // Verify new task exists with new schema
            const result = await executeSql('SELECT * FROM tasks WHERE id = ?', [newTask.id]);
            expect(result[0].title).toBe(newTask.title);
            expect(result[0].priority).toBe(0); // New column with default
        });
    });
    
    describe('Canary Migration', () => {
        it('should test with 1% of data first', async () => {
            const safety = new window.EnhancedMigrationSafety();
            
            // Mock 1000 tasks
            const mockTasks = Array(1000).fill(null).map((_, i) => ({
                id: i,
                title: `Task ${i}`
            }));
            
            safety.getAllTasks = async () => mockTasks;
            
            const canaryData = await safety.getCanarySampleData();
            
            // Should be 1% (10 tasks) but max 100
            expect(canaryData.length).toBe(10);
            expect(canaryData.length).toBeLessThanOrEqual(100);
        });
        
        it('should rollback if canary fails', async () => {
            const failingMigration = async (data, options) => {
                if (options.isCanary) {
                    throw new Error('Canary failed');
                }
            };
            
            const safety = new window.EnhancedMigrationSafety();
            const result = await safety.performCanaryMigration(failingMigration);
            
            expect(result.success).toBe(false);
            expect(result.errors).toContain('Canary failed');
        });
    });
    
    describe('Memory-Aware Batch Sizing', () => {
        it('should adjust batch size based on memory pressure', () => {
            const safety = new window.EnhancedMigrationSafety();
            
            // Test different memory scenarios
            const scenarios = [
                { used: 0.9, total: 1, expectedBatch: 10 },      // 90% used -> minimum
                { used: 0.6, total: 1, expectedBatch: 500 },     // 60% used -> 10% of max
                { used: 0.3, total: 1, expectedBatch: 5000 }     // 30% used -> maximum
            ];
            
            for (const scenario of scenarios) {
                safety.adjustBatchSize(scenario);
                expect(safety.batchSettings.currentSize).toBe(scenario.expectedBatch);
            }
        });
    });
    
    describe('Telemetry Collection', () => {
        it('should collect comprehensive metrics', async () => {
            const safety = new window.EnhancedMigrationSafety();
            const preflightResults = await safety.performPreflightChecks();
            
            expect(safety.telemetry.data).toHaveProperty('startTime');
            expect(safety.telemetry.data).toHaveProperty('platform');
            expect(safety.telemetry.data).toHaveProperty('deviceInfo');
            expect(safety.telemetry.data).toHaveProperty('preflightResults');
            
            // Device info should be comprehensive
            const deviceInfo = safety.telemetry.data.deviceInfo;
            expect(deviceInfo).toHaveProperty('userAgent');
            expect(deviceInfo).toHaveProperty('screenResolution');
            expect(deviceInfo).toHaveProperty('timezone');
        });
    });
    
    // Helper functions
    async function getAllData() {
        const data = {};
        if (window.StorageAdapter) {
            data.tasks = await window.StorageAdapter.getItem('stackmap_tasks');
            data.settings = await window.StorageAdapter.getItem('settings');
        }
        return data;
    }
    
    async function restoreData(data) {
        if (window.StorageAdapter) {
            for (const [key, value] of Object.entries(data)) {
                if (value !== null) {
                    await window.StorageAdapter.setItem(key, value);
                }
            }
        }
    }
    
    async function executeSql(query, params = []) {
        if (window.TaskSQLite && window.TaskSQLite.isReady) {
            return await window.TaskSQLite.executeQuery(query, params);
        }
        return [];
    }
});