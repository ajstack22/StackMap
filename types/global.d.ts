// Global type declarations for StackMap

declare global {
  interface Window {
    urlOpenPrivacy?: boolean;
    urlOpenSupport?: boolean;
    cleanupGhostUsers?: () => any;
  }
}

// Make this file a module
export {};