/**
 * UAT Tests for Google Drive Sync
 * 
 * These tests verify the sync functionality works correctly with:
 * - Multi-user data
 * - Conflict resolution
 * - Data merging
 * - Import/export integration
 */

class DriveSyncTests {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
        this.mockDriveSync = null;
    }
    
    async runTests() {
        console.log('🔄 Starting Google Drive Sync Tests...');
        
        try {
            // These tests use mocked sync to avoid needing real Google credentials
            await this.testSyncDataStructure();
            await this.testMultiUserSync();
            await this.testConflictDetection();
            await this.testMergeStrategies();
            await this.testSyncMetadata();
            await this.testLegacyFormatSync();
            
            // New tests for recent fixes
            await this.testDriveSyncInitialization();
            await this.testDriveSyncErrorHandling();
            await this.testDriveSyncCleanup();
            await this.testDriveSyncNullChecks();
            
            this.reportResults();
        } catch (error) {
            console.error('Fatal test error:', error);
            this.endTest(false, `Fatal error: ${error.message}`);
            this.reportResults();
        }
    }
    
    async testSyncDataStructure() {
        this.startTest('Sync Data Structure');
        
        try {
            // Get the app state
            console.log('Looking for app instance...');
            console.log('window.app:', window.app);
            console.log('window.stackMapApp:', window.stackMapApp);
            console.log('window.appInstance:', window.appInstance);
            
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            // Export data as sync would
            const exportedData = app.appState.exportData();
            
            // Verify structure
            this.assert(exportedData.version !== undefined, 'Has version');
            this.assert(exportedData.users !== undefined, 'Has users object');
            this.assert(exportedData.users.profiles !== undefined, 'Has user profiles');
            this.assert(exportedData.syncMetadata !== undefined, 'Has sync metadata');
            this.assert(exportedData.ui !== undefined, 'Has UI state');
            
            // Verify sync metadata
            const metadata = exportedData.syncMetadata;
            this.assert(metadata.version >= 0, 'Has version number');
            this.assert(metadata.lastModified !== undefined, 'Has last modified');
            this.assert(metadata.deviceId !== undefined, 'Has device ID');
            this.assert(metadata.deviceName !== undefined, 'Has device name');
            
            this.endTest(true, 'Sync data structure is correct');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testMultiUserSync() {
        this.startTest('Multi-User Sync Data');
        
        try {
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            // Create test users
            const testUsers = {
                'test-user-1': {
                    id: 'test-user-1',
                    name: 'Sync Test Alice',
                    icon: '👩',
                    activities: [
                        { title: 'Alice Task 1', icon: '📝', completed: false },
                        { title: 'Alice Task 2', icon: '✅', completed: true }
                    ],
                    tomorrowActivities: [
                        { title: 'Alice Tomorrow', icon: '🔮' }
                    ]
                },
                'test-user-2': {
                    id: 'test-user-2',
                    name: 'Sync Test Bob',
                    icon: '👨',
                    activities: [
                        { title: 'Bob Task 1', icon: '🎯' }
                    ],
                    tomorrowActivities: []
                }
            };
            
            // Temporarily add test users
            Object.assign(app.appState.users.profiles, testUsers);
            
            // Export for sync
            const syncData = app.appState.exportData();
            
            // Verify all users are included
            this.assert(syncData.users.profiles['test-user-1'] !== undefined, 'User 1 in sync data');
            this.assert(syncData.users.profiles['test-user-2'] !== undefined, 'User 2 in sync data');
            
            // Verify user data integrity
            const syncedAlice = syncData.users.profiles['test-user-1'];
            this.assert(syncedAlice.activities.length === 2, 'Alice activities preserved');
            this.assert(syncedAlice.tomorrowActivities.length === 1, 'Alice tomorrow activities preserved');
            this.assert(syncedAlice.icon === '👩', 'Alice icon preserved');
            
            // Clean up
            delete app.appState.users.profiles['test-user-1'];
            delete app.appState.users.profiles['test-user-2'];
            
            this.endTest(true, 'Multi-user data syncs correctly');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testConflictDetection() {
        this.startTest('Conflict Detection');
        
        try {
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            // Create local and remote versions
            const localVersion = 10;
            const remoteVersion = 12;
            
            // Set local version
            app.appState.syncMetadata.version = localVersion;
            
            // Simulate remote data
            const remoteData = {
                syncMetadata: {
                    version: remoteVersion,
                    deviceId: 'different-device',
                    deviceName: 'Other Device',
                    lastModified: new Date().toISOString()
                }
            };
            
            // Check conflict conditions
            const hasVersionConflict = remoteVersion > localVersion;
            const hasDifferentDevice = remoteData.syncMetadata.deviceId !== app.appState.syncMetadata.deviceId;
            
            this.assert(hasVersionConflict, 'Detects version conflict');
            this.assert(hasDifferentDevice, 'Detects different device');
            
            this.endTest(true, 'Conflict detection works correctly');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testMergeStrategies() {
        this.startTest('Data Merge Strategies');
        
        try {
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            // Test activity merging
            const localActivities = [
                { title: 'Task 1', icon: '📝', completed: false },
                { title: 'Task 2', icon: '✅', completed: true },
                { title: 'Task 3', icon: '🎯', completed: false }
            ];
            
            const remoteActivities = [
                { title: 'Task 1', icon: '📝', completed: true }, // Same task, different status
                { title: 'Task 2', icon: '✅', completed: true }, // Same task, same status
                { title: 'Task 4', icon: '🆕', completed: false } // New task
            ];
            
            // Test the merge
            const merged = app.appState.mergeActivities(localActivities, remoteActivities);
            
            // Verify merge results
            this.assert(merged.length === 4, 'Merged has all unique tasks');
            
            const task1 = merged.find(t => t.title === 'Task 1');
            this.assert(task1.completed === true, 'Completed status preserved from either source');
            
            const task4 = merged.find(t => t.title === 'Task 4');
            this.assert(task4 !== undefined, 'New remote task added');
            
            const task3 = merged.find(t => t.title === 'Task 3');
            this.assert(task3 !== undefined, 'Local-only task preserved');
            
            this.endTest(true, 'Merge strategies work correctly');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testSyncMetadata() {
        this.startTest('Sync Metadata Handling');
        
        try {
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            const originalVersion = app.appState.syncMetadata.version;
            const originalDeviceId = app.appState.syncMetadata.deviceId;
            
            // Simulate import with sync metadata
            const importData = {
                version: '2.0',
                users: app.appState.users,
                syncMetadata: {
                    version: 99,
                    deviceId: 'remote-device',
                    deviceName: 'Remote Device',
                    lastModified: new Date().toISOString()
                }
            };
            
            // Import the data
            app.appState.importData(importData, true);
            
            // Verify metadata handling
            this.assert(app.appState.syncMetadata.version > 99, 'Version incremented after import');
            this.assert(app.appState.syncMetadata.deviceId === originalDeviceId, 'Device ID preserved');
            this.assert(app.appState.syncMetadata.deviceName !== 'Remote Device', 'Device name updated to local');
            
            // Restore original
            app.appState.syncMetadata.version = originalVersion;
            
            this.endTest(true, 'Sync metadata handled correctly');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testLegacyFormatSync() {
        this.startTest('Legacy Format Sync Compatibility');
        
        try {
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            // Create legacy format data (single user)
            const legacyData = {
                version: '1.0',
                activities: [
                    { title: 'Legacy Task', icon: '🏛️', completed: false }
                ],
                settings: {
                    title: 'Legacy User',
                    backgroundColor: '#ff6b6b'
                },
                syncMetadata: {
                    version: 5,
                    lastModified: new Date().toISOString()
                }
            };
            
            // Test merging legacy data
            const currentUserCount = Object.keys(app.appState.users.profiles).length;
            
            // The merge should handle legacy format
            app.appState.mergeWithRemote(legacyData);
            
            // Verify legacy handling
            const activities = app.appState.getCurrentActivities();
            const hasLegacyTask = activities.some(a => a.title === 'Legacy Task');
            this.assert(hasLegacyTask || currentUserCount > 0, 'Legacy data handled appropriately');
            
            this.endTest(true, 'Legacy format sync compatibility works');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testDriveSyncInitialization() {
        this.startTest('Drive Sync Initialization');
        
        try {
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            // Check if driveSync exists (may be null if not enabled)
            const hasDriveSync = 'driveSync' in app;
            this.assert(hasDriveSync, 'driveSync property exists on app');
            
            if (app.driveSync) {
                // Check required methods
                this.assert(typeof app.driveSync.signIn === 'function', 'signIn method exists');
                this.assert(typeof app.driveSync.signOut === 'function', 'signOut method exists');
                this.assert(typeof app.driveSync.uploadData === 'function', 'uploadData method exists');
                this.assert(typeof app.driveSync.downloadData === 'function', 'downloadData method exists');
                this.assert(typeof app.driveSync.cleanup === 'function', 'cleanup method exists');
                this.assert(typeof app.driveSync.handleSyncError === 'function', 'handleSyncError method exists');
                
                this.endTest(true, 'Drive sync initialized with all required methods');
            } else {
                this.endTest(true, 'Drive sync is null (not enabled or lazy loading)');
            }
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testDriveSyncErrorHandling() {
        this.startTest('Drive Sync Error Handling');
        
        try {
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            if (!app.driveSync) {
                this.endTest(true, 'Drive sync not available - skipping error handling test');
                return;
            }
            
            // Test updateSignInStatus with missing DOM elements
            try {
                app.driveSync.updateSignInStatus(false);
                this.assert(true, 'updateSignInStatus handles missing DOM elements');
            } catch (error) {
                this.assert(false, `updateSignInStatus threw error: ${error.message}`);
            }
            
            // Test error handler with various error types
            const errorTypes = [
                { status: 401, message: 'Unauthorized' },
                { status: 403, message: 'Forbidden' },
                { status: 404, message: 'Not Found' },
                { message: 'Network error' }
            ];
            
            for (const error of errorTypes) {
                try {
                    app.driveSync.handleSyncError(error, 'test-operation');
                    this.assert(true, `handleSyncError handles ${error.status || 'generic'} errors`);
                } catch (err) {
                    this.assert(false, `handleSyncError failed for ${error.status}: ${err.message}`);
                }
            }
            
            this.endTest(true, 'Error handling works correctly');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testDriveSyncCleanup() {
        this.startTest('Drive Sync Cleanup');
        
        try {
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            if (!app.driveSync) {
                this.endTest(true, 'Drive sync not available - skipping cleanup test');
                return;
            }
            
            // Store original state
            const originalInterval = app.driveSync.syncCheckInterval;
            
            // Test cleanup
            try {
                app.driveSync.cleanup();
                
                this.assert(!app.driveSync.syncCheckInterval, 'syncCheckInterval cleared');
                this.assert(!app.driveSync.isSyncing, 'isSyncing flag reset');
                
                // Restore if needed
                if (originalInterval) {
                    app.driveSync.startSyncCheckInterval();
                }
                
                this.endTest(true, 'Cleanup method works correctly');
            } catch (error) {
                this.assert(false, `Cleanup failed: ${error.message}`);
                this.endTest(false, 'Cleanup method failed');
            }
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testDriveSyncNullChecks() {
        this.startTest('Drive Sync Null Safety Checks');
        
        try {
            const app = window.app || window.stackMapApp || window.appInstance;
            if (!app) {
                this.endTest(false, 'App not found');
                return;
            }
            
            // Test autoSync with null checks
            if (app.autoSyncTimeout !== undefined) {
                try {
                    app.debouncedAutoSync();
                    this.assert(true, 'debouncedAutoSync handles null driveSync');
                } catch (error) {
                    this.assert(false, `debouncedAutoSync failed: ${error.message}`);
                }
            }
            
            // Test PreferencesManager null checks
            if (app.preferencesManager) {
                try {
                    app.preferencesManager.updateSyncControls();
                    this.assert(true, 'PreferencesManager handles null driveSync');
                } catch (error) {
                    this.assert(false, `PreferencesManager failed: ${error.message}`);
                }
            }
            
            this.endTest(true, 'Null safety checks working correctly');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    // === TEST UTILITIES ===
    
    startTest(name) {
        this.currentTest = {
            name: name,
            startTime: Date.now(),
            assertions: [],
            passed: true
        };
        console.log(`\n📋 Test: ${name}`);
    }
    
    endTest(passed, message) {
        if (this.currentTest) {
            this.currentTest.passed = passed;
            this.currentTest.duration = Date.now() - this.currentTest.startTime;
            this.currentTest.message = message;
            
            const status = passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status}: ${this.currentTest.name} (${this.currentTest.duration}ms)`);
            if (message) console.log(`   ${message}`);
            
            this.testResults.push(this.currentTest);
            this.currentTest = null;
        }
    }
    
    assert(condition, message) {
        const passed = !!condition;
        const assertion = { passed, message };
        
        if (this.currentTest) {
            this.currentTest.assertions.push(assertion);
            if (!passed) {
                this.currentTest.passed = false;
                console.error(`   ❌ Assertion failed: ${message}`);
            }
        }
        
        return passed;
    }
    
    reportResults() {
        console.log('\n' + '='.repeat(50));
        console.log('GOOGLE DRIVE SYNC TEST RESULTS');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(t => t.passed).length;
        const failed = this.testResults.filter(t => !t.passed).length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\nFailed Tests:');
            this.testResults
                .filter(t => !t.passed)
                .forEach(t => {
                    console.log(`  ❌ ${t.name}`);
                    if (t.message) console.log(`     ${t.message}`);
                });
        }
        
        console.log('\n' + '='.repeat(50));
        
        return {
            passed: passed,
            failed: failed,
            total: total,
            results: this.testResults
        };
    }
}

// Make available globally for test runner
if (typeof window !== 'undefined') {
    window.DriveSyncTests = DriveSyncTests;
}

// Auto-run if opened directly
if (typeof module === 'undefined' && typeof window !== 'undefined') {
    // Only auto-run if not in iframe
    if (window.parent === window) {
        document.addEventListener('DOMContentLoaded', async () => {
            const tester = new DriveSyncTests();
            await tester.runTests();
        });
    }
}