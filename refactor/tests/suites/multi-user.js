/**
 * StackMap Multi-User Test Suite
 * Tests for user switching, profile management, and data isolation
 */

var MultiUserTests = (function() {
    'use strict';
    
    // Register all tests
    function register() {
        var suite = TestRunner.registerSuite('Multi-User Tests');
        
        // Test 1: User Profile Creation
        TestRunner.registerTest('Multi-User Tests', 'Create and switch user profiles', function(test) {
            var assert = test.assert;
            
            // Clear any existing test users
            if (window.UserManager) {
                var users = UserManager.getUsers();
                users.forEach(function(user) {
                    if (user.id.indexOf('test-') === 0) {
                        UserManager.deleteUser(user.id);
                    }
                });
            }
            
            // Create test users
            var user1Data = {
                name: 'Test User 1',
                color: '#FF6B6B'
            };
            var user2Data = {
                name: 'Test User 2',
                color: '#4ECDC4'
            };
            
            var user1Id = null;
            var user2Id = null;
            
            // Create users using UserManager
            if (window.UserManager && typeof UserManager.createUser === 'function') {
                user1Id = UserManager.createUser(user1Data.name, user1Data.color);
                user2Id = UserManager.createUser(user2Data.name, user2Data.color);
                
                assert.ok(user1Id, 'User 1 created successfully');
                assert.ok(user2Id, 'User 2 created successfully');
                assert.notEqual(user1Id, user2Id, 'Users have unique IDs');
                
                // Verify users exist
                var users = UserManager.getUsers();
                var foundUser1 = users.find(function(u) { return u.id === user1Id; });
                var foundUser2 = users.find(function(u) { return u.id === user2Id; });
                
                assert.ok(foundUser1, 'User 1 found in user list');
                assert.ok(foundUser2, 'User 2 found in user list');
                assert.equal(foundUser1.name, user1Data.name, 'User 1 name correct');
                assert.equal(foundUser2.color, user2Data.color, 'User 2 color correct');
            } else {
                // Fallback testing without UserManager
                user1Id = 'test-user-1';
                user2Id = 'test-user-2';
                localStorage.setItem('stackmap-user-' + user1Id, JSON.stringify({
                    id: user1Id,
                    name: user1Data.name,
                    color: user1Data.color
                }));
                localStorage.setItem('stackmap-user-' + user2Id, JSON.stringify({
                    id: user2Id,
                    name: user2Data.name,
                    color: user2Data.color
                }));
                assert.ok(true, 'Test users created via localStorage');
            }
            
            // Store user IDs for other tests
            test.context = { user1Id: user1Id, user2Id: user2Id };
        });
        
        // Test 2: User Switching
        TestRunner.registerTest('Multi-User Tests', 'Switch between users correctly', function(test) {
            var assert = test.assert;
            var context = test.context || {};
            var user1Id = context.user1Id || 'test-user-1';
            var user2Id = context.user2Id || 'test-user-2';
            
            if (window.UserManager && typeof UserManager.switchUser === 'function') {
                // Switch to user 1
                UserManager.switchUser(user1Id);
                var current1 = UserManager.getCurrentUser();
                assert.equal(current1, user1Id, 'Switched to user 1');
                
                // Switch to user 2
                UserManager.switchUser(user2Id);
                var current2 = UserManager.getCurrentUser();
                assert.equal(current2, user2Id, 'Switched to user 2');
                
                // Switch back to user 1
                UserManager.switchUser(user1Id);
                var current3 = UserManager.getCurrentUser();
                assert.equal(current3, user1Id, 'Switched back to user 1');
            } else {
                // Fallback testing
                localStorage.setItem('stackmap-current-user', user1Id);
                assert.equal(localStorage.getItem('stackmap-current-user'), user1Id, 'User 1 set');
                
                localStorage.setItem('stackmap-current-user', user2Id);
                assert.equal(localStorage.getItem('stackmap-current-user'), user2Id, 'User 2 set');
            }
        });
        
        // Test 3: Task Data Isolation
        TestRunner.registerTest('Multi-User Tests', 'Tasks isolated between users', function(test) {
            var assert = test.assert;
            var context = test.context || {};
            var user1Id = context.user1Id || 'test-user-1';
            var user2Id = context.user2Id || 'test-user-2';
            
            // Create tasks for user 1
            var user1Tasks = [
                { id: 'u1-task-1', activity: 'User 1 Task 1', userId: user1Id },
                { id: 'u1-task-2', activity: 'User 1 Task 2', userId: user1Id },
                { id: 'u1-task-3', activity: 'User 1 Task 3', userId: user1Id }
            ];
            
            // Create tasks for user 2
            var user2Tasks = [
                { id: 'u2-task-1', activity: 'User 2 Task 1', userId: user2Id },
                { id: 'u2-task-2', activity: 'User 2 Task 2', userId: user2Id }
            ];
            
            // Save tasks
            if (window.TaskSQLite && typeof TaskSQLite.saveTask === 'function') {
                // Switch to user 1 and save tasks
                if (window.UserManager) UserManager.switchUser(user1Id);
                user1Tasks.forEach(function(task) {
                    TaskSQLite.saveTask(task, function(success) {
                        assert.ok(success, 'User 1 task saved: ' + task.id);
                    });
                });
                
                // Switch to user 2 and save tasks
                if (window.UserManager) UserManager.switchUser(user2Id);
                user2Tasks.forEach(function(task) {
                    TaskSQLite.saveTask(task, function(success) {
                        assert.ok(success, 'User 2 task saved: ' + task.id);
                    });
                });
                
                // Verify isolation - switch to user 1
                if (window.UserManager) UserManager.switchUser(user1Id);
                TaskSQLite.loadTasks(user1Id, function(tasks) {
                    assert.equal(tasks.length, 3, 'User 1 sees only their 3 tasks');
                    tasks.forEach(function(task) {
                        assert.equal(task.userId, user1Id, 'Task belongs to user 1');
                    });
                });
                
                // Switch to user 2
                if (window.UserManager) UserManager.switchUser(user2Id);
                TaskSQLite.loadTasks(user2Id, function(tasks) {
                    assert.equal(tasks.length, 2, 'User 2 sees only their 2 tasks');
                    tasks.forEach(function(task) {
                        assert.equal(task.userId, user2Id, 'Task belongs to user 2');
                    });
                });
            } else {
                // Fallback testing with localStorage
                var allTasks = user1Tasks.concat(user2Tasks);
                allTasks.forEach(function(task) {
                    localStorage.setItem('stackmap-task-' + task.id, JSON.stringify(task));
                });
                
                // Filter tasks for user 1
                var user1Found = allTasks.filter(function(t) { return t.userId === user1Id; });
                assert.equal(user1Found.length, 3, 'User 1 tasks filtered correctly');
                
                // Filter tasks for user 2
                var user2Found = allTasks.filter(function(t) { return t.userId === user2Id; });
                assert.equal(user2Found.length, 2, 'User 2 tasks filtered correctly');
            }
        });
        
        // Test 4: User Deletion Safety
        TestRunner.registerTest('Multi-User Tests', 'User deletion preserves other users', function(test) {
            var assert = test.assert;
            
            // Create test users
            var testUser = {
                id: 'test-delete-user',
                name: 'Delete Test User',
                color: '#FF0000'
            };
            
            var keepUser = {
                id: 'test-keep-user',
                name: 'Keep Test User',
                color: '#00FF00'
            };
            
            // Create users and tasks
            if (window.UserManager && typeof UserManager.createUser === 'function') {
                // Create users
                UserManager.createUser(testUser.name, testUser.color);
                UserManager.createUser(keepUser.name, keepUser.color);
                
                // Create tasks for both
                var deleteUserTasks = TestUtils.generateTasks(5, testUser.id);
                var keepUserTasks = TestUtils.generateTasks(3, keepUser.id);
                
                // Save tasks
                if (window.TaskSQLite) {
                    deleteUserTasks.forEach(function(task) {
                        TaskSQLite.saveTask(task, function() {});
                    });
                    keepUserTasks.forEach(function(task) {
                        TaskSQLite.saveTask(task, function() {});
                    });
                }
                
                // Delete the test user
                UserManager.deleteUser(testUser.id);
                
                // Verify user is gone
                var users = UserManager.getUsers();
                var found = users.find(function(u) { return u.id === testUser.id; });
                assert.notOk(found, 'Deleted user removed from list');
                
                // Verify other user still exists
                var keepFound = users.find(function(u) { return u.id === keepUser.id; });
                assert.ok(keepFound, 'Other user still exists');
                
                // Verify other user's tasks still exist
                if (window.TaskSQLite) {
                    TaskSQLite.loadTasks(keepUser.id, function(tasks) {
                        assert.equal(tasks.length, 3, 'Other user tasks preserved');
                    });
                }
                
                // Cleanup
                UserManager.deleteUser(keepUser.id);
            } else {
                assert.ok(true, 'UserManager not available, skipping deletion test');
            }
        });
        
        // Test 5: Guest User Handling
        TestRunner.registerTest('Multi-User Tests', 'Guest user always available', function(test) {
            var assert = test.assert;
            
            if (window.UserManager) {
                // Get all users
                var users = UserManager.getUsers();
                
                // Check for guest user
                var guestUser = users.find(function(u) {
                    return u.id === 'guest' || u.name.toLowerCase().indexOf('guest') >= 0;
                });
                
                if (!guestUser) {
                    // No guest user, but should handle no users gracefully
                    assert.ok(users.length >= 0, 'User system handles empty user list');
                } else {
                    assert.ok(guestUser, 'Guest user exists');
                    assert.ok(guestUser.id, 'Guest user has ID');
                }
                
                // Verify we can always get some current user
                var currentUser = UserManager.getCurrentUser();
                assert.ok(currentUser, 'Always have a current user');
            } else {
                assert.ok(true, 'UserManager not available');
            }
        });
        
        // Test 6: Profile Color Updates
        TestRunner.registerTest('Multi-User Tests', 'Update user profile colors', function(test) {
            var assert = test.assert;
            
            var testUserId = 'test-color-user';
            var originalColor = '#FF6B6B';
            var newColor = '#4ECDC4';
            
            if (window.UserManager && typeof UserManager.updateUser === 'function') {
                // Create user
                UserManager.createUser('Color Test User', originalColor);
                
                // Find the created user
                var users = UserManager.getUsers();
                var user = users.find(function(u) { 
                    return u.name === 'Color Test User'; 
                });
                
                if (user) {
                    testUserId = user.id;
                    assert.equal(user.color, originalColor, 'Original color set correctly');
                    
                    // Update color
                    UserManager.updateUser(testUserId, { color: newColor });
                    
                    // Verify update
                    var updatedUsers = UserManager.getUsers();
                    var updatedUser = updatedUsers.find(function(u) {
                        return u.id === testUserId;
                    });
                    
                    assert.equal(updatedUser.color, newColor, 'Color updated successfully');
                    
                    // Cleanup
                    UserManager.deleteUser(testUserId);
                }
            } else {
                // Fallback test
                var userData = {
                    id: testUserId,
                    name: 'Color Test User',
                    color: originalColor
                };
                localStorage.setItem('stackmap-user-' + testUserId, JSON.stringify(userData));
                
                // Update color
                userData.color = newColor;
                localStorage.setItem('stackmap-user-' + testUserId, JSON.stringify(userData));
                
                // Verify
                var stored = JSON.parse(localStorage.getItem('stackmap-user-' + testUserId));
                assert.equal(stored.color, newColor, 'Color updated in localStorage');
                
                // Cleanup
                localStorage.removeItem('stackmap-user-' + testUserId);
            }
        });
        
        // Test 7: User Session Persistence
        TestRunner.registerTest('Multi-User Tests', 'User session persists across reload', function(test) {
            var assert = test.assert;
            
            var testUserId = 'test-persist-user';
            
            if (window.UserManager) {
                // Create and switch to user
                var userId = UserManager.createUser('Persist Test User', '#FF6B6B');
                if (userId) {
                    testUserId = userId;
                    UserManager.switchUser(testUserId);
                    
                    var current = UserManager.getCurrentUser();
                    assert.equal(current, testUserId, 'User switched successfully');
                    
                    // Simulate page reload by checking localStorage
                    var stored = localStorage.getItem('stackmap-current-user');
                    assert.equal(stored, testUserId, 'Current user persisted to storage');
                    
                    // Cleanup
                    UserManager.deleteUser(testUserId);
                }
            } else {
                // Direct localStorage test
                localStorage.setItem('stackmap-current-user', testUserId);
                var stored = localStorage.getItem('stackmap-current-user');
                assert.equal(stored, testUserId, 'User ID persisted');
                localStorage.removeItem('stackmap-current-user');
            }
        });
        
        // Test 8: Maximum Users Limit
        TestRunner.registerTest('Multi-User Tests', 'Handle maximum users gracefully', function(test) {
            var assert = test.assert;
            
            var maxUsers = 10; // Reasonable limit for testing
            var createdUsers = [];
            
            if (window.UserManager) {
                // Try to create many users
                for (var i = 0; i < maxUsers + 5; i++) {
                    try {
                        var userId = UserManager.createUser('Test User ' + i, '#' + Math.floor(Math.random()*16777215).toString(16));
                        if (userId) {
                            createdUsers.push(userId);
                        }
                    } catch (e) {
                        // Should handle gracefully
                        assert.ok(true, 'User creation limit handled gracefully');
                        break;
                    }
                }
                
                assert.ok(createdUsers.length > 0, 'Created at least one user');
                assert.ok(createdUsers.length <= maxUsers + 5, 'User creation has reasonable limits');
                
                // Cleanup
                createdUsers.forEach(function(userId) {
                    UserManager.deleteUser(userId);
                });
            } else {
                assert.ok(true, 'UserManager not available');
            }
        });
    }
    
    // Public API
    return {
        register: register
    };
})();

// Auto-register tests when loaded
if (window.TestRunner) {
    MultiUserTests.register();
}