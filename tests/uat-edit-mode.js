/**
 * User Acceptance Tests for Edit Mode Functionality
 * 
 * This test suite validates that edit mode can be toggled on/off
 * and that expected UI changes occur during transitions
 */

class EditModeUAT {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
        // Get the app window from iframe if we're in test runner
        this.appWindow = window;
        this.appDocument = document;
        
        // Check if we're in the test runner iframe
        if (window.parent && window.parent !== window) {
            // We're in the iframe, use the current context
            this.appWindow = window;
            this.appDocument = document;
        } else if (document.getElementById('appFrame')) {
            // We're in the test runner, get the iframe context
            const iframe = document.getElementById('appFrame');
            this.appWindow = iframe.contentWindow;
            this.appDocument = iframe.contentDocument;
        }
    }

    // Clear browser state for clean test run
    clearBrowserState() {
        try {
            // Clear localStorage
            if (this.appWindow.localStorage) {
                console.log('Clearing localStorage for clean test...');
                // Save any critical data if needed
                const criticalKeys = []; // Add keys to preserve if needed
                const preserved = {};
                criticalKeys.forEach(key => {
                    preserved[key] = this.appWindow.localStorage.getItem(key);
                });
                
                // Clear all
                this.appWindow.localStorage.clear();
                
                // Specifically remove splash screen flag to ensure it shows
                this.appWindow.localStorage.removeItem('stackmap-splash-seen');
                this.appWindow.localStorage.removeItem('stackmap-users');
                
                // Restore critical data
                Object.entries(preserved).forEach(([key, value]) => {
                    if (value !== null) {
                        this.appWindow.localStorage.setItem(key, value);
                    }
                });
            }
            
            // Clear sessionStorage
            if (this.appWindow.sessionStorage) {
                this.appWindow.sessionStorage.clear();
            }
            
            console.log('✓ Browser state cleared');
            
            // Reload the iframe to ensure fresh state
            if (document.getElementById('appFrame')) {
                console.log('Reloading app iframe...');
                const iframe = document.getElementById('appFrame');
                iframe.src = iframe.src;
                // Wait for reload
                return new Promise(resolve => {
                    iframe.onload = () => {
                        // Update references after reload
                        this.appWindow = iframe.contentWindow;
                        this.appDocument = iframe.contentDocument;
                        console.log('✓ App reloaded with fresh state');
                        resolve();
                    };
                });
            }
        } catch (error) {
            console.warn('Could not clear browser state:', error.message);
        }
    }

    // Test runner
    async runTests() {
        console.log('🧪 Starting Edit Mode UAT...\n');
        
        try {
            // Clear browser state for clean test
            await this.clearBrowserState();
            
            // First, handle the welcome screen if present
            await this.handleWelcomeScreen();
            
            await this.testEditModeToggle();
            await this.testEditButtonsVisibility();
            await this.testCardResizing();
            await this.testDrawerBehavior();
            await this.testPanelClosing();
            await this.testFABClickToClose();
            await this.testErrorHandling();
            
            this.reportResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    // Helper method to open settings panel
    async openSettingsPanel() {
        // Try multiple selectors
        const settingsButton = this.appDocument.querySelector('.btn--floating.preferences-button') ||
                              this.appDocument.querySelector('.preferences-button') ||
                              this.appDocument.querySelector('[aria-label*="Settings"]') ||
                              this.appDocument.querySelector('[aria-label*="settings"]') ||
                              Array.from(this.appDocument.querySelectorAll('.material-icons')).find(el => el.textContent === 'settings')?.parentElement ||
                              Array.from(this.appDocument.querySelectorAll('button')).find(btn => btn.querySelector('.material-icons')?.textContent === 'settings');
                              
        if (settingsButton) {
            console.log('Clicking settings button to open panel...');
            settingsButton.click();
            await this.wait(500); // Wait for panel animation
            
            // Verify panel opened
            const panel = this.appDocument.querySelector('.hybrid-panel.open') || 
                         this.appDocument.querySelector('#hybridRightPanel.open');
            if (panel) {
                console.log('✓ Settings panel opened');
                return true;
            } else {
                console.warn('Settings panel may not have opened properly');
            }
        } else {
            console.error('Settings button not found');
        }
        return false;
    }
    
    // Helper method to close settings panel
    async closeSettingsPanel() {
        const closeButton = this.appDocument.querySelector('.hybrid-panel.open .panel-close');
        if (closeButton) {
            closeButton.click();
            await this.wait(300);
        }
    }
    
    // Helper method to handle validation modal
    async handleValidationModal() {
        const validationModal = this.appDocument.querySelector('.modal-overlay');
        if (validationModal && validationModal.style.display !== 'none') {
            console.log('Validation modal detected, entering backdoor code...');
            
            // Find the input field
            const validationInput = this.appDocument.querySelector('#validationInput') ||
                                   this.appDocument.querySelector('.modal-input') ||
                                   this.appDocument.querySelector('input[type="text"]');
                                   
            if (validationInput) {
                // Use backdoor code 'A'
                validationInput.value = 'A';
                validationInput.dispatchEvent(new Event('input'));
                console.log('✓ Entered backdoor code "A"');
                
                // Find and click submit button
                const submitButton = this.appDocument.querySelector('.modal-button-primary') ||
                                    Array.from(this.appDocument.querySelectorAll('button')).find(btn => 
                                        btn.textContent.includes('Submit') || 
                                        btn.textContent.includes('Continue') ||
                                        btn.textContent.includes('OK'));
                                        
                if (submitButton) {
                    await this.wait(100); // Small delay to ensure input is registered
                    submitButton.click();
                    await this.wait(500);
                    console.log('✓ Validation modal dismissed with backdoor');
                    return true;
                }
            }
        }
        return false;
    }

    // Handle welcome screen if present
    async handleWelcomeScreen() {
        console.log('Checking for welcome/splash screens...');
        
        // Check for modern splash screen
        const splashScreen = this.appDocument.getElementById('splashScreen');
        if (splashScreen && !splashScreen.classList.contains('hidden')) {
            console.log('Splash screen detected, completing setup...');
            
            // Check which page we're on
            const page1 = this.appDocument.getElementById('splashPage1');
            const page2 = this.appDocument.getElementById('splashPage2');
            
            if (page1 && !page1.classList.contains('hidden')) {
                // On page 1, click Next
                const nextButton = this.appDocument.getElementById('splashNextButton');
                if (nextButton) {
                    nextButton.click();
                    await this.wait(500);
                }
            }
            
            // Now on page 2, fill in details
            const nameInput = this.appDocument.getElementById('splashUserName');
            if (nameInput) {
                nameInput.value = 'Test User';
                nameInput.dispatchEvent(new Event('input'));
            }
            
            // Select first emoji
            const firstEmoji = this.appDocument.querySelector('.splash-emoji-option');
            if (firstEmoji) {
                firstEmoji.click();
            }
            
            // Click start button
            const startButton = this.appDocument.getElementById('splashStartButton');
            if (startButton) {
                startButton.click();
                await this.wait(1000); // Wait for transition
                console.log('✓ Splash screen completed');
            }
        }
        
        // Check for legacy welcome splash
        const welcomeSplash = this.appDocument.getElementById('welcomeSplash');
        if (welcomeSplash && welcomeSplash.style.display !== 'none') {
            console.log('Legacy welcome screen detected, dismissing...');
            const getStartedButton = welcomeSplash.querySelector('button');
            if (getStartedButton) {
                getStartedButton.click();
                await this.wait(500);
                console.log('✓ Welcome screen dismissed');
            }
        }
        
        // Wait a bit for app to fully initialize
        await this.wait(1000);
        
        // Verify we can now access the main app elements
        const header = this.appDocument.querySelector('.header-content');
        if (!header) {
            console.warn('Header not found, app may still be initializing...');
            await this.wait(2000);
        }
        
        // Wait for floating buttons to appear
        console.log('Waiting for app to fully initialize...');
        const maxWaitTime = 5000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            // Try multiple selectors for the settings button
            const settingsButton = this.appDocument.querySelector('.btn--floating.preferences-button') ||
                                  this.appDocument.querySelector('.preferences-button') ||
                                  this.appDocument.querySelector('[aria-label*="Settings"]') ||
                                  this.appDocument.querySelector('[aria-label*="settings"]') ||
                                  Array.from(this.appDocument.querySelectorAll('.material-icons')).find(el => el.textContent === 'settings')?.parentElement ||
                                  Array.from(this.appDocument.querySelectorAll('button')).find(btn => btn.querySelector('.material-icons')?.textContent === 'settings');
            
            if (settingsButton) {
                console.log('✓ App fully initialized, settings button found');
                break;
            }
            await this.wait(100);
        }
        
        // Final check with multiple selectors
        const settingsButton = this.appDocument.querySelector('.btn--floating.preferences-button') ||
                              this.appDocument.querySelector('.preferences-button') ||
                              this.appDocument.querySelector('[aria-label*="Settings"]') ||
                              this.appDocument.querySelector('[aria-label*="settings"]') ||
                              Array.from(this.appDocument.querySelectorAll('.material-icons')).find(el => el.textContent === 'settings')?.parentElement ||
                              Array.from(this.appDocument.querySelectorAll('button')).find(btn => btn.querySelector('.material-icons')?.textContent === 'settings');
                              
        if (!settingsButton) {
            // Log what we can find for debugging
            console.log('Available buttons:', this.appDocument.querySelectorAll('button').length);
            console.log('Material icons found:', Array.from(this.appDocument.querySelectorAll('.material-icons')).map(el => el.textContent));
            throw new Error('Settings button not found after waiting. App may not be fully initialized.');
        }
    }

    // Test 1: Edit mode can be toggled on and off
    async testEditModeToggle() {
        this.startTest('Edit Mode Toggle');
        
        try {
            // First, open the settings panel where the edit mode toggle is located
            const settingsOpened = await this.openSettingsPanel();
            this.assert(settingsOpened, 'Settings panel opened successfully');
            
            // Now find edit mode toggle in the panel
            const toggle = this.appDocument.getElementById('editModeSwitch');
            this.assert(toggle, 'Edit mode toggle exists');
            
            // Test turning on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(500);
            
            // Handle validation modal if it appears
            await this.handleValidationModal();
            
            this.assert(this.appDocument.body.classList.contains('grownup-mode'), 'Body has grownup-mode class when edit mode is on');
            this.assert(this.appWindow.app && this.appWindow.app.grownupMode === true, 'App grownupMode state is true');
            
            // Test turning off edit mode
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(100);
            
            this.assert(!this.appDocument.body.classList.contains('grownup-mode'), 'Body does not have grownup-mode class when edit mode is off');
            this.assert(this.appWindow.app && this.appWindow.app.grownupMode === false, 'App grownupMode state is false');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 2: Edit buttons appear/disappear correctly
    async testEditButtonsVisibility() {
        this.startTest('Edit Buttons Visibility');
        
        try {
            // Open settings panel to access toggle
            await this.openSettingsPanel();
            
            const toggle = this.appDocument.getElementById('editModeSwitch');
            
            // Turn on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(500);
            
            // Handle validation modal if it appears
            await this.handleValidationModal();
            
            // Check for edit buttons
            const editButtons = this.appDocument.querySelectorAll('.btn--checkbox, .btn--visibility, .btn--duplicate, .btn--delete');
            this.assert(editButtons.length > 0, `Edit buttons are visible (found ${editButtons.length} buttons)`);
            
            // Check each card has buttons
            const cards = this.appDocument.querySelectorAll('.activity-card');
            let cardsWithButtons = 0;
            cards.forEach(card => {
                const buttons = card.querySelectorAll('.btn--round');
                if (buttons.length === 4) cardsWithButtons++;
            });
            this.assert(cardsWithButtons === cards.length, `All cards have edit buttons (${cardsWithButtons}/${cards.length})`);
            
            // Turn off edit mode
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(200);
            
            // Check buttons are gone
            const editButtonsAfter = this.appDocument.querySelectorAll('.btn--checkbox, .btn--visibility, .btn--duplicate, .btn--delete');
            this.assert(editButtonsAfter.length === 0, 'Edit buttons are hidden when edit mode is off');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 3: Cards resize properly
    async testCardResizing() {
        this.startTest('Card Resizing');
        
        try {
            // First close any open panels to see cards
            await this.closeSettingsPanel();
            await this.wait(300);
            
            // Find a card before opening settings
            const card = this.appDocument.querySelector('.activity-card');
            
            if (!card) {
                this.endTest(false, 'No activity cards found');
                return;
            }
            
            // Now open settings panel to access toggle
            await this.openSettingsPanel();
            
            const toggle = this.appDocument.getElementById('editModeSwitch');
            
            // Get initial card dimensions
            const initialHeight = card.offsetHeight;
            
            // Turn on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(500);
            
            // Handle validation modal if it appears
            await this.handleValidationModal();
            
            // Cards should have space for buttons
            const editModeHeight = card.offsetHeight;
            this.assert(editModeHeight >= initialHeight, 'Cards maintain or increase height in edit mode');
            
            // Turn off edit mode
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(300);
            
            // Cards should return to original size
            const finalHeight = card.offsetHeight;
            this.assert(Math.abs(finalHeight - initialHeight) < 5, 'Cards return to original size after exiting edit mode');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 4: Drawer behavior in edit mode
    async testDrawerBehavior() {
        this.startTest('Drawer Behavior');
        
        try {
            // Open settings panel to access toggle
            await this.openSettingsPanel();
            
            const toggle = this.appDocument.getElementById('editModeSwitch');
            const drawer = this.appDocument.querySelector('.drawer');
            
            // Turn on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(500);
            
            // Handle validation modal if it appears
            await this.handleValidationModal();
            
            // Drawer should be forced open and locked
            this.assert(drawer && drawer.classList.contains('open'), 'Drawer is forced open in edit mode');
            this.assert(drawer && drawer.classList.contains('locked'), 'Drawer is locked in edit mode');
            
            // Turn off edit mode
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(200);
            
            // Drawer should be unlocked
            this.assert(!drawer.classList.contains('locked'), 'Drawer is unlocked after exiting edit mode');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 5: Panels close when exiting edit mode
    async testPanelClosing() {
        this.startTest('Panel Closing on Exit');
        
        try {
            // Open settings panel to access toggle
            await this.openSettingsPanel();
            
            const toggle = this.appDocument.getElementById('editModeSwitch');
            
            // Turn on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(500);
            
            // Handle validation modal if it appears
            await this.handleValidationModal();
            
            // Open a panel (if available)
            const prefsButton = this.appDocument.querySelector('.preferences-button');
            if (prefsButton) {
                prefsButton.click();
                await this.wait(200);
            }
            
            // Turn off edit mode
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(200);
            
            // Check all panels are closed
            const openPanels = this.appDocument.querySelectorAll('.hybrid-panel.open');
            this.assert(openPanels.length === 0, 'All panels are closed when exiting edit mode');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 6: FAB click to close functionality
    async testFABClickToClose() {
        this.startTest('FAB Click to Close');
        
        try {
            // Open settings panel to access toggle
            await this.openSettingsPanel();
            
            const toggle = this.appDocument.getElementById('editModeSwitch');
            
            // Turn on edit mode to show FAB
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(500);
            
            // Handle validation modal if it appears
            await this.handleValidationModal();
            
            // Find the FAB
            const fab = this.appDocument.querySelector('.fab') || 
                       this.appDocument.querySelector('.fab-container') ||
                       this.appDocument.querySelector('#edit-mode-fab');
            this.assert(fab, 'FAB exists in edit mode');
            
            // Check visibility - FAB might use different methods
            const fabButton = this.appDocument.querySelector('#edit-mode-fab');
            const isVisible = fabButton && (
                fabButton.style.transform.includes('scale(1)') ||
                fabButton.style.opacity === '1' ||
                !fabButton.classList.contains('hidden')
            );
            this.assert(isVisible, 'FAB is visible in edit mode');
            
            // Check if FAB button can be clicked
            this.assert(fabButton, 'FAB button exists');
            
            // Click FAB to open menu
            fabButton.click();
            await this.wait(300);
            
            // Check if menu is open - look for sub-FABs or expanded state
            const subFabs = this.appDocument.querySelectorAll('.btn--fab-sub');
            const fabContainer = this.appDocument.querySelector('.fab-container');
            const isMenuOpen = subFabs.length > 0 && (
                Array.from(subFabs).some(sub => sub.style.opacity === '1' || sub.style.transform.includes('scale(1)')) ||
                (fabContainer && fabContainer.querySelector('.fab-actions.expanded'))
            );
            this.assert(isMenuOpen, 'FAB menu opens when clicked');
            
            // Click FAB again to close menu
            fabButton.click();
            await this.wait(300);
            
            // Check if menu is closed - sub-FABs should be hidden
            await this.wait(100); // Extra wait for animation
            const subFabsAfterClose = this.appDocument.querySelectorAll('.btn--fab-sub');
            const isMenuClosed = subFabsAfterClose.length === 0 || 
                                Array.from(subFabsAfterClose).every(sub => 
                                    sub.style.opacity === '0' || 
                                    sub.style.transform.includes('scale(0)') ||
                                    sub.style.display === 'none'
                                );
            this.assert(isMenuClosed, 'FAB menu closes when clicked again');
            
            // Test clicking outside to close
            fabButton.click(); // Open again
            await this.wait(300);
            
            // Click outside
            this.appDocument.body.click();
            await this.wait(300);
            
            const isClosedByOutsideClick = !fab.classList.contains('open') || (fabMenu && this.appWindow.getComputedStyle(fabMenu).opacity === '0');
            this.assert(isClosedByOutsideClick, 'FAB menu closes when clicking outside');
            
            // Turn off edit mode
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(200);
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 7: Error handling
    async testErrorHandling() {
        this.startTest('Error Handling');
        
        try {
            // Check that the fixes we made are working
            const errors = [];
            
            // Test 1: No console errors during toggle
            const originalError = console.error;
            console.error = (msg) => {
                errors.push(msg);
                originalError(msg);
            };
            
            // Open settings panel to access toggle
            await this.openSettingsPanel();
            
            const toggle = this.appDocument.getElementById('editModeSwitch');
            
            // Toggle on
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(500);
            
            // Handle validation modal if it appears
            await this.handleValidationModal();
            
            // Toggle off
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(100);
            
            console.error = originalError;
            
            this.assert(errors.length === 0, `No console errors during toggle (found ${errors.length} errors)`);
            
            // Test 2: Required functions exist
            // Try multiple ways to find the app instance
            let app = this.appWindow.app || 
                     this.appWindow.window?.app || 
                     this.appWindow.StackMapApp ||
                     this.appWindow.stackMapApp;
                     
            // If not found, try looking for it in global scope
            if (!app && this.appWindow.window) {
                const globals = Object.keys(this.appWindow.window);
                const appKey = globals.find(key => 
                    key.toLowerCase().includes('app') && 
                    typeof this.appWindow.window[key] === 'object' &&
                    this.appWindow.window[key]?.enterGrownupMode
                );
                if (appKey) {
                    app = this.appWindow.window[appKey];
                }
            }
            
            this.assert(app, 'App instance exists');
            
            // Check if methods exist directly on app or through hybrid panel manager
            const hasEnterMethod = app?.enterGrownupMode || 
                                  this.appWindow.hybridPanelManager?.enterEditMode ||
                                  this.appDocument.querySelector('[onclick*="enterGrownupMode"]');
            const hasExitMethod = app?.exitGrownupMode || 
                                 this.appWindow.hybridPanelManager?.exitEditMode ||
                                 this.appDocument.querySelector('[onclick*="exitGrownupMode"]');
                                 
            this.assert(hasEnterMethod, 'Edit mode enter functionality exists');
            this.assert(hasExitMethod, 'Edit mode exit functionality exists');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Helper methods
    startTest(name) {
        this.currentTest = { name, assertions: [] };
        console.log(`\n📋 Testing: ${name}`);
    }

    endTest(success, error = null) {
        this.currentTest.success = success;
        this.currentTest.error = error;
        this.testResults.push(this.currentTest);
        
        if (success) {
            console.log(`✅ ${this.currentTest.name} - PASSED`);
        } else {
            console.log(`❌ ${this.currentTest.name} - FAILED: ${error}`);
        }
    }

    assert(condition, message) {
        this.currentTest.assertions.push({ condition, message });
        if (!condition) {
            throw new Error(message);
        } else {
            console.log(`   ✓ ${message}`);
        }
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    reportResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(t => t.success).length;
        const total = this.testResults.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log(`\nTotal Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Success Rate: ${percentage}%`);
        
        if (passed === total) {
            console.log('\n🎉 All tests passed!');
        } else {
            console.log('\n⚠️  Some tests failed. Please review the errors above.');
            
            // List failed tests
            console.log('\nFailed Tests:');
            this.testResults.filter(t => !t.success).forEach(test => {
                console.log(`  - ${test.name}: ${test.error}`);
            });
        }
        
        return passed === total;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditModeUAT;
} else {
    window.EditModeUAT = EditModeUAT;
}