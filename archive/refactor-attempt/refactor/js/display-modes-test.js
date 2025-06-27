/**
 * Display Modes Test - Story #117
 * Basic tests to verify display mode functionality
 */

(() => {
    'use strict';
    
    const DisplayModesTest = {
        tests: [],
        results: {
            passed: 0,
            failed: 0,
            total: 0
        },
        
        /**
         * Run all tests
         */
        runTests: function() {
            console.log('🧪 Running Display Modes Tests...');
            
            this.tests = [
                this.testDisplayModeManagerExists,
                this.testModeInitialization,
                this.testModeToggling,
                this.testModeMapping,
                this.testDurationFormatting,
                this.testTimeFormatting,
                this.testMigrationSupport,
                this.testActivityDisplayIntegration,
                this.testDOMClasses
            ];
            
            this.results = { passed: 0, failed: 0, total: this.tests.length };
            
            this.tests.forEach((test, index) => {
                try {
                    console.log(`\n📋 Test ${index + 1}: ${test.name}`);
                    const result = test.call(this);
                    if (result) {
                        console.log('✅ PASS');
                        this.results.passed++;
                    } else {
                        console.log('❌ FAIL');
                        this.results.failed++;
                    }
                } catch (error) {
                    console.log('💥 ERROR:', error.message);
                    this.results.failed++;
                }
            });
            
            this.printResults();
        },
        
        /**
         * Test DisplayModeManager exists and is properly initialized
         */
        testDisplayModeManagerExists: function() {
            return window.DisplayModeManager && 
                   typeof window.DisplayModeManager.getCurrentMode === 'function' &&
                   typeof window.DisplayModeManager.setMode === 'function' &&
                   typeof window.DisplayModeManager.toggleMode === 'function';
        },
        
        /**
         * Test mode initialization
         */
        testModeInitialization: function() {
            const mode = window.DisplayModeManager.getCurrentMode();
            return mode === 'numbers' || mode === 'times';
        },
        
        /**
         * Test mode toggling
         */
        testModeToggling: function() {
            const originalMode = window.DisplayModeManager.getCurrentMode();
            window.DisplayModeManager.toggleMode();
            const newMode = window.DisplayModeManager.getCurrentMode();
            
            // Toggle back
            window.DisplayModeManager.toggleMode();
            const restoredMode = window.DisplayModeManager.getCurrentMode();
            
            return originalMode !== newMode && originalMode === restoredMode;
        },
        
        /**
         * Test mode mapping for backward compatibility
         */
        testModeMapping: function() {
            if (!window.ActivityDisplay) return true; // Skip if not available
            
            // Test Numbers Mode mapping
            window.DisplayModeManager.setMode('numbers');
            const numbersMode = window.ActivityDisplay.getDisplayMode();
            
            // Test Times Mode mapping
            window.DisplayModeManager.setMode('times');
            const timesMode = window.ActivityDisplay.getDisplayMode();
            
            return numbersMode === 'numbers' && timesMode === 'time';
        },
        
        /**
         * Test duration formatting
         */
        testDurationFormatting: function() {
            const tests = [
                { input: 15, expected: '15m' },
                { input: 60, expected: '1h' },
                { input: 90, expected: '1h 30m' },
                { input: 120, expected: '2h' },
                { input: 0, expected: '?' }
            ];
            
            return tests.every(test => {
                const result = window.DisplayModeManager.formatDuration(test.input);
                const passed = result === test.expected;
                if (!passed) {
                    console.log(`  Duration test failed: ${test.input}min → got "${result}", expected "${test.expected}"`);
                }
                return passed;
            });
        },
        
        /**
         * Test time formatting
         */
        testTimeFormatting: function() {
            const tests = [
                { input: '09:30', format: '12h', shouldContain: 'AM' },
                { input: '14:30', format: '12h', shouldContain: 'PM' },
                { input: '09:30', format: '24h', shouldContain: '09:30' }
            ];
            
            return tests.every(test => {
                const result = window.DisplayModeManager.formatScheduledTime(test.input, test.format);
                const passed = result.includes(test.shouldContain);
                if (!passed) {
                    console.log(`  Time test failed: ${test.input} → got "${result}", should contain "${test.shouldContain}"`);
                }
                return passed;
            });
        },
        
        /**
         * Test migration support
         */
        testMigrationSupport: function() {
            // Test that old localStorage key is still read
            const oldKey = 'stackmap_display_mode';
            const newKey = 'stackmap_display_mode_v2';
            
            // Clear both keys
            localStorage.removeItem(oldKey);
            localStorage.removeItem(newKey);
            
            // Set old format
            localStorage.setItem(oldKey, 'time');
            
            // Reload mode (simulate page refresh)
            window.DisplayModeManager.loadMode();
            const migratedMode = window.DisplayModeManager.getCurrentMode();
            
            // Check new format was created
            const newFormat = localStorage.getItem(newKey);
            
            // Cleanup
            localStorage.removeItem(oldKey);
            localStorage.removeItem(newKey);
            
            return migratedMode === 'times' && newFormat === 'times';
        },
        
        /**
         * Test ActivityDisplay integration
         */
        testActivityDisplayIntegration: function() {
            if (!window.ActivityDisplay) return true; // Skip if not available
            
            // Test that ActivityDisplay methods delegate to DisplayModeManager
            const originalMode = window.DisplayModeManager.getCurrentMode();
            const legacyMode = window.ActivityDisplay.getDisplayMode();
            
            // They should map correctly
            const mappingCorrect = (originalMode === 'numbers' && legacyMode === 'numbers') ||
                                 (originalMode === 'times' && legacyMode === 'time');
            
            return mappingCorrect;
        },
        
        /**
         * Test DOM classes are applied
         */
        testDOMClasses: function() {
            const body = document.body;
            if (!body) return false;
            
            const currentMode = window.DisplayModeManager.getCurrentMode();
            const expectedClass = `mode-${currentMode}`;
            
            return body.classList.contains(expectedClass);
        },
        
        /**
         * Print test results
         */
        printResults: function() {
            console.log('\n📊 Test Results:');
            console.log(`✅ Passed: ${this.results.passed}`);
            console.log(`❌ Failed: ${this.results.failed}`);
            console.log(`📝 Total: ${this.results.total}`);
            
            const successRate = Math.round((this.results.passed / this.results.total) * 100);
            console.log(`🎯 Success Rate: ${successRate}%`);
            
            if (this.results.failed === 0) {
                console.log('🎉 All tests passed! Display Modes implementation is working correctly.');
            } else {
                console.log('⚠️ Some tests failed. Please review the implementation.');
            }
        }
    };
    
    // Export for global access
    window.DisplayModesTest = DisplayModesTest;
    
    // Auto-run tests if in development mode
    if (window.location.search.includes('test=display-modes')) {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => DisplayModesTest.runTests(), 1000);
        });
    }
    
})();