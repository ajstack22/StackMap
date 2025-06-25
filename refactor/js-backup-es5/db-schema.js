/**
 * Database Schema and Data Structures
 * With corruption protection and versioning
 */

(function() {
    'use strict';
    
    // Schema version for migrations
    var SCHEMA_VERSION = 1;
    
    // Data structure definitions with validation
    var DataSchema = {
        /**
         * Task structure with validation rules
         */
        task: {
            fields: {
                id: { type: 'number', required: false }, // Auto-generated
                title: { type: 'string', required: true, maxLength: 500 },
                description: { type: 'string', required: false, maxLength: 5000 },
                status: { type: 'enum', values: ['pending', 'completed', 'archived'], default: 'pending' },
                parentId: { type: 'number', required: false, nullable: true },
                created: { type: 'timestamp', required: true, autoSet: true },
                modified: { type: 'timestamp', required: true, autoUpdate: true },
                order: { type: 'number', required: false, default: 0 },
                tags: { type: 'array', itemType: 'string', maxItems: 20 },
                attachmentIds: { type: 'array', itemType: 'number', maxItems: 10 },
                metadata: {
                    type: 'object',
                    fields: {
                        completedAt: { type: 'timestamp', nullable: true },
                        reminderAt: { type: 'timestamp', nullable: true },
                        priority: { type: 'enum', values: ['low', 'medium', 'high'], default: 'medium' },
                        estimatedMinutes: { type: 'number', min: 0, max: 1440, nullable: true }
                    }
                },
                // Sync and conflict resolution fields
                syncId: { type: 'string', required: false }, // UUID for cross-device sync
                version: { type: 'number', required: true, default: 1 },
                lastModifiedBy: { type: 'string', required: false } // Device ID
            },
            
            validate: function(data) {
                return this.validateFields(data, this.fields);
            },
            
            validateFields: function(data, schema) {
                var errors = [];
                
                for (var field in schema) {
                    var rule = schema[field];
                    var value = data[field];
                    
                    // Required field check
                    if (rule.required && value === undefined) {
                        errors.push(field + ' is required');
                        continue;
                    }
                    
                    // Skip optional undefined fields
                    if (value === undefined && !rule.required) {
                        continue;
                    }
                    
                    // Null check
                    if (value === null && !rule.nullable) {
                        errors.push(field + ' cannot be null');
                        continue;
                    }
                    
                    // Type validation
                    if (value !== null && value !== undefined) {
                        if (rule.type === 'string' && typeof value !== 'string') {
                            errors.push(field + ' must be a string');
                        } else if (rule.type === 'number' && typeof value !== 'number') {
                            errors.push(field + ' must be a number');
                        } else if (rule.type === 'timestamp' && typeof value !== 'number') {
                            errors.push(field + ' must be a timestamp');
                        } else if (rule.type === 'array' && !Array.isArray(value)) {
                            errors.push(field + ' must be an array');
                        } else if (rule.type === 'object' && typeof value !== 'object') {
                            errors.push(field + ' must be an object');
                        } else if (rule.type === 'enum' && rule.values.indexOf(value) === -1) {
                            errors.push(field + ' must be one of: ' + rule.values.join(', '));
                        }
                        
                        // Additional validations
                        if (rule.maxLength && value.length > rule.maxLength) {
                            errors.push(field + ' exceeds max length of ' + rule.maxLength);
                        }
                        if (rule.maxItems && value.length > rule.maxItems) {
                            errors.push(field + ' exceeds max items of ' + rule.maxItems);
                        }
                        if (rule.min !== undefined && value < rule.min) {
                            errors.push(field + ' must be at least ' + rule.min);
                        }
                        if (rule.max !== undefined && value > rule.max) {
                            errors.push(field + ' must be at most ' + rule.max);
                        }
                        
                        // Nested object validation
                        if (rule.type === 'object' && rule.fields) {
                            var nestedErrors = this.validateFields(value, rule.fields);
                            errors = errors.concat(nestedErrors.map(function(e) {
                                return field + '.' + e;
                            }));
                        }
                    }
                }
                
                return errors;
            },
            
            // Create new task with defaults
            create: function(data) {
                var now = Date.now();
                var task = {
                    title: data.title || '',
                    description: data.description || '',
                    status: data.status || 'pending',
                    parentId: data.parentId || null,
                    created: now,
                    modified: now,
                    order: data.order || 0,
                    tags: data.tags || [],
                    attachmentIds: data.attachmentIds || [],
                    metadata: {
                        completedAt: null,
                        reminderAt: data.reminderAt || null,
                        priority: data.priority || 'medium',
                        estimatedMinutes: data.estimatedMinutes || null
                    },
                    syncId: this.generateSyncId(),
                    version: 1,
                    lastModifiedBy: this.getDeviceId()
                };
                
                var errors = this.validate(task);
                if (errors.length > 0) {
                    throw new Error('Validation failed: ' + errors.join(', '));
                }
                
                return task;
            },
            
            // Generate unique sync ID
            generateSyncId: function() {
                return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            },
            
            // Get device ID for conflict resolution
            getDeviceId: function() {
                var deviceId = localStorage.getItem('stackmap_device_id');
                if (!deviceId) {
                    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                    localStorage.setItem('stackmap_device_id', deviceId);
                }
                return deviceId;
            }
        },
        
        /**
         * Attachment structure (with lifecycle management)
         */
        attachment: {
            fields: {
                id: { type: 'number', required: false }, // Auto-generated
                taskId: { type: 'number', required: true },
                name: { type: 'string', required: true, maxLength: 255 },
                type: { type: 'string', required: true }, // MIME type
                size: { type: 'number', required: true, max: 10485760 }, // 10MB limit
                created: { type: 'timestamp', required: true, autoSet: true },
                lastAccessed: { type: 'timestamp', required: false },
                objectUrl: { type: 'string', required: false }, // Cached object URL
                data: { type: 'blob', required: false } // Actual data (loaded on demand)
            },
            
            validate: function(data) {
                return DataSchema.task.validateFields(data, this.fields);
            }
        },
        
        /**
         * Settings structure
         */
        settings: {
            fields: {
                key: { type: 'string', required: true },
                value: { type: 'any', required: true },
                modified: { type: 'timestamp', required: true, autoUpdate: true }
            }
        },
        
        /**
         * Migration checkpoint structure
         */
        migrationCheckpoint: {
            fields: {
                id: { type: 'string', required: true }, // Checkpoint ID
                stage: { type: 'string', required: true }, // Migration stage
                progress: { type: 'number', required: true, min: 0, max: 100 },
                data: { type: 'object', required: false }, // Stage-specific data
                timestamp: { type: 'timestamp', required: true },
                status: { type: 'enum', values: ['pending', 'in_progress', 'completed', 'failed'] }
            }
        }
    };
    
    /**
     * IndexedDB Schema Definition
     */
    var IndexedDBSchema = {
        version: SCHEMA_VERSION,
        stores: {
            tasks: {
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'parentId', keyPath: 'parentId', unique: false },
                    { name: 'status', keyPath: 'status', unique: false },
                    { name: 'created', keyPath: 'created', unique: false },
                    { name: 'modified', keyPath: 'modified', unique: false },
                    { name: 'status_modified', keyPath: ['status', 'modified'], unique: false },
                    { name: 'syncId', keyPath: 'syncId', unique: true }
                ]
            },
            attachments: {
                keyPath: 'id',
                autoIncrement: true,
                indexes: [
                    { name: 'taskId', keyPath: 'taskId', unique: false },
                    { name: 'created', keyPath: 'created', unique: false },
                    { name: 'lastAccessed', keyPath: 'lastAccessed', unique: false }
                ]
            },
            settings: {
                keyPath: 'key',
                autoIncrement: false
            },
            migrationCheckpoints: {
                keyPath: 'id',
                autoIncrement: false,
                indexes: [
                    { name: 'timestamp', keyPath: 'timestamp', unique: false },
                    { name: 'status', keyPath: 'status', unique: false }
                ]
            }
        }
    };
    
    /**
     * Dexie Schema Definition (when we add Dexie)
     */
    var DexieSchema = {
        version: SCHEMA_VERSION,
        stores: {
            tasks: '++id, parentId, status, created, modified, [status+modified], syncId',
            attachments: '++id, taskId, created, lastAccessed',
            settings: 'key',
            migrationCheckpoints: 'id, timestamp, status'
        }
    };
    
    // Expose schemas
    window.StackMapDataSchema = DataSchema;
    window.StackMapIndexedDBSchema = IndexedDBSchema;
    window.StackMapDexieSchema = DexieSchema;
})();