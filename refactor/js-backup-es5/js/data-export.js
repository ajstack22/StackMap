/**
 * StackMap Data Export Module
 * Handles exporting user data to JSON format
 * ES5 compatible for maximum device support
 */

(function(window) {
    'use strict';
    
    const DataExporter = {
        /**
         * Export all user data to JSON
         * @returns {string} JSON string of exported data
         */
        exportTasks: function() {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                try {
                    const exportData = {
                        version: '2.0',
                        exportDate: new Date().toISOString(),
                        app: 'StackMap Mobile',
                        platform: window.StackMapApp ? window.StackMapApp.Platform.detect() : {},
                        users: [],
                        tasks: [],
                        settings: {}
                    };
                    
                    // Get all data from storage
                    Promise.all([
                        self.getUsersData(),
                        self.getTasksData(),
                        self.getSettingsData()
                    ]).then(function(results) {
                        exportData.users = results[0];
                        exportData.tasks = results[1];
                        exportData.settings = results[2];
                        
                        // Pretty print for readability
                        const jsonString = JSON.stringify(exportData, null, 2);
                        resolve(jsonString);
                    }).catch(reject);
                    
                } catch (error) {
                    reject(error);
                }
            });
        },
        
        /**
         * Get all users data
         * @returns {Promise<Array>} Array of user objects
         */
        getUsersData: function() {
            return new Promise(function(resolve) {
                if (window.UserManager && window.UserManager.getAllUsers) {
                    window.UserManager.getAllUsers().then(function(users) {
                        // Clean up user data for export
                        const cleanUsers = users.map(function(user) {
                            return {
                                id: user.id,
                                name: user.name,
                                emoji: user.emoji || '🌟',
                                preferences: user.preferences || {},
                                created_at: user.created_at
                            };
                        });
                        resolve(cleanUsers);
                    }).catch(function() {
                        resolve([]);
                    });
                } else {
                    resolve([]);
                }
            });
        },
        
        /**
         * Get all tasks data
         * @returns {Promise<Array>} Array of task objects
         */
        getTasksData: function() {
            return new Promise(function(resolve) {
                if (window.TaskSQLite && window.TaskSQLite.getAllTasks) {
                    window.TaskSQLite.getAllTasks().then(function(tasks) {
                        // Clean up task data for export
                        const cleanTasks = tasks.map(function(task) {
                            return {
                                id: task.id,
                                title: task.title,
                                completed: task.completed || false,
                                user_id: task.user_id,
                                category: task.category,
                                notes: task.notes,
                                created_at: task.created_at,
                                completed_at: task.completed_at,
                                order_index: task.order_index
                            };
                        });
                        resolve(cleanTasks);
                    }).catch(function() {
                        resolve([]);
                    });
                } else {
                    resolve([]);
                }
            });
        },
        
        /**
         * Get all settings data
         * @returns {Promise<Object>} Settings object
         */
        getSettingsData: function() {
            const self = this;
            return new Promise(function(resolve) {
                try {
                    const settings = {};
                    
                    // Only export safe settings
                    const safeKeys = [
                        'theme', 'celebrationsEnabled', 'soundsEnabled',
                        'safeMode', 'language', 'fontSize', 'animations'
                    ];
                    
                    safeKeys.forEach(function(key) {
                        const value = localStorage.getItem(`stackmap_${key}`);
                        if (value !== null) {
                            // Convert boolean strings
                            if (value === 'true') {
                                settings[key] = true;
                            } else if (value === 'false') {
                                settings[key] = false;
                            } else {
                                settings[key] = value;
                            }
                        }
                    });
                    
                    // Add export metadata
                    settings.lastExport = new Date().toISOString();
                    
                    resolve(settings);
                } catch (error) {
                    resolve({});
                }
            });
        },
        
        /**
         * Download exported data as a file
         * @returns {Promise<void>}
         */
        downloadAsFile: function() {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                self.exportTasks().then(function(jsonData) {
                    try {
                        // Generate filename with current date
                        const date = new Date();
                        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
                        const filename = `stackmap-backup-${dateStr}.json`;
                        
                        // Create blob
                        const blob = new Blob([jsonData], { type: 'application/json' });
                        
                        // Check file size (max 10MB)
                        if (blob.size > 10 * 1024 * 1024) {
                            throw new Error('Export file too large (max 10MB)');
                        }
                        
                        // Create download link
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = filename;
                        
                        // Trigger download
                        document.body.appendChild(link);
                        link.click();
                        
                        // Cleanup
                        setTimeout(function() {
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                        }, 100);
                        
                        // Show success message
                        if (window.Messaging) {
                            window.Messaging.showMessage('Data exported successfully!', 'success');
                        }
                        
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }).catch(reject);
            });
        },
        
        /**
         * Export to clipboard (mobile fallback)
         * @returns {Promise<void>}
         */
        copyToClipboard: function() {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                self.exportTasks().then(function(jsonData) {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(jsonData).then(function() {
                            if (window.Messaging) {
                                window.Messaging.showMessage('Data copied to clipboard!', 'success');
                            }
                            resolve();
                        }).catch(reject);
                    } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = jsonData;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-9999px';
                        document.body.appendChild(textArea);
                        textArea.select();
                        
                        try {
                            document.execCommand('copy');
                            if (window.Messaging) {
                                window.Messaging.showMessage('Data copied to clipboard!', 'success');
                            }
                            resolve();
                        } catch (error) {
                            reject(error);
                        } finally {
                            document.body.removeChild(textArea);
                        }
                    }
                }).catch(reject);
            });
        },
        
        /**
         * Get export size estimate
         * @returns {Promise<number>} Size in bytes
         */
        getExportSize: function() {
            const self = this;
            
            return new Promise(function(resolve) {
                self.exportTasks().then(function(jsonData) {
                    const blob = new Blob([jsonData], { type: 'application/json' });
                    resolve(blob.size);
                }).catch(function() {
                    resolve(0);
                });
            });
        }
    };
    
    // Expose to global scope
    window.DataExporter = DataExporter;
    
})(window);