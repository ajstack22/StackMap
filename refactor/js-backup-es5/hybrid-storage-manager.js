/**
 * Hybrid Storage Manager
 * Manages photo storage across IndexedDB, SQLite, and FileSystem
 * Optimizes storage based on size and access patterns
 */

class HybridStorageManager {
    constructor() {
        this.tempDB = null;
        this.metaDB = null;
        this.fileSystem = null;
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            tempDBName: 'photo_temp_storage',
            tempDBVersion: 1,
            thumbnailSize: 64,
            maxThumbnailBlob: 100 * 1024, // 100KB max for SQLite
            cleanupAge: 24 * 60 * 60 * 1000, // 24 hours
            maxRetries: 3
        };
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Initialize storage layers in parallel
            const results = await Promise.allSettled([
                this.openIndexedDB(),
                this.openSQLiteDB(),
                this.initializeFileSystem()
            ]);
            
            // Check results
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Storage layer ${index} failed:`, result.reason);
                }
            });
            
            this.isInitialized = true;
            console.log('HybridStorageManager initialized');
            
            // Start cleanup scheduler
            this.scheduleCleanup();
            
        } catch (error) {
            console.error('Failed to initialize HybridStorageManager:', error);
            throw error;
        }
    }
    
    async openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.tempDBName, this.config.tempDBVersion);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.tempDB = request.result;
                console.log('IndexedDB opened successfully');
                resolve(this.tempDB);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create temp photos store
                if (!db.objectStoreNames.contains('temp_photos')) {
                    const store = db.createObjectStore('temp_photos', {
                        keyPath: 'id'
                    });
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('status', 'status');
                }
                
                // Create recovery store
                if (!db.objectStoreNames.contains('recovery_photos')) {
                    const recovery = db.createObjectStore('recovery_photos', {
                        keyPath: 'tempId'
                    });
                    recovery.createIndex('timestamp', 'timestamp');
                    recovery.createIndex('status', 'status');
                }
                
                // Create upload sessions store
                if (!db.objectStoreNames.contains('upload_sessions')) {
                    const sessions = db.createObjectStore('upload_sessions', {
                        keyPath: 'sessionId'
                    });
                    sessions.createIndex('photoId', 'photoId');
                    sessions.createIndex('startTime', 'startTime');
                }
            };
        });
    }
    
    async openSQLiteDB() {
        // Check if we're in Capacitor environment
        if (window.Capacitor && window.Capacitor.Plugins.SQLite) {
            try {
                const SQLite = window.Capacitor.Plugins.SQLite;
                
                // Open database
                await SQLite.open({
                    database: 'stackmap_photos',
                    encrypted: false,
                    mode: 'no-encryption'
                });
                
                // Create tables
                await this.createSQLiteTables();
                
                this.metaDB = SQLite;
                console.log('SQLite database opened');
                
            } catch (error) {
                console.error('SQLite initialization failed:', error);
                // Fall back to web storage
                this.metaDB = new WebSQLFallback();
                await this.metaDB.initialize();
            }
        } else {
            // Use web storage fallback
            this.metaDB = new WebSQLFallback();
            await this.metaDB.initialize();
        }
    }
    
    async createSQLiteTables() {
        const queries = [
            // Photos table
            `CREATE TABLE IF NOT EXISTS photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                temp_id TEXT UNIQUE,
                task_id TEXT,
                file_path TEXT,
                thumbnail_blob BLOB,
                width INTEGER,
                height INTEGER,
                size INTEGER,
                mime_type TEXT,
                created_at TEXT,
                uploaded_at TEXT,
                status TEXT DEFAULT 'pending',
                retry_count INTEGER DEFAULT 0
            )`,
            
            // Upload queue table
            `CREATE TABLE IF NOT EXISTS upload_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                photo_id INTEGER,
                priority INTEGER DEFAULT 0,
                retry_count INTEGER DEFAULT 0,
                next_retry_at TEXT,
                error_message TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (photo_id) REFERENCES photos(id)
            )`,
            
            // Indexes for performance
            `CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status)`,
            `CREATE INDEX IF NOT EXISTS idx_photos_temp_id ON photos(temp_id)`,
            `CREATE INDEX IF NOT EXISTS idx_queue_priority ON upload_queue(priority DESC)`,
            `CREATE INDEX IF NOT EXISTS idx_queue_retry ON upload_queue(next_retry_at)`
        ];
        
        for (const query of queries) {
            try {
                if (this.metaDB.execute) {
                    await this.metaDB.execute({ query });
                } else if (this.metaDB.executeSql) {
                    await this.metaDB.executeSql(query);
                }
            } catch (error) {
                console.error('Failed to create table:', error);
            }
        }
    }
    
    async initializeFileSystem() {
        // Check for Capacitor Filesystem
        if (window.Capacitor && window.Capacitor.Plugins.Filesystem) {
            this.fileSystem = window.Capacitor.Plugins.Filesystem;
            
            // Create photos directory
            try {
                await this.fileSystem.mkdir({
                    path: 'photos',
                    directory: this.fileSystem.Directory.Data,
                    recursive: true
                });
                console.log('Filesystem initialized');
            } catch (error) {
                if (error.message !== 'Directory exists') {
                    console.error('Filesystem initialization error:', error);
                }
            }
        } else {
            // Web fallback - use blob URLs
            this.fileSystem = new WebFileSystemFallback();
        }
    }
    
    // Temporary photo storage (IndexedDB)
    
    async saveTempPhoto(photoData) {
        if (!this.tempDB) {
            console.warn('IndexedDB not available, skipping temp storage');
            return;
        }
        
        return new Promise((resolve, reject) => {
            const tx = this.tempDB.transaction(['temp_photos'], 'readwrite');
            const store = tx.objectStore('temp_photos');
            
            const data = {
                id: photoData.id,
                thumbnail: photoData.thumbnail,
                timestamp: photoData.timestamp || Date.now(),
                status: photoData.status || 'pending',
                retryCount: photoData.retryCount || 0
            };
            
            const request = store.put(data);
            
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getTempPhoto(tempId) {
        if (!this.tempDB) return null;
        
        return new Promise((resolve, reject) => {
            const tx = this.tempDB.transaction(['temp_photos'], 'readonly');
            const store = tx.objectStore('temp_photos');
            const request = store.get(tempId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async cleanupTempPhoto(tempId) {
        if (!this.tempDB) return;
        
        return new Promise((resolve, reject) => {
            const tx = this.tempDB.transaction(['temp_photos'], 'readwrite');
            const store = tx.objectStore('temp_photos');
            const request = store.delete(tempId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    // Photo metadata storage (SQLite)
    
    async savePhotoMetadata(tempId, metadata, thumbnail) {
        if (!this.metaDB) {
            throw new Error('SQLite not available');
        }
        
        // Prepare thumbnail blob
        let thumbnailBlob = null;
        if (thumbnail && thumbnail.length < this.config.maxThumbnailBlob) {
            thumbnailBlob = thumbnail;
        }
        
        // Insert photo record
        const photoQuery = `
            INSERT INTO photos (
                temp_id, task_id, thumbnail_blob, 
                width, height, size, mime_type, created_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const photoValues = [
            tempId,
            metadata.taskId || null,
            thumbnailBlob,
            metadata.width || 0,
            metadata.height || 0,
            metadata.size || 0,
            metadata.mimeType || 'image/jpeg',
            new Date().toISOString(),
            'uploading'
        ];
        
        let photoId;
        
        try {
            // Execute based on storage type
            if (this.metaDB.execute) {
                // Capacitor SQLite
                const result = await this.metaDB.execute({
                    query: photoQuery,
                    values: photoValues
                });
                photoId = result.changes.lastId;
            } else {
                // Web fallback
                const result = await this.metaDB.executeSql(photoQuery, photoValues);
                photoId = result.insertId;
            }
            
            // Insert into upload queue
            const queueQuery = `
                INSERT INTO upload_queue (
                    photo_id, priority, next_retry_at
                ) VALUES (?, ?, ?)
            `;
            
            const queueValues = [
                photoId,
                metadata.priority || 0,
                new Date().toISOString()
            ];
            
            if (this.metaDB.execute) {
                await this.metaDB.execute({
                    query: queueQuery,
                    values: queueValues
                });
            } else {
                await this.metaDB.executeSql(queueQuery, queueValues);
            }
            
            return { photoId, tempId };
            
        } catch (error) {
            console.error('Failed to save photo metadata:', error);
            throw error;
        }
    }
    
    async updatePhotoStatus(photoId, status, filePath = null) {
        if (!this.metaDB) return;
        
        const query = filePath ?
            'UPDATE photos SET status = ?, file_path = ?, uploaded_at = ? WHERE id = ?' :
            'UPDATE photos SET status = ? WHERE id = ?';
        
        const values = filePath ?
            [status, filePath, new Date().toISOString(), photoId] :
            [status, photoId];
        
        try {
            if (this.metaDB.execute) {
                await this.metaDB.execute({ query, values });
            } else {
                await this.metaDB.executeSql(query, values);
            }
        } catch (error) {
            console.error('Failed to update photo status:', error);
        }
    }
    
    // Full image storage (FileSystem)
    
    async saveFullImage(photoId, imageBlob) {
        const fileName = `photo_${photoId}_${Date.now()}.jpg`;
        
        try {
            if (this.fileSystem.writeFile) {
                // Capacitor filesystem
                const base64Data = await this.blobToBase64(imageBlob);
                
                const result = await this.fileSystem.writeFile({
                    path: `photos/${fileName}`,
                    data: base64Data,
                    directory: this.fileSystem.Directory.Data
                });
                
                const filePath = result.uri;
                
                // Update database with file path
                await this.updatePhotoStatus(photoId, 'uploaded', filePath);
                
                return filePath;
                
            } else {
                // Web fallback - use blob URL
                const blobUrl = URL.createObjectURL(imageBlob);
                
                // Store blob URL reference
                this.fileSystem.storeBlobUrl(fileName, blobUrl);
                
                // Update database
                await this.updatePhotoStatus(photoId, 'uploaded', blobUrl);
                
                return blobUrl;
            }
        } catch (error) {
            console.error('Failed to save full image:', error);
            throw error;
        }
    }
    
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    // Recovery storage
    
    async savePhotoForRecovery(recoveryData) {
        if (!this.tempDB) return;
        
        return new Promise((resolve, reject) => {
            const tx = this.tempDB.transaction(['recovery_photos'], 'readwrite');
            const store = tx.objectStore('recovery_photos');
            
            const data = {
                tempId: recoveryData.tempId,
                imageData: recoveryData.imageData,
                metadata: recoveryData.metadata || {},
                error: recoveryData.error,
                timestamp: recoveryData.timestamp || Date.now(),
                status: 'pending_recovery',
                retryCount: 0
            };
            
            const request = store.put(data);
            
            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getOrphanedUploads() {
        const orphaned = [];
        
        // Check IndexedDB for pending photos
        if (this.tempDB) {
            const tempPhotos = await this.getPendingTempPhotos();
            orphaned.push(...tempPhotos);
        }
        
        // Check recovery storage
        const recoveryPhotos = await this.getRecoveryPhotos();
        orphaned.push(...recoveryPhotos);
        
        return orphaned;
    }
    
    async getPendingTempPhotos() {
        if (!this.tempDB) return [];
        
        return new Promise((resolve, reject) => {
            const tx = this.tempDB.transaction(['temp_photos'], 'readonly');
            const store = tx.objectStore('temp_photos');
            const index = store.index('status');
            const request = index.getAll('pending');
            
            request.onsuccess = () => {
                const photos = request.result || [];
                // Filter old photos (>5 minutes)
                const cutoff = Date.now() - (5 * 60 * 1000);
                const orphaned = photos.filter(p => p.timestamp < cutoff);
                resolve(orphaned);
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async getRecoveryPhotos() {
        if (!this.tempDB) return [];
        
        return new Promise((resolve, reject) => {
            const tx = this.tempDB.transaction(['recovery_photos'], 'readonly');
            const store = tx.objectStore('recovery_photos');
            const index = store.index('status');
            const request = index.getAll('pending_recovery');
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
    
    // Cleanup methods
    
    scheduleCleanup() {
        // Run cleanup every hour
        setInterval(() => {
            this.performCleanup();
        }, 60 * 60 * 1000);
        
        // Initial cleanup after 5 minutes
        setTimeout(() => {
            this.performCleanup();
        }, 5 * 60 * 1000);
    }
    
    async performCleanup() {
        console.log('Performing storage cleanup...');
        
        try {
            // Clean old temp photos
            await this.cleanOldTempPhotos();
            
            // Clean completed uploads
            await this.cleanCompletedUploads();
            
            // Clean orphaned files
            await this.cleanOrphanedFiles();
            
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
    
    async cleanOldTempPhotos() {
        if (!this.tempDB) return;
        
        const cutoff = Date.now() - this.config.cleanupAge;
        
        return new Promise((resolve, reject) => {
            const tx = this.tempDB.transaction(['temp_photos'], 'readwrite');
            const store = tx.objectStore('temp_photos');
            const index = store.index('timestamp');
            
            const range = IDBKeyRange.upperBound(cutoff);
            const request = index.openCursor(range);
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async cleanCompletedUploads() {
        if (!this.metaDB) return;
        
        const query = `
            DELETE FROM upload_queue 
            WHERE photo_id IN (
                SELECT id FROM photos 
                WHERE status = 'uploaded' 
                AND uploaded_at < datetime('now', '-1 day')
            )
        `;
        
        try {
            if (this.metaDB.execute) {
                await this.metaDB.execute({ query });
            } else {
                await this.metaDB.executeSql(query);
            }
        } catch (error) {
            console.error('Failed to clean completed uploads:', error);
        }
    }
    
    async cleanOrphanedFiles() {
        // Implementation depends on filesystem access
        // For now, just log
        console.log('Orphaned file cleanup not implemented');
    }
}

// Web Storage Fallback for SQLite
class WebSQLFallback {
    constructor() {
        this.dbName = 'stackmap_photos_web';
        this.db = null;
    }
    
    async initialize() {
        // Use IndexedDB as SQLite fallback
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onerror = () => reject(request.error);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('photos')) {
                    const photos = db.createObjectStore('photos', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    photos.createIndex('temp_id', 'temp_id', { unique: true });
                    photos.createIndex('status', 'status');
                }
                
                if (!db.objectStoreNames.contains('upload_queue')) {
                    const queue = db.createObjectStore('upload_queue', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    queue.createIndex('photo_id', 'photo_id');
                    queue.createIndex('priority', 'priority');
                }
            };
        });
    }
    
    async executeSql(query, values = []) {
        // Simple SQL to IndexedDB mapping
        if (query.toLowerCase().includes('insert into photos')) {
            return this.insertPhoto(values);
        } else if (query.toLowerCase().includes('insert into upload_queue')) {
            return this.insertQueue(values);
        } else if (query.toLowerCase().includes('update photos')) {
            return this.updatePhoto(query, values);
        }
        
        return { insertId: null };
    }
    
    async insertPhoto(values) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['photos'], 'readwrite');
            const store = tx.objectStore('photos');
            
            const data = {
                temp_id: values[0],
                task_id: values[1],
                thumbnail_blob: values[2],
                width: values[3],
                height: values[4],
                size: values[5],
                mime_type: values[6],
                created_at: values[7],
                status: values[8]
            };
            
            const request = store.add(data);
            
            request.onsuccess = () => resolve({ insertId: request.result });
            request.onerror = () => reject(request.error);
        });
    }
    
    async insertQueue(values) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['upload_queue'], 'readwrite');
            const store = tx.objectStore('upload_queue');
            
            const data = {
                photo_id: values[0],
                priority: values[1],
                next_retry_at: values[2]
            };
            
            const request = store.add(data);
            
            request.onsuccess = () => resolve({ insertId: request.result });
            request.onerror = () => reject(request.error);
        });
    }
    
    async updatePhoto(query, values) {
        // Simple update implementation
        return new Promise((resolve) => {
            // For now, just resolve
            resolve({ changes: 0 });
        });
    }
}

// Web FileSystem Fallback
class WebFileSystemFallback {
    constructor() {
        this.blobUrls = new Map();
    }
    
    storeBlobUrl(fileName, blobUrl) {
        this.blobUrls.set(fileName, blobUrl);
    }
    
    getBlobUrl(fileName) {
        return this.blobUrls.get(fileName);
    }
    
    revokeBlobUrl(fileName) {
        const url = this.blobUrls.get(fileName);
        if (url) {
            URL.revokeObjectURL(url);
            this.blobUrls.delete(fileName);
        }
    }
}

// Export
window.HybridStorageManager = HybridStorageManager;