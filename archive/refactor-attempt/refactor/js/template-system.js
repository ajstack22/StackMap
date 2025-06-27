/**
 * Template System for StackMap
 * Provides template creation, management, and instantiation
 * Story #116 - Round 8 Dev2
 */

(function() {
    'use strict';
    
    const TemplateSystem = {
        isInitialized: false,
        
        /**
         * Initialize the template system
         */
        init: function() {
            const self = this;
            
            if (self.isInitialized) return;
            
            // Listen for template events
            document.addEventListener('templateCreated', function(e) {
                self.handleTemplateCreated(e.detail);
            });
            
            document.addEventListener('templateInstantiated', function(e) {
                self.handleTemplateInstantiated(e.detail);
            });
            
            self.isInitialized = true;
            console.log('TemplateSystem: Initialized');
        },
        
        /**
         * Create template from activity with UI
         */
        createTemplateFromActivity: function(activity) {
            const self = this;
            
            // Show template creation modal
            self.showTemplateCreationModal(activity, function(templateOptions) {
                try {
                    const template = window.ActivityTypes.createTemplate(activity, templateOptions);
                    self.showSuccessMessage(`Template "${template.title}" created successfully`);
                    return template;
                } catch (error) {
                    self.showErrorMessage('Failed to create template: ' + error.message);
                    throw error;
                }
            });
        },
        
        /**
         * Show template creation modal
         */
        showTemplateCreationModal: function(activity, callback) {
            const modal = document.createElement('div');
            modal.className = 'template-creation-modal';
            modal.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Create Template</h3>
                            <button class="modal-close" aria-label="Close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="template-title">Template Name</label>
                                <input type="text" id="template-title" value="${activity.title} Template" required>
                            </div>
                            <div class="form-group">
                                <label for="template-description">Description</label>
                                <textarea id="template-description">${activity.description || ''}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="template-category">Category</label>
                                <select id="template-category">
                                    <option value="general">General</option>
                                    <option value="work">Work</option>
                                    <option value="personal">Personal</option>
                                    <option value="health">Health</option>
                                    <option value="learning">Learning</option>
                                    <option value="social">Social</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Customizable Fields</label>
                                <div class="placeholder-editor">
                                    <div class="placeholder-item">
                                        <input type="text" placeholder="Field name (e.g., duration)" class="placeholder-field">
                                        <input type="text" placeholder="Default value" class="placeholder-default">
                                        <button type="button" class="remove-placeholder" aria-label="Remove field">&times;</button>
                                    </div>
                                </div>
                                <button type="button" class="add-placeholder">+ Add Field</button>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-cancel">Cancel</button>
                            <button class="btn btn-primary">Create Template</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Setup event listeners
            const closeButton = modal.querySelector('.modal-close');
            const cancelButton = modal.querySelector('.btn-cancel');
            const createButton = modal.querySelector('.btn-primary');
            const addPlaceholderButton = modal.querySelector('.add-placeholder');
            
            const closeModal = function() {
                document.body.removeChild(modal);
            };
            
            closeButton.addEventListener('click', closeModal);
            cancelButton.addEventListener('click', closeModal);
            
            // Add placeholder functionality
            addPlaceholderButton.addEventListener('click', function() {
                const editor = modal.querySelector('.placeholder-editor');
                const newItem = document.createElement('div');
                newItem.className = 'placeholder-item';
                newItem.innerHTML = `
                    <input type="text" placeholder="Field name" class="placeholder-field">
                    <input type="text" placeholder="Default value" class="placeholder-default">
                    <button type="button" class="remove-placeholder" aria-label="Remove field">&times;</button>
                `;
                editor.appendChild(newItem);
                
                newItem.querySelector('.remove-placeholder').addEventListener('click', function() {
                    editor.removeChild(newItem);
                });
            });
            
            // Remove placeholder functionality
            modal.querySelectorAll('.remove-placeholder').forEach(button => {
                button.addEventListener('click', function() {
                    const item = button.closest('.placeholder-item');
                    item.parentNode.removeChild(item);
                });
            });
            
            createButton.addEventListener('click', function() {
                const title = modal.querySelector('#template-title').value.trim();
                const description = modal.querySelector('#template-description').value.trim();
                const category = modal.querySelector('#template-category').value;
                
                if (!title) {
                    alert('Please enter a template name');
                    return;
                }
                
                // Collect placeholders
                const placeholders = [];
                modal.querySelectorAll('.placeholder-item').forEach(item => {
                    const field = item.querySelector('.placeholder-field').value.trim();
                    const defaultValue = item.querySelector('.placeholder-default').value.trim();
                    if (field) {
                        placeholders.push({
                            field: field,
                            label: field.charAt(0).toUpperCase() + field.slice(1),
                            default: defaultValue
                        });
                    }
                });
                
                const templateOptions = {
                    title: title,
                    description: description,
                    category: category,
                    placeholders: placeholders
                };
                
                closeModal();
                callback(templateOptions);
            });
            
            // Focus title input
            modal.querySelector('#template-title').focus();
        },
        
        /**
         * Show template library
         */
        showTemplateLibrary: function(callback) {
            const self = this;
            const templates = window.ActivityTypes.getStoredTemplates();
            
            const modal = document.createElement('div');
            modal.className = 'template-library-mobile';
            modal.innerHTML = `
                <div class="template-library-header">
                    <button class="template-library-close" aria-label="Close">&times;</button>
                    <h2 class="template-library-title">Template Library</h2>
                </div>
                <div class="template-library-content">
                    <div class="template-search">
                        <input type="text" placeholder="Search templates..." class="template-search-input">
                    </div>
                    <div class="template-list">
                        ${self.renderTemplateList(Object.values(templates))}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.classList.add('open');
            
            // Setup event listeners
            const closeButton = modal.querySelector('.template-library-close');
            const searchInput = modal.querySelector('.template-search-input');
            
            closeButton.addEventListener('click', function() {
                modal.classList.remove('open');
                setTimeout(() => document.body.removeChild(modal), 300);
            });
            
            // Search functionality
            searchInput.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                const filteredTemplates = Object.values(templates).filter(template => 
                    template.title.toLowerCase().includes(query) ||
                    template.description.toLowerCase().includes(query)
                );
                modal.querySelector('.template-list').innerHTML = self.renderTemplateList(filteredTemplates);
                self.attachTemplateListeners(modal, callback);
            });
            
            self.attachTemplateListeners(modal, callback);
        },
        
        /**
         * Render template list
         */
        renderTemplateList: function(templates) {
            if (templates.length === 0) {
                return `
                    <div class="empty-state">
                        <div class="empty-icon">📄</div>
                        <h4>No templates yet</h4>
                        <p>Create your first template from an activity</p>
                    </div>
                `;
            }
            
            return templates.map(template => `
                <div class="template-card-mobile" data-template-id="${template.id}">
                    <div class="template-card-icon">📄</div>
                    <div class="template-card-content">
                        <div class="template-card-title">${template.title}</div>
                        <div class="template-card-meta">
                            Used ${template.templateData.usageCount} times
                            ${template.templateData.category ? `• ${template.templateData.category}` : ''}
                        </div>
                    </div>
                    <button class="template-card-action" data-action="use">Use</button>
                </div>
            `).join('');
        },
        
        /**
         * Attach template list event listeners
         */
        attachTemplateListeners: function(modal, callback) {
            const self = this;
            
            modal.querySelectorAll('.template-card-action').forEach(button => {
                button.addEventListener('click', function() {
                    const templateId = this.closest('.template-card-mobile').dataset.templateId;
                    const template = window.ActivityTypes.getTemplate(templateId);
                    
                    modal.classList.remove('open');
                    setTimeout(() => document.body.removeChild(modal), 300);
                    
                    if (template) {
                        self.showTemplateInstantiationModal(template, callback);
                    }
                });
            });
        },
        
        /**
         * Show template instantiation modal
         */
        showTemplateInstantiationModal: function(template, callback) {
            const modal = document.createElement('div');
            modal.className = 'template-instantiation-modal';
            
            const placeholderFields = template.templateData.placeholders.map(placeholder => `
                <div class="form-group">
                    <label for="placeholder-${placeholder.field}">${placeholder.label}</label>
                    <input type="text" id="placeholder-${placeholder.field}" 
                           value="${placeholder.default || ''}" 
                           data-field="${placeholder.field}">
                </div>
            `).join('');
            
            modal.innerHTML = `
                <div class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Use Template: ${template.title}</h3>
                            <button class="modal-close" aria-label="Close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label for="activity-title">Activity Title</label>
                                <input type="text" id="activity-title" value="${template.templateData.defaultValues.title}" required>
                            </div>
                            <div class="form-group">
                                <label for="activity-description">Description</label>
                                <textarea id="activity-description">${template.templateData.defaultValues.description || ''}</textarea>
                            </div>
                            ${placeholderFields}
                            <div class="form-group">
                                <label for="activity-day">Add to</label>
                                <select id="activity-day">
                                    <option value="today">Today</option>
                                    <option value="tomorrow">Tomorrow</option>
                                    <option value="someday">Someday</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-cancel">Cancel</button>
                            <button class="btn btn-primary">Create Activity</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Setup event listeners
            const closeButton = modal.querySelector('.modal-close');
            const cancelButton = modal.querySelector('.btn-cancel');
            const createButton = modal.querySelector('.btn-primary');
            
            const closeModal = function() {
                document.body.removeChild(modal);
            };
            
            closeButton.addEventListener('click', closeModal);
            cancelButton.addEventListener('click', closeModal);
            
            createButton.addEventListener('click', function() {
                const title = modal.querySelector('#activity-title').value.trim();
                const description = modal.querySelector('#activity-description').value.trim();
                const day = modal.querySelector('#activity-day').value;
                
                if (!title) {
                    alert('Please enter an activity title');
                    return;
                }
                
                // Collect placeholder values
                const customValues = { title, description, day };
                template.templateData.placeholders.forEach(placeholder => {
                    const input = modal.querySelector(`#placeholder-${placeholder.field}`);
                    if (input) {
                        customValues[placeholder.field] = input.value;
                    }
                });
                
                try {
                    const activity = window.ActivityTypes.instantiateTemplate(template.id, customValues);
                    closeModal();
                    if (callback) callback(activity);
                } catch (error) {
                    alert('Failed to create activity: ' + error.message);
                }
            });
            
            // Focus title input
            modal.querySelector('#activity-title').focus();
        },
        
        /**
         * Handle template created event
         */
        handleTemplateCreated: function(eventData) {
            console.log('TemplateSystem: Template created:', eventData.template.title);
        },
        
        /**
         * Handle template instantiated event
         */
        handleTemplateInstantiated: function(eventData) {
            console.log('TemplateSystem: Template instantiated:', eventData.activity.title);
        },
        
        /**
         * Show success message
         */
        showSuccessMessage: function(message) {
            this.showMessage(message, 'success');
        },
        
        /**
         * Show error message
         */
        showErrorMessage: function(message) {
            this.showMessage(message, 'error');
        },
        
        /**
         * Show message notification
         */
        showMessage: function(message, type) {
            const notification = document.createElement('div');
            notification.className = `template-notification template-notification--${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                font-size: 14px;
                z-index: 10001;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateX(100%);
                transition: transform 0.3s ease;
            `;
            
            if (type === 'success') {
                notification.style.background = '#10b981';
                notification.style.color = 'white';
            } else {
                notification.style.background = '#ef4444';
                notification.style.color = 'white';
            }
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 10);
            
            // Auto remove
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
    };
    
    // Export to global scope
    window.TemplateSystem = TemplateSystem;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            TemplateSystem.init();
        });
    } else {
        TemplateSystem.init();
    }
    
})();