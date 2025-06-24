/**
 * Undo UI Component
 * Visual interface for the ADHD-friendly undo system
 * Features 30-second golden window with calming visuals
 */

class UndoUI {
    constructor() {
        this.container = null;
        this.currentToast = null;
        this.toastQueue = [];
        this.historyPanel = null;
    }
    
    /**
     * Initialize the undo UI
     */
    init() {
        console.log('[UndoUI] Initializing visual undo interface');
        
        // Check if already initialized
        if (this.container) {
            console.warn('[UndoUI] Already initialized');
            return;
        }
        
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'undo-container';
        this.container.className = 'undo-container';
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Undo notifications');
        this.container.setAttribute('role', 'region');
        document.body.appendChild(this.container);
        
        // Create screen reader announcer
        const announcer = document.createElement('div');
        announcer.id = 'undo-announcer';
        announcer.className = 'sr-only';
        announcer.setAttribute('aria-live', 'assertive');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.setAttribute('role', 'status');
        announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(announcer);
        
        // Add history button to UI
        this.addHistoryButton();
    }
        
    /**
     * Show undo toast notification
     */
    showUndoToast(command) {
        const isGoldenWindow = (Date.now() - command.timestamp) < window.UndoManager.goldenWindow;
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `undo-toast${isGoldenWindow ? ' golden-window' : ''}`;
        toast.setAttribute('role', 'alert');
        
        // Message (RSD-safe language)
        const message = document.createElement('div');
        message.className = 'undo-message';
        message.textContent = command.description;
        toast.appendChild(message);
        
        // Undo button
        const undoBtn = document.createElement('button');
        undoBtn.className = 'undo-button';
        undoBtn.textContent = 'Undo';
        undoBtn.setAttribute('aria-label', `Undo: ${command.description}`);
        undoBtn.onclick = async () => {
            await window.UndoManager.undoSpecific(command);
            this.hideToast(toast);
            
            // Haptic feedback
            if (window.StackMapHapticFeedback) {
                window.StackMapHapticFeedback.trigger('buttonPress');
            }
        };
        toast.appendChild(undoBtn);
            
        // Progress bar for golden window
        if (isGoldenWindow) {
            const progressBar = document.createElement('div');
            progressBar.className = 'undo-progress-bar';
            
            const progress = document.createElement('div');
            progress.className = 'undo-progress';
            progressBar.appendChild(progress);
            
            toast.appendChild(progressBar);
            
            // Start progress animation after a short delay
            setTimeout(() => {
                progress.style.width = '0%';
            }, 100);
        }
        
        // Remove previous toast if exists
        if (this.currentToast) {
            this.hideToast(this.currentToast);
        }
        
        // Show new toast
        this.container.appendChild(toast);
        this.currentToast = toast;
        
        // Auto-hide after golden window
        const hideTimeout = setTimeout(() => {
            if (this.currentToast === toast) {
                this.hideToast(toast);
            }
        }, window.UndoManager.goldenWindow);
        
        // Store timeout reference for cleanup
        toast.hideTimeout = hideTimeout;
        
        // Focus management for accessibility
        undoBtn.focus();
    }
        
    /**
     * Hide toast with animation
     */
    hideToast(toast) {
        if (toast.hideTimeout) {
            clearTimeout(toast.hideTimeout);
        }
        
        toast.classList.add('hiding');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            if (this.currentToast === toast) {
                this.currentToast = null;
            }
        }, 300); // Match CSS transition
    }
        
    /**
     * Add history button to main UI
     */
    addHistoryButton() {
        const button = document.createElement('button');
        button.id = 'undo-history-button';
        button.className = 'undo-history-button';
        button.innerHTML = '<span class="undo-history-icon">↶</span>' +
            '<span class="undo-history-label">History</span>';
        button.setAttribute('aria-label', 'View undo history');
        button.setAttribute('aria-expanded', 'false');
        button.onclick = () => {
            if (window.UndoHistoryView) {
                window.UndoHistoryView.toggle();
                // Update aria-expanded
                button.setAttribute('aria-expanded', window.UndoHistoryView.isOpen ? 'true' : 'false');
            }
            
            // Haptic feedback
            if (window.StackMapHapticFeedback) {
                window.StackMapHapticFeedback.trigger('buttonPress');
            }
        };
        
        document.body.appendChild(button);
    }
        
    /**
     * Clean up and destroy UI
     */
    destroy() {
        // Hide and clean up current toast
        if (this.currentToast) {
            this.hideToast(this.currentToast);
        }
        
        // Clear toast queue
        this.toastQueue = [];
        
        // Remove container
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // Remove history button
        const historyButton = document.getElementById('undo-history-button');
        if (historyButton && historyButton.parentNode) {
            historyButton.parentNode.removeChild(historyButton);
        }
        
        // Close history panel if open
        if (window.UndoHistoryView && window.UndoHistoryView.isOpen) {
            window.UndoHistoryView.hide();
        }
        
        // Remove announcer
        const announcer = document.getElementById('undo-announcer');
        if (announcer && announcer.parentNode) {
            announcer.parentNode.removeChild(announcer);
        }
        
        // Reset state
        this.container = null;
        this.currentToast = null;
        this.historyPanel = null;
        
        console.log('[UndoUI] Destroyed');
    }
}
    
/**
 * Undo History View - Progressive disclosure
 */
class UndoHistoryView {
    constructor() {
        this.isOpen = false;
        this.panel = null;
    }
    
    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }
        
    show() {
        this.isOpen = true;
        
        // Create panel
        const panel = document.createElement('div');
        panel.className = 'undo-history-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Undo history');
        
        // Header
        const header = document.createElement('div');
        header.className = 'undo-history-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Recent Changes';
        header.appendChild(title);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'undo-history-close';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close history');
        closeBtn.onclick = () => this.hide();
        header.appendChild(closeBtn);
        
        panel.appendChild(header);
        
        // History list
        const list = document.createElement('div');
        list.className = 'undo-history-list';
        
        // Get recent commands
        const history = window.UndoManager.history;
        const currentIndex = window.UndoManager.currentIndex;
        const recentCommands = history.slice(Math.max(0, currentIndex - 9), currentIndex + 1).reverse();
        
        if (recentCommands.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'undo-history-empty';
            empty.textContent = 'No recent changes';
            list.appendChild(empty);
        } else {
            recentCommands.forEach((cmd, index) => {
                const item = this.createHistoryItem(cmd, index, currentIndex);
                list.appendChild(item);
            });
        }
        
        panel.appendChild(list);
        
        // Add to body
        document.body.appendChild(panel);
        this.panel = panel;
        
        // Animate in
        requestAnimationFrame(() => {
            panel.classList.add('active');
        });
        
        // Focus management
        closeBtn.focus();
        
        // Trap focus within panel
        this.setupFocusTrap(panel);
    }
        
    hide() {
        if (!this.panel) return;
        
        this.isOpen = false;
        this.panel.classList.remove('active');
        
        setTimeout(() => {
            if (this.panel && this.panel.parentNode) {
                this.panel.parentNode.removeChild(this.panel);
            }
            this.panel = null;
        }, 300);
        
        // Return focus to history button
        const historyBtn = document.getElementById('undo-history-button');
        if (historyBtn) {
            historyBtn.focus();
        }
    }
        
    createHistoryItem(command, displayIndex, actualIndex) {
        const item = document.createElement('div');
        item.className = 'undo-history-item';
        
        // Time ago
        const timeAgo = this.getTimeAgo(command.timestamp);
        const time = document.createElement('span');
        time.className = 'undo-history-time';
        time.textContent = timeAgo;
        item.appendChild(time);
        
        // Description
        const desc = document.createElement('span');
        desc.className = 'undo-history-desc';
        desc.textContent = command.description;
        item.appendChild(desc);
        
        // Undo button (if not already undone)
        if (displayIndex === 0) {
            const currentLabel = document.createElement('span');
            currentLabel.className = 'undo-history-current';
            currentLabel.textContent = 'Current';
            item.appendChild(currentLabel);
        } else {
            const undoBtn = document.createElement('button');
            undoBtn.className = 'undo-history-action';
            undoBtn.textContent = 'Undo to here';
            undoBtn.onclick = async () => {
                // Undo multiple commands
                const confirmed = await this.confirmMultipleUndo(displayIndex);
                if (confirmed) {
                    for (let i = 0; i < displayIndex; i++) {
                        await window.UndoManager.undo();
                    }
                    this.hide();
                }
            };
            item.appendChild(undoBtn);
        }
        
        return item;
    }
        
    getTimeAgo(timestamp) {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        
        if (seconds < 30) return 'Just now';
        if (seconds < 60) return `${seconds} seconds ago`;
        if (seconds < 120) return '1 minute ago';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 7200) return '1 hour ago';
        
        return 'Earlier';
    }
        
    async confirmMultipleUndo(count) {
        return new Promise((resolve) => {
            if (window.UndoPreview) {
                const preview = {
                    title: `Undo ${count} changes?`,
                    description: 'This will undo multiple actions',
                    icon: '↩️'
                };
                
                window.UndoPreview.show(
                    { preview: () => preview },
                    () => resolve(true),
                    () => resolve(false)
                );
            } else {
                resolve(confirm(`Undo ${count} changes?`));
            }
        });
    }
        
    setupFocusTrap(panel) {
        const focusableElements = panel.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        panel.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            } else if (e.key === 'Escape') {
                this.hide();
            }
        });
    }
}
    
/**
 * Undo Preview Modal
 */
class UndoPreview {
    show(command, onConfirm, onCancel) {
        const preview = command.preview();
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'undo-preview-overlay';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'undo-preview-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', preview.title);
        
        const content = document.createElement('div');
        content.className = 'undo-preview';
        
        // Icon
        const icon = document.createElement('div');
        icon.className = 'undo-preview-icon';
        icon.textContent = preview.icon;
        content.appendChild(icon);
        
        // Title (RSD-safe language)
        const title = document.createElement('div');
        title.className = 'undo-preview-title';
        title.textContent = preview.title;
        content.appendChild(title);
        
        // Description
        const desc = document.createElement('div');
        desc.className = 'undo-preview-description';
        desc.textContent = preview.description;
        content.appendChild(desc);
        
        // Actions
        const actions = document.createElement('div');
        actions.className = 'undo-preview-actions';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'undo-cancel';
        cancelBtn.textContent = 'Keep it';
        cancelBtn.onclick = () => {
            onCancel();
            this.hide(overlay);
        };
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'undo-confirm';
        confirmBtn.textContent = 'Yes, undo';
        confirmBtn.onclick = () => {
            onConfirm();
            this.hide(overlay);
            
            // Haptic feedback
            if (window.StackMapHapticFeedback) {
                window.StackMapHapticFeedback.trigger('success');
            }
        };
        
        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);
        content.appendChild(actions);
        
        modal.appendChild(content);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Animate in
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
        
        // Focus management
        confirmBtn.focus();
        
        // Close on escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onCancel();
                this.hide(overlay);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
    
    hide(overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    }
}
    
// Export to global scope
window.UndoUI = new UndoUI();
window.UndoHistoryView = new UndoHistoryView();
window.UndoPreview = new UndoPreview();