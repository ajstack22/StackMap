// Global type augmentations

// Window object extensions
declare global {
  interface Window {
    // Onboarding functions
    __onboardingImportResolve?: (data: any) => void;
    __onboardingImportReject?: (error: Error) => void;
    
    // URL handlers
    urlOpenPrivacy?: () => void;
    urlOpenSupport?: () => void;
    urlOpenGitHub?: () => void;
    
    // Debug flags
    __DEV__?: boolean;
    __TEST__?: boolean;
    
    // Platform detection
    isReactNative?: boolean;
    isWeb?: boolean;
    isIOS?: boolean;
    isAndroid?: boolean;
    
    // Storage debugging
    __clearStorage?: () => void;
    __inspectStorage?: () => void;
    
    // Sync debugging
    __syncDebug?: boolean;
    __syncLogs?: any[];
  }
  
  // Node.js global extensions
  namespace NodeJS {
    interface Global {
      __DEV__: boolean;
      __TEST__: boolean;
    }
  }
}

// Make this a module
export {};