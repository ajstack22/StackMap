/**
 * Copy to Tomorrow Functionality for StackMap
 * Handles duplication of selected activities to tomorrow's timeframe
 */

(function() {
    'use strict';
    
    const CopyToTomorrow = {
        /**
         * Execute copy to tomorrow operation
         */
        execute: function(activities, onComplete) {
            const self = this;
            
            if (!activities || activities.length === 0) {
                console.warn('CopyToTomorrow: No activities to copy');
                if (onComplete) onComplete();
                return;
            }
            
            console.log('CopyToTomorrow: Starting copy of', activities.length, 'activities');
            
            // Show confirmation dialog
            self.showConfirmation(activities, function(confirmed, switchView) {
                if (confirmed) {
                    self.performCopy(activities, onComplete, switchView);
                } else {
                    if (onComplete) onComplete();
                }
            });
        },
        
        /**
         * Show copy confirmation dialog
         */
        showConfirmation: function(activities, callback) {
            const self = this;
            
            // Create modal backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'copy-tomorrow-modal-backdrop';
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'copy-tomorrow-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'copy-tomorrow-title');
            
            // Build activity list (show first 5, then "and X more")
            let activityListHtml = '';
            const displayActivities = activities.slice(0, 5);
            
            displayActivities.forEach(function(activity) {
                const title = activity.text || activity.title || 'Untitled Activity';
                activityListHtml += `<li class="copy-tomorrow-item">${self.escapeHtml(title)}</li>`;
            });
            
            if (activities.length > 5) {
                const remaining = activities.length - 5;
                activityListHtml += `<li class="copy-tomorrow-more">...and ${remaining} more</li>`;
            }
            
            modal.innerHTML = `
                <div class="copy-tomorrow-header">
                    <h2 id="copy-tomorrow-title" class="copy-tomorrow-title">
                        Copy ${activities.length} Activities to Tomorrow?
                    </h2>
                    <button class="copy-tomorrow-close" aria-label="Close">×</button>
                </div>
                <div class="copy-tomorrow-content">
                    <div class="copy-tomorrow-info">
                        <span class="copy-tomorrow-info-icon">📋</span>
                        <p>These activities will be duplicated for tomorrow. The original activities will remain unchanged:</p>
                    </div>
                    <ul class="copy-tomorrow-list">
                        ${activityListHtml}
                    </ul>
                    <div class="copy-tomorrow-options">
                        <label class="copy-tomorrow-checkbox-label">
                            <input type="checkbox" class="copy-tomorrow-switch-view" checked>
                            <span class="copy-tomorrow-checkbox-text">Switch to tomorrow view after copying</span>
                        </label>
                    </div>
                </div>
                <div class="copy-tomorrow-actions">
                    <button class="bulk-btn bulk-btn-cancel" data-action="cancel">
                        <span class="bulk-btn-icon">✕</span>
                        <span class="bulk-btn-label">Cancel</span>
                    </button>
                    <button class="bulk-btn bulk-btn-primary" data-action="confirm">
                        <span class="bulk-btn-icon">📋</span>
                        <span class="bulk-btn-label">Copy ${activities.length}</span>
                    </button>
                </div>
            `;
            
            // Handle events
            const handleClose = function(confirmed, switchView) {
                backdrop.remove();
                callback(confirmed, switchView);
            };
            
            // Close button
            modal.querySelector('.copy-tomorrow-close').addEventListener('click', function() {
                handleClose(false);
            });
            
            // Action buttons
            modal.addEventListener('click', function(e) {
                const action = e.target.closest('[data-action]')?.getAttribute('data-action');
                if (action === 'cancel') {
                    handleClose(false);
                } else if (action === 'confirm') {
                    const switchView = modal.querySelector('.copy-tomorrow-switch-view').checked;
                    handleClose(true, switchView);
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
         * Perform the actual copy operation
         */
        performCopy: function(activities, onComplete, switchView) {
            const self = this;
            
            // Show progress
            self.showProgress(activities.length);
            
            // Create copies with new IDs and tomorrow timeframe
            const copies = activities.map(function(activity) {
                return self.createActivityCopy(activity);
            });
            
            // Determine storage method
            if (window.ActivitySQLite && window.ActivitySQLite.isReady) {
                self.saveBatchSQLite(copies, activities.length, onComplete, switchView);
            } else {
                self.saveBatchLocalStorage(copies, activities.length, onComplete, switchView);
            }
        },
        
        /**
         * Create a copy of an activity for tomorrow
         */
        createActivityCopy: function(activity) {
            const self = this;
            
            // Generate new ID
            const newId = self.generateId();
            
            // Create deep copy
            const copy = {
                id: newId,
                task_id: newId, // Legacy compatibility
                text: activity.text || activity.title,
                title: activity.text || activity.title,
                timeframe: 'tomorrow',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_pinned: false, // Don't copy pin status
                order_index: activity.order_index || 0
            };
            
            // Copy additional properties
            const additionalProps = [
                'description', 'priority', 'tags', 'color', 'category',
                'estimated_duration', 'actual_duration', 'notes',
                'recurring', 'reminder_time', 'location'
            ];
            
            additionalProps.forEach(function(prop) {
                if (activity.hasOwnProperty(prop) && activity[prop] !== null && activity[prop] !== undefined) {
                    copy[prop] = activity[prop];
                }
            });
            
            // Handle attachments (copy references, not files)
            if (activity.attachments && Array.isArray(activity.attachments)) {
                copy.attachments = activity.attachments.map(function(attachment) {
                    return {
                        ...attachment,
                        copied_from_activity: activity.id || activity.task_id
                    };
                });
            }
            
            return copy;
        },
        
        /**
         * Generate unique ID for copied activities
         */
        generateId: function() {
            // Use timestamp + random for uniqueness
            const timestamp = Date.now();
            const random = Math.floor(Math.random() * 10000);
            return `copy_${timestamp}_${random}`;
        },
        
        /**
         * Save batch using SQLite
         */
        saveBatchSQLite: function(copies, totalCount, onComplete, switchView) {
            const self = this;
            
            // Use transaction for safety
            window.ActivitySQLite.transaction(function(tx) {
                let completed = 0;
                let hasError = false;
                
                copies.forEach(function(copy) {
                    if (hasError) return;
                    
                    const query = `
                        INSERT INTO activities (
                            id, text, timeframe, status, created_at, updated_at,
                            is_pinned, order_index, description, priority, tags,
                            color, category, estimated_duration, actual_duration,
                            notes, recurring, reminder_time, location
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    const values = [
                        copy.id, copy.text, copy.timeframe, copy.status,
                        copy.created_at, copy.updated_at, copy.is_pinned ? 1 : 0,
                        copy.order_index, copy.description, copy.priority,
                        copy.tags, copy.color, copy.category,
                        copy.estimated_duration, copy.actual_duration,
                        copy.notes, copy.recurring, copy.reminder_time, copy.location
                    ];
                    
                    tx.executeSql(query, values,
                        function(tx, result) {
                            completed++;
                            self.updateProgress(completed, totalCount);
                            
                            if (completed === copies.length) {
                                self.onCopyComplete(totalCount, onComplete, switchView);
                            }
                        },
                        function(tx, error) {
                            console.error('CopyToTomorrow: SQLite save failed for activity:', copy.id, error);
                            hasError = true;
                            self.onCopyError(error, onComplete);
                            return true; // Rollback transaction
                        }
                    );
                });
            });
        },
        
        /**
         * Save batch using localStorage
         */
        saveBatchLocalStorage: function(copies, totalCount, onComplete, switchView) {
            const self = this;
            
            try {
                // Get current activities
                const stored = localStorage.getItem('stackmap-activities') || '[]';
                let activities = JSON.parse(stored);
                
                // Create backup
                const backup = JSON.stringify(activities);
                
                // Add copies
                activities = activities.concat(copies);
                
                // Save back to storage
                localStorage.setItem('stackmap-activities', JSON.stringify(activities));
                
                // Also update legacy task storage
                const taskStored = localStorage.getItem('stackmap-tasks') || '[]';
                let tasks = JSON.parse(taskStored);
                
                // Convert copies to legacy format
                const legacyCopies = copies.map(function(copy) {
                    return {
                        task_id: copy.id,
                        title: copy.text,
                        text: copy.text,
                        timeframe: copy.timeframe,
                        status: copy.status,
                        created_at: copy.created_at,
                        updated_at: copy.updated_at,
                        is_pinned: copy.is_pinned,
                        order_index: copy.order_index
                    };
                });
                
                tasks = tasks.concat(legacyCopies);
                localStorage.setItem('stackmap-tasks', JSON.stringify(tasks));
                
                console.log(`CopyToTomorrow: Copied ${copies.length} activities to localStorage`);
                self.onCopyComplete(copies.length, onComplete, switchView);
                
            } catch (error) {
                console.error('CopyToTomorrow: localStorage save failed:', error);
                self.onCopyError(error, onComplete);
            }
        },
        
        /**
         * Show copy progress
         */
        showProgress: function(totalCount) {
            const progress = document.createElement('div');
            progress.id = 'copy-tomorrow-progress';
            progress.className = 'copy-tomorrow-progress';
            progress.innerHTML = `
                <div class="bulk-progress-content">
                    <div class="bulk-progress-icon">📋</div>
                    <div class="bulk-progress-text">Copying activities to tomorrow...</div>
                    <div class="bulk-progress-count">0 of ${totalCount}</div>
                </div>
            `;
            
            document.body.appendChild(progress);
        },
        
        /**
         * Update copy progress
         */
        updateProgress: function(completed, total) {
            const progress = document.getElementById('copy-tomorrow-progress');
            if (progress) {
                const countEl = progress.querySelector('.bulk-progress-count');
                if (countEl) {
                    countEl.textContent = `${completed} of ${total}`;
                }
            }
        },
        
        /**
         * Handle successful copy
         */
        onCopyComplete: function(count, onComplete, switchView) {
            const self = this;
            
            // Remove progress
            const progress = document.getElementById('copy-tomorrow-progress');
            if (progress) progress.remove();
            
            // Show success notification
            self.showNotification(`Successfully copied ${count} activities to tomorrow`, 'success');
            
            // Refresh the display
            if (window.ActivityDisplay && window.ActivityDisplay.render) {
                window.ActivityDisplay.render();
            } else if (window.TaskDisplay && window.TaskDisplay.render) {
                window.TaskDisplay.render();
            }
            
            // Trigger events
            document.dispatchEvent(new CustomEvent('activitiesChanged'));
            document.dispatchEvent(new CustomEvent('tasksChanged')); // Legacy compatibility
            
            // Switch to tomorrow view if requested
            if (switchView && window.TodayTomorrow && window.TodayTomorrow.setTimeframe) {
                setTimeout(function() {
                    window.TodayTomorrow.setTimeframe('tomorrow');
                }, 500); // Brief delay for UX
            }
            
            if (onComplete) onComplete();
        },
        
        /**
         * Handle copy error
         */
        onCopyError: function(error, onComplete) {
            const self = this;
            
            // Remove progress
            const progress = document.getElementById('copy-tomorrow-progress');
            if (progress) progress.remove();
            
            // Show error notification
            self.showNotification('Failed to copy activities. Please try again.', 'error');
            
            console.error('CopyToTomorrow: Copy failed:', error);
            
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
    window.CopyToTomorrow = CopyToTomorrow;
    
})();