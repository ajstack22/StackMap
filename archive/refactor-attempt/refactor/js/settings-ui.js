/**
 * Settings UI Component
 * Provides the complete settings interface including behavior and accessibility options
 */

(function() {
    'use strict';
    
    const SettingsUI = {
        initialized: false,
        container: null,
        
        init: function() {
            if (this.initialized) return;
            this.initialized = true;
            
            // Wait for dependencies
            if (!window.StackMapSettingsManager) {
                console.warn('SettingsManager not found, deferring initialization');
                const self = this;
                setTimeout(function() {
                    self.init();
                }, 100);
                return;
            }
            
            // Initialize settings section when on settings page
            this.initSettingsSection();
            
            console.log('SettingsUI initialized');
        },
        
        initSettingsSection: function() {
            // Check if we're on the settings page
            const preferencesSection = document.querySelector('#settings-view .content section:first-child');
            if (!preferencesSection || !preferencesSection.querySelector('h2')) return;
            
            // Only initialize if the section contains "Preferences"
            const heading = preferencesSection.querySelector('h2');
            if (heading && heading.textContent.includes('Preferences')) {
                this.container = preferencesSection;
                this.render();
            }
        },
        
        render: function() {
            if (!this.container) return;
            
            const settings = window.StackMapSettingsManager.getAll();
            
            // Update the content of the Preferences section
            this.container.innerHTML = `
                <h2>Preferences</h2>
                
                <div class="settings-group">
                    <h3>Behavior</h3>
                    
                    <div class="setting-item">
                        <label class="toggle-label">
                            <input type="checkbox" 
                                   id="safe-mode-toggle" 
                                   ${settings.safeModeEnabled ? 'checked' : ''}>
                            <span class="toggle-text">
                                <strong>Safe Mode</strong>
                                <small>Simplified interface with no animations</small>
                            </span>
                        </label>
                        ${window.StackMapSafeMode ? '<p class="setting-note">✓ Safe Mode is currently active</p>' : ''}
                        <p class="setting-note">Note: Changing this setting requires a page reload</p>
                    </div>
                    
                    <div class="setting-item">
                        <label for="auto-save-select">
                            <strong>Auto-save Frequency</strong>
                            <small>How often to save your tasks</small>
                        </label>
                        <select id="auto-save-select" class="setting-select">
                            <option value="15" ${settings.autoSaveInterval === 15 ? 'selected' : ''}>
                                Every 15 seconds
                            </option>
                            <option value="30" ${settings.autoSaveInterval === 30 ? 'selected' : ''}>
                                Every 30 seconds
                            </option>
                            <option value="60" ${settings.autoSaveInterval === 60 ? 'selected' : ''}>
                                Every minute
                            </option>
                            <option value="300" ${settings.autoSaveInterval === 300 ? 'selected' : ''}>
                                Every 5 minutes
                            </option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label class="toggle-label">
                            <input type="checkbox" 
                                   id="confirm-delete-toggle" 
                                   ${settings.confirmDelete ? 'checked' : ''}>
                            <span class="toggle-text">
                                <strong>Confirm Before Deleting</strong>
                                <small>Ask before removing tasks</small>
                            </span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label for="default-view-select">
                            <strong>Default View</strong>
                            <small>Which view to show on startup</small>
                        </label>
                        <select id="default-view-select" class="setting-select">
                            <option value="tasks" ${settings.defaultView === 'tasks' ? 'selected' : ''}>
                                Tasks List
                            </option>
                            <option value="calendar" ${settings.defaultView === 'calendar' ? 'selected' : ''}>
                                Calendar View
                            </option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3>Accessibility</h3>
                    
                    <div class="setting-item">
                        <label for="font-size-select">
                            <strong>Font Size</strong>
                            <small>Make text easier to read</small>
                        </label>
                        <select id="font-size-select" class="setting-select">
                            <option value="normal" ${settings.fontSize === 'normal' ? 'selected' : ''}>
                                Normal
                            </option>
                            <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>
                                Large
                            </option>
                            <option value="extra-large" ${settings.fontSize === 'extra-large' ? 'selected' : ''}>
                                Extra Large
                            </option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label for="touch-target-select">
                            <strong>Touch Target Size</strong>
                            <small>Make buttons easier to tap</small>
                        </label>
                        <select id="touch-target-select" class="setting-select">
                            <option value="normal" ${settings.touchTargetSize === 'normal' ? 'selected' : ''}>
                                Normal (44px minimum)
                            </option>
                            <option value="large" ${settings.touchTargetSize === 'large' ? 'selected' : ''}>
                                Large (60px minimum)
                            </option>
                        </select>
                    </div>
                    
                    <div class="setting-item">
                        <label class="toggle-label">
                            <input type="checkbox" 
                                   id="keyboard-hints-toggle" 
                                   ${settings.keyboardHints ? 'checked' : ''}>
                            <span class="toggle-text">
                                <strong>Keyboard Navigation Hints</strong>
                                <small>Show keyboard shortcuts</small>
                            </span>
                        </label>
                    </div>
                    
                    <div class="setting-item">
                        <label for="screen-reader-select">
                            <strong>Screen Reader Verbosity</strong>
                            <small>Amount of detail for screen readers</small>
                        </label>
                        <select id="screen-reader-select" class="setting-select">
                            <option value="minimal" ${settings.screenReaderVerbosity === 'minimal' ? 'selected' : ''}>
                                Minimal
                            </option>
                            <option value="normal" ${settings.screenReaderVerbosity === 'normal' ? 'selected' : ''}>
                                Normal
                            </option>
                            <option value="verbose" ${settings.screenReaderVerbosity === 'verbose' ? 'selected' : ''}>
                                Verbose
                            </option>
                        </select>
                    </div>
                </div>
                
                <div class="settings-group">
                    <h3>Celebrations</h3>
                    
                    <div class="setting-item">
                        <label for="celebration-theme-select">
                            <strong>Celebration Theme</strong>
                            <small>Choose your celebration style</small>
                        </label>
                        <select id="celebration-theme-select" class="setting-select">
                            ${this.renderCelebrationThemeOptions()}
                        </select>
                        <div id="theme-preview" class="theme-preview"></div>
                    </div>
                    
                    <div class="setting-item" id="custom-color-item" style="display: none;">
                        <label for="custom-color-input">
                            <strong>Custom Color</strong>
                            <small>Choose your celebration color</small>
                        </label>
                        <div class="color-input-wrapper">
                            <input type="color" 
                                   id="custom-color-input" 
                                   class="color-input"
                                   value="#4CAF50">
                            <input type="text" 
                                   id="custom-color-text" 
                                   class="color-text"
                                   value="#4CAF50"
                                   pattern="^#[0-9A-Fa-f]{6}$"
                                   maxlength="7">
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <button id="test-celebration-btn" class="button">
                            Test Celebration
                        </button>
                    </div>
                </div>
                
                <div class="settings-actions">
                    <button id="reset-settings-btn" class="button secondary">
                        Reset All Settings
                    </button>
                </div>
            `;
            
            // Add styles
            this.addStyles();
            
            // Attach event handlers
            this.attachHandlers();
        },
        
        addStyles: function() {
            const styleId = 'settings-ui-styles';
            if (document.getElementById(styleId)) return;
            
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .settings-group {
                    margin-bottom: 32px;
                }
                
                .settings-group h3 {
                    font-size: 20px;
                    margin-bottom: 16px;
                    color: var(--primary-purple);
                }
                
                .setting-item {
                    margin-bottom: 20px;
                    padding: 16px;
                    background: var(--card-bg);
                    border-radius: 8px;
                    border: 1px solid var(--card-border);
                }
                
                .setting-item label {
                    display: block;
                    margin-bottom: 8px;
                }
                
                .setting-item strong {
                    display: block;
                    font-size: 16px;
                    margin-bottom: 4px;
                }
                
                .setting-item small {
                    display: block;
                    opacity: 0.7;
                    font-size: 14px;
                }
                
                .toggle-label {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    margin-bottom: 0;
                }
                
                .toggle-label input[type="checkbox"] {
                    margin-right: 12px;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }
                
                .toggle-text {
                    display: flex;
                    flex-direction: column;
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
                
                .settings-actions {
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid var(--card-border);
                }
                
                .settings-actions .button {
                    min-width: 200px;
                }
                
                .setting-note {
                    margin-top: 8px;
                    font-size: 13px;
                    opacity: 0.7;
                    font-style: italic;
                }
                
                /* Font size classes */
                body.font-size-large {
                    font-size: 18px;
                }
                
                body.font-size-large h1 { font-size: 36px; }
                body.font-size-large h2 { font-size: 28px; }
                body.font-size-large h3 { font-size: 22px; }
                
                body.font-size-extra-large {
                    font-size: 20px;
                }
                
                body.font-size-extra-large h1 { font-size: 40px; }
                body.font-size-extra-large h2 { font-size: 32px; }
                body.font-size-extra-large h3 { font-size: 26px; }
                
                /* Large touch targets */
                body.large-touch-targets button,
                body.large-touch-targets .button,
                body.large-touch-targets input[type="checkbox"],
                body.large-touch-targets select {
                    min-height: 60px;
                    min-width: 60px;
                }
                
                body.large-touch-targets .setting-item {
                    padding: 20px;
                }
                
                /* Keyboard hints */
                body.show-keyboard-hints [data-keyboard-shortcut]:focus::after {
                    content: attr(data-keyboard-shortcut);
                    position: absolute;
                    top: -24px;
                    right: 0;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                }
                
                /* Screen reader verbosity levels */
                body[data-sr-verbosity="minimal"] .sr-verbose,
                body[data-sr-verbosity="minimal"] .sr-normal {
                    position: absolute;
                    left: -10000px;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                }
                
                body[data-sr-verbosity="normal"] .sr-verbose {
                    position: absolute;
                    left: -10000px;
                    width: 1px;
                    height: 1px;
                    overflow: hidden;
                }
                
                /* Celebration theme styles */
                .theme-preview {
                    margin-top: 12px;
                    padding: 12px;
                    background: var(--surface-bg);
                    border-radius: 6px;
                    text-align: center;
                }
                
                .theme-preview-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                }
                
                .theme-preview-emoji {
                    font-size: 24px;
                    letter-spacing: 4px;
                }
                
                .theme-preview small {
                    font-size: 12px;
                    opacity: 0.7;
                }
                
                .color-input-wrapper {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                
                .color-input {
                    width: 60px;
                    height: 40px;
                    border: 1px solid var(--card-border);
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .color-text {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid var(--card-border);
                    border-radius: 4px;
                    font-family: monospace;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                
                #test-celebration-btn {
                    background: var(--success-green);
                    color: white;
                }
                
                #test-celebration-btn:hover {
                    opacity: 0.9;
                }
            `;
            
            document.head.appendChild(style);
        },
        
        attachHandlers: function() {
            const self = this;
            
            // Safe mode toggle
            const safeModeToggle = document.getElementById('safe-mode-toggle');
            if (safeModeToggle) {
                safeModeToggle.addEventListener('change', function() {
                    const isEnabling = this.checked;
                    const isCurrentlySafeMode = window.StackMapSafeMode;
                    
                    // Check if we need to change the URL
                    if ((isEnabling && !isCurrentlySafeMode) || (!isEnabling && isCurrentlySafeMode)) {
                        // Show confirmation dialog
                        const message = isEnabling ? 
                            'Enabling Safe Mode will reload the page with a simplified interface. Continue?' :
                            'Disabling Safe Mode will reload the page. Continue?';
                        
                        if (confirm(message)) {
                            // Save the preference
                            window.StackMapSettingsManager.set('safeModeEnabled', isEnabling);
                            
                            // Redirect with appropriate URL
                            const url = new URL(window.location.href);
                            if (isEnabling) {
                                url.searchParams.set('safe', 'true');
                                url.searchParams.set('persist', 'true');
                            } else {
                                url.searchParams.delete('safe');
                                url.searchParams.delete('persist');
                            }
                            window.location.href = url.toString();
                        } else {
                            // Revert the toggle
                            this.checked = !isEnabling;
                        }
                    } else {
                        // Just save the preference (already in the right mode)
                        window.StackMapSettingsManager.set('safeModeEnabled', isEnabling);
                    }
                });
            }
            
            // Auto-save frequency
            const autoSaveSelect = document.getElementById('auto-save-select');
            if (autoSaveSelect) {
                autoSaveSelect.addEventListener('change', function() {
                    window.StackMapSettingsManager.set('autoSaveInterval', parseInt(this.value, 10));
                });
            }
            
            // Confirm delete toggle
            const confirmDeleteToggle = document.getElementById('confirm-delete-toggle');
            if (confirmDeleteToggle) {
                confirmDeleteToggle.addEventListener('change', function() {
                    window.StackMapSettingsManager.set('confirmDelete', this.checked);
                });
            }
            
            // Default view
            const defaultViewSelect = document.getElementById('default-view-select');
            if (defaultViewSelect) {
                defaultViewSelect.addEventListener('change', function() {
                    window.StackMapSettingsManager.set('defaultView', this.value);
                });
            }
            
            // Font size
            const fontSizeSelect = document.getElementById('font-size-select');
            if (fontSizeSelect) {
                fontSizeSelect.addEventListener('change', function() {
                    window.StackMapSettingsManager.set('fontSize', this.value);
                });
            }
            
            // Touch target size
            const touchTargetSelect = document.getElementById('touch-target-select');
            if (touchTargetSelect) {
                touchTargetSelect.addEventListener('change', function() {
                    window.StackMapSettingsManager.set('touchTargetSize', this.value);
                });
            }
            
            // Keyboard hints
            const keyboardHintsToggle = document.getElementById('keyboard-hints-toggle');
            if (keyboardHintsToggle) {
                keyboardHintsToggle.addEventListener('change', function() {
                    window.StackMapSettingsManager.set('keyboardHints', this.checked);
                });
            }
            
            // Screen reader verbosity
            const screenReaderSelect = document.getElementById('screen-reader-select');
            if (screenReaderSelect) {
                screenReaderSelect.addEventListener('change', function() {
                    window.StackMapSettingsManager.set('screenReaderVerbosity', this.value);
                    document.body.setAttribute('data-sr-verbosity', this.value);
                });
            }
            
            // Celebration theme
            const celebrationThemeSelect = document.getElementById('celebration-theme-select');
            if (celebrationThemeSelect) {
                celebrationThemeSelect.addEventListener('change', function() {
                    const theme = this.value;
                    if (window.CelebrationSystem) {
                        window.CelebrationSystem.setTheme(theme);
                        self.updateThemePreview(theme);
                        
                        // Show/hide custom color input
                        const customColorItem = document.getElementById('custom-color-item');
                        if (customColorItem) {
                            customColorItem.style.display = theme === 'custom' ? 'block' : 'none';
                        }
                    }
                });
                
                // Initialize preview
                const currentTheme = window.CelebrationSystem ? window.CelebrationSystem.currentTheme : 'ocean';
                self.updateThemePreview(currentTheme);
                
                // Show/hide custom color input based on current theme
                const customColorItem = document.getElementById('custom-color-item');
                if (customColorItem) {
                    customColorItem.style.display = currentTheme === 'custom' ? 'block' : 'none';
                }
            }
            
            // Custom color inputs
            const customColorInput = document.getElementById('custom-color-input');
            const customColorText = document.getElementById('custom-color-text');
            
            if (customColorInput && customColorText) {
                // Sync color input with text input
                customColorInput.addEventListener('change', function() {
                    customColorText.value = this.value.toUpperCase();
                    if (window.CelebrationSystem) {
                        window.CelebrationSystem.setCustomColor(this.value);
                        self.updateThemePreview('custom');
                    }
                });
                
                customColorText.addEventListener('input', function() {
                    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
                        customColorInput.value = this.value;
                        if (window.CelebrationSystem) {
                            window.CelebrationSystem.setCustomColor(this.value);
                            self.updateThemePreview('custom');
                        }
                    }
                });
                
                // Load saved custom color
                try {
                    const savedColor = localStorage.getItem('celebrationCustomColor');
                    if (savedColor) {
                        customColorInput.value = savedColor;
                        customColorText.value = savedColor.toUpperCase();
                    }
                } catch (e) {
                    // Ignore storage errors
                }
            }
            
            // Test celebration button
            const testCelebrationBtn = document.getElementById('test-celebration-btn');
            if (testCelebrationBtn) {
                testCelebrationBtn.addEventListener('click', function() {
                    if (window.CelebrationSystem) {
                        window.CelebrationSystem.celebrate({
                            type: 'medium',
                            message: 'Looking great! 🎉',
                            duration: 2000
                        });
                    }
                });
            }
            
            // Reset settings button
            const resetButton = document.getElementById('reset-settings-btn');
            if (resetButton) {
                resetButton.addEventListener('click', function() {
                    if (window.StackMapSettingsManager.get('confirmDelete')) {
                        if (confirm('Are you sure you want to reset all settings to defaults?')) {
                            window.StackMapSettingsManager.reset();
                            self.render(); // Re-render to show default values
                            alert('Settings have been reset to defaults');
                        }
                    } else {
                        window.StackMapSettingsManager.reset();
                        self.render();
                        alert('Settings have been reset to defaults');
                    }
                });
            }
        },
        
        renderCelebrationThemeOptions: function() {
            if (!window.CelebrationSystem) return '<option value="ocean">Ocean</option>';
            
            const themes = window.CelebrationSystem.getThemes();
            const currentTheme = window.CelebrationSystem.currentTheme;
            
            return themes.map(theme => {
                const selected = theme.id === currentTheme ? 'selected' : '';
                const label = theme.adhd ? `${theme.name} ⭐` : theme.name;
                const description = theme.description ? ` - ${theme.description}` : '';
                return `<option value="${theme.id}" ${selected}>${label}</option>`;
            }).join('');
        },
        
        updateThemePreview: function(themeId) {
            const preview = document.getElementById('theme-preview');
            if (!preview || !window.CelebrationSystem) return;
            
            const themes = window.CelebrationSystem.getThemes();
            const theme = themes.find(t => t.id === themeId);
            
            if (theme) {
                preview.innerHTML = `
                    <div class="theme-preview-content">
                        <span class="theme-preview-emoji">${theme.preview}</span>
                        ${theme.description ? `<small>${theme.description}</small>` : ''}
                    </div>
                `;
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            SettingsUI.init();
        });
    } else {
        SettingsUI.init();
    }
    
    // Re-initialize when navigating to settings
    document.addEventListener('viewchange', function(e) {
        if (e.detail && e.detail.view === 'settings-view') {
            SettingsUI.initSettingsSection();
        }
    });
    
    // Export for debugging
    window.StackMapSettingsUI = SettingsUI;
})();