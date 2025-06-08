/**
 * Test suite for the Celebration Animation System
 * Run these tests after the app loads by calling runCelebrationTests()
 */

// Test celebration manager initialization
const testCelebrationManager = () => {
    console.log('🧪 Testing Celebration Manager...');
    
    // Test manager exists
    console.assert(window.celebrationManager, 'FAIL: CelebrationManager not initialized');
    
    // Test animation registry
    const taskAnimations = Object.keys(window.celebrationManager.animations.task);
    console.assert(taskAnimations.length === 11, `FAIL: Expected 11 task animations, got ${taskAnimations.length}`);
    
    const routineAnimations = Object.keys(window.celebrationManager.animations.routine);  
    console.assert(routineAnimations.length === 8, `FAIL: Expected 8 routine animations, got ${routineAnimations.length}`);
    
    console.log('✅ Celebration Manager tests passed');
    console.log('   Task animations:', taskAnimations);
    console.log('   Routine animations:', routineAnimations);
};

// Test preference UI
const testPreferenceUI = () => {
    console.log('🧪 Testing Preference UI...');
    
    // Open preferences panel
    if (window.hybridPanelManager) {
        window.hybridPanelManager.openPanel('left');
        
        setTimeout(() => {
            // Check dropdowns exist
            const taskDropdown = document.getElementById('taskCelebrationSelect');
            const routineDropdown = document.getElementById('routineCelebrationSelect');
            
            console.assert(taskDropdown, 'FAIL: Task celebration dropdown not found');
            console.assert(routineDropdown, 'FAIL: Routine celebration dropdown not found');
            
            // Check preview buttons exist
            const previewButtons = document.querySelectorAll('.preview-btn');
            console.assert(previewButtons.length >= 2, `FAIL: Expected at least 2 preview buttons, found ${previewButtons.length}`);
            
            console.log('✅ Preference UI tests passed');
            console.log('   Task dropdown options:', taskDropdown?.options.length);
            console.log('   Routine dropdown options:', routineDropdown?.options.length);
        }, 500);
    }
};

// Test celebration triggering
const testCelebrationTriggering = () => {
    console.log('🧪 Testing Celebration Triggering...');
    
    // Find an uncompleted card
    const testCard = document.querySelector('.card:not(.card--completed)');
    if (testCard) {
        console.log('   Testing task celebration on card:', testCard.querySelector('.card__title')?.textContent);
        
        // Test task celebration
        if (window.celebrationManager) {
            window.celebrationManager.celebrateTask(testCard, 'test-user');
            console.log('✅ Task celebration triggered');
        }
        
        // Test routine celebration after delay
        setTimeout(() => {
            const container = document.getElementById('mainContainer');
            if (container && window.celebrationManager) {
                window.celebrationManager.celebrateRoutine(container, 'test-user');
                console.log('✅ Routine celebration triggered');
            }
        }, 2000);
    } else {
        console.log('⚠️ No uncompleted cards found for testing');
    }
};

// Test accessibility compliance
const testAccessibilityCompliance = () => {
    console.log('🧪 Testing Accessibility Compliance...');
    
    // Test prefers-reduced-motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    console.log('   Reduced motion preference:', reducedMotionQuery.matches);
    
    // Test if animations are skipped appropriately
    if (window.celebrationManager) {
        const shouldSkip = window.celebrationManager.shouldSkipAnimation();
        console.log('   Should skip animations:', shouldSkip);
        console.assert(shouldSkip === reducedMotionQuery.matches, 'FAIL: Animation skip logic incorrect');
    }
    
    console.log('✅ Accessibility compliance checked');
};

// Test preview functionality
const testPreviewFunctionality = () => {
    console.log('🧪 Testing Preview Functionality...');
    
    if (window.hybridPanelManager) {
        // Open preferences first
        window.hybridPanelManager.openPanel('left');
        
        setTimeout(() => {
            // Test task preview
            console.log('   Testing task animation preview...');
            window.hybridPanelManager.previewCelebration('task');
            
            setTimeout(() => {
                // Test routine preview
                console.log('   Testing routine animation preview...');
                window.hybridPanelManager.previewCelebration('routine');
                console.log('✅ Preview functionality tested');
            }, 2000);
        }, 500);
    }
};

// Test settings persistence
const testSettingsPersistence = () => {
    console.log('🧪 Testing Settings Persistence...');
    
    const currentUser = window.appInstance?.appState.getCurrentUser();
    if (currentUser) {
        // Set test values
        window.hybridPanelManager?.updateCelebrationSetting('task', 'floating-stars');
        window.hybridPanelManager?.updateCelebrationSetting('routine', 'star-shower');
        
        // Check if saved
        const taskSetting = currentUser.settings?.taskCelebration;
        const routineSetting = currentUser.settings?.routineCelebration;
        
        console.assert(taskSetting === 'floating-stars', 'FAIL: Task setting not saved');
        console.assert(routineSetting === 'star-shower', 'FAIL: Routine setting not saved');
        
        console.log('✅ Settings persistence tested');
        console.log('   Task celebration:', taskSetting);
        console.log('   Routine celebration:', routineSetting);
    }
};

// Complete test suite
const runCelebrationTests = () => {
    console.log('🎉 Running Complete Celebration System Tests...');
    console.log('============================================');
    
    testCelebrationManager();
    
    setTimeout(() => {
        testPreferenceUI();
        
        setTimeout(() => {
            testCelebrationTriggering();
            testAccessibilityCompliance();
            testSettingsPersistence();
            
            setTimeout(() => {
                testPreviewFunctionality();
                console.log('============================================');
                console.log('🎉 All celebration tests completed!');
            }, 1000);
        }, 1000);
    }, 500);
};

// Make test available globally
window.runCelebrationTests = runCelebrationTests;

// Individual animation tests
window.testCelebrations = {
    // Test specific task animations
    testTaskAnimation: (animationName) => {
        const card = document.querySelector('.card:not(.card--completed)') || 
                    window.hybridPanelManager?.createTemporaryPreviewElement();
        
        if (card && window.celebrationManager) {
            const animation = window.celebrationManager.animations.task[animationName];
            if (animation) {
                console.log(`Testing task animation: ${animation.name}`);
                animation.func.call(window.celebrationManager, card);
            } else {
                console.error(`Animation '${animationName}' not found`);
            }
        }
    },
    
    // Test specific routine animations
    testRoutineAnimation: (animationName) => {
        const container = document.getElementById('mainContainer');
        
        if (container && window.celebrationManager) {
            const animation = window.celebrationManager.animations.routine[animationName];
            if (animation) {
                console.log(`Testing routine animation: ${animation.name}`);
                animation.func.call(window.celebrationManager, container);
            } else {
                console.error(`Animation '${animationName}' not found`);
            }
        }
    },
    
    // List all available animations
    listAnimations: () => {
        if (window.celebrationManager) {
            console.log('📋 Available Task Animations:');
            Object.entries(window.celebrationManager.animations.task).forEach(([key, anim]) => {
                console.log(`   ${key}: ${anim.name}`);
            });
            
            console.log('\n📋 Available Routine Animations:');
            Object.entries(window.celebrationManager.animations.routine).forEach(([key, anim]) => {
                console.log(`   ${key}: ${anim.name}`);
            });
        }
    }
};

console.log('🎉 Celebration test suite loaded. Run tests with:');
console.log('   runCelebrationTests() - Run all tests');
console.log('   testCelebrations.listAnimations() - List all animations');
console.log('   testCelebrations.testTaskAnimation("gentle-glow") - Test specific task animation');
console.log('   testCelebrations.testRoutineAnimation("sunrise-glow") - Test specific routine animation');