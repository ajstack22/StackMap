/**
 * Final celebration system test
 * Copy and paste this into the browser console
 */

console.log('🎉 === CELEBRATION SYSTEM TEST ===');

// Test 1: System Status
console.log('\n📋 SYSTEM STATUS:');
console.log('CelebrationManager loaded:', !!window.CelebrationManager);
console.log('Manager instance created:', !!window.celebrationManager);
console.log('CSS loaded:', !!document.querySelector('link[href*="celebrations.css"]'));

// Test 2: User Settings
const currentUser = window.appInstance?.appState.getCurrentUser();
console.log('\n👤 USER SETTINGS:');
console.log('Current user:', currentUser?.name);
console.log('Task celebration:', currentUser?.settings?.taskCelebration || 'gentle-glow (default)');
console.log('Routine celebration:', currentUser?.settings?.routineCelebration || 'garden-growth (default)');

// Test 3: Animation Registry
if (window.celebrationManager) {
    console.log('\n🎨 AVAILABLE ANIMATIONS:');
    console.log('Task animations:', Object.keys(window.celebrationManager.animations.task).length);
    console.log('Routine animations:', Object.keys(window.celebrationManager.animations.routine).length);
}

// Test 4: Direct Animation Test
window.directAnimationTest = () => {
    const card = document.querySelector('.card:not(.card--completed)');
    if (!card) {
        console.error('No uncompleted cards found!');
        return;
    }
    
    console.log('\n🧪 DIRECT ANIMATION TEST:');
    console.log('Testing on card:', card.querySelector('.card__title')?.textContent);
    
    // Add classes directly
    card.classList.add('celebration-animation', 'celebrate-gentle-glow');
    console.log('✅ Animation classes added');
    console.log('Current classes:', card.className);
    
    // Check if animation is running
    const styles = window.getComputedStyle(card);
    console.log('Animation property:', styles.animationName);
    console.log('Box shadow:', styles.boxShadow);
    
    // Clean up after 2 seconds
    setTimeout(() => {
        card.classList.remove('celebration-animation', 'celebrate-gentle-glow');
        console.log('✅ Animation cleaned up');
    }, 2000);
};

// Test 5: Manager Animation Test
window.managerAnimationTest = (type = 'gentle-glow') => {
    if (!window.celebrationManager) {
        console.error('CelebrationManager not loaded!');
        return;
    }
    
    const card = document.querySelector('.card:not(.card--completed)');
    if (!card) {
        console.error('No uncompleted cards found!');
        return;
    }
    
    console.log(`\n🎯 TESTING ANIMATION: ${type}`);
    const animation = window.celebrationManager.animations.task[type];
    if (animation) {
        animation.func.call(window.celebrationManager, card);
        console.log('✅ Animation triggered via manager');
    } else {
        console.error(`Animation '${type}' not found!`);
    }
};

// Test 6: Preview Test
window.previewTest = () => {
    console.log('\n👁️ PREVIEW TEST:');
    if (window.hybridPanelManager) {
        // Open preferences panel
        window.hybridPanelManager.openPanel('left');
        console.log('✅ Preferences panel opened');
        
        setTimeout(() => {
            // Trigger preview
            window.hybridPanelManager.previewCelebration('task');
            console.log('✅ Task preview triggered');
        }, 500);
    }
};

// Test 7: Full Click Test
window.fullClickTest = () => {
    console.log('\n🖱️ FULL CLICK TEST:');
    const card = document.querySelector('.card:not(.card--completed)');
    if (card) {
        console.log('Clicking card:', card.querySelector('.card__title')?.textContent);
        card.click();
        console.log('✅ Card clicked - check for animation');
    }
};

// Instructions
console.log('\n📖 AVAILABLE TESTS:');
console.log('1. directAnimationTest() - Test CSS animation directly');
console.log('2. managerAnimationTest("gentle-glow") - Test via manager');
console.log('3. previewTest() - Test preview functionality');
console.log('4. fullClickTest() - Test full click flow');
console.log('\n🎨 Available animations:');
if (window.celebrationManager) {
    Object.keys(window.celebrationManager.animations.task).forEach(key => {
        console.log(`   managerAnimationTest("${key}")`);
    });
}

// Auto-run direct test
console.log('\n🚀 Running direct animation test in 2 seconds...');
setTimeout(directAnimationTest, 2000);