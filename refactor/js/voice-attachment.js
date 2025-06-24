/**
 * Voice Attachment - SQLite integration for voice recordings
 * Handles storage, retrieval, and management of voice memos
 */

// Maximum attachment size (10MB)
const MAX_ATTACHMENT_SIZE = 10485760;

// Maximum attachments per task
const MAX_ATTACHMENTS_PER_TASK = 5;

class VoiceAttachment {
  constructor(storage) {
    this.storage = storage;
    this.tableName = 'voice_attachments';
    this.initialized = false;
  }

  // Initialize voice attachments table
  initialize(callback) {
    if (this.initialized) {
      if (callback) callback(null);
      return Promise.resolve();
    }
    
    const schema = 
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT,task_id INTEGER NOT NULL,blob BLOB NOT NULL,mime_type TEXT NOT NULL,duration INTEGER NOT NULL,size INTEGER NOT NULL,mode TEXT NOT NULL,created_at INTEGER NOT NULL,metadata TEXT,FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE);CREATE INDEX IF NOT EXISTS idx_voice_task_id ON ${this.tableName}(task_id);CREATE INDEX IF NOT EXISTS idx_voice_created ON ${this.tableName}(created_at);`;
    
    return this.storage.executeSql(schema).then(() => {
      this.initialized = true;
      if (callback) callback(null);
    }).catch((err) => {
      console.error('Failed to initialize voice attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  }

  // Save voice recording
  save(taskId, blob, metadata, callback) {
    // Validate inputs
    if (!taskId || !blob) {
      const error = new Error('Missing required parameters');
      if (callback) callback(error);
      return Promise.reject(error);
    }
    
    // Check blob size
    if (blob.size > MAX_ATTACHMENT_SIZE) {
      const sizeError = new Error('Recording exceeds size limit');
      sizeError.code = 'SIZE_LIMIT';
      if (callback) callback(sizeError);
      return Promise.reject(sizeError);
    }
    
    // Check attachment count for task
    return this.getCountForTask(taskId).then((count) => {
      if (count >= MAX_ATTACHMENTS_PER_TASK) {
        const limitError = new Error('Maximum attachments reached');
        limitError.code = 'ATTACHMENT_LIMIT';
        throw limitError;
      }
      
      // Convert blob to base64 for SQLite storage
      return this.blobToBase64(blob);
    }).then((base64) => {
      // Prepare metadata
      const meta = metadata || {};
      meta.originalSize = blob.size;
      meta.originalType = blob.type;
      
      // Insert into database
      const sql = 
        `INSERT INTO ${this.tableName} (task_id, blob, mime_type, duration, size, mode, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const params = [
        taskId,
        base64,
        blob.type || 'audio/webm',
        meta.duration || 0,
        blob.size,
        meta.mode || 'quickThought',
        Date.now(),
        JSON.stringify(meta)
      ];
      
      return this.storage.executeSql(sql, params);
    }).then((result) => {
      const attachmentId = result.insertId;
      
      // Return attachment info
      const attachment = {
        id: attachmentId,
        taskId: taskId,
        size: blob.size,
        duration: metadata.duration || 0,
        createdAt: Date.now()
      };
      
      if (callback) callback(null, attachment);
      return attachment;
    }).catch((err) => {
      console.error('Failed to save voice attachment:', err);
      if (callback) callback(err);
      throw err;
    });
  }

  // Get voice attachments for a task
  getForTask(taskId, callback) {
    const sql = 
      `SELECT id, task_id, mime_type, duration, size, mode, created_at, metadata FROM ${this.tableName} WHERE task_id = ? ORDER BY created_at DESC`;
    
    return this.storage.executeSql(sql, [taskId]).then((result) => {
      const attachments = [];
      
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        attachments.push({
          id: row.id,
          taskId: row.task_id,
          mimeType: row.mime_type,
          duration: row.duration,
          size: row.size,
          mode: row.mode,
          createdAt: row.created_at,
          metadata: JSON.parse(row.metadata || '{}')
        });
      }
      
      if (callback) callback(null, attachments);
      return attachments;
    }).catch((err) => {
      console.error('Failed to get voice attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  }

  // Get voice attachment blob by ID
  getBlob(attachmentId, callback) {
    const sql = 
      `SELECT blob, mime_type FROM ${this.tableName} WHERE id = ?`;
    
    return this.storage.executeSql(sql, [attachmentId]).then((result) => {
      if (result.rows.length === 0) {
        const notFound = new Error('Attachment not found');
        notFound.code = 'NOT_FOUND';
        throw notFound;
      }
      
      const row = result.rows.item(0);
      const base64 = row.blob;
      const mimeType = row.mime_type;
      
      // Convert base64 back to blob
      return this.base64ToBlob(base64, mimeType);
    }).then((blob) => {
      if (callback) callback(null, blob);
      return blob;
    }).catch((err) => {
      console.error('Failed to get voice blob:', err);
      if (callback) callback(err);
      throw err;
    });
  }

  // Delete voice attachment
  delete(attachmentId, callback) {
    const sql = 
      `DELETE FROM ${this.tableName} WHERE id = ?`;
    
    return this.storage.executeSql(sql, [attachmentId]).then((result) => {
      if (callback) callback(null, result.rowsAffected > 0);
      return result.rowsAffected > 0;
    }).catch((err) => {
      console.error('Failed to delete voice attachment:', err);
      if (callback) callback(err);
      throw err;
    });
  }

  // Delete all voice attachments for a task
  deleteForTask(taskId, callback) {
    const sql = 
      `DELETE FROM ${this.tableName} WHERE task_id = ?`;
    
    return this.storage.executeSql(sql, [taskId]).then((result) => {
      if (callback) callback(null, result.rowsAffected);
      return result.rowsAffected;
    }).catch((err) => {
      console.error('Failed to delete task voice attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  }

  // Get attachment count for a task
  getCountForTask(taskId, callback) {
    const sql = 
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE task_id = ?`;
    
    return this.storage.executeSql(sql, [taskId]).then((result) => {
      const count = result.rows.item(0).count;
      if (callback) callback(null, count);
      return count;
    }).catch((err) => {
      console.error('Failed to get attachment count:', err);
      if (callback) callback(err);
      throw err;
    });
  }

  // Get total storage used
  getTotalSize(callback) {
    const sql = 
      `SELECT SUM(size) as total FROM ${this.tableName}`;
    
    return this.storage.executeSql(sql).then((result) => {
      const total = result.rows.item(0).total || 0;
      if (callback) callback(null, total);
      return total;
    }).catch((err) => {
      console.error('Failed to get total size:', err);
      if (callback) callback(err);
      throw err;
    });
  }

  // Clean up old attachments (retention policy)
  cleanupOld(daysToKeep, callback) {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const sql = 
      `DELETE FROM ${this.tableName} WHERE created_at < ?`;
    
    return this.storage.executeSql(sql, [cutoffTime]).then((result) => {
      if (callback) callback(null, result.rowsAffected);
      return result.rowsAffected;
    }).catch((err) => {
      console.error('Failed to cleanup old attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  }

  // Convert blob to base64 for storage
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        // Extract base64 data from data URL
        const dataUrl = reader.result;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read blob'));
      };
      
      reader.readAsDataURL(blob);
    });
  }

  // Convert base64 back to blob
  base64ToBlob(base64, mimeType) {
    try {
      // Decode base64
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      
      // Create blob
      return new Blob([byteArray], { type: mimeType });
    } catch (err) {
      console.error('Failed to convert base64 to blob:', err);
      throw err;
    }
  }

  // Export all attachments for a task (for backup)
  exportForTask(taskId, callback) {
    return this.getForTask(taskId).then((attachments) => {
      const exports = [];
      const promises = [];
      
      // Get blob for each attachment
      attachments.forEach((attachment) => {
        const promise = this.getBlob(attachment.id).then((blob) => {
          exports.push({
            metadata: attachment,
            blob: blob
          });
        });
        promises.push(promise);
      });
      
      return Promise.all(promises).then(() => {
        return exports;
      });
    }).then((exports) => {
      if (callback) callback(null, exports);
      return exports;
    }).catch((err) => {
      console.error('Failed to export attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceAttachment;
}

export default VoiceAttachment;