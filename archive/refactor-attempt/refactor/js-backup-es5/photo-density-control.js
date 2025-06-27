/**
 * Photo Density Control - ADHD-Optimized Visual Management
 * Implements progressive disclosure and density settings
 */

(function(exports) {
    'use strict';
    
    var DensityControl = {
        // Configuration
        config: {
            INITIAL_VISIBLE: 3,      // Show 3 photos initially
            MAX_VISIBLE: 6,          // Maximum 6 photos (3x2 grid)
            DENSITY_MODES: {
                compact: {
                    thumbnailSize: 48,
                    spacing: 8,
                    label: 'Compact'
                },
                normal: {
                    thumbnailSize: 64,
                    spacing: 16,
                    label: 'Normal'
                },
                comfortable: {
                    thumbnailSize: 96,
                    spacing: 24,
                    label: 'Comfortable'
                }
            }
        },
        
        // Current settings
        currentMode: 'normal',
        showAll: false,
        progressiveEnabled: true,
        
        // Initialize
        init: function() {
            // Load saved preferences
            this.loadPreferences();
            
            // Apply initial settings
            this.applyDensityMode();
        },
        
        // Create progressive disclosure UI
        createProgressiveUI: function(container, photos, grid) {
            var self = this;
            
            // Only apply progressive disclosure if enabled and more than 3 photos
            if (!this.progressiveEnabled || photos.length <= this.config.INITIAL_VISIBLE) {
                return null;
            }
            
            // Create container for progressive controls
            var progressiveContainer = document.createElement('div');
            progressiveContainer.className = 'photo-progressive-controls';
            
            // Show count of hidden photos
            var hiddenCount = photos.length - this.config.INITIAL_VISIBLE;
            
            // Create expand button
            var expandBtn = document.createElement('button');
            expandBtn.className = 'photo-expand-button';
            expandBtn.setAttribute('aria-label', 'Show ' + hiddenCount + ' more photos');
            expandBtn.innerHTML = '<span class="expand-icon">▼</span> Show ' + hiddenCount + ' more';
            
            // Add tap handler
            if (window.PhotoTouchHandler) {
                window.PhotoTouchHandler.addTapHandler(expandBtn, function() {
                    self.toggleExpanded(container, photos, grid);
                });
            } else {
                expandBtn.addEventListener('click', function() {
                    self.toggleExpanded(container, photos, grid);
                });
            }
            
            progressiveContainer.appendChild(expandBtn);
            
            // Add visual hint about hidden photos
            var hint = document.createElement('div');
            hint.className = 'photo-progressive-hint';
            hint.textContent = 'Tap to view all photos at once';
            progressiveContainer.appendChild(hint);
            
            return progressiveContainer;
        },
        
        // Toggle expanded state
        toggleExpanded: function(container, photos, grid) {
            this.showAll = !this.showAll;
            
            // Update grid display
            var maxPhotos = this.showAll ? this.config.MAX_VISIBLE : this.config.INITIAL_VISIBLE;
            if (grid && grid.createGrid) {
                grid.createGrid(photos, maxPhotos);
            }
            
            // Update button
            var expandBtn = container.querySelector('.photo-expand-button');
            if (expandBtn) {
                if (this.showAll) {
                    expandBtn.innerHTML = '<span class="expand-icon">▲</span> Show fewer';
                    expandBtn.setAttribute('aria-label', 'Show fewer photos');
                } else {
                    var hiddenCount = photos.length - this.config.INITIAL_VISIBLE;
                    expandBtn.innerHTML = '<span class="expand-icon">▼</span> Show ' + hiddenCount + ' more';
                    expandBtn.setAttribute('aria-label', 'Show ' + hiddenCount + ' more photos');
                }
            }
            
            // Trigger layout update
            this.triggerLayoutUpdate();
        },
        
        // Create density selector
        createDensitySelector: function() {
            var self = this;
            var selector = document.createElement('div');
            selector.className = 'photo-density-selector';
            
            // Label
            var label = document.createElement('label');
            label.textContent = 'Photo size:';
            label.className = 'density-label';
            selector.appendChild(label);
            
            // Options
            Object.keys(this.config.DENSITY_MODES).forEach(function(mode) {
                var option = document.createElement('button');
                option.className = 'density-option';
                option.setAttribute('data-mode', mode);
                option.textContent = self.config.DENSITY_MODES[mode].label;
                
                if (mode === self.currentMode) {
                    option.classList.add('active');
                }
                
                // Add handler
                if (window.PhotoTouchHandler) {
                    window.PhotoTouchHandler.addTapHandler(option, function() {
                        self.setDensityMode(mode);
                    });
                } else {
                    option.addEventListener('click', function() {
                        self.setDensityMode(mode);
                    });
                }
                
                selector.appendChild(option);
            });
            
            return selector;
        },
        
        // Set density mode
        setDensityMode: function(mode) {
            if (!this.config.DENSITY_MODES[mode]) return;
            
            this.currentMode = mode;
            this.applyDensityMode();
            this.savePreferences();
            
            // Update UI
            var options = document.querySelectorAll('.density-option');
            options.forEach(function(option) {
                if (option.getAttribute('data-mode') === mode) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
            
            // Trigger layout update
            this.triggerLayoutUpdate();
        },
        
        // Apply density mode to page
        applyDensityMode: function() {
            document.body.setAttribute('data-photo-density', this.currentMode);
            
            // Update CSS variables if supported
            if (CSS && CSS.supports && CSS.supports('--photo-size', '64px')) {
                var mode = this.config.DENSITY_MODES[this.currentMode];
                document.documentElement.style.setProperty('--photo-size', mode.thumbnailSize + 'px');
                document.documentElement.style.setProperty('--photo-spacing', mode.spacing + 'px');
            }
        },
        
        // Create alternative list view
        createListView: function(photos) {
            var listContainer = document.createElement('div');
            listContainer.className = 'photo-list-view';
            
            photos.forEach(function(photo, index) {
                var item = document.createElement('div');
                item.className = 'photo-list-item';
                
                // Thumbnail
                var thumb = document.createElement('img');
                thumb.className = 'photo-list-thumbnail';
                thumb.src = photo.thumbnailUrl || photo.localUri;
                thumb.alt = 'Photo ' + (index + 1);
                item.appendChild(thumb);
                
                // Details
                var details = document.createElement('div');
                details.className = 'photo-list-details';
                
                var caption = document.createElement('div');
                caption.className = 'photo-list-caption';
                caption.textContent = photo.caption || 'Photo ' + (index + 1);
                details.appendChild(caption);
                
                if (photo.category && window.PHOTO_CATEGORIES) {
                    var category = window.PHOTO_CATEGORIES[photo.category];
                    if (category) {
                        var badge = document.createElement('span');
                        badge.className = 'photo-category-badge';
                        badge.style.backgroundColor = category.color;
                        badge.textContent = category.label;
                        details.appendChild(badge);
                    }
                }
                
                item.appendChild(details);
                listContainer.appendChild(item);
            });
            
            return listContainer;
        },
        
        // Toggle between grid and list view
        toggleViewMode: function(container, photos, grid) {
            var isListView = container.classList.contains('photo-list-mode');
            
            if (isListView) {
                // Switch to grid view
                container.classList.remove('photo-list-mode');
                if (grid) {
                    grid.refresh(photos);
                }
            } else {
                // Switch to list view
                container.classList.add('photo-list-mode');
                var listView = this.createListView(photos);
                
                // Replace grid with list
                var gridElement = container.querySelector('.photo-grid');
                if (gridElement && gridElement.parentNode) {
                    gridElement.parentNode.replaceChild(listView, gridElement);
                }
            }
        },
        
        // Save preferences
        savePreferences: function() {
            var prefs = {
                densityMode: this.currentMode,
                progressiveEnabled: this.progressiveEnabled,
                showAll: this.showAll
            };
            
            try {
                localStorage.setItem('photoDensityPrefs', JSON.stringify(prefs));
            } catch (e) {
                console.warn('Failed to save density preferences:', e);
            }
        },
        
        // Load preferences
        loadPreferences: function() {
            try {
                var saved = localStorage.getItem('photoDensityPrefs');
                if (saved) {
                    var prefs = JSON.parse(saved);
                    this.currentMode = prefs.densityMode || 'normal';
                    this.progressiveEnabled = prefs.progressiveEnabled !== false;
                    this.showAll = prefs.showAll || false;
                }
            } catch (e) {
                console.warn('Failed to load density preferences:', e);
            }
        },
        
        // Trigger layout update event
        triggerLayoutUpdate: function() {
            // Dispatch custom event
            var event = document.createEvent('Event');
            event.initEvent('photolayoutupdate', true, true);
            document.dispatchEvent(event);
            
            // Also trigger resize for any listeners
            window.dispatchEvent(new Event('resize'));
        },
        
        // Get current visible limit
        getVisibleLimit: function() {
            return this.showAll ? this.config.MAX_VISIBLE : this.config.INITIAL_VISIBLE;
        },
        
        // Check if progressive disclosure should be shown
        shouldShowProgressive: function(photoCount) {
            return this.progressiveEnabled && 
                   photoCount > this.config.INITIAL_VISIBLE && 
                   !this.showAll;
        }
    };
    
    // Auto-initialize
    DensityControl.init();
    
    // Export
    exports.PhotoDensityControl = DensityControl;
    
})(window);