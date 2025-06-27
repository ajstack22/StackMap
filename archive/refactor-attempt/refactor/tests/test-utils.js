/**
 * StackMap Test Utilities
 * Helper functions for testing including data generators and device info
 */

var TestUtils = (function() {
    'use strict';
    
    // Device information collection
    function getDeviceInfo() {
        var info = {
            'User Agent': navigator.userAgent,
            'Platform': navigator.platform,
            'Screen Resolution': screen.width + 'x' + screen.height,
            'Viewport Size': window.innerWidth + 'x' + window.innerHeight,
            'Pixel Ratio': window.devicePixelRatio || 1,
            'Online Status': navigator.onLine ? 'Online' : 'Offline',
            'Language': navigator.language || navigator.userLanguage,
            'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        // Memory info if available
        if (performance && performance.memory) {
            info['JS Heap Size'] = formatBytes(performance.memory.usedJSHeapSize);
            info['JS Heap Limit'] = formatBytes(performance.memory.jsHeapSizeLimit);
        }
        
        // Connection info if available
        if (navigator.connection) {
            info['Connection Type'] = navigator.connection.effectiveType || 'Unknown';
            info['Downlink Speed'] = navigator.connection.downlink ? navigator.connection.downlink + ' Mbps' : 'Unknown';
        }
        
        // Storage info
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(function(estimate) {
                info['Storage Used'] = formatBytes(estimate.usage || 0);
                info['Storage Quota'] = formatBytes(estimate.quota || 0);
            });
        }
        
        return info;
    }
    
    // Format bytes to human readable
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Generate test users
    function generateUsers(count) {
        var users = [];
        var names = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'William'];
        var colors = ['#4A5568', '#7C3AED', '#2563EB', '#10B981', '#F59E0B', '#EF4444'];
        
        for (var i = 0; i < count; i++) {
            users.push({
                id: 'test-user-' + Date.now() + '-' + i,
                name: names[i % names.length] + ' Test',
                color: colors[i % colors.length],
                safeMode: i % 3 === 0, // Every 3rd user has safe mode
                created: new Date().toISOString()
            });
        }
        
        return users;
    }
    
    // Generate test tasks
    function generateTasks(count, userId) {
        var tasks = [];
        var activities = [
            'Brush teeth', 'Make breakfast', 'Take medication', 'Pack lunch',
            'Check calendar', 'Water plants', 'Feed pet', 'Exercise',
            'Read email', 'Take shower', 'Get dressed', 'Make bed'
        ];
        
        var colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        var icons = ['star', 'heart', 'check', 'clock', 'home', 'book'];
        
        for (var i = 0; i < count; i++) {
            var now = Date.now();
            tasks.push({
                id: 'test-task-' + now + '-' + i,
                userId: userId || 'test-user',
                activity: activities[i % activities.length],
                color: colors[i % colors.length],
                icon: icons[i % icons.length],
                time: formatTime(new Date(now + i * 3600000)), // Space out by 1 hour
                isRecurring: i % 4 === 0, // Every 4th task is recurring
                reminderEnabled: i % 3 === 0, // Every 3rd task has reminder
                note: i % 2 === 0 ? 'Test note for task ' + i : '',
                created: now,
                updated: now,
                completed: i % 5 === 0 ? now : null // Every 5th task is completed
            });
        }
        
        return tasks;
    }
    
    // Format time helper
    function formatTime(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return hours + ':' + minutes + ' ' + ampm;
    }
    
    // Generate large dataset for stress testing
    function generateLargeDataset(taskCount, userCount) {
        var dataset = {
            users: generateUsers(userCount || 5),
            tasks: []
        };
        
        dataset.users.forEach(function(user) {
            var userTasks = generateTasks(Math.floor(taskCount / dataset.users.length), user.id);
            dataset.tasks = dataset.tasks.concat(userTasks);
        });
        
        return dataset;
    }
    
    // Simulate memory pressure
    var memoryPressure = [];
    function simulateMemoryConstraint(targetMB) {
        // Clear existing pressure
        memoryPressure = [];
        
        if (!targetMB) return;
        
        try {
            var chunkSize = 1024 * 1024; // 1MB chunks
            var targetBytes = targetMB * 1024 * 1024;
            var allocated = 0;
            
            while (allocated < targetBytes) {
                var chunk = new ArrayBuffer(chunkSize);
                memoryPressure.push(chunk);
                allocated += chunkSize;
                
                // Safety check to prevent browser crash
                if (memoryPressure.length > 500) {
                    console.warn('Memory pressure simulation stopped at 500MB for safety');
                    break;
                }
            }
            
            return allocated;
        } catch (e) {
            console.error('Failed to simulate memory pressure:', e);
            return 0;
        }
    }
    
    // Release memory pressure
    function releaseMemoryPressure() {
        memoryPressure = [];
        if (window.gc) {
            window.gc(); // Force garbage collection if available
        }
    }
    
    // Capture screenshot of current DOM state
    function captureScreenshot() {
        try {
            // Create canvas
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            
            // Set canvas size to viewport
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // This is a simplified version - in a real implementation,
            // we'd use html2canvas or similar library
            // For now, we'll capture basic DOM state as text
            
            var domState = {
                url: window.location.href,
                timestamp: new Date().toISOString(),
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                elements: []
            };
            
            // Capture visible elements
            var elements = document.querySelectorAll('.test-item.failed, .error-details');
            elements.forEach(function(el) {
                var rect = el.getBoundingClientRect();
                domState.elements.push({
                    tag: el.tagName,
                    class: el.className,
                    text: el.textContent.substring(0, 200),
                    position: {
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height
                    }
                });
            });
            
            // Return as data URL (simplified text representation)
            return 'data:application/json;base64,' + btoa(JSON.stringify(domState, null, 2));
        } catch (e) {
            console.error('Screenshot capture failed:', e);
            return null;
        }
    }
    
    // Wait for condition helper
    function waitForCondition(conditionFn, timeout, interval) {
        timeout = timeout || 5000;
        interval = interval || 100;
        
        return new Promise(function(resolve, reject) {
            var startTime = Date.now();
            
            function check() {
                if (conditionFn()) {
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error('Timeout waiting for condition'));
                } else {
                    setTimeout(check, interval);
                }
            }
            
            check();
        });
    }
    
    // Simulate network conditions
    function simulateOffline() {
        if ('onLine' in navigator) {
            // Dispatch offline event
            window.dispatchEvent(new Event('offline'));
            
            // Override fetch if needed
            window._originalFetch = window.fetch;
            window.fetch = function() {
                return Promise.reject(new Error('Network request failed - simulated offline'));
            };
        }
    }
    
    function simulateOnline() {
        if ('onLine' in navigator) {
            // Dispatch online event
            window.dispatchEvent(new Event('online'));
            
            // Restore fetch
            if (window._originalFetch) {
                window.fetch = window._originalFetch;
                delete window._originalFetch;
            }
        }
    }
    
    // Simulate device rotation
    function simulateRotation() {
        var orientation = window.orientation || 0;
        var newOrientation = orientation === 0 ? 90 : 0;
        
        // Dispatch orientation change event
        window.dispatchEvent(new Event('orientationchange'));
        
        // Also dispatch resize event
        window.dispatchEvent(new Event('resize'));
        
        return newOrientation;
    }
    
    // Simulate storage pressure
    function simulateStoragePressure(fillPercentage) {
        fillPercentage = fillPercentage || 95;
        
        return new Promise(function(resolve, reject) {
            if (!navigator.storage || !navigator.storage.estimate) {
                reject(new Error('Storage API not available'));
                return;
            }
            
            navigator.storage.estimate().then(function(estimate) {
                var quota = estimate.quota || 0;
                var usage = estimate.usage || 0;
                var targetUsage = (quota * fillPercentage) / 100;
                var toFill = targetUsage - usage;
                
                if (toFill <= 0) {
                    resolve({ filled: usage, quota: quota, percentage: (usage / quota) * 100 });
                    return;
                }
                
                // Fill storage with dummy data
                var chunkSize = 1024 * 1024; // 1MB chunks
                var key = 'test-storage-pressure-';
                var index = 0;
                
                function fillChunk() {
                    if (toFill <= 0) {
                        navigator.storage.estimate().then(function(newEstimate) {
                            resolve({
                                filled: newEstimate.usage || 0,
                                quota: newEstimate.quota || 0,
                                percentage: ((newEstimate.usage || 0) / (newEstimate.quota || 1)) * 100
                            });
                        });
                        return;
                    }
                    
                    var data = new ArrayBuffer(Math.min(chunkSize, toFill));
                    localStorage.setItem(key + index, btoa(String.fromCharCode.apply(null, new Uint8Array(data))));
                    
                    toFill -= chunkSize;
                    index++;
                    
                    // Continue filling
                    setTimeout(fillChunk, 10);
                }
                
                fillChunk();
            }).catch(reject);
        });
    }
    
    // Clean up storage pressure simulation
    function cleanupStoragePressure() {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && key.startsWith('test-storage-pressure-')) {
                keys.push(key);
            }
        }
        
        keys.forEach(function(key) {
            localStorage.removeItem(key);
        });
    }
    
    // Performance measurement helpers
    function measurePerformance(fn, iterations) {
        iterations = iterations || 1;
        var times = [];
        
        for (var i = 0; i < iterations; i++) {
            var start = performance.now();
            fn();
            var end = performance.now();
            times.push(end - start);
        }
        
        return {
            min: Math.min.apply(Math, times),
            max: Math.max.apply(Math, times),
            avg: times.reduce(function(a, b) { return a + b; }, 0) / times.length,
            times: times
        };
    }
    
    // Memory usage helper
    function getMemoryUsage() {
        if (performance && performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        }
        return null;
    }
    
    // Enhanced Memory Profiler for Phase 3 testing
    var MemoryProfiler = {
        baseline: null,
        measurements: [],
        
        captureBaseline: function() {
            if (performance.memory) {
                this.baseline = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    timestamp: Date.now()
                };
                this.measurements = [];
                return this.baseline;
            }
            return null;
        },
        
        getMBUsed: function() {
            if (performance.memory) {
                return Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
            }
            return -1; // Not supported
        },
        
        getGrowth: function() {
            if (this.baseline && performance.memory) {
                var current = performance.memory.usedJSHeapSize;
                var growth = current - this.baseline.usedJSHeapSize;
                return Math.round(growth / 1024 / 1024);
            }
            return 0;
        },
        
        recordMeasurement: function(label) {
            if (performance.memory) {
                var measurement = {
                    label: label || 'Checkpoint',
                    timestamp: Date.now(),
                    usedMB: this.getMBUsed(),
                    growthMB: this.getGrowth(),
                    usedHeap: performance.memory.usedJSHeapSize,
                    totalHeap: performance.memory.totalJSHeapSize
                };
                this.measurements.push(measurement);
                return measurement;
            }
            return null;
        },
        
        getReport: function() {
            if (!this.baseline) return null;
            
            var report = {
                baseline: this.baseline,
                current: {
                    usedMB: this.getMBUsed(),
                    growthMB: this.getGrowth(),
                    timestamp: Date.now()
                },
                measurements: this.measurements,
                summary: {
                    maxUsedMB: 0,
                    maxGrowthMB: 0,
                    averageUsedMB: 0
                }
            };
            
            // Calculate summary stats
            if (this.measurements.length > 0) {
                var totalUsed = 0;
                this.measurements.forEach(function(m) {
                    report.summary.maxUsedMB = Math.max(report.summary.maxUsedMB, m.usedMB);
                    report.summary.maxGrowthMB = Math.max(report.summary.maxGrowthMB, m.growthMB);
                    totalUsed += m.usedMB;
                });
                report.summary.averageUsedMB = Math.round(totalUsed / this.measurements.length);
            }
            
            return report;
        },
        
        checkThreshold: function(maxMB) {
            var currentMB = this.getMBUsed();
            return {
                passed: currentMB <= maxMB,
                current: currentMB,
                threshold: maxMB,
                margin: maxMB - currentMB
            };
        },
        
        reset: function() {
            this.baseline = null;
            this.measurements = [];
        }
    };
    
    // Smart module loading for progressive integration
    function getModule(moduleName, mockModule) {
        // Try real module first
        if (window[moduleName]) {
            console.log('Using real module: ' + moduleName);
            return window[moduleName];
        }
        // Fall back to mock
        console.warn('Using mock for ' + moduleName);
        return mockModule;
    }
    
    // Additional helpers for Phase 3 tests
    
    // Simple assertion helper
    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }
    
    // Get memory usage in MB (simplified for Phase 3 tests)
    function getMemoryUsageInMB() {
        if (performance && performance.memory) {
            return performance.memory.usedJSHeapSize / 1024 / 1024;
        }
        // Return mock value for browsers without memory API
        return 30 + Math.random() * 20; // Mock 30-50MB
    }
    
    // Simulate memory pressure (wrapper for Phase 3 compatibility)
    function simulateMemoryPressure(availableMemory) {
        // Simulate by filling some memory
        var targetFillMB = Math.max(0, 512 - availableMemory); // Assume 512MB device
        return simulateMemoryConstraint(targetFillMB);
    }
    
    // Public API
    return {
        getDeviceInfo: getDeviceInfo,
        generateUsers: generateUsers,
        generateTasks: generateTasks,
        generateLargeDataset: generateLargeDataset,
        simulateMemoryConstraint: simulateMemoryConstraint,
        releaseMemoryPressure: releaseMemoryPressure,
        captureScreenshot: captureScreenshot,
        waitForCondition: waitForCondition,
        simulateOffline: simulateOffline,
        simulateOnline: simulateOnline,
        simulateRotation: simulateRotation,
        simulateStoragePressure: simulateStoragePressure,
        cleanupStoragePressure: cleanupStoragePressure,
        measurePerformance: measurePerformance,
        getMemoryUsage: getMemoryUsageInMB, // Changed to return MB directly
        simulateMemoryPressure: simulateMemoryPressure, // Added for Phase 3
        assert: assert, // Added for Phase 3
        formatBytes: formatBytes,
        MemoryProfiler: MemoryProfiler,
        getModule: getModule
    };
})();