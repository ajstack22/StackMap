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
    }

    // Test runner
    async runTests() {
        console.log('🧪 Starting Edit Mode UAT...\n');
        
        try {
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

    // Test 1: Edit mode can be toggled on and off
    async testEditModeToggle() {
        this.startTest('Edit Mode Toggle');
        
        try {
            // Find edit mode toggle
            const toggle = document.querySelector('input[type="checkbox"][onchange*="handleEditModeSwitch"]');
            this.assert(toggle, 'Edit mode toggle exists');
            
            // Test turning on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(100);
            
            this.assert(document.body.classList.contains('grownup-mode'), 'Body has grownup-mode class when edit mode is on');
            this.assert(window.app && window.app.grownupMode === true, 'App grownupMode state is true');
            
            // Test turning off edit mode
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(100);
            
            this.assert(!document.body.classList.contains('grownup-mode'), 'Body does not have grownup-mode class when edit mode is off');
            this.assert(window.app && window.app.grownupMode === false, 'App grownupMode state is false');
            
            this.endTest(true);
        } catch (error) {
            this.endTest(false, error.message);
        }
    }

    // Test 2: Edit buttons appear/disappear correctly
    async testEditButtonsVisibility() {
        this.startTest('Edit Buttons Visibility');
        
        try {
            const toggle = document.querySelector('input[type="checkbox"][onchange*="handleEditModeSwitch"]');
            
            // Turn on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(200);
            
            // Check for edit buttons
            const editButtons = document.querySelectorAll('.btn--checkbox, .btn--visibility, .btn--duplicate, .btn--delete');
            this.assert(editButtons.length > 0, `Edit buttons are visible (found ${editButtons.length} buttons)`);
            
            // Check each card has buttons
            const cards = document.querySelectorAll('.activity-card');
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
            const editButtonsAfter = document.querySelectorAll('.btn--checkbox, .btn--visibility, .btn--duplicate, .btn--delete');
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
            const toggle = document.querySelector('input[type="checkbox"][onchange*="handleEditModeSwitch"]');
            const card = document.querySelector('.activity-card');
            
            if (!card) {
                this.endTest(false, 'No activity cards found');
                return;
            }
            
            // Get initial card dimensions
            const initialHeight = card.offsetHeight;
            
            // Turn on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(300);
            
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
            const toggle = document.querySelector('input[type="checkbox"][onchange*="handleEditModeSwitch"]');
            const drawer = document.querySelector('.drawer');
            
            // Turn on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(200);
            
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
            const toggle = document.querySelector('input[type="checkbox"][onchange*="handleEditModeSwitch"]');
            
            // Turn on edit mode
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(200);
            
            // Open a panel (if available)
            const prefsButton = document.querySelector('.preferences-button');
            if (prefsButton) {
                prefsButton.click();
                await this.wait(200);
            }
            
            // Turn off edit mode
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(200);
            
            // Check all panels are closed
            const openPanels = document.querySelectorAll('.hybrid-panel.open');
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
            const toggle = document.querySelector('input[type="checkbox"][onchange*="handleEditModeSwitch"]');
            
            // Turn on edit mode to show FAB
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(200);
            
            // Find the FAB
            const fab = document.querySelector('.fab');
            this.assert(fab, 'FAB exists in edit mode');
            this.assert(fab.classList.contains('visible'), 'FAB is visible in edit mode');
            
            // Check if FAB is open (has menu items visible)
            const fabButton = fab.querySelector('.fab__button');
            this.assert(fabButton, 'FAB button exists');
            
            // Click FAB to open menu
            fabButton.click();
            await this.wait(300);
            
            // Check if menu is open
            const fabMenu = fab.querySelector('.fab__menu');
            const isMenuOpen = fab.classList.contains('open') || (fabMenu && window.getComputedStyle(fabMenu).opacity === '1');
            this.assert(isMenuOpen, 'FAB menu opens when clicked');
            
            // Click FAB again to close menu
            fabButton.click();
            await this.wait(300);
            
            // Check if menu is closed
            const isMenuClosed = !fab.classList.contains('open') || (fabMenu && window.getComputedStyle(fabMenu).opacity === '0');
            this.assert(isMenuClosed, 'FAB menu closes when clicked again');
            
            // Test clicking outside to close
            fabButton.click(); // Open again
            await this.wait(300);
            
            // Click outside
            document.body.click();
            await this.wait(300);
            
            const isClosedByOutsideClick = !fab.classList.contains('open') || (fabMenu && window.getComputedStyle(fabMenu).opacity === '0');
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
            
            const toggle = document.querySelector('input[type="checkbox"][onchange*="handleEditModeSwitch"]');
            
            // Toggle on
            toggle.checked = true;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(100);
            
            // Toggle off
            toggle.checked = false;
            toggle.dispatchEvent(new Event('change'));
            await this.wait(100);
            
            console.error = originalError;
            
            this.assert(errors.length === 0, `No console errors during toggle (found ${errors.length} errors)`);
            
            // Test 2: Required functions exist
            this.assert(window.app, 'App instance exists');
            this.assert(typeof window.app.enterGrownupMode === 'function', 'enterGrownupMode function exists');
            this.assert(typeof window.app.exitGrownupMode === 'function', 'exitGrownupMode function exists');
            
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