/**
 * Time Parser for StackMap
 * Smart parsing of various time formats and intelligent suggestions
 * Story #109 - Time Field Implementation
 */

(function() {
    'use strict';
    
    const TimeParser = {
        // Common time patterns and their regex
        patterns: {
            // 24-hour format: 15:30, 09:00
            twentyFourHour: /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/,
            
            // 12-hour format: 3:30pm, 9:00 AM, 12:15 PM
            twelveHour: /^(1?[0-9]):([0-5][0-9])\s*(am|pm|AM|PM)$/,
            
            // Hour only: 3pm, 9AM, 15
            hourOnly: /^(1?[0-9]|2[0-3])\s*(am|pm|AM|PM)?$/,
            
            // Military time: 1530, 0900
            military: /^([01]?[0-9]|2[0-3])([0-5][0-9])$/,
            
            // Special cases: noon, midnight
            special: /^(noon|midnight|midday)$/i
        },
        
        // Activity title keyword suggestions
        timeKeywords: {
            // Morning activities
            'morning': '07:00',
            'breakfast': '08:00',
            'wake up': '06:30',
            'alarm': '06:00',
            'routine': '07:30',
            'coffee': '07:00',
            'commute': '08:30',
            'start work': '09:00',
            
            // Midday activities
            'lunch': '12:00',
            'noon': '12:00',
            'midday': '12:00',
            'meeting': '14:00',
            'call': '15:00',
            
            // Evening activities
            'dinner': '18:30',
            'evening': '19:00',
            'workout': '18:00',
            'gym': '17:30',
            'cooking': '18:00',
            'meal prep': '19:00',
            
            // Night activities
            'bedtime': '22:00',
            'sleep': '22:30',
            'night': '21:00',
            'wind down': '21:30',
            'read': '21:00',
            'meditation': '20:30'
        },
        
        /**
         * Parse time input and return 24-hour format (HH:mm) or null
         */
        parse: function(input) {
            if (!input || typeof input !== 'string') {
                return null;
            }
            
            const cleaned = input.trim().toLowerCase();
            
            // Handle special cases first
            if (this.patterns.special.test(cleaned)) {
                switch (cleaned) {
                    case 'noon':
                    case 'midday':
                        return '12:00';
                    case 'midnight':
                        return '00:00';
                }
            }
            
            // Try 24-hour format
            let match = cleaned.match(this.patterns.twentyFourHour);
            if (match) {
                const hours = parseInt(match[1], 10);
                const minutes = parseInt(match[2], 10);
                if (hours <= 23 && minutes <= 59) {
                    return this.formatTime(hours, minutes);
                }
            }
            
            // Try 12-hour format
            match = cleaned.match(this.patterns.twelveHour);
            if (match) {
                let hours = parseInt(match[1], 10);
                const minutes = parseInt(match[2], 10);
                const period = match[3].toLowerCase();
                
                if (hours === 12 && period === 'am') {
                    hours = 0;
                } else if (hours !== 12 && period === 'pm') {
                    hours += 12;
                }
                
                if (hours <= 23 && minutes <= 59) {
                    return this.formatTime(hours, minutes);
                }
            }
            
            // Try hour only format
            match = cleaned.match(this.patterns.hourOnly);
            if (match) {
                let hours = parseInt(match[1], 10);
                const period = match[2] ? match[2].toLowerCase() : null;
                
                if (period) {
                    if (hours === 12 && period === 'am') {
                        hours = 0;
                    } else if (hours !== 12 && period === 'pm') {
                        hours += 12;
                    }
                } else {
                    // No period specified, use 24-hour format
                    if (hours > 12) {
                        // Assume 24-hour format
                    } else {
                        // Ambiguous - use context or default to PM for afternoon hours
                        if (hours >= 1 && hours <= 7) {
                            // Could be morning or evening, default to PM
                            hours += 12;
                        }
                    }
                }
                
                if (hours <= 23) {
                    return this.formatTime(hours, 0);
                }
            }
            
            // Try military time
            match = cleaned.match(this.patterns.military);
            if (match) {
                const hours = parseInt(match[1], 10);
                const minutes = parseInt(match[2], 10);
                if (hours <= 23 && minutes <= 59) {
                    return this.formatTime(hours, minutes);
                }
            }
            
            return null;
        },
        
        /**
         * Format time to HH:mm string
         */
        formatTime: function(hours, minutes) {
            const h = hours.toString().padStart(2, '0');
            const m = minutes.toString().padStart(2, '0');
            return `${h}:${m}`;
        },
        
        /**
         * Format time for display according to user preference
         */
        formatForDisplay: function(time, format) {
            if (!time || !this.isValidTime(time)) {
                return '';
            }
            
            format = format || '12h';
            const [hours, minutes] = time.split(':').map(Number);
            
            if (format === '24h') {
                return time;
            } else {
                // 12-hour format
                let displayHours = hours;
                const period = hours >= 12 ? 'PM' : 'AM';
                
                if (hours === 0) {
                    displayHours = 12;
                } else if (hours > 12) {
                    displayHours = hours - 12;
                }
                
                const minuteStr = minutes.toString().padStart(2, '0');
                return `${displayHours}:${minuteStr} ${period}`;
            }
        },
        
        /**
         * Validate if time string is in correct HH:mm format
         */
        isValidTime: function(time) {
            if (!time || typeof time !== 'string') {
                return false;
            }
            
            return this.patterns.twentyFourHour.test(time);
        },
        
        /**
         * Suggest time based on activity title
         */
        suggestTime: function(activityTitle) {
            if (!activityTitle || typeof activityTitle !== 'string') {
                return null;
            }
            
            const title = activityTitle.toLowerCase();
            
            // Look for direct keyword matches
            for (const keyword in this.timeKeywords) {
                if (title.includes(keyword)) {
                    return this.timeKeywords[keyword];
                }
            }
            
            // Look for time of day indicators
            if (title.includes('morning') || title.includes('early')) {
                return '08:00';
            } else if (title.includes('afternoon')) {
                return '14:00';
            } else if (title.includes('evening') || title.includes('night')) {
                return '19:00';
            }
            
            return null;
        },
        
        /**
         * Get time of day category for a given time
         */
        getTimeOfDay: function(time) {
            if (!this.isValidTime(time)) {
                return 'unknown';
            }
            
            const hours = parseInt(time.split(':')[0], 10);
            
            if (hours >= 5 && hours < 12) {
                return 'morning';
            } else if (hours >= 12 && hours < 17) {
                return 'afternoon';
            } else if (hours >= 17 && hours < 22) {
                return 'evening';
            } else {
                return 'night';
            }
        },
        
        /**
         * Get appropriate icon for time of day
         */
        getTimeIcon: function(time) {
            const timeOfDay = this.getTimeOfDay(time);
            
            switch (timeOfDay) {
                case 'morning':
                    return '🌅';
                case 'afternoon':
                    return '☀️';
                case 'evening':
                    return '🌆';
                case 'night':
                    return '🌙';
                default:
                    return '🕐';
            }
        },
        
        /**
         * Get relative time description
         */
        getRelativeTime: function(time) {
            if (!this.isValidTime(time)) {
                return '';
            }
            
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
            const [targetHours, targetMinutes] = time.split(':').map(Number);
            
            const currentTotalMinutes = currentHours * 60 + currentMinutes;
            const targetTotalMinutes = targetHours * 60 + targetMinutes;
            const diffMinutes = targetTotalMinutes - currentTotalMinutes;
            
            if (diffMinutes === 0) {
                return 'now';
            } else if (diffMinutes > 0) {
                if (diffMinutes < 60) {
                    return `in ${diffMinutes} min`;
                } else {
                    const hours = Math.floor(diffMinutes / 60);
                    const mins = diffMinutes % 60;
                    return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
                }
            } else {
                const pastMinutes = Math.abs(diffMinutes);
                if (pastMinutes < 60) {
                    return `${pastMinutes} min ago`;
                } else {
                    const hours = Math.floor(pastMinutes / 60);
                    const mins = pastMinutes % 60;
                    return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
                }
            }
        },
        
        /**
         * Get quick time suggestions for UI buttons
         */
        getQuickTimeSuggestions: function() {
            const now = new Date();
            const currentHour = now.getHours();
            
            const suggestions = [];
            
            // Always include common times
            if (currentHour < 9) {
                suggestions.push({ label: 'Morning', time: '09:00' });
            }
            if (currentHour < 12) {
                suggestions.push({ label: 'Noon', time: '12:00' });
            }
            if (currentHour < 14) {
                suggestions.push({ label: 'Afternoon', time: '14:00' });
            }
            if (currentHour < 18) {
                suggestions.push({ label: 'Evening', time: '18:00' });
            }
            
            // Add "Later today" if it's still morning/afternoon
            if (currentHour < 17) {
                const laterTime = Math.min(currentHour + 3, 21);
                suggestions.push({ 
                    label: 'Later', 
                    time: this.formatTime(laterTime, 0) 
                });
            }
            
            return suggestions;
        },
        
        /**
         * Compare two times (returns -1, 0, or 1)
         */
        compareTimes: function(time1, time2) {
            if (!this.isValidTime(time1) || !this.isValidTime(time2)) {
                return 0;
            }
            
            const [h1, m1] = time1.split(':').map(Number);
            const [h2, m2] = time2.split(':').map(Number);
            
            const total1 = h1 * 60 + m1;
            const total2 = h2 * 60 + m2;
            
            if (total1 < total2) return -1;
            if (total1 > total2) return 1;
            return 0;
        },
        
        /**
         * Check if time is in the past for today
         */
        isPastTime: function(time) {
            if (!this.isValidTime(time)) {
                return false;
            }
            
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            return this.compareTimes(time, currentTime) < 0;
        }
    };
    
    // Export to global scope
    window.TimeParser = TimeParser;
    
})();