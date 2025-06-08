// Debug animation issues
console.log('=== ANIMATION DEBUG ===');

// Test 1: Check if CSS is loaded
const testCard = document.querySelector('.card:not(.card--completed)');
if (testCard) {
    console.log('Test card found:', testCard);
    
    // Add animation class directly
    testCard.classList.add('celebration-animation', 'celebrate-gentle-glow');
    console.log('Classes after adding:', testCard.className);
    
    // Check computed styles
    const styles = window.getComputedStyle(testCard);
    console.log('Animation:', styles.animation);
    console.log('Box shadow:', styles.boxShadow);
    
    // Remove after 3 seconds
    setTimeout(() => {
        testCard.classList.remove('celebration-animation', 'celebrate-gentle-glow');
        console.log('Animation classes removed');
    }, 3000);
}

// Test 2: Check if celebration manager exists and works
if (window.celebrationManager) {
    console.log('Celebration manager found');
    console.log('Task animations:', Object.keys(window.celebrationManager.animations.task));
    
    // Get current user preference
    const user = window.appInstance?.appState.getCurrentUser();
    console.log('User celebration preferences:', {
        task: user?.settings?.taskCelebration || 'not set',
        routine: user?.settings?.routineCelebration || 'not set'
    });
}

// Test 3: Manual animation trigger
window.testManualAnimation = (animationType = 'gentle-glow') => {
    const card = document.querySelector('.card:not(.card--completed)');
    if (card && window.celebrationManager) {
        const animation = window.celebrationManager.animations.task[animationType];
        if (animation) {
            console.log(`Triggering ${animationType} animation`);
            animation.func.call(window.celebrationManager, card);
        }
    }
};

console.log('Run testManualAnimation() to test animations');
console.log('Example: testManualAnimation("floating-stars")');