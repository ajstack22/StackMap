/**
 * Edit Mode Search Integration
 * Adds search and filter capabilities to edit mode
 */

(function() {
    'use strict';
    
    // State
    const state = {
        searchFilter: null,
        filterManager: null,
        searchUI: null,
        filterUI: null,
        isInitialized: false,
        currentSearchQuery: '',
        filteredActivities: [],
        allActivities: []
    };
    
    /**
     * Initialize edit mode search
     */
    function init() {
        if (state.isInitialized) return;
        
        // Create instances
        state.searchFilter = new SearchFilter();
        state.filterManager = new FilterManager();
        state.searchUI = new SearchUI();
        state.filterUI = new FilterUI();
        
        // Listen for edit mode changes
        if (window.EditMode) {
            window.EditMode.on('change', handleEditModeChange);
        }
        
        // Listen for search and filter events
        setupEventListeners();
        
        state.isInitialized = true;
    }
    
    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Search events
        document.addEventListener('searchInput', handleSearchInput);
        document.addEventListener('searchCleared', handleSearchCleared);
        document.addEventListener('requestSuggestions', handleSuggestionRequest);
        
        // Filter events
        document.addEventListener('setFilter', handleSetFilter);
        document.addEventListener('clearAllFilters', handleClearAllFilters);
        document.addEventListener('filterChanged', handleFilterChanged);
        document.addEventListener('filtersCleared', handleFiltersCleared);
        
        // Activity updates
        document.addEventListener('activitiesLoaded', handleActivitiesLoaded);
        document.addEventListener('activityUpdated', handleActivityUpdated);
        document.addEventListener('activityDeleted', handleActivityDeleted);
    }
    
    /**
     * Handle edit mode state changes
     */
    function handleEditModeChange(isActive) {
        if (isActive) {
            showSearchAndFilters();
        } else {
            hideSearchAndFilters();
        }
    }
    
    /**
     * Show search and filter UI in edit mode
     */
    function showSearchAndFilters() {
        const editHeader = getOrCreateEditModeHeader();
        if (!editHeader) return;
        
        // Create search container
        const searchContainer = document.createElement('div');
        searchContainer.className = 'edit-mode-search-container';
        searchContainer.innerHTML = state.searchUI.render();
        
        // Create filter container
        const filterContainer = document.createElement('div');
        filterContainer.className = 'edit-mode-filter-container';
        filterContainer.innerHTML = state.filterUI.renderFilterChips();
        
        // Add to header
        editHeader.appendChild(searchContainer);
        editHeader.appendChild(filterContainer);
        
        // Initialize UI components
        state.searchUI.initialize(searchContainer);
        state.filterUI.initialize(filterContainer);
        
        // Load all activities for searching
        loadAllActivities();
        
        // Add bulk actions UI
        addBulkActionsUI(editHeader);
    }
    
    /**
     * Hide search and filter UI
     */
    function hideSearchAndFilters() {
        const searchContainer = document.querySelector('.edit-mode-search-container');
        const filterContainer = document.querySelector('.edit-mode-filter-container');
        const bulkActions = document.querySelector('.edit-mode-bulk-actions');
        
        if (searchContainer) searchContainer.remove();
        if (filterContainer) filterContainer.remove();
        if (bulkActions) bulkActions.remove();
        
        // Clear search and filters
        state.currentSearchQuery = '';
        state.filterManager.clearAllFilters();
        state.filteredActivities = [];
        
        // Restore normal activity display
        if (window.ActivityDisplay && window.ActivityDisplay.render) {
            window.ActivityDisplay.render();
        }
    }
    
    /**
     * Get or create edit mode header
     */
    function getOrCreateEditModeHeader() {
        let header = document.querySelector('.edit-mode-header');
        
        if (!header) {
            const banner = document.getElementById('edit-mode-banner');
            if (!banner) return null;
            
            header = document.createElement('div');
            header.className = 'edit-mode-header';
            
            // Insert after banner
            banner.parentNode.insertBefore(header, banner.nextSibling);
        }
        
        return header;
    }
    
    /**
     * Add bulk actions UI
     */
    function addBulkActionsUI(container) {
        const bulkActions = document.createElement('div');
        bulkActions.className = 'edit-mode-bulk-actions';
        bulkActions.style.display = 'none'; // Hidden by default
        
        bulkActions.innerHTML = `
            <button class="bulk-action-button" data-action="select-all">
                Select All <span class="bulk-count"></span>
            </button>
            <button class="bulk-action-button" data-action="deselect-all">
                Deselect All
            </button>
            <button class="bulk-action-button bulk-action-primary" data-action="pin-selected">
                Pin Selected
            </button>
            <button class="bulk-action-button bulk-action-danger" data-action="delete-selected">
                Delete Selected
            </button>
        `;
        
        container.appendChild(bulkActions);
        
        // Attach event listeners
        bulkActions.addEventListener('click', handleBulkAction);
    }
    
    /**
     * Load all activities for searching
     */
    function loadAllActivities() {
        // Get activities from storage or display
        if (window.ActivityStorage) {
            window.ActivityStorage.getAllActivities().then(activities => {
                state.allActivities = activities || [];
                indexAllActivities();
                updateFilterCounts();
            });
        }
    }
    
    /**
     * Index all activities for searching
     */
    function indexAllActivities() {
        state.searchFilter.clearIndex();
        
        state.allActivities.forEach(activity => {
            state.searchFilter.indexActivity(activity);
        });
    }
    
    /**
     * Update filter counts based on current activities
     */
    function updateFilterCounts() {
        const activities = state.filteredActivities.length > 0 
            ? state.filteredActivities 
            : state.allActivities;
            
        const counts = state.filterManager.getFilterCounts(activities);
        state.filterUI.updateFilterCounts(counts);
    }
    
    /**
     * Handle search input
     */
    function handleSearchInput(event) {
        const query = event.detail.query;
        state.currentSearchQuery = query;
        
        if (query.trim().length === 0) {
            // Clear search, but keep filters
            applySearchAndFilters();
            return;
        }
        
        // Perform search
        state.searchFilter.search(query).then(results => {
            const matchedIds = new Set(results.map(r => r.activityId));
            
            // Filter activities based on search results
            const searchFiltered = state.allActivities.filter(activity => 
                matchedIds.has(activity.id)
            );
            
            // Apply filters to search results
            state.filteredActivities = state.filterManager.applyFilters(searchFiltered);
            
            // Update display
            updateActivityDisplay();
            updateBulkActionsVisibility();
        });
    }
    
    /**
     * Handle search cleared
     */
    function handleSearchCleared() {
        state.currentSearchQuery = '';
        applySearchAndFilters();
    }
    
    /**
     * Handle suggestion request
     */
    function handleSuggestionRequest(event) {
        const query = event.detail.query;
        
        // Get suggestions from search filter
        const suggestions = state.searchFilter.getSuggestions(query);
        
        // Add smart suggestions
        const smartSuggestions = getSmartSuggestions(query);
        
        // Combine and format suggestions
        const formattedSuggestions = [
            ...smartSuggestions,
            ...suggestions.map(text => ({
                text: text,
                type: 'activity',
                query: query
            }))
        ].slice(0, 5);
        
        state.searchUI.displaySuggestions(formattedSuggestions);
    }
    
    /**
     * Get smart suggestions based on query
     */
    function getSmartSuggestions(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();
        
        // Time-based suggestions
        if (lowerQuery.includes('morn')) {
            suggestions.push({
                text: 'morning activities',
                type: 'filter',
                icon: '🌅',
                query: query
            });
        }
        
        if (lowerQuery.includes('after')) {
            suggestions.push({
                text: 'afternoon activities',
                type: 'filter',
                icon: '☀️',
                query: query
            });
        }
        
        // Status suggestions
        if (lowerQuery.includes('comp') || lowerQuery.includes('done')) {
            suggestions.push({
                text: 'completed activities',
                type: 'filter',
                icon: '✅',
                query: query
            });
        }
        
        // Type suggestions
        if (lowerQuery.includes('temp')) {
            suggestions.push({
                text: 'template activities',
                type: 'filter',
                icon: '📋',
                query: query
            });
        }
        
        return suggestions;
    }
    
    /**
     * Handle filter set
     */
    function handleSetFilter(event) {
        const { filterType, value } = event.detail;
        state.filterManager.setFilter(filterType, value);
    }
    
    /**
     * Handle clear all filters
     */
    function handleClearAllFilters() {
        state.filterManager.clearAllFilters();
    }
    
    /**
     * Handle filter changed
     */
    function handleFilterChanged() {
        applySearchAndFilters();
    }
    
    /**
     * Handle filters cleared
     */
    function handleFiltersCleared() {
        applySearchAndFilters();
    }
    
    /**
     * Apply both search and filters
     */
    function applySearchAndFilters() {
        let activities = state.allActivities;
        
        // Apply search first if there's a query
        if (state.currentSearchQuery.trim().length > 0) {
            state.searchFilter.search(state.currentSearchQuery).then(results => {
                const matchedIds = new Set(results.map(r => r.activityId));
                activities = activities.filter(activity => matchedIds.has(activity.id));
                
                // Then apply filters
                state.filteredActivities = state.filterManager.applyFilters(activities);
                updateActivityDisplay();
                updateBulkActionsVisibility();
            });
        } else {
            // Just apply filters
            state.filteredActivities = state.filterManager.applyFilters(activities);
            updateActivityDisplay();
            updateBulkActionsVisibility();
        }
        
        updateFilterCounts();
    }
    
    /**
     * Update activity display with filtered results
     */
    function updateActivityDisplay() {
        if (!window.ActivityDisplay) return;
        
        // Show filtered activities or all if no filters
        const activitiesToShow = state.filteredActivities.length > 0 || 
                               state.currentSearchQuery || 
                               state.filterManager.hasActiveFilters()
            ? state.filteredActivities 
            : state.allActivities;
        
        // Update display with filtered activities
        window.ActivityDisplay.renderFiltered(activitiesToShow);
        
        // Update result count
        updateResultCount(activitiesToShow.length);
    }
    
    /**
     * Update result count display
     */
    function updateResultCount(count) {
        let countDisplay = document.querySelector('.search-result-count');
        
        if (!countDisplay) {
            const header = document.querySelector('.edit-mode-header');
            if (!header) return;
            
            countDisplay = document.createElement('div');
            countDisplay.className = 'search-result-count';
            header.appendChild(countDisplay);
        }
        
        if (state.currentSearchQuery || state.filterManager.hasActiveFilters()) {
            countDisplay.textContent = `${count} ${count === 1 ? 'activity' : 'activities'} found`;
            countDisplay.style.display = 'block';
        } else {
            countDisplay.style.display = 'none';
        }
    }
    
    /**
     * Update bulk actions visibility
     */
    function updateBulkActionsVisibility() {
        const bulkActions = document.querySelector('.edit-mode-bulk-actions');
        if (!bulkActions) return;
        
        const hasResults = state.filteredActivities.length > 0 || 
                          (!state.currentSearchQuery && !state.filterManager.hasActiveFilters() && state.allActivities.length > 0);
        
        bulkActions.style.display = hasResults ? 'flex' : 'none';
        
        // Update count in select all button
        const selectAllBtn = bulkActions.querySelector('[data-action="select-all"] .bulk-count');
        if (selectAllBtn) {
            const count = state.filteredActivities.length || state.allActivities.length;
            selectAllBtn.textContent = `(${count})`;
        }
    }
    
    /**
     * Handle bulk action clicks
     */
    function handleBulkAction(event) {
        const button = event.target.closest('.bulk-action-button');
        if (!button) return;
        
        const action = button.dataset.action;
        const activities = state.filteredActivities.length > 0 
            ? state.filteredActivities 
            : state.allActivities;
        
        switch (action) {
            case 'select-all':
                selectAllActivities(activities);
                break;
            case 'deselect-all':
                deselectAllActivities();
                break;
            case 'pin-selected':
                pinSelectedActivities();
                break;
            case 'delete-selected':
                deleteSelectedActivities();
                break;
        }
    }
    
    /**
     * Select all visible activities
     */
    function selectAllActivities(activities) {
        if (!window.EditMode || !window.EditMode.getSelectionManager) return;
        
        const selectionManager = window.EditMode.getSelectionManager();
        if (!selectionManager) {
            window.EditMode.enableBulkOperations();
            selectionManager = window.EditMode.getSelectionManager();
        }
        
        if (selectionManager) {
            activities.forEach(activity => {
                const card = document.querySelector(`[data-activity-id="${activity.id}"]`);
                if (card) {
                    selectionManager.selectCard(card);
                }
            });
        }
    }
    
    /**
     * Deselect all activities
     */
    function deselectAllActivities() {
        if (!window.EditMode || !window.EditMode.getSelectionManager) return;
        
        const selectionManager = window.EditMode.getSelectionManager();
        if (selectionManager) {
            selectionManager.clearSelection();
        }
    }
    
    /**
     * Pin selected activities
     */
    function pinSelectedActivities() {
        if (!window.EditMode || !window.EditMode.getBulkOperationsManager) return;
        
        const bulkOps = window.EditMode.getBulkOperationsManager();
        if (bulkOps) {
            bulkOps.pinSelected();
        }
    }
    
    /**
     * Delete selected activities
     */
    function deleteSelectedActivities() {
        if (!window.EditMode || !window.EditMode.getBulkOperationsManager) return;
        
        const bulkOps = window.EditMode.getBulkOperationsManager();
        if (bulkOps) {
            if (confirm('Are you sure you want to delete the selected activities?')) {
                bulkOps.deleteSelected();
            }
        }
    }
    
    /**
     * Handle activities loaded
     */
    function handleActivitiesLoaded(event) {
        if (event.detail && event.detail.activities) {
            state.allActivities = event.detail.activities;
            indexAllActivities();
            
            if (window.EditMode && window.EditMode.isActive()) {
                applySearchAndFilters();
            }
        }
    }
    
    /**
     * Handle activity updated
     */
    function handleActivityUpdated(event) {
        if (!event.detail || !event.detail.activity) return;
        
        const activity = event.detail.activity;
        
        // Update in all activities array
        const index = state.allActivities.findIndex(a => a.id === activity.id);
        if (index >= 0) {
            state.allActivities[index] = activity;
        } else {
            state.allActivities.push(activity);
        }
        
        // Re-index the activity
        state.searchFilter.indexActivity(activity);
        
        // Re-apply search and filters
        if (window.EditMode && window.EditMode.isActive()) {
            applySearchAndFilters();
        }
    }
    
    /**
     * Handle activity deleted
     */
    function handleActivityDeleted(event) {
        if (!event.detail || !event.detail.activityId) return;
        
        const activityId = event.detail.activityId;
        
        // Remove from all activities
        state.allActivities = state.allActivities.filter(a => a.id !== activityId);
        
        // Remove from search index
        state.searchFilter.removeFromIndex(activityId);
        
        // Re-apply search and filters
        if (window.EditMode && window.EditMode.isActive()) {
            applySearchAndFilters();
        }
    }
    
    /**
     * Destroy and clean up
     */
    function destroy() {
        // Remove event listeners
        if (window.EditMode) {
            window.EditMode.off('change', handleEditModeChange);
        }
        
        document.removeEventListener('searchInput', handleSearchInput);
        document.removeEventListener('searchCleared', handleSearchCleared);
        document.removeEventListener('requestSuggestions', handleSuggestionRequest);
        document.removeEventListener('setFilter', handleSetFilter);
        document.removeEventListener('clearAllFilters', handleClearAllFilters);
        document.removeEventListener('filterChanged', handleFilterChanged);
        document.removeEventListener('filtersCleared', handleFiltersCleared);
        document.removeEventListener('activitiesLoaded', handleActivitiesLoaded);
        document.removeEventListener('activityUpdated', handleActivityUpdated);
        document.removeEventListener('activityDeleted', handleActivityDeleted);
        
        // Clean up UI
        hideSearchAndFilters();
        
        // Reset state
        state.isInitialized = false;
        state.searchFilter = null;
        state.filterManager = null;
        state.searchUI = null;
        state.filterUI = null;
        state.currentSearchQuery = '';
        state.filteredActivities = [];
        state.allActivities = [];
    }
    
    // Public API
    window.EditModeSearch = {
        init: init,
        destroy: destroy
    };
    
    // Auto-initialize when edit mode is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }
    
})();