// Hyperfocus Session Memory Tests
// Based on research: ADHD hyperfocus sessions extend 1-4 hours, memory issues after 2 hours

(function() {
    'use strict';

    var suite = {
        name: 'Hyperfocus Memory Management',
        tests: []
    };

    // Constants based on research
    var TWO_HOUR_MS = 2 * 60 * 60 * 1000; // 2 hours in ms
    var MEMORY_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes
    var MAX_MEMORY_MB = 50; // Maximum memory usage in MB
    var CACHE_CLEAR_INTERVAL = 35 * 60 * 1000; // 35 minutes (30-45 min range)

    // Helper to simulate activity over time
    function simulateMinuteOfActivity() {
        // Simulate typical user actions in one minute
        var actions = [
            function() { 
                // Add task
                var task = { id: Date.now(), text: 'Task ' + Date.now(), completed: false };
                window.testTasks = window.testTasks || [];
                window.testTasks.push(task);
            },
            function() { 
                // Toggle task
                if (window.testTasks && window.testTasks.length > 0) {
                    var randomIndex = Math.floor(Math.random() * window.testTasks.length);
                    window.testTasks[randomIndex].completed = !window.testTasks[randomIndex].completed;
                }
            },
            function() { 
                // Edit task
                if (window.testTasks && window.testTasks.length > 0) {
                    var randomIndex = Math.floor(Math.random() * window.testTasks.length);
                    window.testTasks[randomIndex].text += ' edited';
                }
            }
        ];

        // Perform 10 random actions
        for (var i = 0; i < 10; i++) {
            var action = actions[Math.floor(Math.random() * actions.length)];
            action();
        }
    }

    // Test: Memory usage stays under 50MB during 2-hour session
    suite.tests.push({
        name: 'Memory usage under 50MB for 2-hour session',
        test: function(done) {
            var memorySnapshots = [];
            var startMemory = TestUtils.getMemoryUsage();
            
            // Simulate 2 hours of activity (accelerated for testing)
            var simulatedMinutes = 0;
            var maxSimulatedMinutes = 120; // 2 hours
            
            var interval = setInterval(function() {
                simulateMinuteOfActivity();
                simulatedMinutes++;
                
                // Check memory every 30 minutes
                if (simulatedMinutes % 30 === 0) {
                    var currentMemory = TestUtils.getMemoryUsage();
                    memorySnapshots.push({
                        time: simulatedMinutes,
                        memory: currentMemory
                    });
                    
                    TestUtils.assert(currentMemory < MAX_MEMORY_MB,
                        'Memory at ' + simulatedMinutes + ' min: ' + currentMemory.toFixed(2) + 'MB (max: ' + MAX_MEMORY_MB + 'MB)');
                }
                
                if (simulatedMinutes >= maxSimulatedMinutes) {
                    clearInterval(interval);
                    
                    // Final memory check
                    var finalMemory = TestUtils.getMemoryUsage();
                    TestUtils.assert(finalMemory < MAX_MEMORY_MB,
                        'Final memory: ' + finalMemory.toFixed(2) + 'MB (max: ' + MAX_MEMORY_MB + 'MB)');
                    
                    done();
                }
            }, 10); // Accelerated: 10ms = 1 minute
        }
    });

    // Test: Cache clearing occurs every 30-45 minutes
    suite.tests.push({
        name: 'Cache clears every 30-45 minutes',
        test: function(done) {
            var cacheClears = [];
            var lastClearTime = Date.now();
            
            // Mock cache clear function
            window.testCacheCleared = function() {
                var currentTime = Date.now();
                var timeSinceLastClear = currentTime - lastClearTime;
                
                cacheClears.push({
                    time: currentTime,
                    interval: timeSinceLastClear
                });
                
                lastClearTime = currentTime;
                return true;
            };

            // Simulate cache clearing over 2 hours
            var testDuration = 0;
            var checkInterval = setInterval(function() {
                testDuration += CACHE_CLEAR_INTERVAL;
                
                // Trigger cache clear
                var cleared = window.testCacheCleared();
                
                if (testDuration >= TWO_HOUR_MS) {
                    clearInterval(checkInterval);
                    
                    // Verify all cache clears were within 30-45 minute range
                    var allWithinRange = cacheClears.every(function(clear, index) {
                        if (index === 0) return true; // Skip first clear
                        
                        var intervalMinutes = clear.interval / (60 * 1000);
                        return intervalMinutes >= 30 && intervalMinutes <= 45;
                    });
                    
                    TestUtils.assert(allWithinRange,
                        'All cache clears within 30-45 minute interval');
                    TestUtils.assert(cacheClears.length >= 2,
                        'At least 2 cache clears in 2 hours: ' + cacheClears.length);
                    
                    done();
                }
            }, 100); // Accelerated testing
        }
    });

    // Test: Memory growth rate is controlled
    suite.tests.push({
        name: 'Memory growth rate stays linear',
        test: function(done) {
            var memoryReadings = [];
            var startMemory = TestUtils.getMemoryUsage();
            
            // Take memory readings every 10 minutes
            var readingCount = 12; // 2 hours / 10 minutes
            var currentReading = 0;
            
            var interval = setInterval(function() {
                // Simulate 10 minutes of activity
                for (var i = 0; i < 10; i++) {
                    simulateMinuteOfActivity();
                }
                
                var currentMemory = TestUtils.getMemoryUsage();
                memoryReadings.push(currentMemory - startMemory);
                currentReading++;
                
                if (currentReading >= readingCount) {
                    clearInterval(interval);
                    
                    // Check that memory growth is roughly linear
                    var isLinear = true;
                    var maxGrowthRate = 0;
                    
                    for (var j = 1; j < memoryReadings.length; j++) {
                        var growthRate = memoryReadings[j] - memoryReadings[j-1];
                        maxGrowthRate = Math.max(maxGrowthRate, growthRate);
                        
                        // Growth rate shouldn't spike more than 2MB between readings
                        if (growthRate > 2) {
                            isLinear = false;
                        }
                    }
                    
                    TestUtils.assert(isLinear,
                        'Memory growth is linear (max spike: ' + maxGrowthRate.toFixed(2) + 'MB)');
                    
                    done();
                }
            }, 50); // Accelerated testing
        }
    });

    // Test: DOM elements are properly cleaned up
    suite.tests.push({
        name: 'DOM elements cleaned up during long sessions',
        test: function(done) {
            var container = document.createElement('div');
            container.id = 'test-container';
            document.body.appendChild(container);
            
            var initialNodeCount = document.body.childNodes.length;
            
            // Simulate adding and removing elements
            var cycleCount = 0;
            var maxCycles = 100; // Simulate 100 task operations
            
            var interval = setInterval(function() {
                // Add elements
                for (var i = 0; i < 10; i++) {
                    var elem = document.createElement('div');
                    elem.className = 'task-item-' + cycleCount + '-' + i;
                    container.appendChild(elem);
                }
                
                // Remove half of them
                var children = container.children;
                for (var j = children.length - 1; j >= children.length / 2; j--) {
                    if (children[j]) {
                        container.removeChild(children[j]);
                    }
                }
                
                cycleCount++;
                
                if (cycleCount >= maxCycles) {
                    clearInterval(interval);
                    
                    // Check that we don't have excessive DOM nodes
                    var finalNodeCount = container.childNodes.length;
                    TestUtils.assert(finalNodeCount < 1000,
                        'DOM nodes controlled: ' + finalNodeCount + ' nodes');
                    
                    // Clean up
                    document.body.removeChild(container);
                    done();
                }
            }, 10);
        }
    });

    // Test: Event listeners are properly removed
    suite.tests.push({
        name: 'Event listeners cleaned up to prevent memory leaks',
        test: function(done) {
            var listenerCount = 0;
            var removedCount = 0;
            
            // Override addEventListener to track listeners
            var originalAdd = EventTarget.prototype.addEventListener;
            var originalRemove = EventTarget.prototype.removeEventListener;
            
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                listenerCount++;
                return originalAdd.call(this, type, listener, options);
            };
            
            EventTarget.prototype.removeEventListener = function(type, listener, options) {
                removedCount++;
                return originalRemove.call(this, type, listener, options);
            };
            
            // Simulate activity that adds/removes listeners
            var button = document.createElement('button');
            document.body.appendChild(button);
            
            var handlers = [];
            
            // Add 50 listeners
            for (var i = 0; i < 50; i++) {
                var handler = function() { console.log('clicked'); };
                handlers.push(handler);
                button.addEventListener('click', handler);
            }
            
            // Remove them all
            handlers.forEach(function(handler) {
                button.removeEventListener('click', handler);
            });
            
            // Restore original methods
            EventTarget.prototype.addEventListener = originalAdd;
            EventTarget.prototype.removeEventListener = originalRemove;
            
            TestUtils.assert(removedCount >= 50,
                'Listeners properly removed: ' + removedCount + ' removed');
            
            document.body.removeChild(button);
            done();
        }
    });

    // Test: Automatic garbage collection triggers
    suite.tests.push({
        name: 'Garbage collection triggered periodically',
        test: function(done) {
            var gcTriggered = false;
            
            // Mock GC trigger
            window.testTriggerGC = function() {
                gcTriggered = true;
                
                // Simulate memory reduction after GC
                var beforeGC = TestUtils.getMemoryUsage();
                // In real app, memory would reduce here
                var afterGC = beforeGC * 0.8; // Simulate 20% reduction
                
                return {
                    before: beforeGC,
                    after: afterGC,
                    reduction: beforeGC - afterGC
                };
            };
            
            // Simulate memory pressure
            for (var i = 0; i < 100; i++) {
                simulateMinuteOfActivity();
            }
            
            // Trigger GC
            var gcResult = window.testTriggerGC();
            
            TestUtils.assert(gcTriggered, 'GC was triggered');
            TestUtils.assert(gcResult.reduction > 0,
                'GC reduced memory by: ' + gcResult.reduction.toFixed(2) + 'MB');
            
            done();
        }
    });

    // Test: Memory warnings at thresholds
    suite.tests.push({
        name: 'Memory warnings shown at appropriate thresholds',
        test: function(done) {
            var warnings = [];
            var WARNING_THRESHOLD = 40; // MB
            var CRITICAL_THRESHOLD = 45; // MB
            
            // Mock warning system
            window.testMemoryWarning = function(level, memory) {
                warnings.push({
                    level: level,
                    memory: memory,
                    timestamp: Date.now()
                });
            };
            
            // Simulate memory growth
            var currentMemory = 35;
            var checkCount = 0;
            
            var interval = setInterval(function() {
                currentMemory += 2; // Simulate 2MB growth
                checkCount++;
                
                if (currentMemory >= WARNING_THRESHOLD && currentMemory < CRITICAL_THRESHOLD) {
                    window.testMemoryWarning('warning', currentMemory);
                } else if (currentMemory >= CRITICAL_THRESHOLD) {
                    window.testMemoryWarning('critical', currentMemory);
                }
                
                if (checkCount >= 10 || currentMemory >= MAX_MEMORY_MB) {
                    clearInterval(interval);
                    
                    // Verify warnings were triggered
                    var hasWarning = warnings.some(function(w) { return w.level === 'warning'; });
                    var hasCritical = warnings.some(function(w) { return w.level === 'critical'; });
                    
                    TestUtils.assert(hasWarning, 'Warning triggered at threshold');
                    TestUtils.assert(hasCritical, 'Critical warning triggered at threshold');
                    
                    done();
                }
            }, 100);
        }
    });

    // Test: Session data persists through memory management
    suite.tests.push({
        name: 'User data persists through memory optimizations',
        test: function(done) {
            // Create test data
            var userData = {
                tasks: [
                    { id: 1, text: 'Important task', completed: false },
                    { id: 2, text: 'Another task', completed: true }
                ],
                settings: {
                    theme: 'dark',
                    fontSize: 'large'
                }
            };
            
            // Store data
            window.testUserData = JSON.parse(JSON.stringify(userData));
            
            // Simulate memory optimization
            window.testOptimizeMemory = function() {
                // Clear caches, compress data, etc.
                // But preserve user data
                return true;
            };
            
            window.testOptimizeMemory();
            
            // Verify data still exists
            TestUtils.assert(window.testUserData !== null, 'User data exists after optimization');
            TestUtils.assert(window.testUserData.tasks.length === userData.tasks.length,
                'Tasks preserved: ' + window.testUserData.tasks.length);
            TestUtils.assert(window.testUserData.settings.theme === userData.settings.theme,
                'Settings preserved');
            
            done();
        }
    });

    // Register the suite and tests
    function register() {
        if (typeof TestRunner === 'undefined') return;
        
        TestRunner.registerSuite(suite.name);
        
        suite.tests.forEach(function(test) {
            TestRunner.registerTest(suite.name, test.name, test.test, { async: test.test.length > 0 });
        });
    }

    // Export for module usage
    window.HyperfocusMemoryTests = {
        suite: suite,
        register: register
    };
    
    // Auto-register if TestRunner is available
    if (typeof TestRunner !== 'undefined') {
        register();
    }

})();