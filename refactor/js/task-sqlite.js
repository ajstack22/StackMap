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
        isBusy: false,
        operationQueue: [],
        
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
            
            // Get SQLite plugin with correct access pattern
            try {
                // Try different access patterns for the plugin
                if (window.CapacitorSQLite) {
                    self.sqlite = window.CapacitorSQLite;
                } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorSQLite) {
                    self.sqlite = window.Capacitor.Plugins.CapacitorSQLite;
                } else {
                    throw new Error('SQLite plugin not available');
                }
                
                console.log('SQLite: Plugin found, creating connection...');
                
                // Create connection with proper API
                self.createConnection(function(success, error) {
                    if (success) {
                        console.log('SQLite: Connection created, creating tables...');
                        self.createTables(function(tablesCreated) {
                            if (tablesCreated) {
                                // Set performance pragmas
                                self.setPragmas(function(pragmasSet) {
                                    if (!pragmasSet) {
                                        console.warn('SQLite: Some pragmas failed, continuing anyway');
                                    }
                                    // Create indexes
                                    self.createIndexes(function(indexesCreated) {
                                        if (!indexesCreated) {
                                            console.warn('SQLite: Some indexes failed, continuing anyway');
                                        }
                                        self.isReady = true;
                                        console.log('SQLite: Database initialized successfully');
                                        if (callback) callback(true);
                                    });
                                });
                            } else {
                                console.error('SQLite: Failed to create tables');
                                if (callback) callback(false, 'Failed to create tables');
                            }
                        });
                    } else {
                        console.error('SQLite: Connection failed', error);
                        if (callback) callback(false, error);
                    }
                });
            } catch(error) {
                console.error('SQLite: Plugin not available', error);
                if (callback) callback(false, error);
            }
        },
        
        /**
         * Create database connection
         */
        createConnection: function(callback) {
            var self = this;
            
            try {
                // Create connection with correct parameters
                self.sqlite.createConnection(
                    self.dbName,        // database name
                    false,              // encrypted
                    'no-encryption',    // mode
                    1,                  // version
                    false              // readonly
                ).then(function(connection) {
                    // Store the connection object
                    self.db = connection;
                    
                    // Now open the connection - call open ON THE CONNECTION
                    return self.db.open();
                }).then(function() {
                    console.log('SQLite: Database connection opened');
                    if (callback) callback(true);
                }).catch(function(error) {
                    console.error('SQLite: Connection error', error);
                    if (callback) callback(false, error);
                });
            } catch(error) {
                console.error('SQLite: createConnection failed', error);
                if (callback) callback(false, error);
            }
        },
        
        /**
         * Create database tables
         */
        createTables: function(callback) {
            var self = this;
            
            if (!self.db) {
                if (callback) callback(false, 'No database connection');
                return;
            }
            
            // For Phase 1, we only need the storage table for key-value pairs
            var createStorageTable = 
                'CREATE TABLE IF NOT EXISTS storage (' +
                '  key TEXT PRIMARY KEY,' +
                '  value TEXT NOT NULL,' +
                '  created_at TEXT DEFAULT (datetime("now")),' +
                '  updated_at TEXT DEFAULT (datetime("now"))' +
                ')';
            
            try {
                // Use execute method on the connection object
                self.db.execute(createStorageTable, [], false).then(function() {
                    console.log('SQLite: Storage table created');
                    
                    // Initialize attachment schema if available
                    if (window.SQLiteAttachmentSchema) {
                        window.SQLiteAttachmentSchema.init(self.db, function(success, error) {
                            if (!success) {
                                console.warn('SQLite: Attachment schema init failed, continuing', error);
                            }
                            if (callback) callback(true);
                        });
                    } else {
                        if (callback) callback(true);
                    }
                }).catch(function(error) {
                    console.error('SQLite: Failed to create tables', error);
                    if (callback) callback(false, error);
                });
            } catch(error) {
                console.error('SQLite: Execute failed', error);
                if (callback) callback(false, error);
            }
        },
        
        /**
         * Execute operation with queue management
         */
        _executeOperation: function(operation) {
            var self = this;
            
            if (self.isBusy) {
                // Queue the operation
                self.operationQueue.push(operation);
                return;
            }
            
            self.isBusy = true;
            operation(function() {
                self.isBusy = false;
                // Process next queued operation
                if (self.operationQueue.length > 0) {
                    var next = self.operationQueue.shift();
                    self._executeOperation(next);
                }
            });
        },
        
        /**
         * Create indexes for performance
         */
        createIndexes: function(callback) {
            var self = this;
            
            if (!self.db) {
                if (callback) callback(false, 'No database connection');
                return;
            }
            
            var indexes = [
                'CREATE INDEX IF NOT EXISTS idx_storage_updated ON storage(updated_at)',
                'CREATE INDEX IF NOT EXISTS idx_storage_key ON storage(key)'
            ];
            
            var completed = 0;
            var errors = [];
            
            indexes.forEach(function(indexSql) {
                self.db.execute(indexSql, [], false).then(function() {
                    completed++;
                    if (completed === indexes.length) {
                        console.log('SQLite: Indexes created successfully');
                        if (callback) callback(true);
                    }
                }).catch(function(error) {
                    completed++;
                    errors.push(error);
                    if (completed === indexes.length) {
                        console.error('SQLite: Some indexes failed', errors);
                        if (callback) callback(false, errors);
                    }
                });
            });
        },
        
        /**
         * Optimize database (VACUUM, ANALYZE)
         */
        optimizeDatabase: function(callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(false, 'Database not ready');
                return;
            }
            
            self._executeOperation(function(done) {
                // Run VACUUM to reclaim space
                self.db.execute('VACUUM', [], false).then(function() {
                    console.log('SQLite: VACUUM completed');
                    // Run ANALYZE to update statistics
                    return self.db.execute('ANALYZE', [], false);
                }).then(function() {
                    console.log('SQLite: ANALYZE completed');
                    done();
                    if (callback) callback(true);
                }).catch(function(error) {
                    console.error('SQLite: Optimization failed', error);
                    done();
                    if (callback) callback(false, error);
                });
            });
        },
        
        /**
         * Set pragma values for performance
         */
        setPragmas: function(callback) {
            var self = this;
            
            if (!self.db) {
                if (callback) callback(false, 'No database connection');
                return;
            }
            
            var pragmas = [
                'PRAGMA cache_size = -2048',      // 2MB cache
                'PRAGMA temp_store = MEMORY',     // Use memory for temp storage
                'PRAGMA journal_mode = WAL',      // Write-ahead logging
                'PRAGMA synchronous = NORMAL',    // Balance safety and speed
                'PRAGMA mmap_size = 30000000'     // 30MB memory map
            ];
            
            var completed = 0;
            pragmas.forEach(function(pragma) {
                self.db.execute(pragma, [], false).then(function() {
                    completed++;
                    if (completed === pragmas.length) {
                        console.log('SQLite: Performance pragmas set');
                        if (callback) callback(true);
                    }
                }).catch(function(error) {
                    completed++;
                    console.error('SQLite: Pragma failed', pragma, error);
                    if (completed === pragmas.length && callback) {
                        callback(false);
                    }
                });
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
         * Get item from key-value storage
         */
        getItem: function(key, callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(new Error('Database not ready'), null);
                return;
            }
            
            try {
                // Use query method on the connection object
                self.db.query('SELECT value FROM storage WHERE key = ?', [key]).then(function(result) {
                    if (result.values && result.values.length > 0) {
                        try {
                            var parsed = JSON.parse(result.values[0].value);
                            if (callback) callback(null, parsed);
                        } catch (e) {
                            if (callback) callback(e, null);
                        }
                    } else {
                        if (callback) callback(null, null);
                    }
                }).catch(function(error) {
                    console.error('SQLite: Failed to get item', error);
                    if (callback) callback(error, null);
                });
            } catch(error) {
                console.error('SQLite: getItem failed', error);
                if (callback) callback(error, null);
            }
        },
        
        /**
         * Set item in key-value storage
         */
        setItem: function(key, value, callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(new Error('Database not ready'));
                return;
            }
            
            var jsonValue = JSON.stringify(value);
            
            try {
                // Use run method on the connection object with transaction
                self.db.run(
                    'INSERT OR REPLACE INTO storage (key, value, updated_at) VALUES (?, ?, datetime("now"))',
                    [key, jsonValue],
                    true  // use transaction
                ).then(function(result) {
                    console.log('SQLite: Item saved', key);
                    if (callback) callback(null);
                }).catch(function(error) {
                    console.error('SQLite: Failed to set item', error);
                    if (callback) callback(error);
                });
            } catch(error) {
                console.error('SQLite: setItem failed', error);
                if (callback) callback(error);
            }
        },
        
        /**
         * Remove item from key-value storage
         */
        removeItem: function(key, callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(new Error('Database not ready'));
                return;
            }
            
            try {
                // Use run method on the connection object
                self.db.run(
                    'DELETE FROM storage WHERE key = ?',
                    [key],
                    true  // use transaction
                ).then(function(result) {
                    console.log('SQLite: Item removed', key);
                    if (callback) callback(null);
                }).catch(function(error) {
                    console.error('SQLite: Failed to remove item', error);
                    if (callback) callback(error);
                });
            } catch(error) {
                console.error('SQLite: removeItem failed', error);
                if (callback) callback(error);
            }
        },
        
        /**
         * Clear all key-value storage
         */
        clearStorage: function(callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(new Error('Database not ready'));
                return;
            }
            
            try {
                // Use run method on the connection object
                self.db.run(
                    'DELETE FROM storage',
                    [],
                    true  // use transaction
                ).then(function(result) {
                    console.log('SQLite: Storage cleared');
                    if (callback) callback(null);
                }).catch(function(error) {
                    console.error('SQLite: Failed to clear storage', error);
                    if (callback) callback(error);
                });
            } catch(error) {
                console.error('SQLite: clearStorage failed', error);
                if (callback) callback(error);
            }
        },
        
        /**
         * Batch set multiple items in a single transaction
         */
        setItems: function(items, callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(new Error('Database not ready'));
                return;
            }
            
            if (!items || items.length === 0) {
                if (callback) callback(null);
                return;
            }
            
            try {
                // Start transaction
                self.db.execute('BEGIN TRANSACTION', [], false).then(function() {
                    console.log('SQLite: Batch operation started for ' + items.length + ' items');
                    
                    // Create promises for all inserts
                    var promises = [];
                    for (var i = 0; i < items.length; i++) {
                        var item = items[i];
                        var promise = self.db.run(
                            'INSERT OR REPLACE INTO storage (key, value, updated_at) VALUES (?, ?, datetime("now"))',
                            [item.key, JSON.stringify(item.value)],
                            false  // no individual transactions
                        );
                        promises.push(promise);
                    }
                    
                    // Wait for all inserts to complete
                    return Promise.all(promises);
                }).then(function() {
                    // Commit transaction
                    return self.db.execute('COMMIT', [], false);
                }).then(function() {
                    console.log('SQLite: Batch operation completed successfully');
                    if (callback) callback(null);
                }).catch(function(error) {
                    console.error('SQLite: Batch operation failed', error);
                    // Rollback on error
                    self.db.execute('ROLLBACK', [], false).then(function() {
                        console.log('SQLite: Transaction rolled back');
                    }).catch(function(rollbackError) {
                        console.error('SQLite: Rollback failed', rollbackError);
                    });
                    if (callback) callback(error);
                });
            } catch(error) {
                console.error('SQLite: setItems failed', error);
                if (callback) callback(error);
            }
        },
        
        /**
         * Batch get multiple items
         */
        getItems: function(keys, callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(new Error('Database not ready'), null);
                return;
            }
            
            if (!keys || keys.length === 0) {
                if (callback) callback(null, {});
                return;
            }
            
            try {
                // Build query with placeholders
                var placeholders = keys.map(function() { return '?'; }).join(',');
                var query = 'SELECT key, value FROM storage WHERE key IN (' + placeholders + ')';
                
                self.db.query(query, keys).then(function(result) {
                    var items = {};
                    if (result.values && result.values.length > 0) {
                        for (var i = 0; i < result.values.length; i++) {
                            var row = result.values[i];
                            try {
                                items[row.key] = JSON.parse(row.value);
                            } catch (e) {
                                console.error('SQLite: Failed to parse value for key', row.key);
                            }
                        }
                    }
                    if (callback) callback(null, items);
                }).catch(function(error) {
                    console.error('SQLite: Failed to get items', error);
                    if (callback) callback(error, null);
                });
            } catch(error) {
                console.error('SQLite: getItems failed', error);
                if (callback) callback(error, null);
            }
        },
        
        /**
         * Get migration progress - count of items in storage
         */
        getMigrationProgress: function(callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(0, new Error('Database not ready'));
                return;
            }
            
            try {
                self.db.query('SELECT COUNT(*) as count FROM storage', []).then(function(result) {
                    var count = 0;
                    if (result.values && result.values.length > 0) {
                        count = result.values[0].count || 0;
                    }
                    console.log('SQLite: Migration progress - ' + count + ' items');
                    if (callback) callback(count, null);
                }).catch(function(error) {
                    console.error('SQLite: Failed to get migration progress', error);
                    if (callback) callback(0, error);
                });
            } catch(error) {
                console.error('SQLite: getMigrationProgress failed', error);
                if (callback) callback(0, error);
            }
        },
        
        /**
         * Get all keys from storage (for migration verification)
         */
        getAllKeys: function(callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback([], new Error('Database not ready'));
                return;
            }
            
            try {
                self.db.query('SELECT key FROM storage ORDER BY key', []).then(function(result) {
                    var keys = [];
                    if (result.values && result.values.length > 0) {
                        keys = result.values.map(function(row) {
                            return row.key;
                        });
                    }
                    if (callback) callback(keys, null);
                }).catch(function(error) {
                    console.error('SQLite: Failed to get all keys', error);
                    if (callback) callback([], error);
                });
            } catch(error) {
                console.error('SQLite: getAllKeys failed', error);
                if (callback) callback([], error);
            }
        },
        
        /**
         * Close database connection
         */
        closeConnection: function(callback) {
            var self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(true);
                return;
            }
            
            try {
                // Close the connection object
                self.db.close().then(function() {
                    self.isReady = false;
                    self.db = null;
                    console.log('SQLite: Connection closed');
                    if (callback) callback(true);
                }).catch(function(error) {
                    console.error('SQLite: Failed to close connection', error);
                    if (callback) callback(false);
                });
            } catch(error) {
                console.error('SQLite: closeConnection failed', error);
                if (callback) callback(false);
            }
        }
    };
    
    // Expose to global scope
    window.TaskSQLite = TaskSQLite;
})();