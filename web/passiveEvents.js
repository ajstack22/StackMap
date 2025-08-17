/**
 * Web-specific configuration to make event listeners passive
 * This improves scroll performance and removes Chrome warnings
 */

// Override addEventListener to make wheel, touchstart, and touchmove events passive by default
if (typeof window !== 'undefined' && window.addEventListener) {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    // Events that should be passive by default for better performance
    const passiveEvents = ['wheel', 'touchstart', 'touchmove', 'scroll'];
    
    let modifiedOptions = options;
    
    if (passiveEvents.includes(type)) {
      if (typeof options === 'boolean') {
        modifiedOptions = {
          capture: options,
          passive: true
        };
      } else if (typeof options === 'object' && options !== null) {
        modifiedOptions = {
          ...options,
          passive: options.passive !== false // Only override if not explicitly set to false
        };
      } else {
        modifiedOptions = { passive: true };
      }
    }
    
    return originalAddEventListener.call(this, type, listener, modifiedOptions);
  };
}

console.log('[Performance] Passive event listeners enabled for wheel and touch events');