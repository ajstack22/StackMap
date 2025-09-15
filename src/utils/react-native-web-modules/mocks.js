/**
 * Mock implementations for React Native internal modules
 * These are needed for libraries like react-native-pager-view
 */

import { View } from 'react-native-web';

// Mock codegenNativeCommands
export const codegenNativeCommands = () => ({});
export default function codegenNativeComponent() {
  // Return a View component as a fallback
  return View;
}

// Mock NativeComponentRegistry
export const NativeComponentRegistry = {
  get: () => View,
  getWithFallback_DEPRECATED: () => View,
  setRuntimeConfigProvider: () => {},
};

// Mock ViewConfigIgnore
export const ViewConfigIgnore = {
  register: () => {},
};

// Mock RendererProxy
export const RendererProxy = {
  measure: () => {},
  measureInWindow: () => {},
  measureLayout: () => {},
  findNodeHandle: () => null,
};
