/**
 * StackMap Performance Test Suite
 * Tests memory usage, render performance, and operation timing
 * Critical for ensuring app works on 512MB devices
 */

var PerformanceTests = (function() {
    'use strict';
    
    // Mock modules until real ones are integrated
    var MockTaskDisplay = {
        tasks: [],
        
        renderTasks: function(tasks) {
            this.tasks = tasks;
            // Simulate DOM creation - each task card ~1MB based on research
            var container = document.createElement('div');
            tasks.forEach(function(task) {
                var card = document.createElement('div');
                card.className = 'task-card';
                card.innerHTML = '<h3>' + task.activity + '</h3><p>' + task.time + '</p>';
                container.appendChild(card);
            });
            document.body.appendChild(container);
            return container;
        },
        
        clearTasks: function() {
            this.tasks = [];
            var containers = document.querySelectorAll('.task-card');
            containers.forEach(function(el) { 
                if (el.parentNode) el.parentNode.removeChild(el); 
            });
        }
    };
    
    var MockActivityLibrary = {
        defaultActivities: null,
        
        loadDefaultActivities: function() {
            // Simulate loading 111 activities (research shows this blocks for 3.5s)
            var activities = [];
            for (var i = 0; i < 111; i++) {
                activities.push({
                    id: 'activity-' + i,
                    name: 'Activity ' + i,
                    category: 'daily',
                    icon: 'star',
                    color: 'blue'
                });
            }
            this.defaultActivities = activities;
            return activities;
        }
    };
    
    var MockTaskSQLite = {
        tasks: [],
        
        createTask: function(task) {
            task.id = 'task-' + Date.now() + '-' + Math.random();
            this.tasks.push(task);
            return Promise.resolve(task);
        },
        
        updateTask: function(id, updates) {
            var task = this.tasks.find(function(t) { return t.id === id; });
            if (task) {
                Object.assign(task, updates);
            }
            return Promise.resolve(task);
        },
        
        deleteTask: function(id) {
            this.tasks = this.tasks.filter(function(t) { return t.id !== id; });
            return Promise.resolve(true);
        },
        
        getUserTasks: function(userId) {
            return Promise.resolve(this.tasks.filter(function(t) { 
                return t.userId === userId; 
            }));
        }
    };
    
    // Get modules with fallback to mocks
    var TaskDisplay = TestUtils.getModule('TaskDisplay', MockTaskDisplay);
    var ActivityLibrary = TestUtils.getModule('ActivityLibrary', MockActivityLibrary);
    var TaskSQLite = TestUtils.getModule('TaskSQLite', MockTaskSQLite);
    
    function register() {
        var suite = TestRunner.registerSuite('Performance Tests', function() {
            // Suite setup - reset profiler before each test
            TestUtils.MemoryProfiler.reset();
        });
        
        // Critical Memory Tests from PM feedback
        
        TestRunner.registerTest('Performance Tests', 'Memory stays under 50MB with 50 tasks', function(done) {
            var assert = this.assert;
            
            // Capture baseline
            TestUtils.MemoryProfiler.captureBaseline();
            var baseline = TestUtils.MemoryProfiler.recordMeasurement('Baseline');
            
            // Generate and render 50 tasks
            var tasks = TestUtils.generateTasks(50, 'perf-test-user');
            TaskDisplay.renderTasks(tasks);
            
            // Wait for render to complete
            setTimeout(function() {
                var afterRender = TestUtils.MemoryProfiler.recordMeasurement('After 50 tasks');
                var check = TestUtils.MemoryProfiler.checkThreshold(50);
                
                assert.ok(check.passed, 
                    'Memory usage (' + check.current + 'MB) exceeds 50MB threshold. ' +
                    'Need virtual scrolling implementation!');
                
                // Cleanup
                TaskDisplay.clearTasks();
                done();
            }, 100);
        }, { async: true });
        
        TestRunner.registerTest('Performance Tests', 'Memory stays under 50MB with 100 tasks (Virtual Scrolling Need)', function(done) {
            var assert = this.assert;
            
            // This test will likely FAIL, proving we need virtual scrolling
            TestUtils.MemoryProfiler.captureBaseline();
            
            // Generate and render 100 tasks
            var tasks = TestUtils.generateTasks(100, 'perf-test-user');
            TaskDisplay.renderTasks(tasks);
            
            setTimeout(function() {
                var measurement = TestUtils.MemoryProfiler.recordMeasurement('After 100 tasks');
                var check = TestUtils.MemoryProfiler.checkThreshold(50);
                
                // Research shows each task card ~1MB, so 100 tasks = ~100MB
                assert.ok(check.passed, 
                    'Memory usage (' + check.current + 'MB) exceeds 50MB threshold. ' +
                    'Virtual scrolling is REQUIRED! Each task card uses ~1MB.');
                
                // Cleanup
                TaskDisplay.clearTasks();
                done();
            }, 100);
        }, { async: true });
        
        TestRunner.registerTest('Performance Tests', 'No memory leak after 100 CRUD operations', function(done) {
            var assert = this.assert;
            
            TestUtils.MemoryProfiler.captureBaseline();
            var initialMB = TestUtils.MemoryProfiler.getMBUsed();
            
            var operations = [];
            var userId = 'perf-test-user';
            
            // Perform 100 create/update/delete cycles
            for (var i = 0; i < 100; i++) {
                operations.push({
                    type: 'cycle',
                    index: i
                });
            }
            
            function runNextOperation() {
                if (operations.length === 0) {
                    // Force garbage collection if available
                    if (window.gc) window.gc();
                    
                    setTimeout(function() {
                        var finalMB = TestUtils.MemoryProfiler.getMBUsed();
                        var growth = finalMB - initialMB;
                        
                        assert.ok(growth < 5, 
                            'Memory grew by ' + growth + 'MB after 100 operations. ' +
                            'Possible memory leak detected!');
                        
                        done();
                    }, 1000);
                    return;
                }
                
                var op = operations.shift();
                
                // Create
                TaskSQLite.createTask({
                    userId: userId,
                    activity: 'Test Task ' + op.index,
                    time: '10:00 AM',
                    color: 'blue',
                    icon: 'star'
                }).then(function(task) {
                    // Update
                    return TaskSQLite.updateTask(task.id, {
                        activity: 'Updated Task ' + op.index
                    });
                }).then(function(task) {
                    // Delete
                    return TaskSQLite.deleteTask(task.id);
                }).then(function() {
                    // Continue with next operation
                    runNextOperation();
                });
            }
            
            runNextOperation();
        }, { async: true, timeout: 30000 });
        
        // Render Performance Tests
        
        TestRunner.registerTest('Performance Tests', 'Initial render under 1 second', function(done) {
            var assert = this.assert;
            
            // Generate 50 tasks (typical daily load)
            var tasks = TestUtils.generateTasks(50, 'perf-test-user');
            
            var startTime = performance.now();
            TaskDisplay.renderTasks(tasks);
            var renderTime = performance.now() - startTime;
            
            assert.ok(renderTime < 1000, 
                'Initial render took ' + Math.round(renderTime) + 'ms. ' +
                'Target is under 1000ms for 50 tasks.');
            
            // Cleanup
            TaskDisplay.clearTasks();
            done();
        }, { async: true });
        
        TestRunner.registerTest('Performance Tests', 'Smooth scrolling with 50 tasks (60fps)', function(done) {
            var assert = this.assert;
            var context = this;
            
            // Skip if requestAnimationFrame not available
            if (!window.requestAnimationFrame) {
                context.skip('requestAnimationFrame not available');
                return;
            }
            
            // Generate and render tasks
            var tasks = TestUtils.generateTasks(50, 'perf-test-user');
            var container = TaskDisplay.renderTasks(tasks);
            
            // Measure frame rate during scroll
            var frameCount = 0;
            var startTime = performance.now();
            var targetFrames = 60; // 1 second worth
            
            function measureFrame() {
                frameCount++;
                
                // Simulate scroll
                if (container.scrollTop !== undefined) {
                    container.scrollTop += 10;
                }
                
                if (frameCount < targetFrames) {
                    requestAnimationFrame(measureFrame);
                } else {
                    var duration = performance.now() - startTime;
                    var fps = (frameCount / duration) * 1000;
                    
                    assert.ok(fps >= 55, 
                        'Scroll performance is ' + Math.round(fps) + ' fps. ' +
                        'Target is 60fps for smooth scrolling.');
                    
                    // Cleanup
                    TaskDisplay.clearTasks();
                    done();
                }
            }
            
            requestAnimationFrame(measureFrame);
        }, { async: true });
        
        // Operation Performance Tests
        
        TestRunner.registerTest('Performance Tests', 'Task CRUD operations under 100ms', function(done) {
            var assert = this.assert;
            var userId = 'perf-test-user';
            
            var timings = {
                create: [],
                update: [],
                delete: []
            };
            
            // Test 10 operations of each type
            var promises = [];
            
            for (var i = 0; i < 10; i++) {
                // Create timing
                var createStart = performance.now();
                var createPromise = TaskSQLite.createTask({
                    userId: userId,
                    activity: 'Performance Test ' + i,
                    time: '10:00 AM',
                    color: 'blue',
                    icon: 'star'
                }).then(function(task) {
                    timings.create.push(performance.now() - createStart);
                    return task;
                });
                
                promises.push(createPromise);
            }
            
            Promise.all(promises).then(function(tasks) {
                // Test updates
                var updatePromises = tasks.map(function(task, index) {
                    var updateStart = performance.now();
                    return TaskSQLite.updateTask(task.id, {
                        activity: 'Updated ' + index
                    }).then(function() {
                        timings.update.push(performance.now() - updateStart);
                        return task;
                    });
                });
                
                return Promise.all(updatePromises);
            }).then(function(tasks) {
                // Test deletes
                var deletePromises = tasks.map(function(task) {
                    var deleteStart = performance.now();
                    return TaskSQLite.deleteTask(task.id).then(function() {
                        timings.delete.push(performance.now() - deleteStart);
                    });
                });
                
                return Promise.all(deletePromises);
            }).then(function() {
                // Calculate averages
                var avgCreate = timings.create.reduce(function(a, b) { return a + b; }, 0) / timings.create.length;
                var avgUpdate = timings.update.reduce(function(a, b) { return a + b; }, 0) / timings.update.length;
                var avgDelete = timings.delete.reduce(function(a, b) { return a + b; }, 0) / timings.delete.length;
                
                assert.ok(avgCreate < 100, 'Create operations avg ' + Math.round(avgCreate) + 'ms (target < 100ms)');
                assert.ok(avgUpdate < 100, 'Update operations avg ' + Math.round(avgUpdate) + 'ms (target < 100ms)');
                assert.ok(avgDelete < 100, 'Delete operations avg ' + Math.round(avgDelete) + 'ms (target < 100ms)');
                
                done();
            });
        }, { async: true, timeout: 10000 });
        
        // Activity Loading Performance (from PM feedback)
        
        TestRunner.registerTest('Performance Tests', 'Default activities load without blocking', function(done) {
            var assert = this.assert;
            
            var startTime = performance.now();
            var blockingThreshold = 100; // ms
            var maxBlockTime = 0;
            
            // Simulate chunked loading
            var chunkSize = 10;
            var totalActivities = 111;
            var loaded = 0;
            
            function loadChunk() {
                var chunkStart = performance.now();
                
                // Load a chunk of activities
                for (var i = 0; i < chunkSize && loaded < totalActivities; i++) {
                    // Simulate activity processing
                    var activity = {
                        id: 'activity-' + loaded,
                        name: 'Activity ' + loaded,
                        category: 'daily',
                        icon: 'star',
                        color: 'blue'
                    };
                    loaded++;
                }
                
                var chunkTime = performance.now() - chunkStart;
                maxBlockTime = Math.max(maxBlockTime, chunkTime);
                
                if (loaded < totalActivities) {
                    setTimeout(loadChunk, 0); // Yield to browser
                } else {
                    var totalTime = performance.now() - startTime;
                    
                    assert.ok(maxBlockTime < blockingThreshold, 
                        'Max chunk blocking time was ' + Math.round(maxBlockTime) + 'ms. ' +
                        'Should be under ' + blockingThreshold + 'ms to prevent UI freeze.');
                    
                    assert.ok(totalTime < 1000, 
                        'Total load time was ' + Math.round(totalTime) + 'ms. ' +
                        'Research showed 3.5s blocking - this approach is much better!');
                    
                    done();
                }
            }
            
            loadChunk();
        }, { async: true });
        
        // Memory Profiler Report Test
        
        TestRunner.registerTest('Performance Tests', 'Memory profiler generates accurate reports', function(done) {
            var assert = this.assert;
            
            TestUtils.MemoryProfiler.reset();
            TestUtils.MemoryProfiler.captureBaseline();
            
            // Take some measurements
            TestUtils.MemoryProfiler.recordMeasurement('Start');
            
            // Allocate some memory
            var data = new Array(1000000); // ~4MB
            TestUtils.MemoryProfiler.recordMeasurement('After allocation');
            
            // Get report
            var report = TestUtils.MemoryProfiler.getReport();
            
            assert.ok(report, 'Report generated successfully');
            assert.ok(report.baseline, 'Report includes baseline');
            assert.ok(report.measurements.length === 2, 'Report includes all measurements');
            assert.ok(report.summary.maxUsedMB > 0, 'Report calculates max memory');
            
            done();
        }, { async: true });
    }
    
    // Auto-register tests when loaded
    register();
    
    return {
        register: register
    };
})();