/**
 * Enhanced Offline Storage for StackMap
 * Handles IndexedDB storage for schedules with Google Drive sync
 */

export class OfflineStorage {
  constructor() {
    this.dbName = 'stackmap-offline';
    this.version = 1;
    this.db = null;
    this.syncQueue = [];
    this.initializeDB();
  }

  async initializeDB() {
    try {
      this.db = await this.openDB();
      console.log('StackMap offline storage initialized');
      
      // Process any pending sync operations
      if (navigator.onLine) {
        await this.processSyncQueue();
      }
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('schedules')) {
          const scheduleStore = db.createObjectStore('schedules', { keyPath: 'id' });
          scheduleStore.createIndex('lastModified', 'lastModified', { unique: false });
          scheduleStore.createIndex('userId', 'userId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Save schedule with automatic sync queueing
  async saveSchedule(schedule) {
    if (!this.db) await this.initializeDB();
    
    try {
      // Add metadata
      schedule.lastModified = new Date().toISOString();
      schedule.syncStatus = navigator.onLine ? 'synced' : 'pending';
      
      // Save to IndexedDB
      const tx = this.db.transaction(['schedules'], 'readwrite');
      await tx.objectStore('schedules').put(schedule);
      
      // Queue for sync if online
      if (navigator.onLine && this.hasGoogleDriveAuth()) {
        await this.syncToGoogleDrive(schedule);
      } else if (!navigator.onLine) {
        await this.addToSyncQueue('schedule', schedule);
      }
      
      return { success: true, id: schedule.id };
    } catch (error) {
      console.error('Error saving schedule:', error);
      return { success: false, error: error.message };
    }
  }

  // Get schedule by ID
  async getSchedule(id) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction(['schedules'], 'readonly');
    const schedule = await tx.objectStore('schedules').get(id);
    return schedule;
  }

  // Get all schedules
  async getAllSchedules() {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction(['schedules'], 'readonly');
    const schedules = await tx.objectStore('schedules').getAll();
    return schedules;
  }

  // Delete schedule
  async deleteSchedule(id) {
    if (!this.db) await this.initializeDB();
    
    try {
      const tx = this.db.transaction(['schedules'], 'readwrite');
      await tx.objectStore('schedules').delete(id);
      
      // Queue deletion for sync
      if (navigator.onLine && this.hasGoogleDriveAuth()) {
        await this.deleteFromGoogleDrive(id);
      } else {
        await this.addToSyncQueue('delete', { id });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return { success: false, error: error.message };
    }
  }

  // Add operation to sync queue
  async addToSyncQueue(operation, data) {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction(['syncQueue'], 'readwrite');
    await tx.objectStore('syncQueue').add({
      operation,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Process sync queue when online
  async processSyncQueue() {
    if (!this.db || !navigator.onLine) return;
    
    const tx = this.db.transaction(['syncQueue'], 'readwrite');
    const store = tx.objectStore('syncQueue');
    const items = await store.getAll();
    
    for (const item of items) {
      try {
        switch (item.operation) {
          case 'schedule':
            await this.syncToGoogleDrive(item.data);
            break;
          case 'delete':
            await this.deleteFromGoogleDrive(item.data.id);
            break;
        }
        
        // Remove from queue after successful sync
        await store.delete(item.id);
      } catch (error) {
        console.error('Sync queue processing error:', error);
      }
    }
  }

  // Check if Google Drive auth is available
  hasGoogleDriveAuth() {
    // Check if Google Drive integration is set up
    return localStorage.getItem('googleDriveToken') !== null;
  }

  // Sync to Google Drive (placeholder - implement based on your auth)
  async syncToGoogleDrive(schedule) {
    // This would integrate with your existing Google Drive sync
    console.log('Syncing to Google Drive:', schedule.id);
    // Implementation depends on your Google Drive integration
  }

  // Delete from Google Drive
  async deleteFromGoogleDrive(scheduleId) {
    console.log('Deleting from Google Drive:', scheduleId);
    // Implementation depends on your Google Drive integration
  }

  // Get storage statistics
  async getStorageStats() {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction(['schedules'], 'readonly');
    const count = await tx.objectStore('schedules').count();
    
    const stats = {
      scheduleCount: count,
      storageUsed: 0,
      storageAvailable: 0
    };
    
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      stats.storageUsed = estimate.usage || 0;
      stats.storageAvailable = estimate.quota || 0;
    }
    
    return stats;
  }

  // Clear all data (for debugging/reset)
  async clearAllData() {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction(['schedules', 'syncQueue', 'settings'], 'readwrite');
    await tx.objectStore('schedules').clear();
    await tx.objectStore('syncQueue').clear();
    await tx.objectStore('settings').clear();
    
    console.log('All offline data cleared');
  }

  // Export all data (for backup)
  async exportAllData() {
    if (!this.db) await this.initializeDB();
    
    const tx = this.db.transaction(['schedules', 'settings'], 'readonly');
    const schedules = await tx.objectStore('schedules').getAll();
    const settings = await tx.objectStore('settings').getAll();
    
    return {
      version: this.version,
      exportDate: new Date().toISOString(),
      schedules,
      settings
    };
  }

  // Import data (from backup)
  async importData(data) {
    if (!this.db) await this.initializeDB();
    
    try {
      const tx = this.db.transaction(['schedules', 'settings'], 'readwrite');
      
      // Import schedules
      for (const schedule of data.schedules || []) {
        await tx.objectStore('schedules').put(schedule);
      }
      
      // Import settings
      for (const setting of data.settings || []) {
        await tx.objectStore('settings').put(setting);
      }
      
      return { success: true, imported: data.schedules?.length || 0 };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorage();

// Set up online/offline listeners
window.addEventListener('online', () => {
  console.log('Back online - processing sync queue');
  offlineStorage.processSyncQueue();
});

window.addEventListener('offline', () => {
  console.log('Gone offline - data will be synced when connection returns');
});

export default offlineStorage;