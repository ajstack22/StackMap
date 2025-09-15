/**
 * Web-safe replacement for react-native's Linking module
 */

const LinkingWeb = {
  canOpenURL: () => {
    return Promise.resolve(true);
  },

  openURL: url => {
    window.open(url, '_blank');
    return Promise.resolve();
  },

  getInitialURL: () => {
    return Promise.resolve(window.location.href);
  },

  addEventListener: (type, handler) => {
    if (type === 'url') {
      const listener = () => {
        handler({ url: window.location.href });
      };
      window.addEventListener('popstate', listener);
      return {
        remove: () => window.removeEventListener('popstate', listener),
      };
    }
    return { remove: () => {} };
  },

  removeEventListener: (type, handler) => {
    if (type === 'url') {
      window.removeEventListener('popstate', handler);
    }
  },

  openSettings: () => {
//     
    return Promise.resolve();
  },

  sendIntent: () => {
//     
    return Promise.resolve();
  },
};

export default LinkingWeb;
