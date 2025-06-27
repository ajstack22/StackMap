/**
 * Bulk Delete Functionality for StackMap
 * Handles safe deletion of multiple activities with confirmation
 */

(function() {
    'use strict';
    
    const BulkDelete = {
        /**
         * Execute bulk delete operation
         */
        execute: function(activities, onComplete) {
            const self = this;
            
            if (!activities || activities.length === 0) {
                console.warn('BulkDelete: No activities to delete');
                if (onComplete) onComplete();
                return;
            }
            
            console.log('BulkDelete: Starting deletion of', activities.length, 'activities');
            
            // Show confirmation dialog
            self.showConfirmation(activities, function(confirmed) {
                if (confirmed) {
                    self.performDeletion(activities, onComplete);
                } else {
                    if (onComplete) onComplete();
                }
            });
        },
        
        /**
         * Show deletion confirmation dialog
         */
        showConfirmation: function(activities, callback) {
            const self = this;
            
            // Create modal backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'bulk-delete-modal-backdrop';
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'bulk-delete-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'bulk-delete-title');
            
            // Build activity list (show first 5, then "and X more")
            let activityListHtml = '';
            const displayActivities = activities.slice(0, 5);
            
            displayActivities.forEach(function(activity) {
                const title = activity.text || activity.title || 'Untitled Activity';
                activityListHtml += `<li class="bulk-delete-item">${self.escapeHtml(title)}</li>`;
            });
            
            if (activities.length > 5) {
                const remaining = activities.length - 5;
                activityListHtml += `<li class="bulk-delete-more">...and ${remaining} more</li>`;
            }
            
            modal.innerHTML = `
                <div class="bulk-delete-header">
                    <h2 id="bulk-delete-title" class="bulk-delete-title">
                        Delete ${activities.length} Activities?
                    </h2>
                    <button class="bulk-delete-close" aria-label="Close">×</button>
                </div>
                <div class="bulk-delete-content">
                    <div class="bulk-delete-warning">
                        <span class="bulk-delete-warning-icon">⚠️</span>
                        <p>This action cannot be undone. The following activities will be permanently deleted:</p>
                    </div>
                    <ul class="bulk-delete-list">
                        ${activityListHtml}
                    </ul>
                </div>
                <div class="bulk-delete-actions">
                    <button class="bulk-btn bulk-btn-cancel" data-action="cancel">
                        <span class="bulk-btn-icon">✕</span>
                        <span class="bulk-btn-label">Cancel</span>
                    </button>
                    <button class="bulk-btn bulk-btn-danger" data-action="confirm">
                        <span class="bulk-btn-icon">🗑️</span>
                        <span class="bulk-btn-label">Delete ${activities.length}</span>
                    </button>
                </div>
            `;
            
            // Handle events
            const handleClose = function(confirmed) {
                backdrop.remove();
                callback(confirmed);
            };
            
            // Close button
            modal.querySelector('.bulk-delete-close').addEventListener('click', function() {
                handleClose(false);
            });
            
            // Action buttons
            modal.addEventListener('click', function(e) {
                const action = e.target.closest('[data-action]')?.getAttribute('data-action');
                if (action === 'cancel') {
                    handleClose(false);
                } else if (action === 'confirm') {
                    handleClose(true);
                }
            });
            
            // Escape key
            const handleKeyDown = function(e) {
                if (e.key === 'Escape') {
                    handleClose(false);
                    document.removeEventListener('keydown', handleKeyDown);
                }
            };
            document.addEventListener('keydown', handleKeyDown);
            
            // Backdrop click
            backdrop.addEventListener('click', function(e) {
                if (e.target === backdrop) {
                    handleClose(false);
                }
            });
            
            // Show modal
            backdrop.appendChild(modal);
            document.body.appendChild(backdrop);
            
            // Focus management
            setTimeout(function() {
                const confirmBtn = modal.querySelector('[data-action="confirm"]');
                if (confirmBtn) confirmBtn.focus();
            }, 100);
        },
        
        /**
         * Perform the actual deletion
         */
        performDeletion: function(activities, onComplete) {
            const self = this;
            
            // Show progress
            self.showProgress(activities.length);
            
            // Collect activity IDs
            const activityIds = activities.map(function(activity) {
                return activity.id || activity.task_id;
            });
            
            // Determine storage method
            if (window.ActivitySQLite && window.ActivitySQLite.isReady) {
                self.deleteBatchSQLite(activityIds, activities.length, onComplete);
            } else {
                self.deleteBatchLocalStorage(activityIds, activities.length, onComplete);
            }
        },
        
        /**
         * Delete batch using SQLite
         */
        deleteBatchSQLite: function(activityIds, totalCount, onComplete) {
            const self = this;
            
            // Use transaction for safety
            window.ActivitySQLite.transaction(function(tx) {
                let completed = 0;
                let hasError = false;
                
                activityIds.forEach(function(id) {
                    if (hasError) return;
                    
                    const query = 'DELETE FROM activities WHERE id = ?';
                    tx.executeSql(query, [id], 
                        function(tx, result) {
                            completed++;
                            self.updateProgress(completed, totalCount);
                            
                            if (completed === activityIds.length) {
                                self.onDeletionComplete(totalCount, onComplete);
                            }
                        },
                        function(tx, error) {
                            console.error('BulkDelete: SQLite deletion failed for ID:', id, error);
                            hasError = true;
                            self.onDeletionError(error, onComplete);
                            return true; // Rollback transaction
                        }
                    );
                });
            });
        },
        
        /**
         * Delete batch using localStorage
         */
        deleteBatchLocalStorage: function(activityIds, totalCount, onComplete) {
            const self = this;
            
            try {
                // Get current activities
                const stored = localStorage.getItem('stackmap-activities') || '[]';
                let activities = JSON.parse(stored);
                
                // Create backup
                const backup = JSON.stringify(activities);
                
                // Filter out deleted activities
                const originalCount = activities.length;
                activities = activities.filter(function(activity) {
                    const id = activity.id || activity.task_id;
                    return !activityIds.includes(String(id));
                });
                
                // Save back to storage
                localStorage.setItem('stackmap-activities', JSON.stringify(activities));
                
                // Also try legacy task storage
                const taskStored = localStorage.getItem('stackmap-tasks');
                if (taskStored) {
                    let tasks = JSON.parse(taskStored);
                    tasks = tasks.filter(function(task) {
                        const id = task.id || task.task_id;
                        return !activityIds.includes(String(id));
                    });
                    localStorage.setItem('stackmap-tasks', JSON.stringify(tasks));
                }
                
                const deletedCount = originalCount - activities.length;
                console.log(`BulkDelete: Deleted ${deletedCount} activities from localStorage`);
                
                self.onDeletionComplete(deletedCount, onComplete);
                
            } catch (error) {
                console.error('BulkDelete: localStorage deletion failed:', error);
                self.onDeletionError(error, onComplete);
            }
        },
        
        /**
         * Show deletion progress
         */
        showProgress: function(totalCount) {
            const progress = document.createElement('div');
            progress.id = 'bulk-delete-progress';
            progress.className = 'bulk-delete-progress';
            progress.innerHTML = `
                <div class="bulk-progress-content">
                    <div class="bulk-progress-icon">🗑️</div>
                    <div class="bulk-progress-text">Deleting activities...</div>
                    <div class="bulk-progress-count">0 of ${totalCount}</div>
                </div>
            `;
            
            document.body.appendChild(progress);
        },
        
        /**
         * Update deletion progress
         */
        updateProgress: function(completed, total) {
            const progress = document.getElementById('bulk-delete-progress');
            if (progress) {
                const countEl = progress.querySelector('.bulk-progress-count');
                if (countEl) {
                    countEl.textContent = `${completed} of ${total}`;
                }
            }
        },
        
        /**
         * Handle successful deletion
         */
        onDeletionComplete: function(count, onComplete) {
            const self = this;
            
            // Remove progress
            const progress = document.getElementById('bulk-delete-progress');
            if (progress) progress.remove();
            
            // Show success notification
            self.showNotification(`Successfully deleted ${count} activities`, 'success');
            
            // Refresh the display
            if (window.ActivityDisplay && window.ActivityDisplay.render) {
                window.ActivityDisplay.render();
            } else if (window.TaskDisplay && window.TaskDisplay.render) {
                window.TaskDisplay.render();
            }
            
            // Trigger events
            document.dispatchEvent(new CustomEvent('activitiesChanged'));
            document.dispatchEvent(new CustomEvent('tasksChanged')); // Legacy compatibility
            
            // Record undo action if available
            if (window.UndoManager) {
                // Note: Actual undo implementation would need to store deleted activities
                console.log('BulkDelete: Undo support not yet implemented');
            }
            
            if (onComplete) onComplete();
        },
        
        /**
         * Handle deletion error
         */
        onDeletionError: function(error, onComplete) {
            const self = this;
            
            // Remove progress
            const progress = document.getElementById('bulk-delete-progress');
            if (progress) progress.remove();
            
            // Show error notification
            self.showNotification('Failed to delete activities. Please try again.', 'error');
            
            console.error('BulkDelete: Deletion failed:', error);
            
            if (onComplete) onComplete();
        },
        
        /**
         * Show notification
         */
        showNotification: function(message, type) {
            // Dispatch custom event for notification system
            const event = new CustomEvent('notification:show', {
                detail: { message: message, type: type }
            });
            document.dispatchEvent(event);
            
            // Fallback toast notification
            const toast = document.createElement('div');
            toast.className = `bulk-notification bulk-notification-${type}`;
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: ${type === 'error' ? '#dc3545' : '#28a745'};
                color: white;
                padding: 12px 24px;
                border-radius: 4px;
                z-index: 9999;
                font-weight: 500;
            `;
            
            document.body.appendChild(toast);
            
            // Remove after 4 seconds
            setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 4000);
        },
        
        /**
         * Escape HTML for safe display
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    };
    
    // Export to global scope
    window.BulkDelete = BulkDelete;
    
})();