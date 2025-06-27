/**
 * Progress Analytics Engine for StackMap
 * Calculates metrics, patterns, and insights from activity data
 * Story #106 - Progress Analytics & Insights
 */

(function() {
    'use strict';
    
    const ProgressAnalytics = {
        // Cache for performance
        cache: {
            data: null,
            timestamp: 0,
            ttl: 300000 // 5 minutes
        },
        
        /**
         * Generate comprehensive analytics report
         */
        generateReport: function(activities, timeframe = 'week', options = {}) {
            const self = this;
            
            // Check cache first
            const cacheKey = `${timeframe}_${activities.length}_${this.getActivitiesHash(activities)}`;
            if (this.cache.data && this.cache.data.cacheKey === cacheKey && 
                (Date.now() - this.cache.timestamp) < this.cache.ttl) {
                return this.cache.data.report;
            }
            
            try {
                // Create base analytics structure
                const analyticsData = window.AnalyticsDataModel.createAnalyticsData(timeframe);
                
                // Filter activities for the timeframe
                const filteredActivities = this.filterActivitiesByTimeframe(activities, analyticsData.period);
                
                // Calculate core metrics
                analyticsData.metrics = this.calculateMetrics(filteredActivities, timeframe);
                
                // Identify patterns
                analyticsData.patterns = this.identifyPatterns(filteredActivities, timeframe);
                
                // Generate insights
                analyticsData.insights = this.generateInsights(analyticsData, filteredActivities);
                
                // Generate recommendations
                analyticsData.recommendations = this.generateRecommendations(analyticsData, filteredActivities);
                
                // Calculate trends if we have historical data
                if (options.includeHistoricalComparison !== false) {
                    analyticsData.trends = this.calculateTrends(activities, timeframe);
                }
                
                // Cache the result
                this.cache = {
                    data: { report: analyticsData, cacheKey: cacheKey },
                    timestamp: Date.now(),
                    ttl: this.cache.ttl
                };
                
                return analyticsData;
                
            } catch (error) {
                console.error('ProgressAnalytics: Error generating report', error);
                return window.AnalyticsDataModel.createAnalyticsData(timeframe);
            }
        },
        
        /**
         * Calculate core metrics from activities
         */
        calculateMetrics: function(activities, timeframe) {
            const metrics = {
                completion: this.calculateCompletionMetrics(activities),
                timing: this.calculateTimingMetrics(activities),
                distribution: this.calculateDistributionMetrics(activities),
                trends: { completionTrend: 0, productivityTrend: 0, consistencyTrend: 0 }
            };
            
            return metrics;
        },
        
        /**
         * Calculate completion-related metrics
         */
        calculateCompletionMetrics: function(activities) {
            const completed = activities.filter(a => a.completed || a.completed_at);
            const total = activities.length;
            
            return {
                rate: total > 0 ? completed.length / total : 0,
                count: completed.length,
                totalActivities: total,
                streak: this.calculateCurrentStreak(activities),
                bestStreak: this.calculateBestStreak(activities),
                streakHistory: this.calculateStreakHistory(activities)
            };
        },
        
        /**
         * Calculate timing-related metrics
         */
        calculateTimingMetrics: function(activities) {
            const completedWithTime = activities.filter(a => 
                (a.completed || a.completed_at) && 
                (a.timeEstimate || a.estimatedMinutes || a.actualDuration)
            );
            
            let totalTime = 0;
            let estimationAccuracy = 0;
            let estimationCount = 0;
            
            completedWithTime.forEach(activity => {
                const estimate = activity.timeEstimate || activity.estimatedMinutes || 0;
                const actual = activity.actualDuration || estimate;
                
                totalTime += actual;
                
                if (estimate > 0) {
                    const accuracy = Math.min(estimate, actual) / Math.max(estimate, actual);
                    estimationAccuracy += accuracy;
                    estimationCount++;
                }
            });
            
            return {
                averageDuration: completedWithTime.length > 0 ? totalTime / completedWithTime.length : 0,
                totalTimeSpent: totalTime,
                peakHours: this.identifyPeakHours(activities),
                scheduleAdherence: this.calculateScheduleAdherence(activities),
                timeEstimationAccuracy: estimationCount > 0 ? estimationAccuracy / estimationCount : 0
            };
        },
        
        /**
         * Calculate distribution metrics
         */
        calculateDistributionMetrics: function(activities) {
            const distribution = {
                byType: { recurring: 0, frequent: 0, singleUse: 0 },
                byDay: {},
                byHour: {},
                byCategory: {}
            };
            
            activities.forEach(activity => {
                // By type
                if (activity.type && activity.type.category) {
                    distribution.byType[activity.type.category] = 
                        (distribution.byType[activity.type.category] || 0) + 1;
                }
                
                // By day of week
                if (activity.completed_at) {
                    const date = new Date(activity.completed_at);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                    distribution.byDay[dayName] = (distribution.byDay[dayName] || 0) + 1;
                }
                
                // By hour
                if (activity.time || activity.completed_at) {
                    const timeStr = activity.time || new Date(activity.completed_at).toTimeString().substring(0, 5);
                    const hour = parseInt(timeStr.split(':')[0], 10);
                    distribution.byHour[hour] = (distribution.byHour[hour] || 0) + 1;
                }
                
                // By category
                if (activity.category) {
                    distribution.byCategory[activity.category] = 
                        (distribution.byCategory[activity.category] || 0) + 1;
                }
            });
            
            return distribution;
        },
        
        /**
         * Calculate current streak
         */
        calculateCurrentStreak: function(activities) {
            const dailyCompletions = this.getDailyCompletions(activities);
            const today = new Date().toDateString();
            let streak = 0;
            let currentDate = new Date();
            
            // Check backwards from today
            while (true) {
                const dateStr = currentDate.toDateString();
                
                if (dailyCompletions[dateStr] && dailyCompletions[dateStr] > 0) {
                    streak++;
                } else if (dateStr !== today) {
                    // If it's not today and no completions, streak is broken
                    break;
                } else {
                    // Today with no completions doesn't break yesterday's streak yet
                    break;
                }
                
                currentDate.setDate(currentDate.getDate() - 1);
            }
            
            return streak;
        },
        
        /**
         * Calculate best streak in history
         */
        calculateBestStreak: function(activities) {
            const dailyCompletions = this.getDailyCompletions(activities);
            const dates = Object.keys(dailyCompletions).sort();
            
            let bestStreak = 0;
            let currentStreak = 0;
            let lastDate = null;
            
            dates.forEach(dateStr => {
                if (dailyCompletions[dateStr] > 0) {
                    if (lastDate && this.isConsecutiveDay(lastDate, dateStr)) {
                        currentStreak++;
                    } else {
                        currentStreak = 1;
                    }
                    bestStreak = Math.max(bestStreak, currentStreak);
                    lastDate = dateStr;
                } else {
                    currentStreak = 0;
                }
            });
            
            return bestStreak;
        },
        
        /**
         * Get daily completion counts
         */
        getDailyCompletions: function(activities) {
            const dailyCompletions = {};
            
            activities.filter(a => a.completed || a.completed_at).forEach(activity => {
                const completedDate = activity.completed_at ? 
                    new Date(activity.completed_at) : new Date();
                const dateStr = completedDate.toDateString();
                
                dailyCompletions[dateStr] = (dailyCompletions[dateStr] || 0) + 1;
            });
            
            return dailyCompletions;
        },
        
        /**
         * Check if two date strings are consecutive days
         */
        isConsecutiveDay: function(dateStr1, dateStr2) {
            const date1 = new Date(dateStr1);
            const date2 = new Date(dateStr2);
            const diffTime = Math.abs(date2.getTime() - date1.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays === 1;
        },
        
        /**
         * Identify peak productivity hours
         */
        identifyPeakHours: function(activities) {
            const hourCounts = {};
            
            activities.filter(a => a.completed || a.completed_at).forEach(activity => {
                let hour;
                if (activity.time) {
                    hour = parseInt(activity.time.split(':')[0], 10);
                } else if (activity.completed_at) {
                    hour = new Date(activity.completed_at).getHours();
                } else {
                    return;
                }
                
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });
            
            // Find top 3 hours
            return Object.entries(hourCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([hour]) => parseInt(hour, 10));
        },
        
        /**
         * Calculate schedule adherence
         */
        calculateScheduleAdherence: function(activities) {
            const scheduledActivities = activities.filter(a => a.time);
            if (scheduledActivities.length === 0) return 0;
            
            const completedOnTime = scheduledActivities.filter(activity => {
                if (!activity.completed_at || !activity.time) return false;
                
                const scheduledTime = activity.time;
                const completedTime = new Date(activity.completed_at).toTimeString().substring(0, 5);
                
                // Calculate difference in minutes
                const [schedHour, schedMin] = scheduledTime.split(':').map(Number);
                const [compHour, compMin] = completedTime.split(':').map(Number);
                
                const schedMinutes = schedHour * 60 + schedMin;
                const compMinutes = compHour * 60 + compMin;
                
                // Consider "on time" if within 30 minutes
                return Math.abs(schedMinutes - compMinutes) <= 30;
            });
            
            return completedOnTime.length / scheduledActivities.length;
        },
        
        /**
         * Identify behavioral patterns
         */
        identifyPatterns: function(activities, timeframe) {
            const patterns = {
                mostProductiveDay: this.findMostProductiveDay(activities),
                mostProductiveHour: this.findMostProductiveHour(activities),
                preferredActivityTypes: this.findPreferredTypes(activities),
                energyPatterns: this.analyzeEnergyPatterns(activities),
                scheduleOptimization: this.generateScheduleOptimizations(activities)
            };
            
            return patterns;
        },
        
        /**
         * Find most productive day of week
         */
        findMostProductiveDay: function(activities) {
            const dayCompletions = {};
            
            activities.filter(a => a.completed || a.completed_at).forEach(activity => {
                const date = activity.completed_at ? new Date(activity.completed_at) : new Date();
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                dayCompletions[dayName] = (dayCompletions[dayName] || 0) + 1;
            });
            
            return Object.entries(dayCompletions)
                .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
        },
        
        /**
         * Find most productive hour
         */
        findMostProductiveHour: function(activities) {
            const peakHours = this.identifyPeakHours(activities);
            return peakHours.length > 0 ? peakHours[0] : null;
        },
        
        /**
         * Find preferred activity types
         */
        findPreferredTypes: function(activities) {
            const typeCompletions = {};
            
            activities.filter(a => a.completed || a.completed_at).forEach(activity => {
                if (activity.type && activity.type.category) {
                    const type = activity.type.category;
                    typeCompletions[type] = (typeCompletions[type] || 0) + 1;
                }
            });
            
            return Object.entries(typeCompletions)
                .sort(([,a], [,b]) => b - a)
                .map(([type]) => type);
        },
        
        /**
         * Analyze energy patterns throughout the day
         */
        analyzeEnergyPatterns: function(activities) {
            const hourlyProductivity = {};
            
            activities.filter(a => a.completed || a.completed_at).forEach(activity => {
                let hour;
                if (activity.time) {
                    hour = parseInt(activity.time.split(':')[0], 10);
                } else if (activity.completed_at) {
                    hour = new Date(activity.completed_at).getHours();
                } else {
                    return;
                }
                
                hourlyProductivity[hour] = (hourlyProductivity[hour] || 0) + 1;
            });
            
            // Categorize hours into energy levels
            const sortedHours = Object.entries(hourlyProductivity)
                .sort(([,a], [,b]) => b - a);
            
            const totalHours = sortedHours.length;
            const highEnergyCount = Math.ceil(totalHours * 0.3);
            const mediumEnergyCount = Math.ceil(totalHours * 0.4);
            
            return {
                high: sortedHours.slice(0, highEnergyCount).map(([hour]) => parseInt(hour, 10)),
                medium: sortedHours.slice(highEnergyCount, highEnergyCount + mediumEnergyCount).map(([hour]) => parseInt(hour, 10)),
                low: sortedHours.slice(highEnergyCount + mediumEnergyCount).map(([hour]) => parseInt(hour, 10))
            };
        },
        
        /**
         * Generate schedule optimization suggestions
         */
        generateScheduleOptimizations: function(activities) {
            const optimizations = [];
            const patterns = this.analyzeEnergyPatterns(activities);
            
            if (patterns.high.length > 0) {
                optimizations.push({
                    type: 'schedule',
                    suggestion: `Schedule important tasks during your peak hours: ${this.formatHours(patterns.high)}`,
                    confidence: 0.8,
                    hours: patterns.high
                });
            }
            
            if (patterns.low.length > 0) {
                optimizations.push({
                    type: 'schedule',
                    suggestion: `Consider lighter activities during ${this.formatHours(patterns.low)}`,
                    confidence: 0.7,
                    hours: patterns.low
                });
            }
            
            return optimizations;
        },
        
        /**
         * Format hours for display
         */
        formatHours: function(hours) {
            return hours.map(hour => {
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                return `${displayHour}${period}`;
            }).join(', ');
        },
        
        /**
         * Generate insights from analytics data
         */
        generateInsights: function(analyticsData, activities) {
            const insights = [];
            const metrics = analyticsData.metrics;
            
            // Completion rate insights
            if (metrics.completion.rate >= 0.8) {
                insights.push(window.AnalyticsDataModel.createInsight({
                    type: 'positive',
                    title: 'Excellent Completion Rate!',
                    description: `You're completing ${Math.round(metrics.completion.rate * 100)}% of your activities. Keep up the amazing work!`,
                    icon: '🎉',
                    confidence: 0.9
                }));
            } else if (metrics.completion.rate >= 0.6) {
                insights.push(window.AnalyticsDataModel.createInsight({
                    type: 'positive',
                    title: 'Good Progress!',
                    description: `You're completing ${Math.round(metrics.completion.rate * 100)}% of your activities. You're building great habits!`,
                    icon: '👍',
                    confidence: 0.8
                }));
            }
            
            // Streak insights
            if (metrics.completion.streak >= 7) {
                insights.push(window.AnalyticsDataModel.createInsight({
                    type: 'celebration',
                    title: 'Amazing Streak!',
                    description: `You're on a ${metrics.completion.streak}-day streak! Your consistency is inspiring!`,
                    icon: '🔥',
                    confidence: 1.0
                }));
            } else if (metrics.completion.streak >= 3) {
                insights.push(window.AnalyticsDataModel.createInsight({
                    type: 'positive',
                    title: 'Building Momentum!',
                    description: `${metrics.completion.streak} days in a row! You're developing a great routine!`,
                    icon: '⚡',
                    confidence: 0.8
                }));
            }
            
            // Pattern insights
            if (analyticsData.patterns.mostProductiveDay) {
                insights.push(window.AnalyticsDataModel.createInsight({
                    type: 'pattern',
                    title: 'Peak Day Identified!',
                    description: `${analyticsData.patterns.mostProductiveDay} is your most productive day. Consider scheduling important tasks then!`,
                    icon: '📊',
                    confidence: 0.7,
                    actionable: true
                }));
            }
            
            if (analyticsData.patterns.mostProductiveHour !== null) {
                const hour = analyticsData.patterns.mostProductiveHour;
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                
                insights.push(window.AnalyticsDataModel.createInsight({
                    type: 'pattern',
                    title: 'Peak Hour Found!',
                    description: `You're most productive around ${displayHour}${period}. Try scheduling focused work then!`,
                    icon: '🕐',
                    confidence: 0.7,
                    actionable: true
                }));
            }
            
            // Time estimation insights
            if (metrics.timing.timeEstimationAccuracy >= 0.8) {
                insights.push(window.AnalyticsDataModel.createInsight({
                    type: 'positive',
                    title: 'Time Estimation Pro!',
                    description: `You're ${Math.round(metrics.timing.timeEstimationAccuracy * 100)}% accurate at estimating time. Excellent planning skills!`,
                    icon: '🎯',
                    confidence: 0.8
                }));
            }
            
            return insights.slice(0, 5); // Limit to top 5 insights
        },
        
        /**
         * Generate actionable recommendations
         */
        generateRecommendations: function(analyticsData, activities) {
            const recommendations = [];
            const metrics = analyticsData.metrics;
            const patterns = analyticsData.patterns;
            
            // Completion rate recommendations
            if (metrics.completion.rate < 0.7) {
                recommendations.push(window.AnalyticsDataModel.createRecommendation({
                    type: 'balance',
                    title: 'Optimize Your Load',
                    description: 'Consider reducing the number of daily activities or breaking large ones into smaller chunks.',
                    icon: '⚖️',
                    confidence: 0.8,
                    impact: 'high',
                    effort: 'low',
                    action: 'review_activity_load'
                }));
            }
            
            // Schedule optimization
            if (patterns.energyPatterns.high.length > 0) {
                recommendations.push(window.AnalyticsDataModel.createRecommendation({
                    type: 'schedule',
                    title: 'Schedule During Peak Hours',
                    description: `Move your most important activities to ${this.formatHours(patterns.energyPatterns.high)} when you're most productive.`,
                    icon: '🚀',
                    confidence: 0.7,
                    impact: 'medium',
                    effort: 'low',
                    action: 'optimize_schedule',
                    data: { peakHours: patterns.energyPatterns.high }
                }));
            }
            
            // Time estimation improvement
            if (metrics.timing.timeEstimationAccuracy < 0.6 && metrics.timing.timeEstimationAccuracy > 0) {
                recommendations.push(window.AnalyticsDataModel.createRecommendation({
                    type: 'timing',
                    title: 'Improve Time Estimates',
                    description: 'Track actual time spent on activities to improve your estimation accuracy.',
                    icon: '⏱️',
                    confidence: 0.6,
                    impact: 'medium',
                    effort: 'medium',
                    action: 'improve_time_estimation'
                }));
            }
            
            // Activity type balance
            const typeDistribution = metrics.distribution.byType;
            const totalActivities = Object.values(typeDistribution).reduce((sum, count) => sum + count, 0);
            if (totalActivities > 0) {
                const recurringRatio = typeDistribution.recurring / totalActivities;
                const frequentRatio = typeDistribution.frequent / totalActivities;
                
                if (recurringRatio < 0.3 && frequentRatio > 0.6) {
                    recommendations.push(window.AnalyticsDataModel.createRecommendation({
                        type: 'balance',
                        title: 'Add More Routine',
                        description: 'Consider making some frequent activities into daily routines for better consistency.',
                        icon: '🔄',
                        confidence: 0.6,
                        impact: 'medium',
                        effort: 'low',
                        action: 'increase_recurring_activities'
                    }));
                }
            }
            
            return recommendations.slice(0, 3); // Limit to top 3 recommendations
        },
        
        /**
         * Calculate trends compared to previous period
         */
        calculateTrends: function(allActivities, timeframe) {
            // This is a simplified trend calculation
            // In a real implementation, you'd compare with stored historical data
            
            const now = new Date();
            const period = window.AnalyticsDataModel.prototype.calculatePeriod.call(
                window.AnalyticsDataModel, timeframe
            );
            
            // Calculate previous period
            const periodDuration = new Date(period.end) - new Date(period.start);
            const previousStart = new Date(new Date(period.start) - periodDuration);
            const previousEnd = new Date(period.start);
            
            const currentActivities = this.filterActivitiesByTimeframe(allActivities, period);
            const previousActivities = this.filterActivitiesByTimeframe(allActivities, {
                start: previousStart.toISOString(),
                end: previousEnd.toISOString()
            });
            
            const currentMetrics = this.calculateCompletionMetrics(currentActivities);
            const previousMetrics = this.calculateCompletionMetrics(previousActivities);
            
            const completionTrend = previousMetrics.rate > 0 ? 
                (currentMetrics.rate - previousMetrics.rate) / previousMetrics.rate : 0;
            
            return {
                completionTrend: completionTrend,
                productivityTrend: 0, // Placeholder
                consistencyTrend: 0   // Placeholder
            };
        },
        
        /**
         * Filter activities by timeframe period
         */
        filterActivitiesByTimeframe: function(activities, period) {
            const startDate = new Date(period.start);
            const endDate = new Date(period.end);
            
            return activities.filter(activity => {
                const activityDate = activity.completed_at ? 
                    new Date(activity.completed_at) : 
                    new Date(activity.created_at || activity.created);
                
                return activityDate >= startDate && activityDate <= endDate;
            });
        },
        
        /**
         * Calculate streak history for visualization
         */
        calculateStreakHistory: function(activities) {
            const dailyCompletions = this.getDailyCompletions(activities);
            const history = [];
            
            // Get last 30 days of streak data
            for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toDateString();
                
                history.push({
                    date: dateStr,
                    count: dailyCompletions[dateStr] || 0,
                    hasActivity: (dailyCompletions[dateStr] || 0) > 0
                });
            }
            
            return history;
        },
        
        /**
         * Generate hash of activities for cache invalidation
         */
        getActivitiesHash: function(activities) {
            const relevant = activities.map(a => `${a.id}_${a.completed_at || ''}_${a.updated_at || ''}`);
            return relevant.join('|').substring(0, 50);
        },
        
        /**
         * Clear analytics cache
         */
        clearCache: function() {
            this.cache = {
                data: null,
                timestamp: 0,
                ttl: this.cache.ttl
            };
        }
    };
    
    // Export to global scope
    window.ProgressAnalytics = ProgressAnalytics;
    
})();