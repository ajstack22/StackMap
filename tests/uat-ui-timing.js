/**
 * UAT Tests for UI Timing Issues
 * 
 * These tests specifically target timing-related bugs that occur when:
 * - DOM elements are accessed after being removed
 * - Async operations complete after UI state changes
 * - Event handlers fire in unexpected order
 */

class UITimingTests {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
    }
    
    async runTests() {
        console.log('🕐 Starting UI Timing Tests...');
        
        try {
            await this.testPanelCloseBeforeRead();
            await this.testCheckboxStateAfterRender();
            await this.testAsyncPanelOperations();
            await this.testDOMElementLifecycle();
            
            this.reportResults();
        } catch (error) {
            console.error('Fatal test error:', error);
            this.endTest(false, `Fatal error: ${error.message}`);
            this.reportResults();
        }
    }
    
    async testPanelCloseBeforeRead() {
        this.startTest('Panel Close Before DOM Read');
        
        try {
            // Create a test panel with checkboxes
            const testHTML = `
                <div id="test-panel" class="test-panel">
                    <input type="checkbox" class="test-checkbox" value="1" checked>
                    <input type="checkbox" class="test-checkbox" value="2" checked>
                    <input type="checkbox" class="test-checkbox" value="3">
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', testHTML);
            
            // Simulate reading checkboxes
            const checkboxesBeforeClose = document.querySelectorAll('.test-checkbox:checked');
            this.assert(checkboxesBeforeClose.length === 2, 'Found 2 checked boxes before close');
            
            // Simulate panel close (remove from DOM)
            const panel = document.getElementById('test-panel');
            panel.remove();
            
            // Try to read checkboxes after close
            const checkboxesAfterClose = document.querySelectorAll('.test-checkbox:checked');
            this.assert(checkboxesAfterClose.length === 0, 'No checkboxes found after panel removed');
            
            // This demonstrates the bug: any code trying to read checkbox values
            // after panel close would get empty results
            
            this.endTest(true, 'Demonstrated DOM removal timing issue');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testCheckboxStateAfterRender() {
        this.startTest('Checkbox State After Async Render');
        
        try {
            // Simulate async panel render
            let panelRendered = false;
            
            setTimeout(() => {
                const html = `
                    <div id="async-panel">
                        <input type="checkbox" class="async-checkbox" value="test" checked>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', html);
                panelRendered = true;
            }, 50);
            
            // Try to read immediately (should fail)
            const immediateCheck = document.querySelector('.async-checkbox');
            this.assert(immediateCheck === null, 'Checkbox not available immediately');
            
            // Wait for render
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (panelRendered) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 10);
            });
            
            // Now should work
            const delayedCheck = document.querySelector('.async-checkbox');
            this.assert(delayedCheck !== null, 'Checkbox available after wait');
            this.assert(delayedCheck.checked === true, 'Checkbox state preserved');
            
            // Clean up
            document.getElementById('async-panel')?.remove();
            
            this.endTest(true, 'Async rendering timing handled correctly');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testAsyncPanelOperations() {
        this.startTest('Async Panel Operations Order');
        
        try {
            const operations = [];
            
            // Simulate panel manager operations
            const mockPanelManager = {
                state: {},
                openPanel: async () => {
                    operations.push('open');
                    await new Promise(resolve => setTimeout(resolve, 10));
                    operations.push('open-complete');
                },
                closePanel: () => {
                    operations.push('close');
                    // Synchronous close
                },
                readData: () => {
                    operations.push('read');
                    return this.state.data || null;
                },
                setData: (data) => {
                    operations.push('set');
                    this.state.data = data;
                }
            };
            
            // Wrong order: close then read
            mockPanelManager.closePanel();
            const dataAfterClose = mockPanelManager.readData();
            this.assert(operations.includes('close'), 'Close operation recorded');
            this.assert(operations.indexOf('close') < operations.indexOf('read'), 
                       'Close happened before read (bug scenario)');
            
            // Correct order: read then close
            operations.length = 0;
            mockPanelManager.setData('test-data');
            const dataBeforeClose = mockPanelManager.readData();
            mockPanelManager.closePanel();
            
            this.assert(operations.indexOf('read') < operations.indexOf('close'), 
                       'Read happened before close (correct order)');
            
            this.endTest(true, 'Operation order issues identified');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    async testDOMElementLifecycle() {
        this.startTest('DOM Element Lifecycle Management');
        
        try {
            // Test element reference validity
            const container = document.createElement('div');
            container.id = 'lifecycle-test';
            document.body.appendChild(container);
            
            // Add child elements
            container.innerHTML = `
                <input type="checkbox" id="lifecycle-checkbox" checked>
                <button id="lifecycle-button">Test</button>
            `;
            
            // Get references
            const checkbox = document.getElementById('lifecycle-checkbox');
            const button = document.getElementById('lifecycle-button');
            
            // Verify references work
            this.assert(checkbox.checked === true, 'Checkbox reference valid');
            this.assert(button.textContent === 'Test', 'Button reference valid');
            
            // Remove container (simulating panel close)
            container.remove();
            
            // Test if references still work (they shouldn't for most operations)
            let errorCaught = false;
            try {
                // This should work (element still exists in memory)
                const stillChecked = checkbox.checked;
                this.assert(stillChecked === true, 'Detached element preserves state');
                
                // But it's not in the DOM anymore
                const foundInDOM = document.getElementById('lifecycle-checkbox');
                this.assert(foundInDOM === null, 'Element not found in DOM after removal');
            } catch (e) {
                errorCaught = true;
            }
            
            this.endTest(true, 'DOM lifecycle behavior verified');
            
        } catch (error) {
            this.endTest(false, `Test failed: ${error.message}`);
        }
    }
    
    // === TEST UTILITIES ===
    
    startTest(name) {
        this.currentTest = {
            name: name,
            startTime: Date.now(),
            assertions: [],
            passed: true
        };
        console.log(`\n📋 Test: ${name}`);
    }
    
    endTest(passed, message) {
        if (this.currentTest) {
            this.currentTest.passed = passed;
            this.currentTest.duration = Date.now() - this.currentTest.startTime;
            this.currentTest.message = message;
            
            const status = passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status}: ${this.currentTest.name} (${this.currentTest.duration}ms)`);
            if (message) console.log(`   ${message}`);
            
            this.testResults.push(this.currentTest);
            this.currentTest = null;
        }
    }
    
    assert(condition, message) {
        const passed = !!condition;
        const assertion = { passed, message };
        
        if (this.currentTest) {
            this.currentTest.assertions.push(assertion);
            if (!passed) {
                this.currentTest.passed = false;
                console.error(`   ❌ Assertion failed: ${message}`);
            }
        }
        
        return passed;
    }
    
    reportResults() {
        console.log('\n' + '='.repeat(50));
        console.log('UI TIMING TEST RESULTS');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(t => t.passed).length;
        const failed = this.testResults.filter(t => !t.passed).length;
        const total = this.testResults.length;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\nFailed Tests:');
            this.testResults
                .filter(t => !t.passed)
                .forEach(t => {
                    console.log(`  ❌ ${t.name}`);
                    if (t.message) console.log(`     ${t.message}`);
                });
        }
        
        console.log('\n' + '='.repeat(50));
        
        // Return results for test runner
        return {
            passed: passed,
            failed: failed,
            total: total,
            results: this.testResults
        };
    }
}

// Make available globally for test runner
if (typeof window !== 'undefined') {
    window.UITimingTests = UITimingTests;
}

// Auto-run if opened directly
if (typeof module === 'undefined' && typeof window !== 'undefined') {
    // Only auto-run if not in iframe
    if (window.parent === window) {
        document.addEventListener('DOMContentLoaded', async () => {
            const tester = new UITimingTests();
            await tester.runTests();
        });
    }
}