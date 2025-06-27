/**
 * ADHD Performance Testing Script
 * Verifies Phase 4 performance optimizations
 */

(function() {
    'use strict';
    
    // Performance test suite
    var PerformanceTests = {
        results: [],
        
        // Run all tests
        runAll: function() {
            var self = this;
            console.log('=== Starting ADHD Performance Tests ===');
            console.log('Testing sub-500ms response times and RSD-safe messages...\n');
            
            // Sequential test execution with delays
            self.testFeatureFlags()
                .then(function() { return self.delay(500); })
                .then(function() { return self.testButtonResponse(); })
                .then(function() { return self.delay(500); })
                .then(function() { return self.testSkeletonScreens(); })
                .then(function() { return self.delay(500); })
                .then(function() { return self.testHapticFeedback(); })
                .then(function() { return self.delay(500); })
                .then(function() { return self.testRSDMessages(); })
                .then(function() { return self.delay(500); })
                .then(function() { return self.testPerformanceMonitoring(); })
                .then(function() {
                    self.reportResults();
                })
                .catch(function(error) {
                    console.error('Test suite failed:', error);
                });
        },
        
        // Helper delay function
        delay: function(ms) {
            return new Promise(function(resolve) {
                setTimeout(resolve, ms);
            });
        },
        
        // Test 1: Feature Flags System
        testFeatureFlags: function() {
            console.log('Test 1: Feature Flags System');
            var passed = true;
            var details = [];
            
            try {
                // Check if feature flags exist
                if (!window.StackMapFeatureFlags) {
                    throw new Error('Feature flags system not found');
                }
                
                // Test flag checking
                var isEnabled = window.StackMapFeatureFlags.isEnabled('performance-tracking');
                details.push('Performance tracking: ' + (isEnabled ? 'enabled' : 'disabled'));
                
                // Test all flags
                var allFlags = window.StackMapFeatureFlags.getAllFlags();
                details.push('Total flags: ' + Object.keys(allFlags).length);
                
            } catch (error) {
                passed = false;
                details.push('Error: ' + error.message);
            }
            
            this.results.push({
                test: 'Feature Flags System',
                passed: passed,
                details: details
            });
            
            return Promise.resolve();
        },
        
        // Test 2: Button Response Time
        testButtonResponse: function() {
            console.log('Test 2: Button Response Times');
            var self = this;
            
            return new Promise(function(resolve) {
                var button = document.querySelector('.add-task-button');
                if (!button) {
                    self.results.push({
                        test: 'Button Response Time',
                        passed: false,
                        details: ['Add task button not found']
                    });
                    resolve();
                    return;
                }
                
                // Measure button click response
                var startTime = performance.now();
                var clicked = false;
                
                // Listen for visual feedback
                var observer = new MutationObserver(function(mutations) {
                    if (!clicked) return;
                    
                    mutations.forEach(function(mutation) {
                        if (mutation.attributeName === 'class') {
                            var responseTime = performance.now() - startTime;
                            observer.disconnect();
                            
                            self.results.push({
                                test: 'Button Response Time',
                                passed: responseTime < 200,
                                time: responseTime.toFixed(2) + 'ms',
                                threshold: '200ms',
                                details: ['Visual feedback time: ' + responseTime.toFixed(2) + 'ms']
                            });
                            
                            resolve();
                        }
                    });
                });
                
                observer.observe(button, { attributes: true });
                
                // Click the button
                clicked = true;
                button.click();
                
                // Timeout fallback
                setTimeout(function() {
                    observer.disconnect();
                    self.results.push({
                        test: 'Button Response Time',
                        passed: false,
                        details: ['Timeout - no visual feedback detected']
                    });
                    resolve();
                }, 1000);
            });
        },
        
        // Test 3: Skeleton Screens
        testSkeletonScreens: function() {
            console.log('Test 3: Skeleton Screens');
            var passed = true;
            var details = [];
            
            try {
                // Check if skeleton styles exist
                var skeletonStyles = document.querySelector('style') || 
                                   Array.from(document.styleSheets).some(function(sheet) {
                    try {
                        return Array.from(sheet.cssRules || []).some(function(rule) {
                            return rule.selectorText && rule.selectorText.includes('.skeleton');
                        });
                    } catch (e) {
                        return false;
                    }
                });
                
                if (!skeletonStyles) {
                    // Check in base.css
                    var hasSkeletonClass = false;
                    var testDiv = document.createElement('div');
                    testDiv.className = 'skeleton skeleton-task';
                    document.body.appendChild(testDiv);
                    
                    var computed = window.getComputedStyle(testDiv);
                    hasSkeletonClass = computed.animation && computed.animation.includes('skeleton-loading');
                    
                    document.body.removeChild(testDiv);
                    
                    if (!hasSkeletonClass) {
                        throw new Error('Skeleton styles not found');
                    }
                }
                
                details.push('Skeleton styles loaded');
                
                // Test skeleton rendering
                if (window.TaskDisplay && window.TaskDisplay.showSkeletonTasks) {
                    var container = document.createElement('div');
                    window.TaskDisplay.showSkeletonTasks(container, 3);
                    
                    var skeletons = container.querySelectorAll('.skeleton-task');
                    if (skeletons.length === 3) {
                        details.push('Skeleton rendering works');
                    } else {
                        throw new Error('Expected 3 skeletons, found ' + skeletons.length);
                    }
                }
                
            } catch (error) {
                passed = false;
                details.push('Error: ' + error.message);
            }
            
            this.results.push({
                test: 'Skeleton Screens',
                passed: passed,
                details: details
            });
            
            return Promise.resolve();
        },
        
        // Test 4: Haptic Feedback
        testHapticFeedback: function() {
            console.log('Test 4: Haptic Feedback');
            var passed = true;
            var details = [];
            
            try {
                if (!window.StackMapHapticFeedback) {
                    throw new Error('Haptic feedback system not found');
                }
                
                // Check if vibrate API is supported
                var vibrateSupported = window.navigator && typeof window.navigator.vibrate === 'function';
                details.push('Vibrate API: ' + (vibrateSupported ? 'supported' : 'not supported'));
                
                // Simulate user interaction (required for iOS)
                window.StackMapHapticFeedback.enableAfterInteraction();
                
                // Try to trigger haptic
                window.StackMapHapticFeedback.trigger('buttonPress');
                details.push('Haptic trigger executed');
                
            } catch (error) {
                passed = false;
                details.push('Error: ' + error.message);
            }
            
            this.results.push({
                test: 'Haptic Feedback',
                passed: passed,
                details: details
            });
            
            return Promise.resolve();
        },
        
        // Test 5: RSD-Safe Error Messages
        testRSDMessages: function() {
            console.log('Test 5: RSD-Safe Error Messages');
            var passed = true;
            var violations = [];
            
            try {
                if (!window.StorageErrorHandler) {
                    throw new Error('Storage error handler not found');
                }
                
                var messages = window.StorageErrorHandler.messages;
                var blameWords = ['error', 'failed', 'wrong', 'mistake', 'fault', 'invalid', 'incorrect', 'bad'];
                
                // Check each message for blame language
                for (var errorType in messages) {
                    var msg = messages[errorType];
                    var fullText = '';
                    
                    if (typeof msg === 'object') {
                        fullText = (msg.title + ' ' + msg.message).toLowerCase();
                    } else {
                        fullText = msg.toLowerCase();
                    }
                    
                    blameWords.forEach(function(word) {
                        if (fullText.indexOf(word) !== -1) {
                            violations.push('Found "' + word + '" in ' + errorType);
                            passed = false;
                        }
                    });
                }
                
                if (violations.length === 0) {
                    violations.push('All messages are RSD-safe!');
                }
                
            } catch (error) {
                passed = false;
                violations.push('Error: ' + error.message);
            }
            
            this.results.push({
                test: 'RSD-Safe Messages',
                passed: passed,
                details: violations
            });
            
            return Promise.resolve();
        },
        
        // Test 6: Performance Monitoring
        testPerformanceMonitoring: function() {
            console.log('Test 6: Performance Monitoring');
            var passed = true;
            var details = [];
            
            try {
                if (!window.StackMapPerformanceMonitor) {
                    throw new Error('Performance monitor not found');
                }
                
                // Check ADHD thresholds
                var thresholds = window.StackMapPerformanceMonitor.ADHD_THRESHOLDS;
                details.push('Immediate threshold: ' + thresholds.immediate + 'ms');
                details.push('Noticeable threshold: ' + thresholds.noticeable + 'ms');
                details.push('Critical threshold: ' + thresholds.critical + 'ms');
                
                // Test tracking
                var startTime = performance.now() - 600; // Simulate slow interaction
                window.StackMapPerformanceMonitor.trackInteraction('test-slow', startTime);
                
                // Get session metrics
                var metrics = window.StackMapPerformanceMonitor.getSessionMetrics();
                details.push('Session metrics available');
                
            } catch (error) {
                passed = false;
                details.push('Error: ' + error.message);
            }
            
            this.results.push({
                test: 'Performance Monitoring',
                passed: passed,
                details: details
            });
            
            return Promise.resolve();
        },
        
        // Report results
        reportResults: function() {
            console.log('\n=== Performance Test Results ===\n');
            
            var totalTests = this.results.length;
            var passedTests = this.results.filter(function(r) { return r.passed; }).length;
            
            this.results.forEach(function(result) {
                var status = result.passed ? '✅' : '❌';
                console.log(status + ' ' + result.test);
                
                if (result.time) {
                    console.log('   Time: ' + result.time + ' (threshold: ' + result.threshold + ')');
                }
                
                if (result.details && result.details.length > 0) {
                    result.details.forEach(function(detail) {
                        console.log('   - ' + detail);
                    });
                }
                
                console.log('');
            });
            
            console.log('Summary: ' + passedTests + '/' + totalTests + ' tests passed');
            
            if (passedTests === totalTests) {
                console.log('\n🎉 All ADHD performance optimizations verified!');
            } else {
                console.log('\n⚠️  Some tests failed. Please review the implementation.');
            }
        }
    };
    
    // ADHD-Specific Test Scenarios
    var ADHDTests = {
        // Test distraction recovery
        testDistractionRecovery: function() {
            console.log('\n=== ADHD Test: Distraction Recovery ===');
            console.log('Simulating user distraction during task entry...');
            
            // This would be run manually to test real user scenarios
            console.log('1. Click add task button');
            console.log('2. Wait 10 seconds (simulating distraction)');
            console.log('3. Return and verify UI is still responsive');
            console.log('4. Complete task entry');
        },
        
        // Test rapid task entry
        testRapidTaskEntry: function() {
            console.log('\n=== ADHD Test: Rapid Task Entry ===');
            console.log('Testing hyperfocus mode with rapid entries...');
            
            // This would test adding 10 tasks rapidly
            console.log('1. Add 10 tasks as quickly as possible');
            console.log('2. Verify average response time < 200ms');
            console.log('3. Verify no UI freezing or lag');
        }
    };
    
    // Export for global access
    window.PerformanceTests = PerformanceTests;
    window.ADHDTests = ADHDTests;
    
    // Auto-run if called directly
    if (document.readyState === 'complete') {
        console.log('Run PerformanceTests.runAll() to start testing');
    } else {
        window.addEventListener('load', function() {
            console.log('Run PerformanceTests.runAll() to start testing');
        });
    }
})();