/**
 * Settings Manager
 * Handles all user preferences including behavior, accessibility, and general settings
 */

(function() {
    'use strict';
    
    var SettingsManager = {
        initialized: false,
        storageKey: 'stackmap_settings',
        
        // Default settings
        defaults: {
            // Behavior
            safeModeEnabled: false,
            autoSaveInterval: 30, // seconds
            confirmDelete: true,
            defaultView: 'tasks', // 'tasks' or 'calendar'
            
            // Accessibility
            fontSize: 'normal', // 'normal', 'large', 'extra-large'
            screenReaderVerbosity: 'normal', // 'minimal', 'normal', 'verbose'
            keyboardHints: true,
            touchTargetSize: 'normal', // 'normal', 'large'
            
            // Data
            lastExport: null,
            onboardingCompleted: false
        },
        
        settings: null,
        changeListeners: [],
        
        init: function() {
            if (this.initialized) return;
            this.initialized = true;
            
            this.loadSettings();
            this.applySettings();
            
            console.log('SettingsManager initialized');
        },
        
        loadSettings: function() {
            try {
                var stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    var parsed = JSON.parse(stored);
                    // Merge with defaults to ensure all keys exist
                    this.settings = Object.assign({}, this.defaults, parsed);
                } else {
                    this.settings = Object.assign({}, this.defaults);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                this.settings = Object.assign({}, this.defaults);
            }
        },
        
        saveSettings: function() {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
                this.notifyListeners();
            } catch (error) {
                console.error('Failed to save settings:', error);
            }
        },
        
        get: function(key) {
            if (!this.settings) this.loadSettings();
            return this.settings[key];
        },
        
        set: function(key, value) {
            if (!this.settings) this.loadSettings();
            
            var oldValue = this.settings[key];
            this.settings[key] = value;
            
            // Apply setting immediately if it has a visual impact
            this.applySettingChange(key, value, oldValue);
            
            this.saveSettings();
        },
        
        getAll: function() {
            if (!this.settings) this.loadSettings();
            return Object.assign({}, this.settings);
        },
        
        reset: function() {
            this.settings = Object.assign({}, this.defaults);
            this.saveSettings();
            this.applySettings();
        },
        
        applySettings: function() {
            // Apply all settings that have visual/behavioral impact
            this.applyFontSize(this.settings.fontSize);
            this.applyTouchTargetSize(this.settings.touchTargetSize);
            this.applyKeyboardHints(this.settings.keyboardHints);
            
            // Apply safe mode if persisted
            if (this.settings.safeModeEnabled && !window.StackMapSafeMode) {
                // Redirect to safe mode
                var url = new URL(window.location.href);
                url.searchParams.set('safe', 'true');
                url.searchParams.set('persist', 'true');
                window.location.href = url.toString();
            }
        },
        
        applySettingChange: function(key, value, oldValue) {
            switch (key) {
                case 'fontSize':
                    this.applyFontSize(value);
                    break;
                case 'touchTargetSize':
                    this.applyTouchTargetSize(value);
                    break;
                case 'keyboardHints':
                    this.applyKeyboardHints(value);
                    break;
                case 'safeModeEnabled':
                    // Don't apply immediately - handled by UI with confirmation
                    break;
            }
        },
        
        applyFontSize: function(size) {
            var body = document.body;
            // Remove existing font size classes
            body.classList.remove('font-size-normal', 'font-size-large', 'font-size-extra-large');
            
            switch (size) {
                case 'large':
                    body.classList.add('font-size-large');
                    break;
                case 'extra-large':
                    body.classList.add('font-size-extra-large');
                    break;
                default:
                    body.classList.add('font-size-normal');
            }
        },
        
        applyTouchTargetSize: function(size) {
            var body = document.body;
            body.classList.toggle('large-touch-targets', size === 'large');
        },
        
        applyKeyboardHints: function(enabled) {
            var body = document.body;
            body.classList.toggle('show-keyboard-hints', enabled);
        },
        
        // Event listeners
        onChange: function(callback) {
            if (typeof callback === 'function') {
                this.changeListeners.push(callback);
            }
        },
        
        notifyListeners: function() {
            var self = this;
            this.changeListeners.forEach(function(callback) {
                try {
                    callback(self.settings);
                } catch (error) {
                    console.error('Settings change listener error:', error);
                }
            });
        },
        
        // Helper methods for specific settings
        isConfirmDeleteEnabled: function() {
            return this.get('confirmDelete');
        },
        
        getAutoSaveInterval: function() {
            return this.get('autoSaveInterval') * 1000; // Convert to milliseconds
        },
        
        getDefaultView: function() {
            return this.get('defaultView');
        },
        
        setOnboardingCompleted: function() {
            this.set('onboardingCompleted', true);
        },
        
        isOnboardingCompleted: function() {
            return this.get('onboardingCompleted');
        },
        
        recordExport: function() {
            this.set('lastExport', new Date().toISOString());
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SettingsManager.init();
        });
    } else {
        SettingsManager.init();
    }
    
    // Export for use by other modules
    window.StackMapSettingsManager = SettingsManager;
})();