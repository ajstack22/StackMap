/**
 * Analytics Dashboard for StackMap
 * Main dashboard interface for viewing progress analytics and insights
 * Story #106 - Progress Analytics & Insights
 */

(function() {
    'use strict';
    
    const AnalyticsDashboard = {
        // Dashboard state
        container: null,
        currentTimeframe: 'week',
        currentUserId: null,
        widgets: [],
        isInitialized: false,
        
        // Update tracking
        lastUpdate: 0,
        updateInterval: null,
        
        // Widget configurations
        defaultWidgets: [
            { type: 'completion-rate', title: 'Completion Rate', order: 0, enabled: true },
            { type: 'current-streak', title: 'Current Streak', order: 1, enabled: true },
            { type: 'activity-distribution', title: 'Activity Types', order: 2, enabled: true },
            { type: 'productivity-heatmap', title: 'Productivity by Hour', order: 3, enabled: true },
            { type: 'achievements', title: 'Recent Achievements', order: 4, enabled: true },
            { type: 'insights', title: 'Insights & Tips', order: 5, enabled: true }
        ],
        
        /**
         * Initialize the analytics dashboard
         */
        init: function(containerId) {
            const self = this;
            
            // Find container
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error('AnalyticsDashboard: Container not found');
                return false;
            }
            
            // Get current user
            this.currentUserId = window.UserContext ? window.UserContext.getCurrentUserId() : null;
            if (!this.currentUserId) {
                this.showNoUserMessage();
                return false;
            }
            
            // Load dashboard configuration
            this.loadDashboardConfig();
            
            // Create dashboard structure
            this.createDashboardStructure();
            
            // Load and display data
            this.loadDashboardData();
            
            // Set up auto-refresh
            this.setupAutoRefresh();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('AnalyticsDashboard: Initialized');
            
            return true;
        },
        
        /**
         * Create the basic dashboard structure
         */
        createDashboardStructure: function() {
            this.container.innerHTML = `
                <div class="analytics-dashboard">
                    <div class="dashboard-header">
                        <div class="dashboard-title">
                            <h2>Your Progress</h2>
                            <p class="dashboard-subtitle">See how you're doing and celebrate your achievements!</p>
                        </div>
                        <div class="dashboard-controls">
                            <div class="timeframe-selector">
                                <button class="timeframe-btn active" data-timeframe="week">Week</button>
                                <button class="timeframe-btn" data-timeframe="month">Month</button>
                                <button class="timeframe-btn" data-timeframe="quarter">Quarter</button>
                            </div>
                            <button class="dashboard-settings-btn" aria-label="Dashboard Settings">⚙️</button>
                        </div>
                    </div>
                    
                    <div class="dashboard-content">
                        <div class="quick-stats"></div>
                        <div class="dashboard-widgets"></div>
                    </div>
                    
                    <div class="dashboard-footer">
                        <div class="last-updated">Last updated: <span class="update-time">Loading...</span></div>
                        <button class="refresh-btn">🔄 Refresh</button>
                    </div>
                </div>
            `;
        },
        
        /**
         * Load dashboard data and render widgets
         */
        loadDashboardData: function() {
            const self = this;
            
            if (!this.currentUserId) {
                this.showNoUserMessage();
                return;
            }
            
            try {
                // Get user activities
                const userActivities = this.getUserActivities();
                if (!userActivities) {
                    this.showNoDataMessage();
                    return;
                }
                
                // Generate analytics report
                const analyticsData = window.ProgressAnalytics.generateReport(
                    userActivities, 
                    this.currentTimeframe
                );
                
                // Get user achievements
                const achievements = window.AchievementSystem ? 
                    window.AchievementSystem.getUserAchievements(this.currentUserId) : [];
                
                // Check for new achievements
                if (window.AchievementSystem) {
                    window.AchievementSystem.checkAchievements(this.currentUserId, userActivities);
                }
                
                // Render quick stats
                this.renderQuickStats(analyticsData);
                
                // Render widgets
                this.renderWidgets(analyticsData, achievements);
                
                // Update timestamp
                this.updateLastUpdatedTime();
                
                this.lastUpdate = Date.now();
                
            } catch (error) {
                console.error('AnalyticsDashboard: Error loading data', error);
                this.showErrorMessage('Failed to load analytics data');
            }
        },
        
        /**
         * Get user activities from data source
         */
        getUserActivities: function() {
            if (window.UserDataManager) {
                return window.UserDataManager.getAllActivitiesForUser(this.currentUserId);
            } else if (window.ActivityDisplay) {
                return window.ActivityDisplay.getUserActivities();
            } else {
                return [];
            }
        },
        
        /**
         * Render quick stats section
         */
        renderQuickStats: function(analyticsData) {
            const quickStatsContainer = this.container.querySelector('.quick-stats');
            if (!quickStatsContainer) return;
            
            const metrics = analyticsData.metrics;
            const completionRate = Math.round(metrics.completion.rate * 100);
            const currentStreak = metrics.completion.streak;
            const totalCompleted = metrics.completion.count;
            
            quickStatsContainer.innerHTML = `
                <div class="quick-stat-card completion-rate">
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-value">${completionRate}%</div>
                        <div class="stat-label">Completion Rate</div>
                    </div>
                </div>
                
                <div class="quick-stat-card current-streak">
                    <div class="stat-icon">${currentStreak >= 7 ? '🔥' : '⚡'}</div>
                    <div class="stat-content">
                        <div class="stat-value">${currentStreak}</div>
                        <div class="stat-label">${currentStreak === 1 ? 'Day Streak' : 'Days Streak'}</div>
                    </div>
                </div>
                
                <div class="quick-stat-card total-completed">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-value">${totalCompleted}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                </div>
            `;
        },
        
        /**
         * Render all dashboard widgets
         */
        renderWidgets: function(analyticsData, achievements) {
            const widgetsContainer = this.container.querySelector('.dashboard-widgets');
            if (!widgetsContainer) return;
            
            // Clear existing widgets
            widgetsContainer.innerHTML = '';
            
            // Render enabled widgets in order
            const enabledWidgets = this.widgets
                .filter(w => w.enabled)
                .sort((a, b) => a.order - b.order);
            
            enabledWidgets.forEach(widget => {
                this.renderWidget(widgetsContainer, widget, analyticsData, achievements);
            });
        },
        
        /**
         * Render individual widget
         */
        renderWidget: function(container, widgetConfig, analyticsData, achievements) {
            const widgetElement = document.createElement('div');
            widgetElement.className = `dashboard-widget widget-${widgetConfig.type}`;
            widgetElement.innerHTML = `
                <div class="widget-header">
                    <h3 class="widget-title">${widgetConfig.title}</h3>
                    <div class="widget-actions">
                        <button class="widget-action-btn" data-action="info" aria-label="Widget info">ℹ️</button>
                    </div>
                </div>
                <div class="widget-content" id="widget-${widgetConfig.type}-content"></div>
            `;
            
            container.appendChild(widgetElement);
            
            // Render widget content based on type
            const contentContainer = widgetElement.querySelector('.widget-content');
            
            switch (widgetConfig.type) {
                case 'completion-rate':
                    this.renderCompletionRateWidget(contentContainer, analyticsData);
                    break;
                    
                case 'current-streak':
                    this.renderCurrentStreakWidget(contentContainer, analyticsData);
                    break;
                    
                case 'activity-distribution':
                    this.renderActivityDistributionWidget(contentContainer, analyticsData);
                    break;
                    
                case 'productivity-heatmap':
                    this.renderProductivityHeatmapWidget(contentContainer, analyticsData);
                    break;
                    
                case 'achievements':
                    this.renderAchievementsWidget(contentContainer, achievements);
                    break;
                    
                case 'insights':
                    this.renderInsightsWidget(contentContainer, analyticsData);
                    break;
                    
                default:
                    contentContainer.innerHTML = '<p>Widget type not implemented</p>';
            }
        },
        
        /**
         * Render completion rate widget
         */
        renderCompletionRateWidget: function(container, analyticsData) {
            const completionRate = analyticsData.metrics.completion.rate * 100;
            
            // Create progress ring
            if (window.DataVisualizer) {
                window.DataVisualizer.createProgressRing(container, completionRate, {
                    size: 120,
                    color: '#48bb78',
                    label: 'Complete'
                });
            } else {
                container.innerHTML = `<div class="fallback-metric">${Math.round(completionRate)}% Complete</div>`;
            }
            
            // Add trend information
            const trend = analyticsData.trends.completionTrend;
            if (trend !== 0) {
                const trendElement = document.createElement('div');
                trendElement.className = `trend-indicator ${trend > 0 ? 'positive' : 'negative'}`;
                trendElement.innerHTML = `
                    <span class="trend-arrow">${trend > 0 ? '↗️' : '↘️'}</span>
                    <span class="trend-text">${Math.abs(Math.round(trend * 100))}% vs last period</span>
                `;
                container.appendChild(trendElement);
            }
        },
        
        /**
         * Render current streak widget
         */
        renderCurrentStreakWidget: function(container, analyticsData) {
            const streak = analyticsData.metrics.completion.streak;
            const bestStreak = analyticsData.metrics.completion.bestStreak;
            
            container.innerHTML = `
                <div class="streak-display">
                    <div class="current-streak">
                        <div class="streak-number">${streak}</div>
                        <div class="streak-label">${streak === 1 ? 'Day' : 'Days'}</div>
                        <div class="streak-emoji">${streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '💪'}</div>
                    </div>
                    
                    <div class="streak-stats">
                        <div class="streak-stat">
                            <span class="stat-label">Personal Best:</span>
                            <span class="stat-value">${bestStreak} days</span>
                        </div>
                        ${streak > 0 ? `
                        <div class="streak-encouragement">
                            ${this.getStreakEncouragement(streak)}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            // Add streak calendar if DataVisualizer is available
            if (window.DataVisualizer && analyticsData.metrics.completion.streakHistory) {
                const calendarContainer = document.createElement('div');
                calendarContainer.className = 'streak-calendar-container';
                container.appendChild(calendarContainer);
                
                window.DataVisualizer.createStreakCalendar(calendarContainer, {
                    streakHistory: analyticsData.metrics.completion.streakHistory
                });
            }
        },
        
        /**
         * Get encouraging message for streak
         */
        getStreakEncouragement: function(streak) {
            if (streak >= 30) return "🌟 Incredible! You're a consistency master!";
            if (streak >= 14) return "🎉 Two weeks strong! You're unstoppable!";
            if (streak >= 7) return "🔥 One week streak! You're on fire!";
            if (streak >= 3) return "⚡ Building momentum! Keep it up!";
            return "💪 Great start! Every day counts!";
        },
        
        /**
         * Render activity distribution widget
         */
        renderActivityDistributionWidget: function(container, analyticsData) {
            if (window.DataVisualizer) {
                window.DataVisualizer.createTypeDistributionChart(container, analyticsData.metrics.distribution, {
                    width: 250,
                    height: 250
                });
            } else {
                // Fallback text representation
                const distribution = analyticsData.metrics.distribution.byType;
                const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
                
                if (total === 0) {
                    container.innerHTML = '<p class="no-data">No activity data available</p>';
                    return;
                }
                
                let html = '<div class="distribution-list">';
                Object.entries(distribution).forEach(([type, count]) => {
                    const percentage = Math.round((count / total) * 100);
                    html += `
                        <div class="distribution-item">
                            <span class="type-name">${type}</span>
                            <span class="type-count">${count}</span>
                            <span class="type-percentage">(${percentage}%)</span>
                        </div>
                    `;
                });
                html += '</div>';
                container.innerHTML = html;
            }
        },
        
        /**
         * Render productivity heatmap widget
         */
        renderProductivityHeatmapWidget: function(container, analyticsData) {
            if (window.DataVisualizer) {
                window.DataVisualizer.createProductivityHeatmap(container, analyticsData.metrics.distribution);
            } else {
                // Fallback: show peak hours
                const peakHours = analyticsData.metrics.timing.peakHours || [];
                if (peakHours.length > 0) {
                    const formattedHours = peakHours.map(hour => {
                        const period = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                        return `${displayHour}${period}`;
                    });
                    
                    container.innerHTML = `
                        <div class="peak-hours">
                            <h4>Your Peak Hours</h4>
                            <div class="peak-hours-list">${formattedHours.join(', ')}</div>
                            <p class="peak-hours-tip">Schedule important tasks during these times!</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = '<p class="no-data">Complete more activities to see your productivity patterns</p>';
                }
            }
        },
        
        /**
         * Render achievements widget
         */
        renderAchievementsWidget: function(container, achievements) {
            if (window.DataVisualizer) {
                window.DataVisualizer.createAchievementShowcase(container, achievements, { limit: 3 });
            } else {
                // Fallback achievement display
                const recentAchievements = achievements
                    .filter(a => a.isUnlocked)
                    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
                    .slice(0, 3);
                
                if (recentAchievements.length === 0) {
                    container.innerHTML = `
                        <div class="no-achievements">
                            <p>🏆 Complete activities to unlock achievements!</p>
                        </div>
                    `;
                } else {
                    let html = '<div class="achievement-list">';
                    recentAchievements.forEach(achievement => {
                        html += `
                            <div class="achievement-item">
                                <div class="achievement-icon">${achievement.icon}</div>
                                <div class="achievement-info">
                                    <div class="achievement-title">${achievement.title}</div>
                                    <div class="achievement-points">+${achievement.points} points</div>
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                    container.innerHTML = html;
                }
            }
        },
        
        /**
         * Render insights widget
         */
        renderInsightsWidget: function(container, analyticsData) {
            const insights = analyticsData.insights || [];
            const recommendations = analyticsData.recommendations || [];
            
            const allInsights = [...insights, ...recommendations]
                .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                .slice(0, 3);
            
            if (allInsights.length === 0) {
                container.innerHTML = `
                    <div class="no-insights">
                        <p>💡 Complete more activities to get personalized insights!</p>
                    </div>
                `;
                return;
            }
            
            let html = '<div class="insights-list">';
            allInsights.forEach(insight => {
                html += `
                    <div class="insight-card insight-${insight.type}">
                        <div class="insight-icon">${insight.icon}</div>
                        <div class="insight-content">
                            <div class="insight-title">${insight.title}</div>
                            <div class="insight-description">${insight.description}</div>
                            ${insight.actionable ? '<div class="insight-action">💡 Actionable</div>' : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            const self = this;
            
            // Timeframe selector
            const timeframeButtons = this.container.querySelectorAll('.timeframe-btn');
            timeframeButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    // Update active state
                    timeframeButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update timeframe and reload
                    self.currentTimeframe = this.dataset.timeframe;
                    self.loadDashboardData();
                });
            });
            
            // Refresh button
            const refreshBtn = this.container.querySelector('.refresh-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    self.loadDashboardData();
                });
            }
            
            // Settings button
            const settingsBtn = this.container.querySelector('.dashboard-settings-btn');
            if (settingsBtn) {
                settingsBtn.addEventListener('click', () => {
                    self.showDashboardSettings();
                });
            }
        },
        
        /**
         * Setup auto-refresh
         */
        setupAutoRefresh: function() {
            // Refresh every 5 minutes
            this.updateInterval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    this.loadDashboardData();
                }
            }, 5 * 60 * 1000);
        },
        
        /**
         * Update last updated timestamp
         */
        updateLastUpdatedTime: function() {
            const updateTimeElement = this.container.querySelector('.update-time');
            if (updateTimeElement) {
                updateTimeElement.textContent = new Date().toLocaleTimeString();
            }
        },
        
        /**
         * Show dashboard settings modal
         */
        showDashboardSettings: function() {
            // Create simple settings modal
            const modal = document.createElement('div');
            modal.className = 'dashboard-settings-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Dashboard Settings</h3>
                        <button class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="setting-group">
                            <h4>Visible Widgets</h4>
                            <div class="widget-toggles">
                                ${this.widgets.map(widget => `
                                    <label class="widget-toggle">
                                        <input type="checkbox" data-widget="${widget.type}" ${widget.enabled ? 'checked' : ''}>
                                        <span>${widget.title}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary modal-cancel">Cancel</button>
                        <button class="btn-primary modal-save">Save</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Setup modal handlers
            const closeModal = () => {
                document.body.removeChild(modal);
            };
            
            modal.querySelector('.modal-close').addEventListener('click', closeModal);
            modal.querySelector('.modal-cancel').addEventListener('click', closeModal);
            modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
            
            modal.querySelector('.modal-save').addEventListener('click', () => {
                // Save widget settings
                const toggles = modal.querySelectorAll('.widget-toggle input');
                toggles.forEach(toggle => {
                    const widget = this.widgets.find(w => w.type === toggle.dataset.widget);
                    if (widget) {
                        widget.enabled = toggle.checked;
                    }
                });
                
                this.saveDashboardConfig();
                this.renderWidgets();
                closeModal();
            });
        },
        
        /**
         * Load dashboard configuration
         */
        loadDashboardConfig: function() {
            try {
                const saved = localStorage.getItem('stackmap_dashboard_config');
                if (saved) {
                    const config = JSON.parse(saved);
                    this.widgets = config.widgets || this.defaultWidgets;
                    this.currentTimeframe = config.timeframe || 'week';
                } else {
                    this.widgets = [...this.defaultWidgets];
                }
            } catch (error) {
                console.warn('AnalyticsDashboard: Failed to load config', error);
                this.widgets = [...this.defaultWidgets];
            }
        },
        
        /**
         * Save dashboard configuration
         */
        saveDashboardConfig: function() {
            try {
                const config = {
                    widgets: this.widgets,
                    timeframe: this.currentTimeframe
                };
                localStorage.setItem('stackmap_dashboard_config', JSON.stringify(config));
            } catch (error) {
                console.warn('AnalyticsDashboard: Failed to save config', error);
            }
        },
        
        /**
         * Show no user message
         */
        showNoUserMessage: function() {
            this.container.innerHTML = `
                <div class="dashboard-message">
                    <div class="message-icon">👤</div>
                    <h3>No User Selected</h3>
                    <p>Please select a user to view analytics.</p>
                </div>
            `;
        },
        
        /**
         * Show no data message
         */
        showNoDataMessage: function() {
            this.container.innerHTML = `
                <div class="dashboard-message">
                    <div class="message-icon">📊</div>
                    <h3>No Data Available</h3>
                    <p>Start completing activities to see your progress analytics!</p>
                </div>
            `;
        },
        
        /**
         * Show error message
         */
        showErrorMessage: function(message) {
            this.container.innerHTML = `
                <div class="dashboard-message error">
                    <div class="message-icon">⚠️</div>
                    <h3>Error Loading Analytics</h3>
                    <p>${message}</p>
                    <button class="retry-btn" onclick="AnalyticsDashboard.loadDashboardData()">Retry</button>
                </div>
            `;
        },
        
        /**
         * Switch timeframe
         */
        switchTimeframe: function(timeframe) {
            if (window.AnalyticsDataModel.TIMEFRAMES[timeframe.toUpperCase()]) {
                this.currentTimeframe = timeframe;
                this.loadDashboardData();
                this.saveDashboardConfig();
            }
        },
        
        /**
         * Refresh dashboard
         */
        refresh: function() {
            this.loadDashboardData();
        },
        
        /**
         * Clean up dashboard
         */
        destroy: function() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            
            if (window.DataVisualizer) {
                window.DataVisualizer.destroy();
            }
            
            this.isInitialized = false;
        }
    };
    
    // Export to global scope
    window.AnalyticsDashboard = AnalyticsDashboard;
    
})();