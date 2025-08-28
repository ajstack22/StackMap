// DEBUG SYNC - Minimal implementation to test if sync can work at all
import AsyncStorage from '@react-native-async-storage/async-storage';

class DebugSync {
  constructor() {
    this.syncId = null;
    this.data = null;
    console.log('[DEBUG-SYNC] Constructor called');
    
    // Try to load immediately
    this.load();
  }
  
  async load() {
    try {
      const syncId = await AsyncStorage.getItem('@sync_id');
      const data = await AsyncStorage.getItem('@debug_sync_data');
      
      console.log('[DEBUG-SYNC] Loaded:', { syncId, hasData: !!data });
      
      this.syncId = syncId;
      this.data = data ? JSON.parse(data) : null;
      
      // If we have sync but no data, pull immediately
      if (syncId && !data) {
        console.log('[DEBUG-SYNC] Have sync but no data - pulling...');
        await this.pullAndApply();
      }
    } catch (error) {
      console.error('[DEBUG-SYNC] Load failed:', error);
    }
  }
  
  async pullAndApply() {
    if (!this.syncId) {
      console.log('[DEBUG-SYNC] No sync ID');
      return;
    }
    
    try {
      console.log('[DEBUG-SYNC] Fetching from server...');
      
      // Pull ALL data
      const response = await fetch(
        `https://stackmap.app/qual/api/sync/pull_timestamp.php?sync_id=${this.syncId}&device_id=debug&since=0`
      );
      
      if (!response.ok) {
        console.error('[DEBUG-SYNC] Pull failed:', response.status);
        return;
      }
      
      const result = await response.json();
      console.log('[DEBUG-SYNC] Got records:', result.records?.length);
      
      if (result.records && result.records.length > 0) {
        // Just save the raw encrypted data for now
        this.data = result.records;
        await AsyncStorage.setItem('@debug_sync_data', JSON.stringify(this.data));
        console.log('[DEBUG-SYNC] Saved data to storage');
        
        // Try to trigger UI update
        if (window.debugSyncCallback) {
          window.debugSyncCallback(this.data);
        }
      }
    } catch (error) {
      console.error('[DEBUG-SYNC] Pull error:', error);
    }
  }
  
  async testSync() {
    console.log('[DEBUG-SYNC] Test sync starting...');
    await this.pullAndApply();
    return this.data;
  }
}

const debugSync = new DebugSync();

// Expose globally for testing
if (typeof window !== 'undefined') {
  window.debugSync = debugSync;
  window.testDebugSync = () => debugSync.testSync();
}

export default debugSync;