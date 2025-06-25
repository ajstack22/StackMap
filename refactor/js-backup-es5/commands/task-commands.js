/**
 * Task Commands for StackMap Undo System
 * Implements command pattern for all task operations
 * Uses RSD-safe language throughout
 */

class TaskCommands {
    /**
     * Create add task command
     */
    static createAddCommand(taskData) {
        return new window.UndoCommand({
            type: 'add-task',
            description: `Added "${taskData.text || taskData.title || 'new task'}"`,
            data: { ...taskData }, // Clone to prevent mutations
            async execute() {
                // Store the generated ID for undo
                if (window.TaskDisplay?.addTaskDirect) {
                    this.data.generatedId = await window.TaskDisplay.addTaskDirect(this.data);
                } else if (window.TaskSQLite?.createTask) {
                    // Use TaskSQLite if available
                    const task = await new Promise((resolve, reject) => {
                        window.TaskSQLite.createTask(this.data, (err, task) => {
                            if (err) reject(err);
                            else resolve(task);
                        });
                    });
                    this.data.generatedId = task.id;
                }
            },
            async undo() {
                if (!this.data.generatedId) return;
                
                if (window.TaskDisplay?.removeTaskDirect) {
                    await window.TaskDisplay.removeTaskDirect(this.data.generatedId);
                } else if (window.TaskSQLite?.deleteTask) {
                    await new Promise((resolve, reject) => {
                        window.TaskSQLite.deleteTask(this.data.generatedId, err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            },
            preview() {
                return {
                    title: 'Remove this task?',
                    description: `"${this.data.text || this.data.title}" will be removed`,
                    icon: '↩️'
                };
            }
        });
    }
    
    /**
     * Create complete task command
     */
    static createCompleteCommand(taskId, wasCompleted) {
        // Get task data synchronously if possible
        const task = window.TaskDisplay?.getTaskById?.(taskId) || null;
        
        return new window.UndoCommand({
            type: 'complete-task',
            description: wasCompleted ? 
                `Unmarked "${task?.text || task?.title || 'task'}"` : 
                `Completed "${task?.text || task?.title || 'task'}"`,
            data: { 
                taskId, 
                wasCompleted,
                taskData: task
            },
            async execute() {
                if (window.TaskDisplay?.toggleTaskDirect) {
                    await window.TaskDisplay.toggleTaskDirect(this.data.taskId);
                } else if (window.TaskSQLite?.updateTask) {
                    await new Promise((resolve, reject) => {
                        window.TaskSQLite.updateTask(this.data.taskId, {
                            completed: !this.data.wasCompleted
                        }, err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            },
            async undo() {
                if (window.TaskDisplay?.toggleTaskDirect) {
                    await window.TaskDisplay.toggleTaskDirect(this.data.taskId);
                } else if (window.TaskSQLite?.updateTask) {
                    await new Promise((resolve, reject) => {
                        window.TaskSQLite.updateTask(this.data.taskId, {
                            completed: this.data.wasCompleted
                        }, err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            },
            preview() {
                const taskName = this.data.taskData?.text || this.data.taskData?.title || 'task';
                return {
                    title: this.data.wasCompleted ? 'Mark as done again?' : 'Mark as not done?',
                    description: `"${taskName}"`,
                    icon: this.data.wasCompleted ? '✓' : '○'
                };
            }
        });
    }
    
    /**
     * Create edit task command with batching
     */
    static createEditCommand(taskId, oldText, newText) {
        return new window.UndoCommand({
            type: 'edit-task',
            description: 'Edited task',
            data: { 
                taskId, 
                oldText, 
                newText 
            },
            batchable: true, // Allow batching for rapid edits
            async execute() {
                if (window.TaskDisplay?.updateTaskTextDirect) {
                    await window.TaskDisplay.updateTaskTextDirect(this.data.taskId, this.data.newText);
                } else if (window.TaskSQLite?.updateTask) {
                    await new Promise((resolve, reject) => {
                        window.TaskSQLite.updateTask(this.data.taskId, {
                            title: this.data.newText
                        }, err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            },
            async undo() {
                if (window.TaskDisplay?.updateTaskTextDirect) {
                    await window.TaskDisplay.updateTaskTextDirect(this.data.taskId, this.data.oldText);
                } else if (window.TaskSQLite?.updateTask) {
                    await new Promise((resolve, reject) => {
                        window.TaskSQLite.updateTask(this.data.taskId, {
                            title: this.data.oldText
                        }, err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            },
            preview() {
                return {
                    title: 'Restore original text?',
                    description: `"${this.data.oldText}"`,
                    icon: '✏️'
                };
            }
        });
    }
    
    /**
     * Create delete task command
     */
    static createDeleteCommand(taskId) {
        // Get and store full task data for restoration
        const task = window.TaskDisplay?.getTaskById?.(taskId) || null;
        
        return new window.UndoCommand({
            type: 'delete-task',
            description: `Removed "${task?.text || task?.title || 'task'}"`,
            data: { 
                taskId,
                taskData: task ? { ...task } : null // Clone task data
            },
            async execute() {
                if (window.TaskDisplay?.deleteTaskDirect) {
                    await window.TaskDisplay.deleteTaskDirect(this.data.taskId);
                } else if (window.TaskSQLite?.deleteTask) {
                    await new Promise((resolve, reject) => {
                        window.TaskSQLite.deleteTask(this.data.taskId, err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            },
            async undo() {
                if (!this.data.taskData) return;
                
                if (window.TaskDisplay?.restoreTaskDirect) {
                    await window.TaskDisplay.restoreTaskDirect(this.data.taskData);
                } else if (window.TaskSQLite?.createTask) {
                    // Restore with original data
                    await new Promise((resolve, reject) => {
                        window.TaskSQLite.createTask(this.data.taskData, (err, task) => {
                            if (err) reject(err);
                            else resolve(task);
                        });
                    });
                }
            },
            preview() {
                const taskName = this.data.taskData?.text || this.data.taskData?.title || 'task';
                return {
                    title: 'Restore this task?',
                    description: `"${taskName}" will come back`,
                    icon: '♻️'
                };
            }
        });
    }
    
    /**
     * Create move/reorder task command
     */
    static createMoveCommand(taskId, oldIndex, newIndex) {
        return new window.UndoCommand({
            type: 'move-task',
            description: 'Moved task',
            data: { 
                taskId,
                oldIndex,
                newIndex
            },
            async execute() {
                if (window.TaskDisplay?.moveTaskDirect) {
                    await window.TaskDisplay.moveTaskDirect(this.data.taskId, this.data.newIndex);
                }
            },
            async undo() {
                if (window.TaskDisplay?.moveTaskDirect) {
                    await window.TaskDisplay.moveTaskDirect(this.data.taskId, this.data.oldIndex);
                }
            },
            preview() {
                return {
                    title: 'Move task back?',
                    description: 'Task will return to its original position',
                    icon: '🔄'
                };
            }
        });
    }
    
    /**
     * Create update task command (for any property)
     */
    static createUpdateCommand(taskId, property, oldValue, newValue) {
        const friendlyNames = {
            'priority': 'priority',
            'dueDate': 'due date',
            'notes': 'notes',
            'tags': 'tags',
            'attachments': 'attachments'
        };
        
        const propertyName = friendlyNames[property] || property;
        
        return new window.UndoCommand({
            type: `update-task-${property}`,
            description: `Changed ${propertyName}`,
            data: {
                taskId,
                property,
                oldValue,
                newValue
            },
            async execute() {
                const update = { [this.data.property]: this.data.newValue };
                
                if (window.TaskDisplay?.updateTaskDirect) {
                    await window.TaskDisplay.updateTaskDirect(this.data.taskId, update);
                } else if (window.TaskSQLite?.updateTask) {
                    await new Promise((resolve, reject) => {
                        window.TaskSQLite.updateTask(this.data.taskId, update, err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            },
            async undo() {
                const update = { [this.data.property]: this.data.oldValue };
                
                if (window.TaskDisplay?.updateTaskDirect) {
                    await window.TaskDisplay.updateTaskDirect(this.data.taskId, update);
                } else if (window.TaskSQLite?.updateTask) {
                    await new Promise((resolve, reject) => {
                        window.TaskSQLite.updateTask(this.data.taskId, update, err => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });
                }
            },
            preview() {
                return {
                    title: `Restore previous ${propertyName}?`,
                    description: `Will change back to: ${this.data.oldValue || 'none'}`,
                    icon: '↩️'
                };
            }
        });
    }
    
    /**
     * Create bulk operation command
     */
    static createBulkCommand(type, taskIds, description) {
        // Capture current state of all tasks
        const tasksState = taskIds.map(id => ({
            id,
            task: window.TaskDisplay?.getTaskById?.(id) || null
        }));
        
        return new window.UndoCommand({
            type: `bulk-${type}`,
            description: description || `${type} ${taskIds.length} tasks`,
            data: {
                type,
                taskIds,
                tasksState
            },
            async execute() {
                // Execute bulk operation
                for (const taskId of this.data.taskIds) {
                    if (type === 'complete') {
                        if (window.TaskDisplay?.completeTaskDirect) {
                            await window.TaskDisplay.completeTaskDirect(taskId);
                        }
                    } else if (type === 'delete') {
                        if (window.TaskDisplay?.deleteTaskDirect) {
                            await window.TaskDisplay.deleteTaskDirect(taskId);
                        }
                    }
                }
            },
            async undo() {
                // Restore original state
                for (const { id, task } of this.data.tasksState) {
                    if (!task) continue;
                    
                    if (type === 'complete' && window.TaskDisplay?.setTaskCompleteDirect) {
                        await window.TaskDisplay.setTaskCompleteDirect(id, task.completed);
                    } else if (type === 'delete' && window.TaskDisplay?.restoreTaskDirect) {
                        await window.TaskDisplay.restoreTaskDirect(task);
                    }
                }
            },
            preview() {
                return {
                    title: `Undo ${type} for ${this.data.taskIds.length} tasks?`,
                    description: 'All selected tasks will be restored',
                    icon: type === 'complete' ? '↩️' : '🗑️'
                };
            }
        });
    }
}

// Export to global scope
window.TaskCommands = TaskCommands;