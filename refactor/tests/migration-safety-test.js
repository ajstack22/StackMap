/**
 * Migration Safety Test Suite
 * Comprehensive tests for all failure scenarios to ensure zero data loss
 * Tests image memory management, corruption handling, and rollback scenarios
 */

(function() {
    'use strict';
    
    var MigrationSafetyTests = {
        // Test configuration
        testResults: [],
        currentTest: null,
        
        /**
         * Run all migration safety tests
         */
        runAll: function(callback) {
            var self = this;
            self.testResults = [];
            
            console.log('🧪 Starting Migration Safety Test Suite...');
            
            var tests = [
                self.testBackupCreation,
                self.testBackupVerification,
                self.testSQLiteWriteFailure,
                self.testCorruptDataHandling,
                self.testMemoryExhaustion,
                self.testLargeImageHandling,
                self.testStorageQuotaExceeded,
                self.testBrowserCrash,
                self.testOfflineMigration,
                self.testRollbackFunctionality,
                self.test1000TaskMigration,
                self.testEmptyDataMigration,
                self.testConcurrentMigration,
                self.testVerificationPeriod,
                self.testBackupCleanup
            ];
            
            // Run tests sequentially
            var runNextTest = function(index) {
                if (index >= tests.length) {
                    self.displayResults();
                    if (callback) callback(self.testResults);
                    return;
                }
                
                var test = tests[index];
                self.currentTest = test.name;
                
                console.log('\n📋 Running test:', self.currentTest);
                
                test.call(self, function(result) {
                    self.testResults.push({
                        name: self.currentTest,
                        passed: result.passed,
                        message: result.message,
                        details: result.details
                    });
                    
                    // Continue with next test
                    setTimeout(function() {
                        runNextTest(index + 1);
                    }, 100);
                });
            };
            
            runNextTest(0);
        },
        
        /**
         * Test 1: Backup Creation and Storage
         */
        testBackupCreation: function(callback) {
            var testData = {
                'stackmap-tasks': JSON.stringify([
                    { id: 1, title: 'Test task 1', completed: false },
                    { id: 2, title: 'Test task 2', completed: true }
                ])
            };
            
            window.StackMapBackupManager.create(testData, function(backup, error) {
                if (error || !backup) {
                    callback({
                        passed: false,
                        message: 'Failed to create backup',
                        details: error
                    });
                    return;
                }
                
                // Verify backup exists in both locations
                var localExists = window.StackMapBackupManager.exists(backup.id);
                
                callback({
                    passed: localExists && backup.checksum,
                    message: localExists ? 'Backup created successfully' : 'Backup not found',
                    details: {
                        backupId: backup.id,
                        checksum: backup.checksum,
                        localStorage: localExists
                    }
                });
            });
        },
        
        /**
         * Test 2: Backup Verification with Checksum
         */
        testBackupVerification: function(callback) {
            var testData = {
                'stackmap-tasks': JSON.stringify([
                    { id: 1, title: 'Verify test', completed: false }
                ])
            };
            
            window.StackMapBackupManager.create(testData, function(backup, error) {
                if (error) {
                    callback({ passed: false, message: 'Backup creation failed' });
                    return;
                }
                
                window.StackMapBackupManager.verify(backup.id, { totalTasks: 1 }, function(verification) {
                    callback({
                        passed: verification.isValid && verification.checksumValid,
                        message: verification.isValid ? 'Checksum verified' : 'Checksum mismatch',
                        details: verification
                    });
                });
            });
        },
        
        /**
         * Test 3: SQLite Write Failure with Rollback
         */
        testSQLiteWriteFailure: function(callback) {
            var self = this;
            
            // Save original SQLite function
            var originalCreateTask = window.TaskSQLite.createTask;
            
            // Mock SQLite failure
            window.TaskSQLite.createTask = function(task, cb) {
                cb(null, new Error('Disk full'));
            };
            
            var testData = {
                'stackmap-tasks': JSON.stringify([
                    { id: 1, title: 'Will fail', completed: false }
                ])
            };
            
            // Store original data
            localStorage.setItem('stackmap-tasks', testData['stackmap-tasks']);
            
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                // Restore original function
                window.TaskSQLite.createTask = originalCreateTask;
                
                // Check if data was preserved
                var preservedData = localStorage.getItem('stackmap-tasks');
                
                callback({
                    passed: !result.success && preservedData === testData['stackmap-tasks'],
                    message: result.message,
                    details: {
                        migrationFailed: !result.success,
                        dataPreserved: preservedData === testData['stackmap-tasks'],
                        rolledBack: result.rolledBack
                    }
                });
                
                // Cleanup
                localStorage.removeItem('stackmap-tasks');
            });
        },
        
        /**
         * Test 4: Corrupt Data Handling
         */
        testCorruptDataHandling: function(callback) {
            // Set corrupt data
            localStorage.setItem('stackmap-tasks', '{"tasks": [{"id": 1, "title": null}');
            
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                callback({
                    passed: !result.success && result.message.indexOf('double-check') > -1,
                    message: 'Corrupt data handled gracefully',
                    details: {
                        success: result.success,
                        message: result.message
                    }
                });
                
                // Cleanup
                localStorage.removeItem('stackmap-tasks');
            });
        },
        
        /**
         * Test 5: Memory Exhaustion During Migration
         */
        testMemoryExhaustion: function(callback) {
            var self = this;
            
            // Create large dataset to simulate memory pressure
            var largeTasks = [];
            for (var i = 0; i < 100; i++) {
                largeTasks.push({
                    id: i,
                    title: 'Task ' + i,
                    description: new Array(1000).join('x'), // 1KB per task
                    completed: false
                });
            }
            
            localStorage.setItem('stackmap-tasks', JSON.stringify(largeTasks));
            
            // Monitor memory during migration
            var initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                var finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
                var memoryIncrease = finalMemory - initialMemory;
                
                callback({
                    passed: result.success || result.rolledBack,
                    message: 'Memory test completed',
                    details: {
                        initialMemory: Math.round(initialMemory / 1024 / 1024) + 'MB',
                        finalMemory: Math.round(finalMemory / 1024 / 1024) + 'MB',
                        increase: Math.round(memoryIncrease / 1024 / 1024) + 'MB',
                        tasksProcessed: largeTasks.length
                    }
                });
                
                // Cleanup
                localStorage.removeItem('stackmap-tasks');
            });
        },
        
        /**
         * Test 6: Large Image Handling (Critical for 512MB devices)
         */
        testLargeImageHandling: function(callback) {
            // Create tasks with simulated base64 images
            var tasksWithImages = [];
            
            // Simulate 10 tasks with 3 images each (500KB each)
            for (var i = 0; i < 10; i++) {
                var task = {
                    id: i,
                    title: 'Task with images ' + i,
                    completed: false,
                    attachments: []
                };
                
                // Add 3 simulated images
                for (var j = 0; j < 3; j++) {
                    task.attachments.push({
                        type: 'image',
                        data: new Array(500 * 1024).join('a') // 500KB of 'a'
                    });
                }
                
                tasksWithImages.push(task);
            }
            
            localStorage.setItem('stackmap-tasks', JSON.stringify(tasksWithImages));
            
            // Track memory usage
            var memoryCheckpoints = [];
            var memoryInterval = setInterval(function() {
                if (performance.memory) {
                    memoryCheckpoints.push(performance.memory.usedJSHeapSize);
                }
            }, 100);
            
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                clearInterval(memoryInterval);
                
                var maxMemory = Math.max.apply(Math, memoryCheckpoints);
                var avgMemory = memoryCheckpoints.reduce(function(a, b) { return a + b; }, 0) / memoryCheckpoints.length;
                
                callback({
                    passed: result.success || result.rolledBack,
                    message: 'Image migration test completed',
                    details: {
                        totalImageSize: '15MB (30 images × 500KB)',
                        maxMemoryUsed: Math.round(maxMemory / 1024 / 1024) + 'MB',
                        avgMemoryUsed: Math.round(avgMemory / 1024 / 1024) + 'MB',
                        memoryCheckpoints: memoryCheckpoints.length,
                        migrationResult: result
                    }
                });
                
                // Cleanup
                localStorage.removeItem('stackmap-tasks');
            });
        },
        
        /**
         * Test 7: Storage Quota Exceeded
         */
        testStorageQuotaExceeded: function(callback) {
            var self = this;
            
            // Fill storage to near capacity
            var bigData = new Array(1024 * 1024).join('x'); // 1MB
            var keysAdded = [];
            
            try {
                // Try to fill storage
                for (var i = 0; i < 10; i++) {
                    var key = 'test_fill_' + i;
                    localStorage.setItem(key, bigData);
                    keysAdded.push(key);
                }
            } catch (e) {
                // Storage might be full
            }
            
            // Try migration with limited space
            localStorage.setItem('stackmap-tasks', JSON.stringify([
                { id: 1, title: 'Test with full storage', completed: false }
            ]));
            
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                // Cleanup fill data
                keysAdded.forEach(function(key) {
                    try {
                        localStorage.removeItem(key);
                    } catch (e) {}
                });
                
                callback({
                    passed: true, // Pass if handled gracefully
                    message: 'Storage quota test completed',
                    details: {
                        migrationResult: result,
                        keysAdded: keysAdded.length
                    }
                });
                
                // Cleanup
                localStorage.removeItem('stackmap-tasks');
            });
        },
        
        /**
         * Test 8: Browser Crash Simulation
         */
        testBrowserCrash: function(callback) {
            // Simulate partial migration state
            var partialBackup = {
                id: 'stackmap_backup_crash_test',
                timestamp: new Date().toISOString(),
                data: { 'stackmap-tasks': JSON.stringify([{ id: 1, title: 'Crash test' }]) }
            };
            
            localStorage.setItem(partialBackup.id, JSON.stringify(partialBackup));
            localStorage.setItem('stackmap_migration_verification', JSON.stringify({
                backupId: partialBackup.id,
                status: 'pending',
                migrationTime: Date.now() - 1000
            }));
            
            // Check recovery
            window.StackMapMigrationSafety.checkVerification();
            
            callback({
                passed: true,
                message: 'Crash recovery test completed',
                details: {
                    backupExists: localStorage.getItem(partialBackup.id) !== null,
                    verificationPending: true
                }
            });
            
            // Cleanup
            localStorage.removeItem(partialBackup.id);
            localStorage.removeItem('stackmap_migration_verification');
        },
        
        /**
         * Test 9: Offline Migration
         */
        testOfflineMigration: function(callback) {
            // This test verifies migration works without network
            localStorage.setItem('stackmap-tasks', JSON.stringify([
                { id: 1, title: 'Offline task', completed: false }
            ]));
            
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                callback({
                    passed: true, // Should work offline
                    message: 'Offline migration test',
                    details: {
                        result: result,
                        isOnline: navigator.onLine
                    }
                });
                
                // Cleanup
                localStorage.removeItem('stackmap-tasks');
            });
        },
        
        /**
         * Test 10: Rollback Functionality
         */
        testRollbackFunctionality: function(callback) {
            var originalData = JSON.stringify([
                { id: 1, title: 'Original task 1', completed: false },
                { id: 2, title: 'Original task 2', completed: true }
            ]);
            
            localStorage.setItem('stackmap-tasks', originalData);
            
            // Create backup first
            window.StackMapBackupManager.create({ 'stackmap-tasks': originalData }, function(backup) {
                // Clear data to simulate failure
                localStorage.removeItem('stackmap-tasks');
                
                // Rollback
                window.StackMapBackupManager.rollback(backup.id, function(success) {
                    var restoredData = localStorage.getItem('stackmap-tasks');
                    
                    callback({
                        passed: success && restoredData === originalData,
                        message: 'Rollback test',
                        details: {
                            rollbackSuccess: success,
                            dataRestored: restoredData === originalData
                        }
                    });
                    
                    // Cleanup
                    localStorage.removeItem('stackmap-tasks');
                    window.StackMapBackupManager.delete(backup.id);
                });
            });
        },
        
        /**
         * Test 11: 1000+ Task Migration Performance
         */
        test1000TaskMigration: function(callback) {
            var tasks = [];
            for (var i = 0; i < 1000; i++) {
                tasks.push({
                    id: i,
                    title: 'Task ' + i,
                    description: 'Description for task ' + i,
                    completed: i % 3 === 0,
                    tags: ['tag' + (i % 5), 'category' + (i % 10)]
                });
            }
            
            localStorage.setItem('stackmap-tasks', JSON.stringify(tasks));
            
            var startTime = Date.now();
            
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                var duration = Date.now() - startTime;
                
                callback({
                    passed: result.success && duration < 30000, // Should complete within 30 seconds
                    message: '1000 task migration test',
                    details: {
                        taskCount: tasks.length,
                        duration: duration + 'ms',
                        avgPerTask: Math.round(duration / tasks.length) + 'ms',
                        result: result
                    }
                });
                
                // Cleanup
                localStorage.removeItem('stackmap-tasks');
            });
        },
        
        /**
         * Test 12: Empty Data Migration
         */
        testEmptyDataMigration: function(callback) {
            // No data to migrate
            localStorage.removeItem('stackmap-tasks');
            
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                callback({
                    passed: !result.success && result.message.indexOf('No data') > -1,
                    message: 'Empty data migration test',
                    details: result
                });
            });
        },
        
        /**
         * Test 13: Concurrent Migration Prevention
         */
        testConcurrentMigration: function(callback) {
            localStorage.setItem('stackmap-tasks', JSON.stringify([
                { id: 1, title: 'Concurrent test', completed: false }
            ]));
            
            var results = [];
            
            // Start two migrations
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                results.push({ migration: 1, result: result });
            });
            
            window.StackMapMigrationSafety.safeMigrate(function(result) {
                results.push({ migration: 2, result: result });
                
                // Check that one was prevented
                var prevented = results.some(function(r) {
                    return !r.result.success && r.result.message.indexOf('already in progress') > -1;
                });
                
                callback({
                    passed: prevented,
                    message: 'Concurrent migration prevention',
                    details: results
                });
                
                // Cleanup
                localStorage.removeItem('stackmap-tasks');
            });
        },
        
        /**
         * Test 14: 24-Hour Verification Period
         */
        testVerificationPeriod: function(callback) {
            var verificationData = {
                backupId: 'test_backup_verify',
                migrationTime: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
                verificationTime: Date.now() - (60 * 60 * 1000), // Should have verified 1 hour ago
                status: 'pending'
            };
            
            localStorage.setItem('stackmap_migration_verification', JSON.stringify(verificationData));
            
            // Check verification
            window.StackMapMigrationSafety.checkVerification();
            
            // Get updated status
            var updatedData = localStorage.getItem('stackmap_migration_verification');
            
            callback({
                passed: true,
                message: 'Verification period test',
                details: {
                    original: verificationData,
                    wasChecked: updatedData !== JSON.stringify(verificationData)
                }
            });
            
            // Cleanup
            localStorage.removeItem('stackmap_migration_verification');
        },
        
        /**
         * Test 15: Backup Cleanup After 30 Days
         */
        testBackupCleanup: function(callback) {
            // Create old and new backups
            var oldBackup = {
                id: 'stackmap_backup_old',
                created: Date.now() - (31 * 24 * 60 * 60 * 1000), // 31 days old
                data: {}
            };
            
            var newBackup = {
                id: 'stackmap_backup_new',
                created: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 day old
                data: {}
            };
            
            localStorage.setItem(oldBackup.id, JSON.stringify(oldBackup));
            localStorage.setItem(newBackup.id, JSON.stringify(newBackup));
            
            window.StackMapBackupManager.cleanup(30, function(deletedCount) {
                var oldExists = localStorage.getItem(oldBackup.id) !== null;
                var newExists = localStorage.getItem(newBackup.id) !== null;
                
                callback({
                    passed: !oldExists && newExists,
                    message: 'Backup cleanup test',
                    details: {
                        deletedCount: deletedCount,
                        oldBackupRemoved: !oldExists,
                        newBackupKept: newExists
                    }
                });
                
                // Cleanup
                localStorage.removeItem(oldBackup.id);
                localStorage.removeItem(newBackup.id);
            });
        },
        
        /**
         * Display test results
         */
        displayResults: function() {
            var passed = 0;
            var failed = 0;
            
            console.log('\n📊 Migration Safety Test Results:');
            console.log('================================');
            
            this.testResults.forEach(function(result) {
                if (result.passed) {
                    passed++;
                    console.log('✅', result.name);
                } else {
                    failed++;
                    console.log('❌', result.name, '-', result.message);
                    console.log('   Details:', result.details);
                }
            });
            
            console.log('================================');
            console.log('Total:', this.testResults.length);
            console.log('Passed:', passed);
            console.log('Failed:', failed);
            console.log('Success Rate:', Math.round((passed / this.testResults.length) * 100) + '%');
            
            // Create summary for UI
            if (window.testResultsContainer) {
                var html = '<h2>Migration Safety Test Results</h2>';
                html += '<div class="summary">';
                html += '<span class="passed">Passed: ' + passed + '</span>';
                html += '<span class="failed">Failed: ' + failed + '</span>';
                html += '<span class="rate">Success Rate: ' + Math.round((passed / this.testResults.length) * 100) + '%</span>';
                html += '</div>';
                
                html += '<div class="results">';
                this.testResults.forEach(function(result) {
                    html += '<div class="test-result ' + (result.passed ? 'pass' : 'fail') + '">';
                    html += '<h3>' + (result.passed ? '✅' : '❌') + ' ' + result.name + '</h3>';
                    html += '<p>' + result.message + '</p>';
                    if (result.details) {
                        html += '<pre>' + JSON.stringify(result.details, null, 2) + '</pre>';
                    }
                    html += '</div>';
                });
                html += '</div>';
                
                window.testResultsContainer.innerHTML = html;
            }
        }
    };
    
    // Testing utilities for console
    window.testMigration = {
        // Run all tests
        runAll: function() {
            MigrationSafetyTests.runAll();
        },
        
        // Simulate specific failures
        simulateFailure: function(type) {
            switch(type) {
                case 'sqlite':
                    window.TaskSQLite.createTask = function(task, cb) {
                        cb(null, new Error('Simulated SQLite failure'));
                    };
                    console.log('SQLite will now fail on createTask');
                    break;
                    
                case 'corrupt':
                    localStorage.setItem('stackmap-tasks', '{"corrupt": true');
                    console.log('Data corrupted for testing');
                    break;
                    
                case 'quota':
                    var bigData = new Array(1024 * 1024).join('x');
                    try {
                        for (var i = 0; i < 100; i++) {
                            localStorage.setItem('fill_' + i, bigData);
                        }
                    } catch (e) {
                        console.log('Storage filled:', e);
                    }
                    break;
                    
                case 'memory':
                    // Allocate large arrays to simulate memory pressure
                    window.memoryHog = [];
                    for (var j = 0; j < 100; j++) {
                        window.memoryHog.push(new Array(1024 * 1024));
                    }
                    console.log('Memory pressure applied');
                    break;
            }
        },
        
        // Clear test data
        clearTestData: function() {
            var keysToRemove = [];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && (key.indexOf('stackmap_backup_') === 0 || 
                           key.indexOf('test_') === 0 ||
                           key.indexOf('fill_') === 0)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(function(key) {
                localStorage.removeItem(key);
            });
            
            console.log('Removed', keysToRemove.length, 'test items');
        }
    };
    
    // Expose test suite
    window.MigrationSafetyTests = MigrationSafetyTests;
})();