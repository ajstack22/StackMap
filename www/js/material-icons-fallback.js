// Material Icons Fallback for Android
// This script provides fallbacks when Material Icons font fails to load

(function() {
    'use strict';
    
    // Icon name to emoji/text mapping
    const iconFallbacks = {
        'edit': '✏️',
        'settings': '⚙️',
        'add': '+',
        'add_circle': '⊕',
        'close': '×',
        'check': '✓',
        'check_circle': '✅',
        'delete': '🗑',
        'palette': '🎨',
        'refresh': '↻',
        'sync': '🔄',
        'cloud_upload': '☁️',
        'cloud_download': '⬇️',
        'person': '👤',
        'arrow_drop_down': '▼',
        'more_vert': '⋮',
        'timer': '⏱',
        'play_arrow': '▶',
        'pause': '⏸',
        'stop': '⏹'
    };
    
    // Check if Material Icons loaded properly
    function checkMaterialIcons() {
        // Create a test element
        const testEl = document.createElement('span');
        testEl.className = 'material-icons';
        testEl.style.position = 'absolute';
        testEl.style.visibility = 'hidden';
        testEl.textContent = 'check';
        document.body.appendChild(testEl);
        
        // Check if the font loaded by measuring width
        const width = testEl.offsetWidth;
        document.body.removeChild(testEl);
        
        // If width is too small, font didn't load
        return width > 20;
    }
    
    // Apply fallbacks to all material icons
    function applyFallbacks() {
        const icons = document.querySelectorAll('.material-icons');
        
        icons.forEach(icon => {
            const iconName = icon.textContent.trim();
            
            // If we have a fallback for this icon
            if (iconFallbacks[iconName]) {
                // Add data attribute to track original
                icon.setAttribute('data-icon', iconName);
                
                // Replace with fallback
                icon.textContent = iconFallbacks[iconName];
                icon.style.fontFamily = 'system-ui, -apple-system, sans-serif';
                
                // Add class for styling
                icon.classList.add('icon-fallback');
            }
        });
        
        console.log(`Applied fallbacks to ${icons.length} icons`);
    }
    
    // Wait for DOM and check icons
    function initIconFallback() {
        // Check immediately
        if (!checkMaterialIcons()) {
            console.log('Material Icons not loaded, applying fallbacks');
            applyFallbacks();
        }
        
        // Also check after fonts should have loaded
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                if (!checkMaterialIcons()) {
                    applyFallbacks();
                }
            });
        } else {
            // Fallback for older browsers
            setTimeout(() => {
                if (!checkMaterialIcons()) {
                    applyFallbacks();
                }
            }, 2000);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIconFallback);
    } else {
        initIconFallback();
    }
    
    // Also re-check when new elements are added
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('material-icons')) {
                        if (!checkMaterialIcons()) {
                            applyFallbacks();
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();