/**
 * Time Formatter for StackMap
 * Advanced time display formatting and relative time calculations
 * Story #109 - Time Field Implementation
 */

(function() {
    'use strict';
    
    const TimeFormatter = {
        // Time of day thresholds
        timeOfDayRanges: {
            earlyMorning: { start: 5, end: 8 },    // 5:00 - 7:59
            morning: { start: 8, end: 12 },        // 8:00 - 11:59
            afternoon: { start: 12, end: 17 },     // 12:00 - 16:59
            evening: { start: 17, end: 22 },       // 17:00 - 21:59
            night: { start: 22, end: 5 }           // 22:00 - 4:59 (next day)
        },
        
        // Time icons for different periods
        timeIcons: {
            earlyMorning: '🌅',
            morning: '☀️',
            afternoon: '🌞',
            evening: '🌆',
            night: '🌙'
        },
        
        // Relative time thresholds (in minutes)
        relativeTimeThresholds: {
            now: 2,          // Within 2 minutes
            minutes: 60,     // Within 1 hour
            hours: 1440,     // Within 24 hours
            days: 10080      // Within 1 week
        },
        
        /**
         * Format time for display according to user preference
         */
        formatForDisplay: function(time, format = '12h', options = {}) {
            if (!time || !this.isValidTime(time)) {
                return options.fallback || '';
            }
            
            const [hours, minutes] = time.split(':').map(Number);
            
            if (format === '24h') {
                return this.format24Hour(hours, minutes, options);
            } else {
                return this.format12Hour(hours, minutes, options);
            }
        },
        
        /**
         * Format in 24-hour format
         */
        format24Hour: function(hours, minutes, options = {}) {
            const hoursStr = hours.toString().padStart(2, '0');
            const minutesStr = minutes.toString().padStart(2, '0');
            
            let formatted = `${hoursStr}:${minutesStr}`;
            
            if (options.showIcon) {
                const timeOfDay = this.getTimeOfDay(hours);
                formatted = `${this.timeIcons[timeOfDay]} ${formatted}`;
            }
            
            if (options.showPeriod) {
                const period = this.getTimeOfDayLabel(hours);
                formatted = `${formatted} (${period})`;
            }
            
            return formatted;
        },
        
        /**
         * Format in 12-hour format
         */
        format12Hour: function(hours, minutes, options = {}) {
            let displayHours = hours;
            const period = hours >= 12 ? 'PM' : 'AM';
            
            // Convert to 12-hour format
            if (hours === 0) {
                displayHours = 12;
            } else if (hours > 12) {
                displayHours = hours - 12;
            }
            
            const minutesStr = minutes.toString().padStart(2, '0');
            let formatted = `${displayHours}:${minutesStr} ${period}`;
            
            if (options.showIcon) {
                const timeOfDay = this.getTimeOfDay(hours);
                formatted = `${this.timeIcons[timeOfDay]} ${formatted}`;
            }
            
            if (options.compact && minutes === 0) {
                // Show "3 PM" instead of "3:00 PM" for round hours
                formatted = `${displayHours} ${period}`;
                if (options.showIcon) {
                    const timeOfDay = this.getTimeOfDay(hours);
                    formatted = `${this.timeIcons[timeOfDay]} ${formatted}`;
                }
            }
            
            return formatted;
        },
        
        /**
         * Get relative time description
         */
        getRelativeTime: function(time, options = {}) {
            if (!this.isValidTime(time)) {
                return '';
            }
            
            const now = new Date();
            const targetTime = this.parseTimeToday(time);
            
            // If target time is in the past, assume it's tomorrow
            if (targetTime < now) {
                targetTime.setDate(targetTime.getDate() + 1);
            }
            
            const diffMs = targetTime.getTime() - now.getTime();
            const diffMinutes = Math.round(diffMs / 60000);
            
            return this.formatRelativeTime(diffMinutes, options);
        },
        
        /**
         * Format relative time based on difference in minutes
         */
        formatRelativeTime: function(diffMinutes, options = {}) {
            const absMinutes = Math.abs(diffMinutes);
            const isPast = diffMinutes < 0;
            const prefix = isPast ? '' : 'in ';
            const suffix = isPast ? ' ago' : '';
            
            if (absMinutes <= this.relativeTimeThresholds.now) {
                return 'now';
            } else if (absMinutes < this.relativeTimeThresholds.minutes) {
                return `${prefix}${absMinutes} min${suffix}`;
            } else if (absMinutes < this.relativeTimeThresholds.hours) {
                const hours = Math.floor(absMinutes / 60);
                const mins = absMinutes % 60;
                
                if (options.precise && mins > 0) {
                    return `${prefix}${hours}h ${mins}m${suffix}`;
                } else {
                    return `${prefix}${hours}h${suffix}`;
                }
            } else if (absMinutes < this.relativeTimeThresholds.days) {
                const days = Math.floor(absMinutes / 1440);
                const hours = Math.floor((absMinutes % 1440) / 60);
                
                if (options.precise && hours > 0) {
                    return `${prefix}${days}d ${hours}h${suffix}`;
                } else {
                    return `${prefix}${days}d${suffix}`;
                }
            } else {
                // More than a week - show date instead
                return options.fallback || 'over a week';
            }
        },
        
        /**
         * Get time of day category
         */
        getTimeOfDay: function(hours) {
            if (hours >= this.timeOfDayRanges.earlyMorning.start && hours < this.timeOfDayRanges.earlyMorning.end) {
                return 'earlyMorning';
            } else if (hours >= this.timeOfDayRanges.morning.start && hours < this.timeOfDayRanges.morning.end) {
                return 'morning';
            } else if (hours >= this.timeOfDayRanges.afternoon.start && hours < this.timeOfDayRanges.afternoon.end) {
                return 'afternoon';
            } else if (hours >= this.timeOfDayRanges.evening.start && hours < this.timeOfDayRanges.evening.end) {
                return 'evening';
            } else {
                return 'night';
            }
        },
        
        /**
         * Get time of day label
         */
        getTimeOfDayLabel: function(hours) {
            const timeOfDay = this.getTimeOfDay(hours);
            
            const labels = {
                earlyMorning: 'Early Morning',
                morning: 'Morning',
                afternoon: 'Afternoon',
                evening: 'Evening',
                night: 'Night'
            };
            
            return labels[timeOfDay];
        },
        
        /**
         * Get appropriate icon for time
         */
        getTimeIcon: function(time) {
            if (!this.isValidTime(time)) {
                return '🕐';
            }
            
            const hours = parseInt(time.split(':')[0], 10);
            const timeOfDay = this.getTimeOfDay(hours);
            
            return this.timeIcons[timeOfDay];
        },
        
        /**
         * Format duration between two times
         */
        formatDuration: function(startTime, endTime, options = {}) {
            if (!this.isValidTime(startTime) || !this.isValidTime(endTime)) {
                return '';
            }
            
            const start = this.timeToMinutes(startTime);
            const end = this.timeToMinutes(endTime);
            
            // Handle overnight duration
            let duration = end >= start ? end - start : (1440 - start) + end;
            
            return this.formatDurationMinutes(duration, options);
        },
        
        /**
         * Format duration in minutes
         */
        formatDurationMinutes: function(minutes, options = {}) {
            if (minutes < 60) {
                return `${minutes} min`;
            } else {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                
                if (options.precise && mins > 0) {
                    return `${hours}h ${mins}m`;
                } else {
                    return `${hours}h`;
                }
            }
        },
        
        /**
         * Get time-based CSS class
         */
        getTimeClass: function(time) {
            if (!this.isValidTime(time)) {
                return 'time-unknown';
            }
            
            const hours = parseInt(time.split(':')[0], 10);
            const timeOfDay = this.getTimeOfDay(hours);
            
            return `time-${timeOfDay.toLowerCase().replace(/([A-Z])/g, '-$1')}`;
        },
        
        /**
         * Get time-based color
         */
        getTimeColor: function(time) {
            if (!this.isValidTime(time)) {
                return '#6b7280'; // Gray
            }
            
            const hours = parseInt(time.split(':')[0], 10);
            const timeOfDay = this.getTimeOfDay(hours);
            
            const colors = {
                earlyMorning: '#f59e0b', // Amber
                morning: '#eab308',      // Yellow
                afternoon: '#f97316',    // Orange
                evening: '#dc2626',      // Red
                night: '#4338ca'         // Indigo
            };
            
            return colors[timeOfDay];
        },
        
        /**
         * Check if it's currently a specific time of day
         */
        isCurrentTimeOfDay: function(timeOfDay) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentTimeOfDay = this.getTimeOfDay(currentHour);
            
            return currentTimeOfDay === timeOfDay;
        },
        
        /**
         * Get next occurrence of a time today or tomorrow
         */
        getNextOccurrence: function(time) {
            if (!this.isValidTime(time)) {
                return null;
            }
            
            const now = new Date();
            const targetTime = this.parseTimeToday(time);
            
            // If the time has passed today, get tomorrow's occurrence
            if (targetTime <= now) {
                targetTime.setDate(targetTime.getDate() + 1);
            }
            
            return targetTime;
        },
        
        /**
         * Format time range
         */
        formatTimeRange: function(startTime, endTime, format = '12h', options = {}) {
            if (!this.isValidTime(startTime) || !this.isValidTime(endTime)) {
                return '';
            }
            
            const formattedStart = this.formatForDisplay(startTime, format, options);
            const formattedEnd = this.formatForDisplay(endTime, format, options);
            
            const separator = options.separator || ' - ';
            
            return `${formattedStart}${separator}${formattedEnd}`;
        },
        
        /**
         * Get busy time indicator
         */
        getBusyIndicator: function(times, currentTime = null) {
            if (!Array.isArray(times) || times.length === 0) {
                return { level: 'free', label: 'Free', color: '#10b981' };
            }
            
            const validTimes = times.filter(time => this.isValidTime(time));
            
            if (validTimes.length === 0) {
                return { level: 'free', label: 'Free', color: '#10b981' };
            } else if (validTimes.length <= 2) {
                return { level: 'light', label: 'Light', color: '#f59e0b' };
            } else if (validTimes.length <= 4) {
                return { level: 'moderate', label: 'Moderate', color: '#f97316' };
            } else {
                return { level: 'busy', label: 'Busy', color: '#dc2626' };
            }
        },
        
        /**
         * Format time with context
         */
        formatWithContext: function(time, context = {}) {
            if (!this.isValidTime(time)) {
                return '';
            }
            
            const format = context.format || '12h';
            const options = {
                showIcon: context.showIcon || false,
                compact: context.compact || false,
                showPeriod: context.showPeriod || false
            };
            
            let formatted = this.formatForDisplay(time, format, options);
            
            // Add relative time if requested
            if (context.showRelative) {
                const relative = this.getRelativeTime(time, { precise: context.preciseRelative });
                if (relative && relative !== 'now') {
                    formatted += ` (${relative})`;
                }
            }
            
            // Add time of day label if requested
            if (context.showTimeOfDay) {
                const hours = parseInt(time.split(':')[0], 10);
                const label = this.getTimeOfDayLabel(hours);
                formatted += ` • ${label}`;
            }
            
            return formatted;
        },
        
        /**
         * Parse time string to today's date
         */
        parseTimeToday: function(time) {
            const [hours, minutes] = time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        },
        
        /**
         * Convert time to minutes since midnight
         */
        timeToMinutes: function(time) {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        },
        
        /**
         * Convert minutes since midnight to time string
         */
        minutesToTime: function(minutes) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        },
        
        /**
         * Validate time format
         */
        isValidTime: function(time) {
            if (!time || typeof time !== 'string') {
                return false;
            }
            
            const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            return timePattern.test(time);
        },
        
        /**
         * Sort times chronologically
         */
        sortTimes: function(times) {
            return times
                .filter(time => this.isValidTime(time))
                .sort((a, b) => {
                    const minutesA = this.timeToMinutes(a);
                    const minutesB = this.timeToMinutes(b);
                    return minutesA - minutesB;
                });
        },
        
        /**
         * Get time slots for a given period
         */
        getTimeSlots: function(startTime, endTime, intervalMinutes = 30) {
            if (!this.isValidTime(startTime) || !this.isValidTime(endTime)) {
                return [];
            }
            
            const start = this.timeToMinutes(startTime);
            const end = this.timeToMinutes(endTime);
            const slots = [];
            
            for (let minutes = start; minutes < end; minutes += intervalMinutes) {
                slots.push(this.minutesToTime(minutes));
            }
            
            return slots;
        },
        
        /**
         * Find closest time slot
         */
        findClosestTimeSlot: function(time, availableSlots) {
            if (!this.isValidTime(time) || !Array.isArray(availableSlots)) {
                return null;
            }
            
            const targetMinutes = this.timeToMinutes(time);
            let closestSlot = null;
            let minDifference = Infinity;
            
            availableSlots.forEach(slot => {
                if (this.isValidTime(slot)) {
                    const slotMinutes = this.timeToMinutes(slot);
                    const difference = Math.abs(targetMinutes - slotMinutes);
                    
                    if (difference < minDifference) {
                        minDifference = difference;
                        closestSlot = slot;
                    }
                }
            });
            
            return closestSlot;
        },
        
        /**
         * Generate time picker suggestions
         */
        getPickerSuggestions: function(currentTime = null) {
            const now = new Date();
            const currentHour = now.getHours();
            const suggestions = [];
            
            // Round current time to next 15-minute interval
            if (currentTime) {
                const [hours, minutes] = currentTime.split(':').map(Number);
                const roundedMinutes = Math.ceil(minutes / 15) * 15;
                const adjustedHours = roundedMinutes >= 60 ? hours + 1 : hours;
                const finalMinutes = roundedMinutes >= 60 ? 0 : roundedMinutes;
                
                if (adjustedHours < 24) {
                    suggestions.push({
                        time: `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`,
                        label: 'Current time (rounded)'
                    });
                }
            }
            
            // Add common time slots based on current time
            const commonTimes = [
                { time: '09:00', label: 'Morning start' },
                { time: '12:00', label: 'Lunch time' },
                { time: '14:00', label: 'Afternoon' },
                { time: '17:00', label: 'End of day' },
                { time: '19:00', label: 'Evening' }
            ];
            
            commonTimes.forEach(({ time, label }) => {
                const [hours] = time.split(':').map(Number);
                if (hours > currentHour) {
                    suggestions.push({ time, label });
                }
            });
            
            return suggestions.slice(0, 5); // Limit to 5 suggestions
        }
    };
    
    // Export to global scope
    window.TimeFormatter = TimeFormatter;
    
})();