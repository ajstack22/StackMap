/**
 * Unit tests for SyncQueue class
 */

// Test runner for browser environment
class SyncQueueTestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
        this.originalLocalStorage = null;
        this.mockLocalStorage = null;
        this.networkMock = null;
    }
    
    async setup() {
        // Mock localStorage
        this.originalLocalStorage = window.localStorage;
        this.mockLocalStorage = new SyncTestUtils.MockLocalStorage();
        Object.defineProperty(window, 'localStorage', {
            value: this.mockLocalStorage,
            configurable: true
        });
        
        // Mock network
        this.networkMock = new SyncTestUtils.NetworkMock();
    }
    
    async teardown() {
        // Restore localStorage
        Object.defineProperty(window, 'localStorage', {
            value: this.originalLocalStorage,
            configurable: true
        });
        
        // Reset network
        this.networkMock.reset();
    }
    
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    async run() {
        console.log('Running SyncQueue Unit Tests...\n');
        
        for (const test of this.tests) {
            await this.setup();
            
            try {
                await test.testFn();
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
const runner = new SyncQueueTestRunner();

// Test: Basic enqueue and dequeue operations
runner.test('Basic enqueue and dequeue operations', async () => {
    const queue = new SyncQueue();
    
    // Set up operation processor
    let processedOperations = [];
    queue.operationProcessor = async (operation) => {
        processedOperations.push(operation);
        return Promise.resolve();
    };
    
    // Test enqueue
    const operation = SyncTestUtils.SyncOperationFactory.createUploadOperation();
    const id = queue.enqueue(operation);
    
    // Verify queue state
    if (queue.queue.length !== 1) {
        throw new Error(`Expected queue length 1, got ${queue.queue.length}`);
    }
    
    if (!id || typeof id !== 'string') {
        throw new Error(`Expected string ID, got ${id}`);
    }
    
    // Verify localStorage persistence
    const stored = JSON.parse(window.localStorage.getItem('stackmap-sync-queue'));
    if (!stored || stored.queue.length !== 1) {
        throw new Error('Queue not persisted to localStorage');
    }
    
    // Process queue
    await queue.processQueue();
    
    // Verify processing
    if (processedOperations.length !== 1) {
        throw new Error(`Expected 1 processed operation, got ${processedOperations.length}`);
    }
    
    if (queue.queue.length !== 0) {
        throw new Error(`Expected empty queue after processing, got ${queue.queue.length}`);
    }
});

// Test: Deduplication logic for upload operations
runner.test('Deduplication logic for upload operations', async () => {
    const queue = new SyncQueue();
    
    // Enqueue multiple upload operations
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    
    // Should only have the latest upload
    if (queue.queue.length !== 1) {
        throw new Error(`Expected 1 upload operation after deduplication, got ${queue.queue.length}`);
    }
    
    if (queue.queue[0].type !== 'upload') {
        throw new Error(`Expected upload operation, got ${queue.queue[0].type}`);
    }
});

// Test: Deduplication for activity updates
runner.test('Deduplication for activity updates', async () => {
    const queue = new SyncQueue();
    
    const userId = 'user-1';
    const activityId = 'activity-1';
    
    // Enqueue multiple updates to the same activity
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation(
        userId, activityId, { title: 'Update 1' }
    ));
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation(
        userId, activityId, { title: 'Update 2' }
    ));
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation(
        userId, activityId, { title: 'Update 3' }
    ));
    
    // Should only have the latest update
    if (queue.queue.length !== 1) {
        throw new Error(`Expected 1 update operation after deduplication, got ${queue.queue.length}`);
    }
    
    if (queue.queue[0].data.updates.title !== 'Update 3') {
        throw new Error(`Expected latest update, got ${queue.queue[0].data.updates.title}`);
    }
});

// Test: Operation transformation for move operations
runner.test('Operation transformation for move operations', async () => {
    const queue = new SyncQueue();
    
    const userId = 'user-1';
    
    // Enqueue move operations
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityMoveOperation(
        userId, 'activity-1', 0, 2
    ));
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityMoveOperation(
        userId, 'activity-2', 1, 3
    ));
    
    // Both operations should be preserved
    if (queue.queue.length !== 2) {
        throw new Error(`Expected 2 move operations, got ${queue.queue.length}`);
    }
});

// Test: Retry logic with exponential backoff
runner.test('Retry logic with exponential backoff', async () => {
    const queue = new SyncQueue();
    
    let attemptCount = 0;
    const failTimes = 2;
    
    // Set up operation processor that fails first 2 times
    queue.operationProcessor = async (operation) => {
        attemptCount++;
        if (attemptCount <= failTimes) {
            throw new Error('Simulated failure');
        }
        return Promise.resolve();
    };
    
    // Enqueue operation
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    
    // Process queue
    const startTime = Date.now();
    await queue.processQueue();
    const duration = Date.now() - startTime;
    
    // Verify retry attempts
    if (attemptCount !== failTimes + 1) {
        throw new Error(`Expected ${failTimes + 1} attempts, got ${attemptCount}`);
    }
    
    // Verify queue is empty after success
    if (queue.queue.length !== 0) {
        throw new Error(`Expected empty queue after successful retry, got ${queue.queue.length}`);
    }
    
    // Verify backoff delay (should be at least 1s for first retry)
    if (duration < 1000) {
        throw new Error(`Expected retry delay of at least 1000ms, got ${duration}ms`);
    }
});

// Test: Max retries and failed operation handling
runner.test('Max retries and failed operation handling', async () => {
    const queue = new SyncQueue();
    
    // Set up operation processor that always fails
    queue.operationProcessor = async (operation) => {
        throw new Error('Permanent failure');
    };
    
    // Enqueue operation
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    
    // Process queue
    await queue.processQueue();
    
    // Verify queue is empty
    if (queue.queue.length !== 0) {
        throw new Error(`Expected empty queue after max retries, got ${queue.queue.length}`);
    }
    
    // Verify failed operation was stored
    const failed = JSON.parse(window.localStorage.getItem('stackmap-failed-sync-operations') || '[]');
    if (failed.length !== 1) {
        throw new Error(`Expected 1 failed operation, got ${failed.length}`);
    }
    
    if (!failed[0].failedAt) {
        throw new Error('Failed operation missing failedAt timestamp');
    }
});

// Test: localStorage persistence across instances
runner.test('localStorage persistence across instances', async () => {
    // Create first queue and add operations
    const queue1 = new SyncQueue();
    queue1.operationProcessor = async () => Promise.resolve();
    
    queue1.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    queue1.enqueue(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation(
        'user-1', 'activity-1', { title: 'Persisted Update' }
    ));
    
    // Create second queue instance
    const queue2 = new SyncQueue();
    
    // Verify operations were loaded
    if (queue2.queue.length !== 2) {
        throw new Error(`Expected 2 persisted operations, got ${queue2.queue.length}`);
    }
    
    if (queue2.queue[0].type !== 'upload') {
        throw new Error(`Expected upload operation, got ${queue2.queue[0].type}`);
    }
    
    if (queue2.queue[1].data.updates.title !== 'Persisted Update') {
        throw new Error(`Expected persisted update, got ${queue2.queue[1].data.updates.title}`);
    }
});

// Test: Network status handling
runner.test('Network status handling', async () => {
    const queue = new SyncQueue();
    
    let processCount = 0;
    queue.operationProcessor = async () => {
        processCount++;
        return Promise.resolve();
    };
    
    // Go offline
    runner.networkMock.goOffline();
    
    // Enqueue operation while offline
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    
    // Try to process (should not process while offline)
    await queue.processQueue();
    
    if (processCount !== 0) {
        throw new Error(`Expected no processing while offline, got ${processCount}`);
    }
    
    // Go online
    runner.networkMock.goOnline();
    
    // Wait for automatic processing
    await SyncTestUtils.SyncTestHelpers.waitFor(() => processCount === 1, 2000);
    
    if (queue.queue.length !== 0) {
        throw new Error(`Expected empty queue after going online, got ${queue.queue.length}`);
    }
});

// Test: Queue status and notifications
runner.test('Queue status and notifications', async () => {
    const queue = new SyncQueue();
    queue.operationProcessor = async () => Promise.resolve();
    
    let notificationCount = 0;
    let lastNotification = null;
    
    // Listen for notifications
    window.addEventListener('syncQueueUpdate', (event) => {
        notificationCount++;
        lastNotification = event.detail;
    });
    
    // Enqueue operation
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    
    // Check status
    const status = queue.getStatus();
    if (status.queueLength !== 1) {
        throw new Error(`Expected queue length 1, got ${status.queueLength}`);
    }
    
    if (!status.isOnline) {
        throw new Error('Expected online status');
    }
    
    // Process queue
    await queue.processQueue();
    
    // Verify notifications were sent
    if (notificationCount < 2) {
        throw new Error(`Expected at least 2 notifications, got ${notificationCount}`);
    }
    
    if (lastNotification.queueLength !== 0) {
        throw new Error(`Expected final notification with empty queue, got ${lastNotification.queueLength}`);
    }
});

// Test: Clear queue functionality
runner.test('Clear queue functionality', async () => {
    const queue = new SyncQueue();
    
    // Add multiple operations
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createUploadOperation());
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityUpdateOperation('user-1', 'activity-1', {}));
    queue.enqueue(SyncTestUtils.SyncOperationFactory.createActivityDeleteOperation('user-1', 'activity-2'));
    
    if (queue.queue.length !== 3) {
        throw new Error(`Expected 3 operations, got ${queue.queue.length}`);
    }
    
    // Clear queue
    queue.clearQueue();
    
    if (queue.queue.length !== 0) {
        throw new Error(`Expected empty queue after clear, got ${queue.queue.length}`);
    }
    
    // Verify localStorage was cleared
    const stored = JSON.parse(window.localStorage.getItem('stackmap-sync-queue') || '{}');
    if (stored.queue && stored.queue.length > 0) {
        throw new Error('Queue not cleared in localStorage');
    }
});

// Test: Retry failed operations
runner.test('Retry failed operations', async () => {
    const queue = new SyncQueue();
    
    let processCount = 0;
    queue.operationProcessor = async () => {
        processCount++;
        return Promise.resolve();
    };
    
    // Add failed operations to localStorage
    const failedOps = [
        {
            ...SyncTestUtils.SyncOperationFactory.createUploadOperation(),
            failedAt: Date.now() - 1000,
            retryCount: 3,
            lastError: 'Previous failure'
        }
    ];
    window.localStorage.setItem('stackmap-failed-sync-operations', JSON.stringify(failedOps));
    
    // Retry failed operations
    queue.retryFailed();
    
    // Verify operation was added to queue
    if (queue.queue.length !== 1) {
        throw new Error(`Expected 1 operation in queue, got ${queue.queue.length}`);
    }
    
    // Verify retry count was reset
    if (queue.queue[0].retryCount !== 0) {
        throw new Error(`Expected retry count reset to 0, got ${queue.queue[0].retryCount}`);
    }
    
    // Process and verify
    await queue.processQueue();
    
    if (processCount !== 1) {
        throw new Error(`Expected 1 process call, got ${processCount}`);
    }
    
    // Verify failed operations were cleared
    const remainingFailed = JSON.parse(window.localStorage.getItem('stackmap-failed-sync-operations') || '[]');
    if (remainingFailed.length !== 0) {
        throw new Error('Failed operations not cleared after retry');
    }
});

// Export test runner for use in HTML test page
if (typeof window !== 'undefined') {
    window.SyncQueueTestRunner = runner;
}