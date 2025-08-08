// Polyfills for web environment

// setImmediate polyfill
if (typeof setImmediate === 'undefined') {
  global.setImmediate = function(callback) {
    return setTimeout(callback, 0);
  };
  global.clearImmediate = function(id) {
    return clearTimeout(id);
  };
}

// requestAnimationFrame polyfill
if (typeof requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 1000 / 60);
  };
}

// cancelAnimationFrame polyfill  
if (typeof cancelAnimationFrame === 'undefined') {
  global.cancelAnimationFrame = function(id) {
    return clearTimeout(id);
  };
}