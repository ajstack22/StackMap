/**
 * Welcome Manager for StackMap
 * Handles first-time user onboarding with ADHD/autism-friendly approach
 * ES5 compliant for Android 5 compatibility
 */

(function() {
    'use strict';
    
    const WelcomeManager = {
        currentStep: 0,
        totalSteps: 4,
        hasSeenWelcome: false,
        themeBeforePreview: null,
        isActive: false,
        
        // Welcome flow content
        steps: [
            {
                id: 'welcome',
                title: 'Welcome to StackMap! 👋',
                content: 'Your ADHD-friendly task manager',
                image: null, // Will add SVG later
                buttons: [
                    { text: 'Skip', action: 'skip', class: 'welcome-button-secondary' },
                    { text: 'Next', action: 'next', class: 'welcome-button-primary' }
                ]
            },
            {
                id: 'features',
                title: 'Built for Your Mind',
                content: '<ul class="welcome-features">' +
                        '<li>✓ Quick task entry</li>' +
                        '<li>✓ Safe from accidents</li>' +
                        '<li>✓ Works offline</li>' +
                        '</ul>',
                image: null,
                buttons: [
                    { text: 'Skip', action: 'skip', class: 'welcome-button-secondary' },
                    { text: 'Next', action: 'next', class: 'welcome-button-primary' }
                ]
            },
            {
                id: 'theme',
                title: 'Choose Your Theme',
                content: 'Pick the colors that feel right to you',
                customContent: true, // Will render theme picker
                buttons: [
                    { text: 'Skip', action: 'skip', class: 'welcome-button-secondary' },
                    { text: 'Next', action: 'next', class: 'welcome-button-primary' }
                ]
            },
            {
                id: 'ready',
                title: 'You\'re all set!',
                content: 'Tap anywhere to start using StackMap',
                image: null,
                buttons: [
                    { text: 'Start Using StackMap', action: 'finish', class: 'welcome-button-primary welcome-button-large' }
                ]
            }
        ],
        
        /**
         * Initialize the welcome manager
         */
        init: function() {
            const self = this;
            
            // Check if user has seen welcome
            try {
                self.hasSeenWelcome = localStorage.getItem('stackmap_welcome_seen') === 'true';
            } catch (e) {
                console.warn('Could not check welcome status:', e);
                self.hasSeenWelcome = true; // Default to not showing if storage fails
            }
            
            // Show welcome if first time
            if (!self.hasSeenWelcome) {
                // Delay slightly to ensure app is ready
                setTimeout(function() {
                    self.show();
                }, 500);
            }
        },
        
        /**
         * Show the welcome flow
         */
        show: function() {
            const self = this;
            
            if (self.isActive) return;
            
            self.isActive = true;
            self.currentStep = 0;
            
            // Store current theme for preview
            if (window.StackMapThemeManager) {
                self.themeBeforePreview = window.StackMapThemeManager.getCurrentTheme();
            }
            
            // Create welcome container
            const container = self.createContainer();
            document.body.appendChild(container);
            
            // Render first step
            self.renderStep(0);
            
            // Focus management
            setTimeout(function() {
                self.focusFirstButton();
            }, 100);
            
            // Announce to screen readers
            self.announce('Welcome tutorial started');
        },
        
        /**
         * Create the welcome container
         */
        createContainer: function() {
            const container = document.createElement('div');
            container.id = 'welcome-container';
            container.className = 'welcome-container';
            container.setAttribute('role', 'dialog');
            container.setAttribute('aria-modal', 'true');
            container.setAttribute('aria-label', 'Welcome tutorial');
            
            // Backdrop
            const backdrop = document.createElement('div');
            backdrop.className = 'welcome-backdrop';
            container.appendChild(backdrop);
            
            // Content wrapper
            const content = document.createElement('div');
            content.className = 'welcome-content';
            content.id = 'welcome-content';
            container.appendChild(content);
            
            return container;
        },
        
        /**
         * Render a specific step
         */
        renderStep: function(stepIndex) {
            const self = this;
            const step = self.steps[stepIndex];
            const content = document.getElementById('welcome-content');
            
            if (!content || !step) return;
            
            // Clear previous content
            content.innerHTML = '';
            
            // Create step container
            const stepEl = document.createElement('div');
            stepEl.className = `welcome-step welcome-step-${step.id}`;
            stepEl.setAttribute('data-step', stepIndex);
            
            // Progress dots
            const progress = document.createElement('div');
            progress.className = 'welcome-progress';
            progress.setAttribute('role', 'progressbar');
            progress.setAttribute('aria-valuemin', '1');
            progress.setAttribute('aria-valuemax', self.totalSteps);
            progress.setAttribute('aria-valuenow', stepIndex + 1);
            progress.setAttribute('aria-label', `Step ${stepIndex + 1} of ${self.totalSteps}`);
            
            for (let i = 0; i < self.totalSteps; i++) {
                const dot = document.createElement('span');
                dot.className = 'welcome-progress-dot';
                if (i === stepIndex) {
                    dot.classList.add('active');
                    dot.setAttribute('aria-current', 'step');
                }
                progress.appendChild(dot);
            }
            stepEl.appendChild(progress);
            
            // Title
            const title = document.createElement('h2');
            title.className = 'welcome-title';
            title.textContent = step.title;
            title.id = `welcome-title-${stepIndex}`;
            stepEl.appendChild(title);
            
            // Content
            const contentDiv = document.createElement('div');
            contentDiv.className = 'welcome-text';
            
            if (step.customContent && step.id === 'theme') {
                // Theme picker
                contentDiv.innerHTML = `<p>${step.content}</p>`;
                const themePicker = self.createThemePicker();
                contentDiv.appendChild(themePicker);
            } else {
                contentDiv.innerHTML = step.content;
            }
            
            stepEl.appendChild(contentDiv);
            
            // Buttons
            const buttons = document.createElement('div');
            buttons.className = 'welcome-buttons';
            
            step.buttons.forEach(function(btn) {
                const button = document.createElement('button');
                button.className = `welcome-button ${btn.class}`;
                button.textContent = btn.text;
                button.setAttribute('data-action', btn.action);
                
                // Add click handler
                button.addEventListener('click', function() {
                    self.handleAction(btn.action);
                });
                
                buttons.appendChild(button);
            });
            
            stepEl.appendChild(buttons);
            
            // Add to content
            content.appendChild(stepEl);
            
            // Update ARIA
            stepEl.setAttribute('aria-labelledby', `welcome-title-${stepIndex}`);
            
            // Announce step change
            self.announce(`Step ${stepIndex + 1} of ${self.totalSteps}: ${step.title}`);
        },
        
        /**
         * Create theme picker for step 3
         */
        createThemePicker: function() {
            const self = this;
            const picker = document.createElement('div');
            picker.className = 'welcome-theme-picker';
            
            // Get popular themes
            const popularThemes = ['purpleDream', 'oceanBreeze', 'dark'];
            
            if (window.StackMapThemeManager) {
                const themes = window.StackMapThemeManager.getThemes();
                
                popularThemes.forEach(function(themeId) {
                    const theme = themes[themeId];
                    if (!theme) return;
                    
                    const option = document.createElement('button');
                    option.className = 'welcome-theme-option';
                    option.setAttribute('data-theme', themeId);
                    option.setAttribute('aria-label', `Select ${theme.name} theme`);
                    
                    // Add visual preview
                    const preview = document.createElement('div');
                    preview.className = 'welcome-theme-preview';
                    preview.style.background = theme.properties['--gradient-bg'] || theme.properties['--color-bg'];
                    
                    const icon = document.createElement('span');
                    icon.className = 'welcome-theme-icon';
                    icon.textContent = theme.icon;
                    preview.appendChild(icon);
                    
                    option.appendChild(preview);
                    
                    const name = document.createElement('span');
                    name.className = 'welcome-theme-name';
                    name.textContent = theme.name;
                    option.appendChild(name);
                    
                    // Click handler for preview
                    option.addEventListener('click', function() {
                        self.previewTheme(themeId);
                        
                        // Update selection state
                        picker.querySelectorAll('.welcome-theme-option').forEach(function(opt) {
                            opt.classList.remove('selected');
                        });
                        option.classList.add('selected');
                    });
                    
                    // Select current theme
                    if (themeId === window.StackMapThemeManager.getCurrentTheme()) {
                        option.classList.add('selected');
                    }
                    
                    picker.appendChild(option);
                });
            }
            
            return picker;
        },
        
        /**
         * Handle button actions
         */
        handleAction: function(action) {
            const self = this;
            
            switch (action) {
                case 'skip':
                    self.finish();
                    break;
                    
                case 'next':
                    if (self.currentStep < self.totalSteps - 1) {
                        self.currentStep++;
                        self.renderStep(self.currentStep);
                        self.focusFirstButton();
                    }
                    break;
                    
                case 'finish':
                    self.finish();
                    break;
            }
        },
        
        /**
         * Preview a theme
         */
        previewTheme: function(themeId) {
            if (window.StackMapThemeManager) {
                window.StackMapThemeManager.setTheme(themeId);
            }
        },
        
        /**
         * Finish the welcome flow
         */
        finish: function() {
            const self = this;
            
            // Mark as seen
            try {
                localStorage.setItem('stackmap_welcome_seen', 'true');
            } catch (e) {
                console.warn('Could not save welcome status:', e);
            }
            
            // Remove container
            const container = document.getElementById('welcome-container');
            if (container) {
                container.classList.add('welcome-closing');
                
                setTimeout(function() {
                    if (container.parentNode) {
                        container.parentNode.removeChild(container);
                    }
                }, 300);
            }
            
            self.isActive = false;
            
            // Announce completion
            self.announce('Welcome tutorial completed');
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('welcomecomplete'));
        },
        
        /**
         * Restart the welcome flow (called from settings)
         */
        restart: function() {
            const self = this;
            
            // Reset state
            self.hasSeenWelcome = false;
            
            // Show welcome
            self.show();
        },
        
        /**
         * Focus management
         */
        focusFirstButton: function() {
            const firstButton = document.querySelector('.welcome-button');
            if (firstButton) {
                firstButton.focus();
            }
        },
        
        /**
         * Announce to screen readers
         */
        announce: function(message) {
            // Use existing announcement region if available
            let announcer = document.getElementById('welcome-announcer');
            
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'welcome-announcer';
                announcer.className = 'sr-only';
                announcer.setAttribute('role', 'status');
                announcer.setAttribute('aria-live', 'polite');
                document.body.appendChild(announcer);
            }
            
            announcer.textContent = message;
        },
        
        /**
         * Keyboard navigation
         */
        setupKeyboardNav: function() {
            const self = this;
            
            document.addEventListener('keydown', function(e) {
                if (!self.isActive) return;
                
                // Escape to close
                if (e.key === 'Escape') {
                    e.preventDefault();
                    self.finish();
                }
                
                // Arrow keys for theme selection
                if (self.currentStep === 2 && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                    const options = document.querySelectorAll('.welcome-theme-option');
                    const selected = document.querySelector('.welcome-theme-option.selected');
                    
                    if (options.length > 0) {
                        const currentIndex = Array.from(options).indexOf(selected);
                        let newIndex = currentIndex;
                        
                        if (e.key === 'ArrowLeft') {
                            newIndex = Math.max(0, currentIndex - 1);
                        } else {
                            newIndex = Math.min(options.length - 1, currentIndex + 1);
                        }
                        
                        if (newIndex !== currentIndex) {
                            e.preventDefault();
                            options[newIndex].click();
                            options[newIndex].focus();
                        }
                    }
                }
            });
        }
    };
    
    // Export for global use
    window.StackMapWelcomeManager = WelcomeManager;
    
    // Auto-initialize keyboard navigation
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            WelcomeManager.setupKeyboardNav();
        });
    } else {
        WelcomeManager.setupKeyboardNav();
    }
})();