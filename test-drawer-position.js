// Drawer Handle Position Debugger
// Run this in the console to adjust handle position in real-time

window.adjustDrawerHandle = function() {
    // Get current values
    const root = document.documentElement;
    const currentClosed = getComputedStyle(root).getPropertyValue('--drawer-handle-offset-closed').trim();
    const currentOpen = getComputedStyle(root).getPropertyValue('--drawer-handle-offset-open').trim();
    
    console.log('=== DRAWER HANDLE POSITION ADJUSTER ===');
    console.log('Current position when closed:', currentClosed);
    console.log('Current position when open:', currentOpen);
    console.log('\nUse these commands to adjust:');
    console.log('setHandleClosed(-80)  // Move handle when closed (negative = higher)');
    console.log('setHandleOpen(20)     // Move handle when open (positive = higher from bottom)');
    console.log('showHandleGuide()     // Show visual guide');
    console.log('hideHandleGuide()     // Hide visual guide');
    
    // Helper functions
    window.setHandleClosed = function(pixels) {
        document.documentElement.style.setProperty('--drawer-handle-offset-closed', pixels + 'px');
        console.log('Handle closed position set to:', pixels + 'px');
    };
    
    window.setHandleOpen = function(pixels) {
        document.documentElement.style.setProperty('--drawer-handle-offset-open', pixels + 'px');
        console.log('Handle open position set to:', pixels + 'px');
    };
    
    window.showHandleGuide = function() {
        const handle = document.getElementById('drawerHandle');
        const drawer = document.getElementById('drawerExtension');
        
        // Add visual guides
        handle.style.background = 'rgba(255, 0, 0, 0.3)';
        handle.style.border = '2px dashed red';
        
        drawer.style.border = '2px solid blue';
        drawer.style.background = 'rgba(0, 0, 255, 0.1)';
        
        console.log('Visual guides enabled (red = handle, blue = drawer)');
    };
    
    window.hideHandleGuide = function() {
        const handle = document.getElementById('drawerHandle');
        const drawer = document.getElementById('drawerExtension');
        
        handle.style.background = '';
        handle.style.border = '';
        
        drawer.style.border = '';
        drawer.style.background = '';
        
        console.log('Visual guides disabled');
    };
    
    // Show current drawer state
    const drawer = document.getElementById('drawerExtension');
    const isOpen = drawer.classList.contains('open');
    console.log('\nDrawer is currently:', isOpen ? 'OPEN' : 'CLOSED');
    console.log('Click the handle to toggle drawer state');
};

// Auto-run on load
window.adjustDrawerHandle();