/**
 * StackMap Data Import/Export UI Controller
 * Handles UI interactions for data import/export functionality
 * ES5 compatible for maximum device support
 */

(function(window) {
    'use strict';
    
    const DataIOUI = {
        init: function() {
            this.setupEventListeners();
        },
        
        setupEventListeners: function() {
            const self = this;
            
            // Export button
            const exportBtn = document.getElementById('export-data-btn');
            if (exportBtn) {
                exportBtn.addEventListener('click', function() {
                    self.handleExport();
                });
            }
            
            // Import button
            const importBtn = document.getElementById('import-data-btn');
            if (importBtn) {
                importBtn.addEventListener('click', function() {
                    self.handleImport();
                });
            }
            
            // Import confirmation button
            const confirmImportBtn = document.getElementById('confirm-import-btn');
            if (confirmImportBtn) {
                confirmImportBtn.addEventListener('click', function() {
                    self.executeImport();
                });
            }
            
            // Modal close handlers
            const modalCloseElements = document.querySelectorAll('[data-close-modal]');
            for (let i = 0; i < modalCloseElements.length; i++) {
                modalCloseElements[i].addEventListener('click', function() {
                    self.closeImportModal();
                });
            }
        },
        
        handleExport: function() {
            if (!window.DataExporter) {
                if (window.Messaging) {
                    window.Messaging.showMessage('Export functionality not available', 'error');
                }
                return;
            }
            
            // Show export size estimate first
            window.DataExporter.getExportSize().then(function(size) {
                const sizeInKB = (size / 1024).toFixed(2);
                const confirmExport = confirm(`Export will create a ${sizeInKB}KB file. Continue?`);
                
                if (confirmExport) {
                    // Try file download first
                    window.DataExporter.downloadAsFile().catch(function(error) {
                        console.error('Download failed:', error);
                        
                        // Fallback to clipboard on mobile
                        if (window.confirm('Download failed. Copy to clipboard instead?')) {
                            return window.DataExporter.copyToClipboard();
                        }
                    });
                }
            }).catch(function(error) {
                if (window.Messaging) {
                    window.Messaging.showMessage(`Export failed: ${error.message}`, 'error');
                }
            });
        },
        
        handleImport: function() {
            if (!window.DataImporter) {
                if (window.Messaging) {
                    window.Messaging.showMessage('Import functionality not available', 'error');
                }
                return;
            }
            
            const self = this;
            
            // Open file picker
            window.DataImporter.selectFile().then(function(preview) {
                self.showImportPreview(preview);
            }).catch(function(error) {
                if (error.message !== 'No file selected') {
                    if (window.Messaging) {
                        window.Messaging.showMessage(`Import failed: ${error.message}`, 'error');
                    }
                }
            });
        },
        
        showImportPreview: function(preview) {
            const modal = document.getElementById('import-preview-modal');
            const content = document.getElementById('import-preview-content');
            
            if (!modal || !content) return;
            
            // Build preview HTML
            let html = '<div class="import-preview">';
            
            // Add progress bar (hidden initially)
            html += '<div id="import-progress-container" style="display: none; margin-bottom: 16px;">';
            html += '<div style="background: #e0e0e0; border-radius: 8px; height: 20px; overflow: hidden;">';
            html += '<div id="import-progress-bar" style="background: var(--primary-purple); height: 100%; width: 0%; transition: width 0.3s ease;"></div>';
            html += '</div>';
            html += '<p id="import-progress-text" style="text-align: center; margin-top: 8px; font-size: 14px;">0%</p>';
            html += '</div>';
            
            // Source info
            html += '<div class="import-info" style="margin-bottom: 16px;">';
            html += `<p><strong>Source:</strong> ${this.escapeHtml(preview.source)}</p>`;
            html += `<p><strong>Export Date:</strong> ${this.formatDate(preview.exportDate)}</p>`;
            html += `<p><strong>Version:</strong> ${this.escapeHtml(preview.version)}</p>`;
            html += '</div>';
            
            // Counts
            html += '<div class="import-counts" style="margin-bottom: 16px;">';
            html += '<h3 style="font-size: 18px; margin-bottom: 8px;">Data Summary:</h3>';
            html += '<ul style="list-style: none; padding: 0;">';
            html += `<li>👤 <strong>${preview.counts.users}</strong> users</li>`;
            html += `<li>📋 <strong>${preview.counts.tasks}</strong> tasks `;
            html += `(${preview.counts.completedTasks} completed)</li>`;
            html += `<li>⚙️ <strong>${preview.counts.settings}</strong> settings</li>`;
            html += '</ul>';
            html += '</div>';
            
            // Sample data
            if (preview.samples.tasks.length > 0) {
                html += '<div class="import-samples">';
                html += '<h3 style="font-size: 18px; margin-bottom: 8px;">Sample Tasks:</h3>';
                html += '<ul style="list-style: none; padding: 0; font-size: 14px;">';
                
                for (let i = 0; i < preview.samples.tasks.length; i++) {
                    const task = preview.samples.tasks[i];
                    const icon = task.completed ? '✅' : '⬜';
                    html += `<li style="margin-bottom: 4px;">${icon} ${this.escapeHtml(task.title)}</li>`;
                }
                
                if (preview.counts.tasks > preview.samples.tasks.length) {
                    html += `<li style="color: var(--color-text-secondary);">...and ${preview.counts.tasks - preview.samples.tasks.length} more</li>`;
                }
                
                html += '</ul>';
                html += '</div>';
            }
            
            html += '</div>';
            
            // Update modal content
            content.innerHTML = html;
            
            // Show modal
            modal.classList.remove('hidden');
            modal.classList.add('modal-active');
            
            // Focus on modal for accessibility
            const firstButton = modal.querySelector('button');
            if (firstButton) firstButton.focus();
        },
        
        closeImportModal: function() {
            const modal = document.getElementById('import-preview-modal');
            if (modal) {
                modal.classList.remove('modal-active');
                setTimeout(function() {
                    modal.classList.add('hidden');
                }, 200);
            }
        },
        
        executeImport: function() {
            if (!window.DataImporter || !window.DataImporter.currentImportData) {
                if (window.Messaging) {
                    window.Messaging.showMessage('No import data available', 'error');
                }
                return;
            }
            
            // Get selected strategy
            const strategyInput = document.querySelector('input[name="import-strategy"]:checked');
            if (!strategyInput) {
                if (window.Messaging) {
                    window.Messaging.showMessage('Please select an import strategy', 'error');
                }
                return;
            }
            
            const strategy = strategyInput.value;
            const self = this;
            
            // Disable import button
            const confirmBtn = document.getElementById('confirm-import-btn');
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Importing...';
            }
            
            // Execute import
            window.DataImporter.executeImport(strategy).then(function(result) {
                self.closeImportModal();
                
                // Show success summary
                let message = 'Import successful! ';
                if (result.imported.users > 0) {
                    message += `${result.imported.users} users, `;
                }
                message += `${result.imported.tasks} tasks imported.`;
                if (result.imported.updated > 0) {
                    message += ` ${result.imported.updated} items updated.`;
                }
                
                if (window.Messaging) {
                    window.Messaging.showMessage(message, 'success');
                }
                
                // Refresh the task display
                if (window.TaskDisplay && window.TaskDisplay.loadTasks) {
                    window.TaskDisplay.loadTasks();
                }
                
            }).catch(function(error) {
                if (window.Messaging) {
                    window.Messaging.showMessage(`Import failed: ${error.message}`, 'error');
                }
            }).finally(function() {
                // Re-enable button
                if (confirmBtn) {
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = 'Import';
                }
            });
        },
        
        /**
         * Update import progress indicator
         * @param {number} current - Current count
         * @param {number} total - Total count
         */
        updateImportProgress: function(current, total) {
            const container = document.getElementById('import-progress-container');
            const bar = document.getElementById('import-progress-bar');
            const text = document.getElementById('import-progress-text');
            
            if (container && bar && text) {
                // Show progress container
                container.style.display = 'block';
                
                // Calculate percentage
                const percent = Math.round((current / total) * 100);
                
                // Update bar
                bar.style.width = `${percent}%`;
                
                // Update text
                text.textContent = `${percent}% (${current} of ${total} tasks)`;
            }
        },
        
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        formatDate: function(dateString) {
            try {
                const date = new Date(dateString);
                return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            } catch (e) {
                return dateString;
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            DataIOUI.init();
        });
    } else {
        DataIOUI.init();
    }
    
    // Expose to global scope
    window.DataIOUI = DataIOUI;
    
})(window);