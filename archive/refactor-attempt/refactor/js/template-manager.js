/**
 * Template Manager for StackMap Card Library System
 * Core CRUD operations for activity templates
 * Supports template creation, management, and intelligent features
 */

(function() {
    'use strict';
    
    const TemplateManager = {
        // State
        isInitialized: false,
        templates: [],
        categories: new Set(),
        
        /**
         * Initialize the template manager
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return Promise.resolve();
            
            return new Promise(function(resolve, reject) {
                // Ensure database schema is available
                if (!window.StackMapDataSchema || !window.StackMapDataSchema.template) {
                    console.error('TemplateManager: Database schema not available');
                    reject(new Error('Database schema not available'));
                    return;
                }
                
                // Load existing templates from storage
                self.loadTemplates()
                    .then(function() {
                        self.isInitialized = true;
                        console.log(`TemplateManager: Initialized with ${self.templates.length} templates`);
                        resolve();
                    })
                    .catch(function(error) {
                        console.error('TemplateManager: Initialization failed', error);
                        reject(error);
                    });
            });
        },
        
        /**
         * Create a new template from an activity
         */
        create: function(activity, options) {
            const self = this;
            options = options || {};
            
            return new Promise(function(resolve, reject) {
                try {
                    // Validate input
                    if (!activity || !activity.title) {
                        reject(new Error('Activity title is required'));
                        return;
                    }
                    
                    // Create template data structure
                    const templateData = {
                        title: options.title || `${activity.title} Template`,
                        description: options.description || `Template based on ${activity.title}`,
                        category: options.category || activity.category || 'general',
                        icon: options.icon || activity.icon || '📝',
                        timeEstimate: options.timeEstimate || activity.timeEstimate || null,
                        type: {
                            category: (activity.type && activity.type.category) || 'frequent',
                            confidence: (activity.type && activity.type.confidence) || 0.8
                        },
                        template: {
                            title: activity.title,
                            description: activity.description || '',
                            placeholders: self.extractPlaceholders(activity),
                            defaultValues: options.defaultValues || {}
                        },
                        metadata: {
                            createdBy: 'user',
                            tags: options.tags || []
                        }
                    };
                    
                    // Create template using schema
                    const template = window.StackMapDataSchema.template.create(templateData);
                    
                    // Save to storage
                    self.save(template)
                        .then(function(savedTemplate) {
                            console.log('TemplateManager: Created template', savedTemplate.id);
                            resolve(savedTemplate);
                        })
                        .catch(function(error) {
                            console.error('TemplateManager: Failed to save template', error);
                            reject(error);
                        });
                        
                } catch (error) {
                    console.error('TemplateManager: Template creation failed', error);
                    reject(error);
                }
            });
        },
        
        /**
         * Save template to storage
         */
        save: function(template) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                try {
                    // Validate template
                    const errors = window.StackMapDataSchema.template.validate(template);
                    if (errors.length > 0) {
                        reject(new Error(`Template validation failed: ${errors.join(', ')}`));
                        return;
                    }
                    
                    // Check for SQLite storage
                    if (window.ActivitySQLite && window.ActivitySQLite.saveTemplate) {
                        window.ActivitySQLite.saveTemplate(template)
                            .then(function(result) {
                                // Add to local cache
                                const existingIndex = self.templates.findIndex(function(t) {
                                    return t.id === template.id;
                                });
                                
                                if (existingIndex >= 0) {
                                    self.templates[existingIndex] = template;
                                } else {
                                    self.templates.push(template);
                                }
                                
                                // Update categories cache
                                self.categories.add(template.category);
                                
                                // Dispatch event
                                document.dispatchEvent(new CustomEvent('template-saved', {
                                    detail: { template: template }
                                }));
                                
                                resolve(template);
                            })
                            .catch(function(error) {
                                console.error('TemplateManager: SQLite save failed', error);
                                reject(error);
                            });
                    } else {
                        // Fallback to localStorage
                        self.saveToLocalStorage(template)
                            .then(function() {
                                resolve(template);
                            })
                            .catch(function(error) {
                                reject(error);
                            });
                    }
                    
                } catch (error) {
                    console.error('TemplateManager: Save operation failed', error);
                    reject(error);
                }
            });
        },
        
        /**
         * Load template by ID
         */
        load: function(templateId) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                if (!templateId) {
                    reject(new Error('Template ID is required'));
                    return;
                }
                
                // Check local cache first
                const cached = self.templates.find(function(t) {
                    return t.id === templateId;
                });
                
                if (cached) {
                    resolve(cached);
                    return;
                }
                
                // Load from storage
                if (window.ActivitySQLite && window.ActivitySQLite.getTemplate) {
                    window.ActivitySQLite.getTemplate(templateId)
                        .then(function(template) {
                            if (template) {
                                resolve(template);
                            } else {
                                reject(new Error('Template not found'));
                            }
                        })
                        .catch(function(error) {
                            console.error('TemplateManager: SQLite load failed', error);
                            reject(error);
                        });
                } else {
                    // Fallback to localStorage
                    self.loadFromLocalStorage(templateId)
                        .then(function(template) {
                            resolve(template);
                        })
                        .catch(function(error) {
                            reject(error);
                        });
                }
            });
        },
        
        /**
         * Delete template by ID
         */
        delete: function(templateId) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                if (!templateId) {
                    reject(new Error('Template ID is required'));
                    return;
                }
                
                // Remove from storage
                if (window.ActivitySQLite && window.ActivitySQLite.deleteTemplate) {
                    window.ActivitySQLite.deleteTemplate(templateId)
                        .then(function() {
                            // Remove from local cache
                            self.templates = self.templates.filter(function(t) {
                                return t.id !== templateId;
                            });
                            
                            // Dispatch event
                            document.dispatchEvent(new CustomEvent('template-deleted', {
                                detail: { templateId: templateId }
                            }));
                            
                            console.log('TemplateManager: Deleted template', templateId);
                            resolve();
                        })
                        .catch(function(error) {
                            console.error('TemplateManager: SQLite delete failed', error);
                            reject(error);
                        });
                } else {
                    // Fallback to localStorage
                    self.deleteFromLocalStorage(templateId)
                        .then(function() {
                            resolve();
                        })
                        .catch(function(error) {
                            reject(error);
                        });
                }
            });
        },
        
        /**
         * Duplicate an existing template
         */
        duplicate: function(templateId, newTitle) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                self.load(templateId)
                    .then(function(originalTemplate) {
                        // Create copy with new ID and title
                        const duplicateData = JSON.parse(JSON.stringify(originalTemplate));
                        duplicateData.id = window.StackMapDataSchema.template.generateTemplateId();
                        duplicateData.title = newTitle || `${originalTemplate.title} Copy`;
                        duplicateData.metadata.created = new Date().toISOString();
                        duplicateData.metadata.modified = new Date().toISOString();
                        duplicateData.metadata.usageCount = 0;
                        duplicateData.metadata.lastUsed = null;
                        duplicateData.metadata.version = 1;
                        
                        // Save the duplicate
                        return self.save(duplicateData);
                    })
                    .then(function(duplicatedTemplate) {
                        console.log('TemplateManager: Duplicated template', duplicatedTemplate.id);
                        resolve(duplicatedTemplate);
                    })
                    .catch(function(error) {
                        console.error('TemplateManager: Duplication failed', error);
                        reject(error);
                    });
            });
        },
        
        /**
         * Search templates by query and filters
         */
        search: function(query, filters) {
            const self = this;
            filters = filters || {};
            
            return new Promise(function(resolve) {
                let results = self.templates.slice();
                
                // Apply text search
                if (query && query.trim()) {
                    const searchTerms = query.toLowerCase().trim().split(/\s+/);
                    
                    if (filters.fuzzy) {
                        // Fuzzy search implementation
                        results = results.filter(function(template) {
                            const searchText = [
                                template.title,
                                template.description,
                                template.category,
                                template.metadata.tags.join(' ')
                            ].join(' ').toLowerCase();
                            
                            return searchTerms.some(function(term) {
                                // Check for partial matches
                                return searchText.includes(term) || 
                                       self.fuzzyMatch(term, searchText);
                            });
                        });
                    } else {
                        // Exact search
                        results = results.filter(function(template) {
                            const searchText = [
                                template.title,
                                template.description,
                                template.category,
                                template.metadata.tags.join(' ')
                            ].join(' ').toLowerCase();
                            
                            return searchTerms.every(function(term) {
                                return searchText.includes(term);
                            });
                        });
                    }
                }
                
                // Apply category filter
                if (filters.category && filters.category !== 'all') {
                    results = results.filter(function(template) {
                        return template.category === filters.category;
                    });
                }
                
                // Apply type filter
                if (filters.type) {
                    results = results.filter(function(template) {
                        return template.type && template.type.category === filters.type;
                    });
                }
                
                // Apply sorting
                if (filters.sortBy) {
                    results.sort(function(a, b) {
                        switch (filters.sortBy) {
                            case 'popularity':
                                return (b.metadata.usageCount || 0) - (a.metadata.usageCount || 0);
                            case 'recent':
                                return new Date(b.metadata.modified) - new Date(a.metadata.modified);
                            case 'name':
                                return a.title.localeCompare(b.title);
                            default:
                                return 0;
                        }
                    });
                }
                
                resolve(results);
            });
        },
        
        /**
         * Get templates by category
         */
        getByCategory: function(category) {
            const self = this;
            
            return self.search('', { category: category });
        },
        
        /**
         * Get popular templates
         */
        getPopular: function(limit) {
            const self = this;
            limit = limit || 10;
            
            return self.search('', { sortBy: 'popularity' })
                .then(function(results) {
                    return results.slice(0, limit);
                });
        },
        
        /**
         * Get recently used templates
         */
        getRecent: function(limit) {
            const self = this;
            limit = limit || 10;
            
            return self.search('', { sortBy: 'recent' })
                .then(function(results) {
                    return results.slice(0, limit);
                });
        },
        
        /**
         * Record template usage
         */
        recordUsage: function(templateId, customizations) {
            const self = this;
            customizations = customizations || {};
            
            return new Promise(function(resolve, reject) {
                self.load(templateId)
                    .then(function(template) {
                        // Update usage statistics
                        template.metadata.usageCount = (template.metadata.usageCount || 0) + 1;
                        template.metadata.lastUsed = new Date().toISOString();
                        template.metadata.modified = new Date().toISOString();
                        
                        // Save updated template
                        return self.save(template);
                    })
                    .then(function(updatedTemplate) {
                        // Dispatch usage event for analytics
                        document.dispatchEvent(new CustomEvent('template-used', {
                            detail: { 
                                template: updatedTemplate,
                                customizations: customizations
                            }
                        }));
                        
                        resolve(updatedTemplate);
                    })
                    .catch(function(error) {
                        console.error('TemplateManager: Usage recording failed', error);
                        reject(error);
                    });
            });
        },
        
        /**
         * Get usage statistics for a template
         */
        getUsageStats: function(templateId) {
            const self = this;
            
            return self.load(templateId)
                .then(function(template) {
                    return {
                        usageCount: template.metadata.usageCount || 0,
                        lastUsed: template.metadata.lastUsed,
                        created: template.metadata.created,
                        modified: template.metadata.modified
                    };
                });
        },
        
        /**
         * Export templates to JSON
         */
        exportTemplates: function(templateIds) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                if (!templateIds || templateIds.length === 0) {
                    // Export all templates
                    templateIds = self.templates.map(function(t) { return t.id; });
                }
                
                const exportPromises = templateIds.map(function(id) {
                    return self.load(id);
                });
                
                Promise.all(exportPromises)
                    .then(function(templates) {
                        const exportData = {
                            version: '1.0',
                            exported: new Date().toISOString(),
                            templates: templates
                        };
                        
                        resolve(exportData);
                    })
                    .catch(function(error) {
                        console.error('TemplateManager: Export failed', error);
                        reject(error);
                    });
            });
        },
        
        /**
         * Import templates from JSON
         */
        importTemplates: function(templateData) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                try {
                    if (!templateData || !templateData.templates) {
                        reject(new Error('Invalid template data format'));
                        return;
                    }
                    
                    const importPromises = templateData.templates.map(function(template) {
                        // Generate new ID to avoid conflicts
                        template.id = window.StackMapDataSchema.template.generateTemplateId();
                        template.metadata.created = new Date().toISOString();
                        template.metadata.modified = new Date().toISOString();
                        
                        return self.save(template);
                    });
                    
                    Promise.all(importPromises)
                        .then(function(importedTemplates) {
                            console.log(`TemplateManager: Imported ${importedTemplates.length} templates`);
                            resolve(importedTemplates);
                        })
                        .catch(function(error) {
                            console.error('TemplateManager: Import failed', error);
                            reject(error);
                        });
                        
                } catch (error) {
                    console.error('TemplateManager: Import processing failed', error);
                    reject(error);
                }
            });
        },
        
        /**
         * Load all templates from storage
         */
        loadTemplates: function() {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                if (window.ActivitySQLite && window.ActivitySQLite.getAllTemplates) {
                    window.ActivitySQLite.getAllTemplates()
                        .then(function(templates) {
                            self.templates = templates || [];
                            self.updateCategoriesCache();
                            resolve();
                        })
                        .catch(function(error) {
                            console.error('TemplateManager: SQLite load failed', error);
                            reject(error);
                        });
                } else {
                    // Fallback to localStorage
                    self.loadAllFromLocalStorage()
                        .then(function() {
                            resolve();
                        })
                        .catch(function(error) {
                            reject(error);
                        });
                }
            });
        },
        
        /**
         * Extract placeholders from activity text
         */
        extractPlaceholders: function(activity) {
            const placeholders = [];
            const text = `${activity.title} ${activity.description || ''}`;
            
            // Look for patterns like [PLACEHOLDER_NAME] or {placeholder}
            const matches = text.match(/\[([A-Z_]+)\]|\{([a-zA-Z_]+)\}/g);
            if (matches) {
                matches.forEach(function(match) {
                    const placeholder = match.replace(/[\[\]{}]/g, '');
                    if (placeholders.indexOf(placeholder) === -1) {
                        placeholders.push(placeholder);
                    }
                });
            }
            
            return placeholders;
        },
        
        /**
         * Update categories cache
         */
        updateCategoriesCache: function() {
            const self = this;
            
            self.categories.clear();
            self.templates.forEach(function(template) {
                if (template.category) {
                    self.categories.add(template.category);
                }
            });
        },
        
        /**
         * Get all available categories
         */
        getCategories: function() {
            return Array.from(this.categories).sort();
        },
        
        /**
         * Fallback: Save to localStorage
         */
        saveToLocalStorage: function(template) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                try {
                    const key = `stackmap_template_${template.id}`;
                    localStorage.setItem(key, JSON.stringify(template));
                    
                    // Update local cache
                    const existingIndex = self.templates.findIndex(function(t) {
                        return t.id === template.id;
                    });
                    
                    if (existingIndex >= 0) {
                        self.templates[existingIndex] = template;
                    } else {
                        self.templates.push(template);
                    }
                    
                    self.categories.add(template.category);
                    
                    // Update template list in localStorage
                    const templateIds = self.templates.map(function(t) { return t.id; });
                    localStorage.setItem('stackmap_template_ids', JSON.stringify(templateIds));
                    
                    resolve(template);
                } catch (error) {
                    console.error('TemplateManager: localStorage save failed', error);
                    reject(error);
                }
            });
        },
        
        /**
         * Fallback: Load from localStorage
         */
        loadFromLocalStorage: function(templateId) {
            return new Promise(function(resolve, reject) {
                try {
                    const key = `stackmap_template_${templateId}`;
                    const data = localStorage.getItem(key);
                    
                    if (data) {
                        const template = JSON.parse(data);
                        resolve(template);
                    } else {
                        reject(new Error('Template not found in localStorage'));
                    }
                } catch (error) {
                    console.error('TemplateManager: localStorage load failed', error);
                    reject(error);
                }
            });
        },
        
        /**
         * Fallback: Load all from localStorage
         */
        loadAllFromLocalStorage: function() {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                try {
                    const templateIdsData = localStorage.getItem('stackmap_template_ids');
                    const templateIds = templateIdsData ? JSON.parse(templateIdsData) : [];
                    
                    const loadPromises = templateIds.map(function(id) {
                        return self.loadFromLocalStorage(id);
                    });
                    
                    Promise.all(loadPromises)
                        .then(function(templates) {
                            self.templates = templates;
                            self.updateCategoriesCache();
                            resolve();
                        })
                        .catch(function(error) {
                            console.error('TemplateManager: localStorage load all failed', error);
                            self.templates = [];
                            resolve(); // Don't reject, just start with empty
                        });
                } catch (error) {
                    console.error('TemplateManager: localStorage initialization failed', error);
                    self.templates = [];
                    resolve(); // Don't reject, just start with empty
                }
            });
        },
        
        /**
         * Fallback: Delete from localStorage
         */
        deleteFromLocalStorage: function(templateId) {
            const self = this;
            
            return new Promise(function(resolve, reject) {
                try {
                    const key = `stackmap_template_${templateId}`;
                    localStorage.removeItem(key);
                    
                    // Remove from local cache
                    self.templates = self.templates.filter(function(t) {
                        return t.id !== templateId;
                    });
                    
                    // Update template list
                    const templateIds = self.templates.map(function(t) { return t.id; });
                    localStorage.setItem('stackmap_template_ids', JSON.stringify(templateIds));
                    
                    resolve();
                } catch (error) {
                    console.error('TemplateManager: localStorage delete failed', error);
                    reject(error);
                }
            });
        },
        
        /**
         * Simple fuzzy match implementation
         */
        fuzzyMatch: function(needle, haystack) {
            if (!needle || !haystack) return false;
            
            // Simple character-by-character fuzzy match
            let hIndex = 0;
            const needleLen = needle.length;
            const haystackLen = haystack.length;
            
            for (let nIndex = 0; nIndex < needleLen; nIndex++) {
                const nChar = needle.charAt(nIndex);
                let found = false;
                
                while (hIndex < haystackLen) {
                    if (haystack.charAt(hIndex) === nChar) {
                        found = true;
                        hIndex++;
                        break;
                    }
                    hIndex++;
                }
                
                if (!found) return false;
            }
            
            return true;
        }
    };
    
    // Export to global scope
    window.TemplateManager = TemplateManager;
    
})();