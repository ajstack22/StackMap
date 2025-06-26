class FilterUI {
    constructor() {
        this.filterContainer = null;
        this.filterChips = [];
        this.activeFilters = {};
        this.filterCounts = {};
        this.expandedFilters = new Set();
    }
    
    // Render filter chips UI
    renderFilterChips() {
        return `
            <div class="filter-chips-container" role="group" aria-label="Activity filters">
                <div class="filter-chips">
                    <button class="filter-chip" 
                            data-filter="type" 
                            aria-pressed="false"
                            aria-expanded="false">
                        <span class="chip-label">Type</span>
                        <span class="chip-count" aria-label="0 items"></span>
                        <svg class="chip-arrow" width="12" height="12" viewBox="0 0 12 12">
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </button>
                    
                    <button class="filter-chip" 
                            data-filter="time" 
                            aria-pressed="false"
                            aria-expanded="false">
                        <span class="chip-label">Time</span>
                        <span class="chip-count" aria-label="0 items"></span>
                        <svg class="chip-arrow" width="12" height="12" viewBox="0 0 12 12">
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </button>
                    
                    <button class="filter-chip" 
                            data-filter="status" 
                            aria-pressed="false"
                            aria-expanded="false">
                        <span class="chip-label">Status</span>
                        <span class="chip-count" aria-label="0 items"></span>
                        <svg class="chip-arrow" width="12" height="12" viewBox="0 0 12 12">
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </button>
                    
                    <button class="filter-chip" 
                            data-filter="pinned" 
                            aria-pressed="false"
                            aria-expanded="false">
                        <span class="chip-label">Pinned</span>
                        <span class="chip-count" aria-label="0 items"></span>
                        <svg class="chip-arrow" width="12" height="12" viewBox="0 0 12 12">
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="2" fill="none"/>
                        </svg>
                    </button>
                    
                    <button class="clear-filters" 
                            aria-label="Clear all filters"
                            style="display: none;">
                        Clear all
                    </button>
                </div>
                
                <div class="filter-dropdowns">
                    <!-- Dropdowns will be dynamically inserted here -->
                </div>
            </div>
        `;
    }
    
    // Initialize after rendering
    initialize(container) {
        this.filterContainer = container;
        this.attachEventListeners();
        this.updateFilterCounts({});
    }
    
    // Attach event listeners
    attachEventListeners() {
        // Filter chip clicks
        this.filterContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.filter-chip');
            if (chip) {
                this.toggleFilterDropdown(chip);
            }
            
            const clearBtn = e.target.closest('.clear-filters');
            if (clearBtn) {
                this.clearAllFilters();
            }
        });
        
        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            if (!this.filterContainer.contains(e.target)) {
                this.closeAllDropdowns();
            }
        });
        
        // Listen for filter changes
        document.addEventListener('filterChanged', (e) => {
            this.updateActiveFilters(e.detail.activeFilters);
        });
        
        document.addEventListener('filtersCleared', () => {
            this.updateActiveFilters({});
        });
    }
    
    // Toggle filter dropdown
    toggleFilterDropdown(chip) {
        const filterType = chip.dataset.filter;
        const isExpanded = chip.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            this.closeDropdown(filterType);
        } else {
            this.closeAllDropdowns();
            this.openDropdown(filterType, chip);
        }
    }
    
    // Open dropdown
    openDropdown(filterType, chip) {
        chip.setAttribute('aria-expanded', 'true');
        this.expandedFilters.add(filterType);
        
        const dropdown = this.createDropdown(filterType);
        const dropdownContainer = this.filterContainer.querySelector('.filter-dropdowns');
        dropdownContainer.innerHTML = dropdown;
        
        // Position dropdown below chip
        const dropdownEl = dropdownContainer.querySelector('.filter-dropdown');
        if (dropdownEl) {
            const chipRect = chip.getBoundingClientRect();
            const containerRect = this.filterContainer.getBoundingClientRect();
            dropdownEl.style.left = `${chipRect.left - containerRect.left}px`;
            
            // Attach dropdown event listeners
            this.attachDropdownListeners(dropdownEl, filterType);
        }
    }
    
    // Close dropdown
    closeDropdown(filterType) {
        const chip = this.filterContainer.querySelector(`[data-filter="${filterType}"]`);
        if (chip) {
            chip.setAttribute('aria-expanded', 'false');
        }
        this.expandedFilters.delete(filterType);
        
        const dropdownContainer = this.filterContainer.querySelector('.filter-dropdowns');
        dropdownContainer.innerHTML = '';
    }
    
    // Close all dropdowns
    closeAllDropdowns() {
        this.expandedFilters.forEach(filterType => {
            const chip = this.filterContainer.querySelector(`[data-filter="${filterType}"]`);
            if (chip) {
                chip.setAttribute('aria-expanded', 'false');
            }
        });
        this.expandedFilters.clear();
        
        const dropdownContainer = this.filterContainer.querySelector('.filter-dropdowns');
        dropdownContainer.innerHTML = '';
    }
    
    // Create dropdown content
    createDropdown(filterType) {
        let content = '';
        
        switch (filterType) {
            case 'type':
                content = this.createTypeDropdown();
                break;
            case 'time':
                content = this.createTimeDropdown();
                break;
            case 'status':
                content = this.createStatusDropdown();
                break;
            case 'pinned':
                content = this.createPinnedDropdown();
                break;
        }
        
        return `
            <div class="filter-dropdown" role="listbox" aria-label="${filterType} filter options">
                ${content}
            </div>
        `;
    }
    
    // Create type filter dropdown
    createTypeDropdown() {
        const types = ['recurring', 'template', 'one-time', 'milestone'];
        const currentType = this.activeFilters.type;
        
        return types.map(type => `
            <label class="filter-option ${currentType === type ? 'selected' : ''}">
                <input type="radio" 
                       name="type-filter" 
                       value="${type}"
                       ${currentType === type ? 'checked' : ''}>
                <span class="option-label">${this.capitalizeFirst(type)}</span>
                <span class="option-count">${this.filterCounts.type?.[type] || 0}</span>
            </label>
        `).join('');
    }
    
    // Create time filter dropdown
    createTimeDropdown() {
        const times = ['morning', 'afternoon', 'evening', 'night'];
        const currentTime = this.activeFilters.timeRange;
        
        return times.map(time => `
            <label class="filter-option ${currentTime === time ? 'selected' : ''}">
                <input type="radio" 
                       name="time-filter" 
                       value="${time}"
                       ${currentTime === time ? 'checked' : ''}>
                <span class="option-label">${this.capitalizeFirst(time)}</span>
                <span class="option-count">${this.filterCounts.timeRange?.[time] || 0}</span>
            </label>
        `).join('');
    }
    
    // Create status filter dropdown
    createStatusDropdown() {
        const currentStatus = this.activeFilters.status;
        
        return `
            <label class="filter-option ${currentStatus === 'completed' ? 'selected' : ''}">
                <input type="radio" 
                       name="status-filter" 
                       value="completed"
                       ${currentStatus === 'completed' ? 'checked' : ''}>
                <span class="option-label">Completed</span>
                <span class="option-count">${this.filterCounts.status?.completed || 0}</span>
            </label>
            <label class="filter-option ${currentStatus === 'pending' ? 'selected' : ''}">
                <input type="radio" 
                       name="status-filter" 
                       value="pending"
                       ${currentStatus === 'pending' ? 'checked' : ''}>
                <span class="option-label">Pending</span>
                <span class="option-count">${this.filterCounts.status?.pending || 0}</span>
            </label>
        `;
    }
    
    // Create pinned filter dropdown
    createPinnedDropdown() {
        const currentPinned = this.activeFilters.pinned;
        
        return `
            <label class="filter-option ${currentPinned === true ? 'selected' : ''}">
                <input type="radio" 
                       name="pinned-filter" 
                       value="true"
                       ${currentPinned === true ? 'checked' : ''}>
                <span class="option-label">Pinned</span>
                <span class="option-count">${this.filterCounts.pinned?.true || 0}</span>
            </label>
            <label class="filter-option ${currentPinned === false ? 'selected' : ''}">
                <input type="radio" 
                       name="pinned-filter" 
                       value="false"
                       ${currentPinned === false ? 'checked' : ''}>
                <span class="option-label">Not Pinned</span>
                <span class="option-count">${this.filterCounts.pinned?.false || 0}</span>
            </label>
        `;
    }
    
    // Attach dropdown event listeners
    attachDropdownListeners(dropdown, filterType) {
        dropdown.addEventListener('change', (e) => {
            const input = e.target;
            if (input.type === 'radio') {
                let value = input.value;
                
                // Convert string boolean to actual boolean
                if (filterType === 'pinned') {
                    value = value === 'true';
                }
                
                // Dispatch filter change event
                document.dispatchEvent(new CustomEvent('setFilter', {
                    detail: { filterType, value }
                }));
                
                // Close dropdown after selection
                setTimeout(() => {
                    this.closeDropdown(filterType);
                }, 150);
            }
        });
    }
    
    // Update filter counts
    updateFilterCounts(counts) {
        this.filterCounts = counts;
        
        // Update chip counts
        Object.keys(counts).forEach(filterType => {
            const chip = this.filterContainer.querySelector(`[data-filter="${filterType === 'timeRange' ? 'time' : filterType}"]`);
            if (chip) {
                const countEl = chip.querySelector('.chip-count');
                if (countEl) {
                    const total = this.getTotalCount(counts[filterType]);
                    countEl.textContent = total > 0 ? total : '';
                    countEl.setAttribute('aria-label', `${total} items`);
                }
            }
        });
    }
    
    // Get total count for a filter category
    getTotalCount(countObj) {
        if (!countObj || typeof countObj !== 'object') return 0;
        return Object.values(countObj).reduce((sum, count) => sum + count, 0);
    }
    
    // Update active filters display
    updateActiveFilters(filters) {
        this.activeFilters = filters;
        
        // Update chip active states
        const hasActiveFilters = Object.values(filters).some(v => 
            v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
        );
        
        // Show/hide clear button
        const clearBtn = this.filterContainer.querySelector('.clear-filters');
        if (clearBtn) {
            clearBtn.style.display = hasActiveFilters ? 'block' : 'none';
        }
        
        // Update chip pressed states
        this.filterContainer.querySelectorAll('.filter-chip').forEach(chip => {
            const filterType = chip.dataset.filter;
            let isActive = false;
            
            switch (filterType) {
                case 'type':
                    isActive = filters.type !== null && filters.type !== undefined;
                    break;
                case 'time':
                    isActive = filters.timeRange !== null && filters.timeRange !== undefined;
                    break;
                case 'status':
                    isActive = filters.status !== null && filters.status !== undefined;
                    break;
                case 'pinned':
                    isActive = filters.pinned !== null && filters.pinned !== undefined;
                    break;
            }
            
            chip.setAttribute('aria-pressed', isActive);
            chip.classList.toggle('active', isActive);
        });
    }
    
    // Clear all filters
    clearAllFilters() {
        document.dispatchEvent(new CustomEvent('clearAllFilters'));
        this.closeAllDropdowns();
    }
    
    // Capitalize first letter
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
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
        if (this.activeFilters.pinned !== null && this.activeFilters.pinned !== undefined) {
            summary.push(`Pinned: ${this.activeFilters.pinned ? 'Yes' : 'No'}`);
        }
        
        return summary;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterUI;
}