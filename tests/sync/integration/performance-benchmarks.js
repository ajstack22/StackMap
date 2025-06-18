/**
 * Performance benchmarks for drive sync functionality
 */

class SyncPerformanceBenchmarks {
    constructor() {
        this.benchmarks = [];
        this.results = [];
    }
    
    benchmark(name, config, benchmarkFn) {
        this.benchmarks.push({ name, config, benchmarkFn });
    }
    
    async setup() {
        this.perfTracker = new SyncTestUtils.PerformanceTracker();
        this.mockApp = {
            appState: {
                syncMetadata: {
                    version: 1,
                    lastModified: new Date().toISOString(),
                    deviceId: 'benchmark-device',
                    deviceName: 'Benchmark Device'
                },
                users: {
                    profiles: {},
                    currentUser: 'user-1'
                },
                exportData: function() {
                    return {
                        version: "1.0.0",
                        syncMetadata: this.syncMetadata,
                        users: this.users
                    };
                },
                importData: function(data) {
                    this.syncMetadata = data.syncMetadata;
                    this.users = data.users;
                },
                _triggerSave: function() {}
            },
            saveToLocalStorage: () => {},
            updateTabTitle: () => {},
            render: () => {}
        };
    }
    
    async run() {
        console.log('Running Sync Performance Benchmarks...\n');
        
        for (const bench of this.benchmarks) {
            await this.setup();
            
            console.log(`\nBenchmark: ${bench.name}`);
            console.log('Configuration:', bench.config);
            
            try {
                const result = await bench.benchmarkFn.call(this, bench.config);
                this.results.push({
                    name: bench.name,
                    status: 'COMPLETE',
                    result: result
                });
                
                // Print results
                if (result.measurements) {
                    Object.entries(result.measurements).forEach(([key, value]) => {
                        console.log(`  ${key}: ${value}`);
                    });
                }
                
            } catch (error) {
                this.results.push({
                    name: bench.name,
                    status: 'ERROR',
                    error: error
                });
                console.error(`  Error: ${error.message}`);
            }
        }
        
        // Summary
        console.log('\n=== Benchmark Summary ===');
        this.printSummary();
        
        return this.results;
    }
    
    printSummary() {
        const completed = this.results.filter(r => r.status === 'COMPLETE').length;
        const errors = this.results.filter(r => r.status === 'ERROR').length;
        
        console.log(`Total benchmarks: ${this.results.length}`);
        console.log(`Completed: ${completed}`);
        console.log(`Errors: ${errors}`);
        
        // Print comparison table if multiple sizes tested
        const syncTimeBenchmarks = this.results.filter(r => 
            r.name.includes('Sync time vs data size') && r.status === 'COMPLETE'
        );
        
        if (syncTimeBenchmarks.length > 0) {
            console.log('\n=== Sync Time vs Data Size ===');
            console.log('Users | Activities | Data Size | Sync Time | Throughput');
            console.log('------|------------|-----------|-----------|------------');
            
            syncTimeBenchmarks.forEach(bench => {
                const m = bench.result.measurements;
                console.log(`${m.userCount.toString().padEnd(5)} | ${m.activityCount.toString().padEnd(10)} | ${m.dataSize.padEnd(9)} | ${m.syncTime.padEnd(9)} | ${m.throughput}`);
            });
        }
    }
}

// Create benchmark runner
const benchmarkRunner = new SyncPerformanceBenchmarks();

// Benchmark: Sync time vs data size
[
    { users: 1, activitiesPerUser: 10 },
    { users: 5, activitiesPerUser: 20 },
    { users: 10, activitiesPerUser: 50 },
    { users: 20, activitiesPerUser: 100 },
    { users: 50, activitiesPerUser: 100 }
].forEach(config => {
    benchmarkRunner.benchmark(
        `Sync time vs data size (${config.users} users, ${config.activitiesPerUser} activities each)`,
        config,
        async function(config) {
            // Generate test data
            const testData = SyncTestUtils.TestDataGenerator.generateLargeDataset(
                config.users,
                config.activitiesPerUser
            );
            this.mockApp.appState.users = testData.users;
            
            // Calculate data size
            const dataString = JSON.stringify(this.mockApp.appState.exportData());
            const dataSizeBytes = dataString.length;
            const dataSizeKB = (dataSizeBytes / 1024).toFixed(2);
            
            // Create sync components
            const driveSync = new SyncTestUtils.MockGoogleDriveSync(this.mockApp);
            await driveSync.signIn();
            
            const syncQueue = new SyncQueue();
            syncQueue.operationProcessor = async (operation) => {
                return driveSync.uploadData(operation.data.silent);
            };
            
            // Measure sync time
            const syncResult = await this.perfTracker.measureAsync('sync-operation', async () => {
                syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation(
                    this.mockApp.appState.exportData()
                ));
                await syncQueue.processQueue();
            });
            
            // Calculate metrics
            const totalActivities = config.users * config.activitiesPerUser;
            const throughputKBps = (dataSizeBytes / 1024) / (syncResult.measurement.duration / 1000);
            
            return {
                measurements: {
                    userCount: config.users,
                    activityCount: totalActivities,
                    dataSize: `${dataSizeKB} KB`,
                    syncTime: `${syncResult.measurement.durationMs} ms`,
                    throughput: `${throughputKBps.toFixed(2)} KB/s`,
                    memoryUsed: syncResult.measurement.memoryDeltaMB ? 
                        `${syncResult.measurement.memoryDeltaMB} MB` : 'N/A'
                }
            };
        }
    );
});

// Benchmark: Queue processing speed
benchmarkRunner.benchmark(
    'Queue processing speed (100 operations)',
    { operationCount: 100 },
    async function(config) {
        const syncQueue = new SyncQueue();
        const processedOps = [];
        
        // Fast processor (no actual work)
        syncQueue.operationProcessor = async (operation) => {
            processedOps.push(operation);
            return Promise.resolve();
        };
        
        // Measure enqueue time
        const enqueueResult = await this.perfTracker.measureAsync('enqueue-operations', async () => {
            for (let i = 0; i < config.operationCount; i++) {
                if (i % 3 === 0) {
                    syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
                } else if (i % 3 === 1) {
                    syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation(
                        'user-1', `activity-${i}`, { title: `Update ${i}` }
                    ));
                } else {
                    syncQueue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityDeleteOperation(
                        'user-1', `activity-${i}`
                    ));
                }
            }
        });
        
        // Check deduplication effect
        const actualQueueLength = syncQueue.queue.length;
        
        // Measure processing time
        const processResult = await this.perfTracker.measureAsync('process-queue', async () => {
            await syncQueue.processQueue();
        });
        
        return {
            measurements: {
                operationsEnqueued: config.operationCount,
                operationsAfterDedup: actualQueueLength,
                dedupRatio: `${((1 - actualQueueLength / config.operationCount) * 100).toFixed(1)}%`,
                enqueueTime: `${enqueueResult.measurement.durationMs} ms`,
                enqueueRate: `${(config.operationCount / (enqueueResult.measurement.duration / 1000)).toFixed(0)} ops/s`,
                processTime: `${processResult.measurement.durationMs} ms`,
                processRate: `${(actualQueueLength / (processResult.measurement.duration / 1000)).toFixed(0)} ops/s`
            }
        };
    }
);

// Benchmark: Memory usage during large sync
benchmarkRunner.benchmark(
    'Memory usage during large sync',
    { users: 100, activitiesPerUser: 50 },
    async function(config) {
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        const measurements = {};
        
        // Measure initial memory
        if (performance.memory) {
            measurements.initialMemory = `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`;
        }
        
        // Generate large dataset
        const dataGenResult = await this.perfTracker.measureAsync('generate-data', async () => {
            const testData = SyncTestUtils.TestDataGenerator.generateLargeDataset(
                config.users,
                config.activitiesPerUser
            );
            this.mockApp.appState.users = testData.users;
            return testData;
        });
        
        if (dataGenResult.measurement.memoryDeltaMB) {
            measurements.dataGenerationMemory = `${dataGenResult.measurement.memoryDeltaMB} MB`;
        }
        
        // Measure serialization
        const serializeResult = await this.perfTracker.measureAsync('serialize-data', async () => {
            return JSON.stringify(this.mockApp.appState.exportData());
        });
        
        measurements.dataSize = `${(serializeResult.value.length / 1024).toFixed(2)} KB`;
        if (serializeResult.measurement.memoryDeltaMB) {
            measurements.serializationMemory = `${serializeResult.measurement.memoryDeltaMB} MB`;
        }
        
        // Measure sync operation
        const driveSync = new SyncTestUtils.MockGoogleDriveSync(this.mockApp);
        await driveSync.signIn();
        
        const syncResult = await this.perfTracker.measureAsync('sync-operation', async () => {
            await driveSync.uploadData();
        });
        
        if (syncResult.measurement.memoryDeltaMB) {
            measurements.syncMemory = `${syncResult.measurement.memoryDeltaMB} MB`;
        }
        
        // Final memory
        if (performance.memory) {
            measurements.finalMemory = `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`;
            measurements.peakMemory = `${(performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`;
        }
        
        return { measurements };
    }
);

// Benchmark: Conflict resolution performance
benchmarkRunner.benchmark(
    'Conflict resolution performance',
    { conflictCount: 50 },
    async function(config) {
        // Create base state
        const baseState = SyncTestUtils.TestDataGenerator.generateAppState({
            users: SyncTestUtils.TestDataGenerator.generateUsers(10, 20)
        });
        
        // Create conflicting states
        const localState = JSON.parse(JSON.stringify(baseState));
        const remoteState = JSON.parse(JSON.stringify(baseState));
        
        // Modify states to create conflicts
        for (let i = 0; i < config.conflictCount; i++) {
            const userId = `user-${(i % 10) + 1}`;
            const activityIndex = i % 20;
            
            // Local changes
            if (localState.users.profiles[userId].activities[activityIndex]) {
                localState.users.profiles[userId].activities[activityIndex].title += ' (Local Edit)';
                localState.users.profiles[userId].activities[activityIndex].completed = true;
            }
            
            // Remote changes
            if (remoteState.users.profiles[userId].activities[activityIndex]) {
                remoteState.users.profiles[userId].activities[activityIndex].title += ' (Remote Edit)';
                remoteState.users.profiles[userId].activities[activityIndex].description += ' Updated remotely.';
            }
        }
        
        // Update versions
        localState.syncMetadata.version = 10;
        remoteState.syncMetadata.version = 10;
        localState.syncMetadata.deviceId = 'local-device';
        remoteState.syncMetadata.deviceId = 'remote-device';
        
        this.mockApp.appState.importData(localState, false);
        
        // Measure merge performance
        const mergeResult = await this.perfTracker.measureAsync('merge-operation', async () => {
            this.mockApp.appState.mergeWithRemote(remoteState);
        });
        
        // Count final activities
        const finalActivityCount = Object.values(this.mockApp.appState.users.profiles)
            .reduce((sum, user) => sum + (user.activities ? user.activities.length : 0), 0);
        
        return {
            measurements: {
                conflictCount: config.conflictCount,
                mergeTime: `${mergeResult.measurement.durationMs} ms`,
                finalActivityCount: finalActivityCount,
                mergeRate: `${(config.conflictCount / (mergeResult.measurement.duration / 1000)).toFixed(0)} conflicts/s`,
                memoryUsed: mergeResult.measurement.memoryDeltaMB ? 
                    `${mergeResult.measurement.memoryDeltaMB} MB` : 'N/A'
            }
        };
    }
);

// Benchmark: Operation transformation performance
benchmarkRunner.benchmark(
    'Operation transformation performance',
    { operationCount: 200, complexityLevel: 'high' },
    async function(config) {
        const syncQueue = new SyncQueue();
        
        // Prevent actual processing
        syncQueue.operationProcessor = async () => Promise.resolve();
        
        // Generate complex operation sequence
        const operations = [];
        for (let i = 0; i < config.operationCount; i++) {
            const opType = i % 5;
            const userId = `user-${(i % 5) + 1}`;
            const activityId = `activity-${i}`;
            
            switch (opType) {
                case 0:
                    operations.push(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation(
                        userId, activityId, { title: `Update ${i}` }
                    ));
                    break;
                case 1:
                    operations.push(SyncTestUtils.SyncOperationFactory.createActivityMoveOperation(
                        userId, activityId, i % 10, (i + 5) % 10
                    ));
                    break;
                case 2:
                    operations.push(SyncTestUtils.SyncOperationFactory.createActivityDeleteOperation(
                        userId, activityId
                    ));
                    break;
                case 3:
                    operations.push(SyncTestUtils.SyncOperationFactory.createUserSwitchOperation(userId));
                    break;
                case 4:
                    operations.push(SyncTestUtils.SyncOperationFactory.createBatchUpdateOperation(
                        userId,
                        [`activity-${i}`, `activity-${i+1}`, `activity-${i+2}`],
                        { completed: true }
                    ));
                    break;
            }
        }
        
        // Measure transformation time
        const transformResult = await this.perfTracker.measureAsync('transform-operations', async () => {
            operations.forEach(op => syncQueue.enqueue(op));
        });
        
        return {
            measurements: {
                operationCount: config.operationCount,
                finalQueueLength: syncQueue.queue.length,
                reductionRatio: `${((1 - syncQueue.queue.length / config.operationCount) * 100).toFixed(1)}%`,
                transformTime: `${transformResult.measurement.durationMs} ms`,
                transformRate: `${(config.operationCount / (transformResult.measurement.duration / 1000)).toFixed(0)} ops/s`
            }
        };
    }
);

// Export benchmark runner
if (typeof window !== 'undefined') {
    window.SyncPerformanceBenchmarks = benchmarkRunner;
}