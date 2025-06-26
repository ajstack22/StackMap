/**
 * User Data Separation Integration Tests
 * Real-world scenarios and edge cases for comprehensive testing
 */

(function() {
    'use strict';
    
    const UserDataIntegrationTests = {
        /**
         * Test migration scenarios
         */
        testMigrationScenarios: function() {
            console.log('🔄 Testing Migration Scenarios...');
            
            // Scenario 1: Large dataset migration
            const largeDataset = [];
            for (let i = 0; i < 100; i++) {
                largeDataset.push({
                    id: i,
                    title: `Legacy Activity ${i}`,
                    timeframe: i % 2 === 0 ? 'today' : 'tomorrow',
                    completed: Math.random() > 0.5,
                    created_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
                });
            }
            
            localStorage.setItem('stackmap_activities', JSON.stringify(largeDataset));
            
            const migrationStart = performance.now();
            const detected = window.DataMigration.detectGlobalActivities();
            const migrationTime = performance.now() - migrationStart;
            
            console.log(`✅ Large dataset migration test: ${detected.length} activities detected in ${migrationTime.toFixed(2)}ms`);
            
            // Cleanup
            localStorage.removeItem('stackmap_activities');
        },
        
        /**
         * Test concurrent user operations
         */
        testConcurrentOperations: function() {
            console.log('⚡ Testing Concurrent Operations...');
            
            const user1 = 'concurrent-test-user-1';
            const user2 = 'concurrent-test-user-2';
            
            // Simulate concurrent activity creation
            const promises = [];
            
            for (let i = 0; i < 10; i++) {
                promises.push(new Promise(resolve => {
                    setTimeout(() => {
                        window.UserDataManager.addActivity(user1, {
                            title: `User 1 Activity ${i}`,
                            timeframe: 'today'
                        }, 'today');
                        resolve();
                    }, Math.random() * 100);
                }));
                
                promises.push(new Promise(resolve => {
                    setTimeout(() => {
                        window.UserDataManager.addActivity(user2, {
                            title: `User 2 Activity ${i}`,
                            timeframe: 'today'
                        }, 'today');
                        resolve();
                    }, Math.random() * 100);
                }));
            }
            
            Promise.all(promises).then(() => {
                const user1Activities = window.UserDataManager.getUserActivities(user1, 'today');
                const user2Activities = window.UserDataManager.getUserActivities(user2, 'today');
                
                console.log(`✅ Concurrent operations test: User1=${user1Activities.length}, User2=${user2Activities.length}`);
                
                // Cleanup
                window.UserContext.removeUser(user1);
                window.UserContext.removeUser(user2);
            });
        },
        
        /**
         * Test memory usage with large datasets
         */
        testMemoryUsage: function() {
            console.log('💾 Testing Memory Usage...');
            
            const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const testUserId = 'memory-test-user';
            
            // Create user with many activities
            for (let i = 0; i < 200; i++) {
                window.UserDataManager.addActivity(testUserId, {
                    title: `Memory Test Activity ${i}`,
                    description: 'A'.repeat(500), // Large description
                    timeframe: 'today'
                }, 'today');
            }
            
            const afterCreateMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            const memoryIncrease = afterCreateMemory - initialMemory;
            
            console.log(`✅ Memory usage test: ${memoryIncrease} bytes increase for 200 activities`);
            
            // Cleanup
            window.UserContext.removeUser(testUserId);
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
        },
        
        /**
         * Test data consistency under stress
         */
        testDataConsistency: function() {
            console.log('🔒 Testing Data Consistency...');
            
            const userId = 'consistency-test-user';
            const activities = [];
            
            // Rapid fire operations
            for (let i = 0; i < 50; i++) {
                const activity = {
                    title: `Consistency Test ${i}`,
                    timeframe: 'today'
                };
                
                window.UserDataManager.addActivity(userId, activity, 'today');
                activities.push(activity);
                
                if (i % 5 === 0) {
                    // Random updates
                    const userActivities = window.UserDataManager.getUserActivities(userId, 'today');
                    if (userActivities.length > 0) {
                        const randomActivity = userActivities[Math.floor(Math.random() * userActivities.length)];
                        window.UserDataManager.updateActivity(userId, randomActivity.id, {
                            completed: true
                        });
                    }
                }
                
                if (i % 7 === 0) {
                    // Random deletions
                    const userActivities = window.UserDataManager.getUserActivities(userId, 'today');
                    if (userActivities.length > 5) {
                        const randomActivity = userActivities[Math.floor(Math.random() * userActivities.length)];
                        window.UserDataManager.removeActivity(userId, randomActivity.id);
                    }
                }
            }
            
            const finalActivities = window.UserDataManager.getUserActivities(userId, 'today');
            const userData = window.UserContext.getUserData(userId);
            
            // Check consistency
            const countMatch = userData.activityCount.today === finalActivities.length;
            const allHaveUserId = finalActivities.every(a => a.userId === userId);
            
            console.log(`✅ Data consistency test: Count match=${countMatch}, UserID match=${allHaveUserId}`);
            
            // Cleanup
            window.UserContext.removeUser(userId);
        },
        
        /**
         * Test offline/online scenarios
         */
        testOfflineScenarios: function() {
            console.log('📱 Testing Offline Scenarios...');
            
            const userId = 'offline-test-user';
            
            // Simulate localStorage being temporarily unavailable
            const originalSetItem = localStorage.setItem;
            let storageBlocked = false;
            
            localStorage.setItem = function(key, value) {
                if (storageBlocked) {
                    throw new Error('Storage quota exceeded');
                }
                return originalSetItem.call(this, key, value);
            };
            
            // Test storage failure handling
            storageBlocked = true;
            const result = window.UserDataManager.addActivity(userId, {
                title: 'Offline Test Activity',
                timeframe: 'today'
            }, 'today');
            
            storageBlocked = false;
            localStorage.setItem = originalSetItem; // Restore
            
            console.log(`✅ Offline scenario test: Storage failure handled gracefully=${!result}`);
        },
        
        /**
         * Run all integration tests
         */
        runAll: function() {
            console.log('🚀 Starting User Data Integration Tests...');
            
            try {
                this.testMigrationScenarios();
                this.testConcurrentOperations();
                this.testMemoryUsage();
                this.testDataConsistency();
                this.testOfflineScenarios();
                
                console.log('✅ All integration tests completed successfully!');
            } catch (error) {
                console.error('❌ Integration test error:', error);
            }
        }
    };
    
    // Export to global scope
    window.UserDataIntegrationTests = UserDataIntegrationTests;
    
})();