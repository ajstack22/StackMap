/**
 * Temporary fix for Clusterize loading issues
 * This prevents the error from breaking the app while maintaining fallback functionality
 */

// Override Clusterize to prevent errors
window.Clusterize = function(options) {
    console.log('Clusterize: Using fallback due to loading issues');
    
    // Return a mock object that won't break the app
    return {
        update: function() {},
        append: function() {},
        prepend: function() {},
        refresh: function() {},
        clear: function() {},
        destroy: function() {},
        content_elem: options.contentElem || document.createElement('div'),
        scroll_elem: options.scrollElem || document.createElement('div')
    };
};

// Mark as not available so VirtualScrollAdapter will use fallback
window.ClusterizeLoadError = true;