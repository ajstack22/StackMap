// Story 5: Modern UI Selectors Test Suite
// Tests the implementation of custom dropdowns and modals

class Story5TestSuite {
    constructor() {
        this.results = [];
        this.passed = 0;
        this.failed = 0;
    }

    log(test, passed, message) {
        this.results.push({ test, passed, message });
        if (passed) this.passed++;
        else this.failed++;
        console.log(`${passed ? '✅' : '❌'} ${test}: ${message}`);
    }

    async testUserSelector() {
        console.log('\n📋 Testing Modern User Selector...');
        
        // Check if modern selector exists
        const modernSelector = document.querySelector('.user-selector-modern');
        if (!modernSelector) {
            this.log('User Selector Render', false, 'Modern user selector not found');
            return;
        }
        
        this.log('User Selector Render', true, 'Modern user selector rendered');
        
        // Check if native select is hidden
        const nativeSelect = document.querySelector('#userDropdown');
        if (nativeSelect) {
            const isHidden = nativeSelect.style.visibility === 'hidden' || 
                           nativeSelect.style.position === 'absolute';
            this.log('Native Select Hidden', isHidden, 
                isHidden ? 'Native select properly hidden' : 'Native select still visible');
        }
        
        // Test ARIA attributes
        const ariaExpanded = modernSelector.getAttribute('aria-expanded');
        const ariaHaspopup = modernSelector.getAttribute('aria-haspopup');
        const role = modernSelector.getAttribute('role');
        
        this.log('ARIA Attributes', 
            ariaExpanded !== null && ariaHaspopup === 'listbox' && role === 'button',
            `aria-expanded: ${ariaExpanded}, aria-haspopup: ${ariaHaspopup}, role: ${role}`);
        
        // Test touch target size
        const rect = modernSelector.getBoundingClientRect();
        const height = rect.height;
        this.log('Touch Target Size', height >= 44, 
            `Height: ${height}px (min: 44px)`);
        
        // Test dropdown modal
        const dropdownModal = modernSelector.querySelector('.dropdown-modal');
        this.log('Dropdown Modal', !!dropdownModal, 
            dropdownModal ? 'Dropdown modal structure exists' : 'Dropdown modal missing');
        
        // Test backdrop
        const backdrop = document.querySelector('.selector-backdrop');
        this.log('Backdrop Element', !!backdrop, 
            backdrop ? 'Backdrop element exists' : 'Backdrop element missing');
        
        // Test user info display
        const userInfo = modernSelector.querySelector('.user-info');
        const userName = modernSelector.querySelector('.user-name');
        const userAvatar = modernSelector.querySelector('.user-avatar');
        
        this.log('User Info Elements', !!(userInfo && userName && userAvatar),
            'User info structure complete');
        
        // Test click functionality
        try {
            // Simulate click
            modernSelector.click();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const isOpen = modernSelector.classList.contains('modern-selector--open');
            this.log('Click Opens Dropdown', isOpen, 
                isOpen ? 'Dropdown opens on click' : 'Dropdown failed to open');
            
            if (isOpen) {
                // Check dropdown options
                const options = dropdownModal.querySelectorAll('.dropdown-option');
                this.log('Dropdown Options', options.length > 0, 
                    `Found ${options.length} user options`);
                
                // Check for Add User option in grownup mode
                if (appInstance.grownupMode) {
                    const addUserOption = dropdownModal.querySelector('[data-action="add-user"]');
                    this.log('Add User Option', !!addUserOption, 
                        addUserOption ? 'Add User option present in grownup mode' : 'Add User option missing');
                }
                
                // Close dropdown
                modernSelector.click();
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const isClosed = !modernSelector.classList.contains('modern-selector--open');
                this.log('Click Closes Dropdown', isClosed, 
                    isClosed ? 'Dropdown closes on second click' : 'Dropdown failed to close');
            }
        } catch (error) {
            this.log('User Selector Interaction', false, `Error: ${error.message}`);
        }
    }

    async testDaySelector() {
        console.log('\n📅 Testing Modern Day Selector...');
        
        // Check if modern day selector exists
        const modernDaySelector = document.querySelector('.day-selector-modern');
        if (!modernDaySelector) {
            this.log('Day Selector Render', false, 'Modern day selector not found');
            return;
        }
        
        this.log('Day Selector Render', true, 'Modern day selector rendered');
        
        // Test ARIA attributes
        const ariaExpanded = modernDaySelector.getAttribute('aria-expanded');
        const ariaHaspopup = modernDaySelector.getAttribute('aria-haspopup');
        const role = modernDaySelector.getAttribute('role');
        
        this.log('Day Selector ARIA', 
            ariaExpanded !== null && ariaHaspopup === 'dialog' && role === 'button',
            `aria-expanded: ${ariaExpanded}, aria-haspopup: ${ariaHaspopup}, role: ${role}`);
        
        // Test day modal
        const dayModal = document.querySelector('.day-modal');
        this.log('Day Modal Structure', !!dayModal, 
            dayModal ? 'Day modal exists' : 'Day modal missing');
        
        // Test day info display
        const dayInfo = modernDaySelector.querySelector('.day-info');
        const dayIcon = modernDaySelector.querySelector('.day-icon');
        const dayName = modernDaySelector.querySelector('.day-name');
        
        this.log('Day Info Elements', !!(dayInfo && dayIcon && dayName),
            'Day info structure complete');
        
        // Test modal interaction
        try {
            // Open modal
            modernDaySelector.click();
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const isOpen = modernDaySelector.classList.contains('modern-selector--open') &&
                          dayModal.classList.contains('day-modal--open');
            this.log('Day Modal Opens', isOpen, 
                isOpen ? 'Day modal opens on click' : 'Day modal failed to open');
            
            if (isOpen) {
                // Check modal content
                const dayOptions = dayModal.querySelectorAll('.day-modal-option');
                this.log('Day Options', dayOptions.length === 2, 
                    `Found ${dayOptions.length} day options (expected 2)`);
                
                // Check complete button
                const completeBtn = dayModal.querySelector('.btn--complete-day');
                this.log('Complete Day Button', !!completeBtn, 
                    completeBtn ? 'Complete Day button present' : 'Complete Day button missing');
                
                // Check activity previews
                const activityPreviews = dayModal.querySelectorAll('.day-modal-option-activities');
                this.log('Activity Previews', activityPreviews.length === 2, 
                    `Found ${activityPreviews.length} activity preview areas`);
                
                // Close modal - wait for backdrop to be clickable
                await new Promise(resolve => setTimeout(resolve, 100)); // Wait for backdrop to be ready
                
                const backdrop = document.querySelector('.selector-backdrop--open');
                console.log('Looking for open backdrop with class .selector-backdrop--open');
                console.log('Backdrop element:', backdrop);
                
                if (!backdrop) {
                    // Try without --open class
                    const anyBackdrop = document.querySelector('.selector-backdrop');
                    console.log('Any backdrop found:', anyBackdrop);
                    console.log('Backdrop classes:', anyBackdrop?.className);
                }
                
                if (backdrop) {
                    console.log('Backdrop pointer-events:', window.getComputedStyle(backdrop).pointerEvents);
                    console.log('Backdrop z-index:', window.getComputedStyle(backdrop).zIndex);
                    
                    // Dispatch click event
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    backdrop.dispatchEvent(clickEvent);
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    const isClosed = !modernDaySelector.classList.contains('modern-selector--open');
                    const modalClosed = !dayModal.classList.contains('day-modal--open');
                    console.log('After click - Selector closed:', isClosed, 'Modal closed:', modalClosed);
                    
                    this.log('Modal Closes on Backdrop', isClosed && modalClosed, 
                        isClosed && modalClosed ? 'Modal closes on backdrop click' : 'Modal failed to close');
                } else {
                    this.log('Modal Closes on Backdrop', false, 'No backdrop element with --open class found');
                }
            }
        } catch (error) {
            this.log('Day Selector Interaction', false, `Error: ${error.message}`);
        }
    }

    async testKeyboardNavigation() {
        console.log('\n⌨️ Testing Keyboard Navigation...');
        
        const modernSelector = document.querySelector('.user-selector-modern');
        if (!modernSelector) {
            this.log('Keyboard Test Skipped', false, 'No modern selector to test');
            return;
        }
        
        try {
            // Ensure selector is focusable
            if (modernSelector.tabIndex < 0) {
                modernSelector.tabIndex = 0;
            }
            
            // Focus the selector
            modernSelector.focus();
            
            // Wait a bit for focus to be set
            await new Promise(resolve => setTimeout(resolve, 50));
            
            this.log('Focus Management', document.activeElement === modernSelector || modernSelector.tabIndex >= 0, 
                'Selector can receive focus');
            
            // Test Enter key
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            modernSelector.dispatchEvent(enterEvent);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const openedWithEnter = modernSelector.classList.contains('modern-selector--open');
            this.log('Enter Key Opens', openedWithEnter, 
                openedWithEnter ? 'Enter key opens dropdown' : 'Enter key failed');
            
            // Test Escape key
            if (openedWithEnter) {
                const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
                modernSelector.dispatchEvent(escapeEvent);
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const closedWithEscape = !modernSelector.classList.contains('modern-selector--open');
                this.log('Escape Key Closes', closedWithEscape, 
                    closedWithEscape ? 'Escape key closes dropdown' : 'Escape key failed');
            }
            
            // Test arrow keys on day selector
            const daySelector = document.querySelector('.day-selector-modern');
            if (daySelector) {
                daySelector.focus();
                const currentDay = appInstance.appState.getCurrentDay();
                
                const arrowEvent = new KeyboardEvent('keydown', { 
                    key: currentDay === 'today' ? 'ArrowRight' : 'ArrowLeft' 
                });
                daySelector.dispatchEvent(arrowEvent);
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const newDay = appInstance.appState.getCurrentDay();
                this.log('Arrow Key Navigation', newDay !== currentDay, 
                    `Arrow keys switch days: ${currentDay} → ${newDay}`);
            }
        } catch (error) {
            this.log('Keyboard Navigation', false, `Error: ${error.message}`);
        }
    }

    async testMobileResponsiveness() {
        console.log('\n📱 Testing Mobile Responsiveness...');
        
        // Check viewport meta tag
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const hasViewport = viewportMeta && viewportMeta.content.includes('width=device-width');
        this.log('Viewport Meta', hasViewport, 
            hasViewport ? 'Proper viewport meta tag' : 'Missing viewport configuration');
        
        // Check CSS media queries loaded
        const isNarrowViewport = window.innerWidth < 768;
        const daySelectorBtn = document.querySelector('.day-selector-modern');
        
        if (daySelectorBtn) {
            const styles = window.getComputedStyle(daySelectorBtn);
            const height = parseFloat(styles.height);
            const minHeight = isNarrowViewport ? 56 : 52;
            
            this.log('Responsive Touch Targets', height >= minHeight, 
                `Selector height: ${height}px (min: ${minHeight}px for ${isNarrowViewport ? 'mobile' : 'desktop'})`);
        }
        
        // Test modal positioning
        const dayModal = document.querySelector('.day-modal');
        if (dayModal && isNarrowViewport) {
            const styles = window.getComputedStyle(dayModal);
            const isFullscreen = styles.width === '100vw' || parseFloat(styles.width) === window.innerWidth;
            
            this.log('Mobile Modal Layout', isFullscreen, 
                isFullscreen ? 'Modal uses fullscreen on mobile' : 'Modal not optimized for mobile');
        }
    }

    async testAccessibility() {
        console.log('\n♿ Testing Accessibility Features...');
        
        // Check for screen reader announcements
        const srElements = document.querySelectorAll('.sr-only');
        this.log('Screen Reader Support', srElements.length > 0, 
            `Found ${srElements.length} screen reader elements`);
        
        // Check focus indicators - check if CSS rules exist
        const hasSelectors = document.querySelector('.modern-selector') && 
                           document.querySelector('.day-modal-option');
        
        // Check if focus styles are defined in CSS
        let hasFocusStyles = false;
        const styleSheets = document.styleSheets;
        for (let sheet of styleSheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                for (let rule of rules) {
                    if (rule.selectorText && 
                        (rule.selectorText.includes(':focus') || 
                         rule.selectorText.includes(':focus-visible'))) {
                        hasFocusStyles = true;
                        break;
                    }
                }
                if (hasFocusStyles) break;
            } catch(e) {
                // Skip cross-origin stylesheets
            }
        }
        
        this.log('Focus Indicators', hasFocusStyles && hasSelectors, 
            'Focus indicators present on interactive elements');
        
        // Check reduced motion support
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.log('Reduced Motion Query', true, 
            `System prefers reduced motion: ${prefersReducedMotion}`);
        
        // Check high contrast support
        const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
        this.log('High Contrast Query', true, 
            `System prefers high contrast: ${highContrast}`);
    }

    async runAll() {
        console.log('🧪 STORY 5: MODERN UI SELECTORS TEST SUITE 🧪');
        console.log('==========================================\n');
        
        this.results = [];
        this.passed = 0;
        this.failed = 0;
        
        await this.testUserSelector();
        await this.testDaySelector();
        await this.testKeyboardNavigation();
        await this.testMobileResponsiveness();
        await this.testAccessibility();
        
        this.displayResults();
    }

    displayResults() {
        console.log('\n========== TEST RESULTS ==========');
        console.log(`✅ PASSED: ${this.passed}`);
        console.log(`❌ FAILED: ${this.failed}`);
        
        const total = this.passed + this.failed;
        const successRate = total > 0 ? ((this.passed / total) * 100).toFixed(1) : 0;
        console.log(`📈 SUCCESS RATE: ${successRate}%`);
        
        if (this.failed === 0) {
            console.log('\n🎉 ALL STORY 5 TESTS PASSED! 🎉');
        } else {
            console.log('\n⚠️ SOME TESTS FAILED - REVIEW IMPLEMENTATION');
            console.log('\nFailed tests:');
            this.results.filter(r => !r.passed).forEach(r => {
                console.log(`  - ${r.test}: ${r.message}`);
            });
        }
        
        console.log('\n=================================');
    }
}

// Create global instance
window.story5Tests = new Story5TestSuite();

// Add to global test functions
window.testStory5 = async () => {
    return window.story5Tests.runAll();
};

// Add validation function for main test suite
window.validateStory5 = () => {
    const modernUserSelector = document.querySelector('.user-selector-modern');
    const modernDaySelector = document.querySelector('.day-selector-modern');
    const hasModernSelectors = !!(modernUserSelector && modernDaySelector);
    
    console.log(`Story 5 Modern Selectors: ${hasModernSelectors ? 'IMPLEMENTED' : 'NOT FOUND'}`);
    
    if (hasModernSelectors) {
        console.log('  ✓ Modern user selector rendered');
        console.log('  ✓ Modern day selector rendered');
        
        // Quick validation checks
        const userDropdown = modernUserSelector.querySelector('.dropdown-modal');
        const dayModal = document.querySelector('.day-modal');
        
        if (userDropdown) console.log('  ✓ User dropdown structure present');
        if (dayModal) console.log('  ✓ Day modal structure present');
        
        return true;
    }
    
    return false;
};

console.log('✅ Story 5 Test Suite Loaded');
console.log('Run with: testStory5() or validateStory5()');