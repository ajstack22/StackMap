/**
 * StackMap Data Import Module
 * Handles importing user data from JSON format
 * ES5 compatible for maximum device support
 */

(function(window) {
    'use strict';
    
    var DataImporter = {
        // Merge strategies
        MERGE_STRATEGY: {
            REPLACE: 'replace',
            MERGE: 'merge',
            SMART: 'smart'
        },
        
        // Current import data
        currentImportData: null,
        
        /**
         * Import tasks from JSON data
         * @param {string} jsonData - JSON string to import
         * @returns {Promise<Object>} Import preview data
         */
        importTasks: function(jsonData) {
            var self = this;
            
            return new Promise(function(resolve, reject) {
                try {
                    // Parse JSON
                    var data = JSON.parse(jsonData);
                    
                    // Validate data structure
                    var validation = self.validateImportData(data);
                    if (!validation.valid) {
                        throw new Error(validation.error || 'Invalid backup file format');
                    }
                    
                    // Store for later use
                    self.currentImportData = data;
                    
                    // Generate preview
                    var preview = self.generatePreview(data);
                    resolve(preview);
                    
                } catch (error) {
                    if (window.Messaging) {
                        window.Messaging.showMessage('Import failed: ' + error.message, 'error');
                    }
                    reject(error);
                }
            });
        },
        
        /**
         * Validate import data structure
         * @param {Object} data - Parsed JSON data
         * @returns {Object} Validation result
         */
        validateImportData: function(data) {
            // Check for required fields
            if (!data || typeof data !== 'object') {
                return { valid: false, error: 'Invalid data format' };
            }
            
            if (!data.version) {
                return { valid: false, error: 'Missing version field' };
            }
            
            if (!data.tasks || !Array.isArray(data.tasks)) {
                return { valid: false, error: 'Missing or invalid tasks array' };
            }
            
            // Check version compatibility with range support
            var version = parseFloat(data.version);
            if (isNaN(version) || version < 1.0 || version > 3.0) {
                return { valid: false, error: 'Unsupported version: ' + data.version + '. Supported: 1.0-3.0' };
            }
            
            // Validate and sanitize task structure
            for (var i = 0; i < data.tasks.length; i++) {
                var task = data.tasks[i];
                
                // Required fields
                if (!task.id || typeof task.id !== 'string') {
                    return { valid: false, error: 'Invalid task ID at index ' + i };
                }
                if (!task.title || typeof task.title !== 'string') {
                    return { valid: false, error: 'Invalid task title at index ' + i };
                }
                
                // Sanitize all string fields
                task.title = this.sanitizeString(task.title, 200);
                task.notes = this.sanitizeString(task.notes || '', 1000);
                task.category = this.sanitizeString(task.category || '', 50);
                
                // Validate and fix data types
                if (task.user_id && typeof task.user_id !== 'string') {
                    return { valid: false, error: 'Invalid user_id at task ' + i };
                }
                
                // Ensure boolean fields
                task.completed = Boolean(task.completed);
                
                // Validate numeric fields
                if (task.order_index !== undefined) {
                    task.order_index = parseInt(task.order_index);
                    if (isNaN(task.order_index)) {
                        task.order_index = i; // Default to current index
                    }
                }
                
                // Validate dates
                if (task.created_at && !this.isValidDate(task.created_at)) {
                    task.created_at = new Date().toISOString();
                }
                if (task.completed_at && !this.isValidDate(task.completed_at)) {
                    task.completed_at = null;
                }
            }
            
            // Validate users if present
            if (data.users && Array.isArray(data.users)) {
                for (var j = 0; j < data.users.length; j++) {
                    var user = data.users[j];
                    
                    // Required fields
                    if (!user.id || typeof user.id !== 'string') {
                        return { valid: false, error: 'Invalid user ID at index ' + j };
                    }
                    if (!user.name || typeof user.name !== 'string') {
                        return { valid: false, error: 'Invalid user name at index ' + j };
                    }
                    
                    // Sanitize user data
                    user.name = this.sanitizeString(user.name, 50);
                    user.emoji = this.validateEmoji(user.emoji) ? user.emoji : '🌟';
                    
                    // Validate preferences object
                    if (user.preferences && typeof user.preferences !== 'object') {
                        user.preferences = {};
                    }
                }
            }
            
            return { valid: true };
        },
        
        /**
         * Generate import preview
         * @param {Object} data - Import data
         * @returns {Object} Preview information
         */
        /**
         * Sanitize string to prevent XSS
         * @param {string} str - String to sanitize
         * @param {number} maxLength - Maximum allowed length
         * @returns {string} Sanitized string
         */
        sanitizeString: function(str, maxLength) {
            if (typeof str !== 'string') {
                return '';
            }
            
            // Remove dangerous characters and tags
            str = str.replace(/[<>"'&]/g, function(char) {
                var chars = {
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;',
                    '&': '&amp;'
                };
                return chars[char] || char;
            });
            
            // Remove any remaining HTML tags
            str = str.replace(/<[^>]*>/g, '');
            
            // Trim to max length
            if (str.length > maxLength) {
                str = str.substring(0, maxLength);
            }
            
            // Trim whitespace
            return str.trim();
        },
        
        /**
         * Validate emoji character
         * @param {string} emoji - Emoji to validate
         * @returns {boolean} True if valid emoji
         */
        validateEmoji: function(emoji) {
            if (!emoji || typeof emoji !== 'string') {
                return false;
            }
            
            // Basic emoji validation - check length and common emoji ranges
            return emoji.length <= 4 && emoji.length > 0;
        },
        
        /**
         * Check if date string is valid
         * @param {string} dateStr - Date string to validate
         * @returns {boolean} True if valid date
         */
        isValidDate: function(dateStr) {
            var date = new Date(dateStr);
            return date instanceof Date && !isNaN(date.getTime()) && 
                   date.getFullYear() > 2000 && date.getFullYear() < 2100;
        },
        
        generatePreview: function(data) {
            var self = this;
            var preview = {
                source: self.sanitizeString(data.app || 'Unknown', 100),
                exportDate: data.exportDate || 'Unknown',
                version: self.sanitizeString(String(data.version || ''), 10),
                counts: {
                    users: (data.users || []).length,
                    tasks: (data.tasks || []).length,
                    completedTasks: 0,
                    settings: Object.keys(data.settings || {}).length
                },
                samples: {
                    users: [],
                    tasks: []
                }
            };
            
            // Count completed tasks
            if (data.tasks) {
                preview.counts.completedTasks = data.tasks.filter(function(task) {
                    return task.completed;
                }).length;
            }
            
            // Get sample users (first 3) - sanitized
            if (data.users && data.users.length > 0) {
                preview.samples.users = data.users.slice(0, 3).map(function(user) {
                    return {
                        name: self.sanitizeString(user.name || '', 50),
                        emoji: self.validateEmoji(user.emoji) ? user.emoji : '🌟'
                    };
                });
            }
            
            // Get sample tasks (first 5) - sanitized
            if (data.tasks && data.tasks.length > 0) {
                preview.samples.tasks = data.tasks.slice(0, 5).map(function(task) {
                    return {
                        title: self.sanitizeString(task.title || '', 200),
                        completed: task.completed || false
                    };
                });
            }
            
            return preview;
        },
        
        /**
         * Execute import with specified strategy
         * @param {string} strategy - Merge strategy to use
         * @returns {Promise<Object>} Import result
         */
        executeImport: function(strategy) {
            var self = this;
            
            return new Promise(function(resolve, reject) {
                if (!self.currentImportData) {
                    reject(new Error('No import data available'));
                    return;
                }
                
                var data = self.currentImportData;
                var promises = [];
                
                // Import based on strategy
                switch (strategy) {
                    case self.MERGE_STRATEGY.REPLACE:
                        promises.push(self.replaceAllData(data));
                        break;
                    case self.MERGE_STRATEGY.MERGE:
                        promises.push(self.mergeData(data));
                        break;
                    case self.MERGE_STRATEGY.SMART:
                        promises.push(self.smartMergeData(data));
                        break;
                    default:
                        reject(new Error('Invalid merge strategy'));
                        return;
                }
                
                Promise.all(promises).then(function(results) {
                    // Clear current import data
                    self.currentImportData = null;
                    
                    // Show success message
                    if (window.Messaging) {
                        window.Messaging.showMessage('Import completed successfully!', 'success');
                    }
                    
                    resolve({
                        success: true,
                        imported: results[0]
                    });
                }).catch(function(error) {
                    if (window.Messaging) {
                        window.Messaging.showMessage('Import failed: ' + error.message, 'error');
                    }
                    reject(error);
                });
            });
        },
        
        /**
         * Replace all existing data with imported data
         * @param {Object} data - Import data
         * @returns {Promise<Object>} Import counts
         */
        replaceAllData: function(data) {
            var self = this;
            return new Promise(function(resolve, reject) {
                var imported = {
                    users: 0,
                    tasks: 0,
                    settings: 0,
                    failed: 0
                };
                
                Promise.all([
                    // Clear existing data
                    window.TaskSQLite ? window.TaskSQLite.clearAllTasks() : Promise.resolve(),
                    window.UserManager ? window.UserManager.clearAllUsers() : Promise.resolve()
                ]).then(function() {
                    var promises = [];
                    
                    // Import users
                    if (data.users && window.UserManager) {
                        data.users.forEach(function(user) {
                            promises.push(
                                window.UserManager.createUser(user).then(function() {
                                    imported.users++;
                                }).catch(function(error) {
                                    console.warn('Failed to import user:', user.name, error);
                                    imported.failed++;
                                })
                            );
                        });
                    }
                    
                    // Import tasks in batches
                    if (data.tasks && window.TaskSQLite) {
                        // Process tasks in chunks of 50
                        var chunks = self.chunkArray(data.tasks, 50);
                        var processChunk = function(index) {
                            if (index >= chunks.length) {
                                return Promise.resolve();
                            }
                            
                            var chunk = chunks[index];
                            var chunkPromises = chunk.map(function(task) {
                                return window.TaskSQLite.createTask(task).then(function() {
                                    imported.tasks++;
                                    self.updateProgress(imported.tasks, data.tasks.length);
                                }).catch(function(error) {
                                    console.warn('Failed to import task:', task.title, error);
                                    imported.failed++;
                                });
                            });
                            
                            return Promise.all(chunkPromises).then(function() {
                                // Small delay to prevent UI blocking
                                return new Promise(function(resolve) {
                                    setTimeout(function() {
                                        processChunk(index + 1).then(resolve);
                                    }, 10);
                                });
                            });
                        };
                        
                        promises.push(processChunk(0));
                    }
                    
                    // Import settings
                    if (data.settings) {
                        Object.keys(data.settings).forEach(function(key) {
                            try {
                                // Filter sensitive settings
                                if (self.isSafeSettingKey(key)) {
                                    localStorage.setItem('stackmap_' + key, data.settings[key]);
                                    imported.settings++;
                                }
                            } catch (e) {
                                console.warn('Failed to import setting:', key);
                                imported.failed++;
                            }
                        });
                    }
                    
                    return Promise.all(promises);
                }).then(function() {
                    resolve(imported);
                }).catch(reject);
            });
        },
        
        /**
         * Split array into chunks
         * @param {Array} array - Array to chunk
         * @param {number} size - Chunk size
         * @returns {Array} Array of chunks
         */
        chunkArray: function(array, size) {
            var chunks = [];
            for (var i = 0; i < array.length; i += size) {
                chunks.push(array.slice(i, i + size));
            }
            return chunks;
        },
        
        /**
         * Update progress indicator
         * @param {number} current - Current progress
         * @param {number} total - Total items
         */
        updateProgress: function(current, total) {
            if (window.DataIOUI && window.DataIOUI.updateImportProgress) {
                window.DataIOUI.updateImportProgress(current, total);
            }
        },
        
        /**
         * Check if setting key is safe to import
         * @param {string} key - Setting key
         * @returns {boolean} True if safe
         */
        isSafeSettingKey: function(key) {
            // Whitelist of safe settings
            var safeKeys = [
                'theme', 'celebrationsEnabled', 'soundsEnabled', 
                'safeMode', 'lastExport', 'language', 'fontSize'
            ];
            return safeKeys.indexOf(key) !== -1;
        },
        
        /**
         * Merge imported data with existing data
         * @param {Object} data - Import data
         * @returns {Promise<Object>} Import counts
         */
        mergeData: function(data) {
            var self = this;
            return new Promise(function(resolve, reject) {
                var imported = {
                    users: 0,
                    tasks: 0,
                    settings: 0,
                    failed: 0
                };
                
                var userPromise = Promise.resolve();
                var taskPromise = Promise.resolve();
                
                // Import new users (skip existing by name)
                if (data.users && window.UserManager) {
                    userPromise = window.UserManager.getAllUsers().then(function(existingUsers) {
                        var existingNames = existingUsers.map(function(u) { return u.name; });
                        var userPromises = [];
                        
                        data.users.forEach(function(user) {
                            if (existingNames.indexOf(user.name) === -1) {
                                userPromises.push(
                                    window.UserManager.createUser(user).then(function() {
                                        imported.users++;
                                    }).catch(function(error) {
                                        console.warn('Failed to import user:', user.name, error);
                                        imported.failed++;
                                    })
                                );
                            }
                        });
                        
                        return Promise.all(userPromises);
                    });
                }
                
                // Import all tasks in batches
                if (data.tasks && window.TaskSQLite) {
                    var chunks = self.chunkArray(data.tasks, 50);
                    var processChunk = function(index) {
                        if (index >= chunks.length) {
                            return Promise.resolve();
                        }
                        
                        var chunk = chunks[index];
                        var chunkPromises = chunk.map(function(task) {
                            // Generate new ID to avoid conflicts
                            var newTask = Object.assign({}, task, {
                                id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                            });
                            
                            return window.TaskSQLite.createTask(newTask).then(function() {
                                imported.tasks++;
                                self.updateProgress(imported.tasks, data.tasks.length);
                            }).catch(function(error) {
                                console.warn('Failed to import task:', task.title, error);
                                imported.failed++;
                            });
                        });
                        
                        return Promise.all(chunkPromises).then(function() {
                            return new Promise(function(resolve) {
                                setTimeout(function() {
                                    processChunk(index + 1).then(resolve);
                                }, 10);
                            });
                        });
                    };
                    
                    promises.push(processChunk(0));
                }
                
                // Merge settings (imported values take precedence)
                if (data.settings) {
                    Object.keys(data.settings).forEach(function(key) {
                        try {
                            if (self.isSafeSettingKey(key)) {
                                localStorage.setItem('stackmap_' + key, data.settings[key]);
                                imported.settings++;
                            }
                        } catch (e) {
                            console.warn('Failed to import setting:', key);
                            imported.failed++;
                        }
                    });
                }
                
                // Wait for all async operations to complete
                Promise.all([userPromise, taskPromise]).then(function() {
                    resolve(imported);
                }).catch(reject);
            });
        },
        
        /**
         * Smart merge - update existing, add new
         * @param {Object} data - Import data
         * @returns {Promise<Object>} Import counts
         */
        smartMergeData: function(data) {
            var self = this;
            return new Promise(function(resolve, reject) {
                var imported = {
                    users: 0,
                    tasks: 0,
                    settings: 0,
                    updated: 0,
                    failed: 0
                };
                
                var userPromise = Promise.resolve();
                var taskPromise = Promise.resolve();
                
                // Smart merge users
                if (data.users && window.UserManager) {
                    userPromise = window.UserManager.getAllUsers().then(function(existingUsers) {
                        var existingMap = {};
                        existingUsers.forEach(function(user) {
                            existingMap[user.id] = user;
                        });
                        
                        var userPromises = [];
                        data.users.forEach(function(user) {
                            var promise;
                            if (existingMap[user.id]) {
                                // Check if updateUser method exists
                                if (window.UserManager.updateUser) {
                                    promise = window.UserManager.updateUser(user.id, user).then(function() {
                                        imported.updated++;
                                    });
                                } else {
                                    // Fallback: delete and recreate
                                    promise = window.UserManager.deleteUser(user.id).then(function() {
                                        return window.UserManager.createUser(user);
                                    }).then(function() {
                                        imported.updated++;
                                    });
                                }
                            } else {
                                promise = window.UserManager.createUser(user).then(function() {
                                    imported.users++;
                                });
                            }
                            
                            userPromises.push(promise.catch(function(error) {
                                console.warn('Failed to import/update user:', user.name, error);
                                imported.failed++;
                            }));
                        });
                        
                        return Promise.all(userPromises);
                    });
                }
                
                // Smart merge tasks in batches
                if (data.tasks && window.TaskSQLite) {
                    taskPromise = window.TaskSQLite.getAllTasks().then(function(existingTasks) {
                        var existingMap = {};
                        existingTasks.forEach(function(task) {
                            existingMap[task.id] = task;
                        });
                        
                        // Process in batches
                        var chunks = self.chunkArray(data.tasks, 50);
                        var processChunk = function(index) {
                            if (index >= chunks.length) {
                                return Promise.resolve();
                            }
                            
                            var chunk = chunks[index];
                            var chunkPromises = chunk.map(function(task) {
                                var promise;
                                if (existingMap[task.id]) {
                                    // Update existing task
                                    promise = window.TaskSQLite.updateTask(task.id, task).then(function() {
                                        imported.updated++;
                                        self.updateProgress(imported.tasks + imported.updated, data.tasks.length);
                                    });
                                } else {
                                    // Create new task
                                    promise = window.TaskSQLite.createTask(task).then(function() {
                                        imported.tasks++;
                                        self.updateProgress(imported.tasks + imported.updated, data.tasks.length);
                                    });
                                }
                                
                                return promise.catch(function(error) {
                                    console.warn('Failed to import/update task:', task.title, error);
                                    imported.failed++;
                                });
                            });
                            
                            return Promise.all(chunkPromises).then(function() {
                                return new Promise(function(resolve) {
                                    setTimeout(function() {
                                        processChunk(index + 1).then(resolve);
                                    }, 10);
                                });
                            });
                        };
                        
                        return processChunk(0);
                    });
                }
                
                // Merge settings
                if (data.settings) {
                    Object.keys(data.settings).forEach(function(key) {
                        try {
                            if (self.isSafeSettingKey(key)) {
                                localStorage.setItem('stackmap_' + key, data.settings[key]);
                                imported.settings++;
                            }
                        } catch (e) {
                            console.warn('Failed to import setting:', key);
                            imported.failed++;
                        }
                    });
                }
                
                // Wait for all async operations
                Promise.all([userPromise, taskPromise]).then(function() {
                    resolve(imported);
                }).catch(reject);
            });
        },
        
        /**
         * Create and trigger file input for import
         * @returns {Promise<Object>} Import preview
         */
        selectFile: function() {
            var self = this;
            
            return new Promise(function(resolve, reject) {
                var fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json,application/json';
                fileInput.style.display = 'none';
                
                fileInput.addEventListener('change', function(e) {
                    var file = e.target.files[0];
                    if (!file) {
                        reject(new Error('No file selected'));
                        return;
                    }
                    
                    // Validate file type
                    var validTypes = ['application/json', 'text/json', 'text/plain'];
                    if (file.type && validTypes.indexOf(file.type) === -1) {
                        // Check file extension as fallback
                        if (!file.name.toLowerCase().endsWith('.json')) {
                            reject(new Error('Invalid file type. Please select a JSON file.'));
                            return;
                        }
                    }
                    
                    // Check file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        reject(new Error('File too large (max 10MB)'));
                        return;
                    }
                    
                    var reader = new FileReader();
                    
                    reader.onload = function(e) {
                        self.importTasks(e.target.result).then(resolve).catch(reject);
                    };
                    
                    reader.onerror = function() {
                        reject(new Error('Failed to read file'));
                    };
                    
                    reader.readAsText(file);
                });
                
                // Trigger file selection
                document.body.appendChild(fileInput);
                fileInput.click();
                
                // Cleanup
                setTimeout(function() {
                    document.body.removeChild(fileInput);
                }, 100);
            });
        }
    };
    
    // Expose to global scope
    window.DataImporter = DataImporter;
    
})(window);