/**
 * Task Reordering Module for StackMap
 * Implements arrow-based reordering for ADHD users
 * ES5 compatible - no const/let, arrow functions
 */

(function() {
    'use strict';
    
    const TaskReorder = {
        // Debounce state
        moveDebounceTimer: null,
        isMoving: false,
        
        /**
         * Move task up in the list
         */
        moveUp: function(task) {
            const self = this;
            
            // Debounce rapid clicks
            if (self.isMoving) return;
            
            if (!window.TaskDisplay) {
                console.error('TaskReorder: TaskDisplay not found');
                return;
            }
            
            try {
                const tasks = window.TaskDisplay.getUserTasks();
                
                // Handle empty or single task case
                if (!tasks || tasks.length <= 1) {
                    console.log('TaskReorder: Not enough tasks to reorder');
                    return;
                }
                
                let index = -1;
                
                // Find task index
                for (let i = 0; i < tasks.length; i++) {
                    if (tasks[i].id === task.id) {
                        index = i;
                        break;
                    }
                }
                
                if (index <= 0) {
                    if (index === -1) {
                        console.error('TaskReorder: Task not found in array');
                    }
                    return; // Already at top or not found
                }
                
                // Set moving flag
                self.isMoving = true;
                
                // Simple array swap - no sorting needed
                const temp = tasks[index - 1];
                tasks[index - 1] = tasks[index];
                tasks[index] = temp;
                
                // Update order fields
                this.updateOrderFields(tasks);
                
                // Save and update DOM with minimal re-render
                this.saveAndUpdateDOM(task.id, index - 1, 'up');
                
                // Reset moving flag after animation
                setTimeout(function() {
                    self.isMoving = false;
                }, 300);
                
            } catch (error) {
                console.error('TaskReorder: Error moving task up', error);
                self.isMoving = false;
            }
        },
        
        /**
         * Move task down in the list
         */
        moveDown: function(task) {
            const self = this;
            
            // Debounce rapid clicks
            if (self.isMoving) return;
            
            if (!window.TaskDisplay) {
                console.error('TaskReorder: TaskDisplay not found');
                return;
            }
            
            try {
                const tasks = window.TaskDisplay.getUserTasks();
                
                // Handle empty or single task case
                if (!tasks || tasks.length <= 1) {
                    console.log('TaskReorder: Not enough tasks to reorder');
                    return;
                }
                
                let index = -1;
                
                // Find task index
                for (let i = 0; i < tasks.length; i++) {
                    if (tasks[i].id === task.id) {
                        index = i;
                        break;
                    }
                }
                
                if (index < 0 || index >= tasks.length - 1) {
                    if (index === -1) {
                        console.error('TaskReorder: Task not found in array');
                    }
                    return; // Already at bottom or not found
                }
                
                // Set moving flag
                self.isMoving = true;
                
                // Simple array swap - no sorting needed
                const temp = tasks[index + 1];
                tasks[index + 1] = tasks[index];
                tasks[index] = temp;
                
                // Update order fields
                this.updateOrderFields(tasks);
                
                // Save and update DOM with minimal re-render
                this.saveAndUpdateDOM(task.id, index + 1, 'down');
                
                // Reset moving flag after animation
                setTimeout(function() {
                    self.isMoving = false;
                }, 300);
                
            } catch (error) {
                console.error('TaskReorder: Error moving task down', error);
                self.isMoving = false;
            }
        },
        
        /**
         * Update order fields based on position
         */
        updateOrderFields: function(tasks) {
            const baseTime = Date.now();
            
            // Update order based on position
            // Higher order values appear first
            for (let i = 0; i < tasks.length; i++) {
                tasks[i].order = baseTime - (i * 1000);
            }
        },
        
        /**
         * Save tasks and update DOM efficiently
         */
        saveAndUpdateDOM: function(taskId, newIndex, direction) {
            const self = this;
            
            try {
                // Save tasks with error handling
                window.TaskDisplay.saveTasks(function(success) {
                    if (!success) {
                        console.error('TaskReorder: Failed to save task order');
                        // Revert the change by re-rendering
                        window.TaskDisplay.render();
                        return;
                    }
                });
                
                // For better performance, swap DOM elements instead of full re-render
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (!taskElement) {
                    // Fallback to full render if element not found
                    window.TaskDisplay.render();
                    return;
                }
                
                // Add moving class for animation
                taskElement.classList.add(`task-moving-${direction}`);
                
                // Get all task elements
                const container = taskElement.parentNode;
                const allTasks = container.querySelectorAll('.task-item');
                
                // Perform DOM swap
                if (direction === 'up' && newIndex >= 0) {
                    container.insertBefore(taskElement, allTasks[newIndex]);
                } else if (direction === 'down' && newIndex < allTasks.length) {
                    if (allTasks[newIndex + 1]) {
                        container.insertBefore(taskElement, allTasks[newIndex + 1]);
                    } else {
                        container.appendChild(taskElement);
                    }
                }
                
                // Remove animation class after transition
                setTimeout(function() {
                    taskElement.classList.remove(`task-moving-${direction}`);
                    // Announce to screen readers
                    self.announceMove(direction);
                }, 200);
                
                // Scroll to keep moved task in view
                self.scrollToTask(taskId);
                
            } catch (error) {
                console.error('TaskReorder: DOM update failed', error);
                // Fallback to full re-render
                window.TaskDisplay.render();
            }
        },
        
        /**
         * Announce move to screen readers
         */
        announceMove: function(direction) {
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'sr-only';
            announcement.textContent = `Task moved ${direction}`;
            
            document.body.appendChild(announcement);
            
            setTimeout(function() {
                if (announcement.parentNode) {
                    announcement.parentNode.removeChild(announcement);
                }
            }, 1000);
        },
        
        /**
         * Scroll to keep task in view after move
         */
        scrollToTask: function(taskId) {
            setTimeout(function() {
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskElement) {
                    // Check if task is out of viewport
                    const rect = taskElement.getBoundingClientRect();
                    const viewHeight = window.innerHeight || document.documentElement.clientHeight;
                    
                    if (rect.top < 100 || rect.bottom > viewHeight - 100) {
                        taskElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }
                }
            }, 100);
        },
        
        /**
         * Check if task can move up
         */
        canMoveUp: function(task) {
            const tasks = window.TaskDisplay.getUserTasks();
            let index = -1;
            
            for (let i = 0; i < tasks.length; i++) {
                if (tasks[i].id === task.id) {
                    index = i;
                    break;
                }
            }
            
            return index > 0;
        },
        
        /**
         * Check if task can move down
         */
        canMoveDown: function(task) {
            const tasks = window.TaskDisplay.getUserTasks();
            let index = -1;
            
            for (let i = 0; i < tasks.length; i++) {
                if (tasks[i].id === task.id) {
                    index = i;
                    break;
                }
            }
            
            return index >= 0 && index < tasks.length - 1;
        },
        
        /**
         * Handle keyboard navigation for reordering
         */
        handleKeyboard: function(e, task) {
            if (!window.EditMode || !window.EditMode.isActive()) {
                return;
            }
            
            // Alt + Up Arrow
            if (e.altKey && e.key === 'ArrowUp') {
                e.preventDefault();
                this.moveUp(task);
            }
            // Alt + Down Arrow
            else if (e.altKey && e.key === 'ArrowDown') {
                e.preventDefault();
                this.moveDown(task);
            }
        }
    };
    
    // Export to global scope
    window.TaskReorder = TaskReorder;
    
})();