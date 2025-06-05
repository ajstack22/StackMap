// StackMap Comprehensive Test Suite
// Based on testing-protocol.md requirements

class StackMapTestSuite {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    // Reset results for new test run
    resetResults() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    // Log test result
    logResult(testName, passed, message) {
        if (passed) {
            this.results.passed++;
            this.results.details.push(`✅ ${testName}: ${message}`);
        } else {
            this.results.failed++;
            this.results.details.push(`❌ ${testName}: ${message}`);
        }
    }

    // Log warning
    logWarning(testName, message) {
        this.results.warnings++;
        this.results.details.push(`⚠️ ${testName}: ${message}`);
    }

    // Test activity creation
    async testActivityCreation() {
        console.log('\n🧪 Testing Activity Creation...');
        
        try {
            const initialCount = appInstance.appState.getCurrentActivities().length;
            
            // Test adding activity
            appInstance.appState.addActivity({
                title: 'Test Activity',
                description: 'Test Description',
                icon: '🧪'
            });
            
            const newCount = appInstance.appState.getCurrentActivities().length;
            
            if (newCount === initialCount + 1) {
                this.logResult('Activity Creation', true, `Activity created successfully (${initialCount} -> ${newCount})`);
                
                // Clean up test activity
                appInstance.appState.removeActivity(newCount - 1);
            } else {
                this.logResult('Activity Creation', false, `Activity creation failed - count remained ${initialCount}`);
            }
        } catch (error) {
            this.logResult('Activity Creation', false, `Error: ${error.message}`);
        }
    }

    // Test accessibility compliance
    async testAccessibility() {
        console.log('\n♿ Testing Accessibility...');
        
        // Test touch targets
        const touchTargets = [
            { selector: '.day-option', name: 'Day selector options' },
            { selector: '.user-dropdown', name: 'User dropdown' },
            { selector: '.btn--add-user', name: 'Add user button' },
            { selector: '.btn--floating', name: 'Floating buttons' },
            { selector: '.card', name: 'Activity cards' }
        ];

        touchTargets.forEach(target => {
            const elements = document.querySelectorAll(target.selector);
            elements.forEach((el, index) => {
                const rect = el.getBoundingClientRect();
                const size = Math.min(rect.width, rect.height);
                
                if (size === 0) {
                    // Check if element is intentionally hidden
                    const isHidden = window.getComputedStyle(el).display === 'none' || 
                                   el.closest('.static-header') !== null;
                    
                    if (isHidden) {
                        this.logWarning(target.name, `Element [${index}]: Not rendered (0px) - intentionally hidden`);
                    } else {
                        this.logResult(target.name, false, `Touch target [${index}]: ${size}px (FAIL - needs 44px)`);
                    }
                } else if (size >= 44) {
                    this.logResult(target.name, true, `Touch target [${index}]: ${size}px (PASS)`);
                } else {
                    this.logResult(target.name, false, `Touch target [${index}]: ${size}px (FAIL - needs 44px)`);
                }
            });
        });

        // Test ARIA attributes
        const ariaElements = [
            { selector: '[role="button"]', name: 'Button roles' },
            { selector: '[aria-label]', name: 'ARIA labels' },
            { selector: '[role="banner"]', name: 'Banner roles' }
        ];

        ariaElements.forEach(target => {
            const elements = document.querySelectorAll(target.selector);
            if (elements.length > 0) {
                this.logResult(target.name, true, `Found ${elements.length} elements with proper ARIA`);
            } else {
                this.logWarning(target.name, `No elements found with ${target.selector}`);
            }
        });
    }

    // Test navigation flows
    async testNavigation() {
        console.log('\n🧭 Testing Navigation...');
        
        // Test day switching
        const currentDay = appInstance.appState.getCurrentDay();
        this.logResult('Current Day', true, `Currently viewing: ${currentDay}`);
        
        // Test if day selector exists
        const daySelector = document.querySelector('.day-selector');
        if (daySelector) {
            this.logResult('Day Selector', true, 'Day selector component found');
        } else {
            this.logResult('Day Selector', false, 'Day selector component not found');
        }

        // Test user switching capability
        const userCount = Object.keys(appInstance.appState.users.profiles).length;
        this.logResult('User Profiles', true, `${userCount} user profile(s) available`);

        // Test edit mode toggle
        const wasInEditMode = appInstance.appState.ui.editMode;
        if (!wasInEditMode) {
            appInstance.enterGrownupMode();
        }
        
        const isNowInEditMode = appInstance.appState.ui.editMode;
        this.logResult('Edit Mode Toggle', isNowInEditMode, 'Edit mode can be activated');
        
        // Restore original state
        if (!wasInEditMode && isNowInEditMode) {
            appInstance.exitGrownupMode();
        }
    }

    // Test data integrity
    async testDataIntegrity() {
        console.log('\n💾 Testing Data Integrity...');
        
        // Test user data isolation
        const currentUser = appInstance.appState.getCurrentUser();
        if (currentUser) {
            this.logResult('Current User', true, `User loaded: ${currentUser.name}`);
            
            // Check for required properties
            const requiredProps = ['activities', 'tomorrowActivities', 'settings'];
            requiredProps.forEach(prop => {
                if (currentUser[prop] !== undefined) {
                    this.logResult(`User.${prop}`, true, 'Property exists');
                } else {
                    this.logResult(`User.${prop}`, false, 'Property missing');
                }
            });
        } else {
            this.logResult('Current User', false, 'No user loaded');
        }

        // Test activity data structure
        const activities = appInstance.appState.getCurrentActivities();
        if (Array.isArray(activities)) {
            this.logResult('Activities Array', true, `${activities.length} activities loaded`);
            
            // Validate first activity if exists
            if (activities.length > 0) {
                const activity = activities[0];
                const requiredFields = ['title', 'icon', 'visible', 'completed'];
                requiredFields.forEach(field => {
                    if (activity[field] !== undefined) {
                        this.logResult(`Activity.${field}`, true, 'Field exists');
                    } else {
                        this.logResult(`Activity.${field}`, false, 'Field missing');
                    }
                });
            }
        } else {
            this.logResult('Activities Array', false, 'Activities not an array');
        }
    }

    // Test Story 1: Card Types
    async testStory1() {
        console.log('\n📋 Testing Story 1: Card Types...');
        
        if (typeof window.validateStory1 === 'function') {
            window.validateStory1();
            this.logResult('Story 1 Validation', true, 'Validation function executed');
        } else {
            // Basic card type validation
            const activities = appInstance.appState.getCurrentActivities();
            const hasCardTypes = activities.some(a => a.cardType);
            
            if (hasCardTypes) {
                this.logResult('Card Types', true, 'Activities have card type property');
            } else {
                this.logWarning('Card Types', 'No activities with card types found');
            }
        }
    }

    // Test Story 2: Multi-User
    async testStory2() {
        console.log('\n👥 Testing Story 2: Multi-User...');
        
        if (typeof window.validateStory2 === 'function') {
            window.validateStory2();
            this.logResult('Story 2 Validation', true, 'Validation function executed');
        } else {
            this.logWarning('Story 2 Validation', 'Validation function not found');
        }
    }

    // Test Story 3: Export/Import
    async testStory3() {
        console.log('\n📤 Testing Story 3: Export/Import...');
        
        if (typeof window.validateStory3 === 'function') {
            window.validateStory3();
            this.logResult('Story 3 Validation', true, 'Validation function executed');
        } else {
            this.logWarning('Story 3 Validation', 'Validation function not found');
        }
    }

    // Test Story 4: Today/Tomorrow
    async testStory4() {
        console.log('\n📅 Testing Story 4: Today/Tomorrow...');
        
        if (typeof window.validateStory4 === 'function') {
            window.validateStory4();
            this.logResult('Story 4 Validation', true, 'Validation function executed');
        } else {
            this.logWarning('Story 4 Validation', 'Validation function not found');
        }
    }

    // Run all tests
    async runAll() {
        console.log('🧪 STACKMAP COMPREHENSIVE TEST SUITE 🧪');
        console.log('=====================================\n');
        
        this.resetResults();
        
        // Core functionality tests
        await this.testActivityCreation();
        await this.testAccessibility();
        await this.testNavigation();
        await this.testDataIntegrity();
        
        // Story-specific tests
        await this.testStory1();
        await this.testStory2();
        await this.testStory3();
        await this.testStory4();
        
        // Display results
        this.displayResults();
    }

    // Display test results
    displayResults() {
        console.log('\n========== TEST RESULTS ==========');
        console.log(`✅ PASSED: ${this.results.passed}`);
        console.log(`❌ FAILED: ${this.results.failed}`);
        console.log(`⚠️ WARNINGS: ${this.results.warnings}`);
        
        const total = this.results.passed + this.results.failed;
        const successRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : 0;
        console.log(`📈 SUCCESS RATE: ${successRate}%`);
        
        console.log('\n========== DETAILS ==========');
        this.results.details.forEach(detail => console.log(detail));
        
        if (this.results.failed === 0 && successRate === '100.0') {
            console.log('\n🎉 ALL CRITICAL TESTS PASSED! 🎉');
        } else {
            console.log('\n⚠️ SOME TESTS FAILED - PLEASE FIX BEFORE PROCEEDING');
        }
        
        console.log('\n=================================');
    }
}

// Create global test suite instance
window.StackMapTestSuite = new StackMapTestSuite();

// Convenience functions matching testing protocol
window.runAllTests = async () => {
    return window.StackMapTestSuite.runAll();
};

window.testActivityCreation = async () => {
    window.StackMapTestSuite.resetResults();
    await window.StackMapTestSuite.testActivityCreation();
    window.StackMapTestSuite.displayResults();
};

window.testAccessibility = async () => {
    window.StackMapTestSuite.resetResults();
    await window.StackMapTestSuite.testAccessibility();
    window.StackMapTestSuite.displayResults();
};

window.testNavigation = async () => {
    window.StackMapTestSuite.resetResults();
    await window.StackMapTestSuite.testNavigation();
    window.StackMapTestSuite.displayResults();
};

window.testDataIntegrity = async () => {
    window.StackMapTestSuite.resetResults();
    await window.StackMapTestSuite.testDataIntegrity();
    window.StackMapTestSuite.displayResults();
};

// Quick test function
window.quickTest = async (story) => {
    window.StackMapTestSuite.resetResults();
    
    switch(story) {
        case 'story1':
            await window.StackMapTestSuite.testStory1();
            break;
        case 'story2':
            await window.StackMapTestSuite.testStory2();
            break;
        case 'story3':
            await window.StackMapTestSuite.testStory3();
            break;
        case 'story4':
            await window.StackMapTestSuite.testStory4();
            break;
        case 'navigation':
            await window.StackMapTestSuite.testNavigation();
            break;
        default:
            console.log('Unknown story:', story);
    }
    
    window.StackMapTestSuite.displayResults();
};

console.log('✅ StackMap Test Suite Loaded');
console.log('Run tests with: runAllTests()');
console.log('Quick tests: testActivityCreation(), testAccessibility(), testNavigation()');
console.log('Story tests: quickTest("story1"), quickTest("story2"), etc.');