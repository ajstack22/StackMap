// DEBUG SYNC - Minimal implementation to test if sync can work at all
import AsyncStorage from '@react-native-async-storage/async-storage';

class DebugSync {
  constructor() {
    this.syncId = null;
    this.data = null;
    this.logs = [];
    
    this.log('Constructor called');
    
    // Try to load immediately
    this.load();
  }
  
  log(message, data = null) {
    const entry = `[DEBUG-SYNC] ${message}`;
    this.logs.push(entry);
    if (data) {
      this.logs.push(JSON.stringify(data));
    }
  }
  
  async load() {
    try {
      const syncId = await AsyncStorage.getItem('@sync_id');
      const data = await AsyncStorage.getItem('@debug_sync_data');
      
      this.log('Loaded', { 
        syncId, 
        hasData: !!data,
        dataLength: data ? JSON.parse(data).length : 0
      });
      
      this.syncId = syncId;
      this.data = data ? JSON.parse(data) : null;
      
      // If we have sync but no data, pull immediately
      if (syncId && !data) {
        this.log('Have sync but no data - pulling...');
        await this.pullAndApply();
      } else if (data) {
        this.log('Data already in storage! Records: ' + this.data.length);
      }
    } catch (error) {
      this.log('Load failed: ' + error.message);
    }
  }
  
  async pullAndApply() {
    if (!this.syncId) {
      this.log('No sync ID');
      return;
    }
    
    try {
      this.log('Fetching from server...');
      
      // Generate a valid device ID (32 char hex)
      const deviceId = 'deadbeefdeadbeefdeadbeefdeadbeef'; // Exactly 32 hex chars
      
      // Pull ALL data
      const url = `https://stackmap.app/qual/api/sync/pull_timestamp.php?sync_id=${this.syncId}&device_id=${deviceId}&since=0`;
      this.log('URL: ' + url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        this.log(`Pull failed: ${response.status} - ${errorText}`);
        return;
      }
      
      const result = await response.json();
      this.log(`Got records: ${result.records?.length}`);
      
      if (result.records && result.records.length > 0) {
        // Just save the raw encrypted data for now
        this.data = result.records;
        await AsyncStorage.setItem('@debug_sync_data', JSON.stringify(this.data));
        this.log('Saved data to storage');
        
        // Try to trigger UI update
        if (window.debugSyncCallback) {
          window.debugSyncCallback(this.data);
        }
      }
    } catch (error) {
      this.log('Pull error: ' + error.message);
    }
  }
  
  async testSync() {
    this.log('Test sync starting...');
    await this.pullAndApply();
    
    // Return logs so we can see what happened
    return {
      data: this.data,
      logs: this.logs
    };
  }
}

const debugSync = new DebugSync();

// Expose globally for testing
if (typeof window !== 'undefined') {
  window.debugSync = debugSync;
  window.testDebugSync = () => debugSync.testSync();
  window.debugSyncLogs = () => debugSync.logs;
  
  // Also create a visible element to show logs
  window.showDebugSyncLogs = () => {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:10px;right:10px;background:white;border:2px solid red;padding:10px;z-index:9999;max-width:400px;max-height:300px;overflow:auto;';
    div.innerHTML = '<h3>Debug Sync Logs</h3><pre>' + debugSync.logs.join('\n') + '</pre>';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 10000); // Remove after 10 seconds
  };
}

export default debugSync;