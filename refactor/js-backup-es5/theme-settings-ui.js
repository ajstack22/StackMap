/**
 * Theme Settings UI Component
 * Provides interface for theme selection and sensory preferences
 */

(function() {
    'use strict';
    
    var ThemeSettingsUI = {
        initialized: false,
        container: null,
        eventHandlers: [],
        
        init: function() {
            if (this.initialized) return;
            this.initialized = true;
            
            // Wait for theme manager to be ready
            if (!window.StackMapThemeManager) {
                console.warn('ThemeManager not found, deferring initialization');
                var self = this;
                setTimeout(function() {
                    self.init();
                }, 100);
                return;
            }
            
            // Add theme button to header
            this.addThemeToggle();
            
            // Initialize settings section if on settings page
            this.initSettingsSection();
            
            console.log('ThemeSettingsUI initialized');
        },
        
        addThemeToggle: function() {
            // Add quick theme toggle to main header
            var menuButton = document.getElementById('menu-button');
            if (!menuButton) return;
            
            var themeButton = document.createElement('button');
            themeButton.id = 'theme-toggle';
            themeButton.className = 'icon theme-toggle-btn';
            themeButton.setAttribute('aria-label', 'Toggle theme');
            themeButton.innerHTML = this.getThemeIcon(window.StackMapThemeManager.getCurrentTheme());
            
            // Style the button
            themeButton.style.marginRight = '8px';
            themeButton.style.minWidth = '44px';
            themeButton.style.minHeight = '44px';
            themeButton.style.fontSize = '20px';
            
            // Insert before menu button
            menuButton.parentNode.insertBefore(themeButton, menuButton);
            
            // Add click handler
            var self = this;
            themeButton.addEventListener('click', function() {
                window.StackMapThemeManager.toggleTheme();
                themeButton.innerHTML = self.getThemeIcon(window.StackMapThemeManager.getCurrentTheme());
                
                // Show toast notification
                self.showThemeToast(window.StackMapThemeManager.getCurrentTheme());
            });
        },
        
        getThemeIcon: function(themeName) {
            var themes = window.StackMapThemeManager.getThemes();
            return themes[themeName] ? themes[themeName].icon : '🎨';
        },
        
        initSettingsSection: function() {
            // Check if we're on the settings page
            var settingsContent = document.querySelector('#settings-view .content');
            if (!settingsContent) return;
            
            // Find or create appearance section
            var appearanceSection = settingsContent.querySelector('.appearance-section');
            if (!appearanceSection) {
                // Create new section before Data Management
                appearanceSection = document.createElement('section');
                appearanceSection.className = 'appearance-section';
                
                var dataSection = settingsContent.querySelector('section:nth-child(2)');
                if (dataSection) {
                    settingsContent.insertBefore(appearanceSection, dataSection);
                } else {
                    settingsContent.appendChild(appearanceSection);
                }
            }
            
            this.container = appearanceSection;
            this.render();
        },
        
        render: function() {
            if (!this.container) return;
            
            var themes = window.StackMapThemeManager.getThemes();
            var currentTheme = window.StackMapThemeManager.getCurrentTheme();
            var sensorySettings = window.StackMapThemeManager.getSensorySettings();
            var sensoryPrefs = window.StackMapThemeManager.getSensoryPreferences();
            
            this.container.innerHTML = `
                <h2>Appearance & Accessibility</h2>
                
                <div class="theme-selector">
                    <h3>Choose Your Theme</h3>
                    <div class="theme-grid">
                        ${Object.keys(themes).map(function(key) {
                            var theme = themes[key];
                            var isActive = key === currentTheme;
                            return `
                                <button class="theme-option ${isActive ? 'active' : ''}" 
                                        data-theme="${key}"
                                        aria-label="Select ${theme.name} theme"
                                        style="background: ${theme.properties['--gradient-bg'] || theme.properties['--primary-purple'] || '#667eea'}">
                                    <div class="theme-option-content">
                                        <span class="theme-icon">${theme.icon}</span>
                                        <span class="theme-name">${theme.name}</span>
                                        ${isActive ? '<span class="theme-check">✓</span>' : ''}
                                    </div>
                                    <div class="theme-preview">
                                        <div class="preview-header" style="background: ${theme.properties['--header-bg']}"></div>
                                        <div class="preview-body" style="background: ${theme.properties['--color-bg']}">
                                            <div class="preview-card" style="background: ${theme.properties['--card-bg']}; border-color: ${theme.properties['--card-border']}"></div>
                                        </div>
                                    </div>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="sensory-settings">
                    <h3>Sensory Preferences</h3>
                    
                    <div class="setting-item">
                        <label class="toggle-label">
                            <input type="checkbox" 
                                   id="animations-toggle" 
                                   ${sensoryPrefs.animations ? 'checked' : ''}>
                            <span class="toggle-text">
                                <strong>Animations</strong>
                                <small>Visual transitions and movements</small>
                            </span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label for="vibrancy-select">
                            <strong>Color Vibrancy</strong>
                            <small>Adjust color intensity for comfort</small>
                        </label>
                        <select id="vibrancy-select" class="setting-select">
                            <option value="muted" ${sensoryPrefs.colorVibrancy === 'muted' ? 'selected' : ''}>
                                Muted (Softer colors)
                            </option>
                            <option value="normal" ${sensoryPrefs.colorVibrancy === 'normal' ? 'selected' : ''}>
                                Normal
                            </option>
                            <option value="vibrant" ${sensoryPrefs.colorVibrancy === 'vibrant' ? 'selected' : ''}>
                                Vibrant (Brighter colors)
                            </option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label for="contrast-select">
                            <strong>Contrast Level</strong>
                            <small>Difference between light and dark</small>
                        </label>
                        <select id="contrast-select" class="setting-select">
                            <option value="low" ${sensoryPrefs.contrast === 'low' ? 'selected' : ''}>
                                Low (Softer contrast)
                            </option>
                            <option value="normal" ${sensoryPrefs.contrast === 'normal' ? 'selected' : ''}>
                                Normal
                            </option>
                            <option value="high" ${sensoryPrefs.contrast === 'high' ? 'selected' : ''}>
                                High (Stronger contrast)
                            </option>
                        </select>
                    </div>
                </div>
                
                <div class="theme-tips">
                    <p class="tip">
                        💡 <strong>Tip:</strong> Try the Calm theme for reduced visual stimulation, 
                        or High Contrast for better readability.
                    </p>
                </div>
            `;
            
            // Add styles
            this.addStyles();
            
            // Attach event handlers
            this.attachHandlers();
        },
        
        addStyles: function() {
            var styleId = 'theme-settings-styles';
            if (document.getElementById(styleId)) return;
            
            var style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .appearance-section {
                    margin-bottom: 32px;
                }
                
                .theme-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 16px;
                    margin: 20px 0;
                }
                
                .theme-option {
                    position: relative;
                    height: 120px;
                    border: 3px solid transparent;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                }
                
                .theme-option:hover {
                    transform: translateY(-4px) scale(1.02);
                    box-shadow: var(--shadow-lg);
                }
                
                .theme-option:focus-visible {
                    outline: 3px solid var(--primary-purple);
                    outline-offset: 2px;
                }
                
                .theme-option.active {
                    border-color: #333;
                    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
                }
                
                .theme-option-content {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 16px;
                    z-index: 2;
                }
                
                .theme-icon {
                    font-size: 36px;
                    margin-bottom: 8px;
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
                }
                
                .theme-name {
                    font-weight: 700;
                    font-size: 14px;
                    color: white;
                    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
                    text-align: center;
                }
                
                .theme-check {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 24px;
                    height: 24px;
                    background: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: bold;
                    color: #333;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }
                
                .theme-preview {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    opacity: 0.15;
                    pointer-events: none;
                }
                
                .preview-header {
                    height: 20%;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                }
                
                .preview-body {
                    height: 80%;
                    padding: 8px;
                }
                
                .preview-card {
                    height: 30%;
                    border-radius: 4px;
                    border: 1px solid;
                }
                
                .sensory-settings {
                    margin-top: 32px;
                }
                
                .setting-item {
                    margin-bottom: 20px;
                    padding: 16px;
                    background: var(--card-bg);
                    border-radius: 8px;
                    border: 1px solid var(--card-border);
                }
                
                .toggle-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                }
                
                .toggle-label input {
                    margin-right: 12px;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }
                
                .toggle-text {
                    display: flex;
                    flex-direction: column;
                }
                
                .toggle-text small {
                    opacity: 0.7;
                    margin-top: 4px;
                }
                
                .setting-select {
                    width: 100%;
                    padding: 8px 12px;
                    margin-top: 8px;
                    border: 1px solid var(--card-border);
                    border-radius: 8px;
                    background: var(--color-bg-secondary);
                    color: var(--color-text);
                    font-size: 16px;
                    cursor: pointer;
                }
                
                .theme-tips {
                    margin-top: 24px;
                    padding: 16px;
                    background: rgba(102, 126, 234, 0.1);
                    border-radius: 8px;
                }
                
                .theme-tips .tip {
                    margin: 0;
                    font-size: 14px;
                }
                
                /* Theme toast notification */
                .theme-toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--card-bg);
                    color: var(--color-text);
                    padding: 12px 24px;
                    border-radius: 24px;
                    box-shadow: var(--shadow-lg);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    z-index: var(--z-toast);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .theme-toast.show {
                    opacity: 1;
                }
            `;
            
            document.head.appendChild(style);
        },
        
        attachHandlers: function() {
            var self = this;
            
            // Clean up any existing handlers first
            this.cleanup();
            
            // Store original theme for preview restoration
            var originalTheme = window.StackMapThemeManager.getCurrentTheme();
            var previewTimeout = null;
            
            // Theme selection
            var themeButtons = this.container.querySelectorAll('.theme-option');
            themeButtons.forEach(function(button) {
                // Create named functions for handlers to allow removal
                var clickHandler = function() {
                    var theme = button.dataset.theme;
                    
                    // Clear any preview timeout
                    if (previewTimeout) {
                        clearTimeout(previewTimeout);
                        previewTimeout = null;
                    }
                    
                    window.StackMapThemeManager.setTheme(theme);
                    originalTheme = theme;
                    
                    // Update active state
                    themeButtons.forEach(function(btn) {
                        btn.classList.toggle('active', btn === button);
                    });
                };
                
                var mouseenterHandler = function() {
                    var theme = button.dataset.theme;
                    if (theme !== originalTheme) {
                        // Clear any existing timeout
                        if (previewTimeout) {
                            clearTimeout(previewTimeout);
                        }
                        // Preview theme without saving
                        window.StackMapThemeManager.applyTheme(theme);
                    }
                };
                
                var mouseleaveHandler = function() {
                    var currentTheme = window.StackMapThemeManager.getCurrentTheme();
                    if (currentTheme !== originalTheme) {
                        // Delay restoration to handle quick hovers between buttons
                        previewTimeout = setTimeout(function() {
                            window.StackMapThemeManager.applyTheme(originalTheme);
                            previewTimeout = null;
                        }, 100);
                    }
                };
                
                // Add event listeners and track them
                button.addEventListener('click', clickHandler);
                button.addEventListener('mouseenter', mouseenterHandler);
                button.addEventListener('mouseleave', mouseleaveHandler);
                
                // Store handlers for cleanup
                self.eventHandlers.push({
                    element: button,
                    event: 'click',
                    handler: clickHandler
                });
                self.eventHandlers.push({
                    element: button,
                    event: 'mouseenter',
                    handler: mouseenterHandler
                });
                self.eventHandlers.push({
                    element: button,
                    event: 'mouseleave',
                    handler: mouseleaveHandler
                });
            });
            
            // Animations toggle
            var animationsToggle = document.getElementById('animations-toggle');
            if (animationsToggle) {
                var animationsHandler = function() {
                    window.StackMapThemeManager.setSensoryPreference('animations', this.checked);
                };
                animationsToggle.addEventListener('change', animationsHandler);
                self.eventHandlers.push({
                    element: animationsToggle,
                    event: 'change',
                    handler: animationsHandler
                });
            }
            
            // Color vibrancy
            var vibrancySelect = document.getElementById('vibrancy-select');
            if (vibrancySelect) {
                var vibrancyHandler = function() {
                    window.StackMapThemeManager.setSensoryPreference('colorVibrancy', this.value);
                };
                vibrancySelect.addEventListener('change', vibrancyHandler);
                self.eventHandlers.push({
                    element: vibrancySelect,
                    event: 'change',
                    handler: vibrancyHandler
                });
            }
            
            // Contrast level
            var contrastSelect = document.getElementById('contrast-select');
            if (contrastSelect) {
                var contrastHandler = function() {
                    window.StackMapThemeManager.setSensoryPreference('contrast', this.value);
                };
                contrastSelect.addEventListener('change', contrastHandler);
                self.eventHandlers.push({
                    element: contrastSelect,
                    event: 'change',
                    handler: contrastHandler
                });
            }
        },
        
        cleanup: function() {
            // Remove all tracked event handlers
            this.eventHandlers.forEach(function(item) {
                if (item.element && item.handler) {
                    item.element.removeEventListener(item.event, item.handler);
                }
            });
            this.eventHandlers = [];
        },
        
        showThemeToast: function(themeName) {
            var themes = window.StackMapThemeManager.getThemes();
            var theme = themes[themeName];
            if (!theme) return;
            
            // Remove existing toast
            var existingToast = document.querySelector('.theme-toast');
            if (existingToast) {
                existingToast.remove();
            }
            
            // Create new toast
            var toast = document.createElement('div');
            toast.className = 'theme-toast';
            toast.innerHTML = `
                <span class="toast-icon">${theme.icon}</span>
                <span class="toast-text">${theme.name} theme activated</span>
            `;
            
            document.body.appendChild(toast);
            
            // Trigger animation
            setTimeout(function() {
                toast.classList.add('show');
            }, 10);
            
            // Remove after delay
            setTimeout(function() {
                toast.classList.remove('show');
                setTimeout(function() {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 300);
            }, 2000);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            ThemeSettingsUI.init();
        });
    } else {
        ThemeSettingsUI.init();
    }
    
    // Re-initialize when navigating to settings
    document.addEventListener('viewchange', function(e) {
        if (e.detail && e.detail.view === 'settings-view') {
            ThemeSettingsUI.initSettingsSection();
        }
    });
    
    // Export for debugging
    window.StackMapThemeSettingsUI = ThemeSettingsUI;
})();