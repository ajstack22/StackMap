// SQLite Storage Test Suite
(function() {
    'use strict';
    
    const SQLiteStorageTests = {
        testResults: [],
        currentTest: null,
        
        // Run all tests
        async runAll() {
            console.log('🧪 Starting SQLite Storage Tests...');
            this.testResults = [];
            
            // Test groups
            await this.runBasicTests();
            await this.runUserTests();
            await this.runTaskTests();
            await this.runMigrationTests();
            await this.runErrorHandlingTests();
            await this.runPerformanceTests();
            
            // Report results
            this.reportResults();
        },
        
        // Basic functionality tests
        async runBasicTests() {
            console.log('\n📋 Basic Tests');
            
            await this.test('Storage adapter initialization', async () => {
                const adapter = window.StorageAdapter;
                await adapter.init();
                
                this.assert(adapter.isReady, 'Adapter should be ready');
                this.assert(adapter.strategy, 'Strategy should be set');
                console.log('Strategy:', adapter.strategy);
            });
            
            await this.test('Platform detection', async () => {
                const platform = window.Platform;
                this.assert(platform, 'Platform should be available');
                console.log('Platform:', {
                    isNative: platform.isNative,
                    isWeb: platform.isWeb,
                    isAndroid: platform.isAndroid,
                    isiOS: platform.isiOS
                });
            });
        },
        
        // User CRUD tests
        async runUserTests() {
            console.log('\n👤 User Tests');
            
            const testUser = {
                id: 'test_user_' + Date.now(),
                name: 'Test User',
                icon: '🧪',
                settings: {
                    backgroundColor: '#667eea',
                    showNumbers: true
                }
            };
            
            await this.test('Create user', async () => {
                const adapter = window.StorageAdapter;
                const result = await adapter.saveUser(testUser);
                
                this.assert(result, 'User should be created');
                this.assert(result.id === testUser.id, 'User ID should match');
            });
            
            await this.test('Get user', async () => {
                const adapter = window.StorageAdapter;
                const user = await adapter.getUser(testUser.id);
                
                this.assert(user, 'User should be retrieved');
                this.assert(user.name === testUser.name, 'User name should match');
                this.assert(user.icon === testUser.icon, 'User icon should match');
            });
            
            await this.test('Get all users', async () => {
                const adapter = window.StorageAdapter;
                const users = await adapter.getAllUsers();
                
                this.assert(Array.isArray(users), 'Should return array');
                this.assert(users.length > 0, 'Should have at least one user');
                
                const foundUser = users.find(u => u.id === testUser.id);
                this.assert(foundUser, 'Test user should be in list');
            });
        },
        
        // Task CRUD tests
        async runTaskTests() {
            console.log('\n✅ Task Tests');
            
            const testTask = {
                id: 'test_task_' + Date.now(),
                user_id: 'test_user_' + Date.now(),
                title: 'Test Task',
                description: 'This is a test task',
                icon: '🎯',
                completed: false,
                card_type: 'recurring',
                day_type: 'today',
                task_order: 0
            };
            
            await this.test('Create task', async () => {
                const adapter = window.StorageAdapter;
                const result = await adapter.saveTask(testTask);
                
                this.assert(result, 'Task should be created');
                this.assert(result.id === testTask.id, 'Task ID should match');
            });
            
            await this.test('Get task', async () => {
                const adapter = window.StorageAdapter;
                const task = await adapter.getTask(testTask.id);
                
                this.assert(task, 'Task should be retrieved');
                this.assert(task.title === testTask.title, 'Task title should match');
                this.assert(task.icon === testTask.icon, 'Task icon should match');
            });
            
            await this.test('Update task', async () => {
                const adapter = window.StorageAdapter;
                const updates = {
                    completed: true,
                    title: 'Updated Test Task'
                };
                
                const result = await adapter.updateTask(testTask.id, updates);
                
                this.assert(result, 'Task should be updated');
                this.assert(result.completed === true, 'Task should be completed');
                this.assert(result.title === updates.title, 'Task title should be updated');
            });
            
            await this.test('Get tasks for user', async () => {
                const adapter = window.StorageAdapter;
                const tasks = await adapter.getTasksForUser(testTask.user_id);
                
                this.assert(Array.isArray(tasks), 'Should return array');
                const foundTask = tasks.find(t => t.id === testTask.id);
                this.assert(foundTask, 'Test task should be in list');
            });
            
            await this.test('Delete task', async () => {
                const adapter = window.StorageAdapter;
                const result = await adapter.deleteTask(testTask.id);
                
                this.assert(result, 'Task should be deleted');
                
                const deletedTask = await adapter.getTask(testTask.id);
                this.assert(!deletedTask, 'Task should not exist after deletion');
            });
        },
        
        // Migration tests
        async runMigrationTests() {
            console.log('\n🔄 Migration Tests');
            
            await this.test('Create migration backup', async () => {
                const adapter = window.StorageAdapter;
                if (adapter.migrationManager) {
                    const backup = await adapter.migrationManager.createBackup();
                    
                    this.assert(backup, 'Backup should be created');
                    this.assert(backup.id, 'Backup should have ID');
                    this.assert(backup.data, 'Backup should have data');
                }
            });
            
            await this.test('List backups', async () => {
                const adapter = window.StorageAdapter;
                if (adapter.migrationManager) {
                    const backups = adapter.migrationManager.listBackups();
                    
                    this.assert(Array.isArray(backups), 'Should return array');
                    console.log('Found', backups.length, 'backups');
                }
            });
            
            await this.test('Validate data structure', async () => {
                const adapter = window.StorageAdapter;
                if (adapter.migrationManager) {
                    const testData = {
                        users: [{
                            id: 'test',
                            name: 'Test User'
                        }],
                        tasks: [{
                            id: 'test_task',
                            user_id: 'test',
                            title: 'Test Task'
                        }]
                    };
                    
                    const isValid = adapter.migrationManager.validateData(testData);
                    this.assert(isValid, 'Valid data should pass validation');
                    
                    const invalidData = { users: null, tasks: [] };
                    const isInvalid = adapter.migrationManager.validateData(invalidData);
                    this.assert(!isInvalid, 'Invalid data should fail validation');
                }
            });
        },
        
        // Error handling tests
        async runErrorHandlingTests() {
            console.log('\n⚠️ Error Handling Tests');
            
            await this.test('Handle invalid user data', async () => {
                const adapter = window.StorageAdapter;
                let errorCaught = false;
                
                try {
                    await adapter.saveUser({ id: null }); // Invalid user
                } catch (error) {
                    errorCaught = true;
                }
                
                this.assert(errorCaught || adapter.strategy === 'localStorage', 
                    'Should handle invalid user data');
            });
            
            await this.test('Handle invalid task data', async () => {
                const adapter = window.StorageAdapter;
                let errorCaught = false;
                
                try {
                    await adapter.saveTask({ user_id: null }); // Invalid task
                } catch (error) {
                    errorCaught = true;
                }
                
                this.assert(errorCaught || adapter.strategy === 'localStorage', 
                    'Should handle invalid task data');
            });
            
            await this.test('Error handler messages', async () => {
                if (window.StorageErrorHandler) {
                    const handler = window.StorageErrorHandler;
                    
                    // Test error type identification
                    const dbLocked = new Error('database is locked');
                    const errorType = handler.identifyErrorType(dbLocked);
                    this.assert(errorType === handler.ErrorTypes.DB_LOCKED, 
                        'Should identify DB_LOCKED error');
                    
                    // Test user message
                    const message = handler.messages[errorType];
                    this.assert(message, 'Should have user-friendly message');
                    console.log('User message:', message);
                }
            });
        },
        
        // Performance tests
        async runPerformanceTests() {
            console.log('\n⚡ Performance Tests');
            
            await this.test('Bulk task creation', async () => {
                const adapter = window.StorageAdapter;
                const userId = 'perf_test_user_' + Date.now();
                
                const startTime = performance.now();
                const taskCount = 100;
                
                for (let i = 0; i < taskCount; i++) {
                    await adapter.saveTask({
                        id: `perf_task_${i}_${Date.now()}`,
                        user_id: userId,
                        title: `Performance Test Task ${i}`,
                        task_order: i
                    });
                }
                
                const endTime = performance.now();
                const totalTime = endTime - startTime;
                const avgTime = totalTime / taskCount;
                
                console.log(`Created ${taskCount} tasks in ${totalTime.toFixed(2)}ms`);
                console.log(`Average: ${avgTime.toFixed(2)}ms per task`);
                
                this.assert(avgTime < 50, 'Average task creation should be under 50ms');
            });
            
            await this.test('Task list retrieval', async () => {
                const adapter = window.StorageAdapter;
                const userId = 'perf_test_user_' + Date.now();
                
                // Create some tasks first
                for (let i = 0; i < 50; i++) {
                    await adapter.saveTask({
                        id: `perf_list_task_${i}_${Date.now()}`,
                        user_id: userId,
                        title: `List Test Task ${i}`,
                        task_order: i
                    });
                }
                
                const startTime = performance.now();
                const tasks = await adapter.getTasksForUser(userId);
                const endTime = performance.now();
                
                const loadTime = endTime - startTime;
                console.log(`Loaded ${tasks.length} tasks in ${loadTime.toFixed(2)}ms`);
                
                this.assert(loadTime < 100, 'Task list load should be under 100ms');
            });
        },
        
        // Test utilities
        async test(name, testFn) {
            this.currentTest = { name, passed: false, error: null };
            
            try {
                await testFn();
                this.currentTest.passed = true;
                console.log('✅', name);
            } catch (error) {
                this.currentTest.error = error;
                console.error('❌', name, '-', error.message);
            }
            
            this.testResults.push(this.currentTest);
        },
        
        assert(condition, message) {
            if (!condition) {
                throw new Error(message || 'Assertion failed');
            }
        },
        
        // Report test results
        reportResults() {
            console.log('\n📊 Test Results');
            console.log('================');
            
            const passed = this.testResults.filter(t => t.passed).length;
            const failed = this.testResults.filter(t => !t.passed).length;
            const total = this.testResults.length;
            
            console.log(`Total: ${total}`);
            console.log(`Passed: ${passed} (${((passed/total)*100).toFixed(1)}%)`);
            console.log(`Failed: ${failed}`);
            
            if (failed > 0) {
                console.log('\nFailed tests:');
                this.testResults
                    .filter(t => !t.passed)
                    .forEach(t => {
                        console.log(`- ${t.name}: ${t.error.message}`);
                    });
            }
            
            // Store results globally for inspection
            window._sqliteTestResults = this.testResults;
            
            return {
                total,
                passed,
                failed,
                results: this.testResults
            };
        }
    };
    
    // Expose globally
    window.SQLiteStorageTests = SQLiteStorageTests;
    
})();