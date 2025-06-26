/**
 * Analytics Integration for StackMap
 * Connects analytics system with main application
 * Story #106 - Progress Analytics & Insights
 */

(function() {
    'use strict';
    
    const AnalyticsIntegration = {
        isInitialized: false,
        currentView: null,
        
        /**
         * Initialize analytics integration
         */
        init: function() {
            if (this.isInitialized) return;
            
            try {
                // Set up navigation handlers
                this.setupNavigation();
                
                // Initialize achievement system
                this.initializeAchievementSystem();
                
                // Set up view handlers
                this.setupViewHandlers();
                
                this.isInitialized = true;
                console.log('AnalyticsIntegration: Initialized successfully');
                
            } catch (error) {
                console.error('AnalyticsIntegration: Initialization failed', error);
            }
        },
        
        /**
         * Set up navigation to analytics view
         */
        setupNavigation: function() {
            // Add analytics link to settings view
            this.addAnalyticsNavigation();
            
            // Set up back button handler
            const backBtn = document.getElementById('analytics-back');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.navigateBack();
                });
            }
        },
        
        /**
         * Add analytics navigation to settings
         */
        addAnalyticsNavigation: function() {
            // Find the settings view content
            const settingsView = document.getElementById('settings-view');
            if (!settingsView) return;
            
            const settingsContent = settingsView.querySelector('.content');
            if (!settingsContent) return;
            
            // Create analytics section
            const analyticsSection = document.createElement('section');
            analyticsSection.className = 'analytics-navigation-section';
            analyticsSection.innerHTML = `
                <h2>Progress & Insights</h2>
                <div style="margin-bottom: 24px;">
                    <button id="view-analytics-btn" class="btn-primary" style="width: 100%; margin-bottom: 8px;">
                        📊 View Analytics Dashboard
                    </button>
                    <p class="form-helper" style="text-align: center; margin-top: 8px;">
                        Track your progress, view achievements, and get personalized insights
                    </p>
                </div>
            `;
            
            // Insert after help section but before about
            const aboutSection = settingsContent.querySelector('section:last-child');
            if (aboutSection) {
                settingsContent.insertBefore(analyticsSection, aboutSection);
            } else {
                settingsContent.appendChild(analyticsSection);
            }
            
            // Add click handler
            const analyticsBtn = document.getElementById('view-analytics-btn');
            if (analyticsBtn) {
                analyticsBtn.addEventListener('click', () => {
                    this.showAnalytics();
                });
            }
        },
        
        /**
         * Show analytics view
         */
        showAnalytics: function() {
            try {
                // Use view controller if available
                if (window.ViewController && typeof window.ViewController.show === 'function') {
                    window.ViewController.show('analytics-view');
                } else {
                    // Fallback direct navigation
                    this.showView('analytics-view');
                }
                
                // Initialize dashboard after view is shown
                setTimeout(() => {
                    this.initializeDashboard();
                }, 100);
                
            } catch (error) {
                console.error('AnalyticsIntegration: Failed to show analytics', error);
            }
        },
        
        /**
         * Navigate back from analytics
         */
        navigateBack: function() {
            try {
                if (window.ViewController && typeof window.ViewController.show === 'function') {
                    window.ViewController.show('settings-view');
                } else {
                    this.showView('settings-view');
                }
            } catch (error) {
                console.error('AnalyticsIntegration: Failed to navigate back', error);
            }
        },
        
        /**
         * Basic view switching fallback
         */
        showView: function(viewId) {
            // Hide all views
            const views = document.querySelectorAll('.view');
            views.forEach(view => {
                view.classList.add('hidden');
            });
            
            // Show target view
            const targetView = document.getElementById(viewId);
            if (targetView) {
                targetView.classList.remove('hidden');
                this.currentView = viewId;
            }
        },
        
        /**
         * Initialize analytics dashboard
         */
        initializeDashboard: function() {
            try {
                // Check if analytics dashboard is available
                if (!window.AnalyticsDashboard) {
                    console.warn('AnalyticsIntegration: AnalyticsDashboard not available');
                    this.showDashboardFallback();
                    return;
                }
                
                // Initialize dashboard
                const success = window.AnalyticsDashboard.init('analytics-dashboard-container');
                if (!success) {
                    console.warn('AnalyticsIntegration: Dashboard initialization failed');
                    this.showDashboardFallback();
                }
                
            } catch (error) {
                console.error('AnalyticsIntegration: Dashboard initialization error', error);
                this.showDashboardFallback();
            }
        },
        
        /**
         * Show fallback when dashboard fails
         */
        showDashboardFallback: function() {
            const container = document.getElementById('analytics-dashboard-container');
            if (!container) return;
            
            container.innerHTML = `
                <div class="dashboard-message">
                    <div class="message-icon">📊</div>
                    <h3>Analytics Loading</h3>
                    <p>Your analytics dashboard is being prepared. Please try again in a moment.</p>
                    <button onclick="location.reload()" class="retry-btn">Reload Page</button>
                </div>
            `;
        },
        
        /**
         * Initialize achievement system
         */
        initializeAchievementSystem: function() {
            try {
                if (window.AchievementSystem && typeof window.AchievementSystem.init === 'function') {
                    window.AchievementSystem.init();
                }
            } catch (error) {
                console.warn('AnalyticsIntegration: Achievement system initialization failed', error);
            }
        },
        
        /**
         * Set up view event handlers
         */
        setupViewHandlers: function() {
            // Listen for view changes to refresh analytics
            document.addEventListener('viewChanged', (event) => {
                if (event.detail && event.detail.view === 'analytics-view') {
                    // Refresh dashboard when analytics view is shown
                    setTimeout(() => {
                        this.refreshDashboard();
                    }, 200);
                }
            });
            
            // Listen for activity updates to check achievements
            document.addEventListener('activityCompleted', (event) => {
                this.checkAchievements(event.detail);
            });
            
            document.addEventListener('activityUpdated', (event) => {
                this.checkAchievements(event.detail);
            });
        },
        
        /**
         * Refresh dashboard data
         */
        refreshDashboard: function() {
            try {
                if (window.AnalyticsDashboard && typeof window.AnalyticsDashboard.refresh === 'function') {
                    window.AnalyticsDashboard.refresh();
                }
            } catch (error) {
                console.warn('AnalyticsIntegration: Dashboard refresh failed', error);
            }
        },
        
        /**
         * Check achievements for activity events
         */
        checkAchievements: function(eventDetail) {
            try {
                if (!window.AchievementSystem || !eventDetail || !eventDetail.userId) {
                    return;
                }
                
                // Delay check to allow data to be saved
                setTimeout(() => {
                    if (typeof window.AchievementSystem.checkUserAchievements === 'function') {
                        window.AchievementSystem.checkUserAchievements(eventDetail.userId);
                    }
                }, 1000);
                
            } catch (error) {
                console.warn('AnalyticsIntegration: Achievement check failed', error);
            }
        },
        
        /**
         * Get current user for analytics
         */
        getCurrentUser: function() {
            try {
                if (window.UserContext && typeof window.UserContext.getCurrentUserId === 'function') {
                    return window.UserContext.getCurrentUserId();
                }
                return null;
            } catch (error) {
                console.warn('AnalyticsIntegration: Failed to get current user', error);
                return null;
            }
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            AnalyticsIntegration.init();
        });
    } else {
        AnalyticsIntegration.init();
    }
    
    // Export to global scope
    window.AnalyticsIntegration = AnalyticsIntegration;
    
})();