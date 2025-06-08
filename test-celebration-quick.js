// Quick test to see current state
console.log('Celebration Manager:', window.celebrationManager);
console.log('Animations:', window.celebrationManager?.animations);

// Test a simple animation
const testCard = document.querySelector('.card:not(.card--completed)');
if (testCard && window.celebrationManager) {
    console.log('Testing gentle glow on:', testCard);
    window.celebrationManager.celebrateTask(testCard, 'test');
}

// Check user settings
const currentUser = window.appInstance?.appState.getCurrentUser();
console.log('Current user settings:', currentUser?.settings);