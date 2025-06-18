/**
 * Integration tests for drive sync scenarios
 */

class SyncIntegrationTestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }
    
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    async setup() {
        // Create mock app instance
        this.mockApp = {
            appState: {
                syncMetadata: {
                    version: 1,
                    lastModified: new Date().toISOString(),
                    deviceId: 'test-device',
                    deviceName: 'Test Device'
                },
                users: {
                    profiles: SyncTestUtils.TestDataGenerator.generateUsers(2, 5),
                    currentUser: 'user-1'
                },
                syncSettings: {
                    lastSync: null,
                    autoSync: true
                },
                exportData: function() {
                    return {
                        version: "1.0.0",
                        syncMetadata: this.syncMetadata,
                        users: this.users,
                        syncSettings: this.syncSettings
                    };
                },
                importData: function(data, merge) {
                    if (merge) {
                        // Simple merge logic for testing
                        Object.assign(this.syncMetadata, data.syncMetadata);
                        Object.assign(this.users.profiles, data.users.profiles);
                    } else {
                        this.syncMetadata = data.syncMetadata;
                        this.users = data.users;
                        this.syncSettings = data.syncSettings || {};
                    }
                },
                mergeWithRemote: function(remoteData) {
                    // Merge users
                    Object.entries(remoteData.users.profiles).forEach(([userId, userData]) => {
                        if (!this.users.profiles[userId]) {
                            this.users.profiles[userId] = userData;
                        } else {
                            // Merge activities
                            const existingActivities = this.users.profiles[userId].activities || [];
                            const remoteActivities = userData.activities || [];
                            
                            // Simple merge: combine and deduplicate by ID
                            const mergedActivities = [...existingActivities];
                            remoteActivities.forEach(remoteAct => {
                                if (!existingActivities.find(a => a.id === remoteAct.id)) {
                                    mergedActivities.push(remoteAct);
                                }
                            });
                            
                            this.users.profiles[userId].activities = mergedActivities;
                        }
                    });
                    
                    // Update version
                    this.syncMetadata.version = Math.max(
                        this.syncMetadata.version,
                        remoteData.syncMetadata.version
                    ) + 1;
                    this.syncMetadata.lastModified = new Date().toISOString();
                },
                _triggerSave: function() {
                    // Mock save trigger
                }
            },
            saveToLocalStorage: () => {},
            updateTabTitle: () => {},
            render: () => {},
            grownupMode: true
        };
        
        // Create mocks
        this.localStorage = new SyncTestUtils.MockLocalStorage();
        this.networkMock = new SyncTestUtils.NetworkMock();
        
        // Mock window.localStorage
        Object.defineProperty(window, 'localStorage', {
            value: this.localStorage,
            configurable: true
        });
    }
    
    async teardown() {
        // Restore original localStorage
        this.networkMock.reset();
    }
    
    async run() {
        console.log('Running Sync Integration Tests...\n');
        
        for (const test of this.tests) {
            await this.setup();
            
            try {
                await test.testFn.call(this);
                this.results.push({
                    name: test.name,
                    status: 'PASS',
                    error: null
                });
                console.log(`✓ ${test.name}`);
            } catch (error) {
                this.results.push({
                    name: test.name,
                    status: 'FAIL',
                    error: error
                });
                console.error(`✗ ${test.name}`);
                console.error(`  ${error.message}`);
                console.error(error.stack);
            }
            
            await this.teardown();
        }
        
        // Summary
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
        
        return this.results;
    }
}

// Create test runner
const integrationRunner = new SyncIntegrationTestRunner();

// Test: Offline to Online transition
integrationRunner.test('Offline to Online transition', async function() {
    // Create sync queue with mock drive sync
    const syncQueue = new SyncQueue();
    const driveSync = new SyncTestUtils.MockGoogleDriveSync(this.mockApp);
    
    let uploadCount = 0;
    syncQueue.operationProcessor = async (operation) => {
        uploadCount++;
        return driveSync.uploadData(operation.data.silent);
    };
    
    // Go offline
    this.networkMock.goOffline();
    
    // Queue multiple operations while offline
    syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation(
        'user-1', 'activity-1', { title: 'Offline Update' }
    ));
    syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityDeleteOperation(
        'user-1', 'activity-2'
    ));
    
    // Verify operations are queued
    if (syncQueue.queue.length !== 3) {
        throw new Error(`Expected 3 queued operations, got ${syncQueue.queue.length}`);
    }
    
    // Sign in while offline
    await driveSync.signIn();
    
    // Go online
    this.networkMock.goOnline();
    
    // Wait for processing
    await SyncTestUtils.SyncTestHelpers.waitForProcessingComplete(syncQueue, 5000);
    
    // Verify all operations were processed
    if (uploadCount !== 3) {
        throw new Error(`Expected 3 uploads, got ${uploadCount}`);
    }
    
    if (syncQueue.queue.length !== 0) {
        throw new Error(`Expected empty queue after processing, got ${syncQueue.queue.length}`);
    }
});

// Test: Concurrent edits from multiple devices
integrationRunner.test('Concurrent edits from multiple devices', async function() {
    // Create two app instances representing different devices
    const device1App = JSON.parse(JSON.stringify(this.mockApp));
    const device2App = JSON.parse(JSON.stringify(this.mockApp));
    
    // Set different device IDs
    device1App.appState.syncMetadata.deviceId = 'device-1';
    device1App.appState.syncMetadata.deviceName = 'Device 1';
    device2App.appState.syncMetadata.deviceId = 'device-2';
    device2App.appState.syncMetadata.deviceName = 'Device 2';
    
    // Create sync instances
    const sync1 = new SyncTestUtils.MockGoogleDriveSync(device1App);
    const sync2 = new SyncTestUtils.MockGoogleDriveSync(device2App);
    
    // Make different changes on each device
    device1App.appState.users.profiles['user-1'].activities[0].title = 'Device 1 Edit';
    device1App.appState.users.profiles['user-1'].activities.push(
        SyncTestUtils.TestDataGenerator.generateActivity('new-1', {
            title: 'New Activity from Device 1'
        })
    );
    
    device2App.appState.users.profiles['user-1'].activities[1].title = 'Device 2 Edit';
    device2App.appState.users.profiles['user-2'] = SyncTestUtils.TestDataGenerator.generateUser(2, {
        name: 'New User from Device 2',
        activities: [
            SyncTestUtils.TestDataGenerator.generateActivity('new-2', {
                title: 'Activity for New User'
            })
        ]
    });
    
    // Increment versions to simulate concurrent edits
    device1App.appState.syncMetadata.version = 2;
    device2App.appState.syncMetadata.version = 2;
    
    // Set remote data for conflict simulation
    sync2.setRemoteData(device1App.appState.exportData());
    
    // Download on device 2 (should trigger conflict)
    let conflictDetected = false;
    const originalConfirm = window.confirm;
    window.confirm = () => {
        conflictDetected = true;
        return false; // Don't download
    };
    
    try {
        await sync2.downloadData();
    } finally {
        window.confirm = originalConfirm;
    }
    
    if (!conflictDetected) {
        throw new Error('Conflict was not detected for concurrent edits');
    }
});

// Test: Large dataset sync
integrationRunner.test('Large dataset sync (1000+ activities)', async function() {
    const perfTracker = new SyncTestUtils.PerformanceTracker();
    
    // Generate large dataset
    const largeData = SyncTestUtils.TestDataGenerator.generateLargeDataset(10, 100);
    this.mockApp.appState.users = largeData.users;
    
    // Create sync instance
    const driveSync = new SyncTestUtils.MockGoogleDriveSync(this.mockApp);
    await driveSync.signIn();
    
    // Create sync queue
    const syncQueue = new SyncQueue();
    syncQueue.operationProcessor = async (operation) => {
        return driveSync.uploadData(operation.data.silent);
    };
    
    // Measure sync performance
    const syncResult = await perfTracker.measureAsync('large-dataset-sync', async () => {
        // Queue upload
        syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation(
            this.mockApp.appState.exportData()
        ));
        
        // Process
        await syncQueue.processQueue();
        
        return driveSync.getUploadCallCount();
    });
    
    console.log(`  Large dataset sync completed in ${syncResult.measurement.durationMs}ms`);
    if (syncResult.measurement.memoryDeltaMB) {
        console.log(`  Memory used: ${syncResult.measurement.memoryDeltaMB}MB`);
    }
    
    // Calculate data size
    const dataSize = JSON.stringify(this.mockApp.appState.exportData()).length;
    console.log(`  Data size: ${(dataSize / 1024).toFixed(2)}KB`);
    
    // Verify sync completed
    if (syncResult.value !== 1) {
        throw new Error(`Expected 1 upload, got ${syncResult.value}`);
    }
    
    // Performance threshold (should sync within 5 seconds)
    if (syncResult.measurement.duration > 5000) {
        throw new Error(`Sync took too long: ${syncResult.measurement.durationMs}ms`);
    }
});

// Test: Network interruption during sync
integrationRunner.test('Network interruption during sync', async function() {
    const driveSync = new SyncTestUtils.MockGoogleDriveSync(this.mockApp);
    await driveSync.signIn();
    
    // Set upload delay to simulate slow network
    driveSync.uploadDelay = 1000;
    
    // Create sync queue
    const syncQueue = new SyncQueue();
    let interruptedOperation = null;
    
    syncQueue.operationProcessor = async (operation) => {
        // Simulate network interruption mid-operation
        if (!interruptedOperation) {
            interruptedOperation = operation;
            this.networkMock.goOffline();
            throw new Error('Network error');
        }
        return driveSync.uploadData(operation.data.silent);
    };
    
    // Queue operation
    syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    
    // Start processing
    await syncQueue.processQueue();
    
    // Verify operation was moved to end of queue for retry
    if (syncQueue.queue.length !== 1) {
        throw new Error(`Expected 1 queued operation after interruption, got ${syncQueue.queue.length}`);
    }
    
    if (syncQueue.queue[0].retryCount !== 1) {
        throw new Error(`Expected retry count 1, got ${syncQueue.queue[0].retryCount}`);
    }
    
    // Go back online
    this.networkMock.goOnline();
    
    // Wait for retry
    await SyncTestUtils.SyncTestHelpers.waitForProcessingComplete(syncQueue, 5000);
    
    // Verify successful completion
    if (syncQueue.queue.length !== 0) {
        throw new Error(`Expected empty queue after retry, got ${syncQueue.queue.length}`);
    }
    
    if (driveSync.getUploadCallCount() !== 1) {
        throw new Error(`Expected 1 successful upload, got ${driveSync.getUploadCallCount()}`);
    }
});

// Test: Token expiration handling
integrationRunner.test('Token expiration handling', async function() {
    const driveSync = new SyncTestUtils.MockGoogleDriveSync(this.mockApp);
    await driveSync.signIn();
    
    // Create sync queue
    const syncQueue = new SyncQueue();
    let tokenExpired = false;
    
    syncQueue.operationProcessor = async (operation) => {
        if (!tokenExpired) {
            tokenExpired = true;
            // Simulate token expiration
            driveSync.isSignedIn = false;
            driveSync.accessToken = null;
            throw new Error('401 Unauthorized');
        }
        
        // Check if re-authenticated
        if (!driveSync.isSignedIn) {
            throw new Error('Not authenticated');
        }
        
        return driveSync.uploadData(operation.data.silent);
    };
    
    // Queue operation
    syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    
    // Process (will fail with token error)
    await syncQueue.processQueue();
    
    // Verify operation is still queued
    if (syncQueue.queue.length !== 1) {
        throw new Error(`Expected 1 queued operation after token error, got ${syncQueue.queue.length}`);
    }
    
    // Re-authenticate
    await driveSync.signIn();
    
    // Process again
    await syncQueue.processQueue();
    
    // Verify successful completion
    if (syncQueue.queue.length !== 0) {
        throw new Error(`Expected empty queue after re-auth, got ${syncQueue.queue.length}`);
    }
});

// Test: Conflict resolution with merge
integrationRunner.test('Conflict resolution with merge', async function() {
    // Create local state
    const localState = SyncTestUtils.TestDataGenerator.generateAppState({
        syncVersion: 5,
        deviceId: 'local-device',
        users: {
            'user-1': SyncTestUtils.TestDataGenerator.generateUser(1, {
                activities: [
                    SyncTestUtils.TestDataGenerator.generateActivity('act-1', { title: 'Local Activity 1' }),
                    SyncTestUtils.TestDataGenerator.generateActivity('act-2', { title: 'Local Activity 2' })
                ]
            })
        }
    });
    
    // Create remote state with same version but different content
    const remoteState = SyncTestUtils.TestDataGenerator.generateAppState({
        syncVersion: 5,
        deviceId: 'remote-device',
        users: {
            'user-1': SyncTestUtils.TestDataGenerator.generateUser(1, {
                activities: [
                    SyncTestUtils.TestDataGenerator.generateActivity('act-3', { title: 'Remote Activity 3' }),
                    SyncTestUtils.TestDataGenerator.generateActivity('act-4', { title: 'Remote Activity 4' })
                ]
            }),
            'user-2': SyncTestUtils.TestDataGenerator.generateUser(2, {
                activities: [
                    SyncTestUtils.TestDataGenerator.generateActivity('act-5', { title: 'Remote User 2 Activity' })
                ]
            })
        }
    });
    
    this.mockApp.appState.importData(localState, false);
    
    // Perform merge
    this.mockApp.appState.mergeWithRemote(remoteState);
    
    // Verify merge results
    const mergedUsers = Object.keys(this.mockApp.appState.users.profiles);
    if (mergedUsers.length !== 2) {
        throw new Error(`Expected 2 users after merge, got ${mergedUsers.length}`);
    }
    
    const user1Activities = this.mockApp.appState.users.profiles['user-1'].activities;
    if (user1Activities.length !== 4) {
        throw new Error(`Expected 4 activities for user-1 after merge, got ${user1Activities.length}`);
    }
    
    // Verify version was incremented
    if (this.mockApp.appState.syncMetadata.version !== 6) {
        throw new Error(`Expected version 6 after merge, got ${this.mockApp.appState.syncMetadata.version}`);
    }
});

// Test: Queue persistence across app restarts
integrationRunner.test('Queue persistence across app restarts', async function() {
    // First session - queue operations while offline
    this.networkMock.goOffline();
    
    const syncQueue1 = new SyncQueue();
    syncQueue1.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    syncQueue1.enqueue(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation(
        'user-1', 'activity-1', { title: 'Persisted Update' }
    ));
    
    // Simulate app shutdown (queue saved to localStorage)
    const queueState = this.localStorage.getItem('stackmap-sync-queue');
    if (!queueState) {
        throw new Error('Queue not persisted to localStorage');
    }
    
    // Second session - create new queue instance
    const syncQueue2 = new SyncQueue();
    
    // Verify operations were loaded
    if (syncQueue2.queue.length !== 2) {
        throw new Error(`Expected 2 persisted operations, got ${syncQueue2.queue.length}`);
    }
    
    // Go online and process
    this.networkMock.goOnline();
    
    const driveSync = new SyncTestUtils.MockGoogleDriveSync(this.mockApp);
    await driveSync.signIn();
    
    syncQueue2.operationProcessor = async (operation) => {
        return driveSync.uploadData(operation.data.silent);
    };
    
    await syncQueue2.processQueue();
    
    // Verify processing
    if (driveSync.getUploadCallCount() !== 2) {
        throw new Error(`Expected 2 uploads, got ${driveSync.getUploadCallCount()}`);
    }
    
    if (syncQueue2.queue.length !== 0) {
        throw new Error(`Expected empty queue after processing, got ${syncQueue2.queue.length}`);
    }
});

// Test: Batch operations optimization
integrationRunner.test('Batch operations optimization', async function() {
    const syncQueue = new SyncQueue();
    
    // Queue multiple operations for the same user
    const userId = 'user-1';
    const activityIds = ['act-1', 'act-2', 'act-3', 'act-4', 'act-5'];
    
    // Queue individual updates
    activityIds.forEach(actId => {
        syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation(
            userId, actId, { completed: true }
        ));
    });
    
    // Queue a batch update that covers some of the same activities
    syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createBatchUpdateOperation(
        userId,
        ['act-2', 'act-3', 'act-4'],
        { completed: false, cardType: 'milestone' }
    ));
    
    // The batch update should transform the individual updates
    const queuedOps = syncQueue.queue.filter(op => op.type === 'update-activity');
    
    // Check that updates were merged properly
    const act2Op = queuedOps.find(op => op.data.activityId === 'act-2');
    if (!act2Op || !act2Op.data.updates.cardType) {
        throw new Error('Batch update did not properly transform individual updates');
    }
});

// Export test runner
if (typeof window !== 'undefined') {
    window.SyncIntegrationTestRunner = integrationRunner;
}