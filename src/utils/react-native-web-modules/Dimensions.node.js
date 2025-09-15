/**
 * Web-safe Dimensions module for node_modules replacement
 * This replaces react-native's Dimensions.js directly
 */

const Dimensions = {
  get(dim) {
    if (dim === 'window') {
      return {
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
        scale: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
        fontScale: 1,
      };
    }
    if (dim === 'screen') {
      return {
        width:
          typeof window !== 'undefined' && window.screen
            ? window.screen.width
            : 1024,
        height:
          typeof window !== 'undefined' && window.screen
            ? window.screen.height
            : 768,
        scale: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
        fontScale: 1,
      };
    }
    return null;
  },

  addEventListener(type, handler) {
    if (type === 'change' && typeof window !== 'undefined') {
      const listener = () => {
        handler({
          window: Dimensions.get('window'),
          screen: Dimensions.get('screen'),
        });
      };
      window.addEventListener('resize', listener);
      window.addEventListener('orientationchange', listener);

      return {
        remove: () => {
          window.removeEventListener('resize', listener);
          window.removeEventListener('orientationchange', listener);
        },
      };
    }
    return { remove: () => {} };
  },

  removeEventListener(type, handler) {
    if (type === 'change' && typeof window !== 'undefined') {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    }
  },

  set() {
//     
  },
};

// Export in CommonJS format for node_modules
module.exports = Dimensions;
