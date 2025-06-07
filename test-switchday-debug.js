
// DORMANT-2025-01-06: Day switching in main app

// Test switchDay functionality
console.log('=== TESTING SWITCHDAY ===');
console.log('Current day:', window.appInstance?.appState?.getCurrentDay?.());
console.log('switchDay method exists:', typeof window.appInstance?.switchDay === 'function');
console.log('setCurrentDay method exists:', typeof window.appInstance?.appState?.setCurrentDay === 'function');

// Test the method call
if (window.appInstance?.switchDay) {
    console.log('Testing switchDay with tomorrow...');
    window.appInstance.switchDay('tomorrow');
    console.log('After switchDay call, current day is:', window.appInstance.appState.getCurrentDay());
}

