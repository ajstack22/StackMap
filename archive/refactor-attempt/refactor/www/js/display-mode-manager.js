/**
 * Display Mode Manager for StackMap
 * Manages switching between Numbers Mode and Times Mode
 * Story #117 - Display Modes Implementation
 */

(() => {
    'use strict';
    
    const DISPLAY_MODES = {
        NUMBERS: 'numbers',
        TIMES: 'times'
    };
    
    const DisplayModeManager = {
        currentMode: DISPLAY_MODES.NUMBERS,
        callbacks: new Set(),
        isInitialized: false,
        
        // Migration from old display mode
        oldStorageKey: 'stackmap_display_mode',
        newStorageKey: 'stackmap_display_mode_v2',
        
        /**
         * Initialize display mode manager
         */
        init: function() {
            if (this.isInitialized) return;
            
            this.loadMode();
            this.applyModeToDOM();
            this.isInitialized = true;
            
            // Listen for storage changes from other tabs
            window.addEventListener('storage', (e) => {
                if (e.key === this.newStorageKey || e.key === this.oldStorageKey) {
                    this.loadMode();
                    this.applyModeToDOM();
                    this.notifyCallbacks();
                }
            });
            
            console.log(`DisplayModeManager initialized in ${this.currentMode} mode`);
        },
        
        /**
         * Load mode from storage with migration support
         */
        loadMode: function() {
            try {
                // Check new storage format first
                let mode = localStorage.getItem(this.newStorageKey);
                
                // Migration: Check old format if new doesn't exist
                if (!mode) {
                    const oldMode = localStorage.getItem(this.oldStorageKey);
                    if (oldMode === 'time') {
                        mode = DISPLAY_MODES.TIMES;
                        // Migrate to new format
                        localStorage.setItem(this.newStorageKey, mode);
                        console.log('Migrated display mode from old format');
                    } else {
                        mode = DISPLAY_MODES.NUMBERS; // Default
                    }
                }
                
                // Validate mode
                if (mode === DISPLAY_MODES.NUMBERS || mode === DISPLAY_MODES.TIMES) {
                    this.currentMode = mode;
                } else {
                    this.currentMode = DISPLAY_MODES.NUMBERS;
                    this.saveMode();
                }
                
            } catch (e) {
                console.warn('Could not load display mode:', e);
                this.currentMode = DISPLAY_MODES.NUMBERS;
            }
        },
        
        /**
         * Save mode to storage
         */
        saveMode: function() {
            try {
                localStorage.setItem(this.newStorageKey, this.currentMode);
                
                // Keep old format for backward compatibility during transition
                const oldFormat = this.currentMode === DISPLAY_MODES.TIMES ? 'time' : 'numbers';
                localStorage.setItem(this.oldStorageKey, oldFormat);
                
            } catch (e) {
                console.warn('Could not save display mode:', e);
            }
        },
        
        /**
         * Get current display mode
         */
        getCurrentMode: function() {
            return this.currentMode;
        },
        
        /**
         * Set display mode
         */
        setMode: function(mode) {
            if (mode !== DISPLAY_MODES.NUMBERS && mode !== DISPLAY_MODES.TIMES) {
                console.warn('Invalid display mode:', mode);
                return false;
            }
            
            if (this.currentMode === mode) {
                return true; // No change needed
            }
            
            const oldMode = this.currentMode;
            this.currentMode = mode;
            this.saveMode();
            this.applyModeToDOM();
            this.notifyCallbacks();
            
            // Dispatch global event
            document.dispatchEvent(new CustomEvent('displayModeChanged', {
                detail: { 
                    oldMode: oldMode,
                    newMode: mode,
                    timestamp: Date.now()
                }
            }));
            
            console.log(`Display mode changed: ${oldMode} → ${mode}`);
            return true;
        },
        
        /**
         * Toggle between modes
         */
        toggleMode: function() {
            const newMode = this.currentMode === DISPLAY_MODES.NUMBERS 
                ? DISPLAY_MODES.TIMES 
                : DISPLAY_MODES.NUMBERS;
            return this.setMode(newMode);
        },
        
        /**
         * Apply mode classes to DOM
         */
        applyModeToDOM: function() {
            const body = document.body;
            if (!body) return;
            
            // Remove old mode classes
            body.classList.remove('mode-numbers', 'mode-times');
            
            // Add current mode class
            body.classList.add(`mode-${this.currentMode}`);
            
            // Update any mode toggles
            this.updateModeToggles();
        },
        
        /**
         * Update mode toggle buttons
         */
        updateModeToggles: function() {
            const toggles = document.querySelectorAll('[data-display-mode-toggle]');
            toggles.forEach(toggle => {
                const isNumbers = this.currentMode === DISPLAY_MODES.NUMBERS;
                
                // Update button text
                if (toggle.textContent.includes('Numbers') || toggle.textContent.includes('Times')) {
                    toggle.textContent = isNumbers ? '⏰ Times Mode' : '🔢 Numbers Mode';
                }
                
                // Update aria-label
                const nextMode = isNumbers ? 'Times' : 'Numbers';
                toggle.setAttribute('aria-label', `Switch to ${nextMode} Mode`);
                
                // Update pressed state
                toggle.setAttribute('aria-pressed', 'false');
            });
        },
        
        /**
         * Format activity time based on current mode
         */
        formatActivityTime: function(activity, options = {}) {
            if (!activity) return '';
            
            if (this.currentMode === DISPLAY_MODES.NUMBERS) {
                return this.formatDuration(activity.duration || activity.timeEstimate || activity.estimatedMinutes || 0);
            } else {
                return this.formatScheduledTime(activity.scheduledTime || activity.time, options.format || '12h');
            }
        },
        
        /**
         * Format duration for Numbers Mode
         */
        formatDuration: function(minutes) {
            if (!minutes || minutes <= 0) {
                return '?';
            }
            
            if (minutes < 60) {
                return `${minutes}m`;
            } else if (minutes % 60 === 0) {
                return `${Math.floor(minutes / 60)}h`;
            } else {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return `${hours}h ${mins}m`;
            }
        },
        
        /**
         * Format scheduled time for Times Mode
         */
        formatScheduledTime: function(time, format = '12h') {
            if (!time || !window.TimeFormatter) {
                return '';
            }
            
            return window.TimeFormatter.formatForDisplay(time, format, {
                compact: true,
                showIcon: false
            });
        },
        
        /**
         * Get time context for time blindness helpers
         */
        getTimeContext: function(time) {
            if (!time || !window.TimeFormatter) {
                return { period: 'unknown', icon: '⏰', relative: '' };
            }
            
            const [hours] = time.split(':').map(Number);
            
            let period = 'morning';
            let icon = '☀️';
            
            if (hours >= 5 && hours < 8) {
                period = 'early morning';
                icon = '🌅';
            } else if (hours >= 8 && hours < 12) {
                period = 'morning';
                icon = '☀️';
            } else if (hours >= 12 && hours < 17) {
                period = 'afternoon';
                icon = '🌞';
            } else if (hours >= 17 && hours < 22) {
                period = 'evening';
                icon = '🌆';
            } else {
                period = 'night';
                icon = '🌙';
            }
            
            return { period, icon, relative: this.getRelativeTime(time) };
        },
        
        /**
         * Get relative time description
         */
        getRelativeTime: function(time) {
            if (!time) return '';
            
            try {
                const now = new Date();
                const [hours, minutes] = time.split(':').map(Number);
                const target = new Date(now);
                target.setHours(hours, minutes, 0, 0);
                
                // If time has passed today, assume tomorrow
                if (target < now) {
                    target.setDate(target.getDate() + 1);
                }
                
                const diffMs = target - now;
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                if (diffHours === 0) {
                    if (diffMinutes <= 0) return 'now';
                    if (diffMinutes < 60) return `in ${diffMinutes}m`;
                }
                
                if (diffHours === 1) return 'in 1 hour';
                if (diffHours < 24) return `in ${diffHours} hours`;
                
                return 'tomorrow';
                
            } catch (e) {
                return '';
            }
        },
        
        /**
         * Get duration visual indicator
         */
        getDurationVisual: function(minutes) {
            if (!minutes || minutes <= 0) return '';
            
            // Simple visual indicators for different durations
            if (minutes <= 15) return '▫️'; // Quick task
            if (minutes <= 30) return '▫️▫️'; // Short task
            if (minutes <= 60) return '▫️▫️▫️'; // Medium task
            if (minutes <= 120) return '▫️▫️▫️▫️'; // Long task
            return '▫️▫️▫️▫️▫️'; // Very long task
        },
        
        /**
         * Register callback for mode changes
         */
        onModeChange: function(callback) {
            if (typeof callback === 'function') {
                this.callbacks.add(callback);
            }
        },
        
        /**
         * Unregister callback
         */
        offModeChange: function(callback) {
            this.callbacks.delete(callback);
        },
        
        /**
         * Notify all registered callbacks
         */
        notifyCallbacks: function() {
            this.callbacks.forEach(callback => {
                try {
                    callback(this.currentMode);
                } catch (e) {
                    console.warn('Error in display mode callback:', e);
                }
            });
        },
        
        /**
         * Get mode information for UI
         */
        getModeInfo: function(mode = this.currentMode) {
            const info = {
                [DISPLAY_MODES.NUMBERS]: {
                    name: 'Numbers Mode',
                    description: 'Focus on how long tasks take',
                    icon: '🔢',
                    example: '1h 30m',
                    benefits: ['Flexible timing', 'Gentle time awareness', 'Duration-based planning']
                },
                [DISPLAY_MODES.TIMES]: {
                    name: 'Times Mode', 
                    description: 'Focus on when tasks happen',
                    icon: '⏰',
                    example: '2:30 PM',
                    benefits: ['Scheduled timing', 'Calendar integration', 'Time-specific planning']
                }
            };
            
            return info[mode] || info[DISPLAY_MODES.NUMBERS];
        },
        
        /**
         * Check if activity supports current mode
         */
        activitySupportsMode: function(activity, mode = this.currentMode) {
            if (!activity) return false;
            
            if (mode === DISPLAY_MODES.NUMBERS) {
                return !!(activity.duration || activity.timeEstimate || activity.estimatedMinutes);
            } else {
                return !!(activity.scheduledTime || activity.time);
            }
        }
    };
    
    // Export to global scope
    window.DisplayModeManager = DisplayModeManager;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DisplayModeManager.init());
    } else {
        DisplayModeManager.init();
    }
    
})();