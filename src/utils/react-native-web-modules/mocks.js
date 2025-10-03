/**
 * Mock implementations for React Native internal modules
 * These are needed for libraries like react-native-pager-view
 */

import { View } from 'react-native-web';

/**
 * Mock codegenNativeCommands implementation
 * @description Returns empty object for codegen native commands
 * @returns {Object} Empty commands object
 */
export const codegenNativeCommands = () => ({});

/**
 * Mock codegenNativeComponent implementation
 * @description Returns a View component as fallback for native components
 * @returns {React.Component} View component from react-native-web
 */
export default function codegenNativeComponent() {
  // Return a View component as a fallback
  return View;
}

/**
 * Mock NativeComponentRegistry
 * @description Provides mock registry for native components
 * @type {Object}
 */
export const NativeComponentRegistry = {
  /**
   * Get a native component
   * @returns {React.Component} View component as fallback
   */
  get: () => View,
  /**
   * Get component with fallback (deprecated)
   * @returns {React.Component} View component as fallback
   */
  getWithFallback_DEPRECATED: () => View,
  /**
   * Set runtime config provider (no-op)
   * @returns {void}
   */
  setRuntimeConfigProvider: () => {},
};

/**
 * Mock ViewConfigIgnore
 * @description Provides mock view config ignore functionality
 * @type {Object}
 */
export const ViewConfigIgnore = {
  /**
   * Register view config (no-op)
   * @returns {void}
   */
  register: () => {},
};

/**
 * Mock RendererProxy
 * @description Provides mock renderer proxy methods
 * @type {Object}
 */
export const RendererProxy = {
  /**
   * Measure component (no-op)
   * @returns {void}
   */
  measure: () => {},
  /**
   * Measure component in window (no-op)
   * @returns {void}
   */
  measureInWindow: () => {},
  /**
   * Measure layout (no-op)
   * @returns {void}
   */
  measureLayout: () => {},
  /**
   * Find node handle
   * @returns {null} Always returns null
   */
  findNodeHandle: () => null,
};
