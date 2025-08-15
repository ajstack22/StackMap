// Type definitions for services
// This helps catch method call errors even in JavaScript files

declare module '@services/sync/syncService' {
  interface SyncService {
    // Properties
    syncEnabled: boolean;
    syncId: string | null;
    syncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'offline' | 'conflicts';
    
    // Core methods
    initialize(recoveryPhrase?: string | null): Promise<any>;
    enable(): Promise<any>;
    disable(): Promise<void>;
    sync(): Promise<void>;
    requestSync(options?: any): Promise<void>;
    
    // Data methods
    pullData(): Promise<any>;
    pushData(): Promise<void>;
    getCurrentState(): any;
    restoreData(data: any): Promise<void>;
    mergeData(remoteData: any): Promise<any>;
    applyState(state: any): Promise<void>;
    
    // Sync management
    generateSyncId(recoveryPhrase: string): Promise<string>;
    getSyncId(): string | null;
    getRecoveryPhrase(): Promise<string | null>;
    isEnabled(): Promise<boolean>;
    verifySyncExists(): Promise<boolean>;
    deleteFromServer(): Promise<void>;
    getApiUrl(): string;
    
    // Status and listeners
    addStatusListener(callback: (status: any) => void): () => void;
    getStatus(): any;
    retryFailed(): Promise<void>;
    
    // Sharing
    createShareLink(userId: string, options?: any): Promise<any>;
    deleteShare(shareId: string): Promise<void>;
    generateShareToken(temporary?: boolean): string;
    getActiveShares(): Promise<any[]>;
    
    // Internal properties (for reference)
    encryptionService: any;
    API_BASE_URL: string;
  }
  
  const syncService: SyncService;
  export default syncService;
}

declare module '@services/sync/encryptionService' {
  interface EncryptionService {
    masterKey: Uint8Array | null;
    syncId: string | null;
    
    // Initialization
    initialize(recoveryPhrase: string, syncId: string, salt?: string): Promise<void>;
    clear(): Promise<void>;
    
    // Encryption/Decryption
    encryptData(data: any): string;
    decryptData(encryptedData: string): any;
    
    // Key management
    deriveKeyFromPhrase(phrase: string, salt?: string): Promise<{key: Uint8Array, salt: string}>;
    generateRecoveryPhrase(): string;
    getStoredRecoveryPhrase(): Promise<string | null>;
    storeRecoveryPhrase(phrase: string): Promise<void>;
    
    // Device info
    getDeviceId(): Promise<string>;
    getDeviceName(): string;
  }
  
  const encryptionService: EncryptionService;
  export default encryptionService;
}

declare module '@stores/useAppStore' {
  // Zustand store type
  interface AppStore {
    // Add specific store properties and methods as needed
    users: any;
    currentUser: string;
    activities: any[];
    
    // Zustand built-in methods
    getState: () => AppStore;
    setState: (partial: Partial<AppStore> | ((state: AppStore) => Partial<AppStore>)) => void;
    subscribe: (listener: (state: AppStore, prevState: AppStore) => void) => () => void;
  }
  
  export const useAppStore: AppStore & (() => AppStore);
}

declare module '@services/sync/conflictResolver' {
  interface ConflictResolver {
    detectConflicts(local: any, remote: any): any[];
    resolveConflicts(conflicts: any[], strategy?: string): Promise<any>;
    resolveUserConflict(conflict: any, choice: string): any;
    mergeValues(local: any, remote: any, path: string): any;
    applyResolutions(resolutions: any, state: any): any;
  }
  
  const conflictResolver: ConflictResolver;
  export default conflictResolver;
}

declare module '@services/sync/syncQueue' {
  interface SyncQueue {
    initialize(): void;
    enqueue(item: any): Promise<void>;
    process(syncService: any): Promise<void>;
    clear(): Promise<void>;
    push(item: any): void;
    splice(start: number, deleteCount?: number): any[];
    getFailed(): any[];
    getStatus(): any;
    isNetworkError(error: any): boolean;
    retry(id: string): Promise<void>;
  }
  
  const syncQueue: SyncQueue;
  export default syncQueue;
}

declare module '@services/sync/networkMonitor' {
  interface NetworkMonitor {
    isOnline: boolean;
    start(): void;
    addListener(callback: (online: boolean) => void): () => void;
  }
  
  const networkMonitor: NetworkMonitor;
  export default networkMonitor;
}

declare module '@services/sync/changeTracker' {
  interface ChangeTracker {
    startTracking(): void;
    markAsSynced(): void;
    shouldUseIncremental(): boolean;
    createIncrementalUpdate(currentState: any): any;
  }
  
  const changeTracker: ChangeTracker;
  export default changeTracker;
}

declare module '@services/sync/syncThrottle' {
  interface SyncThrottle {
    requestSync(fn: () => Promise<any>, options?: any): Promise<any>;
    clear(): void;
  }
  
  const syncThrottle: SyncThrottle;
  export default syncThrottle;
}

declare module '@services/sync/syncHistory' {
  interface SyncHistory {
    initialize(): void;
    addError(error: any): Promise<void>;
  }
  
  const syncHistory: SyncHistory;
  export default syncHistory;
}