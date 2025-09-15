// Global type declarations for StackMap

declare global {
  interface Window {
    urlOpenPrivacy?: boolean;
    urlOpenSupport?: boolean;
    cleanupGhostUsers?: () => any;
    __earlySyncData?: {
      inviteCode: string;
      recoveryPhrase: string;
      hash: string;
    };
    __initialHash?: string;
    syncInviteDataImmediate?: {
      inviteCode: string;
      recoveryPhrase: string;
      capturedAt: string;
      hash: string;
      hashLength: number;
      usedInitialHash?: boolean;
    };
    syncInviteData?: any;
    syncInviteMode?: boolean;
    shareDataImmediate?: any;
    debugSyncParsing?: any;
  }
}

// Make this file a module
export {};