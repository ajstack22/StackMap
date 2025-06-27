/**
 * StackMap Test Runner
 * Pure ES5 browser-based testing framework
 */

var TestRunner = (function() {
    'use strict';
    
    // Test state
    var tests = [];
    var suites = {};
    var results = {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0
    };
    var isRunning = false;
    var startTime = null;
    var currentTestIndex = 0;
    
    // DOM elements cache
    var elements = {};
    
    // Initialize DOM element references
    function initElements() {
        elements.passedCount = document.getElementById('passed-count');
        elements.failedCount = document.getElementById('failed-count');
        elements.skippedCount = document.getElementById('skipped-count');
        elements.progressFill = document.getElementById('progress-fill');
        elements.testOutput = document.getElementById('test-output');
        elements.runAllBtn = document.getElementById('run-all-btn');
        elements.runFailedBtn = document.getElementById('run-failed-btn');
        elements.resetBtn = document.getElementById('reset-btn');
        elements.exportBtn = document.getElementById('export-btn');
    }
    
    // Register a test suite
    function registerSuite(name, setupFn) {
        if (!suites[name]) {
            suites[name] = {
                name: name,
                tests: [],
                setup: setupFn || function() {},
                results: {
                    passed: 0,
                    failed: 0,
                    skipped: 0
                }
            };
        }
        return suites[name];
    }
    
    // Register a test
    function registerTest(suiteName, testName, testFn, options) {
        var suite = suites[suiteName];
        if (!suite) {
            suite = registerSuite(suiteName);
        }
        
        var test = {
            suite: suiteName,
            name: testName,
            fn: testFn,
            options: options || {},
            status: 'pending',
            error: null,
            duration: 0,
            startTime: null,
            endTime: null
        };
        
        suite.tests.push(test);
        tests.push(test);
        
        return test;
    }
    
    // Run all tests
    function runAll() {
        if (isRunning) return;
        
        reset();
        isRunning = true;
        startTime = Date.now();
        currentTestIndex = 0;
        
        updateUI();
        elements.runAllBtn.disabled = true;
        elements.resetBtn.disabled = true;
        
        // Clear output and create suite containers
        elements.testOutput.innerHTML = '';
        for (var suiteName in suites) {
            if (suites.hasOwnProperty(suiteName)) {
                createSuiteUI(suites[suiteName]);
            }
        }
        
        // Start running tests
        runNextTest();
    }
    
    // Run only failed tests
    function runFailed() {
        if (isRunning) return;
        
        var failedTests = tests.filter(function(test) {
            return test.status === 'failed';
        });
        
        if (failedTests.length === 0) return;
        
        // Reset failed tests
        failedTests.forEach(function(test) {
            test.status = 'pending';
            test.error = null;
            test.duration = 0;
        });
        
        isRunning = true;
        startTime = Date.now();
        currentTestIndex = 0;
        tests = failedTests;
        
        updateUI();
        elements.runAllBtn.disabled = true;
        elements.runFailedBtn.disabled = true;
        elements.resetBtn.disabled = true;
        
        runNextTest();
    }
    
    // Run next test in queue
    function runNextTest() {
        if (currentTestIndex >= tests.length) {
            finishTestRun();
            return;
        }
        
        var test = tests[currentTestIndex];
        currentTestIndex++;
        
        runTest(test, function() {
            // Update progress
            var progress = (currentTestIndex / tests.length) * 100;
            elements.progressFill.style.width = progress + '%';
            
            // Continue with next test
            setTimeout(runNextTest, 10); // Small delay for UI updates
        });
    }
    
    // Run a single test
    function runTest(test, callback) {
        var testElement = document.getElementById('test-' + test.suite + '-' + test.name);
        if (testElement) {
            testElement.className = 'test-item running';
            var statusElement = testElement.querySelector('.test-status');
            statusElement.textContent = 'RUNNING';
            statusElement.className = 'test-status running';
        }
        
        test.status = 'running';
        test.startTime = Date.now();
        
        // Create test context
        var context = {
            test: test,
            assert: createAssert(test),
            done: function(error) {
                finishTest(test, error);
                if (callback) callback();
            },
            skip: function(reason) {
                test.status = 'skipped';
                test.skipReason = reason;
                finishTest(test);
                if (callback) callback();
            }
        };
        
        // Run test with timeout
        var timeout = test.options.timeout || 5000;
        var timeoutId = setTimeout(function() {
            context.done(new Error('Test timeout after ' + timeout + 'ms'));
        }, timeout);
        
        try {
            // Run suite setup if needed
            var suite = suites[test.suite];
            if (suite.setup) {
                suite.setup();
            }
            
            // Run the test
            var result = test.fn.call(context, context);
            
            // Handle async tests
            if (result && typeof result.then === 'function') {
                result.then(function() {
                    clearTimeout(timeoutId);
                    context.done();
                }).catch(function(error) {
                    clearTimeout(timeoutId);
                    context.done(error);
                });
            } else if (test.options.async) {
                // Test will call done() manually
            } else {
                clearTimeout(timeoutId);
                context.done();
            }
        } catch (error) {
            clearTimeout(timeoutId);
            context.done(error);
        }
    }
    
    // Finish a test
    function finishTest(test, error) {
        test.endTime = Date.now();
        test.duration = test.endTime - test.startTime;
        
        if (test.status === 'skipped') {
            results.skipped++;
            suites[test.suite].results.skipped++;
        } else if (error) {
            test.status = 'failed';
            test.error = error;
            results.failed++;
            suites[test.suite].results.failed++;
            
            // Capture screenshot on failure if available
            if (window.TestUtils && TestUtils.captureScreenshot) {
                test.screenshot = TestUtils.captureScreenshot();
            }
        } else {
            test.status = 'passed';
            results.passed++;
            suites[test.suite].results.passed++;
        }
        
        updateTestUI(test);
        updateUI();
    }
    
    // Create assert functions for a test
    function createAssert(test) {
        return {
            equal: function(actual, expected, message) {
                if (actual !== expected) {
                    throw new Error(message || 'Expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual));
                }
            },
            
            notEqual: function(actual, expected, message) {
                if (actual === expected) {
                    throw new Error(message || 'Expected values to be different but both were ' + JSON.stringify(actual));
                }
            },
            
            ok: function(value, message) {
                if (!value) {
                    throw new Error(message || 'Expected truthy value but got ' + JSON.stringify(value));
                }
            },
            
            notOk: function(value, message) {
                if (value) {
                    throw new Error(message || 'Expected falsy value but got ' + JSON.stringify(value));
                }
            },
            
            fail: function(message) {
                throw new Error(message || 'Test failed');
            },
            
            deepEqual: function(actual, expected, message) {
                if (!deepEquals(actual, expected)) {
                    throw new Error(message || 'Deep equality check failed\nExpected: ' + JSON.stringify(expected) + '\nActual: ' + JSON.stringify(actual));
                }
            }
        };
    }
    
    // Deep equality check
    function deepEquals(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a !== 'object' || typeof b !== 'object') return false;
        
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        
        if (keysA.length !== keysB.length) return false;
        
        for (var i = 0; i < keysA.length; i++) {
            var key = keysA[i];
            if (!keysB.includes(key)) return false;
            if (!deepEquals(a[key], b[key])) return false;
        }
        
        return true;
    }
    
    // Finish test run
    function finishTestRun() {
        isRunning = false;
        var totalDuration = Date.now() - startTime;
        
        elements.runAllBtn.disabled = false;
        elements.runFailedBtn.disabled = results.failed === 0;
        elements.resetBtn.disabled = false;
        elements.exportBtn.disabled = false;
        
        // Add summary to output
        var summaryHtml = '<div style="margin-top: 20px; padding: 16px; background: #f7fafc; border-radius: 4px;">';
        summaryHtml += '<h3>Test Run Complete</h3>';
        summaryHtml += '<p>Total duration: ' + formatDuration(totalDuration) + '</p>';
        summaryHtml += '<p>Tests run: ' + tests.length + '</p>';
        summaryHtml += '</div>';
        
        elements.testOutput.insertAdjacentHTML('beforeend', summaryHtml);
    }
    
    // Reset all tests
    function reset() {
        tests = [];
        results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            total: 0
        };
        
        // Reset suite results
        for (var suiteName in suites) {
            if (suites.hasOwnProperty(suiteName)) {
                suites[suiteName].results = {
                    passed: 0,
                    failed: 0,
                    skipped: 0
                };
                suites[suiteName].tests = [];
            }
        }
        
        // Re-register all tests
        if (window.DataSafetyTests) {
            DataSafetyTests.register();
        }
        if (window.MultiUserTests) {
            MultiUserTests.register();
        }
        if (window.EditModeTests) {
            EditModeTests.register();
        }
        if (window.SafeModeTests) {
            SafeModeTests.register();
        }
        if (window.PerformanceTests) {
            PerformanceTests.register();
        }
        if (window.IntegrationTests) {
            IntegrationTests.register();
        }
        if (window.StressTests) {
            StressTests.register();
        }
        
        // Phase 3 ADHD Performance Tests
        if (window.PerformanceThresholdTests) {
            PerformanceThresholdTests.register();
        }
        if (window.RSDErrorRecoveryTests) {
            RSDErrorRecoveryTests.register();
        }
        if (window.HyperfocusMemoryTests) {
            HyperfocusMemoryTests.register();
        }
        if (window.LowEndDeviceTests) {
            LowEndDeviceTests.register();
        }
        if (window.ADHDInteractionTests) {
            ADHDInteractionTests.register();
        }
        if (window.UndoFunctionalityTests) {
            UndoFunctionalityTests.register();
        }
        
        updateUI();
        elements.testOutput.innerHTML = '<p style="color: #666; text-align: center; padding: 40px;">Click "Run All Tests" to begin testing</p>';
        elements.runFailedBtn.disabled = true;
        elements.exportBtn.disabled = true;
    }
    
    // Export test results
    function exportResults() {
        var exportData = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
            deviceInfo: window.TestUtils ? TestUtils.getDeviceInfo() : {},
            summary: results,
            suites: {},
            tests: []
        };
        
        // Add suite data
        for (var suiteName in suites) {
            if (suites.hasOwnProperty(suiteName)) {
                var suite = suites[suiteName];
                exportData.suites[suiteName] = {
                    name: suite.name,
                    results: suite.results,
                    tests: suite.tests.length
                };
            }
        }
        
        // Add test data
        tests.forEach(function(test) {
            exportData.tests.push({
                suite: test.suite,
                name: test.name,
                status: test.status,
                duration: test.duration,
                error: test.error ? test.error.message : null,
                screenshot: test.screenshot || null
            });
        });
        
        // Download as JSON
        var dataStr = JSON.stringify(exportData, null, 2);
        var dataBlob = new Blob([dataStr], { type: 'application/json' });
        var url = URL.createObjectURL(dataBlob);
        
        var link = document.createElement('a');
        link.href = url;
        link.download = 'stackmap-test-results-' + new Date().toISOString().split('T')[0] + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(function() {
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    // UI Helper Functions
    
    function createSuiteUI(suite) {
        var suiteHtml = '<div class="test-suite" id="suite-' + suite.name + '">';
        suiteHtml += '<div class="suite-header" onclick="TestRunner.toggleSuite(\'' + suite.name + '\')">';
        suiteHtml += '<span class="suite-name">' + suite.name + '</span>';
        suiteHtml += '<span class="suite-stats" id="suite-stats-' + suite.name + '">0 / ' + suite.tests.length + ' tests</span>';
        suiteHtml += '</div>';
        suiteHtml += '<div class="test-list" id="suite-tests-' + suite.name + '">';
        
        suite.tests.forEach(function(test) {
            suiteHtml += '<div class="test-item" id="test-' + test.suite + '-' + test.name + '">';
            suiteHtml += '<span class="test-name">' + test.name + '</span>';
            suiteHtml += '<span class="test-status">PENDING</span>';
            suiteHtml += '<span class="test-duration"></span>';
            suiteHtml += '</div>';
        });
        
        suiteHtml += '</div></div>';
        
        elements.testOutput.insertAdjacentHTML('beforeend', suiteHtml);
    }
    
    function updateTestUI(test) {
        var testElement = document.getElementById('test-' + test.suite + '-' + test.name);
        if (!testElement) return;
        
        testElement.className = 'test-item ' + test.status;
        
        var statusElement = testElement.querySelector('.test-status');
        statusElement.textContent = test.status.toUpperCase();
        statusElement.className = 'test-status ' + test.status;
        
        var durationElement = testElement.querySelector('.test-duration');
        durationElement.textContent = test.duration + 'ms';
        
        // Add error details if failed
        if (test.status === 'failed' && test.error) {
            var existingError = testElement.querySelector('.error-details');
            if (existingError) {
                existingError.remove();
            }
            
            var errorHtml = '<div class="error-details">' + escapeHtml(test.error.message || test.error.toString()) + '</div>';
            testElement.insertAdjacentHTML('beforeend', errorHtml);
            
            // Add screenshot if available
            if (test.screenshot) {
                var screenshotHtml = '<div style="margin-top: 8px;"><img src="' + test.screenshot + '" style="max-width: 100%; border: 1px solid #ccc;" alt="Test failure screenshot"></div>';
                testElement.insertAdjacentHTML('beforeend', screenshotHtml);
            }
        }
        
        // Update suite stats
        updateSuiteStats(test.suite);
    }
    
    function updateSuiteStats(suiteName) {
        var suite = suites[suiteName];
        var statsElement = document.getElementById('suite-stats-' + suiteName);
        if (statsElement) {
            var completed = suite.results.passed + suite.results.failed + suite.results.skipped;
            statsElement.textContent = completed + ' / ' + suite.tests.length + ' tests';
        }
    }
    
    function updateUI() {
        elements.passedCount.textContent = results.passed;
        elements.failedCount.textContent = results.failed;
        elements.skippedCount.textContent = results.skipped;
        
        results.total = results.passed + results.failed + results.skipped;
        if (results.total > 0) {
            var progress = (results.total / tests.length) * 100;
            elements.progressFill.style.width = progress + '%';
        }
    }
    
    function toggleSuite(suiteName) {
        var testList = document.getElementById('suite-tests-' + suiteName);
        if (testList) {
            testList.classList.toggle('expanded');
        }
    }
    
    // Utility functions
    
    function formatDuration(ms) {
        if (ms < 1000) return ms + 'ms';
        return (ms / 1000).toFixed(2) + 's';
    }
    
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initElements);
    } else {
        initElements();
    }
    
    // Public API
    return {
        registerSuite: registerSuite,
        registerTest: registerTest,
        runAll: runAll,
        runFailed: runFailed,
        reset: reset,
        exportResults: exportResults,
        toggleSuite: toggleSuite,
        // Extended API for Phase 3 tests
        suites: suites,
        tests: tests
    };
})();