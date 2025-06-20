// Safe Material Icons check - minimal version that won't break page
(function() {
    'use strict';
    
    // Only log to console, don't modify anything yet
    console.log('[Material Icons] Fallback script loaded');
    
    // Simple check after a delay
    setTimeout(function() {
        const icons = document.querySelectorAll('.material-icons');
        console.log('[Material Icons] Found ' + icons.length + ' icon elements');
        
        // Check if font loaded by creating test element
        const test = document.createElement('span');
        test.className = 'material-icons';
        test.style.position = 'absolute';
        test.style.visibility = 'hidden';
        test.textContent = 'check';
        document.body.appendChild(test);
        
        const width = test.offsetWidth;
        document.body.removeChild(test);
        
        if (width < 20) {
            console.log('[Material Icons] Font may not be loaded (width: ' + width + ')');
        } else {
            console.log('[Material Icons] Font appears to be loaded (width: ' + width + ')');
        }
    }, 2000);
})();