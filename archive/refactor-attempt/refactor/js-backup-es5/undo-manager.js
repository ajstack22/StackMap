/**
 * Undo Manager for StackMap
 * Implements a forgiving undo system with 30-second golden window
 * Designed for ADHD users with RSD (Rejection Sensitive Dysphoria)
 */

class UndoManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistory = 50;
        this.batchingWindow = 500; // ms to batch related operations
        this.goldenWindow = 30000; // 30 seconds
        this.isInitialized = false;
        
        // Batching state
        this.batchingState = {
            lastCommand: null,
            batchTimer: null
        };
        
        // Safe mode configuration
        this.safeMode = {
            enabled: false,
            timeoutMultiplier: 3.3
        };
        
        // Bind methods that will be used as callbacks
        this.handleKeyboardShortcut = this.handleKeyboardShortcut.bind(this);
        this.handleMemoryPressure = this.handleMemoryPressure.bind(this);
    }
    
    /**
     * Command class for the command pattern
     */
    static Command = class {
        constructor(options) {
            this.id = `cmd_${Date.now()}_${Math.random()}`;
            this.timestamp = Date.now();
            this.type = options.type;
            this.description = options.description; // RSD-safe language
            this.data = options.data;
            this.execute = options.execute;
            this.undo = options.undo;
            this.preview = options.preview;
            this.batchable = options.batchable || false;
            this.userId = 'default'; // No UserManager dependency
        }
    };
    
    /**
     * Execute a command with error handling
     */
    async execute(command) {
        // Create backup of current state for rollback
        const stateBackup = {
            history: [...this.history],
            currentIndex: this.currentIndex
        };
        
        try {
            // Check storage quota before execution
            await this.checkStorageQuota();
            
            // Check if we should batch with previous command
            if (this.shouldBatch(command)) {
                this.batchWithPrevious(command);
            } else {
                // Add to history FIRST (atomic operation)
                this.addToHistory(command);
                
                try {
                    // Execute the command (support both sync and async)
                    await Promise.resolve(command.execute());
                    
                    // Show undo UI after successful execution
                    if (window.UndoUI) {
                        window.UndoUI.showUndoToast(command);
                    }
                    
                    // Announce to screen readers
                    this.announce(`Action completed: ${command.description}`);
                } catch (execError) {
                    // Rollback history on execution failure
                    this.history = stateBackup.history;
                    this.currentIndex = stateBackup.currentIndex;
                    throw execError;
                }
            }
            
            // Save to session (non-blocking)
            this.saveToStorage().catch(err => 
                console.warn('[UndoManager] Storage save failed:', err)
            );
            
            // Track performance if available
            if (window.StackMapPerformanceMonitor) {
                window.StackMapPerformanceMonitor.trackInteraction(
                    `command-${command.type}`, 
                    command.timestamp
                );
            }
            
            return true;
        } catch (error) {
            console.error('[UndoManager] Command execution failed:', error);
            
            // RSD-safe error message
            this.showErrorToast('Let me try a different way...');
            
            // Ensure we're in a consistent state
            this.history = stateBackup.history;
            this.currentIndex = stateBackup.currentIndex;
            
            return false;
        }
    }
    
    /**
     * Add command to history with pruning
     */
    addToHistory(command) {
        // Remove any commands after current index (for redo support)
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }
        
        // Add new command
        this.history.push(command);
        this.currentIndex++;
        
        // Update batching state
        this.batchingState.lastCommand = command;
        
        // Prune if exceeding max
        if (this.history.length > this.maxHistory) {
            this.pruneHistory();
        }
    }
    
    /**
     * Undo the last command
     */
    async undo() {
        if (this.currentIndex < 0) {
            this.announce('Nothing to undo');
            return false;
        }
        
        try {
            const command = this.history[this.currentIndex];
            
            // Show preview if outside golden window
            const isGoldenWindow = (Date.now() - command.timestamp) < this.goldenWindow;
            
            if (!isGoldenWindow && window.UndoPreview) {
                return new Promise((resolve) => {
                    window.UndoPreview.show(
                        command, 
                        async () => {
                            await this.executeUndo(command);
                            resolve(true);
                        },
                        () => resolve(false)
                    );
                });
            } else {
                await this.executeUndo(command);
                return true;
            }
        } catch (error) {
            console.error('[UndoManager] Undo failed:', error);
            this.showErrorToast('I couldn\'t undo that action');
            return false;
        }
    }
    
    /**
     * Execute the actual undo
     */
    async executeUndo(command) {
        try {
            await Promise.resolve(command.undo());
            this.currentIndex--;
            
            // Update UI
            this.announce(`Undone: ${command.description}`);
            
            // Save state
            await this.saveToStorage();
        } catch (error) {
            console.error('[UndoManager] Undo execution failed:', error);
            throw error;
        }
    }
    
    /**
     * Undo a specific command
     */
    async undoSpecific(command) {
        const index = this.history.indexOf(command);
        
        if (index === -1) {
            return false;
        }
        
        // Undo all commands from current to target
        while (this.currentIndex >= index) {
            await this.undo();
        }
        
        return true;
    }
    
    /**
     * Check if command should batch with previous
     */
    shouldBatch(command) {
        const lastCmd = this.batchingState.lastCommand;
        
        if (!lastCmd || !command.batchable || !lastCmd.batchable) {
            return false;
        }
        
        // Same type and within batching window
        const timeDiff = Date.now() - lastCmd.timestamp;
        return lastCmd.type === command.type && 
               timeDiff < this.batchingWindow &&
               lastCmd.data.taskId === command.data.taskId;
    }
    
    /**
     * Batch with previous command
     */
    batchWithPrevious(command) {
        const lastCmd = this.history[this.currentIndex];
        
        // Update the batched command
        if (command.type === 'edit-task') {
            // Keep original oldText, update newText
            lastCmd.data.newText = command.data.newText;
            lastCmd.timestamp = Date.now(); // Update timestamp
            
            // Execute the new state
            command.execute();
            
            // Reset batching timer
            clearTimeout(this.batchingState.batchTimer);
            this.batchingState.batchTimer = setTimeout(() => {
                this.batchingState.lastCommand = null;
            }, this.batchingWindow);
        }
    }
    
    /**
     * Check storage quota and prune if needed
     */
    async checkStorageQuota() {
        // Modern browsers support storage.estimate()
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const percentUsed = (estimate.usage / estimate.quota) * 100;
                console.log(`Storage used: ${percentUsed.toFixed(2)}%`);
                
                // Warn if approaching quota
                if (percentUsed > 80) {
                    this.pruneHistoryAggressively();
                }
                
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percentUsed: percentUsed
                };
            } catch (error) {
                console.error('Storage estimate failed:', error);
            }
        }
        
        // Fallback: estimate based on sessionStorage
        return this.checkSessionStorageQuota();
    }
    
    /**
     * Fallback storage quota check
     */
    checkSessionStorageQuota() {
        try {
            let totalSize = 0;
            for (const key in sessionStorage) {
                if (sessionStorage.hasOwnProperty(key)) {
                    totalSize += sessionStorage[key].length + key.length;
                }
            }
            
            // sessionStorage typically has 5-10MB limit
            const estimatedQuota = 5 * 1024 * 1024; // 5MB
            const percentUsed = (totalSize / estimatedQuota) * 100;
            
            if (percentUsed > 80) {
                this.pruneHistoryAggressively();
            }
            
            return {
                usage: totalSize,
                quota: estimatedQuota,
                percentUsed: percentUsed
            };
        } catch (e) {
            console.error('Storage quota check failed:', e);
            return null;
        }
    }
    
    /**
     * Prune old history to maintain memory limits
     */
    pruneHistory() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        // Remove commands older than 1 hour
        const oldLength = this.history.length;
        this.history = this.history.filter((cmd, index) => {
            const age = now - cmd.timestamp;
            if (age > oneHour && index < this.currentIndex - 5) {
                // Keep at least 5 recent commands
                return false;
            }
            return true;
        });
        
        // Adjust current index
        const removed = oldLength - this.history.length;
        if (removed > 0) {
            this.currentIndex = Math.max(0, this.currentIndex - removed);
            console.log(`Pruned ${removed} old commands`);
        }
    }
    
    /**
     * Aggressive pruning when approaching quota
     */
    pruneHistoryAggressively() {
        // Keep only last 10 commands
        if (this.history.length > 10) {
            const keepFrom = this.history.length - 10;
            this.history = this.history.slice(keepFrom);
            this.currentIndex = Math.min(this.currentIndex, 9);
            console.log('Aggressively pruned history to 10 commands');
        }
        
        // Clear session storage
        try {
            sessionStorage.removeItem('stackmap_undo_history');
        } catch (e) {
            console.error('Failed to clear storage:', e);
        }
    }
    
    /**
     * Show RSD-safe error toast
     */
    showErrorToast(message) {
        if (window.StackMapApp?.showToast) {
            window.StackMapApp.showToast({
                type: 'info',
                message: message,
                duration: 3000
            });
        } else {
            // Fallback
            console.log(message);
        }
    }
    
    /**
     * Announce to screen readers
     */
    announce(message) {
        let announcer = document.getElementById('undo-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'undo-announcer';
            announcer.className = 'sr-only';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.setAttribute('role', 'status');
            document.body.appendChild(announcer);
        }
        
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 100);
    }
    
    /**
     * Initialize undo manager
     */
    async init() {
        if (this.isInitialized) {
            console.warn('[UndoManager] Already initialized');
            return;
        }
        
        // Check safe mode
        if (window.StackMapSafeMode) {
            this.safeMode.enabled = true;
            this.batchingWindow = Math.round(this.batchingWindow * this.safeMode.timeoutMultiplier);
            console.log('[UndoManager] Safe mode enabled - timeouts extended');
        }
        
        // Restore from session if available
        await this.restoreFromStorage();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Listen for memory pressure events
        if ('memory' in navigator) {
            navigator.memory.addEventListener?.('pressure', this.handleMemoryPressure);
        }
        
        // Initialize UI
        if (window.UndoUI) {
            window.UndoUI.init();
        }
        
        this.isInitialized = true;
        console.log('[UndoManager] Initialized');
    }
    
    /**
     * Clean up and destroy
     */
    destroy() {
        // Clear timers
        if (this.batchingState.batchTimer) {
            clearTimeout(this.batchingState.batchTimer);
            this.batchingState.batchTimer = null;
        }
        
        // Clear history
        this.history = [];
        this.currentIndex = -1;
        this.batchingState.lastCommand = null;
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyboardShortcut);
        if ('memory' in navigator) {
            navigator.memory.removeEventListener?.('pressure', this.handleMemoryPressure);
        }
        
        // Destroy UI
        if (window.UndoUI?.destroy) {
            window.UndoUI.destroy();
        }
        
        this.isInitialized = false;
        console.log('[UndoManager] Destroyed');
    }
    
    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', this.handleKeyboardShortcut);
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcut(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (this.canUndo()) {
                this.undo();
            }
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            if (this.canRedo()) {
                this.redo();
            }
        }
    }
    
    /**
     * Handle memory pressure events
     */
    handleMemoryPressure(event) {
        console.log('[UndoManager] Memory pressure - pruning history');
        this.pruneHistoryAggressively();
    }
    
    /**
     * Check if can undo
     */
    canUndo() {
        return this.currentIndex >= 0;
    }
    
    /**
     * Check if can redo (placeholder for future implementation)
     */
    canRedo() {
        return false; // Not implemented yet
    }
    
    /**
     * Placeholder for redo functionality
     */
    async redo() {
        // TODO: Implement redo functionality
        console.log('[UndoManager] Redo not yet implemented');
    }
    
    /**
     * Get current state info
     */
    getState() {
        return {
            historyLength: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }
    
    /**
     * Save to storage with error handling
     */
    async saveToStorage() {
        try {
            // Don't save if storage is disabled
            if (!window.sessionStorage) {
                return;
            }
            
            // Create serializable history (limit to last 20 for storage)
            const serializableHistory = this.history.slice(-20).map(cmd => ({
                type: cmd.type,
                description: cmd.description,
                data: cmd.data,
                timestamp: cmd.timestamp
            }));
            
            const data = {
                history: serializableHistory,
                timestamp: Date.now()
            };
            
            // Check size before saving
            const serialized = JSON.stringify(data);
            if (serialized.length > 100000) { // 100KB limit
                console.warn('[UndoManager] History too large for storage');
                return;
            }
            
            sessionStorage.setItem('stackmap_undo_history', serialized);
        } catch (e) {
            // Handle quota exceeded or other storage errors
            if (e.name === 'QuotaExceededError') {
                console.warn('[UndoManager] Storage quota exceeded');
                // Clear old data and try again
                try {
                    sessionStorage.removeItem('stackmap_undo_history');
                    this.pruneHistoryAggressively();
                } catch (clearError) {
                    console.error('[UndoManager] Cannot clear storage:', clearError);
                }
            } else {
                console.error('[UndoManager] Storage error:', e);
            }
        }
    }
    
    /**
     * Restore from storage
     */
    async restoreFromStorage() {
        try {
            const stored = sessionStorage.getItem('stackmap_undo_history');
            if (!stored) return;
            
            const data = JSON.parse(stored);
            
            // Only restore if less than 5 minutes old
            const age = Date.now() - data.timestamp;
            if (age > 5 * 60 * 1000) {
                sessionStorage.removeItem('stackmap_undo_history');
                return;
            }
            
            // Note: We'd need to reconstruct Command objects here
            // For now, just log that we found history
            console.log(`[UndoManager] Found ${data.history.length} commands in storage`);
            
        } catch (e) {
            console.error('[UndoManager] Failed to restore from storage:', e);
            // Clear corrupted data
            try {
                sessionStorage.removeItem('stackmap_undo_history');
            } catch (clearError) {
                // Ignore
            }
        }
    }
}

// Export as singleton instance
window.UndoManager = new UndoManager();
// Also export the Command class for creating commands
window.UndoCommand = UndoManager.Command;