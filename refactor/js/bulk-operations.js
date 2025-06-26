/**
 * Bulk Operations Manager - Handles bulk actions on selected activities
 * Part of Story #120: Bulk Operations
 */
class BulkOperationsManager {
    constructor(selectionManager) {
        this.selectionManager = selectionManager;
        this.undoStack = [];
        this.undoTimeout = null;
        this.maxUndoTime = 5000; // 5 seconds
        
        // Bind methods
        this.handleBulkAction = this.handleBulkAction.bind(this);
    }
    
    /**
     * Perform a bulk action on selected items
     */
    async performBulkAction(action, params = {}) {
        const selectedIds = this.selectionManager.getSelectedIds();
        if (selectedIds.length === 0) return;
        
        // Show progress indicator
        this.showProgress(`Performing ${action}...`);
        
        try {
            // Create undo snapshot
            const snapshot = await this.createUndoSnapshot(selectedIds);
            
            // Perform the action
            let result;
            switch (action) {
                case 'delete':
                    result = await this.bulkDelete(selectedIds);
                    break;
                case 'updateTime':
                    result = await this.bulkUpdateTime(selectedIds, params.time);
                    break;
                case 'assignType':
                    result = await this.bulkAssignType(selectedIds, params.typeId);
                    break;
                case 'togglePin':
                    result = await this.bulkTogglePin(selectedIds);
                    break;
                case 'toggleComplete':
                    result = await this.bulkToggleComplete(selectedIds);
                    break;
                default:
                    throw new Error(`Unknown bulk action: ${action}`);
            }
            
            // Store undo information
            if (result.success) {
                this.addToUndoStack({
                    action: action,
                    snapshot: snapshot,
                    timestamp: Date.now(),
                    description: result.description
                });
                
                // Clear selection after successful action
                this.selectionManager.clearSelection();
                
                // Show undo notification
                this.showUndoNotification(result.description);
            }
            
            this.hideProgress();
            return result;
            
        } catch (error) {
            this.hideProgress();
            this.showError(`Failed to ${action}: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Bulk delete activities
     */
    async bulkDelete(ids) {
        const db = window.Database || window.TaskDatabase;
        if (!db) throw new Error('Database not available');
        
        const count = ids.length;
        let deleted = 0;
        const failedDeletes = [];
        
        // Pre-validation: Check if any are system items or have special flags
        for (const id of ids) {
            try {
                const activity = await db.getActivity(id);
                if (activity && activity.systemLocked) {
                    failedDeletes.push({ id, reason: 'System locked' });
                }
            } catch (error) {
                // Activity might not exist, continue
            }
        }
        
        // Delete in batches for performance
        const batchSize = 50;
        for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            
            for (const id of batch) {
                // Skip if already marked as failed
                if (failedDeletes.some(f => f.id === id)) continue;
                
                try {
                    await db.deleteActivity(id);
                    deleted++;
                } catch (error) {
                    failedDeletes.push({ id, reason: error.message });
                }
            }
        }
        
        // Dispatch event to update UI
        document.dispatchEvent(new CustomEvent('activities-deleted', {
            detail: { ids: ids, count: deleted }
        }));
        
        // Show detailed error report if there were failures
        if (failedDeletes.length > 0) {
            this.showFailureReport('delete', failedDeletes);
        }
        
        return {
            success: deleted > 0,
            description: `Deleted ${deleted} of ${count} activities`,
            deleted: deleted,
            total: count,
            failures: failedDeletes
        };
    }
    
    /**
     * Bulk update time for activities
     */
    async bulkUpdateTime(ids, newTime) {
        const db = window.Database || window.TaskDatabase;
        if (!db) throw new Error('Database not available');
        
        const count = ids.length;
        let updated = 0;
        
        for (const id of ids) {
            try {
                const activity = await db.getActivity(id);
                if (activity) {
                    activity.time = newTime;
                    await db.updateActivity(activity);
                    updated++;
                }
            } catch (error) {
                // Continue with other updates
            }
        }
        
        // Dispatch event to update UI
        document.dispatchEvent(new CustomEvent('activities-updated', {
            detail: { ids: ids, field: 'time', value: newTime }
        }));
        
        return {
            success: true,
            description: `Updated time for ${updated} of ${count} activities`,
            updated: updated,
            total: count
        };
    }
    
    /**
     * Bulk assign activity type
     */
    async bulkAssignType(ids, typeId) {
        const db = window.Database || window.TaskDatabase;
        if (!db) throw new Error('Database not available');
        
        const count = ids.length;
        let updated = 0;
        
        // Get type info
        const activityTypes = window.ActivityTypes;
        const typeInfo = activityTypes ? activityTypes.getType(typeId) : null;
        const typeName = typeInfo ? typeInfo.name : typeId;
        
        for (const id of ids) {
            try {
                const activity = await db.getActivity(id);
                if (activity) {
                    activity.type = typeId;
                    if (typeInfo) {
                        activity.icon = typeInfo.icon;
                        activity.category = typeInfo.category;
                    }
                    await db.updateActivity(activity);
                    updated++;
                }
            } catch (error) {
                // Continue with other updates
            }
        }
        
        // Dispatch event to update UI
        document.dispatchEvent(new CustomEvent('activities-updated', {
            detail: { ids: ids, field: 'type', value: typeId }
        }));
        
        return {
            success: true,
            description: `Assigned type "${typeName}" to ${updated} of ${count} activities`,
            updated: updated,
            total: count
        };
    }
    
    /**
     * Bulk toggle pin status
     */
    async bulkTogglePin(ids) {
        const db = window.Database || window.TaskDatabase;
        if (!db) throw new Error('Database not available');
        
        const count = ids.length;
        let pinned = 0;
        let unpinned = 0;
        
        // First, determine the majority state
        let pinnedCount = 0;
        for (const id of ids) {
            const activity = await db.getActivity(id);
            if (activity && activity.pinned) pinnedCount++;
        }
        
        // If majority are pinned, unpin all. Otherwise, pin all.
        const shouldPin = pinnedCount < ids.length / 2;
        
        for (const id of ids) {
            try {
                const activity = await db.getActivity(id);
                if (activity) {
                    activity.pinned = shouldPin;
                    if (shouldPin) {
                        activity.pinType = 'daily'; // Default pin type
                    }
                    await db.updateActivity(activity);
                    
                    if (shouldPin) {
                        pinned++;
                    } else {
                        unpinned++;
                    }
                }
            } catch (error) {
                // Continue with other updates
            }
        }
        
        // Dispatch event to update UI
        document.dispatchEvent(new CustomEvent('activities-updated', {
            detail: { ids: ids, field: 'pinned', value: shouldPin }
        }));
        
        const action = shouldPin ? 'Pinned' : 'Unpinned';
        const actionCount = shouldPin ? pinned : unpinned;
        
        return {
            success: true,
            description: `${action} ${actionCount} of ${count} activities`,
            updated: actionCount,
            total: count
        };
    }
    
    /**
     * Bulk toggle completion status
     */
    async bulkToggleComplete(ids) {
        const db = window.Database || window.TaskDatabase;
        if (!db) throw new Error('Database not available');
        
        const count = ids.length;
        let completed = 0;
        let uncompleted = 0;
        
        // First, determine the majority state
        let completedCount = 0;
        for (const id of ids) {
            const activity = await db.getActivity(id);
            if (activity && activity.completed) completedCount++;
        }
        
        // If majority are completed, uncomplete all. Otherwise, complete all.
        const shouldComplete = completedCount < ids.length / 2;
        
        for (const id of ids) {
            try {
                const activity = await db.getActivity(id);
                if (activity) {
                    activity.completed = shouldComplete;
                    await db.updateActivity(activity);
                    
                    if (shouldComplete) {
                        completed++;
                    } else {
                        uncompleted++;
                    }
                }
            } catch (error) {
                // Continue with other updates
            }
        }
        
        // Dispatch event to update UI
        document.dispatchEvent(new CustomEvent('activities-updated', {
            detail: { ids: ids, field: 'completed', value: shouldComplete }
        }));
        
        const action = shouldComplete ? 'Completed' : 'Uncompleted';
        const actionCount = shouldComplete ? completed : uncompleted;
        
        return {
            success: true,
            description: `${action} ${actionCount} of ${count} activities`,
            updated: actionCount,
            total: count
        };
    }
    
    /**
     * Create snapshot for undo functionality
     */
    async createUndoSnapshot(ids) {
        const db = window.Database || window.TaskDatabase;
        if (!db) return null;
        
        const snapshot = {
            activities: [],
            timestamp: Date.now()
        };
        
        for (const id of ids) {
            try {
                const activity = await db.getActivity(id);
                if (activity) {
                    // Deep clone the activity
                    snapshot.activities.push(JSON.parse(JSON.stringify(activity)));
                }
            } catch (error) {
                // Continue with other activities
            }
        }
        
        return snapshot;
    }
    
    /**
     * Undo last bulk operation
     */
    async undo() {
        if (this.undoStack.length === 0) return;
        
        const operation = this.undoStack.pop();
        const db = window.Database || window.TaskDatabase;
        if (!db) return;
        
        this.showProgress('Undoing...');
        
        try {
            // Restore activities from snapshot
            for (const activity of operation.snapshot.activities) {
                if (operation.action === 'delete') {
                    // Re-create deleted activities
                    await db.createActivity(activity);
                } else {
                    // Restore original state
                    await db.updateActivity(activity);
                }
            }
            
            // Clear any active undo timeout
            if (this.undoTimeout) {
                clearTimeout(this.undoTimeout);
                this.undoTimeout = null;
            }
            
            // Dispatch event to update UI
            document.dispatchEvent(new CustomEvent('activities-restored', {
                detail: { count: operation.snapshot.activities.length }
            }));
            
            this.hideProgress();
            this.showNotification(`Undone: ${operation.description}`);
            
            return true;
        } catch (error) {
            this.hideProgress();
            this.showError('Failed to undo operation');
            return false;
        }
    }
    
    /**
     * Add operation to undo stack
     */
    addToUndoStack(operation) {
        this.undoStack.push(operation);
        
        // Keep only last 10 operations
        if (this.undoStack.length > 10) {
            this.undoStack.shift();
        }
        
        // Set timeout to clear this undo after 5 seconds
        if (this.undoTimeout) {
            clearTimeout(this.undoTimeout);
        }
        
        this.undoTimeout = setTimeout(() => {
            // Remove the operation from stack
            const index = this.undoStack.indexOf(operation);
            if (index > -1) {
                this.undoStack.splice(index, 1);
            }
            this.undoTimeout = null;
            this.hideUndoNotification();
        }, this.maxUndoTime);
    }
    
    /**
     * Show progress indicator
     */
    showProgress(message) {
        // Remove existing progress
        this.hideProgress();
        
        const progress = document.createElement('div');
        progress.className = 'bulk-progress';
        progress.innerHTML = `
            <div class="bulk-progress-spinner"></div>
            <div class="bulk-progress-message">${message}</div>
        `;
        document.body.appendChild(progress);
    }
    
    /**
     * Hide progress indicator
     */
    hideProgress() {
        const progress = document.querySelector('.bulk-progress');
        if (progress) {
            progress.remove();
        }
    }
    
    /**
     * Show undo notification
     */
    showUndoNotification(description) {
        // Remove existing notification
        this.hideUndoNotification();
        
        const notification = document.createElement('div');
        notification.className = 'bulk-undo-notification';
        notification.innerHTML = `
            <span>${description}</span>
            <button class="undo-button" onclick="window.BulkOperationsManager.instance.undo()">Undo</button>
        `;
        document.body.appendChild(notification);
        
        // Store reference for singleton access
        BulkOperationsManager.instance = this;
    }
    
    /**
     * Hide undo notification
     */
    hideUndoNotification() {
        const notification = document.querySelector('.bulk-undo-notification');
        if (notification) {
            notification.remove();
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        const error = document.createElement('div');
        error.className = 'bulk-error';
        error.textContent = message;
        document.body.appendChild(error);
        
        setTimeout(() => {
            error.remove();
        }, 3000);
    }
    
    /**
     * Show general notification
     */
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'bulk-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    /**
     * Show failure report
     */
    showFailureReport(action, failures) {
        const report = document.createElement('div');
        report.className = 'bulk-failure-report';
        report.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2a2a2a;
            border: 1px solid #d32f2f;
            border-radius: 12px;
            padding: 20px;
            max-width: 400px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 2000;
        `;
        
        const failureList = failures.map(f => `<li>${f.reason}</li>`).join('');
        
        report.innerHTML = `
            <h3 style="color: #f44336; margin: 0 0 16px 0;">Some operations failed</h3>
            <p style="color: #ccc; margin-bottom: 12px;">${failures.length} items could not be ${action}d:</p>
            <ul style="color: #999; margin: 0 0 16px 0; padding-left: 20px;">
                ${failureList}
            </ul>
            <button class="close-report-button" style="
                width: 100%;
                padding: 10px;
                background: #444;
                border: 1px solid #666;
                border-radius: 6px;
                color: #fff;
                cursor: pointer;
            ">Close</button>
        `;
        
        const closeButton = report.querySelector('.close-report-button');
        closeButton.onclick = () => report.remove();
        
        document.body.appendChild(report);
    }
    
    /**
     * Show enhanced confirmation dialog
     */
    async showConfirmation(action, count, details = {}) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'bulk-confirm-modal';
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 12px;
                padding: 24px;
                max-width: 400px;
                z-index: 2000;
                text-align: center;
            `;
            
            let message = '';
            let warningClass = '';
            
            switch (action) {
                case 'delete':
                    message = `Delete ${count} selected activities?`;
                    warningClass = 'destructive';
                    break;
                case 'updateTime':
                    message = `Change time for ${count} activities to ${details.time}?`;
                    break;
                case 'assignType':
                    message = `Assign type "${details.typeName}" to ${count} activities?`;
                    break;
                default:
                    message = `Perform ${action} on ${count} activities?`;
            }
            
            modal.innerHTML = `
                <h3 style="color: #fff; margin: 0 0 16px 0;">${message}</h3>
                <p style="color: #999; margin-bottom: 20px;">This action can be undone within 5 seconds.</p>
                <div style="display: flex; gap: 12px;">
                    <button class="confirm-button ${warningClass}" style="
                        flex: 1;
                        padding: 12px;
                        background: ${warningClass ? '#d32f2f' : '#4CAF50'};
                        border: none;
                        border-radius: 6px;
                        color: white;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 500;
                    ">Confirm</button>
                    <button class="cancel-button" style="
                        flex: 1;
                        padding: 12px;
                        background: #444;
                        border: 1px solid #666;
                        border-radius: 6px;
                        color: #ccc;
                        cursor: pointer;
                        font-size: 16px;
                    ">Cancel</button>
                </div>
            `;
            
            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1999;
            `;
            
            const confirmButton = modal.querySelector('.confirm-button');
            const cancelButton = modal.querySelector('.cancel-button');
            
            confirmButton.onclick = () => {
                backdrop.remove();
                modal.remove();
                resolve(true);
            };
            
            cancelButton.onclick = () => {
                backdrop.remove();
                modal.remove();
                resolve(false);
            };
            
            backdrop.onclick = () => {
                backdrop.remove();
                modal.remove();
                resolve(false);
            };
            
            document.body.appendChild(backdrop);
            document.body.appendChild(modal);
            
            // Focus confirm button for keyboard navigation
            confirmButton.focus();
        });
    }
    
    /**
     * Clean up
     */
    destroy() {
        if (this.undoTimeout) {
            clearTimeout(this.undoTimeout);
        }
        this.hideProgress();
        this.hideUndoNotification();
        this.undoStack = [];
    }
}

// Export for use in other modules
window.BulkOperationsManager = BulkOperationsManager;