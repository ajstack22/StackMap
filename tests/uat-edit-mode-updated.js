/**
 * Updated User Acceptance Tests for Edit Mode Functionality
 * 
 * This test suite validates the new View/Edit mode segmented control
 * and the updated UI behavior in edit mode
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
    async clearBrowserState() {
        try {
            // Clear localStorage
            if (this.appWindow.localStorage) {
                console.log('Clearing localStorage for clean test...');
                // Clear all
                this.appWindow.localStorage.clear();
                
                // Specifically remove splash screen flag to ensure it shows
                this.appWindow.localStorage.removeItem('stackmap-splash-seen');
                this.appWindow.localStorage.removeItem('stackmap-users');
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
        console.log('🧪 Starting Edit Mode UAT (Updated for new UI)...\n');
        
        try {
            // Clear browser state for clean test
            await this.clearBrowserState();
            
            // First, handle the welcome screen if present
            await this.handleWelcomeScreen();
            
            // Run updated tests
            await this.testEditModeSegmentedControl();
            await this.testEditModeUIChanges();
            await this.testKeepDiscardButtons();
            await this.testCardMenuButton();
            await this.testFABBehavior();
            await this.testPanelClosing();
            await this.testValidationModal();
            
            this.reportResults();
        } catch (error) {
            console.error('Test suite failed:', error.message);
            this.reportResults();
        }
    }

    // Helper method to wait
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper method to handle welcome/splash screens
    async handleWelcomeScreen() {
        console.log('Checking for welcome/splash screens...');
        
        // Check for new two-page splash screen
        const splashScreen = this.appDocument.getElementById('splashScreen');
        if (splashScreen && !splashScreen.classList.contains('hidden')) {
            console.log('Splash screen detected, completing setup...');
            
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
        
        // Wait for app to fully initialize
        await this.wait(1000);
        
        // Verify we can access the main app elements
        console.log('Waiting for app to fully initialize...');
        const maxWaitTime = 5000;
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            const settingsButton = this.findSettingsButton();
            if (settingsButton) {
                console.log('✓ App fully initialized, settings button found');
                break;
            }
            await this.wait(100);
        }
    }

    // Helper to find settings button with multiple selectors
    findSettingsButton() {
        return this.appDocument.querySelector('.btn--floating.preferences-button') ||
               this.appDocument.querySelector('.preferences-button') ||
               this.appDocument.querySelector('[aria-label*="Settings"]') ||
               this.appDocument.querySelector('[aria-label*="settings"]') ||
               Array.from(this.appDocument.querySelectorAll('.material-icons')).find(el => el.textContent === 'settings')?.parentElement ||
               Array.from(this.appDocument.querySelectorAll('button')).find(btn => btn.querySelector('.material-icons')?.textContent === 'settings');
    }

    // Helper method to open settings panel
    async openSettingsPanel() {
        const settingsButton = this.findSettingsButton();
        
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
        const closeButton = this.appDocument.querySelector('.hybrid-panel.open .panel-close') ||
                           this.appDocument.querySelector('#hybridRightPanel.open .panel-close');
        if (closeButton) {
            closeButton.click();
            await this.wait(300);
        }
    }

    // Helper to ensure we're in a clean state (view mode)
    async ensureCleanState() {
        // Check if we're in edit mode
        if (this.appDocument.body.classList.contains('grownup-mode')) {
            console.log('In edit mode, switching to view mode...');
            await this.openSettingsPanel();
            
            // Find View button in segmented control
            const viewBtn = this.appDocument.getElementById('viewModeBtn');
            if (viewBtn) {
                viewBtn.click();
                await this.wait(300);
            }
            
            await this.closeSettingsPanel();
        }
    }

    // Test 1: Segmented control for View/Edit modes
    async testEditModeSegmentedControl() {
        this.startTest('Edit Mode Segmented Control');
        
        try {
            await this.ensureCleanState();
            
            // Open settings panel
            const settingsOpened = await this.openSettingsPanel();
            this.assert(settingsOpened, 'Settings panel opened successfully');
            
            // Find segmented control buttons
            const viewBtn = this.appDocument.getElementById('viewModeBtn');
            const editBtn = this.appDocument.getElementById('editModeBtn');
            
            this.assert(viewBtn, 'View mode button exists');
            this.assert(editBtn, 'Edit mode button exists');
            
            // Check initial state (should be in view mode)
            this.assert(viewBtn.classList.contains('segment--active'), 'View button is active initially');
            this.assert(!editBtn.classList.contains('segment--active'), 'Edit button is not active initially');
            this.assert(!this.appDocument.body.classList.contains('grownup-mode'), 'Not in grownup mode initially');
            
            // Click Edit button
            editBtn.click();
            await this.wait(300);
            
            // Validation modal should appear
            const validationSection = this.appDocument.getElementById('validationSection');
            this.assert(validationSection && validationSection.style.display !== 'none', 'Validation section appears');
            
            // Enter validation answer
            await this.handleValidationModal();
            
            // Check edit mode is active
            this.assert(this.appDocument.body.classList.contains('grownup-mode'), 'Body has grownup-mode class');
            this.assert(editBtn.classList.contains('segment--active'), 'Edit button is active');
            this.assert(!viewBtn.classList.contains('segment--active'), 'View button is not active');
            
            // Switch back to view mode
            viewBtn.click();
            await this.wait(300);
            
            this.assert(!this.appDocument.body.classList.contains('grownup-mode'), 'Exited grownup mode');
            this.assert(viewBtn.classList.contains('segment--active'), 'View button is active again');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 2: UI changes in edit mode
    async testEditModeUIChanges() {
        this.startTest('Edit Mode UI Changes');
        
        try {
            await this.ensureCleanState();
            await this.openSettingsPanel();
            
            // Enter edit mode
            const editBtn = this.appDocument.getElementById('editModeBtn');
            editBtn.click();
            await this.wait(300);
            await this.handleValidationModal();
            
            // Check for FAB
            const fab = this.appDocument.querySelector('#edit-mode-fab');
            this.assert(fab, 'FAB appears in edit mode');
            
            // Check for card type indicators on cards
            const cards = this.appDocument.querySelectorAll('.card:not(.management-card):not(.edit-info-card)');
            if (cards.length > 0) {
                const cardTypeIndicators = this.appDocument.querySelectorAll('.card__type-indicator');
                this.assert(cardTypeIndicators.length > 0, 'Card type indicators visible in edit mode');
            } else {
                console.log('No cards present to test type indicators');
                this.assert(true, 'No cards to test - skipping type indicator check');
            }
            
            // Return to view mode
            const viewBtn = this.appDocument.getElementById('viewModeBtn');
            viewBtn.click();
            await this.wait(300);
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 3: Keep/Discard buttons (replaces hide/show)
    async testKeepDiscardButtons() {
        this.startTest('Keep/Discard Buttons');
        
        try {
            await this.ensureCleanState();
            
            // Need to have cards first
            await this.createTestCard();
            
            await this.openSettingsPanel();
            
            // Enter edit mode
            const editBtn = this.appDocument.getElementById('editModeBtn');
            editBtn.click();
            await this.wait(300);
            await this.handleValidationModal();
            
            // Close settings to see cards
            await this.closeSettingsPanel();
            await this.wait(300);
            
            // Find cards
            const cards = this.appDocument.querySelectorAll('.card:not(.management-card):not(.edit-info-card)');
            this.assert(cards.length > 0, `Found ${cards.length} card(s)`);
            
            if (cards.length > 0) {
                const firstCard = cards[0];
                
                // Look for menu button instead of individual buttons
                const menuBtn = firstCard.querySelector('.btn--menu');
                this.assert(menuBtn, 'Menu button exists on card');
                
                // Click menu button
                if (menuBtn) {
                    menuBtn.click();
                    await this.wait(200);
                    
                    // Check for card menu
                    const cardMenu = this.appDocument.querySelector('.card-menu--open');
                    this.assert(cardMenu, 'Card menu opens');
                    
                    // Check for Keep/Discard options
                    const menuOptions = cardMenu?.querySelectorAll('.card-menu__option');
                    const hasKeepDiscard = Array.from(menuOptions || []).some(opt => 
                        opt.textContent.includes('Keep') || opt.textContent.includes('Discard')
                    );
                    this.assert(hasKeepDiscard, 'Keep/Discard options available in menu');
                    
                    // Close menu
                    this.appDocument.body.click();
                    await this.wait(200);
                }
            }
            
            // Return to view mode
            await this.openSettingsPanel();
            const viewBtn = this.appDocument.getElementById('viewModeBtn');
            viewBtn.click();
            await this.wait(300);
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 4: Card menu button behavior
    async testCardMenuButton() {
        this.startTest('Card Menu Button');
        
        try {
            await this.ensureCleanState();
            await this.createTestCard();
            await this.openSettingsPanel();
            
            // Enter edit mode
            const editBtn = this.appDocument.getElementById('editModeBtn');
            editBtn.click();
            await this.wait(300);
            await this.handleValidationModal();
            
            // Close settings
            await this.closeSettingsPanel();
            await this.wait(300);
            
            // Find a card with menu button
            const card = this.appDocument.querySelector('.card:not(.management-card):not(.edit-info-card)');
            if (card) {
                const menuBtn = card.querySelector('.btn--menu');
                this.assert(menuBtn, 'Menu button exists');
                
                // Test menu open/close
                if (menuBtn) {
                    menuBtn.click();
                    await this.wait(200);
                    
                    const menu = this.appDocument.querySelector('.card-menu--open');
                    this.assert(menu, 'Card menu opens on click');
                    
                    // Click outside to close
                    this.appDocument.body.click();
                    await this.wait(200);
                    
                    const menuClosed = !this.appDocument.querySelector('.card-menu--open');
                    this.assert(menuClosed, 'Card menu closes when clicking outside');
                }
            }
            
            // Return to view mode
            await this.openSettingsPanel();
            const viewBtn = this.appDocument.getElementById('viewModeBtn');
            viewBtn.click();
            await this.wait(300);
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 5: FAB behavior (now opens Settings directly)
    async testFABBehavior() {
        this.startTest('FAB Behavior - Direct to Settings');
        
        try {
            await this.ensureCleanState();
            await this.openSettingsPanel();
            
            // Enter edit mode
            const editBtn = this.appDocument.getElementById('editModeBtn');
            editBtn.click();
            await this.wait(300);
            await this.handleValidationModal();
            
            // Close settings to see FAB
            await this.closeSettingsPanel();
            await this.wait(300);
            
            // Find FAB
            const fab = this.appDocument.querySelector('#edit-mode-fab');
            this.assert(fab, 'FAB exists in edit mode');
            
            // Click FAB
            if (fab) {
                fab.click();
                await this.wait(500);
                
                // Check that Settings panel opened
                const settingsPanel = this.appDocument.querySelector('.hybrid-panel.open');
                this.assert(settingsPanel, 'FAB opens Settings panel directly');
                
                // Check for Actions section
                const actionsSection = Array.from(this.appDocument.querySelectorAll('.panel-section')).find(section => 
                    section.textContent.includes('Actions')
                );
                this.assert(actionsSection, 'Actions section visible in Settings');
            }
            
            // Close and return to view mode
            const viewBtn = this.appDocument.getElementById('viewModeBtn');
            viewBtn.click();
            await this.wait(300);
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 6: Panels close when exiting edit mode
    async testPanelClosing() {
        this.startTest('Panel Closing on Exit');
        
        try {
            await this.ensureCleanState();
            await this.openSettingsPanel();
            
            // Enter edit mode
            const editBtn = this.appDocument.getElementById('editModeBtn');
            editBtn.click();
            await this.wait(300);
            await this.handleValidationModal();
            
            // Settings panel should still be open
            let openPanel = this.appDocument.querySelector('.hybrid-panel.open');
            this.assert(openPanel, 'Panel remains open in edit mode');
            
            // Exit edit mode
            const viewBtn = this.appDocument.getElementById('viewModeBtn');
            viewBtn.click();
            await this.wait(500);
            
            // Check panels are closed
            openPanel = this.appDocument.querySelector('.hybrid-panel.open');
            this.assert(!openPanel, 'Panels close when exiting edit mode');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 7: Validation modal
    async testValidationModal() {
        this.startTest('Validation Modal');
        
        try {
            await this.ensureCleanState();
            await this.openSettingsPanel();
            
            // Click edit button
            const editBtn = this.appDocument.getElementById('editModeBtn');
            editBtn.click();
            await this.wait(300);
            
            // Check validation section appears
            const validationSection = this.appDocument.getElementById('validationSection');
            this.assert(validationSection && validationSection.style.display !== 'none', 'Validation section appears');
            
            // Check for validation elements
            const validationInput = this.appDocument.getElementById('validationInput');
            const validationSubmit = this.appDocument.getElementById('validationSubmit');
            const validationQuestion = this.appDocument.getElementById('validationQuestionLabel');
            
            this.assert(validationInput, 'Validation input exists');
            this.assert(validationSubmit, 'Validation submit button exists');
            this.assert(validationQuestion && validationQuestion.textContent.length > 0, 'Validation question displayed');
            
            // Test wrong answer
            validationInput.value = 'WRONG';
            validationSubmit.click();
            await this.wait(300);
            
            const errorMsg = this.appDocument.getElementById('validationError');
            this.assert(errorMsg && errorMsg.style.display !== 'none', 'Error message shown for wrong answer');
            
            // Test correct answer (backdoor)
            validationInput.value = 'A';
            validationSubmit.click();
            await this.wait(500);
            
            // Should be in edit mode now
            this.assert(this.appDocument.body.classList.contains('grownup-mode'), 'Entered edit mode after correct answer');
            
            // Return to view mode
            const viewBtn = this.appDocument.getElementById('viewModeBtn');
            viewBtn.click();
            await this.wait(300);
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Helper to handle validation modal
    async handleValidationModal() {
        const validationInput = this.appDocument.getElementById('validationInput');
        const validationSubmit = this.appDocument.getElementById('validationSubmit');
        
        if (validationInput && validationSubmit) {
            console.log('Handling validation modal...');
            validationInput.value = 'A'; // Backdoor answer
            validationSubmit.click();
            await this.wait(500);
            console.log('✓ Validation completed');
        }
    }

    // Helper to create a test card
    async createTestCard() {
        // Enter edit mode first
        await this.openSettingsPanel();
        const editBtn = this.appDocument.getElementById('editModeBtn');
        if (editBtn && !editBtn.classList.contains('segment--active')) {
            editBtn.click();
            await this.wait(300);
            await this.handleValidationModal();
        }
        
        // Click FAB
        const fab = this.appDocument.querySelector('#edit-mode-fab');
        if (fab) {
            fab.click();
            await this.wait(500);
            
            // Find Add Card button
            const addCardBtn = Array.from(this.appDocument.querySelectorAll('.admin-btn')).find(btn => 
                btn.textContent.includes('Add Card')
            );
            
            if (addCardBtn) {
                addCardBtn.click();
                await this.wait(500);
                
                // Fill in card details
                const titleInput = this.appDocument.getElementById('activityTitle');
                if (titleInput) {
                    titleInput.value = 'Test Card';
                    titleInput.dispatchEvent(new Event('input'));
                }
                
                // Save card
                const saveBtn = Array.from(this.appDocument.querySelectorAll('.footer-button')).find(btn =>
                    btn.textContent.includes('Add Card')
                );
                if (saveBtn) {
                    saveBtn.click();
                    await this.wait(500);
                }
            }
        }
        
        // Return to view mode
        const viewBtn = this.appDocument.getElementById('viewModeBtn');
        if (viewBtn) {
            viewBtn.click();
            await this.wait(300);
        }
        
        await this.closeSettingsPanel();
    }

    // Test helpers
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
            console.log(`   ❌ ${message}`);
            throw new Error(message);
        } else {
            console.log(`   ✓ ${message}`);
        }
    }

    reportResults() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(50) + '\n');
        
        const total = this.testResults.length;
        const passed = this.testResults.filter(t => t.success).length;
        const failed = total - passed;
        
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
        
        if (failed > 0) {
            console.log('\n⚠️  Some tests failed. Please review the errors above.');
            console.log('\nFailed Tests:');
            this.testResults.filter(t => !t.success).forEach(test => {
                console.log(`  - ${test.name}: ${test.error}`);
            });
        } else {
            console.log('\n✅ All tests passed!');
        }
        
        console.log('\n' + '='.repeat(50));
    }
}

// Auto-run tests if loaded directly
if (typeof module === 'undefined') {
    const tester = new EditModeUAT();
    tester.runTests();
}