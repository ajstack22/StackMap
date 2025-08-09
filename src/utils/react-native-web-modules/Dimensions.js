/**
 * Web-safe replacement for react-native's Dimensions module
 * Avoids TurboModule dependency that causes errors on web
 */

class DimensionsWeb {
  static get(dim) {
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
    throw new Error(`No dimension set for key ${dim}`);
  }

  static addEventListener(type, handler) {
    if (type === 'change') {
      const listener = () => {
        handler({
          window: DimensionsWeb.get('window'),
          screen: DimensionsWeb.get('screen'),
        });
      };
      window.addEventListener('resize', listener);
      window.addEventListener('orientationchange', listener);
      
      // Return subscription object
      return {
        remove: () => {
          window.removeEventListener('resize', listener);
          window.removeEventListener('orientationchange', listener);
        }
      };
    }
    return { remove: () => {} };
  }

  static removeEventListener(type, handler) {
    // For backward compatibility
    if (type === 'change') {
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    }
  }

  static set() {
    // Not used on web
    console.warn('Dimensions.set is not supported on web');
  }
}

export default DimensionsWeb;
export const Dimensions = DimensionsWeb;