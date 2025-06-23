/**
 * StackMap Integration Test Suite
 * Tests how features work together and complete user journeys
 * Critical for ensuring real-world usage scenarios work correctly
 */

var IntegrationTests = (function() {
    'use strict';
    
    // Mock modules until real ones are integrated
    var MockEditMode = {
        enabled: false,
        timeout: null,
        
        enable: function() {
            this.enabled = true;
            document.body.classList.add('edit-mode');
            return true;
        },
        
        disable: function() {
            this.enabled = false;
            document.body.classList.remove('edit-mode');
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            return true;
        },
        
        isEnabled: function() {
            return this.enabled;
        }
    };
    
    var MockUserManager = {
        currentUser: null,
        users: [],
        
        createUser: function(userData) {
            var user = Object.assign({
                id: 'user-' + Date.now(),
                created: new Date().toISOString()
            }, userData);
            this.users.push(user);
            return user;
        },
        
        switchUser: function(userId) {
            var user = this.users.find(function(u) { return u.id === userId; });
            if (user) {
                this.currentUser = user;
                // Should disable edit mode on switch
                if (MockEditMode.isEnabled()) {
                    MockEditMode.disable();
                }
            }
            return user;
        },
        
        getCurrentUser: function() {
            return this.currentUser;
        }
    };
    
    var MockSafeMode = {
        enabled: false,
        
        enable: function() {
            this.enabled = true;
            document.body.classList.add('safe-mode');
            // Apply safe mode changes
            var elements = document.querySelectorAll('button, a, .touchable');
            elements.forEach(function(el) {
                el.style.minHeight = '60px';
                el.style.minWidth = '60px';
            });
            return true;
        },
        
        disable: function() {
            this.enabled = false;
            document.body.classList.remove('safe-mode');
            return true;
        },
        
        isEnabled: function() {
            return this.enabled;
        }
    };
    
    var MockTaskSQLite = {
        tasks: [],
        
        createTask: function(task) {
            task.id = 'task-' + Date.now() + '-' + Math.random();
            task.created = Date.now();
            this.tasks.push(task);
            return Promise.resolve(task);
        },
        
        getUserTasks: function(userId) {
            return Promise.resolve(this.tasks.filter(function(t) { 
                return t.userId === userId; 
            }));
        },
        
        updateTask: function(id, updates) {
            var task = this.tasks.find(function(t) { return t.id === id; });
            if (task) {
                Object.assign(task, updates);
                task.updated = Date.now();
            }
            return Promise.resolve(task);
        },
        
        deleteTask: function(id) {
            this.tasks = this.tasks.filter(function(t) { return t.id !== id; });
            return Promise.resolve(true);
        }
    };
    
    var MockActivityLibrary = {
        activities: [
            { id: 'brush-teeth', name: 'Brush teeth', icon: 'tooth', color: 'blue' },
            { id: 'breakfast', name: 'Make breakfast', icon: 'food', color: 'green' },
            { id: 'medication', name: 'Take medication', icon: 'pill', color: 'red' },
            { id: 'exercise', name: 'Exercise', icon: 'run', color: 'orange' }
        ],
        
        getActivity: function(id) {
            return this.activities.find(function(a) { return a.id === id; });
        },
        
        getAllActivities: function() {
            return this.activities;
        }
    };
    
    // Get modules with fallback to mocks
    var EditMode = TestUtils.getModule('EditMode', MockEditMode);
    var UserManager = TestUtils.getModule('UserManager', MockUserManager);
    var SafeMode = TestUtils.getModule('SafeMode', MockSafeMode);
    var TaskSQLite = TestUtils.getModule('TaskSQLite', MockTaskSQLite);
    var ActivityLibrary = TestUtils.getModule('ActivityLibrary', MockActivityLibrary);
    
    function register() {
        var suite = TestRunner.registerSuite('Integration Tests', function() {
            // Suite setup - clean state
            MockEditMode.disable();
            MockSafeMode.disable();
            MockUserManager.currentUser = null;
            MockUserManager.users = [];
            MockTaskSQLite.tasks = [];
        });
        
        // Feature Interaction Tests
        
        TestRunner.registerTest('Integration Tests', 'Edit mode disabled when switching users', function(done) {
            var assert = this.assert;
            
            // Create two users
            var user1 = UserManager.createUser({ name: 'User 1', color: 'blue' });
            var user2 = UserManager.createUser({ name: 'User 2', color: 'green' });
            
            // Switch to user 1
            UserManager.switchUser(user1.id);
            assert.equal(UserManager.getCurrentUser().id, user1.id, 'User 1 is active');
            
            // Enable edit mode
            EditMode.enable();
            assert.ok(EditMode.isEnabled(), 'Edit mode is enabled');
            
            // Switch to user 2
            UserManager.switchUser(user2.id);
            
            // Verify edit mode was disabled
            assert.notOk(EditMode.isEnabled(), 'Edit mode disabled on user switch');
            assert.equal(UserManager.getCurrentUser().id, user2.id, 'User 2 is now active');
            
            done();
        }, { async: true });
        
        TestRunner.registerTest('Integration Tests', 'Safe mode preserves task operations', function(done) {
            var assert = this.assert;
            
            // Create user and switch to them
            var user = UserManager.createUser({ name: 'Safe User', color: 'purple' });
            UserManager.switchUser(user.id);
            
            // Enable safe mode
            SafeMode.enable();
            assert.ok(SafeMode.isEnabled(), 'Safe mode is enabled');
            
            // Test all CRUD operations work in safe mode
            var taskData = {
                userId: user.id,
                activity: 'Test in safe mode',
                time: '2:00 PM',
                color: 'blue',
                icon: 'star'
            };
            
            TaskSQLite.createTask(taskData).then(function(task) {
                assert.ok(task.id, 'Task created in safe mode');
                
                // Update task
                return TaskSQLite.updateTask(task.id, {
                    activity: 'Updated in safe mode'
                });
            }).then(function(task) {
                assert.equal(task.activity, 'Updated in safe mode', 'Task updated in safe mode');
                
                // Get user tasks
                return TaskSQLite.getUserTasks(user.id);
            }).then(function(tasks) {
                assert.equal(tasks.length, 1, 'Tasks retrieved in safe mode');
                
                // Delete task
                return TaskSQLite.deleteTask(tasks[0].id);
            }).then(function(result) {
                assert.ok(result, 'Task deleted in safe mode');
                
                // Verify safe mode UI changes
                var button = document.createElement('button');
                document.body.appendChild(button);
                SafeMode.enable(); // Re-apply to new element
                
                assert.equal(button.style.minHeight, '60px', 'Touch target increased to 60px');
                
                // Cleanup
                document.body.removeChild(button);
                SafeMode.disable();
                done();
            });
        }, { async: true });
        
        TestRunner.registerTest('Integration Tests', 'Data isolation between users during operations', function(done) {
            var assert = this.assert;
            
            // Create three users
            var user1 = UserManager.createUser({ name: 'Alice', color: 'red' });
            var user2 = UserManager.createUser({ name: 'Bob', color: 'blue' });
            var user3 = UserManager.createUser({ name: 'Charlie', color: 'green' });
            
            // Create tasks for each user
            var promises = [];
            
            // User 1 tasks
            UserManager.switchUser(user1.id);
            promises.push(TaskSQLite.createTask({
                userId: user1.id,
                activity: 'Alice Task 1',
                time: '9:00 AM'
            }));
            promises.push(TaskSQLite.createTask({
                userId: user1.id,
                activity: 'Alice Task 2',
                time: '10:00 AM'
            }));
            
            // User 2 tasks
            UserManager.switchUser(user2.id);
            promises.push(TaskSQLite.createTask({
                userId: user2.id,
                activity: 'Bob Task 1',
                time: '11:00 AM'
            }));
            
            // No tasks for User 3
            
            Promise.all(promises).then(function() {
                // Test isolation
                return TaskSQLite.getUserTasks(user1.id);
            }).then(function(user1Tasks) {
                assert.equal(user1Tasks.length, 2, 'User 1 has 2 tasks');
                assert.ok(user1Tasks.every(function(t) { 
                    return t.activity.indexOf('Alice') !== -1; 
                }), 'User 1 only sees Alice tasks');
                
                return TaskSQLite.getUserTasks(user2.id);
            }).then(function(user2Tasks) {
                assert.equal(user2Tasks.length, 1, 'User 2 has 1 task');
                assert.ok(user2Tasks[0].activity.indexOf('Bob') !== -1, 'User 2 only sees Bob task');
                
                return TaskSQLite.getUserTasks(user3.id);
            }).then(function(user3Tasks) {
                assert.equal(user3Tasks.length, 0, 'User 3 has no tasks');
                
                done();
            });
        }, { async: true });
        
        // Complete User Journey Tests
        
        TestRunner.registerTest('Integration Tests', 'Complete daily routine flow', function(done) {
            var assert = this.assert;
            var context = this;
            
            // Step 1: Create user profile
            var user = UserManager.createUser({
                name: 'Test User',
                color: '#4A5568',
                safeMode: false
            });
            
            UserManager.switchUser(user.id);
            assert.ok(UserManager.getCurrentUser(), 'User created and active');
            
            // Step 2: Add tasks from activity library
            var activities = ActivityLibrary.getAllActivities();
            var taskPromises = activities.slice(0, 3).map(function(activity, index) {
                return TaskSQLite.createTask({
                    userId: user.id,
                    activity: activity.name,
                    time: (9 + index) + ':00 AM',
                    color: activity.color,
                    icon: activity.icon,
                    isRecurring: true
                });
            });
            
            Promise.all(taskPromises).then(function(tasks) {
                assert.equal(tasks.length, 3, 'Created 3 tasks from library');
                
                // Step 3: Complete some tasks
                var completePromises = tasks.slice(0, 2).map(function(task) {
                    return TaskSQLite.updateTask(task.id, {
                        completed: Date.now()
                    });
                });
                
                return Promise.all(completePromises);
            }).then(function(completedTasks) {
                assert.equal(completedTasks.length, 2, 'Completed 2 tasks');
                
                // Step 4: Create second user and switch
                var user2 = UserManager.createUser({
                    name: 'Family Member',
                    color: '#7C3AED'
                });
                
                UserManager.switchUser(user2.id);
                assert.equal(UserManager.getCurrentUser().id, user2.id, 'Switched to user 2');
                
                // Step 5: Verify user 2 sees no tasks
                return TaskSQLite.getUserTasks(user2.id);
            }).then(function(user2Tasks) {
                assert.equal(user2Tasks.length, 0, 'User 2 has no tasks (isolation works)');
                
                // Step 6: Switch back to user 1
                UserManager.switchUser(user.id);
                return TaskSQLite.getUserTasks(user.id);
            }).then(function(user1Tasks) {
                assert.equal(user1Tasks.length, 3, 'User 1 tasks persist');
                
                var completedCount = user1Tasks.filter(function(t) { 
                    return t.completed !== null && t.completed !== undefined; 
                }).length;
                assert.equal(completedCount, 2, 'Completed tasks persist');
                
                context.done();
            }).catch(function(error) {
                context.assert.fail('Journey failed: ' + error.message);
                context.done();
            });
        }, { async: true, timeout: 10000 });
        
        TestRunner.registerTest('Integration Tests', 'Edit mode with safe mode interaction', function(done) {
            var assert = this.assert;
            
            // Enable safe mode first
            SafeMode.enable();
            assert.ok(SafeMode.isEnabled(), 'Safe mode enabled');
            
            // Try to enable edit mode
            EditMode.enable();
            assert.ok(EditMode.isEnabled(), 'Edit mode can be enabled in safe mode');
            
            // Verify both modes active
            assert.ok(document.body.classList.contains('safe-mode'), 'Safe mode class present');
            assert.ok(document.body.classList.contains('edit-mode'), 'Edit mode class present');
            
            // Disable edit mode
            EditMode.disable();
            assert.notOk(EditMode.isEnabled(), 'Edit mode disabled');
            assert.ok(SafeMode.isEnabled(), 'Safe mode still active');
            
            // Cleanup
            SafeMode.disable();
            done();
        }, { async: true });
        
        TestRunner.registerTest('Integration Tests', 'Background/foreground task persistence', function(done) {
            var assert = this.assert;
            
            // Create user and tasks
            var user = UserManager.createUser({ name: 'BG Test User', color: 'teal' });
            UserManager.switchUser(user.id);
            
            var taskIds = [];
            
            // Create initial tasks
            Promise.all([
                TaskSQLite.createTask({
                    userId: user.id,
                    activity: 'Morning routine',
                    time: '8:00 AM'
                }),
                TaskSQLite.createTask({
                    userId: user.id,
                    activity: 'Evening routine',
                    time: '8:00 PM'
                })
            ]).then(function(tasks) {
                taskIds = tasks.map(function(t) { return t.id; });
                
                // Simulate going to background
                window.dispatchEvent(new Event('blur'));
                
                // Make changes while "backgrounded"
                return TaskSQLite.updateTask(taskIds[0], {
                    completed: Date.now()
                });
            }).then(function() {
                // Simulate coming to foreground
                window.dispatchEvent(new Event('focus'));
                
                // Verify data persists
                return TaskSQLite.getUserTasks(user.id);
            }).then(function(tasks) {
                assert.equal(tasks.length, 2, 'All tasks persist');
                
                var completedTask = tasks.find(function(t) { return t.id === taskIds[0]; });
                assert.ok(completedTask.completed, 'Changes made in background persist');
                
                done();
            });
        }, { async: true });
        
        TestRunner.registerTest('Integration Tests', 'Multi-feature stress scenario', function(done) {
            var assert = this.assert;
            
            // Complex scenario: Multiple users, edit mode, safe mode, many tasks
            
            // Create users
            var users = TestUtils.generateUsers(3);
            users.forEach(function(userData) {
                UserManager.createUser(userData);
            });
            
            // Enable safe mode
            SafeMode.enable();
            
            // For each user, create tasks
            var allPromises = [];
            
            users.forEach(function(user, userIndex) {
                UserManager.switchUser(user.id);
                
                // Create 10 tasks per user
                for (var i = 0; i < 10; i++) {
                    allPromises.push(TaskSQLite.createTask({
                        userId: user.id,
                        activity: 'User ' + userIndex + ' Task ' + i,
                        time: (8 + i) + ':00 AM',
                        color: user.color
                    }));
                }
            });
            
            Promise.all(allPromises).then(function(allTasks) {
                assert.equal(allTasks.length, 30, 'Created 30 tasks total');
                
                // Switch between users rapidly
                var switchPromises = [];
                for (var i = 0; i < 10; i++) {
                    var randomUser = users[i % users.length];
                    UserManager.switchUser(randomUser.id);
                    switchPromises.push(TaskSQLite.getUserTasks(randomUser.id));
                }
                
                return Promise.all(switchPromises);
            }).then(function(results) {
                // Each user should only see their 10 tasks
                results.forEach(function(userTasks) {
                    assert.equal(userTasks.length, 10, 'Each user sees only their tasks');
                });
                
                // Verify safe mode still active after all operations
                assert.ok(SafeMode.isEnabled(), 'Safe mode survived stress test');
                
                done();
            });
        }, { async: true, timeout: 15000 });
    }
    
    // Auto-register tests when loaded
    register();
    
    return {
        register: register
    };
})();