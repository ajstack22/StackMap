/**
 * Database Schema and Data Structures
 * With corruption protection and versioning
 */

(function() {
    'use strict';
    
    // Schema version for migrations
    const SCHEMA_VERSION = 3; // Updated for pin activities feature
    
    // Data structure definitions with validation
    const DataSchema = {
        /**
         * Activity structure with validation rules
         */
        activity: {
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
                day: { type: 'enum', values: ['today', 'tomorrow', 'someday'], default: 'today' },
                pinned: { type: 'boolean', default: false, required: false }, // Pin for daily routines
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
                let errors = [];
                
                for (const field in schema) {
                    const rule = schema[field];
                    const value = data[field];
                    
                    // Required field check
                    if (rule.required && value === undefined) {
                        errors.push(`${field} is required`);
                        continue;
                    }
                    
                    // Skip optional undefined fields
                    if (value === undefined && !rule.required) {
                        continue;
                    }
                    
                    // Null check
                    if (value === null && !rule.nullable) {
                        errors.push(`${field} cannot be null`);
                        continue;
                    }
                    
                    // Type validation
                    if (value !== null && value !== undefined) {
                        if (rule.type === 'string' && typeof value !== 'string') {
                            errors.push(`${field} must be a string`);
                        } else if (rule.type === 'number' && typeof value !== 'number') {
                            errors.push(`${field} must be a number`);
                        } else if (rule.type === 'timestamp' && typeof value !== 'number') {
                            errors.push(`${field} must be a timestamp`);
                        } else if (rule.type === 'array' && !Array.isArray(value)) {
                            errors.push(`${field} must be an array`);
                        } else if (rule.type === 'object' && typeof value !== 'object') {
                            errors.push(`${field} must be an object`);
                        } else if (rule.type === 'enum' && !rule.values.includes(value)) {
                            errors.push(`${field} must be one of: ${rule.values.join(', ')}`);
                        }
                        
                        // Additional validations
                        if (rule.maxLength && value.length > rule.maxLength) {
                            errors.push(`${field} exceeds max length of ${rule.maxLength}`);
                        }
                        if (rule.maxItems && value.length > rule.maxItems) {
                            errors.push(`${field} exceeds max items of ${rule.maxItems}`);
                        }
                        if (rule.min !== undefined && value < rule.min) {
                            errors.push(`${field} must be at least ${rule.min}`);
                        }
                        if (rule.max !== undefined && value > rule.max) {
                            errors.push(`${field} must be at most ${rule.max}`);
                        }
                        
                        // Nested object validation
                        if (rule.type === 'object' && rule.fields) {
                            const nestedErrors = this.validateFields(value, rule.fields);
                            errors = errors.concat(nestedErrors.map(function(e) {
                                return `${field}.${e}`;
                            }));
                        }
                    }
                }
                
                return errors;
            },
            
            // Create new activity with defaults
            create: function(data) {
                const now = Date.now();
                const activity = {
                    title: data.title || '',
                    description: data.description || '',
                    status: data.status || 'pending',
                    parentId: data.parentId || null,
                    created: now,
                    modified: now,
                    order: data.order || 0,
                    tags: data.tags || [],
                    attachmentIds: data.attachmentIds || [],
                    day: data.day || 'today',
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
                
                const errors = this.validate(activity);
                if (errors.length > 0) {
                    throw new Error(`Validation failed: ${errors.join(', ')}`);
                }
                
                return activity;
            },
            
            // Generate unique sync ID
            generateSyncId: function() {
                return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            },
            
            // Get device ID for conflict resolution
            getDeviceId: function() {
                let deviceId = localStorage.getItem('stackmap_device_id');
                if (!deviceId) {
                    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
                activityId: { type: 'number', required: true },
                name: { type: 'string', required: true, maxLength: 255 },
                type: { type: 'string', required: true }, // MIME type
                size: { type: 'number', required: true, max: 10485760 }, // 10MB limit
                created: { type: 'timestamp', required: true, autoSet: true },
                lastAccessed: { type: 'timestamp', required: false },
                objectUrl: { type: 'string', required: false }, // Cached object URL
                data: { type: 'blob', required: false } // Actual data (loaded on demand)
            },
            
            validate: function(data) {
                return DataSchema.activity.validateFields(data, this.fields);
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
        },
        
        /**
         * Visual card structure for activity cards
         */
        card: {
            fields: {
                id: { type: 'string', required: true }, // card_timestamp_random
                activityId: { type: 'string', required: false, nullable: true }, // Link to activity
                emoji: { type: 'string', required: true, maxLength: 10 }, // Primary identifier
                title: { type: 'string', required: false, maxLength: 13 }, // Short title
                color: { type: 'string', required: true, pattern: /^#[0-9A-F]{6}$/i }, // Hex color
                type: { type: 'enum', values: ['single', 'recurring', 'frequent'], default: 'single' },
                position: { type: 'number', required: true, min: 0 }, // Display order
                state: { type: 'enum', values: ['active', 'completed', 'disabled', 'in-progress'], default: 'active' },
                completedAt: { type: 'timestamp', required: false, nullable: true },
                completedCount: { type: 'number', required: false, default: 0 },
                created: { type: 'timestamp', required: true, autoSet: true },
                modified: { type: 'timestamp', required: true, autoUpdate: true },
                ariaLabel: { type: 'string', required: false, maxLength: 100 } // Accessibility
            },
            
            validate: function(data) {
                return DataSchema.activity.validateFields(data, this.fields);
            },
            
            create: function(data) {
                const now = Date.now();
                const card = {
                    id: data.id || `card_${now}_${Math.random().toString(36).substr(2, 9)}`,
                    activityId: data.activityId || null,
                    emoji: data.emoji,
                    title: data.title || '',
                    color: data.color || '#667eea',
                    type: data.type || 'single',
                    position: data.position || 0,
                    state: data.state || 'active',
                    completedAt: null,
                    completedCount: 0,
                    created: now,
                    modified: now,
                    ariaLabel: data.ariaLabel || `${data.emoji} ${data.title || ''}`
                };
                
                const errors = this.validate(card);
                if (errors.length > 0) {
                    throw new Error(`Card validation failed: ${errors.join(', ')}`);
                }
                
                return card;
            }
        }
    };
    
    /**
     * IndexedDB Schema Definition
     */
    const IndexedDBSchema = {
        version: SCHEMA_VERSION,
        stores: {
            activities: {
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
                    { name: 'activityId', keyPath: 'activityId', unique: false },
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
            },
            cards: {
                keyPath: 'id',
                autoIncrement: false,
                indexes: [
                    { name: 'activityId', keyPath: 'activityId', unique: false },
                    { name: 'type', keyPath: 'type', unique: false },
                    { name: 'state', keyPath: 'state', unique: false },
                    { name: 'position', keyPath: 'position', unique: false },
                    { name: 'created', keyPath: 'created', unique: false }
                ]
            }
        }
    };
    
    /**
     * Dexie Schema Definition (when we add Dexie)
     */
    const DexieSchema = {
        version: SCHEMA_VERSION,
        stores: {
            activities: '++id, parentId, status, created, modified, [status+modified], syncId',
            attachments: '++id, activityId, created, lastAccessed',
            settings: 'key',
            migrationCheckpoints: 'id, timestamp, status',
            cards: 'id, activityId, type, state, position, created'
        }
    };
    
    // Expose schemas
    window.StackMapDataSchema = DataSchema;
    window.StackMapIndexedDBSchema = IndexedDBSchema;
    window.StackMapDexieSchema = DexieSchema;
})();