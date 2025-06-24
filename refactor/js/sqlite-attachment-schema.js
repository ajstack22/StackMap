/**
 * SQLite Attachment Schema Extension
 * Adds support for photo and voice memo attachments in SQLite
 * 
 * This extends the existing SQLite storage to support attachments
 * while maintaining compatibility with the existing photo storage
 */

(function() {
    'use strict';
    
    const SQLiteAttachmentSchema = {
        /**
         * Create attachments table in SQLite
         */
        createAttachmentsTable: function(db, callback) {
            const createTable = 
                'CREATE TABLE IF NOT EXISTS attachments (' +
                '  id TEXT PRIMARY KEY,' +
                '  task_id TEXT NOT NULL,' +
                '  type TEXT NOT NULL CHECK(type IN ("photo", "voice")),' +
                '  filename TEXT,' +
                '  size INTEGER NOT NULL,' +
                '  mime_type TEXT,' +
                '  duration REAL,' +  // For voice memos (seconds)
                '  waveform TEXT,' +  // JSON array for voice visualization
                '  storage_type TEXT NOT NULL CHECK(storage_type IN ("indexeddb", "sqlite", "filesystem")),' +
                '  storage_path TEXT,' +  // Reference to where blob is stored
                '  thumbnail_data TEXT,' +  // Base64 thumbnail for photos
                '  metadata TEXT,' +  // JSON for additional data
                '  created_at TEXT DEFAULT (datetime("now")),' +
                '  updated_at TEXT DEFAULT (datetime("now"))' +
                ')';
            
            db.execute(createTable, [], false).then(function() {
                console.log('SQLite: Attachments table created');
                
                // Create indexes for performance
                const indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_attachments_task ON attachments(task_id)',
                    'CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(type)',
                    'CREATE INDEX IF NOT EXISTS idx_attachments_created ON attachments(created_at)'
                ];
                
                let completed = 0;
                indexes.forEach(function(indexSql) {
                    db.execute(indexSql, [], false).then(function() {
                        completed++;
                        if (completed === indexes.length) {
                            if (callback) callback(true);
                        }
                    }).catch(function(error) {
                        console.error('SQLite: Index creation failed', error);
                        completed++;
                        if (completed === indexes.length) {
                            if (callback) callback(false, error);
                        }
                    });
                });
            }).catch(function(error) {
                console.error('SQLite: Failed to create attachments table', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Create voice memo data table for storing audio blobs in SQLite
         * (Only for small voice memos, larger ones use filesystem)
         */
        createVoiceDataTable: function(db, callback) {
            const createTable = 
                'CREATE TABLE IF NOT EXISTS voice_data (' +
                '  attachment_id TEXT PRIMARY KEY,' +
                '  audio_data BLOB NOT NULL,' +
                '  FOREIGN KEY (attachment_id) REFERENCES attachments(id) ON DELETE CASCADE' +
                ')';
            
            db.execute(createTable, [], false).then(function() {
                console.log('SQLite: Voice data table created');
                if (callback) callback(true);
            }).catch(function(error) {
                console.error('SQLite: Failed to create voice data table', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Migrate existing photo data from IndexedDB references
         */
        migratePhotoReferences: function(db, photoStorage, callback) {
            // This will be called to migrate existing photos to the new schema
            // For now, we'll keep photos in IndexedDB and just track references
            console.log('SQLite: Photo migration not needed - keeping IndexedDB storage');
            if (callback) callback(true);
        },
        
        /**
         * Initialize attachment schema
         */
        init: function(db, callback) {
            const self = this;
            
            // Create attachments table
            self.createAttachmentsTable(db, function(success, error) {
                if (!success) {
                    if (callback) callback(false, error);
                    return;
                }
                
                // Create voice data table
                self.createVoiceDataTable(db, function(voiceSuccess, voiceError) {
                    if (!voiceSuccess) {
                        console.warn('SQLite: Voice data table creation failed, continuing', voiceError);
                    }
                    
                    console.log('SQLite: Attachment schema initialized');
                    if (callback) callback(true);
                });
            });
        }
    };
    
    /**
     * Attachment operations for SQLite
     */
    const SQLiteAttachmentOps = {
        /**
         * Add attachment metadata to SQLite
         */
        addAttachment: function(db, attachment, callback) {
            const sql = 'INSERT INTO attachments (id, task_id, type, filename, size, mime_type, ' +
                     'duration, waveform, storage_type, storage_path, thumbnail_data, metadata) ' +
                     'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            
            const values = [
                attachment.id,
                attachment.taskId,
                attachment.type,
                attachment.filename || null,
                attachment.size,
                attachment.mimeType || null,
                attachment.duration || null,
                attachment.waveform ? JSON.stringify(attachment.waveform) : null,
                attachment.storageType,
                attachment.storagePath || null,
                attachment.thumbnailData || null,
                attachment.metadata ? JSON.stringify(attachment.metadata) : null
            ];
            
            db.execute(sql, values, false).then(function() {
                if (callback) callback({ success: true, id: attachment.id });
            }).catch(function(error) {
                console.error('SQLite: Failed to add attachment', error);
                if (callback) callback({ success: false, error: error.message });
            });
        },
        
        /**
         * Get attachments for a task
         */
        getAttachmentsByTask: function(db, taskId, callback) {
            const sql = 'SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC';
            
            db.query(sql, [taskId]).then(function(result) {
                const attachments = [];
                if (result && result.values) {
                    for (let i = 0; i < result.values.length; i++) {
                        const row = result.values[i];
                        attachments.push({
                            id: row[0],
                            taskId: row[1],
                            type: row[2],
                            filename: row[3],
                            size: row[4],
                            mimeType: row[5],
                            duration: row[6],
                            waveform: row[7] ? JSON.parse(row[7]) : null,
                            storageType: row[8],
                            storagePath: row[9],
                            thumbnailData: row[10],
                            metadata: row[11] ? JSON.parse(row[11]) : null,
                            createdAt: row[12],
                            updatedAt: row[13]
                        });
                    }
                }
                if (callback) callback(attachments);
            }).catch(function(error) {
                console.error('SQLite: Failed to get attachments', error);
                if (callback) callback([]);
            });
        },
        
        /**
         * Delete attachment
         */
        deleteAttachment: function(db, attachmentId, callback) {
            const sql = 'DELETE FROM attachments WHERE id = ?';
            
            db.execute(sql, [attachmentId], false).then(function() {
                // Also delete from voice_data if it exists
                const deleteVoice = 'DELETE FROM voice_data WHERE attachment_id = ?';
                return db.execute(deleteVoice, [attachmentId], false);
            }).then(function() {
                if (callback) callback({ success: true });
            }).catch(function(error) {
                console.error('SQLite: Failed to delete attachment', error);
                if (callback) callback({ success: false, error: error.message });
            });
        },
        
        /**
         * Delete all attachments for a task
         */
        deleteTaskAttachments: function(db, taskId, callback) {
            // First get all attachment IDs
            const selectSql = 'SELECT id FROM attachments WHERE task_id = ?';
            
            db.query(selectSql, [taskId]).then(function(result) {
                if (!result || !result.values || result.values.length === 0) {
                    if (callback) callback({ success: true });
                    return;
                }
                
                // Delete each attachment
                const deletePromises = [];
                for (let i = 0; i < result.values.length; i++) {
                    const attachmentId = result.values[i][0];
                    deletePromises.push(db.execute('DELETE FROM attachments WHERE id = ?', [attachmentId], false));
                    deletePromises.push(db.execute('DELETE FROM voice_data WHERE attachment_id = ?', [attachmentId], false));
                }
                
                return Promise.all(deletePromises);
            }).then(function() {
                if (callback) callback({ success: true });
            }).catch(function(error) {
                console.error('SQLite: Failed to delete task attachments', error);
                if (callback) callback({ success: false, error: error.message });
            });
        },
        
        /**
         * Store voice memo data in SQLite (for small memos)
         */
        storeVoiceData: function(db, attachmentId, audioBlob, callback) {
            // Convert blob to base64 for SQLite storage
            const reader = new FileReader();
            reader.onloadend = function() {
                const base64 = reader.result.split(',')[1]; // Remove data:audio/webm;base64,
                const sql = 'INSERT INTO voice_data (attachment_id, audio_data) VALUES (?, ?)';
                
                db.execute(sql, [attachmentId, base64], false).then(function() {
                    if (callback) callback({ success: true });
                }).catch(function(error) {
                    console.error('SQLite: Failed to store voice data', error);
                    if (callback) callback({ success: false, error: error.message });
                });
            };
            reader.readAsDataURL(audioBlob);
        },
        
        /**
         * Get voice memo data from SQLite
         */
        getVoiceData: function(db, attachmentId, callback) {
            const sql = 'SELECT audio_data FROM voice_data WHERE attachment_id = ?';
            
            db.query(sql, [attachmentId]).then(function(result) {
                if (result && result.values && result.values.length > 0) {
                    const base64 = result.values[0][0];
                    // Convert base64 back to blob
                    const mimeType = 'audio/webm';
                    const byteCharacters = atob(base64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: mimeType });
                    
                    if (callback) callback({ success: true, blob: blob });
                } else {
                    if (callback) callback({ success: false, error: 'Voice data not found' });
                }
            }).catch(function(error) {
                console.error('SQLite: Failed to get voice data', error);
                if (callback) callback({ success: false, error: error.message });
            });
        }
    };
    
    // Export
    window.SQLiteAttachmentSchema = SQLiteAttachmentSchema;
    window.SQLiteAttachmentOps = SQLiteAttachmentOps;
})();