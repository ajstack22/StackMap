/**
 * Web-safe replacement for react-native's UIManager
 * Avoids TurboModule dependency that causes errors on web
 */

const UIManager = {
  // Basic constants
  getConstants: () => ({
    Dimensions: {
      window: {
        width: window.innerWidth || 1024,
        height: window.innerHeight || 768,
      },
      screen: {
        width: window.screen?.width || window.innerWidth || 1024,
        height: window.screen?.height || window.innerHeight || 768,
      },
    },
  }),

  // View management methods (mostly no-ops on web)
  getViewManagerConfig: viewManagerName => {
    // Return null for all view managers on web
    return null;
  },

  hasViewManagerConfig: viewManagerName => {
    return false;
  },

  // Measurement methods (simplified for web)
  measure: (node, callback) => {
    if (node && typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      callback(
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        window.pageXOffset + rect.x,
        window.pageYOffset + rect.y,
      );
    }
  },

  measureInWindow: (node, callback) => {
    if (node && typeof node.getBoundingClientRect === 'function') {
      const rect = node.getBoundingClientRect();
      callback(rect.x, rect.y, rect.width, rect.height);
    }
  },

  measureLayout: (node, relativeToNode, onFail, onSuccess) => {
    // Simplified measurement relative to another node
    try {
      if (node && relativeToNode) {
        const nodeRect = node.getBoundingClientRect();
        const relativeRect = relativeToNode.getBoundingClientRect();
        onSuccess(
          nodeRect.x - relativeRect.x,
          nodeRect.y - relativeRect.y,
          nodeRect.width,
          nodeRect.height,
        );
      }
    } catch (e) {
      onFail && onFail();
    }
  },

  measureLayoutRelativeToParent: (node, onFail, onSuccess) => {
    // Measure relative to parent
    try {
      if (node && node.parentNode) {
        const nodeRect = node.getBoundingClientRect();
        const parentRect = node.parentNode.getBoundingClientRect();
        onSuccess(
          nodeRect.x - parentRect.x,
          nodeRect.y - parentRect.y,
          nodeRect.width,
          nodeRect.height,
        );
      }
    } catch (e) {
      onFail && onFail();
    }
  },

  // Command dispatching (no-op on web)
  dispatchViewManagerCommand: (reactTag, commandID, commandArgs) => {
    // No-op on web
    console.warn(
      'UIManager.dispatchViewManagerCommand is not supported on web',
    );
  },

  // View descriptors
  RCTView: {
    directEventTypes: {},
  },

  // Additional methods that might be called
  updateView: () => {},
  createView: () => {},
  setChildren: () => {},
  manageChildren: () => {},
  removeSubviewsFromContainerWithID: () => {},
  replaceExistingNonRootView: () => {},
  setJSResponder: () => {},
  clearJSResponder: () => {},
  configureNextLayoutAnimation: () => {},
};

export default UIManager;
