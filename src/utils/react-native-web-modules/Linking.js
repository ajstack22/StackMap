/**
 * Web-safe replacement for react-native's Linking module
 */

const LinkingWeb = {
  canOpenURL: url => {
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
      const listener = event => {
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
    console.warn('Linking.openSettings is not supported on web');
    return Promise.resolve();
  },

  sendIntent: () => {
    console.warn('Linking.sendIntent is not supported on web');
    return Promise.resolve();
  },
};

export default LinkingWeb;
