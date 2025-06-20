// Safe Material Icons check with visual feedback
(function() {
    'use strict';
    
    console.log('[Material Icons] Check script loaded');
    
    // Icon text to emoji mapping for visual feedback
    const iconMap = {
        'edit': '✏️',
        'settings': '⚙️',
        'add': '➕',
        'close': '✖️',
        'check': '✓',
        'delete': '🗑️',
        'palette': '🎨',
        'refresh': '🔄',
        'person': '👤',
        'sync': '🔄',
        'more_vert': '⋮'
    };
    
    function checkAndReport() {
        const icons = document.querySelectorAll('.material-icons');
        console.log('[Material Icons] Found ' + icons.length + ' icon elements');
        
        // Check if font loaded
        const test = document.createElement('span');
        test.className = 'material-icons';
        test.style.position = 'absolute';
        test.style.visibility = 'hidden';
        test.textContent = 'check';
        document.body.appendChild(test);
        
        const width = test.offsetWidth;
        document.body.removeChild(test);
        
        const fontLoaded = width > 20;
        console.log('[Material Icons] Font ' + (fontLoaded ? 'loaded' : 'NOT loaded') + ' (test width: ' + width + 'px)');
        
        // Add visual indicator
        if (!fontLoaded && icons.length > 0) {
            icons.forEach(function(icon) {
                const text = icon.textContent.trim();
                if (iconMap[text]) {
                    icon.setAttribute('data-emoji-fallback', iconMap[text]);
                    icon.setAttribute('title', 'Icon: ' + text + ' (using fallback)');
                }
            });
            console.log('[Material Icons] Added emoji fallback attributes');
        }
        
        // Report to user if in debug mode
        if (window.location.search.includes('debug')) {
            const status = fontLoaded ? '✅ Material Icons loaded' : '⚠️ Material Icons not loaded';
            console.log('%c' + status, 'font-size: 16px; font-weight: bold; color: ' + (fontLoaded ? 'green' : 'orange'));
        }
    }
    
    // Check on load and after delay
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(checkAndReport, 1000);
        });
    } else {
        setTimeout(checkAndReport, 1000);
    }
    
    // Also check after fonts should be loaded
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(checkAndReport);
    }
})();