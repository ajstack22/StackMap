/**
 * Base class for story-based tests in StackMap
 * Provides common functionality and structured test flow
 */

class StoryTestBase {
    constructor(storyId, storyTitle) {
        this.storyId = storyId;
        this.storyTitle = storyTitle;
        this.testResults = [];
        this.currentScenario = null;
        this.startTime = null;
        this.endTime = null;
        
        // Get app context
        this.appWindow = window;
        this.appDocument = document;
        
        // Check if we're in test runner iframe
        if (window.parent && window.parent !== window) {
            this.appWindow = window;
            this.appDocument = document;
        } else if (document.getElementById('appFrame')) {
            const iframe = document.getElementById('appFrame');
            this.appWindow = iframe.contentWindow;
            this.appDocument = iframe.contentDocument;
        }
    }

    /**
     * Main test runner - override this in derived classes
     */
    async runStory() {
        throw new Error('runStory() must be implemented in derived class');
    }

    /**
     * Run the test story
     */
    async run() {
        console.log(`\n📖 Starting Story Test: ${this.storyId} - ${this.storyTitle}`);
        console.log('=' .repeat(60));
        
        this.startTime = Date.now();
        
        try {
            // Clear state for clean test
            await this.clearBrowserState();
            
            // Handle initial UI (splash screens, etc)
            await this.handleInitialUI();
            
            // Run the actual story tests
            await this.runStory();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error(`Story test failed: ${error.message}`);
            this.generateReport();
            throw error;
        }
    }

    /**
     * Start a test scenario
     */
    startScenario(name, acceptanceCriteria = []) {
        this.currentScenario = {
            name,
            acceptanceCriteria,
            steps: [],
            startTime: Date.now(),
            success: true
        };
        console.log(`\n🎬 Scenario: ${name}`);
    }

    /**
     * End current scenario
     */
    endScenario() {
        if (!this.currentScenario) return;
        
        this.currentScenario.endTime = Date.now();
        this.currentScenario.duration = this.currentScenario.endTime - this.currentScenario.startTime;
        
        this.testResults.push(this.currentScenario);
        
        const status = this.currentScenario.success ? '✅ PASSED' : '❌ FAILED';
        console.log(`${status} - ${this.currentScenario.name} (${this.currentScenario.duration}ms)`);
        
        // Check acceptance criteria
        if (this.currentScenario.acceptanceCriteria.length > 0) {
            console.log('\nAcceptance Criteria:');
            this.currentScenario.acceptanceCriteria.forEach(criteria => {
                const checkmark = criteria.met ? '✓' : '✗';
                console.log(`  ${checkmark} ${criteria.description}`);
            });
        }
        
        this.currentScenario = null;
    }

    /**
     * Execute a test step
     */
    async step(description, action) {
        if (!this.currentScenario) {
            throw new Error('No scenario started. Call startScenario() first.');
        }
        
        const step = {
            description,
            startTime: Date.now(),
            success: true,
            error: null
        };
        
        console.log(`  → ${description}`);
        
        try {
            await action();
            step.success = true;
            console.log(`    ✓ ${description}`);
        } catch (error) {
            step.success = false;
            step.error = error.message;
            this.currentScenario.success = false;
            console.log(`    ✗ ${description}: ${error.message}`);
            throw error;
        } finally {
            step.endTime = Date.now();
            step.duration = step.endTime - step.startTime;
            this.currentScenario.steps.push(step);
        }
    }

    /**
     * Assert a condition
     */
    assert(condition, message, acceptanceCriteriaIndex = null) {
        if (!condition) {
            if (this.currentScenario) {
                this.currentScenario.success = false;
            }
            throw new Error(`Assertion failed: ${message}`);
        }
        
        // Mark acceptance criteria as met if index provided
        if (acceptanceCriteriaIndex !== null && this.currentScenario) {
            if (this.currentScenario.acceptanceCriteria[acceptanceCriteriaIndex]) {
                this.currentScenario.acceptanceCriteria[acceptanceCriteriaIndex].met = true;
            }
        }
    }

    /**
     * Wait for a condition to be true
     */
    async waitFor(condition, timeout = 5000, message = 'Condition not met') {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            await this.wait(100);
        }
        
        throw new Error(`Timeout waiting for: ${message}`);
    }

    /**
     * Wait for element to be visible
     */
    async waitForElement(selector, timeout = 5000) {
        return this.waitFor(
            () => {
                const element = this.appDocument.querySelector(selector);
                return element && element.offsetParent !== null;
            },
            timeout,
            `Element ${selector} to be visible`
        );
    }

    /**
     * Simple wait helper
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear browser state for clean test
     */
    async clearBrowserState() {
        try {
            console.log('Clearing browser state...');
            
            if (this.appWindow.localStorage) {
                this.appWindow.localStorage.clear();
            }
            
            if (this.appWindow.sessionStorage) {
                this.appWindow.sessionStorage.clear();
            }
            
            // Reload iframe if present
            if (document.getElementById('appFrame')) {
                const iframe = document.getElementById('appFrame');
                iframe.src = iframe.src;
                
                return new Promise(resolve => {
                    iframe.onload = () => {
                        this.appWindow = iframe.contentWindow;
                        this.appDocument = iframe.contentDocument;
                        console.log('✓ Browser state cleared');
                        resolve();
                    };
                });
            }
        } catch (error) {
            console.warn('Could not clear browser state:', error.message);
        }
    }

    /**
     * Handle initial UI (splash screens, etc)
     */
    async handleInitialUI() {
        console.log('Handling initial UI...');
        
        // Handle splash screen
        const splashScreen = this.appDocument.getElementById('splashScreen');
        if (splashScreen && !splashScreen.classList.contains('hidden')) {
            await this.step('Complete splash screen setup', async () => {
                // Page 1
                const nextButton = this.appDocument.getElementById('splashNextButton');
                if (nextButton) {
                    nextButton.click();
                    await this.wait(500);
                }
                
                // Page 2
                const nameInput = this.appDocument.getElementById('splashUserName');
                if (nameInput) {
                    nameInput.value = 'Test User';
                    nameInput.dispatchEvent(new Event('input'));
                }
                
                const firstEmoji = this.appDocument.querySelector('.splash-emoji-option');
                if (firstEmoji) {
                    firstEmoji.click();
                }
                
                const startButton = this.appDocument.getElementById('splashStartButton');
                if (startButton) {
                    startButton.click();
                    await this.wait(1000);
                }
            });
        }
        
        // Wait for app initialization
        await this.waitFor(
            () => this.appDocument.querySelector('.btn--floating.preferences-button'),
            5000,
            'App to initialize'
        );
    }

    /**
     * Generate test report
     */
    generateReport() {
        this.endTime = Date.now();
        const totalDuration = this.endTime - this.startTime;
        
        console.log('\n' + '=' .repeat(60));
        console.log(`📊 Story Test Report: ${this.storyId}`);
        console.log('=' .repeat(60));
        
        const totalScenarios = this.testResults.length;
        const passedScenarios = this.testResults.filter(s => s.success).length;
        const failedScenarios = totalScenarios - passedScenarios;
        
        console.log(`\nStory: ${this.storyTitle}`);
        console.log(`Total Scenarios: ${totalScenarios}`);
        console.log(`Passed: ${passedScenarios}`);
        console.log(`Failed: ${failedScenarios}`);
        console.log(`Success Rate: ${Math.round((passedScenarios / totalScenarios) * 100)}%`);
        console.log(`Total Duration: ${totalDuration}ms`);
        
        if (failedScenarios > 0) {
            console.log('\n❌ Failed Scenarios:');
            this.testResults.filter(s => !s.success).forEach(scenario => {
                console.log(`  - ${scenario.name}`);
                scenario.steps.filter(step => !step.success).forEach(step => {
                    console.log(`    → ${step.description}: ${step.error}`);
                });
            });
        }
        
        // Generate JSON report for CI
        const report = {
            storyId: this.storyId,
            storyTitle: this.storyTitle,
            timestamp: new Date().toISOString(),
            duration: totalDuration,
            scenarios: {
                total: totalScenarios,
                passed: passedScenarios,
                failed: failedScenarios
            },
            results: this.testResults
        };
        
        // Store report for CI consumption
        if (this.appWindow.testReports) {
            this.appWindow.testReports.push(report);
        } else {
            this.appWindow.testReports = [report];
        }
        
        return report;
    }

    /**
     * Common helper methods
     */
    
    async openSettings() {
        const settingsButton = this.appDocument.querySelector('.btn--floating.preferences-button');
        if (settingsButton) {
            settingsButton.click();
            await this.wait(500);
            return true;
        }
        return false;
    }

    async closeSettings() {
        const closeButton = this.appDocument.querySelector('.hybrid-panel.open .panel-close');
        if (closeButton) {
            closeButton.click();
            await this.wait(300);
            return true;
        }
        return false;
    }

    async enterEditMode() {
        await this.openSettings();
        
        const editBtn = this.appDocument.getElementById('editModeBtn');
        if (editBtn && !editBtn.classList.contains('segment--active')) {
            editBtn.click();
            await this.wait(300);
            
            // Handle validation
            const validationInput = this.appDocument.getElementById('validationInput');
            const validationSubmit = this.appDocument.getElementById('validationSubmit');
            
            if (validationInput && validationSubmit) {
                validationInput.value = 'A';
                validationSubmit.click();
                await this.wait(500);
            }
        }
        
        await this.closeSettings();
    }

    async exitEditMode() {
        await this.openSettings();
        
        const viewBtn = this.appDocument.getElementById('viewModeBtn');
        if (viewBtn) {
            viewBtn.click();
            await this.wait(300);
        }
        
        await this.closeSettings();
    }
}

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoryTestBase;
}