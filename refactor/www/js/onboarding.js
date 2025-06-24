/**
 * Onboarding for StackMap
 * First-time user experience
 */

(function() {
    'use strict';

    var Onboarding = {
        eventListeners: [], // Track event listeners for cleanup
        steps: [
            {
                id: 'welcome',
                title: 'Welcome to StackMap! 🎉',
                content: 'Your personal task companion for daily routines.',
                action: 'Next'
            },
            {
                id: 'demo_tasks',
                title: 'Try It Out! 👇',
                content: 'We\'ve added some sample tasks. Try checking one off!',
                highlight: '.task-checkbox:not(:checked)',
                action: 'I\'ll try',
                waitForAction: 'task-complete'
            },
            {
                id: 'celebration',
                title: 'Great Job! 🎊',
                content: 'StackMap celebrates your progress. Every task matters!',
                action: 'Cool!',
                skipCondition: function() {
                    var prefs = window.App && window.App.getCurrentUserPreferences();
                    return prefs && !prefs.celebrationsEnabled;
                }
            },
            {
                id: 'customize',
                title: 'Make It Yours 🎨',
                content: 'Add your own tasks, choose a theme, and customize your experience.',
                highlight: '.add-task-button',
                action: 'Let\'s go!'
            }
        ],
        
        currentStep: 0,
        isActive: false,
        tooltipElement: null,
        highlightedElement: null,
        
        init: function() {
            this.bindEvents();
        },
        
        bindEvents: function() {
            var self = this;
            
            // Listen for task completion
            var taskHandler = function(e) {
                if (self.isActive && self.steps[self.currentStep].waitForAction === 'task-complete') {
                    // Auto-advance after a short delay to show celebration
                    setTimeout(function() {
                        self.nextStep();
                    }, 1500);
                }
            };
            
            document.addEventListener('taskCompleted', taskHandler);
            this.eventListeners.push({
                element: document,
                type: 'taskCompleted',
                handler: taskHandler
            });
            
            // Handle window resize
            var resizeHandler = function() {
                if (self.tooltipElement && self.highlightedElement) {
                    self.positionTooltip(self.tooltipElement, self.highlightedElement);
                }
            };
            
            window.addEventListener('resize', resizeHandler);
            this.eventListeners.push({
                element: window,
                type: 'resize',
                handler: resizeHandler
            });
            
            // Handle escape key
            var keyHandler = function(e) {
                if (e.key === 'Escape' && self.isActive) {
                    self.skip();
                }
            };
            
            document.addEventListener('keydown', keyHandler);
            this.eventListeners.push({
                element: document,
                type: 'keydown',
                handler: keyHandler
            });
        },
        
        start: function() {
            this.isActive = true;
            this.currentStep = 0;
            this.showStep(0);
        },
        
        showStep: function(index) {
            var self = this;
            var step = this.steps[index];
            
            if (!step) {
                this.complete();
                return;
            }
            
            // Check skip condition
            if (step.skipCondition && step.skipCondition()) {
                this.currentStep++;
                this.showStep(this.currentStep);
                return;
            }
            
            // Remove previous tooltip
            this.removeTooltip();
            
            // Create and show new tooltip
            var tooltip = this.createTooltip(step);
            this.tooltipElement = tooltip;
            document.body.appendChild(tooltip);
            
            // Highlight element if specified
            if (step.highlight) {
                var element = document.querySelector(step.highlight);
                if (element) {
                    this.highlightedElement = element;
                    element.classList.add('onboarding-highlight');
                    this.positionTooltip(tooltip, element);
                    
                    // Scroll element into view
                    try {
                        element.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    } catch (e) {
                        // Fallback for older browsers
                        element.scrollIntoView(false);
                    }
                    
                    // Make element accessible
                    element.setAttribute('aria-describedby', 'onboarding-tooltip');
                } else {
                    // If element not found, center tooltip
                    this.centerTooltip(tooltip);
                }
            } else {
                // Center tooltip
                this.centerTooltip(tooltip);
            }
            
            // Animate in
            requestAnimationFrame(function() {
                tooltip.classList.add('show');
            });
            
            // Handle action button
            var actionBtn = tooltip.querySelector('.onboarding-action');
            if (actionBtn && !step.waitForAction) {
                actionBtn.onclick = function() {
                    self.nextStep();
                };
            }
            
            // Handle skip button
            var skipBtn = tooltip.querySelector('.onboarding-skip');
            if (skipBtn) {
                skipBtn.onclick = function() {
                    self.skip();
                };
            }
        },
        
        createTooltip: function(step) {
            var tooltip = document.createElement('div');
            tooltip.className = 'onboarding-tooltip';
            tooltip.setAttribute('role', 'dialog');
            tooltip.setAttribute('aria-label', step.title);
            
            var html = '<div class="tooltip-arrow"></div>';
            html += '<div class="tooltip-content">';
            html += '<h3>' + step.title + '</h3>';
            html += '<p>' + step.content + '</p>';
            
            if (!step.waitForAction) {
                html += '<button class="onboarding-action btn-primary">' + step.action + '</button>';
            }
            
            // Skip option
            if (this.currentStep === 0) {
                html += '<button class="onboarding-skip">Skip tour</button>';
            }
            
            // Progress indicator
            html += '<div class="onboarding-progress">';
            for (var i = 0; i < this.steps.length; i++) {
                html += '<span class="progress-dot' + (i === this.currentStep ? ' active' : '') + '"></span>';
            }
            html += '</div>';
            
            html += '</div>';
            tooltip.innerHTML = html;
            
            return tooltip;
        },
        
        positionTooltip: function(tooltip, targetElement) {
            try {
                var rect = targetElement.getBoundingClientRect();
                var tooltipRect = tooltip.getBoundingClientRect();
                var arrow = tooltip.querySelector('.tooltip-arrow');
                
                // Mobile adjustments
                var isMobile = window.innerWidth <= 768;
                var margin = isMobile ? 10 : 20;
                var gap = isMobile ? 10 : 20;
                
                // Calculate position
                var left = rect.left + (rect.width - tooltipRect.width) / 2;
                var top = rect.bottom + gap;
                
                // Boundary detection - horizontal
                if (left < margin) {
                    left = margin;
                } else if (left + tooltipRect.width > window.innerWidth - margin) {
                    left = window.innerWidth - tooltipRect.width - margin;
                }
                
                // Boundary detection - vertical
                var spaceBelow = window.innerHeight - rect.bottom - margin;
                var spaceAbove = rect.top - margin;
                
                if (spaceBelow < tooltipRect.height && spaceAbove > tooltipRect.height) {
                    // Position above
                    top = rect.top - tooltipRect.height - gap;
                    arrow.classList.add('bottom');
                } else {
                    // Position below or best fit
                    arrow.classList.remove('bottom');
                    
                    // Ensure tooltip stays on screen
                    if (top + tooltipRect.height > window.innerHeight - margin) {
                        top = window.innerHeight - tooltipRect.height - margin;
                    }
                }
                
                // Apply position
                tooltip.style.left = left + 'px';
                tooltip.style.top = top + 'px';
                
                // Position arrow
                var arrowLeft = Math.max(10, Math.min(tooltipRect.width - 30, rect.left + rect.width / 2 - left - 10));
                arrow.style.left = arrowLeft + 'px';
            } catch (error) {
                console.error('Onboarding: Error positioning tooltip', error);
                this.centerTooltip(tooltip);
            }
        },
        
        centerTooltip: function(tooltip) {
            var tooltipRect = tooltip.getBoundingClientRect();
            
            var left = (window.innerWidth - tooltipRect.width) / 2;
            var top = (window.innerHeight - tooltipRect.height) / 2;
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            
            // Hide arrow for centered tooltips
            var arrow = tooltip.querySelector('.tooltip-arrow');
            if (arrow) {
                arrow.style.display = 'none';
            }
        },
        
        nextStep: function() {
            this.currentStep++;
            this.showStep(this.currentStep);
        },
        
        skip: function() {
            var self = this;
            
            // Confirm skip
            if (confirm('Skip the tour? You can always restart it from settings.')) {
                this.complete();
            }
        },
        
        complete: function() {
            this.isActive = false;
            this.removeTooltip();
            
            // Save completion
            try {
                localStorage.setItem('onboarding_completed', 'true');
            } catch (error) {
                console.error('Onboarding: Failed to save completion status', error);
            }
            
            // Show completion message
            if (window.App && window.App.showNotification) {
                window.App.showNotification('Tour completed! Ready to use StackMap.', 'success');
            }
        },
        
        removeTooltip: function() {
            // Remove tooltip
            if (this.tooltipElement) {
                this.tooltipElement.classList.remove('show');
                var tooltip = this.tooltipElement;
                setTimeout(function() {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                }, 300);
                this.tooltipElement = null;
            }
            
            // Remove highlight
            if (this.highlightedElement) {
                this.highlightedElement.classList.remove('onboarding-highlight');
                this.highlightedElement = null;
            }
        },
        
        restart: function() {
            this.currentStep = 0;
            this.start();
        },
        
        hasCompleted: function() {
            return localStorage.getItem('onboarding_completed') === 'true';
        }
    };
    
    // Add cleanup method
    Onboarding.cleanup = function() {
        // Remove all event listeners
        this.eventListeners.forEach(function(listener) {
            listener.element.removeEventListener(listener.type, listener.handler);
        });
        this.eventListeners = [];
        
        // Remove tooltip
        this.removeTooltip();
        
        // Reset state
        this.isActive = false;
        this.currentStep = 0;
    };
    
    // Add destroy method for complete cleanup
    Onboarding.destroy = function() {
        this.cleanup();
        this.steps = [];
        this.tooltipElement = null;
        this.highlightedElement = null;
    };
    
    // Initialize
    Onboarding.init();
    
    // Export to window
    window.Onboarding = Onboarding;
})();