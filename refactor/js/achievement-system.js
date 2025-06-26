/**
 * Achievement System for StackMap
 * Tracks milestones, unlocks achievements, and celebrates progress
 * Story #106 - Progress Analytics & Insights
 */

(function() {
    'use strict';
    
    const AchievementSystem = {
        // User achievement state
        userAchievements: {},
        unlockedAchievements: [],
        
        // Event listeners for cleanup
        eventListeners: [],
        
        /**
         * Initialize achievement system
         */
        init: function() {
            this.loadUserAchievements();
            this.setupEventListeners();
            console.log('AchievementSystem: Initialized');
        },
        
        /**
         * Check for new achievements based on current activity data
         */
        checkAchievements: function(userId, activities) {
            const self = this;
            const newUnlocks = [];
            
            if (!userId || !Array.isArray(activities)) {
                return newUnlocks;
            }
            
            try {
                // Get user's current achievement state
                const userState = this.getUserAchievementState(userId);
                
                // Check each achievement definition
                Object.entries(window.AnalyticsDataModel.ACHIEVEMENT_DEFINITIONS).forEach(([achievementId, definition]) => {
                    if (!userState.unlocked[achievementId]) {
                        if (this.checkAchievementCriteria(definition, activities, userState)) {
                            const achievement = this.unlockAchievement(userId, achievementId, definition);
                            if (achievement) {
                                newUnlocks.push(achievement);
                            }
                        }
                    }
                });
                
                // Save updated state
                this.saveUserAchievements();
                
                // Trigger celebrations for new unlocks
                newUnlocks.forEach(achievement => {
                    this.celebrateAchievement(achievement);
                });
                
                return newUnlocks;
                
            } catch (error) {
                console.error('AchievementSystem: Error checking achievements', error);
                return [];
            }
        },
        
        /**
         * Check if specific achievement criteria is met
         */
        checkAchievementCriteria: function(definition, activities, userState) {
            switch (definition.type) {
                case 'streak':
                    return this.checkStreakAchievement(definition, activities);
                    
                case 'milestone':
                    return this.checkMilestoneAchievement(definition, activities);
                    
                case 'improvement':
                    return this.checkImprovementAchievement(definition, activities, userState);
                    
                case 'special':
                    return this.checkSpecialAchievement(definition, activities);
                    
                default:
                    return false;
            }
        },
        
        /**
         * Check streak-based achievements
         */
        checkStreakAchievement: function(definition, activities) {
            const analytics = window.ProgressAnalytics;
            if (!analytics) return false;
            
            const currentStreak = analytics.calculateCurrentStreak(activities);
            return currentStreak >= definition.threshold;
        },
        
        /**
         * Check milestone-based achievements
         */
        checkMilestoneAchievement: function(definition, activities) {
            const completedActivities = activities.filter(a => a.completed || a.completed_at);
            
            switch (definition.category) {
                case 'completion':
                    return completedActivities.length >= definition.threshold;
                    
                case 'timing':
                    const totalTime = completedActivities.reduce((sum, activity) => {
                        return sum + (activity.actualDuration || activity.timeEstimate || 0);
                    }, 0);
                    return totalTime >= definition.threshold;
                    
                default:
                    return completedActivities.length >= definition.threshold;
            }
        },
        
        /**
         * Check improvement-based achievements
         */
        checkImprovementAchievement: function(definition, activities, userState) {
            const analytics = window.ProgressAnalytics;
            if (!analytics) return false;
            
            const metrics = analytics.calculateMetrics(activities, 'month');
            
            switch (definition.category) {
                case 'accuracy':
                    return metrics.timing.timeEstimationAccuracy >= definition.threshold;
                    
                case 'completion':
                    // Check if completion rate has been maintained for required period
                    return metrics.completion.rate >= definition.threshold;
                    
                case 'balance':
                    return this.checkActivityBalance(activities, definition.threshold);
                    
                default:
                    return false;
            }
        },
        
        /**
         * Check special achievements
         */
        checkSpecialAchievement: function(definition, activities) {
            switch (definition.category) {
                case 'timing':
                    return this.checkTimingSpecial(definition, activities);
                    
                case 'resilience':
                    return this.checkResilienceSpecial(definition, activities);
                    
                default:
                    return false;
            }
        },
        
        /**
         * Check timing-based special achievements (early bird, night owl)
         */
        checkTimingSpecial: function(definition, activities) {
            const recentActivities = this.getRecentActivities(activities, 30); // Last 30 days
            let qualifyingDays = 0;
            
            const dailyActivities = this.groupActivitiesByDay(recentActivities);
            
            Object.values(dailyActivities).forEach(dayActivities => {
                const completedActivities = dayActivities.filter(a => a.completed || a.completed_at);
                
                if (completedActivities.length > 0) {
                    const hasQualifyingTime = completedActivities.some(activity => {
                        let hour;
                        if (activity.time) {
                            hour = parseInt(activity.time.split(':')[0], 10);
                        } else if (activity.completed_at) {
                            hour = new Date(activity.completed_at).getHours();
                        } else {
                            return false;
                        }
                        
                        // Early bird: 5 AM - 8 AM
                        if (definition.id === 'early-bird') {
                            return hour >= 5 && hour < 8;
                        }
                        
                        // Night owl: 9 PM - 11 PM
                        if (definition.id === 'night-owl') {
                            return hour >= 21 && hour < 23;
                        }
                        
                        return false;
                    });
                    
                    if (hasQualifyingTime) {
                        qualifyingDays++;
                    }
                }
            });
            
            return qualifyingDays >= definition.threshold;
        },
        
        /**
         * Check resilience special achievements
         */
        checkResilienceSpecial: function(definition, activities) {
            // Streak saver: recovering within 24 hours of missing a day
            if (definition.id === 'streak-saver') {
                const analytics = window.ProgressAnalytics;
                if (!analytics) return false;
                
                const streakHistory = analytics.calculateStreakHistory(activities);
                
                // Look for pattern: activity -> no activity -> activity (within timeframe)
                for (let i = 1; i < streakHistory.length - 1; i++) {
                    const prev = streakHistory[i - 1];
                    const current = streakHistory[i];
                    const next = streakHistory[i + 1];
                    
                    if (prev.hasActivity && !current.hasActivity && next.hasActivity) {
                        // Check if recovery was within 24 hours (next day)
                        const currentDate = new Date(current.date);
                        const nextDate = new Date(next.date);
                        const timeDiff = nextDate.getTime() - currentDate.getTime();
                        const daysDiff = timeDiff / (1000 * 3600 * 24);
                        
                        if (daysDiff <= 1) {
                            return true;
                        }
                    }
                }
            }
            
            return false;
        },
        
        /**
         * Check activity type balance
         */
        checkActivityBalance: function(activities, thresholdDays) {
            const recentActivities = this.getRecentActivities(activities, thresholdDays);
            const typeDistribution = {};
            
            recentActivities.filter(a => a.completed || a.completed_at).forEach(activity => {
                if (activity.type && activity.type.category) {
                    const type = activity.type.category;
                    typeDistribution[type] = (typeDistribution[type] || 0) + 1;
                }
            });
            
            const types = Object.values(typeDistribution);
            if (types.length < 2) return false;
            
            // Check if distribution is reasonably balanced (no type > 60% of total)
            const total = types.reduce((sum, count) => sum + count, 0);
            const maxRatio = Math.max(...types) / total;
            
            return maxRatio <= 0.6;
        },
        
        /**
         * Get activities from recent days
         */
        getRecentActivities: function(activities, days) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            return activities.filter(activity => {
                const activityDate = activity.completed_at ? 
                    new Date(activity.completed_at) : 
                    new Date(activity.created_at || activity.created);
                
                return activityDate >= cutoffDate;
            });
        },
        
        /**
         * Group activities by day
         */
        groupActivitiesByDay: function(activities) {
            const grouped = {};
            
            activities.forEach(activity => {
                const date = activity.completed_at ? 
                    new Date(activity.completed_at) : 
                    new Date(activity.created_at || activity.created);
                
                const dateStr = date.toDateString();
                
                if (!grouped[dateStr]) {
                    grouped[dateStr] = [];
                }
                grouped[dateStr].push(activity);
            });
            
            return grouped;
        },
        
        /**
         * Unlock an achievement
         */
        unlockAchievement: function(userId, achievementId, definition) {
            try {
                const achievement = window.AnalyticsDataModel.createAchievement({
                    id: achievementId,
                    type: definition.type,
                    category: definition.category,
                    title: definition.title,
                    description: definition.description,
                    icon: definition.icon,
                    threshold: definition.threshold,
                    rarity: definition.rarity,
                    points: definition.points,
                    unlocked: true
                });
                
                // Update user state
                if (!this.userAchievements[userId]) {
                    this.userAchievements[userId] = {
                        unlocked: {},
                        totalPoints: 0,
                        unlockedCount: 0
                    };
                }
                
                const userState = this.userAchievements[userId];
                userState.unlocked[achievementId] = achievement;
                userState.totalPoints += achievement.points;
                userState.unlockedCount++;
                
                // Track globally for notifications
                this.unlockedAchievements.push(achievement);
                
                // Dispatch event
                document.dispatchEvent(new CustomEvent('achievementUnlocked', {
                    detail: {
                        userId: userId,
                        achievement: achievement
                    }
                }));
                
                console.log(`AchievementSystem: Unlocked ${achievement.title} for user ${userId}`);
                
                return achievement;
                
            } catch (error) {
                console.error('AchievementSystem: Error unlocking achievement', error);
                return null;
            }
        },
        
        /**
         * Celebrate achievement unlock
         */
        celebrateAchievement: function(achievement) {
            if (!achievement) return;
            
            try {
                // Create celebration notification
                this.showAchievementNotification(achievement);
                
                // Trigger celebration animation if celebration system exists
                if (window.CelebrationSystem) {
                    window.CelebrationSystem.celebrateAchievement(achievement);
                }
                
                // Play celebration sound (if available and enabled)
                this.playCelebrationSound(achievement);
                
            } catch (error) {
                console.error('AchievementSystem: Error in celebration', error);
            }
        },
        
        /**
         * Show achievement notification
         */
        showAchievementNotification: function(achievement) {
            // Create achievement notification toast
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.innerHTML = `
                <div class="achievement-notification-content">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-text">
                        <div class="achievement-title">Achievement Unlocked!</div>
                        <div class="achievement-name">${achievement.title}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        <div class="achievement-points">+${achievement.points} points</div>
                    </div>
                </div>
            `;
            
            // Add to page
            document.body.appendChild(notification);
            
            // Animate in
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
            
            // Remove after delay
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 4000);
        },
        
        /**
         * Play celebration sound
         */
        playCelebrationSound: function(achievement) {
            // Only play if user hasn't disabled sounds
            if (window.StackMapSafeMode) return;
            
            try {
                // Create audio element for celebration sound
                const audio = new Audio();
                
                // Different sounds for different rarities
                switch (achievement.rarity) {
                    case 'legendary':
                        // Epic sound for legendary achievements
                        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+rvv2YgByGG1fTRgDABOXnR+O2WSgwRb8v/2aFQFQ==';
                        break;
                    case 'epic':
                        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+rvv2YgByGG1fTRgDABOXnR+O2WSgwRb8v/2aFQFQ==';
                        break;
                    case 'rare':
                        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+rvv2YgByGG1fTRgDABOXnR+O2WSgwRb8v/2aFQFQ==';
                        break;
                    default:
                        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+rvv2YgByGG1fTRgDABOXnR+O2WSgwRb8v/2aFQFQ==';
                        break;
                }
                
                audio.volume = 0.3;
                audio.play().catch(() => {
                    // Ignore audio play errors (user interaction required, etc.)
                });
                
            } catch (error) {
                // Ignore audio errors gracefully
            }
        },
        
        /**
         * Get user's achievement state
         */
        getUserAchievementState: function(userId) {
            if (!this.userAchievements[userId]) {
                this.userAchievements[userId] = {
                    unlocked: {},
                    totalPoints: 0,
                    unlockedCount: 0
                };
            }
            
            return this.userAchievements[userId];
        },
        
        /**
         * Get all achievements for user (unlocked and available)
         */
        getUserAchievements: function(userId) {
            const userState = this.getUserAchievementState(userId);
            const allAchievements = [];
            
            Object.entries(window.AnalyticsDataModel.ACHIEVEMENT_DEFINITIONS).forEach(([achievementId, definition]) => {
                const isUnlocked = !!userState.unlocked[achievementId];
                
                const achievement = isUnlocked ? 
                    userState.unlocked[achievementId] :
                    window.AnalyticsDataModel.createAchievement({
                        id: achievementId,
                        type: definition.type,
                        category: definition.category,
                        title: definition.title,
                        description: definition.description,
                        icon: definition.icon,
                        threshold: definition.threshold,
                        rarity: definition.rarity,
                        points: definition.points,
                        unlocked: false
                    });
                
                allAchievements.push(achievement);
            });
            
            // Sort by unlocked first, then by rarity and points
            return allAchievements.sort((a, b) => {
                if (a.isUnlocked !== b.isUnlocked) {
                    return b.isUnlocked - a.isUnlocked;
                }
                
                const rarityOrder = { 'legendary': 4, 'epic': 3, 'rare': 2, 'common': 1 };
                const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
                
                return rarityDiff !== 0 ? rarityDiff : b.points - a.points;
            });
        },
        
        /**
         * Get achievement progress for a specific achievement
         */
        getAchievementProgress: function(userId, achievementId, activities) {
            const definition = window.AnalyticsDataModel.ACHIEVEMENT_DEFINITIONS[achievementId];
            if (!definition) return 0;
            
            const userState = this.getUserAchievementState(userId);
            if (userState.unlocked[achievementId]) return 1;
            
            switch (definition.type) {
                case 'streak':
                    const currentStreak = window.ProgressAnalytics.calculateCurrentStreak(activities);
                    return Math.min(currentStreak / definition.threshold, 1);
                    
                case 'milestone':
                    if (definition.category === 'completion') {
                        const completedCount = activities.filter(a => a.completed || a.completed_at).length;
                        return Math.min(completedCount / definition.threshold, 1);
                    }
                    break;
                    
                case 'improvement':
                    if (definition.category === 'accuracy') {
                        const metrics = window.ProgressAnalytics.calculateMetrics(activities, 'month');
                        return Math.min(metrics.timing.timeEstimationAccuracy / definition.threshold, 1);
                    }
                    break;
            }
            
            return 0;
        },
        
        /**
         * Setup event listeners
         */
        setupEventListeners: function() {
            // Listen for activity completion to check achievements
            const achievementCheckHandler = (event) => {
                if (event.detail && event.detail.userId) {
                    // Delay check to allow for data to be saved
                    setTimeout(() => {
                        this.checkUserAchievements(event.detail.userId);
                    }, 1000);
                }
            };
            
            document.addEventListener('activityCompleted', achievementCheckHandler);
            document.addEventListener('activityUpdated', achievementCheckHandler);
            
            this.eventListeners.push({
                element: document,
                event: 'activityCompleted',
                handler: achievementCheckHandler
            });
            
            this.eventListeners.push({
                element: document,
                event: 'activityUpdated',
                handler: achievementCheckHandler
            });
        },
        
        /**
         * Check achievements for a specific user
         */
        checkUserAchievements: function(userId) {
            if (!userId) return;
            
            // Get user's activities
            if (window.UserDataManager) {
                const userActivities = window.UserDataManager.getAllActivitiesForUser(userId);
                if (userActivities) {
                    this.checkAchievements(userId, userActivities);
                }
            }
        },
        
        /**
         * Load user achievements from storage
         */
        loadUserAchievements: function() {
            try {
                const stored = localStorage.getItem('stackmap_achievements');
                if (stored) {
                    this.userAchievements = JSON.parse(stored);
                }
            } catch (error) {
                console.warn('AchievementSystem: Failed to load achievements', error);
                this.userAchievements = {};
            }
        },
        
        /**
         * Save user achievements to storage
         */
        saveUserAchievements: function() {
            try {
                localStorage.setItem('stackmap_achievements', JSON.stringify(this.userAchievements));
            } catch (error) {
                console.warn('AchievementSystem: Failed to save achievements', error);
            }
        },
        
        /**
         * Clean up event listeners
         */
        destroy: function() {
            this.eventListeners.forEach(({ element, event, handler }) => {
                element.removeEventListener(event, handler);
            });
            this.eventListeners = [];
        }
    };
    
    // Export to global scope
    window.AchievementSystem = AchievementSystem;
    
})();