/**
 * Test utilities for drive sync functionality
 */

// Mock localStorage implementation for testing
class MockLocalStorage {
    constructor() {
        this.store = {};
    }
    
    getItem(key) {
        return this.store[key] || null;
    }
    
    setItem(key, value) {
        this.store[key] = value.toString();
    }
    
    removeItem(key) {
        delete this.store[key];
    }
    
    clear() {
        this.store = {};
    }
    
    get length() {
        return Object.keys(this.store).length;
    }
    
    key(index) {
        return Object.keys(this.store)[index];
    }
}

// Mock GoogleDriveSync class
class MockGoogleDriveSync {
    constructor(app) {
        this.app = app;
        this.isSignedIn = false;
        this.accessToken = null;
        this.uploadCalls = [];
        this.downloadCalls = [];
        this.remoteData = null;
        this.uploadDelay = 0;
        this.uploadShouldFail = false;
        this.failureMessage = 'Mock upload failed';
        
        // Mock sync queue
        this.syncQueue = {
            queue: [],
            enqueue: (operation) => {
                this.syncQueue.queue.push(operation);
                return `mock-${Date.now()}`;
            },
            clearQueue: () => {
                this.syncQueue.queue = [];
            },
            getStatus: () => ({
                queueLength: this.syncQueue.queue.length,
                isOnline: true,
                processing: false,
                items: this.syncQueue.queue
            })
        };
    }
    
    async signIn() {
        this.isSignedIn = true;
        this.accessToken = 'mock-token-' + Date.now();
        return Promise.resolve();
    }
    
    async signOut() {
        this.isSignedIn = false;
        this.accessToken = null;
        return Promise.resolve();
    }
    
    async uploadData(silent = false) {
        this.uploadCalls.push({ silent, timestamp: Date.now() });
        
        if (this.uploadShouldFail) {
            throw new Error(this.failureMessage);
        }
        
        if (this.uploadDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.uploadDelay));
        }
        
        return Promise.resolve();
    }
    
    async downloadData() {
        this.downloadCalls.push({ timestamp: Date.now() });
        
        if (this.remoteData) {
            this.app.appState.importData(this.remoteData, false);
        }
        
        return Promise.resolve();
    }
    
    setRemoteData(data) {
        this.remoteData = data;
    }
    
    getUploadCallCount() {
        return this.uploadCalls.length;
    }
    
    getLastUploadCall() {
        return this.uploadCalls[this.uploadCalls.length - 1];
    }
    
    reset() {
        this.uploadCalls = [];
        this.downloadCalls = [];
        this.remoteData = null;
        this.uploadDelay = 0;
        this.uploadShouldFail = false;
        this.syncQueue.clearQueue();
    }
}

// Mock network conditions
class NetworkMock {
    constructor() {
        this._online = true;
        this.listeners = {
            online: [],
            offline: []
        };
        
        // Override navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            get: () => this._online,
            configurable: true
        });
    }
    
    goOffline() {
        this._online = false;
        this.triggerEvent('offline');
    }
    
    goOnline() {
        this._online = true;
        this.triggerEvent('online');
    }
    
    addEventListener(event, handler) {
        if (this.listeners[event]) {
            this.listeners[event].push(handler);
        }
    }
    
    removeEventListener(event, handler) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(handler);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }
    
    triggerEvent(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(handler => handler());
        }
        
        // Also trigger window events
        window.dispatchEvent(new Event(event));
    }
    
    reset() {
        this._online = true;
        this.listeners.online = [];
        this.listeners.offline = [];
    }
}

// Test data generators
class TestDataGenerator {
    static generateUser(id, options = {}) {
        return {
            name: options.name || `Test User ${id}`,
            icon: options.icon || '👤',
            activities: options.activities || [],
            tomorrowActivities: options.tomorrowActivities || []
        };
    }
    
    static generateActivity(id, options = {}) {
        return {
            id: options.id || `activity-${id}`,
            title: options.title || `Test Activity ${id}`,
            description: options.description || `Description for activity ${id}`,
            icon: options.icon || '📝',
            completed: options.completed !== undefined ? options.completed : false,
            cardType: options.cardType || 'recurring',
            time: options.time || '',
            userId: options.userId || null,
            timestamp: options.timestamp || Date.now()
        };
    }
    
    static generateUsers(count, activitiesPerUser = 5) {
        const users = {};
        for (let i = 1; i <= count; i++) {
            const userId = `user-${i}`;
            const activities = [];
            
            for (let j = 1; j <= activitiesPerUser; j++) {
                activities.push(this.generateActivity(`${i}-${j}`, {
                    title: `Activity ${j} for User ${i}`,
                    userId: userId
                }));
            }
            
            users[userId] = this.generateUser(i, { activities });
        }
        return users;
    }
    
    static generateAppState(options = {}) {
        const users = options.users || this.generateUsers(1, 3);
        const currentUserId = options.currentUserId || Object.keys(users)[0];
        
        return {
            version: options.version || "1.0.0",
            syncMetadata: {
                version: options.syncVersion || 1,
                lastModified: options.lastModified || new Date().toISOString(),
                deviceId: options.deviceId || 'test-device-' + Date.now(),
                deviceName: options.deviceName || 'Test Device'
            },
            users: {
                profiles: users,
                currentUser: currentUserId
            },
            syncSettings: {
                lastSync: options.lastSync || null,
                autoSync: options.autoSync !== undefined ? options.autoSync : true
            }
        };
    }
    
    static generateLargeDataset(userCount = 10, activitiesPerUser = 100) {
        const state = this.generateAppState({
            users: this.generateUsers(userCount, activitiesPerUser)
        });
        
        // Add some variety to the data
        Object.values(state.users.profiles).forEach((user, userIndex) => {
            user.activities.forEach((activity, actIndex) => {
                // Randomly complete some activities
                activity.completed = Math.random() > 0.5;
                
                // Add different card types
                const cardTypes = ['recurring', 'one-time', 'milestone'];
                activity.cardType = cardTypes[actIndex % cardTypes.length];
                
                // Add times to some activities
                if (actIndex % 3 === 0) {
                    activity.time = `${9 + (actIndex % 12)}:00 AM`;
                }
                
                // Add longer descriptions to some
                if (actIndex % 5 === 0) {
                    activity.description = `This is a much longer description for activity ${actIndex + 1}. ` +
                        `It contains multiple sentences to simulate real-world data. ` +
                        `The activity belongs to ${user.name} and has various properties set.`;
                }
            });
        });
        
        return state;
    }
}

// Sync operation factories
class SyncOperationFactory {
    static createUploadOperation(data = null, silent = false) {
        return {
            type: 'upload',
            data: {
                silent: silent,
                appState: data || TestDataGenerator.generateAppState()
            }
        };
    }
    
    static createActivityUpdateOperation(userId, activityId, updates) {
        return {
            type: 'update-activity',
            data: {
                userId: userId,
                activityId: activityId,
                updates: updates,
                timestamp: Date.now()
            }
        };
    }
    
    static createActivityDeleteOperation(userId, activityId) {
        return {
            type: 'delete-activity',
            data: {
                userId: userId,
                activityId: activityId,
                timestamp: Date.now()
            }
        };
    }
    
    static createActivityMoveOperation(userId, activityId, fromIndex, toIndex) {
        return {
            type: 'move-activity',
            data: {
                userId: userId,
                activityId: activityId,
                fromIndex: fromIndex,
                toIndex: toIndex,
                timestamp: Date.now()
            }
        };
    }
    
    static createUserSwitchOperation(newUserId) {
        return {
            type: 'switch-user',
            data: {
                userId: newUserId,
                timestamp: Date.now()
            }
        };
    }
    
    static createBatchUpdateOperation(userId, activityIds, updates) {
        return {
            type: 'batch-update',
            data: {
                userId: userId,
                activityIds: activityIds,
                updates: updates,
                timestamp: Date.now()
            }
        };
    }
}

// Performance measurement utilities
class PerformanceTracker {
    constructor() {
        this.measurements = {};
    }
    
    start(name) {
        this.measurements[name] = {
            start: performance.now(),
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize
            } : null
        };
    }
    
    end(name) {
        if (!this.measurements[name]) {
            console.warn(`No start measurement found for ${name}`);
            return null;
        }
        
        const start = this.measurements[name];
        const end = performance.now();
        const duration = end - start.start;
        
        const result = {
            name: name,
            duration: duration,
            durationMs: duration.toFixed(2),
            durationSec: (duration / 1000).toFixed(3)
        };
        
        if (performance.memory && start.memory) {
            const memoryDelta = performance.memory.usedJSHeapSize - start.memory.usedJSHeapSize;
            result.memoryDelta = memoryDelta;
            result.memoryDeltaMB = (memoryDelta / 1024 / 1024).toFixed(2);
        }
        
        delete this.measurements[name];
        return result;
    }
    
    measure(name, fn) {
        this.start(name);
        const result = fn();
        const measurement = this.end(name);
        
        if (result instanceof Promise) {
            return result.then(value => {
                return { value, measurement };
            });
        }
        
        return { value: result, measurement };
    }
    
    async measureAsync(name, asyncFn) {
        this.start(name);
        try {
            const result = await asyncFn();
            const measurement = this.end(name);
            return { value: result, measurement };
        } catch (error) {
            this.end(name);
            throw error;
        }
    }
    
    reset() {
        this.measurements = {};
    }
}

// Test assertion helpers
class SyncTestHelpers {
    static async waitFor(condition, timeout = 5000, interval = 100) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    
    static async waitForQueueLength(syncQueue, expectedLength, timeout = 5000) {
        return this.waitFor(
            () => syncQueue.queue.length === expectedLength,
            timeout
        );
    }
    
    static async waitForProcessingComplete(syncQueue, timeout = 5000) {
        return this.waitFor(
            () => !syncQueue.processing && syncQueue.queue.length === 0,
            timeout
        );
    }
    
    static assertQueueOperation(operation, expectedType, expectedData = {}) {
        if (operation.type !== expectedType) {
            throw new Error(`Expected operation type ${expectedType}, got ${operation.type}`);
        }
        
        for (const [key, value] of Object.entries(expectedData)) {
            if (operation.data[key] !== value) {
                throw new Error(`Expected ${key} to be ${value}, got ${operation.data[key]}`);
            }
        }
    }
    
    static assertDataEqual(actual, expected, path = '') {
        if (typeof actual !== typeof expected) {
            throw new Error(`Type mismatch at ${path}: ${typeof actual} !== ${typeof expected}`);
        }
        
        if (actual === null || expected === null) {
            if (actual !== expected) {
                throw new Error(`Value mismatch at ${path}: ${actual} !== ${expected}`);
            }
            return;
        }
        
        if (typeof actual === 'object') {
            const actualKeys = Object.keys(actual).sort();
            const expectedKeys = Object.keys(expected).sort();
            
            if (actualKeys.length !== expectedKeys.length) {
                throw new Error(`Key count mismatch at ${path}: ${actualKeys.length} !== ${expectedKeys.length}`);
            }
            
            for (let i = 0; i < actualKeys.length; i++) {
                if (actualKeys[i] !== expectedKeys[i]) {
                    throw new Error(`Key mismatch at ${path}: ${actualKeys[i]} !== ${expectedKeys[i]}`);
                }
                
                const key = actualKeys[i];
                this.assertDataEqual(actual[key], expected[key], path + '.' + key);
            }
        } else if (actual !== expected) {
            throw new Error(`Value mismatch at ${path}: ${actual} !== ${expected}`);
        }
    }
}

// Export all utilities
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MockLocalStorage,
        MockGoogleDriveSync,
        NetworkMock,
        TestDataGenerator,
        SyncOperationFactory,
        PerformanceTracker,
        SyncTestHelpers
    };
}

// Make available globally for browser testing
if (typeof window !== 'undefined') {
    window.SyncTestUtils = {
        MockLocalStorage,
        MockGoogleDriveSync,
        NetworkMock,
        TestDataGenerator,
        SyncOperationFactory,
        PerformanceTracker,
        SyncTestHelpers
    };
}