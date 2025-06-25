/**
 * Task Card Object Pool for StackMap
 * Reuses DOM elements to reduce memory allocation on low-end devices
 * ES5 compatible - no const/let, arrow functions
 */

(function() {
    'use strict';
    
    const ActivityCardPool = {
        // Pool configuration
        POOL_SIZE: 20,
        MIN_POOL_SIZE: 5,
        MAX_POOL_SIZE: 50,
        
        // Pool state
        pool: [],
        activeCards: new WeakMap(), // Track which cards are in use
        initialized: false,
        
        /**
         * Initialize the object pool
         */
        init: function() {
            const self = this;
            
            if (self.initialized) return;
            
            // Check if feature is enabled
            if (window.FeatureFlags && !window.FeatureFlags.isEnabled('activityCardPool')) {
                console.log('TaskCardPool: Feature disabled by flags');
                return;
            }
            
            // Pre-create initial pool
            self.expandPool(self.MIN_POOL_SIZE);
            
            // Monitor memory pressure
            if (window.MemoryMonitor) {
                window.MemoryMonitor.on('warning', function() {
                    self.shrinkPool();
                });
                
                window.MemoryMonitor.on('critical', function() {
                    self.emergencyShrink();
                });
            }
            
            self.initialized = true;
            console.log('TaskCardPool: Initialized with', self.pool.length, 'cards');
        },
        
        /**
         * Acquire a task card from the pool
         */
        acquire: function() {
            const self = this;
            
            // Initialize if needed
            if (!self.initialized) {
                self.init();
            }
            
            // Get card from pool or create new one
            let card = self.pool.pop();
            
            if (!card) {
                // Pool empty - create new card
                card = self.createCard();
                console.log('TaskCardPool: Created new card (pool was empty)');
            } else {
                // Reset card for reuse
                self.resetCard(card);
            }
            
            // Mark as active
            self.activeCards.set(card, true);
            
            // Expand pool if getting low
            if (self.pool.length < self.MIN_POOL_SIZE) {
                setTimeout(function() {
                    self.expandPool(self.MIN_POOL_SIZE - self.pool.length);
                }, 100);
            }
            
            return card;
        },
        
        /**
         * Release a task card back to the pool
         */
        release: function(card) {
            const self = this;
            
            if (!card || !self.activeCards.has(card)) {
                console.warn('TaskCardPool: Attempted to release invalid card');
                return;
            }
            
            // Clean up card
            self.cleanCard(card);
            
            // Remove from active tracking
            self.activeCards.delete(card);
            
            // Return to pool if not at max capacity
            if (self.pool.length < self.MAX_POOL_SIZE) {
                self.pool.push(card);
            } else {
                // Pool full - let garbage collector handle it
                card.remove();
            }
        },
        
        /**
         * Create a new task card element
         */
        createCard: function() {
            const card = document.createElement('div');
            card.className = 'task-card';
            card.setAttribute('data-pooled', 'true');
            
            // Create card structure
            const cardInner = document.createElement('div');
            cardInner.className = 'task-card-inner';
            
            // Header
            const header = document.createElement('div');
            header.className = 'task-card-header';
            
            // Checkbox container
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'task-checkbox-container';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-checkbox';
            checkbox.setAttribute('aria-label', 'Mark task as complete');
            
            checkboxContainer.appendChild(checkbox);
            header.appendChild(checkboxContainer);
            
            // Content
            const content = document.createElement('div');
            content.className = 'task-content';
            
            const title = document.createElement('h3');
            title.className = 'task-title';
            
            const description = document.createElement('p');
            description.className = 'task-description';
            
            content.appendChild(title);
            content.appendChild(description);
            
            // Footer
            const footer = document.createElement('div');
            footer.className = 'task-card-footer';
            
            const category = document.createElement('span');
            category.className = 'task-category';
            
            const priority = document.createElement('span');
            priority.className = 'task-priority';
            
            footer.appendChild(category);
            footer.appendChild(priority);
            
            // Assemble card
            cardInner.appendChild(header);
            cardInner.appendChild(content);
            cardInner.appendChild(footer);
            card.appendChild(cardInner);
            
            return card;
        },
        
        /**
         * Reset a card for reuse
         */
        resetCard: function(card) {
            const self = this;
            
            // Remove all event listeners (handled by cleanup system)
            if (card._cleanup) {
                card._cleanup();
                delete card._cleanup;
            }
            
            // Reset classes
            card.className = 'task-card';
            card.removeAttribute('data-task-id');
            card.removeAttribute('data-completed');
            card.removeAttribute('style');
            
            // Reset checkbox
            const checkbox = card.querySelector('.task-checkbox');
            if (checkbox) {
                checkbox.checked = false;
                checkbox.disabled = false;
            }
            
            // Clear content
            const title = card.querySelector('.task-title');
            if (title) title.textContent = '';
            
            const description = card.querySelector('.task-description');
            if (description) description.textContent = '';
            
            const category = card.querySelector('.task-category');
            if (category) {
                category.textContent = '';
                category.className = 'task-category';
            }
            
            const priority = card.querySelector('.task-priority');
            if (priority) {
                priority.textContent = '';
                priority.className = 'task-priority';
            }
            
            // Show the card
            card.style.display = '';
        },
        
        /**
         * Clean a card before returning to pool
         */
        cleanCard: function(card) {
            const self = this;
            
            // Call reset to clean the card
            self.resetCard(card);
            
            // Hide the card while in pool
            card.style.display = 'none';
        },
        
        /**
         * Expand the pool
         */
        expandPool: function(count) {
            const self = this;
            
            count = Math.min(count, self.MAX_POOL_SIZE - self.pool.length);
            
            for (let i = 0; i < count; i++) {
                const card = self.createCard();
                card.style.display = 'none';
                self.pool.push(card);
            }
            
            if (count > 0) {
                console.log('TaskCardPool: Expanded pool by', count, 'cards. Total:', self.pool.length);
            }
        },
        
        /**
         * Shrink the pool under memory pressure
         */
        shrinkPool: function() {
            const self = this;
            
            const targetSize = Math.max(self.MIN_POOL_SIZE, Math.floor(self.pool.length / 2));
            const toRemove = self.pool.length - targetSize;
            
            if (toRemove > 0) {
                for (let i = 0; i < toRemove; i++) {
                    const card = self.pool.pop();
                    if (card && card.parentNode) {
                        card.remove();
                    }
                }
                console.log('TaskCardPool: Shrunk pool by', toRemove, 'cards. Remaining:', self.pool.length);
            }
        },
        
        /**
         * Emergency shrink under critical memory
         */
        emergencyShrink: function() {
            const self = this;
            
            // Keep only minimum cards
            while (self.pool.length > self.MIN_POOL_SIZE) {
                const card = self.pool.pop();
                if (card && card.parentNode) {
                    card.remove();
                }
            }
            
            console.log('TaskCardPool: Emergency shrink to minimum size:', self.pool.length);
        },
        
        /**
         * Get pool statistics
         */
        getStats: function() {
            const self = this;
            
            return {
                poolSize: self.pool.length,
                maxSize: self.MAX_POOL_SIZE,
                minSize: self.MIN_POOL_SIZE,
                initialized: self.initialized
            };
        },
        
        /**
         * Destroy the pool
         */
        destroy: function() {
            const self = this;
            
            // Remove all pooled cards
            while (self.pool.length > 0) {
                const card = self.pool.pop();
                if (card && card.parentNode) {
                    card.remove();
                }
            }
            
            // Clear references
            self.activeCards = new WeakMap();
            self.initialized = false;
            
            console.log('TaskCardPool: Destroyed');
        }
    };
    
    // Expose to global scope
    window.ActivityCardPool = ActivityCardPool;
    
    // BACKWARD COMPATIBILITY - Keep old name working
    window.TaskCardPool = ActivityCardPool;
})();