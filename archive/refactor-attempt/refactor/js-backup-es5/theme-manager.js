/**
 * Theme Manager for StackMap
 * Handles theme switching, sensory preferences, and accessibility settings
 * 
 * Research-based design:
 * - Supports users with ADHD and autism through sensory preferences
 * - Provides high contrast options for visual accessibility
 * - Includes reduced motion settings for sensory comfort
 * - Manages color temperature for different times of day
 */

(function() {
    'use strict';
    
    // Theme definitions with sensory considerations
    var THEMES = {
        purpleDream: {
            name: 'Purple Dream',
            description: 'Default theme with calming purple hues',
            icon: '💜',
            properties: {
                // Core colors
                '--color-bg': '#f5f5f5',
                '--color-bg-secondary': '#ffffff',
                '--color-text': '#333333',
                '--color-text-secondary': 'rgba(51, 51, 51, 0.7)',
                '--card-bg': '#ffffff',
                '--card-border': '#d8d8d8',
                '--header-bg': '#ffffff',
                '--header-text': '#333333',
                
                // Primary colors
                '--primary-purple': '#667eea',
                '--primary-purple-dark': '#5a67d8',
                
                // Gradient
                '--gradient-bg': 'linear-gradient(135deg, #667eea 0%, #5a67d8 100%)',
                
                // Shadows
                '--shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.05)',
                '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
                '--shadow-lg': '0 6px 12px rgba(0, 0, 0, 0.15)',
                '--shadow-purple': '0 4px 12px rgba(102, 126, 234, 0.25)',
                
                // Inline overrides for critical styles
                '--loading-bg': '#f5f5f5',
                '--loading-text': '#333333'
            }
        },
        
        oceanBreeze: {
            name: 'Ocean Breeze',
            description: 'Cool blues like the sea',
            icon: '🌊',
            properties: {
                '--color-bg': '#f0f8ff',
                '--color-bg-secondary': '#ffffff',
                '--color-text': '#1e3a5f',
                '--color-text-secondary': 'rgba(30, 58, 95, 0.7)',
                '--card-bg': '#ffffff',
                '--card-border': '#b8d4e3',
                '--header-bg': '#e1f0ff',
                '--header-text': '#1e3a5f',
                
                '--primary-purple': '#4a90e2',
                '--primary-purple-dark': '#357abd',
                
                '--gradient-bg': 'linear-gradient(135deg, #4a90e2 0%, #357abd 100%)',
                
                '--shadow-sm': '0 2px 4px rgba(30, 58, 95, 0.05)',
                '--shadow-md': '0 4px 6px rgba(30, 58, 95, 0.1)',
                '--shadow-lg': '0 6px 12px rgba(30, 58, 95, 0.15)',
                '--shadow-purple': '0 4px 12px rgba(74, 144, 226, 0.25)',
                
                '--loading-bg': '#f0f8ff',
                '--loading-text': '#1e3a5f'
            }
        },
        
        forestWalk: {
            name: 'Forest Walk',
            description: 'Natural greens for a calming experience',
            icon: '🌲',
            properties: {
                '--color-bg': '#f0f7f0',
                '--color-bg-secondary': '#ffffff',
                '--color-text': '#1a3d1a',
                '--color-text-secondary': 'rgba(26, 61, 26, 0.7)',
                '--card-bg': '#ffffff',
                '--card-border': '#c3d9c3',
                '--header-bg': '#e1f0e1',
                '--header-text': '#1a3d1a',
                
                '--primary-purple': '#4ade80',
                '--primary-purple-dark': '#22c55e',
                
                '--gradient-bg': 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                
                '--shadow-sm': '0 2px 4px rgba(26, 61, 26, 0.05)',
                '--shadow-md': '0 4px 6px rgba(26, 61, 26, 0.1)',
                '--shadow-lg': '0 6px 12px rgba(26, 61, 26, 0.15)',
                '--shadow-purple': '0 4px 12px rgba(74, 222, 128, 0.25)',
                
                '--loading-bg': '#f0f7f0',
                '--loading-text': '#1a3d1a'
            }
        },
        
        sunsetGlow: {
            name: 'Sunset Glow',
            description: 'Warm oranges and reds',
            icon: '🌅',
            properties: {
                '--color-bg': '#fff5f0',
                '--color-bg-secondary': '#ffffff',
                '--color-text': '#5a2a0a',
                '--color-text-secondary': 'rgba(90, 42, 10, 0.7)',
                '--card-bg': '#ffffff',
                '--card-border': '#f5c99b',
                '--header-bg': '#ffe4d6',
                '--header-text': '#5a2a0a',
                
                '--primary-purple': '#f97316',
                '--primary-purple-dark': '#ea580c',
                
                '--gradient-bg': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                
                '--shadow-sm': '0 2px 4px rgba(90, 42, 10, 0.05)',
                '--shadow-md': '0 4px 6px rgba(90, 42, 10, 0.1)',
                '--shadow-lg': '0 6px 12px rgba(90, 42, 10, 0.15)',
                '--shadow-purple': '0 4px 12px rgba(249, 115, 22, 0.25)',
                
                '--loading-bg': '#fff5f0',
                '--loading-text': '#5a2a0a'
            }
        },
        
        dark: {
            name: 'Dark Night',
            description: 'Easy on the eyes in low light',
            icon: '🌙',
            properties: {
                '--color-bg': '#121212',
                '--color-bg-secondary': '#1e1e1e',
                '--color-text': '#e0e0e0',
                '--color-text-secondary': 'rgba(224, 224, 224, 0.7)',
                '--card-bg': '#1e1e1e',
                '--card-border': '#333333',
                '--header-bg': '#1e1e1e',
                '--header-text': '#e0e0e0',
                
                '--primary-purple': '#9580ff',
                '--primary-purple-dark': '#7c3aed',
                
                '--gradient-bg': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                
                '--shadow-sm': '0 2px 4px rgba(0, 0, 0, 0.3)',
                '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
                '--shadow-lg': '0 6px 12px rgba(0, 0, 0, 0.5)',
                '--shadow-purple': '0 4px 12px rgba(149, 128, 255, 0.25)',
                
                '--loading-bg': '#121212',
                '--loading-text': '#e0e0e0'
            }
        },
        
        highContrast: {
            name: 'High Contrast',
            description: 'Maximum readability',
            icon: '👁️',
            properties: {
                '--color-bg': '#000000',
                '--color-bg-secondary': '#000000',
                '--color-text': '#ffffff',
                '--color-text-secondary': '#ffffff',
                '--card-bg': '#000000',
                '--card-border': '#ffffff',
                '--header-bg': '#000000',
                '--header-text': '#ffffff',
                
                '--gradient-bg': '#000000',
                '--primary-purple': '#00ff00',
                '--primary-purple-dark': '#00cc00',
                
                '--shadow-sm': '0 0 0 2px #ffffff',
                '--shadow-md': '0 0 0 2px #ffffff',
                '--shadow-lg': '0 0 0 2px #ffffff',
                '--shadow-purple': '0 0 0 2px #00ff00',
                
                '--loading-bg': '#000000',
                '--loading-text': '#ffffff'
            }
        },
        
        calm: {
            name: 'Calm Waters',
            description: 'Soothing colors for sensory comfort',
            icon: '🕊️',
            properties: {
                '--color-bg': '#e8f4f0',
                '--color-bg-secondary': '#f5faf8',
                '--color-text': '#2d4a3e',
                '--color-text-secondary': 'rgba(45, 74, 62, 0.7)',
                '--card-bg': '#f5faf8',
                '--card-border': '#c3d9d1',
                '--header-bg': '#d7e9e3',
                '--header-text': '#2d4a3e',
                
                '--gradient-bg': 'linear-gradient(135deg, #a8d8ea 0%, #86c3d1 100%)',
                '--primary-purple': '#5a9ca8',
                '--primary-purple-dark': '#4a8a96',
                
                '--shadow-sm': '0 2px 4px rgba(0, 50, 40, 0.08)',
                '--shadow-md': '0 4px 6px rgba(0, 50, 40, 0.12)',
                '--shadow-lg': '0 6px 12px rgba(0, 50, 40, 0.18)',
                '--shadow-purple': '0 4px 12px rgba(90, 156, 168, 0.25)',
                
                '--loading-bg': '#e8f4f0',
                '--loading-text': '#2d4a3e'
            }
        },
        
        warm: {
            name: 'Cozy Cabin',
            description: 'Warm and comfortable earth tones',
            icon: '🔥',
            properties: {
                '--color-bg': '#fef6e4',
                '--color-bg-secondary': '#fffdf8',
                '--color-text': '#3d2914',
                '--color-text-secondary': 'rgba(61, 41, 20, 0.7)',
                '--card-bg': '#fffdf8',
                '--card-border': '#e6d3b3',
                '--header-bg': '#f5e6d3',
                '--header-text': '#3d2914',
                
                '--gradient-bg': 'linear-gradient(135deg, #f3c178 0%, #e8a558 100%)',
                '--primary-purple': '#d4823b',
                '--primary-purple-dark': '#b86f2f',
                
                '--shadow-sm': '0 2px 4px rgba(139, 69, 19, 0.08)',
                '--shadow-md': '0 4px 6px rgba(139, 69, 19, 0.12)',
                '--shadow-lg': '0 6px 12px rgba(139, 69, 19, 0.18)',
                '--shadow-purple': '0 4px 12px rgba(212, 130, 59, 0.25)',
                
                '--loading-bg': '#fef6e4',
                '--loading-text': '#3d2914'
            }
        }
    };
    
    // Sensory preferences
    var SENSORY_SETTINGS = {
        animations: {
            name: 'Animations',
            description: 'Visual transitions and movements',
            key: 'animations',
            default: true,
            cssClass: 'reduce-motion'
        },
        
        colorVibrancy: {
            name: 'Color Vibrancy',
            description: 'Intensity of colors',
            key: 'colorVibrancy',
            default: 'normal',
            options: ['muted', 'normal', 'vibrant'],
            cssClass: 'color-vibrancy'
        },
        
        contrast: {
            name: 'Contrast',
            description: 'Difference between light and dark',
            key: 'contrast',
            default: 'normal',
            options: ['low', 'normal', 'high'],
            cssClass: 'contrast-level'
        }
    };
    
    var ThemeManager = {
        currentTheme: 'purpleDream',
        sensoryPrefs: {},
        initialized: false,
        
        init: function() {
            if (this.initialized) return;
            this.initialized = true;
            
            // Load saved preferences
            this.loadPreferences();
            
            // Apply initial theme
            this.applyTheme(this.currentTheme);
            
            // Apply sensory preferences
            this.applySensoryPreferences();
            
            // Listen for system preference changes
            this.watchSystemPreferences();
            
            // Initialize settings UI if available
            this.initSettingsUI();
            
            console.log('ThemeManager initialized with theme:', this.currentTheme);
        },
        
        loadPreferences: function() {
            try {
                // Load theme
                var savedTheme = localStorage.getItem('stackmap-theme');
                if (savedTheme && THEMES[savedTheme]) {
                    this.currentTheme = savedTheme;
                } else if (this.prefersColorScheme('dark')) {
                    this.currentTheme = 'dark';
                }
                
                // Load sensory preferences
                var savedSensory = localStorage.getItem('stackmap-sensory-prefs');
                if (savedSensory) {
                    this.sensoryPrefs = JSON.parse(savedSensory);
                } else {
                    // Set defaults
                    this.sensoryPrefs = {
                        animations: !this.prefersReducedMotion(),
                        colorVibrancy: 'normal',
                        contrast: 'normal'
                    };
                }
            } catch (e) {
                console.warn('Could not load theme preferences:', e);
            }
        },
        
        savePreferences: function() {
            try {
                localStorage.setItem('stackmap-theme', this.currentTheme);
                localStorage.setItem('stackmap-sensory-prefs', JSON.stringify(this.sensoryPrefs));
            } catch (e) {
                console.warn('Could not save theme preferences:', e);
            }
        },
        
        applyTheme: function(themeName) {
            var theme = THEMES[themeName];
            if (!theme) {
                console.warn('Unknown theme:', themeName);
                return;
            }
            
            this.currentTheme = themeName;
            
            // Apply CSS properties
            var root = document.documentElement;
            for (var prop in theme.properties) {
                root.style.setProperty(prop, theme.properties[prop]);
            }
            
            // Update body classes
            document.body.className = document.body.className
                .replace(/theme-\w+/g, '')
                .trim() + ' theme-' + themeName;
            
            // Update meta theme-color for mobile browsers
            var metaTheme = document.querySelector('meta[name="theme-color"]');
            if (!metaTheme) {
                metaTheme = document.createElement('meta');
                metaTheme.name = 'theme-color';
                document.head.appendChild(metaTheme);
            }
            metaTheme.content = theme.properties['--header-bg'] || '#000000';
            
            // Apply inline style overrides for critical elements
            this.applyInlineOverrides(theme);
            
            // Save preference
            this.savePreferences();
            
            // Show toast notification
            this.showThemeToast(themeName);
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('themechange', {
                detail: { theme: themeName }
            }));
        },
        
        applyInlineOverrides: function(theme) {
            // Update loading view
            var loadingView = document.getElementById('loading-view');
            if (loadingView) {
                loadingView.style.background = theme.properties['--loading-bg'] || theme.properties['--color-bg'];
                loadingView.style.color = theme.properties['--loading-text'] || theme.properties['--color-text'];
            }
            
            // Update critical inline styles in header
            var style = document.getElementById('theme-overrides');
            if (!style) {
                style = document.createElement('style');
                style.id = 'theme-overrides';
                document.head.appendChild(style);
            }
            
            style.textContent = `
                body {
                    background: ${theme.properties['--gradient-bg'] || theme.properties['--color-bg']};
                    color: ${theme.properties['--color-text']};
                }
                .header {
                    background: ${theme.properties['--header-bg'] || '#2a2a2a'};
                    color: ${theme.properties['--header-text'] || '#ffffff'};
                }
            `;
        },
        
        applySensoryPreferences: function() {
            var root = document.documentElement;
            
            // Animations
            if (!this.sensoryPrefs.animations) {
                root.classList.add('reduce-motion');
            } else {
                root.classList.remove('reduce-motion');
            }
            
            // Color vibrancy
            root.className = root.className.replace(/color-vibrancy-\w+/g, '');
            if (this.sensoryPrefs.colorVibrancy && this.sensoryPrefs.colorVibrancy !== 'normal') {
                root.classList.add('color-vibrancy-' + this.sensoryPrefs.colorVibrancy);
            }
            
            // Contrast
            root.className = root.className.replace(/contrast-\w+/g, '');
            if (this.sensoryPrefs.contrast && this.sensoryPrefs.contrast !== 'normal') {
                root.classList.add('contrast-' + this.sensoryPrefs.contrast);
            }
            
            this.savePreferences();
        },
        
        setTheme: function(themeName) {
            if (!THEMES[themeName]) {
                console.warn('Invalid theme:', themeName);
                return;
            }
            
            this.applyTheme(themeName);
        },
        
        previewTheme: function(themeName) {
            // Temporarily apply theme without saving
            var theme = THEMES[themeName];
            if (!theme) {
                console.warn('Unknown theme:', themeName);
                return;
            }
            
            // Apply CSS properties
            var root = document.documentElement;
            for (var prop in theme.properties) {
                root.style.setProperty(prop, theme.properties[prop]);
            }
            
            // Update body classes
            document.body.className = document.body.className
                .replace(/theme-\w+/g, '')
                .trim() + ' theme-' + themeName;
            
            // Apply inline overrides
            this.applyInlineOverrides(theme);
            
            // Don't save preferences or show toast for preview
        },
        
        setSensoryPreference: function(key, value) {
            this.sensoryPrefs[key] = value;
            this.applySensoryPreferences();
        },
        
        toggleTheme: function() {
            // Cycle through themes
            var themeKeys = Object.keys(THEMES);
            var currentIndex = themeKeys.indexOf(this.currentTheme);
            var nextIndex = (currentIndex + 1) % themeKeys.length;
            this.setTheme(themeKeys[nextIndex]);
        },
        
        prefersColorScheme: function(scheme) {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: ' + scheme + ')').matches;
        },
        
        prefersReducedMotion: function() {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },
        
        watchSystemPreferences: function() {
            var self = this;
            
            // Watch for system dark mode changes
            if (window.matchMedia) {
                var darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
                if (darkModeQuery.addEventListener) {
                    darkModeQuery.addEventListener('change', function(e) {
                        // Only auto-switch if user hasn't manually set a theme
                        var savedTheme = localStorage.getItem('stackmap-theme');
                        if (!savedTheme) {
                            self.setTheme(e.matches ? 'dark' : 'purpleDream');
                        }
                        
                        // Update theme toggle icon if it exists
                        self.updateThemeToggleIcon();
                    });
                }
                
                // Watch for reduced motion preference
                var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
                if (motionQuery.addEventListener) {
                    motionQuery.addEventListener('change', function(e) {
                        self.setSensoryPreference('animations', !e.matches);
                    });
                }
            }
        },
        
        updateThemeToggleIcon: function() {
            var toggleBtn = document.querySelector('.theme-toggle-btn');
            if (toggleBtn) {
                var isDark = this.currentTheme === 'dark' || 
                            this.currentTheme === 'highContrast';
                toggleBtn.innerHTML = isDark ? '☀️' : '🌙';
                toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
            }
        },
        
        initSettingsUI: function() {
            // This will be called from the settings view
            // We'll implement the UI integration separately
        },
        
        // Public API
        getThemes: function() {
            return THEMES;
        },
        
        getCurrentTheme: function() {
            return this.currentTheme;
        },
        
        getSensorySettings: function() {
            return SENSORY_SETTINGS;
        },
        
        getSensoryPreferences: function() {
            return this.sensoryPrefs;
        },
        
        showThemeToast: function(themeName) {
            var theme = THEMES[themeName];
            if (!theme) return;
            
            // Create toast element
            var toast = document.createElement('div');
            toast.className = 'theme-toast';
            toast.innerHTML = '<span class="theme-toast-icon">' + theme.icon + '</span>' +
                             '<span class="theme-toast-text">Theme changed to ' + theme.name + '</span>';
            
            document.body.appendChild(toast);
            
            // Animate in
            setTimeout(function() {
                toast.classList.add('show');
            }, 10);
            
            // Remove after delay
            setTimeout(function() {
                toast.classList.remove('show');
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 2000);
        }
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ThemeManager.init();
        });
    } else {
        ThemeManager.init();
    }
    
    // Export for use in other modules
    window.StackMapThemeManager = ThemeManager;
})();