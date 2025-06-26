class FilterManager {
    constructor() {
        this.activeFilters = {
            type: null,
            timeRange: null,
            status: null,
            pinned: null,
            tags: [],
            dateRange: null
        };
        
        // Filter state persistence
        this.loadFilterState();
        
        // Bitwise flags for performance
        this.filterFlags = {
            TYPE: 1 << 0,
            TIME_RANGE: 1 << 1,
            STATUS: 1 << 2,
            PINNED: 1 << 3,
            TAGS: 1 << 4,
            DATE_RANGE: 1 << 5
        };
        
        this.activeFlags = 0;
    }
    
    // Set a filter
    setFilter(filterType, value) {
        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
            this.clearFilter(filterType);
            return;
        }
        
        this.activeFilters[filterType] = value;
        this.activeFlags |= this.filterFlags[filterType.toUpperCase().replace(/([A-Z])/g, '_$1')];
        this.saveFilterState();
        
        // Dispatch filter change event
        document.dispatchEvent(new CustomEvent('filterChanged', {
            detail: { filterType, value, activeFilters: this.activeFilters }
        }));
    }
    
    // Clear a specific filter
    clearFilter(filterType) {
        this.activeFilters[filterType] = null;
        const flagName = filterType.toUpperCase().replace(/([A-Z])/g, '_$1');
        this.activeFlags &= ~this.filterFlags[flagName];
        this.saveFilterState();
        
        document.dispatchEvent(new CustomEvent('filterChanged', {
            detail: { filterType, value: null, activeFilters: this.activeFilters }
        }));
    }
    
    // Clear all filters
    clearAllFilters() {
        this.activeFilters = {
            type: null,
            timeRange: null,
            status: null,
            pinned: null,
            tags: [],
            dateRange: null
        };
        this.activeFlags = 0;
        this.saveFilterState();
        
        document.dispatchEvent(new CustomEvent('filtersCleared', {
            detail: { activeFilters: this.activeFilters }
        }));
    }
    
    // Apply filters to activities array
    applyFilters(activities) {
        if (this.activeFlags === 0) {
            return activities;
        }
        
        return activities.filter(activity => {
            // Type filter
            if ((this.activeFlags & this.filterFlags.TYPE) && 
                this.activeFilters.type !== null && 
                activity.type !== this.activeFilters.type) {
                return false;
            }
            
            // Time range filter
            if ((this.activeFlags & this.filterFlags.TIME_RANGE) && 
                this.activeFilters.timeRange !== null && 
                !this.matchesTimeRange(activity, this.activeFilters.timeRange)) {
                return false;
            }
            
            // Status filter
            if ((this.activeFlags & this.filterFlags.STATUS) && 
                this.activeFilters.status !== null) {
                const isCompleted = activity.completed || false;
                if ((this.activeFilters.status === 'completed' && !isCompleted) ||
                    (this.activeFilters.status === 'pending' && isCompleted)) {
                    return false;
                }
            }
            
            // Pinned filter
            if ((this.activeFlags & this.filterFlags.PINNED) && 
                this.activeFilters.pinned !== null) {
                const isPinned = activity.pinned || false;
                if (this.activeFilters.pinned !== isPinned) {
                    return false;
                }
            }
            
            // Tags filter
            if ((this.activeFlags & this.filterFlags.TAGS) && 
                this.activeFilters.tags.length > 0) {
                const activityTags = activity.tags || [];
                const hasMatchingTag = this.activeFilters.tags.some(tag => 
                    activityTags.includes(tag)
                );
                if (!hasMatchingTag) {
                    return false;
                }
            }
            
            // Date range filter
            if ((this.activeFlags & this.filterFlags.DATE_RANGE) && 
                this.activeFilters.dateRange !== null) {
                if (!this.matchesDateRange(activity, this.activeFilters.dateRange)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    // Check if activity matches time range
    matchesTimeRange(activity, timeRange) {
        const activityTime = activity.time || activity.plannedTime;
        if (!activityTime) return false;
        
        const hour = parseInt(activityTime.split(':')[0]);
        
        switch (timeRange) {
            case 'morning':
                return hour >= 5 && hour < 12;
            case 'afternoon':
                return hour >= 12 && hour < 17;
            case 'evening':
                return hour >= 17 && hour < 21;
            case 'night':
                return hour >= 21 || hour < 5;
            default:
                return true;
        }
    }
    
    // Check if activity matches date range
    matchesDateRange(activity, dateRange) {
        const activityDate = activity.date || activity.plannedDate;
        if (!activityDate) return false;
        
        const date = new Date(activityDate);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        return date >= startDate && date <= endDate;
    }
    
    // Get filter counts for UI display
    getFilterCounts(activities) {
        const counts = {
            type: {},
            timeRange: {},
            status: { completed: 0, pending: 0 },
            pinned: { true: 0, false: 0 },
            tags: {}
        };
        
        for (const activity of activities) {
            // Type counts
            const type = activity.type || 'default';
            counts.type[type] = (counts.type[type] || 0) + 1;
            
            // Time range counts
            const timeRange = this.getActivityTimeRange(activity);
            if (timeRange) {
                counts.timeRange[timeRange] = (counts.timeRange[timeRange] || 0) + 1;
            }
            
            // Status counts
            if (activity.completed) {
                counts.status.completed++;
            } else {
                counts.status.pending++;
            }
            
            // Pinned counts
            if (activity.pinned) {
                counts.pinned.true++;
            } else {
                counts.pinned.false++;
            }
            
            // Tag counts
            const tags = activity.tags || [];
            for (const tag of tags) {
                counts.tags[tag] = (counts.tags[tag] || 0) + 1;
            }
        }
        
        return counts;
    }
    
    // Determine activity time range
    getActivityTimeRange(activity) {
        const activityTime = activity.time || activity.plannedTime;
        if (!activityTime) return null;
        
        const hour = parseInt(activityTime.split(':')[0]);
        
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        if (hour >= 21 || hour < 5) return 'night';
        
        return null;
    }
    
    // Save filter state to localStorage
    saveFilterState() {
        try {
            localStorage.setItem('stackmap_filter_state', JSON.stringify({
                filters: this.activeFilters,
                flags: this.activeFlags
            }));
        } catch (e) {
            console.error('Failed to save filter state:', e);
        }
    }
    
    // Load filter state from localStorage
    loadFilterState() {
        try {
            const saved = localStorage.getItem('stackmap_filter_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.activeFilters = state.filters || this.activeFilters;
                this.activeFlags = state.flags || 0;
            }
        } catch (e) {
            console.error('Failed to load filter state:', e);
        }
    }
    
    // Get active filter summary
    getActiveFilterSummary() {
        const summary = [];
        
        if (this.activeFilters.type) {
            summary.push(`Type: ${this.activeFilters.type}`);
        }
        if (this.activeFilters.timeRange) {
            summary.push(`Time: ${this.activeFilters.timeRange}`);
        }
        if (this.activeFilters.status) {
            summary.push(`Status: ${this.activeFilters.status}`);
        }
        if (this.activeFilters.pinned !== null) {
            summary.push(`Pinned: ${this.activeFilters.pinned ? 'Yes' : 'No'}`);
        }
        if (this.activeFilters.tags.length > 0) {
            summary.push(`Tags: ${this.activeFilters.tags.join(', ')}`);
        }
        if (this.activeFilters.dateRange) {
            summary.push(`Date: ${this.activeFilters.dateRange.start} to ${this.activeFilters.dateRange.end}`);
        }
        
        return summary;
    }
    
    // Check if any filters are active
    hasActiveFilters() {
        return this.activeFlags !== 0;
    }
    
    // Export current filter state (for sharing/saving)
    exportFilterState() {
        return {
            filters: { ...this.activeFilters },
            timestamp: new Date().toISOString()
        };
    }
    
    // Import filter state
    importFilterState(state) {
        if (state && state.filters) {
            this.activeFilters = { ...state.filters };
            this.recalculateFlags();
            this.saveFilterState();
            
            document.dispatchEvent(new CustomEvent('filtersImported', {
                detail: { activeFilters: this.activeFilters }
            }));
        }
    }
    
    // Recalculate flags based on active filters
    recalculateFlags() {
        this.activeFlags = 0;
        
        if (this.activeFilters.type !== null) this.activeFlags |= this.filterFlags.TYPE;
        if (this.activeFilters.timeRange !== null) this.activeFlags |= this.filterFlags.TIME_RANGE;
        if (this.activeFilters.status !== null) this.activeFlags |= this.filterFlags.STATUS;
        if (this.activeFilters.pinned !== null) this.activeFlags |= this.filterFlags.PINNED;
        if (this.activeFilters.tags.length > 0) this.activeFlags |= this.filterFlags.TAGS;
        if (this.activeFilters.dateRange !== null) this.activeFlags |= this.filterFlags.DATE_RANGE;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterManager;
}