/**
 * SQLite Storage Implementation for StackMap
 * Using @capacitor-community/sqlite for reliable, offline-first storage
 * 
 * Based on production patterns from Todoist, Notion, and Bear
 * Optimized for ADHD/autism users who need 100% reliability
 */

(function() {
    'use strict';
    
    // Check if running in Capacitor environment
    var isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    
    var TaskSQLite = {
        db: null,
        dbName: 'stackmap_tasks.db',
        dbVersion: 1,
        isReady: false,
        sqlite: null,
        
        /**
         * Initialize SQLite database
         */
        init: function(callback) {
            var self = this;
            
            // Skip if not in Capacitor environment
            if (!isCapacitor) {
                console.log('SQLite: Not in native environment, skipping initialization');
                if (callback) callback(false, 'Not in native environment');
                return;
            }
            
            // Import SQLite plugin
            Capacitor.Plugins.CapacitorSQLite.then(function(sqlitePlugin) {
                self.sqlite = sqlitePlugin.CapacitorSQLite;
                
                // Create connection
                self.createConnection()
                    .then(function() {
                        return self.createTables();
                    })
                    .then(function() {
                        return self.optimizeForPerformance();
                    })
                    .then(function() {
                        self.isReady = true;
                        console.log('SQLite: Database initialized successfully');
                        if (callback) callback(true);
                    })
                    .catch(function(error) {
                        console.error('SQLite: Initialization failed', error);
                        if (callback) callback(false, error);
                    });
            }).catch(function(error) {
                console.error('SQLite: Plugin not available', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Create database connection
         */
        createConnection: function() {
            var self = this;
            
            return self.sqlite.createConnection({
                database: self.dbName,
                version: self.dbVersion,
                encrypted: false,
                mode: 'no-encryption',
                readonly: false
            }).then(function(db) {
                self.db = db;
                return self.sqlite.open({ database: self.dbName });
            });
        },
        
        /**
         * Create database tables
         */
        createTables: function() {
            var self = this;
            
            var statements = [
                'PRAGMA foreign_keys = ON',
                
                // Tasks table
                'CREATE TABLE IF NOT EXISTS tasks (' +
                '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
                '  title TEXT NOT NULL,' +
                '  description TEXT,' +
                '  completed INTEGER DEFAULT 0,' +
                '  priority INTEGER DEFAULT 1,' +
                '  parent_id INTEGER,' +
                '  created_at TEXT DEFAULT (datetime("now")),' +
                '  updated_at TEXT DEFAULT (datetime("now")),' +
                '  completed_at TEXT,' +
                '  tags TEXT,' +
                '  metadata TEXT' +
                ')',
                
                // Attachments table
                'CREATE TABLE IF NOT EXISTS attachments (' +
                '  id INTEGER PRIMARY KEY AUTOINCREMENT,' +
                '  task_id INTEGER NOT NULL,' +
                '  filename TEXT NOT NULL,' +
                '  file_path TEXT NOT NULL,' +
                '  file_size INTEGER NOT NULL,' +
                '  created_at TEXT DEFAULT (datetime("now")),' +
                '  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE' +
                ')',
                
                // Indexes for performance
                'CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)',
                'CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at)',
                'CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id)',
                'CREATE INDEX IF NOT EXISTS idx_attachments_task ON attachments(task_id)',
                
                // Update trigger for modified timestamp
                'CREATE TRIGGER IF NOT EXISTS tasks_updated_at ' +
                'AFTER UPDATE ON tasks ' +
                'BEGIN ' +
                '  UPDATE tasks SET updated_at = datetime("now") WHERE id = NEW.id; ' +
                'END'
            ];
            
            return self.sqlite.executeSet({
                database: self.dbName,
                set: statements.map(function(statement) {
                    return { statement: statement, values: [] };
                })
            });
        },
        
        /**
         * Optimize database for low-memory devices
         */
        optimizeForPerformance: function() {
            var self = this;
            
            var statements = [
                'PRAGMA cache_size = -1024',      // 1MB cache
                'PRAGMA temp_store = MEMORY',     // Use memory for temp storage
                'PRAGMA journal_mode = WAL',      // Write-ahead logging
                'PRAGMA synchronous = NORMAL'     // Balance safety and speed
            ];
            
            return self.sqlite.executeSet({
                database: self.dbName,
                set: statements.map(function(statement) {
                    return { statement: statement, values: [] };
                })
            });
        },
        
        /**
         * Create a new task
         */
        createTask: function(task, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            // Prepare task data
            var title = task.title || 'Untitled';
            var description = task.description || '';
            var priority = task.priority || 1;
            var parentId = task.parentId || null;
            var tags = task.tags ? JSON.stringify(task.tags) : '[]';
            var metadata = task.metadata ? JSON.stringify(task.metadata) : '{}';
            
            var statement = 'INSERT INTO tasks (title, description, priority, parent_id, tags, metadata) ' +
                           'VALUES (?, ?, ?, ?, ?, ?)';
            var values = [title, description, priority, parentId, tags, metadata];
            
            self.sqlite.run({
                database: self.dbName,
                statement: statement,
                values: values
            }).then(function(result) {
                var taskId = result.changes.lastId;
                if (callback) callback({ id: taskId }, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to create task', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Get tasks with pagination
         */
        getTasks: function(options, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback([], null);
                return;
            }
            
            options = options || {};
            var limit = options.limit || 50;
            var offset = options.offset || 0;
            var status = options.status; // 'pending', 'completed', or null for all
            
            var statement = 'SELECT * FROM tasks';
            var values = [];
            
            if (status === 'pending') {
                statement += ' WHERE completed = 0';
            } else if (status === 'completed') {
                statement += ' WHERE completed = 1';
            }
            
            statement += ' ORDER BY completed ASC, created_at DESC LIMIT ? OFFSET ?';
            values.push(limit, offset);
            
            self.sqlite.query({
                database: self.dbName,
                statement: statement,
                values: values
            }).then(function(result) {
                var tasks = (result.values || []).map(function(row) {
                    return self.parseTaskRow(row);
                });
                if (callback) callback(tasks, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to get tasks', error);
                if (callback) callback([], error);
            });
        },
        
        /**
         * Get a single task with attachments
         */
        getTask: function(taskId, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            // Get task
            self.sqlite.query({
                database: self.dbName,
                statement: 'SELECT * FROM tasks WHERE id = ?',
                values: [taskId]
            }).then(function(result) {
                if (!result.values || result.values.length === 0) {
                    if (callback) callback(null, new Error('Task not found'));
                    return;
                }
                
                var task = self.parseTaskRow(result.values[0]);
                
                // Get attachments
                return self.sqlite.query({
                    database: self.dbName,
                    statement: 'SELECT * FROM attachments WHERE task_id = ?',
                    values: [taskId]
                }).then(function(attachmentResult) {
                    task.attachments = attachmentResult.values || [];
                    if (callback) callback(task, null);
                });
            }).catch(function(error) {
                console.error('SQLite: Failed to get task', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Update a task
         */
        updateTask: function(taskId, updates, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            var fields = [];
            var values = [];
            
            // Build dynamic update statement
            if (updates.title !== undefined) {
                fields.push('title = ?');
                values.push(updates.title);
            }
            if (updates.description !== undefined) {
                fields.push('description = ?');
                values.push(updates.description);
            }
            if (updates.completed !== undefined) {
                fields.push('completed = ?');
                values.push(updates.completed ? 1 : 0);
                
                if (updates.completed) {
                    fields.push('completed_at = datetime("now")');
                } else {
                    fields.push('completed_at = NULL');
                }
            }
            if (updates.priority !== undefined) {
                fields.push('priority = ?');
                values.push(updates.priority);
            }
            if (updates.tags !== undefined) {
                fields.push('tags = ?');
                values.push(JSON.stringify(updates.tags));
            }
            if (updates.metadata !== undefined) {
                fields.push('metadata = ?');
                values.push(JSON.stringify(updates.metadata));
            }
            
            if (fields.length === 0) {
                if (callback) callback(true, null);
                return;
            }
            
            values.push(taskId);
            var statement = 'UPDATE tasks SET ' + fields.join(', ') + ' WHERE id = ?';
            
            self.sqlite.run({
                database: self.dbName,
                statement: statement,
                values: values
            }).then(function(result) {
                var success = result.changes.changes > 0;
                if (callback) callback(success, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to update task', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Delete a task
         */
        deleteTask: function(taskId, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            self.sqlite.run({
                database: self.dbName,
                statement: 'DELETE FROM tasks WHERE id = ?',
                values: [taskId]
            }).then(function(result) {
                var success = result.changes.changes > 0;
                if (callback) callback(success, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to delete task', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Search tasks by text
         */
        searchTasks: function(query, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback([], null);
                return;
            }
            
            var searchPattern = '%' + query + '%';
            
            self.sqlite.query({
                database: self.dbName,
                statement: 'SELECT * FROM tasks WHERE title LIKE ? OR description LIKE ? ' +
                          'ORDER BY completed ASC, created_at DESC LIMIT 50',
                values: [searchPattern, searchPattern]
            }).then(function(result) {
                var tasks = (result.values || []).map(function(row) {
                    return self.parseTaskRow(row);
                });
                if (callback) callback(tasks, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to search tasks', error);
                if (callback) callback([], error);
            });
        },
        
        /**
         * Add image attachment to a task
         */
        addImageAttachment: function(taskId, imageData, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            // Import Filesystem plugin
            Capacitor.Plugins.Filesystem.then(function(filesystemPlugin) {
                var Filesystem = filesystemPlugin.Filesystem;
                var Directory = filesystemPlugin.Directory;
                
                var filename = 'task_' + taskId + '_' + Date.now() + '.jpg';
                var filePath = 'attachments/' + filename;
                
                // Save image to filesystem
                Filesystem.writeFile({
                    path: filePath,
                    data: imageData,
                    directory: Directory.Data
                }).then(function(writeResult) {
                    // Get file info
                    return Filesystem.stat({
                        path: filePath,
                        directory: Directory.Data
                    });
                }).then(function(statResult) {
                    // Save reference in database
                    return self.sqlite.run({
                        database: self.dbName,
                        statement: 'INSERT INTO attachments (task_id, filename, file_path, file_size) VALUES (?, ?, ?, ?)',
                        values: [taskId, filename, filePath, statResult.size || 0]
                    });
                }).then(function(dbResult) {
                    console.log('Image attachment saved:', filePath);
                    if (callback) callback({ id: dbResult.changes.lastId, path: filePath }, null);
                }).catch(function(error) {
                    console.error('Failed to add image attachment:', error);
                    if (callback) callback(null, error);
                });
            }).catch(function(error) {
                console.error('Filesystem plugin not available:', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Get image attachment data URL (for display)
         * Returns a URL that can be used in img src, not the raw data
         */
        getImageAttachmentUrl: function(attachmentId, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            // Get attachment info from database
            self.sqlite.query({
                database: self.dbName,
                statement: 'SELECT * FROM attachments WHERE id = ?',
                values: [attachmentId]
            }).then(function(result) {
                if (!result.values || result.values.length === 0) {
                    if (callback) callback(null, new Error('Attachment not found'));
                    return;
                }
                
                var attachment = result.values[0];
                
                // Get filesystem URL instead of loading data
                Capacitor.Plugins.Filesystem.then(function(filesystemPlugin) {
                    var Filesystem = filesystemPlugin.Filesystem;
                    var Directory = filesystemPlugin.Directory;
                    
                    // Get URI for the file
                    Filesystem.getUri({
                        path: attachment.file_path,
                        directory: Directory.Data
                    }).then(function(result) {
                        // Convert to displayable URL
                        var displayUrl = Capacitor.convertFileSrc(result.uri);
                        
                        attachment.url = displayUrl;
                        attachment.data = null; // Don't include raw data
                        
                        if (callback) callback(attachment, null);
                    }).catch(function(error) {
                        console.error('Failed to get image URL:', error);
                        if (callback) callback(null, error);
                    });
                });
            }).catch(function(error) {
                console.error('Failed to get attachment info:', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Get image attachment data (only when absolutely needed)
         * WARNING: This loads full image data into memory
         */
        getImageAttachmentData: function(attachmentId, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            console.warn('Loading full image data into memory for attachment:', attachmentId);
            
            // Get attachment info from database
            self.sqlite.query({
                database: self.dbName,
                statement: 'SELECT * FROM attachments WHERE id = ?',
                values: [attachmentId]
            }).then(function(result) {
                if (!result.values || result.values.length === 0) {
                    if (callback) callback(null, new Error('Attachment not found'));
                    return;
                }
                
                var attachment = result.values[0];
                
                // Read image from filesystem
                Capacitor.Plugins.Filesystem.then(function(filesystemPlugin) {
                    var Filesystem = filesystemPlugin.Filesystem;
                    var Directory = filesystemPlugin.Directory;
                    
                    Filesystem.readFile({
                        path: attachment.file_path,
                        directory: Directory.Data
                    }).then(function(readResult) {
                        attachment.data = readResult.data;
                        
                        // Important: Caller should clear this data after use
                        if (callback) {
                            callback(attachment, null);
                            
                            // Suggest cleanup after callback
                            console.warn('Remember to clear attachment data after use to free memory');
                        }
                    }).catch(function(error) {
                        console.error('Failed to read image file:', error);
                        if (callback) callback(null, error);
                    });
                });
            }).catch(function(error) {
                console.error('Failed to get attachment info:', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Get thumbnail for image (memory-efficient)
         */
        getImageThumbnail: function(attachmentId, maxSize, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            maxSize = maxSize || 150; // Default thumbnail size
            
            // For now, return the URL - in future, implement actual thumbnail generation
            self.getImageAttachmentUrl(attachmentId, function(attachment, error) {
                if (error) {
                    if (callback) callback(null, error);
                    return;
                }
                
                // Add thumbnail flag
                attachment.isThumbnail = true;
                attachment.requestedSize = maxSize;
                
                if (callback) callback(attachment, null);
            });
        },
        
        /**
         * Delete image attachment
         */
        deleteImageAttachment: function(attachmentId, callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            // Get attachment info first
            self.sqlite.query({
                database: self.dbName,
                statement: 'SELECT * FROM attachments WHERE id = ?',
                values: [attachmentId]
            }).then(function(result) {
                if (!result.values || result.values.length === 0) {
                    if (callback) callback(false, new Error('Attachment not found'));
                    return;
                }
                
                var attachment = result.values[0];
                
                // Delete from filesystem
                Capacitor.Plugins.Filesystem.then(function(filesystemPlugin) {
                    var Filesystem = filesystemPlugin.Filesystem;
                    var Directory = filesystemPlugin.Directory;
                    
                    Filesystem.deleteFile({
                        path: attachment.file_path,
                        directory: Directory.Data
                    }).then(function() {
                        // Delete from database
                        return self.sqlite.run({
                            database: self.dbName,
                            statement: 'DELETE FROM attachments WHERE id = ?',
                            values: [attachmentId]
                        });
                    }).then(function() {
                        console.log('Attachment deleted:', attachment.file_path);
                        if (callback) callback(true, null);
                    }).catch(function(error) {
                        console.error('Failed to delete attachment:', error);
                        if (callback) callback(false, error);
                    });
                });
            }).catch(function(error) {
                console.error('Failed to get attachment for deletion:', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Get database statistics
         */
        getStats: function(callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            Promise.all([
                self.sqlite.query({
                    database: self.dbName,
                    statement: 'SELECT COUNT(*) as total FROM tasks',
                    values: []
                }),
                self.sqlite.query({
                    database: self.dbName,
                    statement: 'SELECT COUNT(*) as completed FROM tasks WHERE completed = 1',
                    values: []
                }),
                self.sqlite.query({
                    database: self.dbName,
                    statement: 'SELECT COUNT(*) as attachments FROM attachments',
                    values: []
                })
            ]).then(function(results) {
                var stats = {
                    totalTasks: results[0].values[0].total,
                    completedTasks: results[1].values[0].completed,
                    pendingTasks: results[0].values[0].total - results[1].values[0].completed,
                    totalAttachments: results[2].values[0].attachments
                };
                if (callback) callback(stats, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to get stats', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Verify database integrity
         */
        verifyIntegrity: function(callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            self.sqlite.query({
                database: self.dbName,
                statement: 'PRAGMA integrity_check',
                values: []
            }).then(function(result) {
                var isValid = result.values && result.values.length > 0 && 
                             result.values[0].integrity_check === 'ok';
                
                if (callback) callback(isValid, null);
            }).catch(function(error) {
                console.error('SQLite: Integrity check failed', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Begin migration transaction
         */
        beginMigration: function(callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            self.sqlite.execute({
                database: self.dbName,
                statements: 'BEGIN TRANSACTION'
            }).then(function() {
                console.log('SQLite: Migration transaction started');
                if (callback) callback(true, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to begin transaction', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Commit migration transaction
         */
        commitMigration: function(callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            self.sqlite.execute({
                database: self.dbName,
                statements: 'COMMIT'
            }).then(function() {
                console.log('SQLite: Migration transaction committed');
                if (callback) callback(true, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to commit transaction', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Rollback migration transaction
         */
        rollbackMigration: function(callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            self.sqlite.execute({
                database: self.dbName,
                statements: 'ROLLBACK'
            }).then(function() {
                console.log('SQLite: Migration transaction rolled back');
                if (callback) callback(true, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to rollback transaction', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Get migration status
         */
        getMigrationStatus: function(callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            // Check for migration metadata
            self.sqlite.query({
                database: self.dbName,
                statement: 'SELECT COUNT(*) as migrated FROM tasks WHERE metadata LIKE ?',
                values: ['%migrationTimestamp%']
            }).then(function(result) {
                var migratedCount = result.values[0].migrated;
                
                self.getStats(function(stats, error) {
                    if (error) {
                        if (callback) callback(null, error);
                        return;
                    }
                    
                    var status = {
                        hasMigratedData: migratedCount > 0,
                        migratedTaskCount: migratedCount,
                        totalTaskCount: stats.totalTasks,
                        isComplete: migratedCount === stats.totalTasks && stats.totalTasks > 0
                    };
                    
                    if (callback) callback(status, null);
                });
            }).catch(function(error) {
                console.error('SQLite: Failed to get migration status', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Parse task row from database
         */
        parseTaskRow: function(row) {
            return {
                id: row.id,
                title: row.title,
                description: row.description,
                completed: row.completed === 1,
                priority: row.priority,
                parentId: row.parent_id,
                created: row.created_at,
                modified: row.updated_at,
                completedAt: row.completed_at,
                tags: row.tags ? JSON.parse(row.tags) : [],
                metadata: row.metadata ? JSON.parse(row.metadata) : {}
            };
        },
        
        /**
         * Export database to JSON (for backup)
         */
        exportToJSON: function(callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            self.sqlite.exportToJson({
                database: self.dbName,
                exportMode: 'full'
            }).then(function(result) {
                var backup = {
                    database: result.export,
                    version: self.dbVersion,
                    timestamp: new Date().toISOString()
                };
                if (callback) callback(JSON.stringify(backup), null);
            }).catch(function(error) {
                console.error('SQLite: Failed to export database', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Close database connection
         */
        close: function(callback) {
            var self = this;
            
            if (!self.isReady) {
                if (callback) callback(true);
                return;
            }
            
            self.sqlite.close({
                database: self.dbName
            }).then(function() {
                self.isReady = false;
                self.db = null;
                if (callback) callback(true);
            }).catch(function(error) {
                console.error('SQLite: Failed to close database', error);
                if (callback) callback(false);
            });
        }
    };
    
    // Expose to global scope
    window.TaskSQLite = TaskSQLite;
})();