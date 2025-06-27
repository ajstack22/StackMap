/**
 * Voice Attachment - SQLite integration for voice recordings
 * Handles storage, retrieval, and management of voice memos
 */

var VoiceAttachment = (function() {
  'use strict';
  
  // Maximum attachment size (10MB)
  var MAX_ATTACHMENT_SIZE = 10485760;
  
  // Maximum attachments per task
  var MAX_ATTACHMENTS_PER_TASK = 5;
  
  // Constructor
  function VoiceAttachment(storage) {
    this.storage = storage;
    this.tableName = 'voice_attachments';
    this.initialized = false;
  }
  
  // Initialize voice attachments table
  VoiceAttachment.prototype.initialize = function(callback) {
    var self = this;
    
    if (this.initialized) {
      if (callback) callback(null);
      return Promise.resolve();
    }
    
    var schema = 
      'CREATE TABLE IF NOT EXISTS ' + this.tableName + ' (' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT,' +
        'task_id INTEGER NOT NULL,' +
        'blob BLOB NOT NULL,' +
        'mime_type TEXT NOT NULL,' +
        'duration INTEGER NOT NULL,' +
        'size INTEGER NOT NULL,' +
        'mode TEXT NOT NULL,' +
        'created_at INTEGER NOT NULL,' +
        'metadata TEXT,' +
        'FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE' +
      ');' +
      
      'CREATE INDEX IF NOT EXISTS idx_voice_task_id ' +
      'ON ' + this.tableName + '(task_id);' +
      
      'CREATE INDEX IF NOT EXISTS idx_voice_created ' +
      'ON ' + this.tableName + '(created_at);';
    
    return this.storage.executeSql(schema).then(function() {
      self.initialized = true;
      if (callback) callback(null);
    }).catch(function(err) {
      console.error('Failed to initialize voice attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Save voice recording
  VoiceAttachment.prototype.save = function(taskId, blob, metadata, callback) {
    var self = this;
    
    // Validate inputs
    if (!taskId || !blob) {
      var error = new Error('Missing required parameters');
      if (callback) callback(error);
      return Promise.reject(error);
    }
    
    // Check blob size
    if (blob.size > MAX_ATTACHMENT_SIZE) {
      var sizeError = new Error('Recording exceeds size limit');
      sizeError.code = 'SIZE_LIMIT';
      if (callback) callback(sizeError);
      return Promise.reject(sizeError);
    }
    
    // Check attachment count for task
    return this.getCountForTask(taskId).then(function(count) {
      if (count >= MAX_ATTACHMENTS_PER_TASK) {
        var limitError = new Error('Maximum attachments reached');
        limitError.code = 'ATTACHMENT_LIMIT';
        throw limitError;
      }
      
      // Convert blob to base64 for SQLite storage
      return self.blobToBase64(blob);
    }).then(function(base64) {
      // Prepare metadata
      var meta = metadata || {};
      meta.originalSize = blob.size;
      meta.originalType = blob.type;
      
      // Insert into database
      var sql = 
        'INSERT INTO ' + self.tableName + ' ' +
        '(task_id, blob, mime_type, duration, size, mode, created_at, metadata) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      
      var params = [
        taskId,
        base64,
        blob.type || 'audio/webm',
        meta.duration || 0,
        blob.size,
        meta.mode || 'quickThought',
        Date.now(),
        JSON.stringify(meta)
      ];
      
      return self.storage.executeSql(sql, params);
    }).then(function(result) {
      var attachmentId = result.insertId;
      
      // Return attachment info
      var attachment = {
        id: attachmentId,
        taskId: taskId,
        size: blob.size,
        duration: metadata.duration || 0,
        createdAt: Date.now()
      };
      
      if (callback) callback(null, attachment);
      return attachment;
    }).catch(function(err) {
      console.error('Failed to save voice attachment:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Get voice attachments for a task
  VoiceAttachment.prototype.getForTask = function(taskId, callback) {
    var self = this;
    
    var sql = 
      'SELECT id, task_id, mime_type, duration, size, mode, created_at, metadata ' +
      'FROM ' + this.tableName + ' ' +
      'WHERE task_id = ? ' +
      'ORDER BY created_at DESC';
    
    return this.storage.executeSql(sql, [taskId]).then(function(result) {
      var attachments = [];
      
      for (var i = 0; i < result.rows.length; i++) {
        var row = result.rows.item(i);
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
    }).catch(function(err) {
      console.error('Failed to get voice attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Get voice attachment blob by ID
  VoiceAttachment.prototype.getBlob = function(attachmentId, callback) {
    var self = this;
    
    var sql = 
      'SELECT blob, mime_type ' +
      'FROM ' + this.tableName + ' ' +
      'WHERE id = ?';
    
    return this.storage.executeSql(sql, [attachmentId]).then(function(result) {
      if (result.rows.length === 0) {
        var notFound = new Error('Attachment not found');
        notFound.code = 'NOT_FOUND';
        throw notFound;
      }
      
      var row = result.rows.item(0);
      var base64 = row.blob;
      var mimeType = row.mime_type;
      
      // Convert base64 back to blob
      return self.base64ToBlob(base64, mimeType);
    }).then(function(blob) {
      if (callback) callback(null, blob);
      return blob;
    }).catch(function(err) {
      console.error('Failed to get voice blob:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Delete voice attachment
  VoiceAttachment.prototype.delete = function(attachmentId, callback) {
    var sql = 
      'DELETE FROM ' + this.tableName + ' ' +
      'WHERE id = ?';
    
    return this.storage.executeSql(sql, [attachmentId]).then(function(result) {
      if (callback) callback(null, result.rowsAffected > 0);
      return result.rowsAffected > 0;
    }).catch(function(err) {
      console.error('Failed to delete voice attachment:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Delete all voice attachments for a task
  VoiceAttachment.prototype.deleteForTask = function(taskId, callback) {
    var sql = 
      'DELETE FROM ' + this.tableName + ' ' +
      'WHERE task_id = ?';
    
    return this.storage.executeSql(sql, [taskId]).then(function(result) {
      if (callback) callback(null, result.rowsAffected);
      return result.rowsAffected;
    }).catch(function(err) {
      console.error('Failed to delete task voice attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Get attachment count for a task
  VoiceAttachment.prototype.getCountForTask = function(taskId, callback) {
    var sql = 
      'SELECT COUNT(*) as count ' +
      'FROM ' + this.tableName + ' ' +
      'WHERE task_id = ?';
    
    return this.storage.executeSql(sql, [taskId]).then(function(result) {
      var count = result.rows.item(0).count;
      if (callback) callback(null, count);
      return count;
    }).catch(function(err) {
      console.error('Failed to get attachment count:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Get total storage used
  VoiceAttachment.prototype.getTotalSize = function(callback) {
    var sql = 
      'SELECT SUM(size) as total ' +
      'FROM ' + this.tableName;
    
    return this.storage.executeSql(sql).then(function(result) {
      var total = result.rows.item(0).total || 0;
      if (callback) callback(null, total);
      return total;
    }).catch(function(err) {
      console.error('Failed to get total size:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Clean up old attachments (retention policy)
  VoiceAttachment.prototype.cleanupOld = function(daysToKeep, callback) {
    var cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    var sql = 
      'DELETE FROM ' + this.tableName + ' ' +
      'WHERE created_at < ?';
    
    return this.storage.executeSql(sql, [cutoffTime]).then(function(result) {
      if (callback) callback(null, result.rowsAffected);
      return result.rowsAffected;
    }).catch(function(err) {
      console.error('Failed to cleanup old attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  // Convert blob to base64 for storage
  VoiceAttachment.prototype.blobToBase64 = function(blob) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      
      reader.onload = function() {
        // Extract base64 data from data URL
        var dataUrl = reader.result;
        var base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      
      reader.onerror = function() {
        reject(new Error('Failed to read blob'));
      };
      
      reader.readAsDataURL(blob);
    });
  };
  
  // Convert base64 back to blob
  VoiceAttachment.prototype.base64ToBlob = function(base64, mimeType) {
    try {
      // Decode base64
      var byteCharacters = atob(base64);
      var byteNumbers = new Array(byteCharacters.length);
      
      for (var i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      var byteArray = new Uint8Array(byteNumbers);
      
      // Create blob
      return new Blob([byteArray], { type: mimeType });
    } catch (err) {
      console.error('Failed to convert base64 to blob:', err);
      throw err;
    }
  };
  
  // Export all attachments for a task (for backup)
  VoiceAttachment.prototype.exportForTask = function(taskId, callback) {
    var self = this;
    
    return this.getForTask(taskId).then(function(attachments) {
      var exports = [];
      var promises = [];
      
      // Get blob for each attachment
      attachments.forEach(function(attachment) {
        var promise = self.getBlob(attachment.id).then(function(blob) {
          exports.push({
            metadata: attachment,
            blob: blob
          });
        });
        promises.push(promise);
      });
      
      return Promise.all(promises).then(function() {
        return exports;
      });
    }).then(function(exports) {
      if (callback) callback(null, exports);
      return exports;
    }).catch(function(err) {
      console.error('Failed to export attachments:', err);
      if (callback) callback(err);
      throw err;
    });
  };
  
  return VoiceAttachment;
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceAttachment;
}