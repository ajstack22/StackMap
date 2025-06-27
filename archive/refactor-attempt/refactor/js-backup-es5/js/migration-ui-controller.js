/**
 * Migration UI Controller
 * Provides calming, specific, and reassuring UI during database migrations
 * Designed for users with ADHD/autism who need clear expectations and control
 */

(function() {
    'use strict';
    
    class MigrationUIController {
        constructor() {
            // UI state
            this.container = null;
            this.isVisible = false;
            this.currentPhase = null;
            this.startTime = null;
            
            // Animation frame for smooth updates
            this.animationFrame = null;
            
            // Enhanced messages with specific time estimates (per PM review)
            this.messages = {
                preflight: {
                    whatHappening: "Checking if it's safe to update your tasks",
                    whyImportant: "This protects your data from any issues",
                    userAction: "This takes about 5-10 seconds",
                    dataStatus: "Your tasks are safe and unchanged"
                },
                backup: {
                    whatHappening: "Creating a safety copy of all your tasks",
                    whyImportant: "If anything goes wrong, we can restore everything",
                    userAction: "This takes about 15-30 seconds",
                    dataStatus: "Your tasks are being safely copied"
                },
                canary: {
                    whatHappening: "Testing the update with a few tasks first",
                    whyImportant: "This makes sure everything will work perfectly",
                    userAction: "This takes about 10-20 seconds",
                    dataStatus: "Testing with 1% of your tasks"
                },
                migration: {
                    whatHappening: "Moving your tasks to the improved storage",
                    whyImportant: "This makes the app faster and more reliable",
                    userAction: "This takes about 1-3 minutes",
                    dataStatus: "Your tasks are being carefully moved"
                },
                verification: {
                    whatHappening: "Double-checking every single task",
                    whyImportant: "Making absolutely sure nothing was missed",
                    userAction: "This takes about 20-40 seconds",
                    dataStatus: "Verifying all tasks are perfect"
                },
                complete: {
                    whatHappening: "✓ All your tasks have been safely updated!",
                    whyImportant: "Everything worked perfectly",
                    userAction: "You can use the app normally now",
                    dataStatus: "All tasks are exactly as you left them"
                },
                error: {
                    whatHappening: "The update was stopped to keep your data safe",
                    whyImportant: "Your tasks are still exactly as they were",
                    userAction: "You can try again later or continue as normal",
                    dataStatus: "No changes were made to your tasks"
                }
            };
            
            // Color scheme for calming effect
            this.colors = {
                background: 'linear-gradient(135deg, #e8f4f8 0%, #f0e8f8 100%)',
                progressBar: '#4a9eff',
                progressBackground: '#e0e8f0',
                text: '#2c3e50',
                subtext: '#546e7a',
                success: '#4caf50',
                warning: '#ff9800',
                error: '#f44336'
            };
            
            // Accessibility features
            this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
        }
        
        /**
         * Initialize the UI controller
         */
        init() {
            this.createContainer();
            this.setupEventListeners();
            this.applyAccessibilitySettings();
        }
        
        /**
         * Create the UI container
         */
        createContainer() {
            // Remove existing container if any
            const existing = document.getElementById('migration-progress-container');
            if (existing) {
                existing.remove();
            }
            
            // Create new container
            this.container = document.createElement('div');
            this.container.id = 'migration-progress-container';
            this.container.className = 'migration-progress-container';
            this.container.setAttribute('role', 'dialog');
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-label', 'Database update progress');
            
            // Add styles
            this.addStyles();
            
            // Add to body
            document.body.appendChild(this.container);
        }
        
        /**
         * Add CSS styles for the migration UI
         */
        addStyles() {
            const styleId = 'migration-ui-styles';
            let styleElement = document.getElementById(styleId);
            
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                styleElement.textContent = `
                    .migration-progress-container {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                        opacity: 0;
                        visibility: hidden;
                        transition: opacity 0.3s ease, visibility 0.3s ease;
                    }
                    
                    .migration-progress-container.visible {
                        opacity: 1;
                        visibility: visible;
                    }
                    
                    .migration-card {
                        background: white;
                        border-radius: 16px;
                        padding: 32px;
                        max-width: 480px;
                        width: 90%;
                        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                        transform: translateY(20px);
                        transition: transform 0.3s ease;
                    }
                    
                    .migration-progress-container.visible .migration-card {
                        transform: translateY(0);
                    }
                    
                    .migration-title {
                        font-size: 20px;
                        font-weight: 600;
                        color: #2c3e50;
                        margin: 0 0 8px 0;
                        line-height: 1.4;
                    }
                    
                    .migration-subtitle {
                        font-size: 16px;
                        color: #546e7a;
                        margin: 0 0 24px 0;
                        line-height: 1.5;
                    }
                    
                    .migration-data-status {
                        background: #e8f4f8;
                        border-radius: 8px;
                        padding: 12px 16px;
                        margin: 0 0 24px 0;
                        font-size: 14px;
                        color: #2c3e50;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .migration-data-status::before {
                        content: '🔒';
                        font-size: 18px;
                    }
                    
                    .progress-container {
                        margin: 0 0 16px 0;
                    }
                    
                    .progress-bar-outer {
                        background: #e0e8f0;
                        border-radius: 8px;
                        height: 12px;
                        overflow: hidden;
                        position: relative;
                    }
                    
                    .progress-bar-inner {
                        background: #4a9eff;
                        height: 100%;
                        border-radius: 8px;
                        transition: width 0.5s ease;
                        position: relative;
                    }
                    
                    .progress-text {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 8px;
                        font-size: 14px;
                        color: #546e7a;
                    }
                    
                    .time-estimate {
                        font-size: 16px;
                        color: #2c3e50;
                        margin: 16px 0;
                        padding: 12px 16px;
                        background: #f5f5f5;
                        border-radius: 8px;
                        text-align: center;
                    }
                    
                    .time-estimate strong {
                        color: #4a9eff;
                    }
                    
                    .migration-action {
                        font-size: 14px;
                        color: #546e7a;
                        margin: 16px 0 0 0;
                        text-align: center;
                    }
                    
                    .rollback-button {
                        display: block;
                        width: 100%;
                        padding: 12px 24px;
                        margin-top: 24px;
                        background: white;
                        border: 2px solid #4a9eff;
                        border-radius: 8px;
                        color: #4a9eff;
                        font-size: 16px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    
                    .rollback-button:hover {
                        background: #f0f7ff;
                        transform: translateY(-1px);
                    }
                    
                    .rollback-button:active {
                        transform: translateY(0);
                    }
                    
                    /* Reduced motion preferences */
                    @media (prefers-reduced-motion: reduce) {
                        .migration-progress-container,
                        .migration-card,
                        .progress-bar-inner,
                        .rollback-button {
                            transition: none !important;
                        }
                    }
                    
                    /* High contrast mode */
                    @media (prefers-contrast: high) {
                        .migration-card {
                            border: 2px solid black;
                        }
                        
                        .progress-bar-outer {
                            border: 1px solid black;
                        }
                        
                        .rollback-button {
                            border-width: 3px;
                        }
                    }
                    
                    /* Mobile responsive */
                    @media (max-width: 480px) {
                        .migration-card {
                            padding: 24px 20px;
                        }
                        
                        .migration-title {
                            font-size: 18px;
                        }
                        
                        .migration-subtitle {
                            font-size: 14px;
                        }
                    }
                `;
                document.head.appendChild(styleElement);
            }
        }
        
        /**
         * Show migration progress with specific phase
         */
        showProgress(phase, progress = 0, options = {}) {
            this.currentPhase = phase;
            
            if (!this.startTime) {
                this.startTime = Date.now();
            }
            
            // Calculate time estimates
            const elapsed = Date.now() - this.startTime;
            const estimatedTotal = this.estimatePhaseTime(phase, options);
            const remaining = Math.max(0, estimatedTotal - elapsed);
            
            // Update UI
            this.updateUI(phase, progress, remaining, options);
            
            // Make visible if not already
            if (!this.isVisible) {
                this.show();
            }
            
            // Auto-hide on completion
            if (phase === 'complete') {
                setTimeout(() => this.hide(), 3000);
            }
        }
        
        /**
         * Update the UI with current progress
         */
        updateUI(phase, progress, timeRemaining, options) {
            const message = this.messages[phase] || this.messages.migration;
            
            // Format time remaining
            const timeText = this.formatTimeRemaining(timeRemaining);
            
            this.container.innerHTML = `
                <div class="migration-card">
                    <h2 class="migration-title">
                        ${message.whatHappening}
                    </h2>
                    <p class="migration-subtitle">
                        ${message.whyImportant}
                    </p>
                    
                    <div class="migration-data-status">
                        ${message.dataStatus}
                    </div>
                    
                    ${phase !== 'complete' && phase !== 'error' ? `
                        <div class="progress-container">
                            <div class="progress-bar-outer">
                                <div class="progress-bar-inner" style="width: ${progress}%"></div>
                            </div>
                            <div class="progress-text">
                                <span>${Math.round(progress)}% complete</span>
                                <span>${this.getPhaseLabel(phase)}</span>
                            </div>
                        </div>
                        
                        <div class="time-estimate">
                            ${timeText}
                        </div>
                    ` : ''}
                    
                    <p class="migration-action">
                        ${message.userAction}
                    </p>
                    
                    ${phase !== 'complete' && phase !== 'error' && options.showRollback !== false ? `
                        <button class="rollback-button" onclick="window.migrationController.requestRollback()">
                            Cancel update and keep current version
                        </button>
                    ` : ''}
                    
                    ${phase === 'error' ? `
                        <button class="rollback-button" onclick="window.migrationController.dismiss()">
                            Continue using the app
                        </button>
                    ` : ''}
                </div>
            `;
            
            // Update progress bar smoothly
            if (phase !== 'complete' && phase !== 'error') {
                requestAnimationFrame(() => {
                    const progressBar = this.container.querySelector('.progress-bar-inner');
                    if (progressBar) {
                        progressBar.style.width = `${progress}%`;
                    }
                });
            }
        }
        
        /**
         * Estimate time for each phase (in milliseconds)
         */
        estimatePhaseTime(phase, options = {}) {
            const baseEstimates = {
                preflight: 7500,      // 5-10 seconds -> 7.5s average
                backup: 22500,        // 15-30 seconds -> 22.5s average
                canary: 15000,        // 10-20 seconds -> 15s average
                migration: 120000,    // 1-3 minutes -> 2 minutes average
                verification: 30000,  // 20-40 seconds -> 30s average
                complete: 0,
                error: 0
            };
            
            let estimate = baseEstimates[phase] || 60000;
            
            // Adjust based on data size if provided
            if (options.rowCount) {
                const rowFactor = options.rowCount / 1000; // Per 1000 rows
                estimate = estimate * Math.max(1, Math.log10(rowFactor + 1));
            }
            
            // Always round up for user comfort (per PM review)
            return Math.ceil(estimate * 1.2); // 20% buffer
        }
        
        /**
         * Format time remaining in user-friendly way
         */
        formatTimeRemaining(milliseconds) {
            if (milliseconds <= 0) {
                return '<strong>Almost done!</strong> Just a few more seconds...';
            }
            
            const seconds = Math.ceil(milliseconds / 1000);
            
            if (seconds < 10) {
                return '<strong>Less than 10 seconds</strong> remaining';
            } else if (seconds < 30) {
                return `About <strong>${Math.ceil(seconds / 5) * 5} seconds</strong> remaining`;
            } else if (seconds < 60) {
                return `About <strong>half a minute</strong> remaining`;
            } else if (seconds < 120) {
                return `About <strong>1 minute</strong> remaining`;
            } else {
                const minutes = Math.ceil(seconds / 60);
                return `About <strong>${minutes} minutes</strong> remaining`;
            }
        }
        
        /**
         * Get user-friendly phase label
         */
        getPhaseLabel(phase) {
            const labels = {
                preflight: 'Safety checks',
                backup: 'Creating backup',
                canary: 'Testing update',
                migration: 'Updating storage',
                verification: 'Verifying data',
                complete: 'Complete',
                error: 'Stopped'
            };
            
            return labels[phase] || 'Processing';
        }
        
        /**
         * Show the migration UI
         */
        show() {
            this.isVisible = true;
            this.container.classList.add('visible');
            
            // Announce to screen readers
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'assertive');
            announcement.className = 'sr-only';
            announcement.textContent = 'Database update in progress. Your data is safe.';
            document.body.appendChild(announcement);
            
            setTimeout(() => announcement.remove(), 1000);
        }
        
        /**
         * Hide the migration UI
         */
        hide() {
            this.isVisible = false;
            this.container.classList.remove('visible');
            this.startTime = null;
            this.currentPhase = null;
            
            // Announce completion
            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'assertive');
            announcement.className = 'sr-only';
            announcement.textContent = 'Database update complete. All your tasks are safe.';
            document.body.appendChild(announcement);
            
            setTimeout(() => announcement.remove(), 1000);
        }
        
        /**
         * Setup event listeners
         */
        setupEventListeners() {
            // Listen for escape key to show rollback confirmation
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isVisible && this.currentPhase !== 'complete') {
                    if (window.migrationController && window.migrationController.confirmRollback) {
                        window.migrationController.confirmRollback();
                    }
                }
            });
        }
        
        /**
         * Apply accessibility settings
         */
        applyAccessibilitySettings() {
            if (this.reducedMotion) {
                // Handled by CSS media query
                console.log('[MigrationUI] Reduced motion preference detected');
            }
            
            if (this.highContrast) {
                // Handled by CSS media query
                console.log('[MigrationUI] High contrast preference detected');
            }
        }
        
        /**
         * Show error state
         */
        showError(error, options = {}) {
            this.currentPhase = 'error';
            this.updateUI('error', 0, 0, options);
            
            if (!this.isVisible) {
                this.show();
            }
        }
        
        /**
         * Get current state for telemetry
         */
        getState() {
            return {
                isVisible: this.isVisible,
                currentPhase: this.currentPhase,
                startTime: this.startTime,
                elapsedTime: this.startTime ? Date.now() - this.startTime : 0
            };
        }
    }
    
    // Export to global scope
    window.MigrationUIController = MigrationUIController;
    
    // Auto-initialize
    document.addEventListener('DOMContentLoaded', () => {
        window.migrationUI = new MigrationUIController();
        window.migrationUI.init();
    });
    
})();