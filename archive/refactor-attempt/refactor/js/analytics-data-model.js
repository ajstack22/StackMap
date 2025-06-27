/**
 * Analytics Data Model for StackMap
 * Defines data structures for progress tracking and insights
 * Story #106 - Progress Analytics & Insights
 */

(function() {
    'use strict';
    
    const AnalyticsDataModel = {
        // Supported timeframes for analytics
        TIMEFRAMES: {
            DAY: 'day',
            WEEK: 'week',
            MONTH: 'month',
            QUARTER: 'quarter',
            YEAR: 'year'
        },
        
        // Metric categories
        METRIC_TYPES: {
            COMPLETION: 'completion',
            TIMING: 'timing',
            DISTRIBUTION: 'distribution',
            PATTERNS: 'patterns',
            ACHIEVEMENTS: 'achievements'
        },
        
        // Achievement categories
        ACHIEVEMENT_TYPES: {
            STREAK: 'streak',
            MILESTONE: 'milestone',
            IMPROVEMENT: 'improvement',
            CONSISTENCY: 'consistency',
            SPECIAL: 'special'
        },
        
        // Insight types
        INSIGHT_TYPES: {
            POSITIVE: 'positive',
            PATTERN: 'pattern',
            SUGGESTION: 'suggestion',
            CELEBRATION: 'celebration',
            RECOMMENDATION: 'recommendation'
        },
        
        /**
         * Create empty analytics data structure
         */
        createAnalyticsData: function(timeframe = 'week') {
            return {
                timeframe: timeframe,
                generatedAt: new Date().toISOString(),
                period: this.calculatePeriod(timeframe),
                
                metrics: {
                    completion: {
                        rate: 0,
                        count: 0,
                        totalActivities: 0,
                        streak: 0,
                        bestStreak: 0,
                        streakHistory: []
                    },
                    timing: {
                        averageDuration: 0,
                        totalTimeSpent: 0,
                        peakHours: [],
                        scheduleAdherence: 0,
                        timeEstimationAccuracy: 0
                    },
                    distribution: {
                        byType: {
                            recurring: 0,
                            frequent: 0,
                            singleUse: 0
                        },
                        byDay: {},
                        byHour: {},
                        byCategory: {}
                    },
                    trends: {
                        completionTrend: 0, // positive/negative percentage
                        productivityTrend: 0,
                        consistencyTrend: 0
                    }
                },
                
                patterns: {
                    mostProductiveDay: null,
                    mostProductiveHour: null,
                    preferredActivityTypes: [],
                    energyPatterns: {},
                    scheduleOptimization: []
                },
                
                achievements: [],
                insights: [],
                recommendations: []
            };
        },
        
        /**
         * Calculate period start/end dates for timeframe
         */
        calculatePeriod: function(timeframe) {
            const now = new Date();
            const period = {
                start: new Date(now),
                end: new Date(now)
            };
            
            switch (timeframe) {
                case this.TIMEFRAMES.DAY:
                    period.start.setHours(0, 0, 0, 0);
                    period.end.setHours(23, 59, 59, 999);
                    break;
                    
                case this.TIMEFRAMES.WEEK:
                    const dayOfWeek = now.getDay();
                    period.start.setDate(now.getDate() - dayOfWeek);
                    period.start.setHours(0, 0, 0, 0);
                    period.end.setDate(period.start.getDate() + 6);
                    period.end.setHours(23, 59, 59, 999);
                    break;
                    
                case this.TIMEFRAMES.MONTH:
                    period.start.setDate(1);
                    period.start.setHours(0, 0, 0, 0);
                    period.end.setMonth(period.start.getMonth() + 1);
                    period.end.setDate(0);
                    period.end.setHours(23, 59, 59, 999);
                    break;
                    
                case this.TIMEFRAMES.QUARTER:
                    const quarter = Math.floor(now.getMonth() / 3);
                    period.start.setMonth(quarter * 3, 1);
                    period.start.setHours(0, 0, 0, 0);
                    period.end.setMonth(quarter * 3 + 3, 0);
                    period.end.setHours(23, 59, 59, 999);
                    break;
                    
                case this.TIMEFRAMES.YEAR:
                    period.start.setMonth(0, 1);
                    period.start.setHours(0, 0, 0, 0);
                    period.end.setMonth(11, 31);
                    period.end.setHours(23, 59, 59, 999);
                    break;
            }
            
            return {
                start: period.start.toISOString(),
                end: period.end.toISOString(),
                label: this.formatPeriodLabel(timeframe, period.start, period.end)
            };
        },
        
        /**
         * Format period label for display
         */
        formatPeriodLabel: function(timeframe, start, end) {
            const options = { 
                month: 'short', 
                day: 'numeric',
                year: start.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            };
            
            switch (timeframe) {
                case this.TIMEFRAMES.DAY:
                    return start.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                    
                case this.TIMEFRAMES.WEEK:
                    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
                    
                case this.TIMEFRAMES.MONTH:
                    return start.toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                    });
                    
                case this.TIMEFRAMES.QUARTER:
                    const quarter = Math.floor(start.getMonth() / 3) + 1;
                    return `Q${quarter} ${start.getFullYear()}`;
                    
                case this.TIMEFRAMES.YEAR:
                    return start.getFullYear().toString();
                    
                default:
                    return 'Custom Period';
            }
        },
        
        /**
         * Create achievement data structure
         */
        createAchievement: function(config) {
            return {
                id: config.id || this.generateAchievementId(),
                type: config.type,
                category: config.category,
                title: config.title,
                description: config.description,
                icon: config.icon || '🏆',
                value: config.value || 0,
                threshold: config.threshold,
                unlockedAt: config.unlocked ? new Date().toISOString() : null,
                progress: config.progress || 0,
                isUnlocked: config.unlocked || false,
                isHidden: config.hidden || false,
                rarity: config.rarity || 'common', // common, rare, epic, legendary
                points: config.points || 10
            };
        },
        
        /**
         * Create insight data structure
         */
        createInsight: function(config) {
            return {
                id: config.id || this.generateInsightId(),
                type: config.type,
                title: config.title,
                description: config.description,
                icon: config.icon || '💡',
                confidence: config.confidence || 0.8,
                priority: config.priority || 'medium',
                actionable: config.actionable || false,
                action: config.action || null,
                data: config.data || {},
                generatedAt: new Date().toISOString(),
                viewedAt: null,
                dismissedAt: null,
                helpfulVotes: 0,
                isNew: true
            };
        },
        
        /**
         * Create recommendation data structure
         */
        createRecommendation: function(config) {
            return {
                id: config.id || this.generateRecommendationId(),
                type: config.type, // schedule, balance, timing, energy
                title: config.title,
                description: config.description,
                icon: config.icon || '💡',
                confidence: config.confidence || 0.7,
                impact: config.impact || 'medium', // low, medium, high
                effort: config.effort || 'low', // low, medium, high
                action: config.action,
                data: config.data || {},
                generatedAt: new Date().toISOString(),
                appliedAt: null,
                dismissedAt: null,
                effectivenessRating: null
            };
        },
        
        /**
         * Generate unique IDs
         */
        generateAchievementId: function() {
            return `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },
        
        generateInsightId: function() {
            return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },
        
        generateRecommendationId: function() {
            return `recommendation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },
        
        /**
         * Achievement definitions
         */
        ACHIEVEMENT_DEFINITIONS: {
            // Streak achievements
            'week-warrior': {
                type: 'streak',
                category: 'consistency',
                title: 'Week Warrior',
                description: 'Complete activities for 7 days straight',
                icon: '🔥',
                threshold: 7,
                rarity: 'common',
                points: 25
            },
            'month-master': {
                type: 'streak',
                category: 'consistency',
                title: 'Month Master',
                description: 'Complete activities for 30 days straight',
                icon: '⭐',
                threshold: 30,
                rarity: 'rare',
                points: 100
            },
            'century-streaker': {
                type: 'streak',
                category: 'consistency',
                title: 'Century Streaker',
                description: 'Complete activities for 100 days straight',
                icon: '💯',
                threshold: 100,
                rarity: 'epic',
                points: 500
            },
            
            // Milestone achievements
            'first-hundred': {
                type: 'milestone',
                category: 'completion',
                title: 'Century Club',
                description: 'Complete 100 activities',
                icon: '💪',
                threshold: 100,
                rarity: 'common',
                points: 50
            },
            'half-k-hero': {
                type: 'milestone',
                category: 'completion',
                title: 'Half-K Hero',
                description: 'Complete 500 activities',
                icon: '🚀',
                threshold: 500,
                rarity: 'rare',
                points: 200
            },
            'thousand-titan': {
                type: 'milestone',
                category: 'completion',
                title: 'Thousand Titan',
                description: 'Complete 1,000 activities',
                icon: '👑',
                threshold: 1000,
                rarity: 'legendary',
                points: 1000
            },
            
            // Improvement achievements
            'time-wizard': {
                type: 'improvement',
                category: 'accuracy',
                title: 'Time Wizard',
                description: 'Achieve 90% time estimation accuracy',
                icon: '🔮',
                threshold: 0.9,
                rarity: 'rare',
                points: 150
            },
            'completion-champion': {
                type: 'improvement',
                category: 'completion',
                title: 'Completion Champion',
                description: 'Maintain 90% completion rate for 30 days',
                icon: '🏆',
                threshold: 0.9,
                rarity: 'epic',
                points: 300
            },
            'balance-master': {
                type: 'improvement',
                category: 'balance',
                title: 'Balance Master',
                description: 'Maintain balanced activity types for 30 days',
                icon: '⚖️',
                threshold: 30,
                rarity: 'rare',
                points: 200
            },
            
            // Special achievements
            'early-bird': {
                type: 'special',
                category: 'timing',
                title: 'Early Bird',
                description: 'Complete morning activities for 30 days',
                icon: '🐦',
                threshold: 30,
                rarity: 'common',
                points: 75
            },
            'night-owl': {
                type: 'special',
                category: 'timing',
                title: 'Night Owl',
                description: 'Complete evening activities for 30 days',
                icon: '🦉',
                threshold: 30,
                rarity: 'common',
                points: 75
            },
            'streak-saver': {
                type: 'special',
                category: 'resilience',
                title: 'Streak Saver',
                description: 'Recover a streak within 24 hours',
                icon: '🛡️',
                threshold: 1,
                rarity: 'rare',
                points: 100
            }
        },
        
        /**
         * Validate analytics data structure
         */
        validateAnalyticsData: function(data) {
            const errors = [];
            
            if (!data || typeof data !== 'object') {
                errors.push('Analytics data must be an object');
                return errors;
            }
            
            // Check required fields
            const requiredFields = ['timeframe', 'generatedAt', 'period', 'metrics'];
            requiredFields.forEach(field => {
                if (!data[field]) {
                    errors.push(`Missing required field: ${field}`);
                }
            });
            
            // Validate timeframe
            if (data.timeframe && !Object.values(this.TIMEFRAMES).includes(data.timeframe)) {
                errors.push(`Invalid timeframe: ${data.timeframe}`);
            }
            
            // Validate metrics structure
            if (data.metrics) {
                if (!data.metrics.completion) {
                    errors.push('Missing completion metrics');
                }
                if (!data.metrics.timing) {
                    errors.push('Missing timing metrics');
                }
                if (!data.metrics.distribution) {
                    errors.push('Missing distribution metrics');
                }
            }
            
            return errors;
        },
        
        /**
         * Get default dashboard configuration
         */
        getDefaultDashboardConfig: function() {
            return {
                timeframe: this.TIMEFRAMES.WEEK,
                widgets: [
                    { type: 'completion-rate', enabled: true, order: 0 },
                    { type: 'current-streak', enabled: true, order: 1 },
                    { type: 'activity-distribution', enabled: true, order: 2 },
                    { type: 'productivity-heatmap', enabled: true, order: 3 },
                    { type: 'achievements', enabled: true, order: 4 },
                    { type: 'insights', enabled: true, order: 5 }
                ],
                preferences: {
                    showPercentages: true,
                    showTrends: true,
                    enableAnimations: !window.StackMapSafeMode,
                    enableCelebrations: true,
                    positiveFraming: true
                }
            };
        }
    };
    
    // Export to global scope
    window.AnalyticsDataModel = AnalyticsDataModel;
    
})();