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
    const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform();
    
    const ActivitySQLite = {
        db: null,
        dbName: 'stackmap_activities.db',
        dbVersion: 1,
        isReady: false,
        sqlite: null,
        isBusy: false,
        operationQueue: [],
        
        /**
         * Initialize SQLite database
         */
        init: function(callback) {
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            
            if (!self.db) {
                if (callback) callback(false, 'No database connection');
                return;
            }
            
            // For Phase 1, we only need the storage table for key-value pairs
            const createStorageTable = 
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
            const self = this;
            
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
                    const next = self.operationQueue.shift();
                    self._executeOperation(next);
                }
            });
        },
        
        /**
         * Create indexes for performance
         */
        createIndexes: function(callback) {
            const self = this;
            
            if (!self.db) {
                if (callback) callback(false, 'No database connection');
                return;
            }
            
            const indexes = [
                'CREATE INDEX IF NOT EXISTS idx_storage_updated ON storage(updated_at)',
                'CREATE INDEX IF NOT EXISTS idx_storage_key ON storage(key)'
            ];
            
            let completed = 0;
            const errors = [];
            
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
            const self = this;
            
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
            const self = this;
            
            if (!self.db) {
                if (callback) callback(false, 'No database connection');
                return;
            }
            
            const pragmas = [
                'PRAGMA cache_size = -2048',      // 2MB cache
                'PRAGMA temp_store = MEMORY',     // Use memory for temp storage
                'PRAGMA journal_mode = WAL',      // Write-ahead logging
                'PRAGMA synchronous = NORMAL',    // Balance safety and speed
                'PRAGMA mmap_size = 30000000'     // 30MB memory map
            ];
            
            let completed = 0;
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
         * Create a new activity
         */
        createActivity: function(activity, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            // Prepare activity data
            const title = activity.title || 'Untitled';
            const description = activity.description || '';
            const priority = activity.priority || 1;
            const parentId = activity.parentId || null;
            const tags = activity.tags ? JSON.stringify(activity.tags) : '[]';
            const metadata = activity.metadata ? JSON.stringify(activity.metadata) : '{}';
            
            const statement = 'INSERT INTO activities (title, description, priority, parent_id, tags, metadata) ' +
                           'VALUES (?, ?, ?, ?, ?, ?)';
            const values = [title, description, priority, parentId, tags, metadata];
            
            self.sqlite.run({
                database: self.dbName,
                statement: statement,
                values: values
            }).then(function(result) {
                const activityId = result.changes.lastId;
                if (callback) callback({ id: activityId }, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to create activity', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Get activities with pagination
         */
        getActivities: function(options, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback([], null);
                return;
            }
            
            options = options || {};
            const limit = options.limit || 50;
            const offset = options.offset || 0;
            const status = options.status; // 'pending', 'completed', or null for all
            
            let statement = 'SELECT * FROM activities';
            const values = [];
            
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
                const activities = (result.values || []).map(function(row) {
                    return self.parseActivityRow(row);
                });
                if (callback) callback(activities, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to get activities', error);
                if (callback) callback([], error);
            });
        },
        
        /**
         * Get a single activity with attachments
         */
        getActivity: function(activityId, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            // Get activity
            self.sqlite.query({
                database: self.dbName,
                statement: 'SELECT * FROM activities WHERE id = ?',
                values: [activityId]
            }).then(function(result) {
                if (!result.values || result.values.length === 0) {
                    if (callback) callback(null, new Error('Activity not found'));
                    return;
                }
                
                const activity = self.parseActivityRow(result.values[0]);
                
                // Get attachments
                return self.sqlite.query({
                    database: self.dbName,
                    statement: 'SELECT * FROM attachments WHERE activity_id = ?',
                    values: [activityId]
                }).then(function(attachmentResult) {
                    activity.attachments = attachmentResult.values || [];
                    if (callback) callback(activity, null);
                });
            }).catch(function(error) {
                console.error('SQLite: Failed to get activity', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Update an activity
         */
        updateActivity: function(activityId, updates, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            const fields = [];
            const values = [];
            
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
            
            values.push(activityId);
            const statement = `UPDATE activities SET ${fields.join(', ')} WHERE id = ?`;
            
            self.sqlite.run({
                database: self.dbName,
                statement: statement,
                values: values
            }).then(function(result) {
                const success = result.changes.changes > 0;
                if (callback) callback(success, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to update activity', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Delete an activity
         */
        deleteActivity: function(activityId, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            self.sqlite.run({
                database: self.dbName,
                statement: 'DELETE FROM activities WHERE id = ?',
                values: [activityId]
            }).then(function(result) {
                const success = result.changes.changes > 0;
                if (callback) callback(success, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to delete activity', error);
                if (callback) callback(false, error);
            });
        },
        
        /**
         * Search activities by text
         */
        searchActivities: function(query, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback([], null);
                return;
            }
            
            const searchPattern = `%${query}%`;
            
            self.sqlite.query({
                database: self.dbName,
                statement: 'SELECT * FROM activities WHERE title LIKE ? OR description LIKE ? ' +
                          'ORDER BY completed ASC, created_at DESC LIMIT 50',
                values: [searchPattern, searchPattern]
            }).then(function(result) {
                const activities = (result.values || []).map(function(row) {
                    return self.parseActivityRow(row);
                });
                if (callback) callback(activities, null);
            }).catch(function(error) {
                console.error('SQLite: Failed to search activities', error);
                if (callback) callback([], error);
            });
        },
        
        /**
         * Add image attachment to an activity
         */
        addImageAttachment: function(activityId, imageData, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            // Import Filesystem plugin
            Capacitor.Plugins.Filesystem.then(function(filesystemPlugin) {
                const Filesystem = filesystemPlugin.Filesystem;
                const Directory = filesystemPlugin.Directory;
                
                const filename = `activity_${activityId}_${Date.now()}.jpg`;
                const filePath = `attachments/${filename}`;
                
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
                        statement: 'INSERT INTO attachments (activity_id, filename, file_path, file_size) VALUES (?, ?, ?, ?)',
                        values: [activityId, filename, filePath, statResult.size || 0]
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
            const self = this;
            
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
                
                const attachment = result.values[0];
                
                // Get filesystem URL instead of loading data
                Capacitor.Plugins.Filesystem.then(function(filesystemPlugin) {
                    const Filesystem = filesystemPlugin.Filesystem;
                    const Directory = filesystemPlugin.Directory;
                    
                    // Get URI for the file
                    Filesystem.getUri({
                        path: attachment.file_path,
                        directory: Directory.Data
                    }).then(function(result) {
                        // Convert to displayable URL
                        const displayUrl = Capacitor.convertFileSrc(result.uri);
                        
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
            const self = this;
            
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
                
                const attachment = result.values[0];
                
                // Read image from filesystem
                Capacitor.Plugins.Filesystem.then(function(filesystemPlugin) {
                    const Filesystem = filesystemPlugin.Filesystem;
                    const Directory = filesystemPlugin.Directory;
                    
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
            const self = this;
            
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
            const self = this;
            
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
                
                const attachment = result.values[0];
                
                // Delete from filesystem
                Capacitor.Plugins.Filesystem.then(function(filesystemPlugin) {
                    const Filesystem = filesystemPlugin.Filesystem;
                    const Directory = filesystemPlugin.Directory;
                    
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
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            Promise.all([
                self.sqlite.query({
                    database: self.dbName,
                    statement: 'SELECT COUNT(*) as total FROM activities',
                    values: []
                }),
                self.sqlite.query({
                    database: self.dbName,
                    statement: 'SELECT COUNT(*) as completed FROM activities WHERE completed = 1',
                    values: []
                }),
                self.sqlite.query({
                    database: self.dbName,
                    statement: 'SELECT COUNT(*) as attachments FROM attachments',
                    values: []
                })
            ]).then(function(results) {
                const stats = {
                    totalActivities: results[0].values[0].total,
                    completedActivities: results[1].values[0].completed,
                    pendingActivities: results[0].values[0].total - results[1].values[0].completed,
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
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            self.sqlite.query({
                database: self.dbName,
                statement: 'PRAGMA integrity_check',
                values: []
            }).then(function(result) {
                const isValid = result.values && result.values.length > 0 && 
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
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            // Check for migration metadata
            self.sqlite.query({
                database: self.dbName,
                statement: 'SELECT COUNT(*) as migrated FROM activities WHERE metadata LIKE ?',
                values: ['%migrationTimestamp%']
            }).then(function(result) {
                const migratedCount = result.values[0].migrated;
                
                self.getStats(function(stats, error) {
                    if (error) {
                        if (callback) callback(null, error);
                        return;
                    }
                    
                    const status = {
                        hasMigratedData: migratedCount > 0,
                        migratedActivityCount: migratedCount,
                        totalActivityCount: stats.totalActivities,
                        isComplete: migratedCount === stats.totalActivities && stats.totalActivities > 0
                    };
                    
                    if (callback) callback(status, null);
                });
            }).catch(function(error) {
                console.error('SQLite: Failed to get migration status', error);
                if (callback) callback(null, error);
            });
        },
        
        /**
         * Parse activity row from database
         */
        parseActivityRow: function(row) {
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
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(null, new Error('Database not ready'));
                return;
            }
            
            self.sqlite.exportToJson({
                database: self.dbName,
                exportMode: 'full'
            }).then(function(result) {
                const backup = {
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
            const self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(new Error('Database not ready'), null);
                return;
            }
            
            try {
                // Use query method on the connection object
                self.db.query('SELECT value FROM storage WHERE key = ?', [key]).then(function(result) {
                    if (result.values && result.values.length > 0) {
                        try {
                            const parsed = JSON.parse(result.values[0].value);
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
            const self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(new Error('Database not ready'));
                return;
            }
            
            const jsonValue = JSON.stringify(value);
            
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
            const self = this;
            
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
            const self = this;
            
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
            const self = this;
            
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
                    console.log(`SQLite: Batch operation started for ${items.length} items`);
                    
                    // Create promises for all inserts
                    const promises = [];
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        const promise = self.db.run(
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
            const self = this;
            
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
                const placeholders = keys.map(function() { return '?'; }).join(',');
                const query = `SELECT key, value FROM storage WHERE key IN (${placeholders})`;
                
                self.db.query(query, keys).then(function(result) {
                    const items = {};
                    if (result.values && result.values.length > 0) {
                        for (let i = 0; i < result.values.length; i++) {
                            const row = result.values[i];
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
            const self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback(0, new Error('Database not ready'));
                return;
            }
            
            try {
                self.db.query('SELECT COUNT(*) as count FROM storage', []).then(function(result) {
                    let count = 0;
                    if (result.values && result.values.length > 0) {
                        count = result.values[0].count || 0;
                    }
                    console.log(`SQLite: Migration progress - ${count} items`);
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
            const self = this;
            
            if (!self.isReady || !self.db) {
                if (callback) callback([], new Error('Database not ready'));
                return;
            }
            
            try {
                self.db.query('SELECT key FROM storage ORDER BY key', []).then(function(result) {
                    let keys = [];
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
         * Save a visual card
         */
        saveCard: function(card, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            const sql = `
                INSERT OR REPLACE INTO cards (
                    id, activityId, emoji, title, color, type, position, 
                    state, completedAt, completedCount, created, modified, ariaLabel
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                card.id,
                card.activityId,
                card.emoji,
                card.title || '',
                card.color,
                card.type,
                card.position,
                card.state,
                card.completedAt,
                card.completedCount || 0,
                card.created,
                card.modified,
                card.ariaLabel || ''
            ];
            
            self._executeOperation(function(done) {
                self.db.run(sql, values).then(function(result) {
                    console.log('SQLite: Card saved', card.id);
                    done();
                    if (callback) callback(true, null);
                }).catch(function(error) {
                    console.error('SQLite: Failed to save card', error);
                    done();
                    if (callback) callback(false, error);
                });
            });
        },
        
        /**
         * Get all cards
         */
        getCards: function(callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback([], new Error('Database not ready'));
                return;
            }
            
            const sql = 'SELECT * FROM cards ORDER BY position ASC';
            
            self._executeOperation(function(done) {
                self.db.query(sql, []).then(function(result) {
                    const cards = result.values || [];
                    console.log('SQLite: Retrieved ' + cards.length + ' cards');
                    done();
                    if (callback) callback(cards, null);
                }).catch(function(error) {
                    console.error('SQLite: Failed to get cards', error);
                    done();
                    if (callback) callback([], error);
                });
            });
        },
        
        /**
         * Delete a card
         */
        deleteCard: function(cardId, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            const sql = 'DELETE FROM cards WHERE id = ?';
            
            self._executeOperation(function(done) {
                self.db.run(sql, [cardId]).then(function(result) {
                    console.log('SQLite: Card deleted', cardId);
                    done();
                    if (callback) callback(true, null);
                }).catch(function(error) {
                    console.error('SQLite: Failed to delete card', error);
                    done();
                    if (callback) callback(false, error);
                });
            });
        },
        
        /**
         * Update card positions (for reordering)
         */
        updateCardPositions: function(cards, callback) {
            const self = this;
            
            if (!self.isReady) {
                if (callback) callback(false, new Error('Database not ready'));
                return;
            }
            
            self._executeOperation(function(done) {
                // Start transaction
                self.db.execute('BEGIN TRANSACTION', [], false).then(function() {
                    // Update each card position
                    const promises = cards.map(function(card, index) {
                        const sql = 'UPDATE cards SET position = ? WHERE id = ?';
                        return self.db.run(sql, [index, card.id]);
                    });
                    
                    return Promise.all(promises);
                }).then(function() {
                    // Commit transaction
                    return self.db.execute('COMMIT', [], false);
                }).then(function() {
                    console.log('SQLite: Card positions updated');
                    done();
                    if (callback) callback(true, null);
                }).catch(function(error) {
                    // Rollback on error
                    self.db.execute('ROLLBACK', [], false).then(function() {
                        console.error('SQLite: Failed to update positions', error);
                        done();
                        if (callback) callback(false, error);
                    });
                });
            });
        },
        
        /**
         * Close database connection
         */
        closeConnection: function(callback) {
            const self = this;
            
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
    window.ActivitySQLite = ActivitySQLite;
    
    // BACKWARD COMPATIBILITY - Keep old name working
    window.TaskSQLite = ActivitySQLite;
})();