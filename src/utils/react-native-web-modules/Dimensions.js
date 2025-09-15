/**
 * Web-safe replacement for react-native's Dimensions module
 * Avoids TurboModule dependency that causes errors on web
 * This version exports a plain object to mimic the native API directly.
 */

const Dimensions = {
  get(dim) {
    if (dim === 'window') {
      return {
        width: window.innerWidth || 1024,
        height: window.innerHeight || 768,
        scale: window.devicePixelRatio || 1,
        fontScale: 1,
      };
    }
    if (dim === 'screen') {
      return {
        width: window.screen?.width || window.innerWidth || 1024,
        height: window.screen?.height || window.innerHeight || 768,
        scale: window.devicePixelRatio || 1,
        fontScale: 1,
      };
    }
    // Return null for unsupported dimensions
    return null;
  },

  addEventListener(type, handler) {
    if (type === 'change') {
      const listener = () => {
        handler({
          window: this.get('window'),
          screen: this.get('screen'),
        });
      };
      window.addEventListener('resize', listener);
      window.addEventListener('orientationchange', listener);

      // Return subscription object
      return {
        remove: () => {
          window.removeEventListener('resize', listener);
          window.removeEventListener('orientationchange', listener);
        },
      };
    }
    return { remove: () => {} };
  },

  set() {
    // Not used on web
//     
  },
};

export default Dimensions;
